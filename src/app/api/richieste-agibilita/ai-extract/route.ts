// src/app/api/richieste-agibilita/ai-extract/route.ts
// API per estrazione dati richiesta agibilità con AI

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const client = new Anthropic()

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ExtractedData {
  dataEvento?: string
  dataFine?: string
  locale?: {
    id?: string
    nome: string
    citta?: string
    indirizzo?: string
    isNuovo?: boolean
  }
  artisti?: Array<{
    id?: string
    nomeDarte: string
    nome?: string
    cognome?: string
    compensoNetto?: number
    qualifica?: string
    isNuovo?: boolean
  }>
  note?: string
  isComplete?: boolean
  missingFields?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    // Verifica che la chiave API sia configurata
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY non configurata')
      return NextResponse.json({
        error: 'Configurazione mancante',
        response: 'Il servizio AI non è configurato correttamente. Contatta l\'amministratore.',
        extractedData: null
      }, { status: 500 })
    }
    
    const body = await request.json()
    const { message, currentData, conversationHistory } = body
    
    if (!message) {
      return NextResponse.json({
        error: 'Messaggio mancante',
        response: 'Per favore scrivi un messaggio.',
        extractedData: null
      }, { status: 400 })
    }
    
    // Cerca nel database locali e artisti esistenti
    let locali: any[] = []
    let artisti: any[] = []
    
    try {
      locali = await prisma.locale.findMany({
        take: 100,
        select: { id: true, nome: true, citta: true, indirizzo: true }
      })
      
      artisti = await prisma.artista.findMany({
        take: 200,
        select: { id: true, nomeDarte: true, nome: true, cognome: true, qualifica: true }
      })
    } catch (dbError) {
      console.error('Errore database:', dbError)
      // Continua senza dati dal DB
    }
    
    // Costruisci il prompt per Claude
    const systemPrompt = `Sei un assistente per la gestione delle richieste di agibilità ENPALS/INPS nel settore dello spettacolo italiano.

Il tuo compito è estrarre le informazioni da messaggi in linguaggio naturale per creare richieste di agibilità.

INFORMAZIONI DA ESTRARRE:
1. DATA EVENTO (obbligatoria) - formato ISO (YYYY-MM-DD)
2. LOCALE (obbligatorio) - nome, città, indirizzo
3. ARTISTI (almeno 1 obbligatorio) - nome d'arte, qualifica (DJ, Cantante, Musicista, ecc.), compenso netto in euro
4. NOTE (opzionale)

LOCALI ESISTENTI NEL DATABASE:
${locali.map(l => `- "${l.nome}" (${l.citta || 'N/D'}) [ID: ${l.id}]`).join('\n')}

ARTISTI ESISTENTI NEL DATABASE:
${artisti.map(a => `- "${a.nomeDarte}" - ${a.qualifica || 'Artista'} [ID: ${a.id}]`).join('\n')}

REGOLE:
- Se il locale/artista menzionato corrisponde a uno esistente, usa l'ID dal database
- Se non esiste, segnala isNuovo: true
- Per i compensi, cerca importi in euro (es. "300 euro", "€500", "compenso 200")
- La data può essere espressa in vari formati ("15 dicembre", "il 15/12", "sabato prossimo")
- Oggi è: ${new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

DATI GIÀ ESTRATTI FINORA:
${JSON.stringify(currentData, null, 2)}

RISPONDI SEMPRE IN FORMATO JSON con questa struttura:
{
  "extractedData": {
    "dataEvento": "YYYY-MM-DD" | null,
    "locale": { "id": "...", "nome": "...", "citta": "...", "isNuovo": false } | null,
    "artisti": [{ "id": "...", "nomeDarte": "...", "qualifica": "...", "compensoNetto": 000, "isNuovo": false }] | [],
    "note": "..." | null,
    "isComplete": true/false,
    "missingFields": ["campo1", "campo2"]
  },
  "response": "Messaggio da mostrare all'utente in italiano, cordiale e professionale. Usa **grassetto** per evidenziare. Se mancano informazioni, chiedile gentilmente."
}

Se l'utente non fornisce informazioni sull'evento (saluti, domande generiche), rispondi normalmente senza extractedData.`

    // Prepara i messaggi per Claude
    const claudeMessages: Array<{role: 'user' | 'assistant', content: string}> = []
    
    // Aggiungi cronologia conversazione (ultimi 10 messaggi)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10)
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          claudeMessages.push({
            role: msg.role,
            content: msg.content
          })
        }
      }
    }
    
    // Aggiungi messaggio corrente
    claudeMessages.push({
      role: 'user',
      content: message
    })
    
    // Chiama Claude
    let response
    try {
      response = await client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: claudeMessages,
      })
    } catch (claudeError: any) {
      console.error('Errore chiamata Claude:', claudeError?.message || claudeError)
      return NextResponse.json({
        error: 'Errore AI',
        response: `Errore nella comunicazione con l'AI: ${claudeError?.message || 'Errore sconosciuto'}. Verifica la configurazione.`,
        extractedData: null
      }, { status: 500 })
    }
    
    // Estrai la risposta
    const assistantMessage = response.content[0]
    if (assistantMessage.type !== 'text') {
      throw new Error('Risposta non testuale')
    }
    
    // Prova a parsare il JSON dalla risposta
    let parsedResponse: any = {}
    try {
      // Cerca il JSON nella risposta
      const jsonMatch = assistantMessage.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      // Se non riesce a parsare, usa la risposta come testo
      parsedResponse = {
        response: assistantMessage.text,
        extractedData: null
      }
    }
    
    // Merge dei dati estratti con quelli esistenti
    let mergedData: ExtractedData = { ...currentData }
    
    if (parsedResponse.extractedData) {
      const newData = parsedResponse.extractedData
      
      // Merge intelligente
      if (newData.dataEvento) mergedData.dataEvento = newData.dataEvento
      if (newData.dataFine) mergedData.dataFine = newData.dataFine
      if (newData.locale) mergedData.locale = newData.locale
      if (newData.artisti && newData.artisti.length > 0) {
        // Aggiungi artisti senza duplicati
        const esistenti = mergedData.artisti || []
        const nuovi = newData.artisti.filter((n: any) => 
          !esistenti.some(e => e.nomeDarte.toLowerCase() === n.nomeDarte.toLowerCase())
        )
        mergedData.artisti = [...esistenti, ...nuovi]
      }
      if (newData.note) mergedData.note = newData.note
      
      // Verifica completezza
      const missingFields: string[] = []
      if (!mergedData.dataEvento) missingFields.push('Data evento')
      if (!mergedData.locale?.nome) missingFields.push('Nome locale')
      if (!mergedData.artisti || mergedData.artisti.length === 0) missingFields.push('Almeno un artista')
      else {
        const artistiSenzaCompenso = mergedData.artisti.filter(a => !a.compensoNetto)
        if (artistiSenzaCompenso.length > 0) {
          missingFields.push(`Compenso per: ${artistiSenzaCompenso.map(a => a.nomeDarte).join(', ')}`)
        }
      }
      
      mergedData.isComplete = missingFields.length === 0
      mergedData.missingFields = missingFields
    }
    
    return NextResponse.json({
      response: parsedResponse.response || 'Ho capito, continua pure.',
      extractedData: mergedData,
    })
    
  } catch (error) {
    console.error('Errore AI extract:', error)
    return NextResponse.json(
      { 
        error: 'Errore nell\'elaborazione',
        response: 'Mi dispiace, si è verificato un errore. Puoi riprovare?',
        extractedData: null
      },
      { status: 500 }
    )
  }
}
