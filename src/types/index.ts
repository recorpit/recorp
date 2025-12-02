import { Artista, Locale, Agibilita } from '@prisma/client'

export type { Artista, Locale, Agibilita }

export type ArtistaConRelazioni = Artista & {
  agibilita?: Agibilita[]
}

export type LocaleConRelazioni = Locale & {
  agibilita?: Agibilita[]
}

export type AgibilitaConRelazioni = Agibilita & {
  locale: Locale
  artisti: Array<{
    artista: Artista
    compensoLordo: number
    compensoNetto: number
  }>
  committente?: {
    ragioneSociale: string
    aRischio: boolean
  } | null
}