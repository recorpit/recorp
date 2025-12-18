// src/app/api/pagamenti/fatture-piva/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Lista fatture P.IVA per mese
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const anno = parseInt(searchParams.get('anno') || new Date().getFullYear().toString())
    const mese = parseInt(searchParams.get('mese') || (new Date().getMonth() + 1).toString())
    const stato = searchParams.get('stato')
    
    // Prima troviamo tutti gli artisti P.IVA con agibilità nel mese
    const dataInizio = new Date(anno, mese - 1, 1)
    const dataFine = new Date(anno, mese, 0, 23, 59, 59)
    
    // Agibilità con artisti P.IVA
    const agibilita = await prisma.agibilita.findMany({
      where: {
        stato: 'COMPLETATA',
        data: {
          gte: dataInizio,
          lte: dataFine,
        },
        artisti: {
          some: {
            artista: {
              tipoContratto: 'P_IVA'
            }
          }
        }
      },
      include: {
        artisti: {
          where: {
            artista: {
              tipoContratto: 'P_IVA'
            }
          },
          include: {
            artista: true
          }
        },
        locale: true,
      }
    })
    
    // Raggruppa per artista
    const perArtistaMap = new Map<string, any>()
    
    for (const ag of agibilita) {
      for (const aa of ag.artisti) {
        const artistaId = aa.artistaId
        
        if (!perArtistaMap.has(artistaId)) {
          perArtistaMap.set(artistaId, {
            artista: aa.artista,
            agibilita: [],
            totaleCompetenze: 0,
            fattura: null, // Sarà popolato se esiste
          })
        }
        
        const gruppo = perArtistaMap.get(artistaId)!
        gruppo.agibilita.push({
          id: ag.id,
          data: ag.data,
          locale: ag.locale?.nome || 'N/D',
          compenso: aa.compensoLordo, // Per P.IVA usiamo il lordo
        })
        gruppo.totaleCompetenze += parseFloat(aa.compensoLordo.toString())
      }
    }
    
    // Cerca fatture esistenti per questi artisti
    const artistiIds = Array.from(perArtistaMap.keys())
    
    const fatture = await prisma.fatturaArtista.findMany({
      where: {
        artistaId: { in: artistiIds },
        anno,
        mese,
      }
    })
    
    // Associa fatture
    for (const fattura of fatture) {
      const gruppo = perArtistaMap.get(fattura.artistaId)
      if (gruppo) {
        gruppo.fattura = fattura
      }
    }
    
    // Converti in array e filtra per stato se richiesto
    let risultati = Array.from(perArtistaMap.values())
    
    if (stato) {
      if (stato === 'ATTESA_FATTURA') {
        risultati = risultati.filter(r => !r.fattura || r.fattura.stato === 'ATTESA_FATTURA')
      } else {
        risultati = risultati.filter(r => r.fattura?.stato === stato)
      }
    }
    
    // Statistiche
    const stats = {
      totaleArtisti: risultati.length,
      inAttesaFattura: risultati.filter(r => !r.fattura || r.fattura.stato === 'ATTESA_FATTURA').length,
      fattureRicevute: risultati.filter(r => r.fattura?.stato === 'FATTURA_RICEVUTA').length,
      daPagare: risultati.filter(r => r.fattura?.stato === 'FATTURA_RICEVUTA').reduce((sum, r) => sum + r.totaleCompetenze, 0),
      pagate: risultati.filter(r => r.fattura?.stato === 'PAGATA').length,
    }
    
    return NextResponse.json({
      anno,
      mese,
      artisti: risultati,
      stats
    })
    
  } catch (error) {
    console.error('Errore GET fatture P.IVA:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero fatture' },
      { status: 500 }
    )
  }
}

// POST - Segna fattura ricevuta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      artistaId, 
      anno, 
      mese, 
      numeroFattura, 
      dataFattura,
      fatturaPath,
    } = body
    
    if (!artistaId || !anno || !mese) {
      return NextResponse.json(
        { error: 'Dati obbligatori mancanti' },
        { status: 400 }
      )
    }
    
    // Verifica artista P.IVA
    const artista = await prisma.artista.findUnique({
      where: { id: artistaId }
    })
    
    if (!artista || artista.tipoContratto !== 'P_IVA') {
      return NextResponse.json(
        { error: 'Artista non trovato o non è P.IVA' },
        { status: 400 }
      )
    }
    
    // Calcola agibilità del mese
    const dataInizio = new Date(anno, mese - 1, 1)
    const dataFine = new Date(anno, mese, 0, 23, 59, 59)
    
    const agibilita = await prisma.agibilita.findMany({
      where: {
        stato: 'COMPLETATA',
        data: {
          gte: dataInizio,
          lte: dataFine,
        },
        artisti: {
          some: {
            artistaId
          }
        }
      },
      include: {
        artisti: {
          where: { artistaId }
        },
        locale: true,
      }
    })
    
    // Calcola totale
    let totale = 0
    const agibilitaIncluse: any[] = []
    
    for (const ag of agibilita) {
      const aa = ag.artisti[0]
      if (aa) {
        totale += parseFloat(aa.compensoLordo.toString())
        agibilitaIncluse.push({
          agibilitaId: ag.id,
          data: ag.data,
          locale: ag.locale?.nome || 'N/D',
          compenso: aa.compensoLordo,
        })
      }
    }
    
    // Crea o aggiorna fattura
    const fattura = await prisma.fatturaArtista.upsert({
      where: {
        artistaId_anno_mese: {
          artistaId,
          anno,
          mese,
        }
      },
      create: {
        artistaId,
        anno,
        mese,
        importoTotale: totale,
        agibilitaIncluse,
        numeroFattura,
        dataFattura: dataFattura ? new Date(dataFattura) : null,
        fatturaPath,
        stato: 'FATTURA_RICEVUTA',
        dataRicezione: new Date(),
        dataScadenza: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni
      },
      update: {
        numeroFattura,
        dataFattura: dataFattura ? new Date(dataFattura) : null,
        fatturaPath,
        stato: 'FATTURA_RICEVUTA',
        dataRicezione: new Date(),
      },
      include: {
        artista: true,
      }
    })
    
    return NextResponse.json({
      success: true,
      fattura
    })
    
  } catch (error) {
    console.error('Errore POST fattura P.IVA:', error)
    return NextResponse.json(
      { error: 'Errore nel salvataggio fattura' },
      { status: 500 }
    )
  }
}
