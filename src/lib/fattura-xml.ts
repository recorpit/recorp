// src/lib/fattura-xml.ts
// Generatore XML FatturaPA v1.2 per RECORP

import { format } from 'date-fns';
import { it } from 'date-fns/locale';

// ============================================
// TIPI
// ============================================

interface DatiAzienda {
  partitaIva: string;
  codiceFiscale: string;
  denominazione: string;
  indirizzo: string;
  cap: string;
  comune: string;
  provincia: string;
  telefono?: string;
  email?: string;
  // REA
  reaUfficio: string;
  reaNumero: string;
  reaCapitaleSociale: string;
  reaSocioUnico: 'SU' | 'SM'; // SU = Socio Unico, SM = Più Soci
  reaStatoLiquidazione: 'LS' | 'LN'; // LS = In Liquidazione, LN = Non in Liquidazione
  // Banca
  iban: string;
}

interface DatiIntermediario {
  partitaIva: string;
  codiceFiscale: string;
  denominazione: string;
  telefono?: string;
}

interface DatiCommittente {
  partitaIva?: string;
  codiceFiscale?: string;
  denominazione: string;
  indirizzo: string;
  cap: string;
  comune: string;
  provincia: string;
  codiceSDI: string;
  pec?: string;
  isPubblicaAmministrazione?: boolean;
}

interface RigaFattura {
  numeroLinea: number;
  descrizione: string;
  quantita: number;
  prezzoUnitario: number;
  prezzoTotale: number;
  aliquotaIva: number;
}

interface DatiFattura {
  numero: string;
  data: Date;
  causale: string;
  righe: RigaFattura[];
  imponibile: number;
  aliquotaIva: number;
  imposta: number;
  totale: number;
  splitPayment: boolean;
  dataScadenza: Date;
  progressivoInvio: string;
}

interface FatturaXMLParams {
  azienda: DatiAzienda;
  intermediario?: DatiIntermediario;
  committente: DatiCommittente;
  fattura: DatiFattura;
}

