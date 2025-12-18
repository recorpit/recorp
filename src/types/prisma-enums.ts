// src/types/prisma-enums.ts
// Enums manuali per evitare dipendenza da prisma generate

export const StatoUtente = {
  PENDING: 'PENDING',
  EMAIL_VERIFICATA: 'EMAIL_VERIFICATA',
  CONTRATTO_INVIATO: 'CONTRATTO_INVIATO',
  IN_APPROVAZIONE: 'IN_APPROVAZIONE',
  ATTIVO: 'ATTIVO',
  SOSPESO: 'SOSPESO',
} as const
export type StatoUtente = (typeof StatoUtente)[keyof typeof StatoUtente]

export const Qualifica = {
  DJ: 'DJ',
  VOCALIST: 'VOCALIST',
  CORISTA: 'CORISTA',
  MUSICISTA: 'MUSICISTA',
  BALLERINO: 'BALLERINO',
  LUCISTA: 'LUCISTA',
  FOTOGRAFO: 'FOTOGRAFO',
  TRUCCATORE: 'TRUCCATORE',
  ALTRO: 'ALTRO',
} as const
export type Qualifica = (typeof Qualifica)[keyof typeof Qualifica]

export const TipoDocumento = {
  CARTA_IDENTITA: 'CARTA_IDENTITA',
  PASSAPORTO: 'PASSAPORTO',
  PATENTE: 'PATENTE',
  PERMESSO_SOGGIORNO: 'PERMESSO_SOGGIORNO',
  ALTRO: 'ALTRO',
} as const
export type TipoDocumento = (typeof TipoDocumento)[keyof typeof TipoDocumento]

export const TipoContratto = {
  A_CHIAMATA: 'A_CHIAMATA',
  P_IVA: 'P_IVA',
  FULL_TIME: 'FULL_TIME',
  PRESTAZIONE_OCCASIONALE: 'PRESTAZIONE_OCCASIONALE',
} as const
export type TipoContratto = (typeof TipoContratto)[keyof typeof TipoContratto]

export const TipoPagamentoArtista = {
  STANDARD_15GG: 'STANDARD_15GG',
  ANTICIPATO: 'ANTICIPATO',
  DOPO_INCASSO: 'DOPO_INCASSO',
} as const
export type TipoPagamentoArtista = (typeof TipoPagamentoArtista)[keyof typeof TipoPagamentoArtista]

export const TipoLocale = {
  CLUB: 'CLUB',
  DISCOTECA: 'DISCOTECA',
  BAR: 'BAR',
  RISTORANTE: 'RISTORANTE',
  PIAZZA: 'PIAZZA',
  TEATRO: 'TEATRO',
  ARENA: 'ARENA',
  STABILIMENTO: 'STABILIMENTO',
  PRIVATO: 'PRIVATO',
  ALTRO: 'ALTRO',
} as const
export type TipoLocale = (typeof TipoLocale)[keyof typeof TipoLocale]

export const StatoAgibilita = {
  BOZZA: 'BOZZA',
  DATI_INCOMPLETI: 'DATI_INCOMPLETI',
  PRONTA: 'PRONTA',
  INVIATA_INPS: 'INVIATA_INPS',
  COMPLETATA: 'COMPLETATA',
  ERRORE: 'ERRORE',
} as const
export type StatoAgibilita = (typeof StatoAgibilita)[keyof typeof StatoAgibilita]

export const StatoPagamentoArtista = {
  DA_PAGARE: 'DA_PAGARE',
  IN_ATTESA_INCASSO: 'IN_ATTESA_INCASSO',
  PAGATO: 'PAGATO',
  ANTICIPATO: 'ANTICIPATO',
} as const
export type StatoPagamentoArtista = (typeof StatoPagamentoArtista)[keyof typeof StatoPagamentoArtista]

export const StatoFatturaAgibilita = {
  DA_FATTURARE: 'DA_FATTURARE',
  FATTURATA: 'FATTURATA',
  PAGATA: 'PAGATA',
} as const
export type StatoFatturaAgibilita = (typeof StatoFatturaAgibilita)[keyof typeof StatoFatturaAgibilita]

export const Richiedente = {
  COMMITTENTE: 'COMMITTENTE',
  OKL: 'OKL',
} as const
export type Richiedente = (typeof Richiedente)[keyof typeof Richiedente]

export const TipoNotifica = {
  RISCHIO: 'RISCHIO',
  SCADENZA_PAGAMENTO: 'SCADENZA_PAGAMENTO',
  SCADENZA_PRENOTAZIONE: 'SCADENZA_PRENOTAZIONE',
  LOCK_BOZZA: 'LOCK_BOZZA',
  SOGLIA_COMPENSI: 'SOGLIA_COMPENSI',
  DOCUMENTO_MANCANTE: 'DOCUMENTO_MANCANTE',
  SISTEMA: 'SISTEMA',
} as const
export type TipoNotifica = (typeof TipoNotifica)[keyof typeof TipoNotifica]

export const StatoFattura = {
  BOZZA: 'BOZZA',
  EMESSA: 'EMESSA',
  ESPORTATA: 'ESPORTATA',
  INVIATA: 'INVIATA',
  PAGATA: 'PAGATA',
  ANNULLATA: 'ANNULLATA',
} as const
export type StatoFattura = (typeof StatoFattura)[keyof typeof StatoFattura]

export const StatoBozza = {
  IN_LAVORAZIONE: 'IN_LAVORAZIONE',
  SOSPESA: 'SOSPESA',
  COMPLETATA: 'COMPLETATA',
} as const
export type StatoBozza = (typeof StatoBozza)[keyof typeof StatoBozza]

