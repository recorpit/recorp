// src/lib/easyfatt-xml.ts
// Generatore XML formato Easyfatt per Danea
// Documentazione: https://www.danea.it/software/easyfatt/xml

import { format } from 'date-fns';

// ============================================
// MAPPING TIPI PAGAMENTO
// ============================================

const EASYFATT_PAGAMENTO: Record<string, string> = {
  'BONIFICO_VISTA': 'Bonifico bancario',
  'BONIFICO_30GG': 'Bonifico bancario 30gg FM',
  'BONIFICO_60GG': 'Bonifico bancario 60gg FM',
  'RIBA_30GG': 'Ricevuta bancaria',
  'RIBA_60GG': 'Ricevuta bancaria 60gg',
  'CARTA_CREDITO': 'Carta di credito',
  'CONTANTI': 'Contanti',
  'ASSEGNO': 'Assegno',
};

function getEasyfattPaymentName(tipoPagamento?: string): string {
  if (!tipoPagamento) return 'Bonifico bancario';
  return EASYFATT_PAGAMENTO[tipoPagamento] || 'Bonifico bancario';
}

// ============================================
// TIPI
// ============================================

interface EasyfattCompany {
  name: string;
  address: string;
  postcode: string;
  city: string;
  province: string;
  country?: string;
  fiscalCode: string;
  vatCode: string;
  tel?: string;
  fax?: string;
  email?: string;
  homePage?: string;
}

interface EasyfattCustomer {
  code?: string;
  name: string;
  address?: string;
  postcode?: string;
  city?: string;
  province?: string;
  country?: string;
  fiscalCode?: string;
  vatCode?: string;
  tel?: string;
  cellPhone?: string;
  fax?: string;
  email?: string;
  pec?: string;
  reference?: string;
  eInvoiceDestCode?: string;
}

interface EasyfattRow {
  code?: string;
  description: string;
  qty?: number;
  um?: string;
  price?: number;
  discounts?: string;
  vatCode?: number | string;
  vatPerc?: number;
  vatClass?: string;
  vatDescription?: string;
  total?: number;
  withholdingTax?: boolean;
  stock?: boolean;
  notes?: string;
}

interface EasyfattPayment {
  advance?: boolean;
  date: Date;
  amount: number;
  paid?: boolean;
}

interface EasyfattDocument {
  documentType: 'I' | 'N' | 'D' | 'Q' | 'C' | 'F' | 'L' | 'R' | 'P' | 'A' | 'B' | 'E' | 'G' | 'J' | 'M' | 'O' | 'S' | 'H';
  date: Date;
  number?: number;
  numbering?: string;
  customer: EasyfattCustomer;
  totalWithoutTax?: number;
  vatAmount?: number;
  total: number;
  pricesIncludeVat?: boolean;
  withholdingTaxPerc?: number;
  withholdingTaxPerc2?: number;
  withholdingTaxAmount?: number;
  contribDescription?: string;
  contribPerc?: number;
  contribAmount?: number;
  contribSubjectToWithholdingTax?: boolean;
  costDescription?: string;
  costAmount?: number;
  costVatCode?: number;
  paymentName?: string;
  paymentBank?: string;
  paymentAdvanceAmount?: number;
  delayedVat?: boolean;
  delayedVatDesc?: string;
  internalComment?: string;
  footNotes?: string;
  customField1?: string;
  customField2?: string;
  customField3?: string;
  customField4?: string;
  docReference?: string;
  warehouse?: string;
  priceList?: string;
  salesAgent?: string;
  rows: EasyfattRow[];
  payments?: EasyfattPayment[];
}

interface EasyfattXMLParams {
  company: EasyfattCompany;
  documents: EasyfattDocument[];
  appVersion?: number;
  creator?: string;
  creatorUrl?: string;
}

// ============================================
// HELPERS
// ============================================

function escapeXml(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDecimal(value: number | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null) return '';
  return value.toFixed(decimals);
}

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// ============================================
// GENERATORE XML EASYFATT
// ============================================

