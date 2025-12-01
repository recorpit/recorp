// src/app/api/fatture/route.ts
// API Fatture - Lista e Creazione con numero manuale e tipo pagamento

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { round2 } from '@/lib/constants';

// ============================================
// GET - Lista fatture con filtri
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const committenteId = searchParams.get('committenteId');
    const stato = searchParams.get('stato');
    const anno = searchParams.get('anno');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const where: any = {};
    
    if (committenteId) {
      where.committenteId = committenteId;
    }
    
    if (stato) {
      where.stato = stato;
    }
    
    if (anno) {
      where.anno = parseInt(anno);
    }
    
    const [fatture, total] = await Promise.all([
      prisma.fattura.findMany({
        where,
        include: {
          committente: {
            select: {
              id: true,
              ragioneSociale: true,
              partitaIva: true,
            }
          },
          agibilita: {
            select: {
              id: true,
              codice: true,
              data: true,
              locale: {
                select: { nome: true }
              }
            }
          },
          scadenzaPagamento: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.fattura.count({ where })
    ]);
    
    return NextResponse.json({
      data: fatture,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Errore lista fatture:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle fatture' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Crea nuova fattura
// ============================================

interface CreateFatturaBody {
  committenteId: string;
  agibilitaIds: string[];
  modalitaRighe: 'DETTAGLIO_SPESE_SEPARATE' | 'DETTAGLIO_SPESE_INCLUSE' | 'VOCE_UNICA';
  descrizioneGenerica?: string;
  aliquotaIva?: number;
  scadenzaPagamentoId?: string;
  progressivo?: number; // NUOVO: numero fattura manuale
  tipoPagamento?: string; // NUOVO: tipo pagamento per Easyfatt
}

// Tipi pagamento validi
const TIPI_PAGAMENTO_VALIDI = [
  'BONIFICO_VISTA',
  'BONIFICO_30GG',
  'CARTA_CREDITO',
  'CONTANTI',
  'RIBA_30GG',
];

export async function POST(request: NextRequest) {
  try {
    const body: CreateFatturaBody = await request.json();
    
    // Validazione base
    if (!body.committenteId || !body.agibilitaIds || body.agibilitaIds.length === 0) {
      return NextResponse.json(
        { error: 'Committente e almeno una agibilità sono richiesti' },
        { status: 400 }
      );
    }
    
    // Carica committente
    const committente = await prisma.committente.findUnique({
      where: { id: body.committenteId },
      include: { scadenzaPagamento: true }
    });
    
    if (!committente) {
      return NextResponse.json(
        { error: 'Committente non trovato' },
        { status: 404 }
      );
    }
    
    // Carica agibilità con artisti
    const agibilita = await prisma.agibilita.findMany({
      where: {
        id: { in: body.agibilitaIds },
        committenteId: body.committenteId,
        statoFattura: 'DA_FATTURARE',
      },
      include: {
        locale: true,
        artisti: {
          include: {
            artista: {
              select: {
                id: true,
                nome: true,
                cognome: true,
                nomeDarte: true,
              }
            }
          }
        }
      },
      orderBy: { data: 'asc' }
    });
    
    if (agibilita.length === 0) {
      return NextResponse.json(
        { error: 'Nessuna agibilità valida trovata (verificare stato DA_FATTURARE)' },
        { status: 400 }
      );
    }
    
    // Verifica aliquota IVA
    let aliquotaIva = body.aliquotaIva || 22;
    if (![22, 10, 4, 0].includes(aliquotaIva)) {
      return NextResponse.json(
        { error: 'Aliquota IVA non valida' },
        { status: 400 }
      );
    }
    
    // Verifica tipo pagamento - usa quello passato, altrimenti default del committente
    const tipoPagamento = body.tipoPagamento || (committente as any).tipoPagamento || 'BONIFICO_30GG';
    if (!TIPI_PAGAMENTO_VALIDI.includes(tipoPagamento)) {
      return NextResponse.json(
        { error: 'Tipo pagamento non valido' },
        { status: 400 }
      );
    }
    
    const anno = new Date().getFullYear();
    
    // Determina il progressivo
    let progressivo: number;
    
    if (body.progressivo && body.progressivo > 0) {
      // Usa il numero fornito dall'utente
      progressivo = body.progressivo;
      
      // Verifica che non esista già una fattura con questo numero per quest'anno
      const esistente = await prisma.fattura.findFirst({
        where: {
          anno,
          progressivo,
        }
      });
      
      if (esistente) {
        return NextResponse.json(
          { error: `Esiste già una fattura n. ${progressivo}/${anno}` },
          { status: 400 }
        );
      }
    } else {
      // Calcola automaticamente il prossimo numero
      progressivo = await getNextProgressivo(anno);
    }
    
    const numero = `${progressivo}/${anno}`;
    const progressivoInvio = `${String(anno).slice(-2)}${String(progressivo).padStart(5, '0')}`;
    
    // Genera righe fattura
    const quotaPerArtista = Number(committente.quotaAgenzia) || 0;
    // Usa modalità passata, altrimenti default del committente, altrimenti DETTAGLIO_SPESE_INCLUSE
    const modalita = body.modalitaRighe || (committente as any).modalitaFatturazione || 'DETTAGLIO_SPESE_INCLUSE';
    
    let righe: any[] = [];
    let imponibile = 0;
    
    if (modalita === 'VOCE_UNICA') {
      // Una sola riga
      let totale = 0;
      agibilita.forEach(agi => {
        agi.artisti.forEach(aa => {
          totale += Number(aa.compensoLordo) + quotaPerArtista;
        });
      });
      
      righe = [{
        numeroLinea: 1,
        descrizione: body.descrizioneGenerica || 'Servizi di produzione artistica',
        quantita: 1,
        prezzoUnitario: round2(totale),
        prezzoTotale: round2(totale),
        aliquotaIva,
      }];
      imponibile = round2(totale);
      
    } else if (modalita === 'DETTAGLIO_SPESE_INCLUSE') {
      // Una riga per artista con spese incluse
      let lineNum = 1;
      agibilita.forEach(agi => {
        agi.artisti.forEach(aa => {
          const importo = round2(Number(aa.compensoLordo) + quotaPerArtista);
          const nome = aa.artista.nomeDarte 
            ? `${aa.artista.nome} ${aa.artista.cognome} - "${aa.artista.nomeDarte}"`
            : `${aa.artista.nome} ${aa.artista.cognome}`;
          
          righe.push({
            numeroLinea: lineNum++,
            descrizione: `${nome} - Compenso e gestione`,
            quantita: 1,
            prezzoUnitario: importo,
            prezzoTotale: importo,
            aliquotaIva,
          });
          imponibile += importo;
        });
      });
      imponibile = round2(imponibile);
      
    } else {
      // DETTAGLIO_SPESE_SEPARATE
      let lineNum = 1;
      let totaleSpese = 0;
      
      agibilita.forEach(agi => {
        agi.artisti.forEach(aa => {
          const compenso = round2(Number(aa.compensoLordo));
          const nome = aa.artista.nomeDarte 
            ? `${aa.artista.nome} ${aa.artista.cognome} - "${aa.artista.nomeDarte}"`
            : `${aa.artista.nome} ${aa.artista.cognome}`;
          
          righe.push({
            numeroLinea: lineNum++,
            descrizione: `${nome} - Compenso lordo`,
            quantita: 1,
            prezzoUnitario: compenso,
            prezzoTotale: compenso,
            aliquotaIva,
          });
          imponibile += compenso;
          totaleSpese += quotaPerArtista;
        });
      });
      
      // Riga spese
      if (totaleSpese > 0) {
        const numArtisti = agibilita.reduce((sum, a) => sum + a.artisti.length, 0);
        righe.push({
          numeroLinea: lineNum,
          descrizione: `Spese di gestione`,
          quantita: numArtisti,
          prezzoUnitario: round2(quotaPerArtista),
          prezzoTotale: round2(totaleSpese),
          aliquotaIva,
        });
        imponibile += totaleSpese;
      }
      imponibile = round2(imponibile);
    }
    
    const iva = round2(imponibile * (aliquotaIva / 100));
    const totale = round2(imponibile + iva);
    
    // Genera causale
    const causale = agibilita.length === 1
      ? `${agibilita[0].data.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()} - ${agibilita[0].locale.nome}`
      : agibilita.map(a => `${a.data.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })} ${a.locale.nome}`).join(' / ');
    
    // Calcola data scadenza
    const scadenzaPagamento = body.scadenzaPagamentoId 
      ? await prisma.scadenzaPagamento.findUnique({ where: { id: body.scadenzaPagamentoId } })
      : committente.scadenzaPagamento;
    
    const dataEmissione = new Date();
    let dataScadenza = new Date(dataEmissione);
    
    if (scadenzaPagamento) {
      dataScadenza.setDate(dataScadenza.getDate() + scadenzaPagamento.giorni);
      if (scadenzaPagamento.fineMese) {
        dataScadenza = new Date(dataScadenza.getFullYear(), dataScadenza.getMonth() + 1, 0);
      }
    }
    
    // Crea fattura con transazione atomica
    const fattura = await prisma.$transaction(async (tx) => {
      // Crea fattura
      const nuovaFattura = await tx.fattura.create({
        data: {
          numero,
          anno,
          progressivo,
          committenteId: body.committenteId,
          dataEmissione,
          dataScadenza,
          imponibile,
          iva,
          totale,
          stato: 'BOZZA',
          modalitaRighe: modalita,
          descrizioneGenerica: body.descrizioneGenerica,
          aliquotaIva,
          splitPayment: committente.splitPayment,
          righeFattura: righe,
          causale,
          scadenzaPagamentoId: scadenzaPagamento?.id,
          progressivoInvio,
          tipoPagamento, // NUOVO campo
        },
        include: {
          committente: true,
          scadenzaPagamento: true,
        }
      });
      
      // Collega agibilità alla fattura (ma NON le segna come FATTURATE - rimangono DA_FATTURARE fino all'emissione)
      await tx.agibilita.updateMany({
        where: { id: { in: body.agibilitaIds } },
        data: {
          fatturaId: nuovaFattura.id,
        }
      });
      
      return nuovaFattura;
    });
    
    return NextResponse.json(fattura, { status: 201 });
    
  } catch (error) {
    console.error('Errore creazione fattura:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione della fattura' },
      { status: 500 }
    );
  }
}

// ============================================
// Helper: Ottieni prossimo progressivo
// ============================================

async function getNextProgressivo(anno: number): Promise<number> {
  // Trova il numero più alto per l'anno
  const ultimaFattura = await prisma.fattura.findFirst({
    where: { anno },
    orderBy: { progressivo: 'desc' },
    select: { progressivo: true },
  });
  
  return ultimaFattura ? ultimaFattura.progressivo + 1 : 1;
}
