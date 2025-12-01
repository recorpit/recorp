// src/app/api/pagamenti/presenze/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Lista presenze mensili
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const anno = parseInt(searchParams.get('anno') || new Date().getFullYear().toString())
    const mese = parseInt(searchParams.get('mese') || (new Date().getMonth() + 1).toString())
    const tipoContratto = searchParams.get('tipoContratto') // A_CHIAMATA o FULL_TIME
    
    // Prima troviamo tutti gli artisti con contratto
    const where: any = {
      tipoContratto: {
        in: ['A_CHIAMATA', 'FULL_TIME']
      }
    }
    
    if (tipoContratto) {
      where.tipoContratto = tipoContratto
    }
    
    const artisti = await prisma.artista.findMany({
      where,
      orderBy: { cognome: 'asc' }
    })
    
    // Cerca presenze esistenti
    const presenze = await prisma.presenzaMensile.findMany({
      where: {
        artistaId: { in: artisti.map(a => a.id) },
        anno,
        mese,
      }
    })
    
    const presenzeMap = new Map<string, any>()
    for (const p of presenze) {
      presenzeMap.set(p.artistaId, p)
    }
    
    // Calcola giorni lavorati dalle agibilità
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
            artistaId: { in: artisti.map(a => a.id) }
          }
        }
      },
      include: {
        artisti: {
          include: {
            artista: true
          }
        },
        locale: true,
      }
    })
    
    // Raggruppa agibilità per artista
    const agibilitaPerArtista = new Map<string, any[]>()
    for (const ag of agibilita) {
      for (const aa of ag.artisti) {
        if (!agibilitaPerArtista.has(aa.artistaId)) {
          agibilitaPerArtista.set(aa.artistaId, [])
        }
        agibilitaPerArtista.get(aa.artistaId)!.push({
          data: ag.data,
          locale: ag.locale.nome,
          ore: 8, // Default, può essere personalizzato
        })
      }
    }
    
    // Costruisci risultato
    const risultati = artisti.map(artista => {
      const presenza = presenzeMap.get(artista.id)
      const giorniDaAgibilita = agibilitaPerArtista.get(artista.id) || []
      
      const totaleGiorni = presenza?.totaleGiorni || giorniDaAgibilita.length
      const totaleOre = presenza?.totaleOre || giorniDaAgibilita.length * 8
      
      // Calcola importo
      let importoTotale = 0
      if (artista.tipoContratto === 'A_CHIAMATA' && artista.cachetBase) {
        importoTotale = totaleGiorni * parseFloat(artista.cachetBase.toString())
      } else if (artista.tipoContratto === 'FULL_TIME' && artista.cachetBase) {
        importoTotale = parseFloat(artista.cachetBase.toString())
      }
      
      return {
        artista,
        presenza,
        giorniDaAgibilita,
        totaleGiorni,
        totaleOre,
        importoTotale,
      }
    })
    
    // Stats
    const stats = {
      totaleArtisti: risultati.length,
      aChiamata: risultati.filter(r => r.artista.tipoContratto === 'A_CHIAMATA').length,
      fullTime: risultati.filter(r => r.artista.tipoContratto === 'FULL_TIME').length,
      daConfermare: risultati.filter(r => !r.presenza || r.presenza.stato === 'IN_CORSO').length,
      confermate: risultati.filter(r => r.presenza?.stato === 'CONFERMATA').length,
      totaleDaPagare: risultati
        .filter(r => r.presenza?.stato === 'CONFERMATA')
        .reduce((sum, r) => sum + r.importoTotale, 0),
    }
    
    return NextResponse.json({
      anno,
      mese,
      artisti: risultati,
      stats
    })
    
  } catch (error) {
    console.error('Errore GET presenze:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero presenze' },
      { status: 500 }
    )
  }
}

// POST - Crea/aggiorna presenza mensile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      artistaId, 
      anno, 
      mese, 
      giorniLavorati, // Array di { data, ore, note }
      action, // 'save' | 'conferma'
    } = body
    
    if (!artistaId || !anno || !mese) {
      return NextResponse.json(
        { error: 'Dati obbligatori mancanti' },
        { status: 400 }
      )
    }
    
    // Verifica artista
    const artista = await prisma.artista.findUnique({
      where: { id: artistaId }
    })
    
    if (!artista || !['A_CHIAMATA', 'FULL_TIME'].includes(artista.tipoContratto)) {
      return NextResponse.json(
        { error: 'Artista non trovato o tipo contratto non valido' },
        { status: 400 }
      )
    }
    
    // Calcola totali
    const giorni = giorniLavorati || []
    const totaleGiorni = giorni.length
    const totaleOre = giorni.reduce((sum: number, g: any) => sum + (g.ore || 8), 0)
    
    // Calcola importo
    let importoTotale = 0
    const tariffa = artista.cachetBase ? parseFloat(artista.cachetBase.toString()) : 0
    
    if (artista.tipoContratto === 'A_CHIAMATA') {
      importoTotale = totaleGiorni * tariffa
    } else {
      importoTotale = tariffa
    }
    
    // Stato
    const stato = action === 'conferma' ? 'CONFERMATA' : 'IN_CORSO'
    
    // Upsert presenza
    const presenza = await prisma.presenzaMensile.upsert({
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
        tipoContratto: artista.tipoContratto,
        giorniLavorati: giorni,
        totaleGiorni,
        totaleOre,
        importoGiornaliero: artista.tipoContratto === 'A_CHIAMATA' ? tariffa : null,
        importoTotale,
        stato,
        dataConferma: action === 'conferma' ? new Date() : null,
      },
      update: {
        giorniLavorati: giorni,
        totaleGiorni,
        totaleOre,
        importoTotale,
        stato,
        dataConferma: action === 'conferma' ? new Date() : undefined,
      },
      include: {
        artista: true,
      }
    })
    
    return NextResponse.json({
      success: true,
      presenza
    })
    
  } catch (error) {
    console.error('Errore POST presenza:', error)
    return NextResponse.json(
      { error: 'Errore nel salvataggio presenza' },
      { status: 500 }
    )
  }
}
