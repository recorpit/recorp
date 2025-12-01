// src/app/api/note-credito/route.ts
// API CRUD Note di Credito

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { round2 } from '@/lib/constants';

// ============================================
// GET - Lista note di credito
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const anno = searchParams.get('anno');
    const stato = searchParams.get('stato');
    const fatturaId = searchParams.get('fatturaId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    
    const where: any = {};
    
    if (anno) where.anno = parseInt(anno);
    if (stato) where.stato = stato;
    if (fatturaId) where.fatturaRiferimentoId = fatturaId;
    
    const [noteDiCredito, total] = await Promise.all([
      prisma.notaDiCredito.findMany({
        where,
        include: {
          fatturaRiferimento: {
            select: {
              id: true,
              numero: true,
              dataEmissione: true,
              totale: true,
              committente: {
                select: {
                  id: true,
                  ragioneSociale: true,
                  partitaIva: true,
                }
              }
            }
          }
        },
        orderBy: [
          { anno: 'desc' },
          { progressivo: 'desc' },
        ],
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.notaDiCredito.count({ where }),
    ]);
    
    return NextResponse.json({
      data: noteDiCredito,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
      }
    });
    
  } catch (error) {
    console.error('Errore caricamento note di credito:', error);
    return NextResponse.json(
      { error: 'Errore nel caricamento delle note di credito' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Crea nuova nota di credito
// ============================================

interface CreateNotaCreditoBody {
  fatturaRiferimentoId: string;
  tipo: 'TOTALE' | 'PARZIALE';
  motivo: string;
  righe?: Array<{
    descrizione: string;
    quantita: number;
    prezzoUnitario: number;
    aliquotaIva: number;
  }>;
  importoParziale?: number; // Per storno parziale semplificato
  progressivo?: number; // Numero manuale opzionale
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateNotaCreditoBody = await request.json();
    
    // Validazione base
    if (!body.fatturaRiferimentoId) {
      return NextResponse.json(
        { error: 'ID fattura di riferimento obbligatorio' },
        { status: 400 }
      );
    }
    
    if (!body.motivo) {
      return NextResponse.json(
        { error: 'Motivo della nota di credito obbligatorio' },
        { status: 400 }
      );
    }
    
    // Carica fattura di riferimento
    const fattura = await prisma.fattura.findUnique({
      where: { id: body.fatturaRiferimentoId },
      include: {
        committente: true,
      }
    });
    
    if (!fattura) {
      return NextResponse.json(
        { error: 'Fattura di riferimento non trovata' },
        { status: 404 }
      );
    }
    
    if (fattura.stato === 'BOZZA' || fattura.stato === 'ANNULLATA') {
      return NextResponse.json(
        { error: 'Non è possibile creare una nota di credito per una fattura non emessa o annullata' },
        { status: 400 }
      );
    }
    
    // Determina anno e progressivo
    const anno = new Date().getFullYear();
    
    // Trova prossimo progressivo per note di credito
    let progressivo = body.progressivo;
    
    if (!progressivo) {
      const ultimaNota = await prisma.notaDiCredito.findFirst({
        where: { anno },
        orderBy: { progressivo: 'desc' },
      });
      progressivo = (ultimaNota?.progressivo || 0) + 1;
    } else {
      // Verifica che non esista già
      const esistente = await prisma.notaDiCredito.findFirst({
        where: { anno, progressivo },
      });
      if (esistente) {
        return NextResponse.json(
          { error: `Esiste già una nota di credito n. ${progressivo}/${anno}` },
          { status: 400 }
        );
      }
    }
    
    // Calcola importi
    let imponibile: number;
    let righeNotaCredito: any[] = [];
    
    if (body.tipo === 'TOTALE') {
      // Storno totale - stessa imponibile della fattura
      imponibile = round2(Number(fattura.imponibile));
      righeNotaCredito = [{
        numeroLinea: 1,
        descrizione: `Storno totale fattura n. ${fattura.numero} - ${body.motivo}`,
        quantita: 1,
        prezzoUnitario: imponibile,
        prezzoTotale: imponibile,
        aliquotaIva: fattura.aliquotaIva,
      }];
    } else if (body.righe && body.righe.length > 0) {
      // Storno parziale con righe dettagliate
      righeNotaCredito = body.righe.map((r, i) => {
        const prezzoTotale = round2(r.quantita * r.prezzoUnitario);
        return {
          numeroLinea: i + 1,
          descrizione: r.descrizione,
          quantita: r.quantita,
          prezzoUnitario: r.prezzoUnitario,
          prezzoTotale,
          aliquotaIva: r.aliquotaIva || fattura.aliquotaIva,
        };
      });
      imponibile = round2(righeNotaCredito.reduce((sum, r) => sum + r.prezzoTotale, 0));
    } else if (body.importoParziale) {
      // Storno parziale semplificato
      imponibile = round2(body.importoParziale);
      righeNotaCredito = [{
        numeroLinea: 1,
        descrizione: `Storno parziale fattura n. ${fattura.numero} - ${body.motivo}`,
        quantita: 1,
        prezzoUnitario: imponibile,
        prezzoTotale: imponibile,
        aliquotaIva: fattura.aliquotaIva,
      }];
    } else {
      return NextResponse.json(
        { error: 'Specificare righe o importo parziale per storno parziale' },
        { status: 400 }
      );
    }
    
    // Verifica che non superi l'importo della fattura
    if (imponibile > Number(fattura.imponibile)) {
      return NextResponse.json(
        { error: `L'importo della nota di credito (€${imponibile.toFixed(2)}) non può superare l'imponibile della fattura (€${Number(fattura.imponibile).toFixed(2)})` },
        { status: 400 }
      );
    }
    
    // Calcola IVA e totale
    const iva = round2(imponibile * (fattura.aliquotaIva / 100));
    const totale = fattura.splitPayment ? imponibile : round2(imponibile + iva);
    
    // Crea nota di credito
    const notaDiCredito = await prisma.notaDiCredito.create({
      data: {
        numero: `NC${progressivo}/${anno}`,
        anno,
        progressivo,
        dataEmissione: new Date(),
        fatturaRiferimentoId: fattura.id,
        committenteId: fattura.committenteId,
        tipo: body.tipo,
        motivo: body.motivo,
        imponibile,
        iva,
        totale,
        aliquotaIva: fattura.aliquotaIva,
        splitPayment: fattura.splitPayment,
        righe: righeNotaCredito,
        stato: 'EMESSA',
      },
      include: {
        fatturaRiferimento: {
          select: {
            numero: true,
          }
        },
        committente: {
          select: {
            ragioneSociale: true,
          }
        }
      }
    });
    
    return NextResponse.json(notaDiCredito, { status: 201 });
    
  } catch (error) {
    console.error('Errore creazione nota di credito:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione della nota di credito' },
      { status: 500 }
    );
  }
}