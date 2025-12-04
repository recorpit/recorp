// src/app/api/pagamenti/fulltime/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Lista calcoli mensili full time
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const anno = searchParams.get('anno') ? parseInt(searchParams.get('anno')!) : new Date().getFullYear()
    const mese = searchParams.get('mese') ? parseInt(searchParams.get('mese')!) : new Date().getMonth() + 1
    const artistaId = searchParams.get('artistaId')
    const stato = searchParams.get('stato')
    const ricalcola = searchParams.get('ricalcola') === 'true'
    
    // Se richiesto ricalcolo, esegui prima il calcolo
    if (ricalcola) {
      await ricalcolaCalcoliMensili(anno, mese, artistaId || undefined)
    }
    
    const where: any = { anno, mese }
    if (artistaId) where.artistaId = artistaId
    if (stato) where.stato = stato
    
    const calcoli = await prisma.calcoloMensileFullTime.findMany({
      where,
      include: {
        artista: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            nomeDarte: true,
            email: true,
            codiceFiscale: true,
            tipoContratto: true,
          }
        },
        dettagliPresenze: {
          orderBy: { dataAgibilita: 'asc' }
        },
        rimborsiSpesa: {
          orderBy: { data: 'asc' }
        },
        _count: {
          select: {
            dettagliPresenze: true,
            rimborsiSpesa: true,
          }
        }
      },
      orderBy: [
        { artista: { cognome: 'asc' } },
        { artista: { nome: 'asc' } },
      ]
    })
    
    // Calcola totali
    const totali = {
      numeroArtisti: calcoli.length,
      totaleStipendiFissi: calcoli.reduce((s, c) => s + Number(c.stipendioFisso), 0),
      totaleNettoAgibilita: calcoli.reduce((s, c) => s + Number(c.totaleNettoAgibilita), 0),
      totaleGettoniAgenzia: calcoli.reduce((s, c) => s + Number(c.totaleGettoniAgenzia), 0),
      totaleNettoPerBustaPaga: calcoli.reduce((s, c) => s + Number(c.nettoPerBustaPaga), 0),
      totaleRimborsi: calcoli.reduce((s, c) => s + Number(c.totaleRimborsiSpesa), 0),
      totaleBustePaga: calcoli.reduce((s, c) => s + Number(c.totaleBustaPaga), 0),
      totaleCostoLordo: calcoli.reduce((s, c) => s + Number(c.costoLordoAzienda || 0), 0),
    }
    
    return NextResponse.json({
      anno,
      mese,
      calcoli,
      totali,
    })
  } catch (error) {
    console.error('Errore GET calcoli full time:', error)
    return NextResponse.json({ error: 'Errore nel recupero dati' }, { status: 500 })
  }
}

