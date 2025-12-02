// src/app/api/pagamenti/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET - Lista pagamenti artisti da effettuare
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stato = searchParams.get('stato')
    const artistaId = searchParams.get('artistaId')
    const scadenza = searchParams.get('scadenza') // 'oggi', 'settimana', 'mese', 'scaduti'
    
    const where: any = {
      statoPagamento: { not: 'PAGATO' }
    }
    
    if (stato) {
      where.statoPagamento = stato
    }
    
    if (artistaId) {
      where.artistaId = artistaId
    }
    
    // Filtro scadenza
    const oggi = new Date()
    oggi.setHours(0, 0, 0, 0)
    
    if (scadenza === 'oggi') {
      const domani = new Date(oggi)
      domani.setDate(domani.getDate() + 1)
      where.scadenzaPagamento = {
        gte: oggi,
        lt: domani
      }
    } else if (scadenza === 'settimana') {
      const fineSett = new Date(oggi)
      fineSett.setDate(fineSett.getDate() + 7)
      where.scadenzaPagamento = {
        gte: oggi,
        lt: fineSett
      }
    } else if (scadenza === 'mese') {
      const fineMese = new Date(oggi)
      fineMese.setMonth(fineMese.getMonth() + 1)
      where.scadenzaPagamento = {
        gte: oggi,
        lt: fineMese
      }
    } else if (scadenza === 'scaduti') {
      where.scadenzaPagamento = { lt: oggi }
      where.statoPagamento = 'DA_PAGARE'
    }
    
    // Query ArtistaAgibilita invece di Agibilita
    const pagamenti = await prisma.artistaAgibilita.findMany({
      where,
      orderBy: [
        { scadenzaPagamento: 'asc' },
        { createdAt: 'asc' }
      ],
      include: {
        artista: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            nomeDarte: true,
            iban: true,
            tipoContratto: true,
          }
        },
        agibilita: {
          include: {
            locale: {
              select: {
                id: true,
                nome: true,
                citta: true,
              }
            },
            committente: {
              select: {
                id: true,
                ragioneSociale: true,
                aRischio: true,
              }
            },
          }
        },
      }
    })
    
    // Formatta risposta
    const pagamentiFormattati = pagamenti.map(p => ({
      id: p.id,
      agibilitaId: p.agibilitaId,
      codice: p.agibilita.codice,
      data: p.agibilita.data,
      artista: {
        id: p.artista.id,
        nome: p.artista.nome,
        cognome: p.artista.cognome,
        nomeDarte: p.artista.nomeDarte,
        iban: p.artista.iban,
        tipoContratto: p.artista.tipoContratto,
      },
      locale: p.agibilita.locale,
      committente: p.agibilita.committente,
      compensoNetto: parseFloat(p.compensoNetto.toString()),
      compensoLordo: parseFloat(p.compensoLordo.toString()),
      ritenuta: parseFloat(p.ritenuta.toString()),
      statoPagamento: p.statoPagamento,
      scadenzaPagamento: p.scadenzaPagamento,
      dataPagamento: p.dataPagamento,
      metodoPagamento: p.metodoPagamento,
    }))
    
    return NextResponse.json(pagamentiFormattati)
  } catch (error) {
    console.error('Errore GET pagamenti:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei pagamenti' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna stato pagamento artista
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, statoPagamento, dataPagamento, metodoPagamento } = body
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs mancanti o non validi' },
        { status: 400 }
      )
    }
    
    if (!statoPagamento) {
      return NextResponse.json(
        { error: 'Stato pagamento obbligatorio' },
        { status: 400 }
      )
    }
    
    const updateData: any = { statoPagamento }
    
    if (statoPagamento === 'PAGATO') {
      updateData.dataPagamento = dataPagamento ? new Date(dataPagamento) : new Date()
      updateData.metodoPagamento = metodoPagamento || null
    }
    
    // Aggiorna multipli pagamenti
    const result = await prisma.artistaAgibilita.updateMany({
      where: { id: { in: ids } },
      data: updateData
    })
    
    return NextResponse.json({ 
      success: true, 
      updated: result.count 
    })
  } catch (error) {
    console.error('Errore PUT pagamenti:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento dei pagamenti' },
      { status: 500 }
    )
  }
}
