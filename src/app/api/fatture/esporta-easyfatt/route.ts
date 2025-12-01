// src/app/api/fatture/esporta-easyfatt/route.ts
// API Esportazione Massiva Fatture formato Easyfatt

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generaEasyfattXML } from '@/lib/easyfatt-xml';
import { format } from 'date-fns';

// Mappa tipo pagamento per Easyfatt
const TIPO_PAGAMENTO_MAP: Record<string, string> = {
  'BONIFICO_VISTA': 'Bonifico vista fattura',
  'BONIFICO_30GG': 'Bonifico 30 gg F.M.',
  'CARTA_CREDITO': 'Carta di credito',
  'CONTANTI': 'Contanti',
  'RIBA_30GG': 'RIBA 30 gg F.M.',
};

// ============================================
// POST - Esporta fatture selezionate o per periodo
// ============================================

interface EsportaBody {
  // Opzione 1: IDs specifici
  fattureIds?: string[];
  
  // Opzione 2: Filtri periodo
  dataInizio?: string; // ISO date
  dataFine?: string;   // ISO date
  anno?: number;
  mese?: number; // 1-12
  
  // Filtri aggiuntivi
  committenteId?: string;
  stato?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EsportaBody = await request.json();
    
    // Costruisci query
    const where: any = {};
    
    if (body.fattureIds && body.fattureIds.length > 0) {
      // Esporta fatture specifiche
      where.id = { in: body.fattureIds };
    } else {
      // Esporta per periodo
      if (body.dataInizio || body.dataFine) {
        where.dataEmissione = {};
        if (body.dataInizio) {
          where.dataEmissione.gte = new Date(body.dataInizio);
        }
        if (body.dataFine) {
          where.dataEmissione.lte = new Date(body.dataFine + 'T23:59:59');
        }
      } else if (body.anno && body.mese) {
        // Filtra per mese specifico
        const inizioMese = new Date(body.anno, body.mese - 1, 1);
        const fineMese = new Date(body.anno, body.mese, 0, 23, 59, 59);
        where.dataEmissione = {
          gte: inizioMese,
          lte: fineMese,
        };
      } else if (body.anno) {
        // Filtra per anno
        where.anno = body.anno;
      }
    }
    
  // Filtri aggiuntivi
    if (body.committenteId) {
      where.committenteId = body.committenteId;
    }
    
    // Esporta solo fatture emesse (non BOZZA e non ANNULLATA)
    // Lo stato può essere EMESSA, ESPORTATA, INVIATA, PAGATA
    where.stato = { notIn: ['BOZZA', 'ANNULLATA'] };
    
    // Carica fatture
    const fatture = await prisma.fattura.findMany({
      where,
      include: {
        committente: true,
      },
      orderBy: [
        { anno: 'asc' },
        { progressivo: 'asc' },
      ],
    });
    
    if (fatture.length === 0) {
      return NextResponse.json(
        { error: 'Nessuna fattura trovata con i criteri specificati' },
        { status: 404 }
      );
    }
    
    // Carica impostazioni azienda
    const settings = await prisma.impostazioni.findFirst({
      where: { chiave: 'azienda' }
    });
    
    if (!settings) {
      return NextResponse.json(
        { error: 'Impostazioni azienda non configurate' },
        { status: 400 }
      );
    }
    
    const imp = JSON.parse(settings.valore);
    
    // Prepara dati azienda
    const company = {
      name: imp.ragioneSociale,
      address: imp.indirizzo || '',
      postcode: imp.cap || '',
      city: imp.citta || '',
      province: imp.provincia || '',
      country: 'Italia',
      fiscalCode: imp.codiceFiscale,
      vatCode: imp.partitaIva,
      tel: imp.telefono,
      email: imp.email,
    };
    
