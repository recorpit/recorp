// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET - Statistiche dashboard
export async function GET(request: NextRequest) {
  try {
    const oggi = new Date()
    oggi.setHours(0, 0, 0, 0)
    
    const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1)
    const fineMese = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0, 23, 59, 59)
    
    const inizioAnno = new Date(oggi.getFullYear(), 0, 1)
    const fineAnno = new Date(oggi.getFullYear(), 11, 31, 23, 59, 59)
    
    // Statistiche generali
    const [
      totaleArtisti,
      artistiNonIscritti,
      totaleLocali,
      totaleCommittenti,
      committentiRischio,
      totaleAgibilita,
      agibilitaBozza,
      agibilitaDatiIncompleti,
      agibilitaPronta,
      agibilitaInviataInps,
      agibilitaCompletata,
      agibilitaErrore,
      pagamentiDaPagare,
      pagamentiInAttesa,
      pagamentiScaduti,
      agibilitaMese,
      fatturatoMese,
      fatturatoAnno,
      bozzeAttive,
      prenotazioniAttive,
      // NUOVE STATISTICHE: Artisti in regola
      artistiInRegolaTotale,
      artistiInRegolaMese,
      artistiInRegolaAnno,
      artistiSingoliAnno,
    ] = await Promise.all([
      // Artisti
      prisma.artista.count(),
      prisma.artista.count({ where: { iscritto: false } }),
      
      // Locali
      prisma.locale.count(),
      
      // Committenti
      prisma.committente.count(),
      prisma.committente.count({ where: { aRischio: true } }),
      
      // Agibilità per stato
      prisma.agibilita.count(),
      prisma.agibilita.count({ where: { stato: 'BOZZA' } }),
      prisma.agibilita.count({ where: { stato: 'DATI_INCOMPLETI' } }),
      prisma.agibilita.count({ where: { stato: 'PRONTA' } }),
      prisma.agibilita.count({ where: { stato: 'INVIATA_INPS' } }),
      prisma.agibilita.count({ where: { stato: 'COMPLETATA' } }),
      prisma.agibilita.count({ where: { stato: 'ERRORE' } }),
      
      // Pagamenti - ora sono in ArtistaAgibilita
      prisma.agibilita.count({ 
        where: { 
          artisti: { 
            some: { statoPagamento: 'DA_PAGARE' } 
          } 
        } 
      }),
      prisma.agibilita.count({ 
        where: { 
          artisti: { 
            some: { statoPagamento: 'IN_ATTESA_INCASSO' } 
          } 
        } 
      }),
      prisma.agibilita.count({ 
        where: { 
          artisti: { 
            some: { 
              statoPagamento: 'DA_PAGARE',
              scadenzaPagamento: { lt: oggi }
            } 
          } 
        } 
      }),
      
      // Agibilità del mese
      prisma.agibilita.count({
        where: {
          data: { gte: inizioMese, lte: fineMese }
        }
      }),
      
      // Fatturato mese
      prisma.agibilita.aggregate({
        where: {
          data: { gte: inizioMese, lte: fineMese },
          stato: { not: 'ERRORE' }
        },
        _sum: { importoFattura: true }
      }),
      
      // Fatturato anno
      prisma.agibilita.aggregate({
        where: {
          data: { gte: inizioAnno, lte: fineAnno },
          stato: { not: 'ERRORE' }
        },
        _sum: { importoFattura: true }
      }),
      
      // Bozze attive
      prisma.bozzaAgibilita.count({
        where: { stato: 'IN_LAVORAZIONE' }
      }),
      
      // Prenotazioni numeri attive
      prisma.prenotazioneNumero.count({
        where: {
          confermato: false,
          scadeAt: { gte: oggi }
        }
      }),
      
      // NUOVE QUERY: Artisti in regola (ogni presenza = 1 documento)
      // Totale presenze artisti (tutti i tempi)
      prisma.artistaAgibilita.count({
        where: {
          agibilita: { stato: 'COMPLETATA' }
        }
      }),
      
      // Presenze artisti nel mese corrente
      prisma.artistaAgibilita.count({
        where: {
          agibilita: {
            stato: 'COMPLETATA',
            data: { gte: inizioMese, lte: fineMese }
          }
        }
      }),
      
      // Presenze artisti nell'anno corrente
      prisma.artistaAgibilita.count({
        where: {
          agibilita: {
            stato: 'COMPLETATA',
            data: { gte: inizioAnno, lte: fineAnno }
          }
        }
      }),
      
      // Artisti singoli (unici) nell'anno
      prisma.artistaAgibilita.groupBy({
        by: ['artistaId'],
        where: {
          agibilita: {
            stato: 'COMPLETATA',
            data: { gte: inizioAnno, lte: fineAnno }
          }
        }
      }),
    ])
    
    // Calcola numero agibilità completate per la media
    const agibilitaCompletateAnno = await prisma.agibilita.count({
      where: {
        stato: 'COMPLETATA',
        data: { gte: inizioAnno, lte: fineAnno }
      }
    })
    
    const agibilitaCompletateMese = await prisma.agibilita.count({
      where: {
        stato: 'COMPLETATA',
        data: { gte: inizioMese, lte: fineMese }
      }
    })
    
    // Top 5 committenti per fatturato
    const topCommittenti = await prisma.agibilita.groupBy({
      by: ['committenteId'],
      _sum: { importoFattura: true },
      _count: { id: true },
      where: {
        data: { gte: inizioAnno, lte: fineAnno },
        stato: { not: 'ERRORE' }
      },
      orderBy: {
        _sum: { importoFattura: 'desc' }
      },
      take: 5,
    })
    
    // Arricchisci con nomi committenti
    const committentiIds = topCommittenti.map((c: any) => c.committenteId)
    const committenti = await prisma.committente.findMany({
      where: { id: { in: committentiIds.filter((id: any): id is string => id !== null) } },
      select: { id: true, ragioneSociale: true }
    })
    
    const topCommittentiConNome = topCommittenti.map((c: any) => ({
      ...c,
      ragioneSociale: committenti.find((comm: any) => comm.id === c.committenteId)?.ragioneSociale || 'N/A',
      fatturato: parseFloat(c._sum.importoFattura?.toString() || '0'),
    }))
    
    // Prossime scadenze pagamento - ora in ArtistaAgibilita
    const prossimiPagamentiArtisti = await prisma.artistaAgibilita.findMany({
      where: {
        statoPagamento: 'DA_PAGARE',
        scadenzaPagamento: { gte: oggi }
      },
      orderBy: { scadenzaPagamento: 'asc' },
      take: 5,
      include: {
        artista: { select: { nome: true, cognome: true, nomeDarte: true } },
        agibilita: { 
          select: { 
            id: true, 
            codice: true,
            locale: { select: { nome: true } }
          } 
        },
      }
    })
    
    return NextResponse.json({
      anagrafiche: {
        totaleArtisti,
        artistiNonIscritti,
        totaleLocali,
        totaleCommittenti,
        committentiRischio,
      },
      agibilita: {
        totale: totaleAgibilita,
        perStato: {
          bozza: agibilitaBozza,
          datiIncompleti: agibilitaDatiIncompleti,
          pronta: agibilitaPronta,
          inviataInps: agibilitaInviataInps,
          completata: agibilitaCompletata,
          errore: agibilitaErrore,
        },
        mese: agibilitaMese,
      },
      // NUOVA SEZIONE: Artisti in regola
      artistiInRegola: {
        // Presenze totali (ogni riga ArtistaAgibilita = 1 documento)
        presenzeTotali: artistiInRegolaTotale,
        presenzeMese: artistiInRegolaMese,
        presenzeAnno: artistiInRegolaAnno,
        // Artisti unici nell'anno
        artistiSingoliAnno: artistiSingoliAnno.length,
        // Numero documenti (agibilità completate)
        documentiAnno: agibilitaCompletateAnno,
        documentiMese: agibilitaCompletateMese,
        // Media artisti per documento
        mediaPerDocumentoAnno: agibilitaCompletateAnno > 0 
          ? Math.round((artistiInRegolaAnno / agibilitaCompletateAnno) * 100) / 100 
          : 0,
        mediaPerDocumentoMese: agibilitaCompletateMese > 0 
          ? Math.round((artistiInRegolaMese / agibilitaCompletateMese) * 100) / 100 
          : 0,
      },
      pagamenti: {
        daPagare: pagamentiDaPagare,
        inAttesa: pagamentiInAttesa,
        scaduti: pagamentiScaduti,
      },
      fatturato: {
        mese: parseFloat(fatturatoMese._sum.importoFattura?.toString() || '0'),
        anno: parseFloat(fatturatoAnno._sum.importoFattura?.toString() || '0'),
      },
      inLavorazione: {
        bozze: bozzeAttive,
        prenotazioni: prenotazioniAttive,
      },
      topCommittenti: topCommittentiConNome,
      prossimiPagamenti: prossimiPagamentiArtisti.map((p: any) => ({
        id: p.agibilita.id,
        codice: p.agibilita.codice,
        artista: p.artista.nomeDarte || `${p.artista.nome} ${p.artista.cognome}`,
        locale: p.agibilita.locale.nome,
        importo: parseFloat(p.compensoNetto.toString()),
        scadenza: p.scadenzaPagamento,
      })),
    })
    
  } catch (error) {
    console.error('Errore dashboard:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero delle statistiche' },
      { status: 500 }
    )
  }
}
