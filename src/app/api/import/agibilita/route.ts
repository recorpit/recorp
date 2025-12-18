// src/app/api/import/agibilita/route.ts
// API per import storico agibilità da Excel

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minuti per import grandi

interface ImportRow {
  artista: string
  data: Date | string
  locale: string
  compensoTotale: number
  tipoContratto: string
  compensoArtista: number
  quotaOKL: number
  importoFattura: number
  statoFatturazione: string
  bonificato: string
  dataPagamento: string
  statoPagamentoArtista: string
}

interface ImportResult {
  totaleRighe: number
  agibilitaCreate: number
  prestazioniCreate: number
  localiCreati: number
  artistiNonTrovati: string[]
  errori: string[]
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const dryRun = formData.get('dryRun') === 'true'
    
    if (!file) {
      return NextResponse.json({ error: 'File mancante' }, { status: 400 })
    }
    
    // Leggi il file Excel
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
    
    // Trova il foglio AGIBILITA' 2025
    const sheetName = workbook.SheetNames.find(s => s.includes('AGIBILITA')) || workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { raw: false, dateNF: 'yyyy-mm-dd' })
    
    // Prepara risultato
    const result: ImportResult = {
      totaleRighe: rows.length,
      agibilitaCreate: 0,
      prestazioniCreate: 0,
      localiCreati: 0,
      artistiNonTrovati: [],
      errori: []
    }
    
    // Carica artisti e locali esistenti
    const artisti = await prisma.artista.findMany({
      select: { id: true, nome: true, cognome: true, nomeDarte: true }
    })
    
    const locali = await prisma.locale.findMany({
      select: { id: true, nome: true }
    })
    
    // Mappa per lookup veloce
    const artistiMap = new Map<string, string>()
    artisti.forEach(a => {
      const chiavi = [
        a.nomeDarte?.toLowerCase(),
        `${a.nome} ${a.cognome}`.toLowerCase(),
        `${a.cognome} ${a.nome}`.toLowerCase(),
      ].filter(Boolean)
      chiavi.forEach(k => artistiMap.set(k!, a.id))
    })
    
    const localiMap = new Map<string, string>()
    locali.forEach(l => localiMap.set(l.nome.toLowerCase(), l.id))
    
    // Raggruppa righe per data+locale (una agibilità per data+locale)
    const agibilitaMap = new Map<string, { data: Date, localeNome: string, prestazioni: any[] }>()
    
    for (const row of rows) {
      try {
        // Estrai dati dalla riga
        const artistaNome = row['ARTISTA']?.toString().trim()
        const dataStr = row['data '] || row['data']
        const localeNome = row['LOCALE']?.toString().trim()
        const compensoTotale = parseFloat(row['tot']) || 0
        const tipoContratto = row['Colonna3']?.toString().trim() || 'P.OCCASIONALE'
        const compensoArtista = parseFloat(row['QUOTA ARTISTA']) || 0
        const quotaOKL = parseFloat(row['OKL']) || 0
        
        if (!artistaNome || !dataStr || !localeNome) {
          continue // Salta righe vuote
        }
        
        // Parsa data
        let data: Date
        if (dataStr instanceof Date) {
          data = dataStr
        } else {
          data = new Date(dataStr)
        }
        
        if (isNaN(data.getTime())) {
          result.errori.push(`Data non valida per ${artistaNome}: ${dataStr}`)
          continue
        }
        
        // Cerca artista
        const artistaId = artistiMap.get(artistaNome.toLowerCase())
        if (!artistaId) {
          if (!result.artistiNonTrovati.includes(artistaNome)) {
            result.artistiNonTrovati.push(artistaNome)
          }
          continue
        }
        
        // Chiave univoca per agibilità
        const chiave = `${data.toISOString().split('T')[0]}_${localeNome.toLowerCase()}`
        
        if (!agibilitaMap.has(chiave)) {
          agibilitaMap.set(chiave, {
            data,
            localeNome,
            prestazioni: []
          })
        }
        
        // Mappa tipo contratto
        let tipoContrattoDb = 'OCCASIONALE'
        if (tipoContratto.includes('P.IVA')) tipoContrattoDb = 'P_IVA'
        else if (tipoContratto.includes('CHIAMATA')) tipoContrattoDb = 'CHIAMATA'
        else if (tipoContratto.includes('FISSO') || tipoContratto.includes('FULL TIME')) tipoContrattoDb = 'TEMPO_DETERMINATO'
        
        agibilitaMap.get(chiave)!.prestazioni.push({
          artistaId,
          artistaNome,
          compensoNetto: compensoArtista,
          compensoLordo: compensoTotale,
          tipoContratto: tipoContrattoDb,
          quotaAgenzia: quotaOKL,
        })
        
      } catch (err: any) {
        result.errori.push(`Errore riga: ${err.message}`)
      }
    }
    
    // Se dry run, ritorna solo anteprima
    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        result: {
          ...result,
          agibilitaDaCreare: agibilitaMap.size,
          prestazioniDaCreare: Array.from(agibilitaMap.values()).reduce((s, a) => s + a.prestazioni.length, 0),
        },
        anteprima: Array.from(agibilitaMap.entries()).slice(0, 20).map(([k, v]) => ({
          chiave: k,
          data: v.data,
          locale: v.localeNome,
          artisti: v.prestazioni.map(p => p.artistaNome),
          totaleCompensi: v.prestazioni.reduce((s, p) => s + p.compensoNetto, 0),
        }))
      })
    }
    
    // Esegui import reale
    // Prima trova/crea committente default per import
    let committenteDefault = await prisma.committente.findFirst({
      where: { ragioneSociale: { contains: 'OKL' } }
    })
    
    if (!committenteDefault) {
      committenteDefault = await prisma.committente.create({
        data: {
          ragioneSociale: 'OKL SRL (Import)',
          partitaIva: '00000000000',
          codiceFiscale: '00000000000',
          indirizzoFatturazione: '-',
          cittaFatturazione: '-',
          provinciaFatturazione: 'VI',
          capFatturazione: '00000',
        }
      })
    }
    
    // Crea agibilità e prestazioni
    const agibilitaEntries = Array.from(agibilitaMap.entries())
    for (const [chiave, agibData] of agibilitaEntries) {
      try {
        // Trova o crea locale
        let localeId = localiMap.get(agibData.localeNome.toLowerCase())
        
        if (!localeId) {
          const nuovoLocale = await prisma.locale.create({
            data: {
              nome: agibData.localeNome,
              indirizzo: '-',
              citta: '-',
              provincia: 'VI',
              cap: '00000',
            }
          })
          localeId = nuovoLocale.id
          localiMap.set((agibData.localeNome || '').toLowerCase(), localeId as string)
          result.localiCreati++
        }
        
        // Calcola totali
        const totaleNetto = agibData.prestazioni.reduce((s, p) => s + p.compensoNetto, 0)
        const totaleLordo = agibData.prestazioni.reduce((s, p) => s + p.compensoLordo, 0)
        const totaleQuotaAgenzia = agibData.prestazioni.reduce((s, p) => s + p.quotaAgenzia, 0)
        
        // Crea agibilità
        const agibilita = await prisma.agibilita.create({
          data: {
            codice: `IMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            data: agibData.data,
            localeId,
            committenteId: committenteDefault.id,
            stato: 'COMPLETATA',
            totaleCompensiNetti: totaleNetto,
            totaleCompensiLordi: totaleLordo,
            totaleRitenute: totaleLordo - totaleNetto,
            quotaAgenzia: totaleQuotaAgenzia,
            note: `Import storico da Excel - ${chiave}`,
          }
        })
        
        result.agibilitaCreate++
        result.prestazioniCreate += agibData.prestazioni.length
        
      } catch (err: any) {
        result.errori.push(`Errore creazione agibilità ${chiave}: ${err.message}`)
      }
    }
    
    return NextResponse.json({ success: true, result })
    
  } catch (error: any) {
    console.error('Errore import:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'import', dettaglio: error.message },
      { status: 500 }
    )
  }
}

// GET - Ritorna statistiche per anteprima
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const artisti = await prisma.artista.count()
    const locali = await prisma.locale.count()
    const agibilita = await prisma.agibilita.count()
    
    return NextResponse.json({ artisti, locali, agibilita })
    
  } catch (error) {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