export function generaEasyfattXML(params: EasyfattXMLParams): string {
  const { 
    company, 
    documents, 
    appVersion = 2, 
    creator = 'RECORP', 
    creatorUrl = 'https://recorp.it' 
  } = params;

  // Costruisco XML pezzo per pezzo per evitare problemi
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<!--  File in formato Easyfatt-XML creato con ' + creator + '  -->\n';
  xml += '<EasyfattDocuments AppVersion="' + appVersion + '" Creator="' + escapeXml(creator) + '" CreatorUrl="' + escapeXml(creatorUrl) + '">\n';
  
  // Company
  xml += '  <Company>\n';
  xml += '    <Name>' + escapeXml(company.name) + '</Name>\n';
  xml += '    <Address>' + escapeXml(company.address) + '</Address>\n';
  xml += '    <Postcode>' + escapeXml(company.postcode) + '</Postcode>\n';
  xml += '    <City>' + escapeXml(company.city) + '</City>\n';
  xml += '    <Province>' + escapeXml(company.province) + '</Province>\n';
  xml += '    <Country>' + escapeXml(company.country || 'Italia') + '</Country>\n';
  xml += '    <FiscalCode>' + escapeXml(company.fiscalCode) + '</FiscalCode>\n';
  xml += '    <VatCode>' + escapeXml(company.vatCode) + '</VatCode>\n';
  if (company.tel) xml += '    <Tel>' + escapeXml(company.tel) + '</Tel>\n';
  if (company.fax) xml += '    <Fax>' + escapeXml(company.fax) + '</Fax>\n';
  if (company.email) xml += '    <Email>' + escapeXml(company.email) + '</Email>\n';
  if (company.homePage) xml += '    <HomePage>' + escapeXml(company.homePage) + '</HomePage>\n';
  xml += '  </Company>\n';
  
  // Documents
  xml += '  <Documents>\n';

  for (const doc of documents) {
    xml += '    <Document>\n';
    xml += '      <DocumentType>' + doc.documentType + '</DocumentType>\n';
    xml += '      <Date>' + formatDate(doc.date) + '</Date>\n';
    
    if (doc.number) xml += '      <Number>' + doc.number + '</Number>\n';
    if (doc.numbering) xml += '      <Numbering>' + escapeXml(doc.numbering) + '</Numbering>\n';
    if (doc.customer.code) xml += '      <CustomerCode>' + escapeXml(doc.customer.code) + '</CustomerCode>\n';
    
    xml += '      <CustomerName>' + escapeXml(doc.customer.name) + '</CustomerName>\n';
    
    if (doc.customer.address) xml += '      <CustomerAddress>' + escapeXml(doc.customer.address) + '</CustomerAddress>\n';
    if (doc.customer.postcode) xml += '      <CustomerPostcode>' + escapeXml(doc.customer.postcode) + '</CustomerPostcode>\n';
    if (doc.customer.city) xml += '      <CustomerCity>' + escapeXml(doc.customer.city) + '</CustomerCity>\n';
    if (doc.customer.province) xml += '      <CustomerProvince>' + escapeXml(doc.customer.province) + '</CustomerProvince>\n';
    if (doc.customer.country) xml += '      <CustomerCountry>' + escapeXml(doc.customer.country) + '</CustomerCountry>\n';
    if (doc.customer.fiscalCode) xml += '      <CustomerFiscalCode>' + escapeXml(doc.customer.fiscalCode) + '</CustomerFiscalCode>\n';
    if (doc.customer.vatCode) xml += '      <CustomerVatCode>' + escapeXml(doc.customer.vatCode) + '</CustomerVatCode>\n';
    if (doc.customer.tel) xml += '      <CustomerTel>' + escapeXml(doc.customer.tel) + '</CustomerTel>\n';
    if (doc.customer.cellPhone) xml += '      <CustomerCellPhone>' + escapeXml(doc.customer.cellPhone) + '</CustomerCellPhone>\n';
    if (doc.customer.fax) xml += '      <CustomerFax>' + escapeXml(doc.customer.fax) + '</CustomerFax>\n';
    if (doc.customer.email) xml += '      <CustomerEmail>' + escapeXml(doc.customer.email) + '</CustomerEmail>\n';
    if (doc.customer.pec) xml += '      <CustomerPec>' + escapeXml(doc.customer.pec) + '</CustomerPec>\n';
    if (doc.customer.reference) xml += '      <CustomerReference>' + escapeXml(doc.customer.reference) + '</CustomerReference>\n';
    if (doc.customer.eInvoiceDestCode) xml += '      <CustomerEInvoiceDestCode>' + escapeXml(doc.customer.eInvoiceDestCode) + '</CustomerEInvoiceDestCode>\n';
    
    if (doc.warehouse) xml += '      <Warehouse>' + escapeXml(doc.warehouse) + '</Warehouse>\n';
    if (doc.priceList) xml += '      <PriceList>' + escapeXml(doc.priceList) + '</PriceList>\n';
    if (doc.costDescription) xml += '      <CostDescription>' + escapeXml(doc.costDescription) + '</CostDescription>\n';
    if (doc.costVatCode) xml += '      <CostVatCode>' + doc.costVatCode + '</CostVatCode>\n';
    if (doc.costAmount) xml += '      <CostAmount>' + formatDecimal(doc.costAmount) + '</CostAmount>\n';
    
    xml += '      <TotalWithoutTax>' + formatDecimal(doc.totalWithoutTax || 0) + '</TotalWithoutTax>\n';
    xml += '      <VatAmount>' + formatDecimal(doc.vatAmount || 0) + '</VatAmount>\n';
    xml += '      <Total>' + formatDecimal(doc.total) + '</Total>\n';
    xml += '      <PricesIncludeVat>' + (doc.pricesIncludeVat ? 'true' : 'false') + '</PricesIncludeVat>\n';
    
    if (doc.withholdingTaxPerc) xml += '      <WithholdingTaxPerc>' + formatDecimal(doc.withholdingTaxPerc) + '</WithholdingTaxPerc>\n';
    if (doc.withholdingTaxPerc2) xml += '      <WithholdingTaxPerc2>' + formatDecimal(doc.withholdingTaxPerc2) + '</WithholdingTaxPerc2>\n';
    if (doc.withholdingTaxAmount) xml += '      <WithholdingTaxAmount>' + formatDecimal(doc.withholdingTaxAmount) + '</WithholdingTaxAmount>\n';
    if (doc.contribDescription) xml += '      <ContribDescription>' + escapeXml(doc.contribDescription) + '</ContribDescription>\n';
    if (doc.contribPerc) xml += '      <ContribPerc>' + formatDecimal(doc.contribPerc) + '</ContribPerc>\n';
    if (doc.contribAmount) xml += '      <ContribAmount>' + formatDecimal(doc.contribAmount) + '</ContribAmount>\n';
    if (doc.contribSubjectToWithholdingTax !== undefined) xml += '      <ContribSubjectToWithholdingTax>' + (doc.contribSubjectToWithholdingTax ? 'true' : 'false') + '</ContribSubjectToWithholdingTax>\n';
    
    if (doc.paymentName) xml += '      <PaymentName>' + escapeXml(doc.paymentName) + '</PaymentName>\n';
    if (doc.paymentBank) xml += '      <PaymentBank>' + escapeXml(doc.paymentBank) + '</PaymentBank>\n';
    if (doc.paymentAdvanceAmount) xml += '      <PaymentAdvanceAmount>' + formatDecimal(doc.paymentAdvanceAmount) + '</PaymentAdvanceAmount>\n';
    
    if (doc.delayedVat !== undefined) xml += '      <DelayedVat>' + (doc.delayedVat ? 'true' : 'false') + '</DelayedVat>\n';
    if (doc.delayedVatDesc) xml += '      <DelayedVatDesc>' + escapeXml(doc.delayedVatDesc) + '</DelayedVatDesc>\n';
    
    if (doc.docReference) xml += '      <DocReference>' + escapeXml(doc.docReference) + '</DocReference>\n';
    if (doc.internalComment) xml += '      <InternalComment>' + escapeXml(doc.internalComment) + '</InternalComment>\n';
    if (doc.footNotes) xml += '      <FootNotes>' + escapeXml(doc.footNotes) + '</FootNotes>\n';
    if (doc.customField1) xml += '      <CustomField1>' + escapeXml(doc.customField1) + '</CustomField1>\n';
    if (doc.customField2) xml += '      <CustomField2>' + escapeXml(doc.customField2) + '</CustomField2>\n';
    if (doc.customField3) xml += '      <CustomField3>' + escapeXml(doc.customField3) + '</CustomField3>\n';
    if (doc.customField4) xml += '      <CustomField4>' + escapeXml(doc.customField4) + '</CustomField4>\n';
    if (doc.salesAgent) xml += '      <SalesAgent>' + escapeXml(doc.salesAgent) + '</SalesAgent>\n';
    
    // Righe
    xml += '      <Rows>\n';
    
    for (const row of doc.rows) {
      xml += '        <Row>\n';
      if (row.code) xml += '          <Code>' + escapeXml(row.code) + '</Code>\n';
      xml += '          <Description>' + escapeXml(row.description) + '</Description>\n';
      if (row.qty !== undefined) xml += '          <Qty>' + formatDecimal(row.qty) + '</Qty>\n';
      if (row.um) xml += '          <Um>' + escapeXml(row.um) + '</Um>\n';
      if (row.price !== undefined) xml += '          <Price>' + formatDecimal(row.price) + '</Price>\n';
      if (row.discounts) xml += '          <Discounts>' + escapeXml(row.discounts) + '</Discounts>\n';
      
      if (row.vatCode !== undefined) {
        let vatAttrs = '';
        if (row.vatPerc !== undefined) vatAttrs += ' Perc="' + row.vatPerc + '"';
        if (row.vatClass) vatAttrs += ' Class="' + escapeXml(row.vatClass) + '"';
        if (row.vatDescription) vatAttrs += ' Description="' + escapeXml(row.vatDescription) + '"';
        xml += '          <VatCode' + vatAttrs + '>' + row.vatCode + '</VatCode>\n';
      }
      
      if (row.total !== undefined) xml += '          <Total>' + formatDecimal(row.total) + '</Total>\n';
      if (row.withholdingTax !== undefined) xml += '          <WithholdingTax>' + (row.withholdingTax ? 'true' : 'false') + '</WithholdingTax>\n';
      if (row.stock !== undefined) xml += '          <Stock>' + (row.stock ? 'true' : 'false') + '</Stock>\n';
      if (row.notes) xml += '          <Notes>' + escapeXml(row.notes) + '</Notes>\n';
      
      xml += '        </Row>\n';
    }
    
    xml += '      </Rows>\n';
    
    // Pagamenti
    if (doc.payments && doc.payments.length > 0) {
      xml += '      <Payments>\n';
      
      for (const payment of doc.payments) {
        xml += '        <Payment>\n';
        if (payment.advance !== undefined) xml += '          <Advance>' + (payment.advance ? 'true' : 'false') + '</Advance>\n';
        xml += '          <Date>' + formatDate(payment.date) + '</Date>\n';
        xml += '          <Amount>' + formatDecimal(payment.amount) + '</Amount>\n';
        if (payment.paid !== undefined) xml += '          <Paid>' + (payment.paid ? 'true' : 'false') + '</Paid>\n';
        xml += '        </Payment>\n';
      }
      
      xml += '      </Payments>\n';
    }
    
    xml += '    </Document>\n';
  }

  xml += '  </Documents>\n';
  xml += '</EasyfattDocuments>';

  return xml;
}

