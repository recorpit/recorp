import { Artista, Locale, Evento, Agibilita } from '@prisma/client'

export type { Artista, Locale, Evento, Agibilita }

export type ArtistaConRelazioni = Artista & {
  eventi?: Evento[]
  agibilita?: Agibilita[]
}

export type LocaleConRelazioni = Locale & {
  eventi?: Evento[]
}

export type EventoConRelazioni = Evento & {
  locale: Locale
  artista: Artista | null
  agibilita?: Agibilita[]
}

export type AgibilitaConRelazioni = Agibilita & {
  evento: Evento & { locale: Locale }
  artista: Artista
}