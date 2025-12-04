// src/app/api/pagamenti/piva/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Lista raggruppamenti P.IVA con filtri
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stato = searchParams.get('stato')
    const artistaId = searchParams.get('artistaId')
    const daTriggerare = searchParams.get('daTriggerare') === 'true'
    
    // Se richiesto, trova artisti P.IVA che necessitano di richiesta fattura
    if (daTriggerare) {
      return await getArtistiDaTriggerare()
    }
    
    const where: any = {}
    if (stato) where.stato = stato
    if (artistaId) where.artistaId = artistaId
    
    const raggruppamenti = await prisma.raggruppamentoCompensoPIVA.findMany({
      where,
      include: {
        artista: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            nomeDarte: true,
            email: true,
            partitaIva: true,
            applicaRitenuta4: true,
            iban: true,
          }
        },
        agibilitaCollegate: {
          include: {
            artistaAgibilita: {
              include: {
                agibilita: {
                  select: {
                    id: true,
                    codice: true,
                    data: true,
                    locale: { select: { nome: true } }
                  }
                }
              }
            }
          }
        },
        _count: {
          select: { agibilitaCollegate: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(raggruppamenti)
  } catch (error) {
    console.error('Errore GET raggruppamenti P.IVA:', error)
    return NextResponse.json({ error: 'Errore nel recupero dati' }, { status: 500 })
  }
}

// Funzione per trovare artisti P.IVA che hanno compensi da raggruppare
async function getArtistiDaTriggerare() {
  try {
    // Carica impostazioni
    const impostazioni = await prisma.impostazioniPagamenti.findFirst({
      where: { id: 'default' }
    }) || { pivaGiorniTrigger: 30, pivaImportoMinimo: 100, pivaApplicaRitenuta4: true }
    
    const giorniTrigger = impostazioni.pivaGiorniTrigger
    const importoMinimo = Number(impostazioni.pivaImportoMinimo)
    
    const dataTrigger = new Date()
    dataTrigger.setDate(dataTrigger.getDate() - giorniTrigger)
    
    // Trova artisti P.IVA con agibilità completate non ancora raggruppate
    const artistiPIVA = await prisma.artista.findMany({
      where: {
        tipoContratto: 'P_IVA',
        attivo: true,
      },
      include: {
        agibilita: {
          where: {
            raggruppamentoPIVAId: null,  // Non ancora in un raggruppamento
            agibilita: {
              stato: 'COMPLETATA',
            }
          },
          include: {
            agibilita: {
              select: {
                id: true,
                codice: true,
                data: true,
                locale: { select: { nome: true } }
              }
            }
          }
        }
      }
    })
    
    // Calcola totali per artista e determina se va triggerato
    const risultato = artistiPIVA
      .map(artista => {
        const agibilitaNonRaggruppate = artista.agibilita || []
        const totaleNetto = agibilitaNonRaggruppate.reduce(
          (sum, aa) => sum + Number(aa.compensoNetto || 0), 
          0
        )
        
        // Trova data più vecchia
        const datePrestazioni = agibilitaNonRaggruppate
          .map(aa => new Date(aa.agibilita.data))
          .sort((a, b) => a.getTime() - b.getTime())
        
        const dataPiuVecchia = datePrestazioni[0]
        const giorniPassati = dataPiuVecchia 
          ? Math.floor((Date.now() - dataPiuVecchia.getTime()) / (1000 * 60 * 60 * 24))
          : 0
        
        // Trigger: importo >= minimo OPPURE giorni >= trigger
        const daTriggerare = totaleNetto >= importoMinimo || giorniPassati >= giorniTrigger
        const motivoTrigger = totaleNetto >= importoMinimo 
          ? 'IMPORTO' 
          : giorniPassati >= giorniTrigger 
            ? 'TEMPO' 
            : null
        
        return {
          artista: {
            id: artista.id,
            nome: artista.nome,
            cognome: artista.cognome,
            nomeDarte: artista.nomeDarte,
            email: artista.email,
            partitaIva: artista.partitaIva,
            applicaRitenuta4: artista.applicaRitenuta4,
            iban: artista.iban,
          },
          agibilitaNonRaggruppate: agibilitaNonRaggruppate.map(aa => ({
            id: aa.id,
            compensoNetto: Number(aa.compensoNetto),
            agibilita: aa.agibilita
          })),
          totaleNetto,
          numeroAgibilita: agibilitaNonRaggruppate.length,
          dataPiuVecchia,
          giorniPassati,
          daTriggerare,
          motivoTrigger,
        }
      })
      .filter(r => r.numeroAgibilita > 0)
      .sort((a, b) => b.totaleNetto - a.totaleNetto)
    
    return NextResponse.json({
      impostazioni: {
        giorniTrigger,
        importoMinimo,
      },
      artisti: risultato,
      totaleArtisti: risultato.length,
      artistiDaTriggerare: risultato.filter(r => r.daTriggerare).length,
    })
  } catch (error) {
    console.error('Errore getArtistiDaTriggerare:', error)
    return NextResponse.json({ error: 'Errore nel calcolo' }, { status: 500 })
  }
}

// POST - Crea nuovo raggruppamento P.IVA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artistaId, artistaAgibilitaIds } = body
    
    if (!artistaId || !artistaAgibilitaIds?.length) {
      return NextResponse.json({ 
        error: 'artistaId e artistaAgibilitaIds sono obbligatori' 
      }, { status: 400 })
    }
    
    // Verifica artista P.IVA
    const artista = await prisma.artista.findUnique({
      where: { id: artistaId }
    })
    
    if (!artista || artista.tipoContratto !== 'P_IVA') {
      return NextResponse.json({ 
        error: 'Artista non trovato o non è P.IVA' 
      }, { status: 400 })
    }
    
    // Carica agibilità
    const agibilita = await prisma.artistaAgibilita.findMany({
      where: {
        id: { in: artistaAgibilitaIds },
        artistaId,
        raggruppamentoPIVAId: null,
      },
      include: {
        agibilita: true
      }
    })
    
    if (agibilita.length === 0) {
      return NextResponse.json({ 
        error: 'Nessuna agibilità valida trovata' 
      }, { status: 400 })
    }
    
    // Calcola totali
    const totaleNetto = agibilita.reduce(
      (sum, aa) => sum + Number(aa.compensoNetto || 0), 
      0
    )
    
    // Calcola ritenuta 4% se applicabile
    const applicaRitenuta4 = artista.applicaRitenuta4 || false
    const totaleRitenuta4 = applicaRitenuta4 ? totaleNetto * 0.04 : 0
    const totaleImponibile = totaleNetto + totaleRitenuta4
    
    // Trova periodo
    const date = agibilita.map(aa => new Date(aa.agibilita.data))
    const periodoInizio = new Date(Math.min(...date.map(d => d.getTime())))
    const periodoFine = new Date(Math.max(...date.map(d => d.getTime())))
    
    // Crea raggruppamento
    const raggruppamento = await prisma.raggruppamentoCompensoPIVA.create({
      data: {
        artistaId,
        stato: 'DA_RICHIEDERE',
        periodoInizio,
        periodoFine,
        totaleNetto,
        totaleRitenuta4,
        totaleImponibile,
        numeroAgibilita: agibilita.length,
      }
    })
    
    // Collega agibilità
    await prisma.agibilitaRaggruppamento.createMany({
      data: agibilita.map(aa => ({
        raggruppamentoId: raggruppamento.id,
        artistaAgibilitaId: aa.id,
        compensoNetto: aa.compensoNetto,
        ritenuta4: applicaRitenuta4 ? Number(aa.compensoNetto) * 0.04 : 0,
      }))
    })
    
    // Aggiorna riferimento sulle agibilità
    await prisma.artistaAgibilita.updateMany({
      where: { id: { in: artistaAgibilitaIds } },
      data: { raggruppamentoPIVAId: raggruppamento.id }
    })
    
    return NextResponse.json(raggruppamento, { status: 201 })
  } catch (error) {
    console.error('Errore POST raggruppamento P.IVA:', error)
    return NextResponse.json({ error: 'Errore nella creazione' }, { status: 500 })
  }
}