// Funzione per ricalcolare i calcoli mensili
async function ricalcolaCalcoliMensili(anno: number, mese: number, artistaId?: string) {
  // Trova tutti gli artisti full time
  const whereArtista: any = { tipoContratto: 'FULL_TIME', attivo: true }
  if (artistaId) whereArtista.id = artistaId
  
  const artistiFullTime = await prisma.artista.findMany({
    where: whereArtista,
    include: {
      configGettone: true,
    }
  })
  
  // Date del mese
  const inizioMese = new Date(anno, mese - 1, 1)
  const fineMese = new Date(anno, mese, 0, 23, 59, 59)
  
  for (const artista of artistiFullTime) {
    // Trova agibilità del mese per questo artista
    const agibilitaMese = await prisma.artistaAgibilita.findMany({
      where: {
        artistaId: artista.id,
        agibilita: {
          stato: 'COMPLETATA',
          data: {
            gte: inizioMese,
            lte: fineMese,
          }
        }
      },
      include: {
        agibilita: {
          include: {
            locale: { select: { nome: true, tipoLocale: true } },
            format: { select: { nome: true } },
          }
        }
      }
    })
    
    // Configurazione gettoni
    const config = artista.configGettone
    const gettoneBase = config ? Number(config.gettoneBase) : 50
    const gettoniPerTipoEvento = config?.gettoniPerTipoEvento as Record<string, number> || {}
    const gettoniPerTipoLocale = config?.gettoniPerTipoLocale as Record<string, number> || {}
    const stipendioFisso = config ? Number(config.stipendioFissoMensile) : 0
    
    // Calcola totali e dettagli
    let totaleNetto = 0
    let totaleGettoni = 0
    const dettagli: any[] = []
    
    for (const aa of agibilitaMese) {
      const compensoNetto = Number(aa.compensoNetto || 0)
      const tipoLocale = aa.agibilita.locale?.tipoLocale
      const tipoEvento = aa.agibilita.format?.nome // Usa format come tipo evento
      
      // Determina gettone (priorità: tipo evento > tipo locale > base)
      let gettone = gettoneBase
      if (tipoEvento && gettoniPerTipoEvento[tipoEvento]) {
        gettone = gettoniPerTipoEvento[tipoEvento]
      } else if (tipoLocale && gettoniPerTipoLocale[tipoLocale]) {
        gettone = gettoniPerTipoLocale[tipoLocale]
      }
      
      const nettoPerBusta = Math.max(0, compensoNetto - gettone)
      
      totaleNetto += compensoNetto
      totaleGettoni += gettone
      
      dettagli.push({
        artistaAgibilitaId: aa.id,
        dataAgibilita: aa.agibilita.data,
        localeNome: aa.agibilita.locale?.nome,
        tipoEvento: tipoEvento || tipoLocale || null,
        compensoNetto,
        gettoneAgenzia: gettone,
        nettoPerBustaPaga: nettoPerBusta,
      })
    }
    
    // Trova rimborsi spesa già inseriti per il mese
    const rimborsi = await prisma.rimborsoSpesa.findMany({
      where: {
        artistaId: artista.id,
        data: {
          gte: inizioMese,
          lte: fineMese,
        }
      }
    })
    const totaleRimborsi = rimborsi.reduce((s, r) => s + Number(r.importo), 0)
    
    // Calcola totale busta paga
    const nettoPerBustaPaga = totaleNetto - totaleGettoni
    const totaleBustaPaga = stipendioFisso + nettoPerBustaPaga + totaleRimborsi
    
    // Upsert calcolo mensile
    const calcolo = await prisma.calcoloMensileFullTime.upsert({
      where: {
        artistaId_anno_mese: {
          artistaId: artista.id,
          anno,
          mese,
        }
      },
      update: {
        stipendioFisso,
        totaleNettoAgibilita: totaleNetto,
        totaleGettoniAgenzia: totaleGettoni,
        nettoPerBustaPaga,
        numeroPresenze: agibilitaMese.length,
        totaleRimborsiSpesa: totaleRimborsi,
        totaleBustaPaga,
      },
      create: {
        artistaId: artista.id,
        anno,
        mese,
        stato: 'DA_ELABORARE',
        stipendioFisso,
        totaleNettoAgibilita: totaleNetto,
        totaleGettoniAgenzia: totaleGettoni,
        nettoPerBustaPaga,
        numeroPresenze: agibilitaMese.length,
        totaleRimborsiSpesa: totaleRimborsi,
        totaleBustaPaga,
      }
    })
    
    // Elimina vecchi dettagli e ricrea
    await prisma.dettaglioPresenzaFullTime.deleteMany({
      where: { calcoloMensileId: calcolo.id }
    })
    
    if (dettagli.length > 0) {
      await prisma.dettaglioPresenzaFullTime.createMany({
        data: dettagli.map(d => ({
          ...d,
          calcoloMensileId: calcolo.id,
        }))
      })
    }
    
    // Aggiorna riferimento rimborsi
    await prisma.rimborsoSpesa.updateMany({
      where: {
        artistaId: artista.id,
        data: {
          gte: inizioMese,
          lte: fineMese,
        }
      },
      data: { calcoloMensileId: calcolo.id }
    })
  }
}

// POST - Forza ricalcolo per un mese specifico
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { anno, mese, artistaId } = body
    
    if (!anno || !mese) {
      return NextResponse.json({ error: 'Anno e mese sono obbligatori' }, { status: 400 })
    }
    
    await ricalcolaCalcoliMensili(anno, mese, artistaId)
    
    return NextResponse.json({ 
      success: true, 
      message: `Calcoli rielaborati per ${mese}/${anno}` 
    })
  } catch (error) {
    console.error('Errore POST ricalcolo:', error)
    return NextResponse.json({ error: 'Errore nel ricalcolo' }, { status: 500 })
  }
}