export const StatoRichiestaAgibilita = {
  NUOVA: 'NUOVA',
  IN_LAVORAZIONE: 'IN_LAVORAZIONE',
  EVASA: 'EVASA',
  RIFIUTATA: 'RIFIUTATA',
  ANNULLATA: 'ANNULLATA',
} as const
export type StatoRichiestaAgibilita = (typeof StatoRichiestaAgibilita)[keyof typeof StatoRichiestaAgibilita]

export const RuoloUtente = {
  ADMIN: 'ADMIN',
  OPERATORE: 'OPERATORE',
  ARTISTICO: 'ARTISTICO',
  PRODUZIONE: 'PRODUZIONE',
  FORMAT_MANAGER: 'FORMAT_MANAGER',
} as const
export type RuoloUtente = (typeof RuoloUtente)[keyof typeof RuoloUtente]

export const StatoPrestazione = {
  DA_GENERARE: 'DA_GENERARE',
  IN_ATTESA_INCASSO: 'IN_ATTESA_INCASSO',
  GENERATA: 'GENERATA',
  SOLLECITATA: 'SOLLECITATA',
  FIRMATA: 'FIRMATA',
  SCADUTA: 'SCADUTA',
  PAGABILE: 'PAGABILE',
  IN_DISTINTA: 'IN_DISTINTA',
  PAGATA: 'PAGATA',
} as const
export type StatoPrestazione = (typeof StatoPrestazione)[keyof typeof StatoPrestazione]

export const TipoPagamentoPrestazione = {
  STANDARD: 'STANDARD',
  ANTICIPATO: 'ANTICIPATO',
} as const
export type TipoPagamentoPrestazione = (typeof TipoPagamentoPrestazione)[keyof typeof TipoPagamentoPrestazione]

export const StatoFatturaArtista = {
  ATTESA_FATTURA: 'ATTESA_FATTURA',
  FATTURA_RICEVUTA: 'FATTURA_RICEVUTA',
  IN_DISTINTA: 'IN_DISTINTA',
  PAGATA: 'PAGATA',
} as const
export type StatoFatturaArtista = (typeof StatoFatturaArtista)[keyof typeof StatoFatturaArtista]

export const StatoPresenzaMensile = {
  IN_CORSO: 'IN_CORSO',
  DA_CONFERMARE: 'DA_CONFERMARE',
  CONFERMATA: 'CONFERMATA',
  ELABORATA: 'ELABORATA',
} as const
export type StatoPresenzaMensile = (typeof StatoPresenzaMensile)[keyof typeof StatoPresenzaMensile]

export const CategoriaDocumento = {
  ARTISTA: 'ARTISTA',
  COMMITTENTE: 'COMMITTENTE',
  LOCALE: 'LOCALE',
  AGIBILITA: 'AGIBILITA',
  FATTURA: 'FATTURA',
  CONTRATTO: 'CONTRATTO',
  RICEVUTA: 'RICEVUTA',
  AZIENDALE: 'AZIENDALE',
  ALTRO: 'ALTRO',
} as const
export type CategoriaDocumento = (typeof CategoriaDocumento)[keyof typeof CategoriaDocumento]

export const TipoFatturazione = {
  COMMITTENTE: 'COMMITTENTE',
  EVERYONE: 'EVERYONE',
} as const
export type TipoFatturazione = (typeof TipoFatturazione)[keyof typeof TipoFatturazione]

export const TipoEvento = {
  CONCERTO: 'CONCERTO',
  FESTIVAL: 'FESTIVAL',
  CLUB: 'CLUB',
  APERITIVO: 'APERITIVO',
  MATRIMONIO: 'MATRIMONIO',
  CORPORATE: 'CORPORATE',
  PIAZZA: 'PIAZZA',
  PRIVATO: 'PRIVATO',
  FORMAT: 'FORMAT',
  ALTRO: 'ALTRO',
} as const
export type TipoEvento = (typeof TipoEvento)[keyof typeof TipoEvento]

export const StatoEvento = {
  BOZZA: 'BOZZA',
  CONFERMATO: 'CONFERMATO',
  IN_CORSO: 'IN_CORSO',
  COMPLETATO: 'COMPLETATO',
  ANNULLATO: 'ANNULLATO',
  ARCHIVIATO: 'ARCHIVIATO',
} as const
export type StatoEvento = (typeof StatoEvento)[keyof typeof StatoEvento]

export const StatoFatturaPIVA = {
  ATTESA_FATTURA: 'ATTESA_FATTURA',
  FATTURA_RICEVUTA: 'FATTURA_RICEVUTA',
  IN_DISTINTA: 'IN_DISTINTA',
  PAGATA: 'PAGATA',
} as const
export type StatoFatturaPIVA = (typeof StatoFatturaPIVA)[keyof typeof StatoFatturaPIVA]

export const TipoRimborsoSpesa = {
  VIAGGIO: 'VIAGGIO',
  VITTO: 'VITTO',
  ALLOGGIO: 'ALLOGGIO',
  ALTRO: 'ALTRO',
} as const
export type TipoRimborsoSpesa = (typeof TipoRimborsoSpesa)[keyof typeof TipoRimborsoSpesa]

export const StatoBustaPaga = {
  DA_ELABORARE: 'DA_ELABORARE',
  ELABORATA: 'ELABORATA',
  INVIATA: 'INVIATA',
  PAGATA: 'PAGATA',
} as const
export type StatoBustaPaga = (typeof StatoBustaPaga)[keyof typeof StatoBustaPaga]
