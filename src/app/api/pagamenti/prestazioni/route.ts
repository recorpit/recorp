// src/app/api/pagamenti/prestazioni/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Lista prestazioni con filtri
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stato = searchParams.get('stato')
    const artistaId = searchParams.get('artistaId')
    const inScadenza = searchParams.get('inScadenza')
    const anno = searchParams.get('anno')
    
    const where: any = {}
    
    if (stato) {
      where.stato = stato
    }
    
    if (artistaId) {
      where.artistaId = artistaId
    }
    
    if (anno) {
      where.anno = parseInt(anno)
    }
    
    // Prestazioni in scadenza (prossimi 7 giorni)
    if (inScadenza === 'true') {
      const oggi = new Date()
      const tra7giorni = new Date(oggi.getTime() + 7 * 24 * 60 * 60 * 1000)
      where.stato = 'PAGABILE'
      where.dataScadenzaPagamento = {
        gte: oggi,
        lte: tra7giorni,
      }
    }
    
    const prestazioni = await prisma.prestazioneOccasionale.findMany({
      where,
      include: {
        artista: true,
        Batch: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    
    // Raggruppa per artista per la vista pagamenti
    const perArtista = new Map<string, any>()
    
    for (const p of prestazioni) {
      const cf = p.artista.codiceFiscale || p.artistaId
      
      if (!perArtista.has(cf)) {
        perArtista.set(cf, {
          artista: p.artista,
          prestazioni: [],
          totaleDaPagare: 0,
          totaleInAttesa: 0,
          totalePagato: 0,
        })
      }
      
      const gruppo = perArtista.get(cf)!
      gruppo.prestazioni.push(p)
      
      if (p.stato === 'PAGABILE' || p.stato === 'IN_DISTINTA') {
        gruppo.totaleDaPagare += parseFloat(p.totalePagato as any)
      } else if (p.stato === 'GENERATA' || p.stato === 'SOLLECITATA') {
        gruppo.totaleInAttesa += parseFloat(p.totalePagato as any)
      } else if (p.stato === 'PAGATA') {
        gruppo.totalePagato += parseFloat(p.totalePagato as any)
      }
    }
    
    return NextResponse.json({
      prestazioni,
      perArtista: Array.from(perArtista.values()),
      totali: {
        totale: prestazioni.length,
        daGenerare: prestazioni.filter(p => p.stato === 'DA_GENERARE').length,
        inAttesaFirma: prestazioni.filter(p => p.stato === 'GENERATA' || p.stato === 'SOLLECITATA').length,
        pagabili: prestazioni.filter(p => p.stato === 'PAGABILE').length,
        inDistinta: prestazioni.filter(p => p.stato === 'IN_DISTINTA').length,
        pagate: prestazioni.filter(p => p.stato === 'PAGATA').length,
      }
    })
    
  } catch (error) {
    console.error('Errore GET prestazioni:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero prestazioni' },
      { status: 500 }
    )
  }
}
