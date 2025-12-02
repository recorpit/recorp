// src/app/api/fatture/[id]/route.ts
// API singola Fattura - GET, PUT, DELETE

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { round2 } from '@/lib/constants';

// ============================================
// GET - Dettaglio fattura
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const fattura = await prisma.fattura.findUnique({
      where: { id },
      include: {
        committente: {
          select: {
            id: true,
            ragioneSociale: true,
            partitaIva: true,
            codiceFiscale: true,
            codiceSDI: true,
            pec: true,
            isPubblicaAmministrazione: true,
            indirizzoFatturazione: true,
            capFatturazione: true,
            cittaFatturazione: true,
            provinciaFatturazione: true,
          }
        },
        agibilita: {
          select: {
            id: true,
            codice: true,
            data: true,
            totaleCompensiLordi: true,
            quotaAgenzia: true,
            locale: {
              select: {
                id: true,
                nome: true,
              }
            },
            artisti: {
              select: {
                compensoLordo: true,
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
          }
        },
        scadenzaPagamento: true,
        noteDiCredito: {
          select: {
            id: true,
            numero: true,
            totale: true,
            stato: true,
          }
        }
      }
    });
    
    if (!fattura) {
      return NextResponse.json(
        { error: 'Fattura non trovata' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(fattura);
    
  } catch (error) {
    console.error('Errore caricamento fattura:', error);
    return NextResponse.json(
      { error: 'Errore nel caricamento della fattura' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Aggiorna fattura
// ============================================

interface UpdateFatturaBody {
  stato?: string;
  dataPagamento?: string | null;
  note?: string;
  causale?: string;
  tipoPagamento?: string;
  dataScadenza?: string | null;
  righeFattura?: any[];
  imponibile?: number;
  iva?: number;
  totale?: number;
  modalitaRighe?: string;
  numero?: string;
  progressivo?: number;
  dataEmissione?: string;
  descrizioneGenerica?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateFatturaBody = await request.json();
    
    const fattura = await prisma.fattura.findUnique({
      where: { id },
      include: {
        agibilita: true,
      }
    });
    
    if (!fattura) {
      return NextResponse.json(
        { error: 'Fattura non trovata' },
        { status: 404 }
      );
    }
    
    const updateData: any = {};
    
    // ==========================================
    // Modifica stato
    // ==========================================
    if (body.stato) {
      const statiValidi = ['BOZZA', 'EMESSA', 'INVIATA', 'PAGATA', 'ANNULLATA'];
      if (!statiValidi.includes(body.stato)) {
        return NextResponse.json(
          { error: 'Stato non valido' },
          { status: 400 }
        );
      }
      
      // Transizione da BOZZA a EMESSA: segna agibilità come FATTURATE
      if (fattura.stato === 'BOZZA' && body.stato === 'EMESSA') {
        await prisma.agibilita.updateMany({
          where: {
            id: { in: fattura.agibilita.map(a => a.id) }
          },
          data: {
            statoFattura: 'FATTURATA',
          }
        });
      }
      
      // Annullamento: riporta agibilità a DA_FATTURARE
      if (body.stato === 'ANNULLATA' && fattura.stato !== 'ANNULLATA') {
        await prisma.agibilita.updateMany({
          where: {
            id: { in: fattura.agibilita.map(a => a.id) }
          },
          data: {
            statoFattura: 'DA_FATTURARE',
            fatturaId: null,
          }
        });
      }
      
      updateData.stato = body.stato;
      
      // Se passa a PAGATA, imposta data pagamento
      if (body.stato === 'PAGATA' && !fattura.dataPagamento) {
        updateData.dataPagamento = new Date();
      }
    }
    
    // ==========================================
    // Modifica campi (solo per BOZZA)
    // ==========================================
    if (fattura.stato === 'BOZZA') {
      if (body.causale !== undefined) {
        updateData.causale = body.causale;
      }
      
      if (body.note !== undefined) {
        updateData.note = body.note;
      }
      
      if (body.tipoPagamento !== undefined) {
        const tipiValidi = ['BONIFICO_VISTA', 'BONIFICO_30GG', 'CARTA_CREDITO', 'CONTANTI', 'RIBA_30GG'];
        if (tipiValidi.includes(body.tipoPagamento)) {
          updateData.tipoPagamento = body.tipoPagamento;
        }
      }
      
      if (body.dataScadenza !== undefined) {
        updateData.dataScadenza = body.dataScadenza ? new Date(body.dataScadenza) : null;
      }
      
      // Modalità righe
      if (body.modalitaRighe !== undefined) {
        const modalitaValide = ['DETTAGLIO_SPESE_INCLUSE', 'DETTAGLIO_SPESE_SEPARATE', 'VOCE_UNICA'];
        if (modalitaValide.includes(body.modalitaRighe)) {
          updateData.modalitaRighe = body.modalitaRighe;
        }
      }
      
      // Numero fattura e progressivo (verifica duplicati)
      if (body.progressivo !== undefined && body.progressivo !== fattura.progressivo) {
        // Verifica che il nuovo progressivo non esista già per quest'anno
        const esistente = await prisma.fattura.findFirst({
          where: {
            anno: fattura.anno,
            progressivo: body.progressivo,
            id: { not: id }
          }
        });
        if (esistente) {
          return NextResponse.json(
            { error: `Il numero fattura ${body.progressivo}/${fattura.anno} è già utilizzato` },
            { status: 400 }
          );
        }
        updateData.progressivo = body.progressivo;
        updateData.numero = `${body.progressivo}/${fattura.anno}`;
        updateData.progressivoInvio = `${String(fattura.anno).slice(-2)}${String(body.progressivo).padStart(5, '0')}`;
      } else if (body.numero !== undefined && body.numero !== fattura.numero) {
        // Supporto retrocompatibilità con campo numero
        const esistente = await prisma.fattura.findFirst({
          where: {
            numero: body.numero,
            id: { not: id }
          }
        });
        if (esistente) {
          return NextResponse.json(
            { error: `Il numero fattura ${body.numero} è già utilizzato` },
            { status: 400 }
          );
        }
        // Estrai progressivo dal numero se possibile
        const match = body.numero.match(/^(\d+)\/(\d+)$/);
        if (match) {
          updateData.progressivo = parseInt(match[1]);
          updateData.progressivoInvio = `${String(fattura.anno).slice(-2)}${String(match[1]).padStart(5, '0')}`;
        }
        updateData.numero = body.numero;
      }
      
      // Data emissione
      if (body.dataEmissione !== undefined) {
        updateData.dataEmissione = new Date(body.dataEmissione);
      }
      
      // Descrizione generica
      if (body.descrizioneGenerica !== undefined) {
        updateData.descrizioneGenerica = body.descrizioneGenerica;
      }
      
      // Aggiorna righe fattura
      if (body.righeFattura) {
        updateData.righeFattura = body.righeFattura;
      }
      
      // Aggiorna importi
      if (body.imponibile !== undefined) {
        updateData.imponibile = round2(body.imponibile);
      }
      if (body.iva !== undefined) {
        updateData.iva = round2(body.iva);
      }
      if (body.totale !== undefined) {
        updateData.totale = round2(body.totale);
      }
    }
    
    // Data pagamento manuale
    if (body.dataPagamento !== undefined) {
      updateData.dataPagamento = body.dataPagamento ? new Date(body.dataPagamento) : null;
    }
    
    // Se non c'è nulla da aggiornare
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(fattura);
    }
    
    const updated = await prisma.fattura.update({
      where: { id },
      data: updateData,
      include: {
        committente: {
          select: {
            ragioneSociale: true,
            partitaIva: true,
          }
        }
      }
    });
    
    return NextResponse.json(updated);
    
  } catch (error) {
    console.error('Errore aggiornamento fattura:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della fattura' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Elimina fattura
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const fattura = await prisma.fattura.findUnique({
      where: { id },
      include: {
        agibilita: true,
        noteDiCredito: true,
      }
    });
    
    if (!fattura) {
      return NextResponse.json(
        { error: 'Fattura non trovata' },
        { status: 404 }
      );
    }
    
    // Permetti eliminazione solo per BOZZA e ANNULLATA
    if (fattura.stato !== 'BOZZA' && fattura.stato !== 'ANNULLATA') {
      return NextResponse.json(
        { error: 'Solo le fatture in bozza o annullate possono essere eliminate. Per le fatture emesse, usa "Annulla" o crea una Nota di Credito.' },
        { status: 400 }
      );
    }
    
    // Verifica non abbia note di credito
    if (fattura.noteDiCredito.length > 0) {
      return NextResponse.json(
        { error: 'Impossibile eliminare: esistono note di credito collegate' },
        { status: 400 }
      );
    }
    
    // Transazione: riporta agibilità a DA_FATTURARE e elimina fattura
    await prisma.$transaction(async (tx) => {
      // Scollega e riporta agibilità a DA_FATTURARE (solo se BOZZA, per ANNULLATA già fatto)
      if (fattura.stato === 'BOZZA' && fattura.agibilita.length > 0) {
        await tx.agibilita.updateMany({
          where: {
            id: { in: fattura.agibilita.map(a => a.id) }
          },
          data: {
            statoFattura: 'DA_FATTURARE',
            fatturaId: null,
          }
        });
      }
      
      // Elimina fattura
      await tx.fattura.delete({
        where: { id }
      });
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Errore eliminazione fattura:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione della fattura' },
      { status: 500 }
    );
  }
}
