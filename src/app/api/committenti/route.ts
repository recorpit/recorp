// src/app/api/committenti/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Lista committenti
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const aRischio = searchParams.get('aRischio')
    
    const where: any = {}
    
    if (search) {
      where.OR = [
        { ragioneSociale: { contains: search, mode: 'insensitive' } },
        { partitaIva: { contains: search, mode: 'insensitive' } },
        { codiceFiscale: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (aRischio !== null && aRischio !== undefined) {
      where.aRischio = aRischio === 'true'
    }
    
    const committenti = await prisma.committente.findMany({
      where,
      orderBy: { ragioneSociale: 'asc' },
      include: {
        scadenzaPagamento: true,
        _count: {
          select: { 
            agibilita: true,
            fatture: true,
            localiDefault: true,
          }
        }
      }
    })
    
    return NextResponse.json(committenti)
  } catch (error) {
    console.error('Errore GET committenti:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei committenti' },
      { status: 500 }
    )
  }
}

// POST - Crea committente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verifica P.IVA unica (se presente)
    if (body.partitaIva) {
      const esistente = await prisma.committente.findFirst({
        where: { partitaIva: body.partitaIva }
      })
      if (esistente) {
        return NextResponse.json(
          { error: 'Partita IVA già registrata' },
          { status: 400 }
        )
      }
    }
    
    const committente = await prisma.committente.create({
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
        tipoPagamento: body.tipoPagamento || 'BONIFICO_VISTA',
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
    
    return NextResponse.json(committente, { status: 201 })
  } catch (error) {
    console.error('Errore POST committente:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione del committente' },
      { status: 500 }
    )
  }
}
