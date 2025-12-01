// src/app/api/fatture/[id]/xml/route.ts
// API Generazione XML FatturaPA

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generaFatturaXML } from '@/lib/fattura-xml';

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
// GET - Genera e scarica XML FatturaPA
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
    
    // Carica impostazioni azienda (formato JSON)
    const imp = await getImpostazioniAzienda();
    
    if (!imp) {
      return NextResponse.json(
        { error: 'Impostazioni azienda non configurate. Vai su Impostazioni > Dati Azienda.' },
        { status: 400 }
      );
    }
    
    // Verifica dati obbligatori
    const campiObbligatori = [
      { key: 'ragioneSociale', label: 'Ragione Sociale' },
      { key: 'partitaIva', label: 'Partita IVA' },
      { key: 'codiceFiscale', label: 'Codice Fiscale' },
      { key: 'indirizzo', label: 'Indirizzo' },
      { key: 'cap', label: 'CAP' },
      { key: 'citta', label: 'Città' },
      { key: 'provincia', label: 'Provincia' },
      { key: 'iban', label: 'IBAN' },
    ];
    
    const campiMancanti = campiObbligatori
      .filter(c => !imp[c.key])
      .map(c => c.label);
    
    if (campiMancanti.length > 0) {
      return NextResponse.json(
        { error: `Dati azienda mancanti: ${campiMancanti.join(', ')}. Vai su Impostazioni > Dati Azienda.` },
        { status: 400 }
      );
    }
    
    // Verifica dati REA (opzionali ma consigliati)
    // Se mancano, usiamo valori default
    const reaUfficio = imp.reaUfficio || imp.provincia || '';
    const reaNumero = imp.reaNumero || '';
    const reaCapitaleSociale = imp.reaCapitaleSociale || '10000.00';
    const reaSocioUnico = (imp.reaSocioUnico || 'SM') as 'SU' | 'SM';
    const reaStatoLiquidazione = (imp.reaStatoLiquidazione || 'LN') as 'LS' | 'LN';
    
    // Verifica dati committente
    if (!fattura.committente.partitaIva && !fattura.committente.codiceFiscale) {
      return NextResponse.json(
        { error: 'Committente senza P.IVA né Codice Fiscale' },
        { status: 400 }
      );
    }
    
    // Prepara dati azienda
    const datiAzienda = {
      partitaIva: imp.partitaIva,
      codiceFiscale: imp.codiceFiscale,
      denominazione: imp.ragioneSociale,
      indirizzo: imp.indirizzo,
      cap: imp.cap,
      comune: imp.citta,
      provincia: imp.provincia,
      telefono: imp.telefono || undefined,
      email: imp.email || undefined,
      iban: imp.iban,
      reaUfficio,
      reaNumero,
      reaCapitaleSociale,
      reaSocioUnico,
      reaStatoLiquidazione,
    };
    
    // Prepara dati intermediario (se presente nelle impostazioni)
    const datiIntermediario = imp.intermediarioPiva ? {
      partitaIva: imp.intermediarioPiva,
      codiceFiscale: imp.intermediarioCf || '',
      denominazione: imp.intermediarioDenominazione || '',
    } : undefined;
    
    // Prepara dati committente
    const datiCommittente = {
      partitaIva: fattura.committente.partitaIva || undefined,
      codiceFiscale: fattura.committente.codiceFiscale || undefined,
      denominazione: fattura.committente.ragioneSociale,
      indirizzo: fattura.committente.indirizzoFatturazione || '',
      cap: fattura.committente.capFatturazione || '',
      comune: fattura.committente.cittaFatturazione || '',
      provincia: fattura.committente.provinciaFatturazione || '',
      codiceSDI: fattura.committente.codiceSDI,
      pec: fattura.committente.pec || undefined,
      isPubblicaAmministrazione: fattura.committente.isPubblicaAmministrazione,
    };
    
    // Prepara righe fattura
    const righe = (fattura.righeFattura as any[]) || [];
    
    // Prepara dati fattura
    const datiFattura = {
      numero: fattura.numero,
      data: fattura.dataEmissione,
      causale: fattura.causale || '',
      righe: righe.map((r, i) => ({
        numeroLinea: r.numeroLinea || i + 1,
        descrizione: r.descrizione,
        quantita: r.quantita || 1,
        prezzoUnitario: r.prezzoUnitario,
        prezzoTotale: r.prezzoTotale,
        aliquotaIva: r.aliquotaIva || fattura.aliquotaIva,
      })),
      imponibile: Number(fattura.imponibile),
      aliquotaIva: fattura.aliquotaIva,
      imposta: Number(fattura.iva),
      totale: Number(fattura.totale),
      splitPayment: fattura.splitPayment,
      dataScadenza: fattura.dataScadenza || fattura.dataEmissione,
      progressivoInvio: fattura.progressivoInvio || `RCP${fattura.progressivo}`,
    };
    
    // Genera XML
    const xml = generaFatturaXML({
      azienda: datiAzienda,
      intermediario: datiIntermediario,
      committente: datiCommittente,
      fattura: datiFattura,
    });
    
    // Nome file secondo specifica SDI
    // IT + P.IVA cedente + _ + progressivo univoco + .xml
    const nomeFile = `IT${datiAzienda.partitaIva}_${fattura.progressivoInvio || fattura.numero}.xml`;
    
    // Ritorna XML come file scaricabile
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${nomeFile}"`,
      }
    });
    
  } catch (error) {
    console.error('Errore generazione XML fattura:', error);
    return NextResponse.json(
      { error: 'Errore nella generazione XML' },
      { status: 500 }
    );
  }
}