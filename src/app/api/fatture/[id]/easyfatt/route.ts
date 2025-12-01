// src/app/api/fatture/[id]/easyfatt/route.ts
// API Generazione XML formato Easyfatt per Danea

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generaEasyfattXML, convertiFatturaToEasyfatt } from '@/lib/easyfatt-xml';

// ============================================
// Helper per caricare impostazioni azienda
// ============================================

async function getImpostazioniAzienda(): Promise<Record<string, string> | null> {
  const settings = await prisma.impostazioni.findFirst({
    where: { chiave: 'azienda' }
  });
  
  if (!settings) return null;
  
  try {
    return JSON.parse(settings.valore);
  } catch {
    return null;
  }
}

// ============================================
// GET - Genera e scarica XML formato Easyfatt
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Carica fattura con tutti i dati necessari
    const fattura = await prisma.fattura.findUnique({
      where: { id },
      include: {
        committente: true,
        agibilita: {
          include: {
            locale: true,
            artisti: {
              include: {
                artista: true
              }
            }
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
    
    // Carica impostazioni azienda
    const imp = await getImpostazioniAzienda();
    
    if (!imp) {
      return NextResponse.json(
        { error: 'Impostazioni azienda non configurate. Vai su Impostazioni > Dati Azienda.' },
        { status: 400 }
      );
    }
    
    // Verifica dati obbligatori
    const campiObbligatori = ['ragioneSociale', 'partitaIva', 'codiceFiscale'];
    const campiMancanti = campiObbligatori.filter(c => !imp[c]);
    
    if (campiMancanti.length > 0) {
      return NextResponse.json(
        { error: `Dati azienda mancanti: ${campiMancanti.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Prepara dati azienda
    const azienda = {
      ragioneSociale: imp.ragioneSociale,
      partitaIva: imp.partitaIva,
      codiceFiscale: imp.codiceFiscale,
      indirizzo: imp.indirizzo || '',
      cap: imp.cap || '',
      citta: imp.citta || '',
      provincia: imp.provincia || '',
      telefono: imp.telefono,
      email: imp.email,
      iban: imp.iban,
      banca: imp.banca,
    };
    
    // Prepara righe fattura
    const righe = (fattura.righeFattura as any[]) || [];
    
    // Prepara dati fattura per conversione
    const fatturaData = {
      numero: fattura.numero,
      progressivo: fattura.progressivo,
      dataEmissione: fattura.dataEmissione,
      dataScadenza: fattura.dataScadenza || fattura.dataEmissione,
      imponibile: Number(fattura.imponibile),
      iva: Number(fattura.iva),
      totale: Number(fattura.totale),
      aliquotaIva: fattura.aliquotaIva,
      splitPayment: fattura.splitPayment,
      causale: fattura.causale || undefined,
      tipoPagamento: (fattura as any).tipoPagamento || 'BONIFICO_VISTA',
      righeFattura: righe.map((r, i) => ({
        numeroLinea: r.numeroLinea || i + 1,
        descrizione: r.descrizione,
        quantita: r.quantita || 1,
        prezzoUnitario: r.prezzoUnitario,
        prezzoTotale: r.prezzoTotale,
        aliquotaIva: r.aliquotaIva || fattura.aliquotaIva,
      })),
      committente: {
        ragioneSociale: fattura.committente.ragioneSociale,
        partitaIva: fattura.committente.partitaIva || undefined,
        codiceFiscale: fattura.committente.codiceFiscale || undefined,
        indirizzoFatturazione: fattura.committente.indirizzoFatturazione || undefined,
        capFatturazione: fattura.committente.capFatturazione || undefined,
        cittaFatturazione: fattura.committente.cittaFatturazione || undefined,
        provinciaFatturazione: fattura.committente.provinciaFatturazione || undefined,
        codiceSDI: fattura.committente.codiceSDI || undefined,
        email: fattura.committente.email || undefined,
        pec: fattura.committente.pec || undefined,
        telefono: fattura.committente.telefono || undefined,
      },
    };
    
    // Converti in formato Easyfatt
    const easyfattParams = convertiFatturaToEasyfatt(fatturaData, azienda);
    
    // Genera XML
    const xml = generaEasyfattXML(easyfattParams);
    
    // Nome file
    const nomeFile = `Fattura_${fattura.numero}_${fattura.anno}_Easyfatt.xml`;
    
    // Ritorna XML come file scaricabile
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${nomeFile}"`,
      }
    });
    
  } catch (error) {
    console.error('Errore generazione XML Easyfatt:', error);
    return NextResponse.json(
      { error: 'Errore nella generazione XML Easyfatt' },
      { status: 500 }
    );
  }
}
