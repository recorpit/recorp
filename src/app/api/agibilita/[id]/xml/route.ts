// src/app/api/agibilita/[id]/xml/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { DATI_AZIENDA, isLegaleRappresentante } from '@/lib/constants'

// Mappa qualifica -> codice INPS (con chiavi normalizzate)
const QUALIFICA_CODICE_INPS: Record<string, string> = {
  DJ: '032',
  VOCALIST: '031',
  CORISTA: '013',
  MUSICISTA: '081',
  BALLERINO: '092',
  LUCISTA: '117',
  FOTOGRAFO: '126',
  TRUCCATORE: '141',
  ALTRO: '032',
}

// Ottieni codice INPS da qualifica (con fallback sicuro)
function getCodiceINPS(qualifica: string | null | undefined): string {
  if (!qualifica) return '032' // Default DJ
  
  // Prova uppercase diretto
  const upper = qualifica.toUpperCase().trim()
  if (QUALIFICA_CODICE_INPS[upper]) {
    return QUALIFICA_CODICE_INPS[upper]
  }
  
  // Mappature alternative per formati diversi
  const mappature: Record<string, string> = {
    'VOCALIST': '031',
    'VOCALIST/A': '031',
    'CORISTA': '013',
    'MUSICISTA': '081',
    'BALLERINO': '092',
    'BALLERINO/A': '092',
    'BALLERINA': '092',
    'LUCISTA': '117',
    'TECNICO LUCI': '117',
    'FOTOGRAFO': '126',
    'FOTOGRAFO/A': '126',
    'TRUCCATORE': '141',
    'TRUCCATORE/TRICE': '141',
    'TRUCCATRICE': '141',
    'DJ': '032',
    'DEEJAY': '032',
  }
  
  // Ritorna il codice mappato o default '032'
  return mappature[upper] || '032'
}

