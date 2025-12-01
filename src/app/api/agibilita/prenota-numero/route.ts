// src/app/api/agibilita/prenota-numero/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generaCodiceAgibilita, CONFIG } from '@/lib/constants'
import { randomUUID } from 'crypto'

// POST - Prenota nuovo numero agibilità
export async function POST(request: NextRequest) {
  const MAX_RETRIES = 10
  let lastError: any = null
  
  // Leggi body una sola volta
  let userId: string | null = null
  let sessionId: string | null = null
  
  try {
    const body = await request.json()
    userId = body.userId || null
    sessionId = body.sessionId || null
  } catch {
    // Body vuoto, continua
  }
  
  const anno = new Date().getFullYear()
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Prima: pulizia FUORI dalla transazione (per evitare deadlock)
      await prisma.prenotazioneNumero.deleteMany({
        where: {
          OR: [
            { confermato: false, scadeAt: { lt: new Date() } },
            { confermato: true, agibilitaId: null },
            { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, agibilitaId: null }
          ]
        }
      })
      
      // Poi: transazione per creare prenotazione
      const prenotazione = await prisma.$transaction(async (tx) => {
        // Trova il max progressivo tra TUTTE le fonti
        const [ultimaAgibilita, ultimaPrenotazione] = await Promise.all([
          tx.agibilita.findFirst({
            where: { codice: { startsWith: `AG-${anno}-` } },
            orderBy: { codice: 'desc' }
          }),
          // TUTTE le prenotazioni dell'anno (non solo attive!)
          tx.prenotazioneNumero.findFirst({
            where: { anno },
            orderBy: { progressivo: 'desc' }
          })
        ])
        
        let maxProgressivo = 0
        
        if (ultimaAgibilita) {
          const match = ultimaAgibilita.codice.match(/AG-\d{4}-(\d+)/)
          if (match) {
            maxProgressivo = Math.max(maxProgressivo, parseInt(match[1]))
          }
        }
        
        if (ultimaPrenotazione) {
          maxProgressivo = Math.max(maxProgressivo, ultimaPrenotazione.progressivo)
        }
        
        const progressivo = maxProgressivo + 1
        const codice = generaCodiceAgibilita(anno, progressivo)
        
        // Calcola scadenza
        const scadeAt = new Date()
        scadeAt.setMinutes(scadeAt.getMinutes() + CONFIG.PRENOTAZIONE_SCADENZA_MINUTI)
        
        // Crea prenotazione
        return await tx.prenotazioneNumero.create({
          data: {
            id: randomUUID(),
            anno,
            progressivo,
            codice,
            scadeAt,
            userId: userId || null,
            sessionId: sessionId || null,
          }
        })
      }, {
        timeout: 15000,
      })
      
      // Successo!
      return NextResponse.json({
        id: prenotazione.id,
        codice: prenotazione.codice,
        scadeAt: prenotazione.scadeAt,
        progressivo: prenotazione.progressivo,
      }, { status: 201 })
      
    } catch (error) {
      lastError = error
      
      // Se errore di unicità, riprova con delay crescente + jitter
      if ((error as any).code === 'P2002') {
        if (attempt < MAX_RETRIES - 1) {
          const delay = Math.min(100 * Math.pow(2, attempt), 2000) + Math.random() * 200
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }
      
      break
    }
  }
  
  console.error('Errore prenotazione numero dopo', MAX_RETRIES, 'tentativi:', lastError)
  
  if ((lastError as any).code === 'P2002') {
    return NextResponse.json(
      { error: 'Sistema occupato, riprova tra qualche secondo' },
      { status: 409 }
    )
  }
  
  return NextResponse.json(
    { error: 'Errore nella prenotazione del numero' },
    { status: 500 }
  )
}

// DELETE - Rilascia prenotazione
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID richiesto' }, { status: 400 })
    }
    
    const prenotazione = await prisma.prenotazioneNumero.findUnique({
      where: { id }
    })
    
    if (!prenotazione) {
      return NextResponse.json({ error: 'Non trovata' }, { status: 404 })
    }
    
    if (prenotazione.confermato && prenotazione.agibilitaId) {
      return NextResponse.json({ error: 'Già confermata' }, { status: 400 })
    }
    
    await prisma.prenotazioneNumero.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Errore DELETE prenotazione:', error)
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}

// GET - Stato/lista prenotazioni
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const cleanup = searchParams.get('cleanup')
    
    // Pulizia manuale
    if (cleanup === 'true') {
      const deleted = await prisma.prenotazioneNumero.deleteMany({
        where: {
          OR: [
            { confermato: false, scadeAt: { lt: new Date() } },
            { confermato: true, agibilitaId: null },
            { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, agibilitaId: null }
          ]
        }
      })
      return NextResponse.json({ success: true, deleted: deleted.count })
    }
    
    if (!id) {
      const prenotazioni = await prisma.prenotazioneNumero.findMany({
        where: { confermato: false, scadeAt: { gte: new Date() } },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(prenotazioni)
    }
    
    const prenotazione = await prisma.prenotazioneNumero.findUnique({
      where: { id }
    })
    
    if (!prenotazione) {
      return NextResponse.json({ error: 'Non trovata' }, { status: 404 })
    }
    
    const scaduta = new Date() > prenotazione.scadeAt
    
    return NextResponse.json({
      ...prenotazione,
      scaduta,
      minutiRimanenti: scaduta ? 0 : Math.ceil((prenotazione.scadeAt.getTime() - Date.now()) / 60000)
    })
    
  } catch (error) {
    console.error('Errore GET prenotazione:', error)
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}