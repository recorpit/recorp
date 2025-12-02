// src/app/api/committenti/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Singolo committente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const committente = await prisma.committente.findUnique({
      where: { id },
      include: {
        scadenzaPagamento: true,
        localiDefault: true,
        agibilita: {
          include: {
            artisti: {
              include: {
                artista: true
              }
            },
            locale: true,
          },
          orderBy: { data: 'desc' },
          take: 10,
        },
        fatture: {
          orderBy: { dataEmissione: 'desc' },
          take: 5,
        },
        _count: {
          select: { 
            agibilita: true,
            fatture: true,
          }
        }
      },
    })
    
    if (!committente) {
      return NextResponse.json(
        { error: 'Committente non trovato' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(committente)
  } catch (error) {
    console.error('Errore GET committente:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero del committente' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna committente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Verifica committente esiste
    const esistente = await prisma.committente.findUnique({
      where: { id }
    })
    
    if (!esistente) {
      return NextResponse.json(
        { error: 'Committente non trovato' },
        { status: 404 }
      )
    }
    
    // Verifica P.IVA unica (se cambiata)
    if (body.partitaIva && body.partitaIva !== esistente.partitaIva) {
      const duplicato = await prisma.committente.findFirst({
        where: {
          partitaIva: body.partitaIva,
          NOT: { id }
        }
      })
      if (duplicato) {
        return NextResponse.json(
          { error: 'Partita IVA già registrata da altro committente' },
          { status: 400 }
        )
      }
    }
    
    const committente = await prisma.committente.update({
      where: { id },
      data: {
        // Dati anagrafici
        ragioneSociale: body.ragioneSociale,
        partitaIva: body.partitaIva || null,
        codiceFiscale: body.codiceFiscale?.toUpperCase() || null,
        
        // Contatti
        email: body.email || null,
        pec: body.pec || null,
        telefono: body.telefono || null,
        
        // Indirizzo fatturazione
        indirizzoFatturazione: body.indirizzoFatturazione || null,
        capFatturazione: body.capFatturazione || null,
        cittaFatturazione: body.cittaFatturazione || null,
        provinciaFatturazione: body.provinciaFatturazione || null,
        
        // Fatturazione elettronica - NUOVI CAMPI
        codiceSDI: body.codiceSDI || '0000000',
        isPubblicaAmministrazione: body.isPubblicaAmministrazione || false,
        splitPayment: body.splitPayment || false,
        modalitaFatturazione: body.modalitaFatturazione || 'DETTAGLIO_SPESE_INCLUSE',
        timingFatturazione: body.timingFatturazione || 'SETTIMANALE',
        tipoPagamento: body.tipoPagamento || 'BONIFICO_30GG',
        scadenzaPagamentoId: body.scadenzaPagamentoId || null,
        
        // Condizioni economiche
        quotaAgenzia: body.quotaAgenzia || 0,
        giorniPagamento: body.giorniPagamento || 30,
        iban: body.iban?.toUpperCase().replace(/\s/g, '') || null,
        
        // Altro
        aRischio: body.aRischio || false,
        note: body.note || null,
        noteInterne: body.noteInterne || null,
      },
      include: {
        scadenzaPagamento: true,
      }
    })
    
    return NextResponse.json(committente)
  } catch (error) {
    console.error('Errore PUT committente:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del committente' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina committente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verifica agibilità collegate
    const agibilitaCount = await prisma.agibilita.count({
      where: { committenteId: id }
    })
    
    if (agibilitaCount > 0) {
      return NextResponse.json(
        { error: `Impossibile eliminare: ${agibilitaCount} agibilità collegate` },
        { status: 400 }
      )
    }
    
    // Verifica fatture collegate
    const fattureCount = await prisma.fattura.count({
      where: { committenteId: id }
    })
    
    if (fattureCount > 0) {
      return NextResponse.json(
        { error: `Impossibile eliminare: ${fattureCount} fatture collegate` },
        { status: 400 }
      )
    }
    
    // Rimuovi riferimenti dai locali
    await prisma.locale.updateMany({
      where: { committenteDefaultId: id },
      data: { committenteDefaultId: null }
    })
    
    await prisma.committente.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore DELETE committente:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del committente' },
      { status: 500 }
    )
  }
}