// Formatta data per XML INPS (YYYY-MM-DD)
function formatDataINPS(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Escape caratteri speciali XML
function escapeXml(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Formatta numero con virgola (INPS richiede virgola, non punto)
function formatImportoINPS(importo: number | string | null | undefined): string {
  if (importo === null || importo === undefined) return '0,00'
  const num = typeof importo === 'string' ? parseFloat(importo) : importo
  if (isNaN(num)) return '0,00'
  return num.toFixed(2).replace('.', ',')
}

// Calcola numero di giorni tra due date (incluse)
function calcolaGiorniPrestazione(dataInizio: Date, dataFine: Date): number {
  const diff = dataFine.getTime() - dataInizio.getTime()
  const giorni = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1 // +1 perché entrambi i giorni sono inclusi
  return Math.max(1, giorni) // Minimo 1 giorno
}

// Genera XML INPS per agibilità con multi-artista
// IMPORTANTE: Raggruppa artisti per periodo (date distinte = occupazioni distinte)
function generaXMLINPS(agibilita: any): string {
  const locale = agibilita.locale
  
  // Date default agibilità
  const dataInizioDefault = new Date(agibilita.data)
  const dataFineDefault = agibilita.dataFine ? new Date(agibilita.dataFine) : dataInizioDefault
  
  // Raggruppa artisti per periodo (chiave = dataInizio_dataFine)
  const artistiPerPeriodo = new Map<string, any[]>()
  
  agibilita.artisti.forEach((aa: any) => {
    const dataInizio = aa.dataInizio ? new Date(aa.dataInizio) : dataInizioDefault
    const dataFine = aa.dataFine ? new Date(aa.dataFine) : (aa.dataInizio ? dataInizio : dataFineDefault)
    
    // Chiave univoca per il periodo
    const chiavePeriodo = `${formatDataINPS(dataInizio)}_${formatDataINPS(dataFine)}`
    
    if (!artistiPerPeriodo.has(chiavePeriodo)) {
      artistiPerPeriodo.set(chiavePeriodo, [])
    }
    artistiPerPeriodo.get(chiavePeriodo)!.push({
      ...aa,
      dataInizioCalcolata: dataInizio,
      dataFineCalcolata: dataFine
    })
  })
  
  // Genera una Occupazione per ogni periodo distinto
  const occupazioniXML = Array.from(artistiPerPeriodo.entries()).map(([chiavePeriodo, artistiDelPeriodo], index) => {
    const [dataInizioStr, dataFineStr] = chiavePeriodo.split('_')
    const dataInizio = new Date(dataInizioStr)
    const dataFine = new Date(dataFineStr)
    const numeroGiorni = calcolaGiorniPrestazione(dataInizio, dataFine)
    
    // Genera XML lavoratori per questo periodo
    const lavoratoriXML = artistiDelPeriodo.map((aa: any) => {
      const artista = aa.artista
      
      // Usa qualifica dell'agibilità-artista, fallback a quella dell'artista
      const qualificaOriginale = aa.qualifica || artista.qualifica
      const codiceQualifica = getCodiceINPS(qualificaOriginale)
      
      // Compenso lordo (già calcolato correttamente per P.IVA o occasionale)
      const compensoLordo = aa.compensoLordo ? parseFloat(aa.compensoLordo.toString()) : 0
      
      // Compenso giornaliero = compenso totale / numero giorni
      const compensoGiornaliero = compensoLordo / numeroGiorni
      
      // Verifica se è legale rappresentante
      const isLegale = isLegaleRappresentante(artista.codiceFiscale)
      
      return `                <Lavoratore>
                  <CodiceFiscale>${escapeXml(artista.codiceFiscale)}</CodiceFiscale>${artista.matricolaEnpals ? `
                  <MatricolaEnpals>${escapeXml(artista.matricolaEnpals)}</MatricolaEnpals>` : ''}
                  <Cognome>${escapeXml(artista.cognome)}</Cognome>
                  <Nome>${escapeXml(artista.nome)}</Nome>
                  <LegaleRappresentante>${isLegale ? 'SI' : 'NO'}</LegaleRappresentante>
                  <CodiceQualifica>${codiceQualifica}</CodiceQualifica>
                  <Retribuzione>${formatImportoINPS(compensoGiornaliero)}</Retribuzione>
                </Lavoratore>`
    }).join('\n')
    
    // Genera l'occupazione
    // Nota: identificativi INPS solo sulla prima occupazione (o andrebbero gestiti per ogni periodo)
    const idOccupazione = index === 0 && agibilita.identificativoOccupazioneINPS 
      ? `\n          <IdentificativoOccupazione>${agibilita.identificativoOccupazioneINPS}</IdentificativoOccupazione>` 
      : ''
    const idPeriodo = index === 0 && agibilita.identificativoPeriodoINPS
      ? `\n              <IdentificativoPeriodo>${agibilita.identificativoPeriodoINPS}</IdentificativoPeriodo>`
      : ''
    
    return `        <Occupazione>${idOccupazione}
          <Tipo>O</Tipo>
          <TipoRetribuzione>G</TipoRetribuzione>
          <Luogo>${escapeXml(locale.citta || '')}</Luogo>
          <Descrizione>${escapeXml(locale.nome)}</Descrizione>
          <Indirizzo>${escapeXml(locale.indirizzo || '')}</Indirizzo>
          <CodiceComune>${escapeXml(locale.codiceBelfiore || '')}</CodiceComune>
          <Provincia>${escapeXml(locale.provincia || '')}</Provincia>
          <Cap>${escapeXml(locale.cap || '')}</Cap>${agibilita.note ? `
          <Note>${escapeXml(agibilita.note)}</Note>` : ''}
          <Periodi>
            <Periodo>${idPeriodo}
              <DataDal>${dataInizioStr}</DataDal>
              <DataAl>${dataFineStr}</DataAl>
            </Periodo>
          </Periodi>
          <Lavoratori>
${lavoratoriXML}
          </Lavoratori>
        </Occupazione>`
  }).join('\n')
  
  // Tipo agibilità: N = Nuova, V = Variazione
  const tipo = agibilita.identificativoINPS ? 'V' : 'N'
  
  // Costruisce XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ImportAgibilita>
  <ElencoAgibilita>
    <Agibilita>${agibilita.identificativoINPS ? `
      <IdentificativoAgibilita>${agibilita.identificativoINPS}</IdentificativoAgibilita>` : ''}
      <Tipo>${tipo}</Tipo>
      <CodiceFiscaleAzienda>${DATI_AZIENDA.codiceFiscale}</CodiceFiscaleAzienda>
      <Matricola>${DATI_AZIENDA.matricola}</Matricola>
      <Descrizione>${escapeXml(locale.nome)}</Descrizione>
      <Indirizzo>${escapeXml(locale.indirizzo || DATI_AZIENDA.indirizzo)}</Indirizzo>
      <CodiceComune>${escapeXml(locale.codiceBelfiore || DATI_AZIENDA.codiceBelfiore)}</CodiceComune>
      <Provincia>${escapeXml(locale.provincia || DATI_AZIENDA.provincia)}</Provincia>
      <Cap>${escapeXml(locale.cap || DATI_AZIENDA.cap)}</Cap>
      <Occupazioni>
${occupazioniXML}
      </Occupazioni>
    </Agibilita>
  </ElencoAgibilita>
</ImportAgibilita>`

  return xml
}

// GET - Genera e scarica XML
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const agibilita = await prisma.agibilita.findUnique({
      where: { id },
      include: {
        locale: true,
        committente: true,
        artisti: {
          include: {
            artista: true
          }
        }
      }
    })
    
    if (!agibilita) {
      return NextResponse.json(
        { error: 'Agibilità non trovata' },
        { status: 404 }
      )
    }
    
    // Verifica dati minimi
    const errori: string[] = []
    
    agibilita.artisti.forEach((aa: any, index: number) => {
      const artista = aa.artista
      if (!artista.codiceFiscale) {
        errori.push(`Artista ${artista.cognome} ${artista.nome}: Codice fiscale mancante`)
      }
      if (!aa.compensoLordo || parseFloat(aa.compensoLordo.toString()) === 0) {
        errori.push(`Artista ${artista.cognome} ${artista.nome}: Compenso lordo mancante o zero`)
      }
    })
    
    if (!agibilita.locale) {
      errori.push('Locale non associato all\'agibilità')
    } else if (!agibilita.locale.codiceBelfiore) {
      errori.push('Codice Belfiore locale mancante')
    }
    
    if (errori.length > 0) {
      return NextResponse.json(
        { error: 'Dati incompleti per generazione XML', dettagli: errori },
        { status: 400 }
      )
    }
    
    // Genera XML
    const xml = generaXMLINPS(agibilita)
    
    // Aggiorna timestamp
    await prisma.agibilita.update({
      where: { id },
      data: {
        xmlGeneratoAt: new Date(),
      }
    })
    
    // Ritorna XML come file
    const filename = `${agibilita.codice}.xml`
    
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    })
    
  } catch (error) {
    console.error('Errore generazione XML:', error)
    return NextResponse.json(
      { error: 'Errore nella generazione dell\'XML' },
      { status: 500 }
    )
  }
}

// POST - Genera XML e salva path (per invio automatico PEC)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const agibilita = await prisma.agibilita.findUnique({
      where: { id },
      include: {
        locale: true,
        committente: true,
        artisti: {
          include: {
            artista: true
          }
        }
      }
    })
    
    if (!agibilita) {
      return NextResponse.json(
        { error: 'Agibilità non trovata' },
        { status: 404 }
      )
    }
    
    // Verifica dati minimi
    const errori: string[] = []
    
    agibilita.artisti.forEach((aa: any, index: number) => {
      const artista = aa.artista
      if (!artista.codiceFiscale) {
        errori.push(`Artista ${artista.cognome} ${artista.nome}: Codice fiscale mancante`)
      }
    })
    
    if (!agibilita.locale) {
      errori.push('Locale non associato all\'agibilità')
    } else if (!agibilita.locale.codiceBelfiore) {
      errori.push('Codice Belfiore locale mancante')
    }
    
    if (errori.length > 0) {
      return NextResponse.json(
        { error: 'Dati incompleti per generazione XML', dettagli: errori },
        { status: 400 }
      )
    }
    
    // Genera XML
    const xml = generaXMLINPS(agibilita)
    
    // In produzione qui salveresti su storage
    const xmlPath = `/xml/${agibilita.codice}.xml`
    
    // Aggiorna agibilità
    const updated = await prisma.agibilita.update({
      where: { id },
      data: {
        xmlPath,
        xmlGeneratoAt: new Date(),
        stato: 'PRONTA', // Pronta per invio INPS
      }
    })
    
    return NextResponse.json({
      success: true,
      xmlPath,
      xmlGeneratoAt: updated.xmlGeneratoAt,
      xml, // Per debug/preview
    })
    
  } catch (error) {
    console.error('Errore generazione XML:', error)
    return NextResponse.json(
      { error: 'Errore nella generazione dell\'XML' },
      { status: 500 }
    )
  }
}
