// src/app/api/pagamenti/solleciti/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Verifica prestazioni da sollecitare o scadute
export async function GET(request: NextRequest) {
  try {
    const oggi = new Date()
    const treGiorniFa = new Date(oggi.getTime() - 3 * 24 * 60 * 60 * 1000)
    
    // Prestazioni da sollecitare (generate da più di 3 giorni, non firmate)
    const daSollecitare = await prisma.prestazioneOccasionale.findMany({
      where: {
        stato: 'GENERATA',
        dataInvioLink: {
          lte: treGiorniFa
        },
        dataSollecito: null,
      },
      include: {
        artista: true,
      }
    })
    
    // Prestazioni con link scaduto
    const scadute = await prisma.prestazioneOccasionale.findMany({
      where: {
        stato: { in: ['GENERATA', 'SOLLECITATA'] },
        tokenScadenza: {
          lt: oggi
        }
      },
      include: {
        artista: true,
      }
    })
    
    // Prestazioni pagabili in scadenza (prossimi 3 giorni)
    const treGiorniDopo = new Date(oggi.getTime() + 3 * 24 * 60 * 60 * 1000)
    const pagamentiInScadenza = await prisma.prestazioneOccasionale.findMany({
      where: {
        stato: 'PAGABILE',
        dataScadenzaPagamento: {
          gte: oggi,
          lte: treGiorniDopo,
        }
      },
      include: {
        artista: true,
      }
    })
    
    // Pagamenti scaduti
    const pagamentiScaduti = await prisma.prestazioneOccasionale.findMany({
      where: {
        stato: 'PAGABILE',
        dataScadenzaPagamento: {
          lt: oggi
        }
      },
      include: {
        artista: true,
      }
    })
    
    return NextResponse.json({
      daSollecitare,
      scadute,
      pagamentiInScadenza,
      pagamentiScaduti,
      riepilogo: {
        daSollecitare: daSollecitare.length,
        linkScaduti: scadute.length,
        pagamentiInScadenza: pagamentiInScadenza.length,
        pagamentiScaduti: pagamentiScaduti.length,
      }
    })
    
  } catch (error) {
    console.error('Errore GET solleciti:', error)
    return NextResponse.json(
      { error: 'Errore nel controllo solleciti' },
      { status: 500 }
    )
  }
}

// POST - Invia solleciti
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, prestazioniIds } = body
    
    if (action === 'sollecita') {
      // Segna come sollecitate
      const updated = await prisma.prestazioneOccasionale.updateMany({
        where: {
          id: { in: prestazioniIds },
          stato: 'GENERATA',
        },
        data: {
          stato: 'SOLLECITATA',
          dataSollecito: new Date(),
        }
      })
      
      // TODO: Inviare email di sollecito
      
      return NextResponse.json({
        success: true,
        sollecitate: updated.count,
        message: `${updated.count} solleciti inviati`
      })
    }
    
    if (action === 'scadute') {
      // Segna link come scaduti
      const oggi = new Date()
      const updated = await prisma.prestazioneOccasionale.updateMany({
        where: {
          stato: { in: ['GENERATA', 'SOLLECITATA'] },
          tokenScadenza: { lt: oggi }
        },
        data: {
          stato: 'SCADUTA',
        }
      })
      
      return NextResponse.json({
        success: true,
        scadute: updated.count,
      })
    }
    
    return NextResponse.json(
      { error: 'Azione non valida' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Errore POST solleciti:', error)
    return NextResponse.json(
      { error: 'Errore nell\'invio solleciti' },
      { status: 500 }
    )
  }
}
