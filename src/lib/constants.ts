// src/lib/constants.ts
// Costanti e utility per RECORP

// Riesporta da validazioni
export { 
  QUALIFICA_CODICE_INPS, 
  QUALIFICA_LABELS, 
  QUALIFICA_OPTIONS,
  TIPO_DOCUMENTO_LABELS,
  TIPO_DOCUMENTO_OPTIONS,
} from './validazioni'

// ============================================
// UTILITY ARROTONDAMENTO
// ============================================

// Arrotonda a 2 decimali (per evitare errori floating point)
export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ============================================
// TIPI CONTRATTO
// ============================================

export const TIPI_CONTRATTO = {
  A_CHIAMATA: { label: 'Contratto a Chiamata', descrizione: 'Lavoro intermittente' },
  P_IVA: { label: 'Partita IVA', descrizione: 'Libero professionista' },
  FULL_TIME: { label: 'Full Time', descrizione: 'Dipendente a tempo pieno' },
  PRESTAZIONE_OCCASIONALE: { label: 'Prestazione Occasionale', descrizione: 'Prestazione occasionale (max 2.500€/anno)' },
} as const

export const TIPO_CONTRATTO_OPTIONS = Object.entries(TIPI_CONTRATTO).map(([key, value]) => ({
  value: key,
  label: value.label,
  descrizione: value.descrizione,
}))

// ============================================
// TIPI PAGAMENTO
// ============================================

export const TIPI_PAGAMENTO = {
  STANDARD_15GG: { label: 'Standard 15gg', giorni: 15 },
  ANTICIPATO: { label: 'Anticipato', giorni: 0 },
  DOPO_INCASSO: { label: 'Dopo Incasso', giorni: null },
} as const

export const TIPO_PAGAMENTO_OPTIONS = Object.entries(TIPI_PAGAMENTO).map(([key, value]) => ({
  value: key,
  label: value.label,
}))

// ============================================
// TIPI LOCALE
// ============================================

export const TIPI_LOCALE = {
  CLUB: 'Club',
  DISCOTECA: 'Discoteca',
  BAR: 'Bar',
  RISTORANTE: 'Ristorante',
  PIAZZA: 'Piazza',
  TEATRO: 'Teatro',
  ARENA: 'Arena',
  STABILIMENTO: 'Stabilimento Balneare',
  PRIVATO: 'Evento Privato',
  ALTRO: 'Altro',
} as const

export const TIPO_LOCALE_OPTIONS = Object.entries(TIPI_LOCALE).map(([key, value]) => ({
  value: key,
  label: value,
}))

// ============================================
// STATI AGIBILITA
// ============================================

export const STATI_AGIBILITA = {
  BOZZA: { label: 'Bozza', color: 'gray', icon: '📝' },
  PRONTA: { label: 'Pronta', color: 'blue', icon: '✅' },
  INVIATA_INPS: { label: 'Inviata INPS', color: 'purple', icon: '📤' },
  COMPLETATA: { label: 'Confermata INPS', color: 'green', icon: '✔️' },
  ERRORE: { label: 'Errore', color: 'red', icon: '❌' },
} as const

export const STATO_AGIBILITA_OPTIONS = Object.entries(STATI_AGIBILITA).map(([key, value]) => ({
  value: key,
  label: value.label,
  color: value.color,
  icon: value.icon,
}))

// ============================================
// STATI PAGAMENTO
// ============================================

export const STATI_PAGAMENTO = {
  DA_PAGARE: { label: 'Da Pagare', color: 'red', icon: '💰' },
  IN_ATTESA_INCASSO: { label: 'In Attesa Incasso', color: 'yellow', icon: '⏳' },
  PAGATO: { label: 'Pagato', color: 'green', icon: '✅' },
  ANTICIPATO: { label: 'Anticipato', color: 'blue', icon: '⚡' },
} as const

export const STATO_PAGAMENTO_OPTIONS = Object.entries(STATI_PAGAMENTO).map(([key, value]) => ({
  value: key,
  label: value.label,
  color: value.color,
  icon: value.icon,
}))

// ============================================
// STATI FATTURA
// ============================================

export const STATI_FATTURA_AGIBILITA = {
  DA_FATTURARE: { label: 'Da Fatturare', color: 'gray' },
  FATTURATA: { label: 'Fatturata', color: 'blue' },
  PAGATA: { label: 'Pagata', color: 'green' },
} as const

// ============================================
// FORMULE CALCOLO COMPENSI
// ============================================

// Prestazione occasionale: ritenuta 20%
export function calcolaLordoDaNetto(netto: number): number {
  return round2(netto * 1.25)
}

export function calcolaNettoDALordo(lordo: number): number {
  return round2(lordo * 0.80)
}

export function calcolaRitenuta(lordo: number): number {
  return round2(lordo * 0.20)
}

export function calcolaImportoFattura(lordo: number, quotaAgenzia: number): number {
  return round2(lordo + quotaAgenzia)
}

