// src/types/index.ts
// Tipi personalizzati che non dipendono da prisma generate

import type { Decimal } from '@prisma/client/runtime/library'

// Re-export enums
export * from './prisma-enums'

// Base types per i modelli (senza dipendere da @prisma/client)
export interface Artista {
  id: string
  nome: string
  cognome: string
  nomeDarte?: string | null
  codiceFiscale?: string | null
  extraUE: boolean
  codiceFiscaleEstero?: string | null
  partitaIva?: string | null
  nazionalita?: string | null
  email?: string | null
  telefono?: string | null
  telefonoSecondario?: string | null
  indirizzo?: string | null
  cap?: string | null
  citta?: string | null
  provincia?: string | null
  dataNascita?: Date | null
  sesso?: string | null
  comuneNascita?: string | null
  provinciaNascita?: string | null
  qualifica: string
  tipoContratto: string
  cachetBase?: Decimal | number | null
  tipoDocumento?: string | null
  numeroDocumento?: string | null
  scadenzaDocumento?: Date | null
  iban?: string | null
  bic?: string | null
  tipoPagamento: string
  codiceCommercialista?: string | null
  iscritto: boolean
  note?: string | null
  noteInterne?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Locale {
  id: string
  nome: string
  tipoLocale: string
  indirizzo?: string | null
  cap?: string | null
  citta?: string | null
  provincia?: string | null
  codiceBelfiore?: string | null
  referenteNome?: string | null
  referenteTelefono?: string | null
  referenteEmail?: string | null
  committenteDefaultId?: string | null
  note?: string | null
  noteInterne?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Agibilita {
  id: string
  codice?: string | null
  data: Date
  localeId?: string | null
  committenteId?: string | null
  stato: string
  statoFattura: string
  estera: boolean
  richiedente: string
  totaleCompensiNetti?: Decimal | number | null
  totaleCompensiLordi?: Decimal | number | null
  totaleRitenute?: Decimal | number | null
  quotaAgenzia?: Decimal | number | null
  importoFattura?: Decimal | number | null
  note?: string | null
  noteInterne?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Committente {
  id: string
  ragioneSociale: string
  partitaIva?: string | null
  codiceFiscale?: string | null
  aRischio: boolean
  quotaAgenzia?: Decimal | number | null
  giorniPagamento?: number | null
  iban?: string | null
  note?: string | null
  noteInterne?: string | null
  createdAt: Date
  updatedAt: Date
}

// Tipi con relazioni
export type ArtistaConRelazioni = Artista & {
  agibilita?: Agibilita[]
}

export type LocaleConRelazioni = Locale & {
  agibilita?: Agibilita[]
}

export type AgibilitaConRelazioni = Agibilita & {
  locale?: Locale | null
  artisti?: Array<{
    artista: Artista
    compensoLordo: number
    compensoNetto: number
  }>
  committente?: {
    id: string
    ragioneSociale: string
    aRischio: boolean
    quotaAgenzia?: Decimal | number | null
  } | null
}