    // Converti tutte le fatture in documenti Easyfatt
    const documents = fatture.map(fattura => {
      const righe = (fattura.righeFattura as any[]) || [];
      const tipoPagamentoLabel = TIPO_PAGAMENTO_MAP[(fattura as any).tipoPagamento] || 'Bonifico 30 gg F.M.';
      
      return {
        documentType: 'I' as const,
        date: fattura.dataEmissione,
        number: fattura.progressivo,
        customer: {
          name: fattura.committente.ragioneSociale,
          vatCode: fattura.committente.partitaIva || undefined,
          fiscalCode: fattura.committente.codiceFiscale || undefined,
          address: fattura.committente.indirizzoFatturazione || undefined,
          postcode: fattura.committente.capFatturazione || undefined,
          city: fattura.committente.cittaFatturazione || undefined,
          province: fattura.committente.provinciaFatturazione || undefined,
          country: 'Italia',
          email: fattura.committente.email || undefined,
          pec: fattura.committente.pec || undefined,
          tel: fattura.committente.telefono || undefined,
          eInvoiceDestCode: fattura.committente.codiceSDI || undefined,
        },
        totalWithoutTax: Number(fattura.imponibile),
        vatAmount: Number(fattura.iva),
        total: Number(fattura.totale),
        pricesIncludeVat: false,
        paymentName: tipoPagamentoLabel,
        paymentBank: imp.banca ? `${imp.banca} - IBAN ${imp.iban}` : `IBAN ${imp.iban}`,
        docReference: fattura.causale || undefined,
        delayedVat: fattura.splitPayment,
        delayedVatDesc: fattura.splitPayment ? 'Split Payment art. 17-ter DPR 633/72' : undefined,
        rows: righe.map((r, i) => ({
          description: r.descrizione,
          qty: r.quantita || 1,
          um: 'pz',
          price: r.prezzoUnitario,
          vatCode: r.aliquotaIva || fattura.aliquotaIva,
          vatPerc: r.aliquotaIva || fattura.aliquotaIva,
          vatClass: 'Imponibile',
          vatDescription: `Aliquota ${r.aliquotaIva || fattura.aliquotaIva}%`,
          total: r.prezzoTotale,
          stock: false,
        })),
        payments: [
          {
            advance: false,
            date: fattura.dataScadenza || fattura.dataEmissione,
            amount: fattura.splitPayment ? Number(fattura.imponibile) : Number(fattura.totale),
            paid: fattura.stato === 'PAGATA',
          }
        ],
      };
    });
    
    // Genera XML unico con tutti i documenti
    const xml = generaEasyfattXML({
      company,
      documents,
      creator: 'RECORP',
      creatorUrl: 'https://recorp.it',
    });
    
    // Aggiorna stato fatture a ESPORTATA (solo se erano EMESSA)
    // Le fatture già ESPORTATA, INVIATA o PAGATA mantengono il loro stato
    const idsEmesse = fatture
      .filter(f => f.stato === 'EMESSA')
      .map(f => f.id);
    
    if (idsEmesse.length > 0) {
      await prisma.fattura.updateMany({
        where: {
          id: { in: idsEmesse },
          stato: 'EMESSA', // Solo se ancora EMESSA
        },
        data: {
          stato: 'ESPORTATA',
        }
      });
    }
    
    // Nome file basato sul periodo o selezione
    let nomeFile = 'Fatture_Easyfatt';
    
    if (body.anno && body.mese) {
      const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
      nomeFile = `Fatture_${mesi[body.mese - 1]}_${body.anno}_Easyfatt`;
    } else if (body.anno) {
      nomeFile = `Fatture_${body.anno}_Easyfatt`;
    } else if (body.dataInizio && body.dataFine) {
      nomeFile = `Fatture_${body.dataInizio}_${body.dataFine}_Easyfatt`;
    } else if (body.fattureIds && body.fattureIds.length > 0) {
      nomeFile = `Fatture_Selezione_${fatture.length}_Easyfatt`;
    }
    
    nomeFile += '.xml';
    
    // Ritorna XML
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${nomeFile}"`,
      }
    });
    
  } catch (error) {
    console.error('Errore esportazione massiva:', error);
    return NextResponse.json(
      { error: 'Errore nell\'esportazione delle fatture' },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Anteprima fatture che verrebbero esportate
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const where: any = {};
    
    const dataInizio = searchParams.get('dataInizio');
    const dataFine = searchParams.get('dataFine');
    const anno = searchParams.get('anno');
    const mese = searchParams.get('mese');
    const committenteId = searchParams.get('committenteId');
    const stato = searchParams.get('stato');
    
    if (dataInizio || dataFine) {
      where.dataEmissione = {};
      if (dataInizio) {
        where.dataEmissione.gte = new Date(dataInizio);
      }
      if (dataFine) {
        where.dataEmissione.lte = new Date(dataFine + 'T23:59:59');
      }
    } else if (anno && mese) {
      const annoNum = parseInt(anno);
      const meseNum = parseInt(mese);
      const inizioMese = new Date(annoNum, meseNum - 1, 1);
      const fineMese = new Date(annoNum, meseNum, 0, 23, 59, 59);
      where.dataEmissione = {
        gte: inizioMese,
        lte: fineMese,
      };
    } else if (anno) {
      where.anno = parseInt(anno);
    }
    
    if (committenteId) {
      where.committenteId = committenteId;
    }
    
    if (stato) {
      where.stato = stato;
    } else {
      where.stato = { notIn: ['BOZZA', 'ANNULLATA'] };
    }
    
    const fatture = await prisma.fattura.findMany({
      where,
      select: {
        id: true,
        numero: true,
        dataEmissione: true,
        totale: true,
        stato: true,
        committente: {
          select: {
            ragioneSociale: true,
          }
        }
      },
      orderBy: [
        { anno: 'asc' },
        { progressivo: 'asc' },
      ],
    });
    
    const totaleImporto = fatture.reduce((sum, f) => sum + Number(f.totale), 0);
    
    return NextResponse.json({
      count: fatture.length,
      totale: totaleImporto,
      fatture,
    });
    
  } catch (error) {
    console.error('Errore anteprima esportazione:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle fatture' },
      { status: 500 }
    );
  }
}