// Calcolo completo da input
export function calcolaCompensi(input: { netto?: number; lordo?: number }, quotaAgenzia: number = 0) {
  let lordo: number
  let netto: number
  
  if (input.lordo !== undefined) {
    lordo = round2(input.lordo)
    netto = calcolaNettoDALordo(lordo)
  } else if (input.netto !== undefined) {
    netto = round2(input.netto)
    lordo = calcolaLordoDaNetto(netto)
  } else {
    throw new Error('Specificare netto o lordo')
  }
  
  const ritenuta = calcolaRitenuta(lordo)
  const importoFattura = calcolaImportoFattura(lordo, quotaAgenzia)
  
  return {
    lordo,
    netto,
    ritenuta,
    quotaAgenzia: round2(quotaAgenzia),
    importoFattura,
  }
}

// ============================================
// SCADENZA PAGAMENTO
// ============================================

export function calcolaScadenzaPagamento(
  dataEvento: Date,
  tipoPagamento: keyof typeof TIPI_PAGAMENTO,
  committenteARischio: boolean = false
): Date | null {
  // Se committente a rischio, suggerisce dopo incasso
  if (committenteARischio) {
    return null
  }
  
  const tipo = TIPI_PAGAMENTO[tipoPagamento]
  
  if (tipo.giorni === null) {
    return null // Dopo incasso
  }
  
  const scadenza = new Date(dataEvento)
  scadenza.setDate(scadenza.getDate() + tipo.giorni)
  return scadenza
}

// ============================================
// SOGLIA ANNUALE PRESTAZIONE OCCASIONALE
// ============================================

export const SOGLIA_PRESTAZIONE_OCCASIONALE = 2500 // EUR

export function calcolaAlertSoglia(sommaAnnuale: number): {
  percentuale: number
  livello: 'ok' | 'warning' | 'danger' | 'blocked'
  messaggio: string
} {
  const percentuale = (sommaAnnuale / SOGLIA_PRESTAZIONE_OCCASIONALE) * 100
  
  if (percentuale >= 100) {
    return {
      percentuale,
      livello: 'blocked',
      messaggio: `Soglia superata (${sommaAnnuale.toFixed(2)}€). Richiesto cambio tipo contratto.`,
    }
  }
  
  if (percentuale >= 95) {
    return {
      percentuale,
      livello: 'danger',
      messaggio: `Attenzione: ${percentuale.toFixed(0)}% della soglia raggiunta (${sommaAnnuale.toFixed(2)}€ / ${SOGLIA_PRESTAZIONE_OCCASIONALE}€)`,
    }
  }
  
  if (percentuale >= 80) {
    return {
      percentuale,
      livello: 'warning',
      messaggio: `${percentuale.toFixed(0)}% della soglia raggiunta (${sommaAnnuale.toFixed(2)}€ / ${SOGLIA_PRESTAZIONE_OCCASIONALE}€)`,
    }
  }
  
  return {
    percentuale,
    livello: 'ok',
    messaggio: `${percentuale.toFixed(0)}% della soglia (${sommaAnnuale.toFixed(2)}€ / ${SOGLIA_PRESTAZIONE_OCCASIONALE}€)`,
  }
}

// ============================================
// GENERAZIONE CODICE AGIBILITA
// ============================================

export function generaCodiceAgibilita(anno: number, progressivo: number): string {
  return `AG-${anno}-${String(progressivo).padStart(3, '0')}`
}

// ============================================
// VALIDAZIONE CODICE FISCALE
// ============================================

export function validaCodiceFiscale(cf: string): boolean {
  if (!cf) return false
  const regex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/
  return regex.test(cf.toUpperCase())
}

// ============================================
// DATI AZIENDA (per XML)
// ============================================

export const DATI_AZIENDA = {
  codiceFiscale: '04433920248',
  matricola: '9112806447',
  ragioneSociale: 'OKL SRL',
  indirizzo: 'Via Monte Pasubio 222/1',
  cap: '36010',
  citta: 'Zane',
  provincia: 'VI',
  codiceBelfiore: 'M145',
} as const

// Codici fiscali legali rappresentanti OKL (per XML INPS)
export const CF_LEGALI_RAPPRESENTANTI = [
  'ZLTSCR92P22I531P',
  'TMSCST88S22I531L',
] as const

// Funzione helper per verificare se CF è legale rappresentante
export function isLegaleRappresentante(codiceFiscale: string | null | undefined): boolean {
  if (!codiceFiscale) return false
  return CF_LEGALI_RAPPRESENTANTI.includes(codiceFiscale.toUpperCase() as any)
}

// Genera slug per nome cartella (es: "ARYA'S CLUB" → "aryas-club")
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
    .replace(/[^a-z0-9]+/g, '-') // Sostituisce non-alfanumerici con -
    .replace(/^-+|-+$/g, '') // Rimuove - iniziali/finali
    .substring(0, 100) // Limita lunghezza
}

// ============================================
// TIMEOUT E CONFIGURAZIONI
// ============================================

export const CONFIG = {
  // Prenotazione numero
  PRENOTAZIONE_SCADENZA_MINUTI: 30,
  
  // Lock bozze
  LOCK_SCADENZA_MINUTI: 15,
  
  // Autosalvataggio
  AUTOSAVE_INTERVALLO_SECONDI: 60,
  
  // Warning compensi
  COMPENSO_MINIMO_WARNING: 50,
} as const