// ============================================
// HELPER: Converti fattura RECORP in formato Easyfatt
// ============================================

interface FatturaRECORP {
  numero: string;
  progressivo: number;
  dataEmissione: Date;
  dataScadenza: Date;
  imponibile: number;
  iva: number;
  totale: number;
  aliquotaIva: number;
  splitPayment: boolean;
  causale?: string;
  tipoPagamento?: string;
  righeFattura: Array<{
    numeroLinea: number;
    descrizione: string;
    quantita: number;
    prezzoUnitario: number;
    prezzoTotale: number;
    aliquotaIva: number;
  }>;
  committente: {
    ragioneSociale: string;
    partitaIva?: string;
    codiceFiscale?: string;
    indirizzoFatturazione?: string;
    capFatturazione?: string;
    cittaFatturazione?: string;
    provinciaFatturazione?: string;
    codiceSDI?: string;
    email?: string;
    pec?: string;
    telefono?: string;
  };
}

interface AziendaRECORP {
  ragioneSociale: string;
  partitaIva: string;
  codiceFiscale: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  telefono?: string;
  email?: string;
  iban?: string;
  banca?: string;
}

export function convertiFatturaToEasyfatt(
  fattura: FatturaRECORP,
  azienda: AziendaRECORP
): EasyfattXMLParams {
  const rows: EasyfattRow[] = fattura.righeFattura.map(riga => ({
    description: riga.descrizione,
    qty: riga.quantita,
    price: riga.prezzoUnitario,
    vatCode: riga.aliquotaIva,
    vatPerc: riga.aliquotaIva,
    vatClass: 'Imponibile',
    vatDescription: 'Aliquota ' + riga.aliquotaIva + '%',
    total: riga.prezzoTotale,
    stock: false,
  }));

  const document: EasyfattDocument = {
    documentType: 'I',
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
    totalWithoutTax: fattura.imponibile,
    vatAmount: fattura.iva,
    total: fattura.totale,
    pricesIncludeVat: false,
    paymentName: getEasyfattPaymentName(fattura.tipoPagamento),
    paymentBank: azienda.banca ? azienda.banca + ' - IBAN ' + azienda.iban : 'IBAN ' + azienda.iban,
    docReference: fattura.causale || undefined,
    footNotes: fattura.causale || undefined,
    delayedVat: fattura.splitPayment,
    delayedVatDesc: fattura.splitPayment ? 'Split Payment art. 17-ter DPR 633/72' : undefined,
    rows,
    payments: [
      {
        advance: false,
        date: fattura.dataScadenza,
        amount: fattura.splitPayment ? fattura.imponibile : fattura.totale,
        paid: false,
      }
    ],
  };

  return {
    company: {
      name: azienda.ragioneSociale,
      address: azienda.indirizzo,
      postcode: azienda.cap,
      city: azienda.citta,
      province: azienda.provincia,
      country: 'Italia',
      fiscalCode: azienda.codiceFiscale,
      vatCode: azienda.partitaIva,
      tel: azienda.telefono,
      email: azienda.email,
    },
    documents: [document],
    creator: 'RECORP',
    creatorUrl: 'https://recorp.it',
  };
}

export const EASYFATT_DOCUMENT_TYPES = {
  'A': 'Avviso di parcella',
  'B': 'Vendita al banco',
  'C': 'Ordine cliente',
  'D': 'Documento di trasporto',
  'E': 'Ordine fornitore',
  'F': 'Fattura accompagnatoria',
  'G': "Rapporto d'intervento",
  'H': 'Arrivi merce fornitore',
  'I': 'Fattura',
  'J': "Fattura d'acconto",
  'L': 'Fattura pro-forma',
  'M': 'Autofattura',
  'N': "Nota d'accredito",
  'O': "Nota d'addebito",
  'P': 'Parcella',
  'Q': 'Preventivo',
  'R': 'Ricevuta fiscale',
  'S': 'Preventivo fornitore',
} as const;
