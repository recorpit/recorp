// src/app/api/committenti/[id]/statistiche/route.ts
// API Statistiche Committente - Anno corrente vs precedente

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ============================================
// GET - Statistiche committente
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Verifica esistenza committente
    const committente = await prisma.committente.findUnique({
      where: { id }
    });
    
    if (!committente) {
      return NextResponse.json(
        { error: 'Committente non trovato' },
        { status: 404 }
      );
    }
    
    const annoCorrente = new Date().getFullYear();
    const annoPrecedente = annoCorrente - 1;
    
    // Date range anno corrente
    const inizioAnnoCorrente = new Date(annoCorrente, 0, 1);
    const fineAnnoCorrente = new Date(annoCorrente, 11, 31, 23, 59, 59);
    
    // Date range anno precedente
    const inizioAnnoPrecedente = new Date(annoPrecedente, 0, 1);
    const fineAnnoPrecedente = new Date(annoPrecedente, 11, 31, 23, 59, 59);
    
    // ============================================
    // STATISTICHE ANNO CORRENTE
    // ============================================
    
    // 1. Conteggio artisti (somma di tutti gli artisti in tutte le agibilità)
    const artistiAnnoCorrente = await prisma.artistaAgibilita.count({
      where: {
        agibilita: {
          committenteId: id,
          data: {
            gte: inizioAnnoCorrente,
            lte: fineAnnoCorrente,
          }
        }
      }
    });
    
    // 2. Fatturato (totale fatture PAGATE)
    const fatturatoAnnoCorrente = await prisma.fattura.aggregate({
      where: {
        committenteId: id,
        stato: 'PAGATA',
        anno: annoCorrente,
      },
      _sum: {
        totale: true,
      }
    });
    
    // 3. Quote fisse totali (somma quotaAgenzia * numero artisti per ogni agibilità)
    const agibilitaAnnoCorrente = await prisma.agibilita.findMany({
      where: {
        committenteId: id,
        data: {
          gte: inizioAnnoCorrente,
          lte: fineAnnoCorrente,
        }
      },
      include: {
        _count: {
          select: { artisti: true }
        }
      }
    });
    
    const quoteFisseAnnoCorrente = agibilitaAnnoCorrente.reduce((sum, agi) => {
      // quotaAgenzia è per artista, moltiplica per numero artisti
      return sum + (Number(committente.quotaAgenzia) * agi._count.artisti);
    }, 0);
    
    // ============================================
    // STATISTICHE ANNO PRECEDENTE
    // ============================================
    
    // 1. Conteggio artisti anno precedente
    const artistiAnnoPrecedente = await prisma.artistaAgibilita.count({
      where: {
        agibilita: {
          committenteId: id,
          data: {
            gte: inizioAnnoPrecedente,
            lte: fineAnnoPrecedente,
          }
        }
      }
    });
    
    // 2. Fatturato anno precedente
    const fatturatoAnnoPrecedente = await prisma.fattura.aggregate({
      where: {
        committenteId: id,
        stato: 'PAGATA',
        anno: annoPrecedente,
      },
      _sum: {
        totale: true,
      }
    });
    
    // 3. Quote fisse anno precedente
    const agibilitaAnnoPrecedente = await prisma.agibilita.findMany({
      where: {
        committenteId: id,
        data: {
          gte: inizioAnnoPrecedente,
          lte: fineAnnoPrecedente,
        }
      },
      include: {
        _count: {
          select: { artisti: true }
        }
      }
    });
    
    const quoteFisseAnnoPrecedente = agibilitaAnnoPrecedente.reduce((sum, agi) => {
      return sum + (Number(committente.quotaAgenzia) * agi._count.artisti);
    }, 0);
    
    // ============================================
    // CALCOLA PERCENTUALI VARIAZIONE
    // ============================================
    
    const calcolaVariazione = (corrente: number, precedente: number): number | null => {
      if (precedente === 0) {
        return corrente > 0 ? 100 : null; // Se precedente era 0, non c'è confronto significativo
      }
      return Math.round(((corrente - precedente) / precedente) * 100);
    };
    
    const fatturatoCor = Number(fatturatoAnnoCorrente._sum.totale || 0);
    const fatturatoPrec = Number(fatturatoAnnoPrecedente._sum.totale || 0);
    
    // ============================================
    // STATISTICHE AGGIUNTIVE
    // ============================================
    
    // Conteggio agibilità
    const agibilitaCountCorrente = agibilitaAnnoCorrente.length;
    const agibilitaCountPrecedente = agibilitaAnnoPrecedente.length;
    
    // Fatture da incassare (EMESSA o INVIATA)
    const fattureNonPagate = await prisma.fattura.aggregate({
      where: {
        committenteId: id,
        stato: { in: ['EMESSA', 'INVIATA'] },
      },
      _sum: {
        totale: true,
      },
      _count: true,
    });
    
    // ============================================
    // RESPONSE
    // ============================================
    
    return NextResponse.json({
      annoCorrente,
      annoPrecedente,
      
      statistiche: {
        artisti: {
          corrente: artistiAnnoCorrente,
          precedente: artistiAnnoPrecedente,
          variazione: calcolaVariazione(artistiAnnoCorrente, artistiAnnoPrecedente),
        },
        fatturato: {
          corrente: fatturatoCor,
          precedente: fatturatoPrec,
          variazione: calcolaVariazione(fatturatoCor, fatturatoPrec),
        },
        quoteFisse: {
          corrente: quoteFisseAnnoCorrente,
          precedente: quoteFisseAnnoPrecedente,
          variazione: calcolaVariazione(quoteFisseAnnoCorrente, quoteFisseAnnoPrecedente),
        },
        agibilita: {
          corrente: agibilitaCountCorrente,
          precedente: agibilitaCountPrecedente,
          variazione: calcolaVariazione(agibilitaCountCorrente, agibilitaCountPrecedente),
        },
      },
      
      inSospeso: {
        fatture: fattureNonPagate._count,
        importo: Number(fattureNonPagate._sum.totale || 0),
      },
      
      // Media per calcoli veloci
      mediaArtistiPerAgibilita: agibilitaCountCorrente > 0 
        ? Math.round(artistiAnnoCorrente / agibilitaCountCorrente * 10) / 10 
        : 0,
    });
    
  } catch (error) {
    console.error('Errore statistiche committente:', error);
    return NextResponse.json(
      { error: 'Errore nel calcolo delle statistiche' },
      { status: 500 }
    );
  }
}
