// src/app/api/agibilita/[id]/duplica/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generaCodiceAgibilita } from '@/lib/constants'

// POST - Duplica agibilità
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    
    // Carica agibilità originale con tutti i dati
    const originale = await prisma.agibilita.findUnique({
      where: { id },
      include: {
        artisti: {
          include: {
            artista: true
          }
        },
        locale: true,
        committente: true,
      }
    })
    
    if (!originale) {
      return NextResponse.json(
        { error: 'Agibilità non trovata' },
        { status: 404 }
      )
    }
    
    // Genera nuovo codice
    const anno = new Date().getFullYear()
    const ultimaAgibilita = await prisma.agibilita.findFirst({
      where: { codice: { startsWith: `AG-${anno}-` } },
      orderBy: { codice: 'desc' }
    })
    
    let progressivo = 1
    if (ultimaAgibilita) {
      const match = ultimaAgibilita.codice.match(/AG-\d{4}-(\d+)/)
      if (match) progressivo = parseInt(match[1]) + 1
    }
    
    const nuovoCodice = generaCodiceAgibilita(anno, progressivo)
    
    // Data: usa quella fornita o quella originale
    const nuovaData = body.data ? new Date(body.data) : originale.data
    const nuovaDataFine = body.dataFine 
      ? new Date(body.dataFine) 
      : originale.dataFine
    
    // Crea nuova agibilità in transazione
    const nuovaAgibilita = await prisma.$transaction(async (tx) => {
      // 1. Crea agibilità (copia dati base, resetta stato e dati INPS)
      const ag = await tx.agibilita.create({
        data: {
          codice: nuovoCodice,
          localeId: originale.localeId,
          committenteId: originale.committenteId,
          richiedente: originale.richiedente,
          data: nuovaData,
          dataFine: nuovaDataFine,
          luogoPrestazione: originale.luogoPrestazione,
          estera: originale.estera,
          paeseEstero: originale.paeseEstero,
          formatId: originale.formatId,
          // Totali copiati
          totaleCompensiNetti: originale.totaleCompensiNetti,
          totaleCompensiLordi: originale.totaleCompensiLordi,
          totaleRitenute: originale.totaleRitenute,
          quotaAgenzia: originale.quotaAgenzia,
          importoFattura: originale.importoFattura,
          // Stato resettato
          stato: 'BOZZA',
          statoFattura: 'DA_FATTURARE',
          // Note copiate
          note: originale.note,
          noteInterne: originale.noteInterne 
            ? `${originale.noteInterne}\n\n[Duplicata da ${originale.codice}]`
            : `[Duplicata da ${originale.codice}]`,
          // Dati INPS NON copiati (restano null)
          // identificativoINPS: null,
          // esitoINPS: null,
          // etc.
        }
      })
      
      // 2. Copia artisti con compensi
      if (originale.artisti.length > 0) {
        await tx.artistaAgibilita.createMany({
          data: originale.artisti.map(aa => ({
            agibilitaId: ag.id,
            artistaId: aa.artistaId,
            qualifica: aa.qualifica,
            compensoNetto: aa.compensoNetto,
            compensoLordo: aa.compensoLordo,
            ritenuta: aa.ritenuta,
            dataInizio: aa.dataInizio,
            dataFine: aa.dataFine,
            // Stato pagamento resettato
            statoPagamento: 'DA_PAGARE',
            // Dati INPS NON copiati
            // identificativoLavoratoreINPS: null,
          }))
        })
      }
      
      return ag
    })
    
    // Recupera agibilità completa
    const result = await prisma.agibilita.findUnique({
      where: { id: nuovaAgibilita.id },
      include: {
        artisti: { include: { artista: true } },
        locale: true,
        committente: true,
      }
    })
    
    return NextResponse.json({
      success: true,
      agibilita: result,
      message: `Agibilità duplicata con codice ${nuovoCodice}`
    }, { status: 201 })
    
  } catch (error) {
    console.error('Errore duplicazione agibilità:', error)
    return NextResponse.json(
      { error: 'Errore nella duplicazione', dettagli: String(error) },
      { status: 500 }
    )
  }
}