// ============================================
// HELPERS
// ============================================

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDecimal(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// Genera causale nel formato: "DOMENICA 23 NOVEMBRE - CLUB XYZ"
export function generaCausale(data: Date, nomeLocale: string): string {
  const giornoSettimana = format(data, 'EEEE', { locale: it }).toUpperCase();
  const giorno = format(data, 'd', { locale: it });
  const mese = format(data, 'MMMM', { locale: it }).toUpperCase();
  
  return `${giornoSettimana} ${giorno} ${mese} - ${nomeLocale.toUpperCase()}`;
}

// Genera causale per più agibilità
export function generaCausaleMultipla(agibilita: Array<{ data: Date; nomeLocale: string }>): string {
  return agibilita
    .map(a => generaCausale(a.data, a.nomeLocale))
    .join(' / ');
}

// ============================================
// GENERATORE XML
// ============================================

export function generaFatturaXML(params: FatturaXMLParams): string {
  const { azienda, intermediario, committente, fattura } = params;
  
  // Determina formato trasmissione
  const formatoTrasmissione = committente.isPubblicaAmministrazione ? 'FPA12' : 'FPR12';
  
  // Esigibilità IVA
  const esigibilitaIva = fattura.splitPayment ? 'S' : 'I'; // S = Split, I = Immediata
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<ns3:FatturaElettronica xmlns:ns3="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" versione="${formatoTrasmissione}">
    <FatturaElettronicaHeader>
        <DatiTrasmissione>
            <IdTrasmittente>
                <IdPaese>IT</IdPaese>
                <IdCodice>${escapeXml(intermediario?.partitaIva || azienda.partitaIva)}</IdCodice>
            </IdTrasmittente>
            <ProgressivoInvio>${escapeXml(fattura.progressivoInvio)}</ProgressivoInvio>
            <FormatoTrasmissione>${formatoTrasmissione}</FormatoTrasmissione>
            <CodiceDestinatario>${escapeXml(committente.codiceSDI)}</CodiceDestinatario>`;
  
  // PEC se presente e codice SDI è 0000000
  if (committente.pec && committente.codiceSDI === '0000000') {
    xml += `
            <PECDestinatario>${escapeXml(committente.pec)}</PECDestinatario>`;
  }
  
  // Contatti trasmittente
  if (intermediario?.telefono || azienda.telefono) {
    xml += `
            <ContattiTrasmittente>
                <Telefono>${escapeXml(intermediario?.telefono || azienda.telefono || '')}</Telefono>
            </ContattiTrasmittente>`;
  }
  
  xml += `
        </DatiTrasmissione>
        <CedentePrestatore>
            <DatiAnagrafici>
                <IdFiscaleIVA>
                    <IdPaese>IT</IdPaese>
                    <IdCodice>${escapeXml(azienda.partitaIva)}</IdCodice>
                </IdFiscaleIVA>
                <CodiceFiscale>${escapeXml(azienda.codiceFiscale)}</CodiceFiscale>
                <Anagrafica>
                    <Denominazione>${escapeXml(azienda.denominazione)}</Denominazione>
                </Anagrafica>
                <RegimeFiscale>RF01</RegimeFiscale>
            </DatiAnagrafici>
            <Sede>
                <Indirizzo>${escapeXml(azienda.indirizzo)}</Indirizzo>
                <CAP>${escapeXml(azienda.cap)}</CAP>
                <Comune>${escapeXml(azienda.comune)}</Comune>
                <Provincia>${escapeXml(azienda.provincia)}</Provincia>
                <Nazione>IT</Nazione>
            </Sede>
            <IscrizioneREA>
                <Ufficio>${escapeXml(azienda.reaUfficio)}</Ufficio>
                <NumeroREA>${escapeXml(azienda.reaNumero)}</NumeroREA>
                <CapitaleSociale>${formatDecimal(parseFloat(azienda.reaCapitaleSociale))}</CapitaleSociale>
                <SocioUnico>${azienda.reaSocioUnico}</SocioUnico>
                <StatoLiquidazione>${azienda.reaStatoLiquidazione}</StatoLiquidazione>
            </IscrizioneREA>
            <Contatti>`;
  
  if (azienda.telefono) {
    xml += `
                <Telefono>${escapeXml(azienda.telefono)}</Telefono>`;
  }
  if (azienda.email) {
    xml += `
                <Email>${escapeXml(azienda.email)}</Email>`;
  }
  
  xml += `
            </Contatti>
        </CedentePrestatore>
        <CessionarioCommittente>
            <DatiAnagrafici>`;
  
  // ID Fiscale IVA committente (se ha P.IVA)
  if (committente.partitaIva) {
    xml += `
                <IdFiscaleIVA>
                    <IdPaese>IT</IdPaese>
                    <IdCodice>${escapeXml(committente.partitaIva)}</IdCodice>
                </IdFiscaleIVA>`;
  }
  
  // Codice Fiscale committente
  if (committente.codiceFiscale) {
    xml += `
                <CodiceFiscale>${escapeXml(committente.codiceFiscale)}</CodiceFiscale>`;
  }
  
  xml += `
                <Anagrafica>
                    <Denominazione>${escapeXml(committente.denominazione)}</Denominazione>
                </Anagrafica>
            </DatiAnagrafici>
            <Sede>
                <Indirizzo>${escapeXml(committente.indirizzo)}</Indirizzo>
                <CAP>${escapeXml(committente.cap)}</CAP>
                <Comune>${escapeXml(committente.comune)}</Comune>
                <Provincia>${escapeXml(committente.provincia)}</Provincia>
                <Nazione>IT</Nazione>
            </Sede>
        </CessionarioCommittente>`;
  
  // Terzo Intermediario (se presente)
  if (intermediario) {
    xml += `
        <TerzoIntermediarioOSoggettoEmittente>
            <DatiAnagrafici>
                <IdFiscaleIVA>
                    <IdPaese>IT</IdPaese>
                    <IdCodice>${escapeXml(intermediario.partitaIva)}</IdCodice>
                </IdFiscaleIVA>
                <CodiceFiscale>${escapeXml(intermediario.codiceFiscale)}</CodiceFiscale>
                <Anagrafica>
                    <Denominazione>${escapeXml(intermediario.denominazione)}</Denominazione>
                </Anagrafica>
            </DatiAnagrafici>
        </TerzoIntermediarioOSoggettoEmittente>
        <SoggettoEmittente>TZ</SoggettoEmittente>`;
  }
  
  xml += `
    </FatturaElettronicaHeader>
    <FatturaElettronicaBody>
        <DatiGenerali>
            <DatiGeneraliDocumento>
                <TipoDocumento>TD01</TipoDocumento>
                <Divisa>EUR</Divisa>
                <Data>${formatDate(fattura.data)}</Data>
                <Numero>${escapeXml(fattura.numero)}</Numero>
                <ImportoTotaleDocumento>${formatDecimal(fattura.totale)}</ImportoTotaleDocumento>
                <Causale>${escapeXml(fattura.causale)}</Causale>
            </DatiGeneraliDocumento>
        </DatiGenerali>
        <DatiBeniServizi>`;
  
  // Righe fattura
  for (const riga of fattura.righe) {
    xml += `
            <DettaglioLinee>
                <NumeroLinea>${riga.numeroLinea}</NumeroLinea>
                <Descrizione>${escapeXml(riga.descrizione)}</Descrizione>
                <Quantita>${formatDecimal(riga.quantita)}</Quantita>
                <PrezzoUnitario>${formatDecimal(riga.prezzoUnitario)}</PrezzoUnitario>
                <PrezzoTotale>${formatDecimal(riga.prezzoTotale)}</PrezzoTotale>
                <AliquotaIVA>${formatDecimal(riga.aliquotaIva)}</AliquotaIVA>
            </DettaglioLinee>`;
  }
  
  // Riepilogo IVA
  xml += `
            <DatiRiepilogo>
                <AliquotaIVA>${formatDecimal(fattura.aliquotaIva)}</AliquotaIVA>
                <ImponibileImporto>${formatDecimal(fattura.imponibile)}</ImponibileImporto>
                <Imposta>${formatDecimal(fattura.imposta)}</Imposta>
                <EsigibilitaIVA>${esigibilitaIva}</EsigibilitaIVA>
            </DatiRiepilogo>
        </DatiBeniServizi>
        <DatiPagamento>
            <CondizioniPagamento>TP02</CondizioniPagamento>
            <DettaglioPagamento>
                <ModalitaPagamento>MP05</ModalitaPagamento>
                <DataScadenzaPagamento>${formatDate(fattura.dataScadenza)}</DataScadenzaPagamento>
                <ImportoPagamento>${formatDecimal(fattura.splitPayment ? fattura.imponibile : fattura.totale)}</ImportoPagamento>
                <IstitutoFinanziario>${escapeXml(azienda.denominazione)}</IstitutoFinanziario>
                <IBAN>${escapeXml(azienda.iban)}</IBAN>
            </DettaglioPagamento>
        </DatiPagamento>
    </FatturaElettronicaBody>
</ns3:FatturaElettronica>`;
  
  return xml;
}

// ============================================
// GENERATORE XML NOTA DI CREDITO
// ============================================

interface NotaDiCreditoXMLParams {
  azienda: DatiAzienda;
  intermediario?: DatiIntermediario;
  committente: DatiCommittente;
  notaCredito: {
    numero: string;
    data: Date;
    fatturaRiferimento: {
      numero: string;
      data: Date;
    };
    motivazione: string;
    righe: RigaFattura[];
    imponibile: number;
    aliquotaIva: number;
    imposta: number;
    totale: number;
    splitPayment: boolean;
    progressivoInvio: string;
  };
}

export function generaNotaDiCreditoXML(params: NotaDiCreditoXMLParams): string {
  const { azienda, intermediario, committente, notaCredito } = params;
  
  const formatoTrasmissione = committente.isPubblicaAmministrazione ? 'FPA12' : 'FPR12';
  const esigibilitaIva = notaCredito.splitPayment ? 'S' : 'I';
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<ns3:FatturaElettronica xmlns:ns3="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" versione="${formatoTrasmissione}">
    <FatturaElettronicaHeader>
        <DatiTrasmissione>
            <IdTrasmittente>
                <IdPaese>IT</IdPaese>
                <IdCodice>${escapeXml(intermediario?.partitaIva || azienda.partitaIva)}</IdCodice>
            </IdTrasmittente>
            <ProgressivoInvio>${escapeXml(notaCredito.progressivoInvio)}</ProgressivoInvio>
            <FormatoTrasmissione>${formatoTrasmissione}</FormatoTrasmissione>
            <CodiceDestinatario>${escapeXml(committente.codiceSDI)}</CodiceDestinatario>
        </DatiTrasmissione>
        <CedentePrestatore>
            <DatiAnagrafici>
                <IdFiscaleIVA>
                    <IdPaese>IT</IdPaese>
                    <IdCodice>${escapeXml(azienda.partitaIva)}</IdCodice>
                </IdFiscaleIVA>
                <CodiceFiscale>${escapeXml(azienda.codiceFiscale)}</CodiceFiscale>
                <Anagrafica>
                    <Denominazione>${escapeXml(azienda.denominazione)}</Denominazione>
                </Anagrafica>
                <RegimeFiscale>RF01</RegimeFiscale>
            </DatiAnagrafici>
            <Sede>
                <Indirizzo>${escapeXml(azienda.indirizzo)}</Indirizzo>
                <CAP>${escapeXml(azienda.cap)}</CAP>
                <Comune>${escapeXml(azienda.comune)}</Comune>
                <Provincia>${escapeXml(azienda.provincia)}</Provincia>
                <Nazione>IT</Nazione>
            </Sede>
            <IscrizioneREA>
                <Ufficio>${escapeXml(azienda.reaUfficio)}</Ufficio>
                <NumeroREA>${escapeXml(azienda.reaNumero)}</NumeroREA>
                <CapitaleSociale>${formatDecimal(parseFloat(azienda.reaCapitaleSociale))}</CapitaleSociale>
                <SocioUnico>${azienda.reaSocioUnico}</SocioUnico>
                <StatoLiquidazione>${azienda.reaStatoLiquidazione}</StatoLiquidazione>
            </IscrizioneREA>
            <Contatti>
                ${azienda.telefono ? `<Telefono>${escapeXml(azienda.telefono)}</Telefono>` : ''}
                ${azienda.email ? `<Email>${escapeXml(azienda.email)}</Email>` : ''}
            </Contatti>
        </CedentePrestatore>
        <CessionarioCommittente>
            <DatiAnagrafici>
                ${committente.partitaIva ? `
                <IdFiscaleIVA>
                    <IdPaese>IT</IdPaese>
                    <IdCodice>${escapeXml(committente.partitaIva)}</IdCodice>
                </IdFiscaleIVA>` : ''}
                ${committente.codiceFiscale ? `<CodiceFiscale>${escapeXml(committente.codiceFiscale)}</CodiceFiscale>` : ''}
                <Anagrafica>
                    <Denominazione>${escapeXml(committente.denominazione)}</Denominazione>
                </Anagrafica>
            </DatiAnagrafici>
            <Sede>
                <Indirizzo>${escapeXml(committente.indirizzo)}</Indirizzo>
                <CAP>${escapeXml(committente.cap)}</CAP>
                <Comune>${escapeXml(committente.comune)}</Comune>
                <Provincia>${escapeXml(committente.provincia)}</Provincia>
                <Nazione>IT</Nazione>
            </Sede>
        </CessionarioCommittente>`;
  
  if (intermediario) {
    xml += `
        <TerzoIntermediarioOSoggettoEmittente>
            <DatiAnagrafici>
                <IdFiscaleIVA>
                    <IdPaese>IT</IdPaese>
                    <IdCodice>${escapeXml(intermediario.partitaIva)}</IdCodice>
                </IdFiscaleIVA>
                <CodiceFiscale>${escapeXml(intermediario.codiceFiscale)}</CodiceFiscale>
                <Anagrafica>
                    <Denominazione>${escapeXml(intermediario.denominazione)}</Denominazione>
                </Anagrafica>
            </DatiAnagrafici>
        </TerzoIntermediarioOSoggettoEmittente>
        <SoggettoEmittente>TZ</SoggettoEmittente>`;
  }
  
  xml += `
    </FatturaElettronicaHeader>
    <FatturaElettronicaBody>
        <DatiGenerali>
            <DatiGeneraliDocumento>
                <TipoDocumento>TD04</TipoDocumento>
                <Divisa>EUR</Divisa>
                <Data>${formatDate(notaCredito.data)}</Data>
                <Numero>${escapeXml(notaCredito.numero)}</Numero>
                <ImportoTotaleDocumento>${formatDecimal(notaCredito.totale)}</ImportoTotaleDocumento>
                <Causale>${escapeXml(notaCredito.motivazione)}</Causale>
            </DatiGeneraliDocumento>
            <DatiFattureCollegate>
                <IdDocumento>${escapeXml(notaCredito.fatturaRiferimento.numero)}</IdDocumento>
                <Data>${formatDate(notaCredito.fatturaRiferimento.data)}</Data>
            </DatiFattureCollegate>
        </DatiGenerali>
        <DatiBeniServizi>`;
  
  for (const riga of notaCredito.righe) {
    xml += `
            <DettaglioLinee>
                <NumeroLinea>${riga.numeroLinea}</NumeroLinea>
                <Descrizione>${escapeXml(riga.descrizione)}</Descrizione>
                <Quantita>${formatDecimal(riga.quantita)}</Quantita>
                <PrezzoUnitario>${formatDecimal(riga.prezzoUnitario)}</PrezzoUnitario>
                <PrezzoTotale>${formatDecimal(riga.prezzoTotale)}</PrezzoTotale>
                <AliquotaIVA>${formatDecimal(riga.aliquotaIva)}</AliquotaIVA>
            </DettaglioLinee>`;
  }
  
  xml += `
            <DatiRiepilogo>
                <AliquotaIVA>${formatDecimal(notaCredito.aliquotaIva)}</AliquotaIVA>
                <ImponibileImporto>${formatDecimal(notaCredito.imponibile)}</ImponibileImporto>
                <Imposta>${formatDecimal(notaCredito.imposta)}</Imposta>
                <EsigibilitaIVA>${esigibilitaIva}</EsigibilitaIVA>
            </DatiRiepilogo>
        </DatiBeniServizi>
    </FatturaElettronicaBody>
</ns3:FatturaElettronica>`;
  
  return xml;
}

// ============================================
// GENERA RIGHE FATTURA
// ============================================

interface ArtistaAgibilitaInput {
  nome: string;
  cognome: string;
  nomeDarte?: string | null;
  compensoLordo: number;
}

interface AgibilitaInput {
  codice: string;
  data: Date;
  locale: { nome: string };
  artisti: ArtistaAgibilitaInput[];
  quotaAgenzia: number; // Quota per artista
}

type ModalitaRighe = 'DETTAGLIO_SPESE_SEPARATE' | 'DETTAGLIO_SPESE_INCLUSE' | 'VOCE_UNICA';

export function generaRigheFattura(
  agibilita: AgibilitaInput[],
  modalita: ModalitaRighe,
  aliquotaIva: number = 22,
  descrizioneGenerica?: string
): { righe: RigaFattura[]; imponibile: number; imposta: number; totale: number } {
  const righe: RigaFattura[] = [];
  let numeroLinea = 1;
  let totaleImponibile = 0;
  
  if (modalita === 'VOCE_UNICA') {
    // Una sola riga generica
    let totale = 0;
    const riferimenti: string[] = [];
    
    for (const agi of agibilita) {
      const causale = generaCausale(agi.data, agi.locale.nome);
      riferimenti.push(causale);
      
      for (const art of agi.artisti) {
        totale += art.compensoLordo + agi.quotaAgenzia;
      }
    }
    
    const descrizione = descrizioneGenerica || 
      `Servizi di produzione artistica (${riferimenti.join(' / ')})`;
    
    righe.push({
      numeroLinea: 1,
      descrizione,
      quantita: 1,
      prezzoUnitario: totale,
      prezzoTotale: totale,
      aliquotaIva,
    });
    
    totaleImponibile = totale;
    
  } else if (modalita === 'DETTAGLIO_SPESE_INCLUSE') {
    // Una riga per artista con spese incluse
    for (const agi of agibilita) {
      for (const art of agi.artisti) {
        const nomeCompleto = art.nomeDarte 
          ? `${art.nome} ${art.cognome} - "${art.nomeDarte}"` 
          : `${art.nome} ${art.cognome}`;
        
        const importo = art.compensoLordo + agi.quotaAgenzia;
        
        righe.push({
          numeroLinea,
          descrizione: `${nomeCompleto} - Compenso e gestione`,
          quantita: 1,
          prezzoUnitario: importo,
          prezzoTotale: importo,
          aliquotaIva,
        });
        
        totaleImponibile += importo;
        numeroLinea++;
      }
    }
    
  } else {
    // DETTAGLIO_SPESE_SEPARATE: righe artisti + riga spese
    let totaleSpese = 0;
    let totaleArtisti = 0;
    
    for (const agi of agibilita) {
      for (const art of agi.artisti) {
        const nomeCompleto = art.nomeDarte 
          ? `${art.nome} ${art.cognome} - "${art.nomeDarte}"` 
          : `${art.nome} ${art.cognome}`;
        
        righe.push({
          numeroLinea,
          descrizione: `${nomeCompleto} - Compenso lordo`,
          quantita: 1,
          prezzoUnitario: art.compensoLordo,
          prezzoTotale: art.compensoLordo,
          aliquotaIva,
        });
        
        totaleArtisti += art.compensoLordo;
        totaleSpese += agi.quotaAgenzia;
        numeroLinea++;
      }
    }
    
    // Riga spese di gestione
    if (totaleSpese > 0) {
      const numArtisti = agibilita.reduce((sum, a) => sum + a.artisti.length, 0);
      const quotaPerArtista = totaleSpese / numArtisti;
      
      righe.push({
        numeroLinea,
        descrizione: `Spese di gestione (${numArtisti} artisti × €${quotaPerArtista.toFixed(2)})`,
        quantita: 1,
        prezzoUnitario: totaleSpese,
        prezzoTotale: totaleSpese,
        aliquotaIva,
      });
    }
    
    totaleImponibile = totaleArtisti + totaleSpese;
  }
  
  const imposta = totaleImponibile * (aliquotaIva / 100);
  const totale = totaleImponibile + imposta;
  
  return {
    righe,
    imponibile: Math.round(totaleImponibile * 100) / 100,
    imposta: Math.round(imposta * 100) / 100,
    totale: Math.round(totale * 100) / 100,
  };
}

// ============================================
// CALCOLA DATA SCADENZA
// ============================================

export function calcolaDataScadenza(
  dataFattura: Date,
  giorni: number,
  fineMese: boolean
): Date {
  const scadenza = new Date(dataFattura);
  scadenza.setDate(scadenza.getDate() + giorni);
  
  if (fineMese) {
    // Vai all'ultimo giorno del mese
    scadenza.setMonth(scadenza.getMonth() + 1);
    scadenza.setDate(0);
  }
  
  return scadenza;
}

// ============================================
// GENERA PROGRESSIVO INVIO
// ============================================

export function generaProgressivoInvio(anno: number, progressivo: number): string {
  // Formato: RCPxx (5 caratteri alfanumerici)
  const base36 = progressivo.toString(36).toUpperCase();
  return `RCP${base36.padStart(2, '0')}`;
}

// ============================================
// GENERA NUMERO FATTURA
// ============================================

export function generaNumeroFattura(progressivo: number): string {
  return progressivo.toString();
}

export function generaNumeroNotaCredito(anno: number, progressivo: number): string {
  return `NC-${anno}-${progressivo.toString().padStart(3, '0')}`;
}
