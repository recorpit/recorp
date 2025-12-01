// src/lib/validazioni.ts
// Utility per validazione e parsing dati italiani

// ============================================
// MAPPA QUALIFICA -> CODICE INPS
// ============================================

export const QUALIFICA_CODICE_INPS: Record<string, string> = {
  DJ: '032',
  VOCALIST: '031',
  CORISTA: '013',
  MUSICISTA: '081',
  BALLERINO: '092',
  LUCISTA: '117',
  FOTOGRAFO: '126',
  TRUCCATORE: '141',
  ALTRO: '032',
}

export const QUALIFICA_LABELS: Record<string, string> = {
  DJ: 'DJ',
  VOCALIST: 'Vocalist',
  CORISTA: 'Corista',
  MUSICISTA: 'Musicista',
  BALLERINO: 'Ballerino/a',
  LUCISTA: 'Tecnico Luci',
  FOTOGRAFO: 'Fotografo/a',
  TRUCCATORE: 'Truccatore/trice',
  ALTRO: 'Altro',
}

export const QUALIFICA_OPTIONS = Object.entries(QUALIFICA_LABELS).map(([value, label]) => ({
  value,
  label,
  codiceINPS: QUALIFICA_CODICE_INPS[value],
}))

// ============================================
// TIPO DOCUMENTO
// ============================================

export const TIPO_DOCUMENTO_LABELS: Record<string, string> = {
  CARTA_IDENTITA: 'Carta d\'Identità',
  PASSAPORTO: 'Passaporto',
  PATENTE: 'Patente di Guida',
  PERMESSO_SOGGIORNO: 'Permesso di Soggiorno',
  ALTRO: 'Altro',
}

export const TIPO_DOCUMENTO_OPTIONS = Object.entries(TIPO_DOCUMENTO_LABELS).map(([value, label]) => ({
  value,
  label,
}))

// ============================================
// VALIDAZIONE CODICE FISCALE
// ============================================

const CF_REGEX = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i

// Mappa mese CF
const MESI_CF: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, H: 6,
  L: 7, M: 8, P: 9, R: 10, S: 11, T: 12,
}

// Carattere di controllo
const CARATTERI_DISPARI: Record<string, number> = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
  'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
  'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
  'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23,
}

const CARATTERI_PARI: Record<string, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
  'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
  'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25,
}

const RESTO_CONTROLLO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export interface ValidazioneCF {
  valido: boolean
  errore?: string
  dati?: {
    sesso: 'M' | 'F'
    dataNascita: Date
    comuneCodice: string
    maggiorenne: boolean
    eta: number
  }
}

export function validaCodiceFiscale(cf: string): ValidazioneCF {
  if (!cf) {
    return { valido: false, errore: 'Codice fiscale mancante' }
  }
  
  const cfUpper = cf.toUpperCase().trim().replace(/\s/g, '')
  
  // Controllo formato
  if (cfUpper.length !== 16) {
    return { valido: false, errore: `${cfUpper.length}/16 caratteri` }
  }
  
  if (!CF_REGEX.test(cfUpper)) {
    return { valido: false, errore: 'Formato non valido (es: RSSMRA85M01H501Z)' }
  }
  
  // Calcolo carattere di controllo
  let somma = 0
  for (let i = 0; i < 15; i++) {
    const char = cfUpper[i]
    if (i % 2 === 0) {
      // Posizioni dispari (1,3,5...) -> indici 0,2,4...
      somma += CARATTERI_DISPARI[char] ?? 0
    } else {
      // Posizioni pari (2,4,6...) -> indici 1,3,5...
      somma += CARATTERI_PARI[char] ?? 0
    }
  }
  
  const carattereControlloCalcolato = RESTO_CONTROLLO[somma % 26]
  const carattereControlloReale = cfUpper[15]
  
  if (carattereControlloCalcolato !== carattereControlloReale) {
    return { 
      valido: false, 
      errore: `Ultimo carattere errato: dovrebbe essere "${carattereControlloCalcolato}" invece di "${carattereControlloReale}"` 
    }
  }
  
  // Estrai dati
  try {
    const dati = estraiDatiDaCF(cfUpper)
    return { valido: true, dati }
  } catch (e) {
    return { valido: false, errore: 'Errore nell\'estrazione dei dati' }
  }
}

export function estraiDatiDaCF(cf: string): {
  sesso: 'M' | 'F'
  dataNascita: Date
  comuneCodice: string
  maggiorenne: boolean
  eta: number
} {
  const cfUpper = cf.toUpperCase()
  
  // Anno (posizione 6-7)
  let anno = parseInt(cfUpper.substring(6, 8))
  
  // Mese (posizione 8)
  const meseChar = cfUpper[8]
  const mese = MESI_CF[meseChar] || 1
  
  // Giorno e sesso (posizione 9-10)
  let giorno = parseInt(cfUpper.substring(9, 11))
  let sesso: 'M' | 'F' = 'M'
  
  if (giorno > 40) {
    giorno -= 40
    sesso = 'F'
  }
  
  // Determina secolo (assumiamo che se anno > 30 sia 1900, altrimenti 2000)
  const annoCorrente = new Date().getFullYear()
  const secoloCorrente = Math.floor(annoCorrente / 100) * 100
  
  if (anno > (annoCorrente % 100) + 10) {
    anno += secoloCorrente - 100 // Secolo scorso
  } else {
    anno += secoloCorrente // Secolo corrente
  }
  
  // Codice comune (posizione 11-14)
  const comuneCodice = cfUpper.substring(11, 15)
  
  // Crea data nascita
  const dataNascita = new Date(anno, mese - 1, giorno)
  
  // Calcola età
  const oggi = new Date()
  let eta = oggi.getFullYear() - dataNascita.getFullYear()
  const meseOggi = oggi.getMonth()
  const giornoOggi = oggi.getDate()
  
  if (meseOggi < mese - 1 || (meseOggi === mese - 1 && giornoOggi < giorno)) {
    eta--
  }
  
  const maggiorenne = eta >= 18
  
  return {
    sesso,
    dataNascita,
    comuneCodice,
    maggiorenne,
    eta,
  }
}

// ============================================
// VALIDAZIONE IBAN
// ============================================

export interface ValidazioneIBAN {
  valido: boolean
  errore?: string
  paese?: string
}

export function validaIBAN(iban: string): ValidazioneIBAN {
  if (!iban) {
    return { valido: false, errore: 'IBAN mancante' }
  }
  
  // Rimuovi spazi e converti in maiuscolo
  const ibanClean = iban.replace(/\s/g, '').toUpperCase()
  
  // Lunghezza minima
  if (ibanClean.length < 15 || ibanClean.length > 34) {
    return { valido: false, errore: 'Lunghezza IBAN non valida' }
  }
  
  // Formato base: 2 lettere paese + 2 cifre controllo + BBAN
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(ibanClean)) {
    return { valido: false, errore: 'Formato IBAN non valido' }
  }
  
  const paese = ibanClean.substring(0, 2)
  
  // Lunghezze specifiche per paese
  const lunghezzePaese: Record<string, number> = {
    IT: 27, // Italia
    DE: 22, // Germania
    FR: 27, // Francia
    ES: 24, // Spagna
    GB: 22, // UK
    CH: 21, // Svizzera
    AT: 20, // Austria
    BE: 16, // Belgio
    NL: 18, // Paesi Bassi
  }
  
  if (lunghezzePaese[paese] && ibanClean.length !== lunghezzePaese[paese]) {
    return { 
      valido: false, 
      errore: `IBAN ${paese} deve avere ${lunghezzePaese[paese]} caratteri (trovati ${ibanClean.length})` 
    }
  }
  
  // Validazione checksum ISO 7064
  // Sposta i primi 4 caratteri alla fine
  const ibanRiordinato = ibanClean.substring(4) + ibanClean.substring(0, 4)
  
  // Converti lettere in numeri (A=10, B=11, ..., Z=35)
  let ibanNumerico = ''
  for (const char of ibanRiordinato) {
    if (/[A-Z]/.test(char)) {
      ibanNumerico += (char.charCodeAt(0) - 55).toString()
    } else {
      ibanNumerico += char
    }
  }
  
  // Calcola modulo 97 (usando divisione per blocchi per evitare overflow)
  let resto = 0
  for (let i = 0; i < ibanNumerico.length; i += 7) {
    const blocco = resto.toString() + ibanNumerico.substring(i, i + 7)
    resto = parseInt(blocco) % 97
  }
  
  if (resto !== 1) {
    return { valido: false, errore: 'Codice di controllo IBAN non valido' }
  }
  
  return { valido: true, paese }
}

// ============================================
// FORMATTAZIONE
// ============================================

export function formattaIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase()
  return clean.match(/.{1,4}/g)?.join(' ') || clean
}

export function formattaCF(cf: string): string {
  return cf.toUpperCase().trim()
}

// ============================================
// VERIFICA COMPLETEZZA ARTISTA
// ============================================

export interface CampoMancante {
  campo: string
  label: string
  obbligatorio: boolean
}

export function verificaCompletezzaArtista(artista: {
  nome?: string
  cognome?: string
  codiceFiscale?: string | null
  extraUE?: boolean
  dataNascita?: Date | string | null
  comuneNascita?: string | null
  provinciaNascita?: string | null
  indirizzo?: string | null
  cap?: string | null
  citta?: string | null
  provincia?: string | null
  email?: string | null
  telefono?: string | null
  iban?: string | null
  tipoDocumento?: string | null
  numeroDocumento?: string | null
}): {
  completo: boolean
  campiMancanti: CampoMancante[]
  percentuale: number
} {
  const campiMancanti: CampoMancante[] = []
  
  // Campi obbligatori
  if (!artista.nome) {
    campiMancanti.push({ campo: 'nome', label: 'Nome', obbligatorio: true })
  }
  if (!artista.cognome) {
    campiMancanti.push({ campo: 'cognome', label: 'Cognome', obbligatorio: true })
  }
  
  // CF obbligatorio solo se non Extra UE
  if (!artista.extraUE && !artista.codiceFiscale) {
    campiMancanti.push({ campo: 'codiceFiscale', label: 'Codice Fiscale', obbligatorio: true })
  }
  
  // Campi per iscrizione completa
  if (!artista.dataNascita) {
    campiMancanti.push({ campo: 'dataNascita', label: 'Data di Nascita', obbligatorio: true })
  }
  if (!artista.comuneNascita) {
    campiMancanti.push({ campo: 'comuneNascita', label: 'Comune di Nascita', obbligatorio: false })
  }
  if (!artista.indirizzo) {
    campiMancanti.push({ campo: 'indirizzo', label: 'Indirizzo', obbligatorio: false })
  }
  if (!artista.citta) {
    campiMancanti.push({ campo: 'citta', label: 'Città', obbligatorio: false })
  }
  if (!artista.email && !artista.telefono) {
    campiMancanti.push({ campo: 'contatto', label: 'Email o Telefono', obbligatorio: true })
  }
  if (!artista.iban) {
    campiMancanti.push({ campo: 'iban', label: 'IBAN', obbligatorio: true })
  }
  if (!artista.tipoDocumento || !artista.numeroDocumento) {
    campiMancanti.push({ campo: 'documento', label: 'Documento d\'Identità', obbligatorio: true })
  }
  
  // Calcola percentuale
  const totale = 10 // Numero totale campi verificati
  const compilati = totale - campiMancanti.length
  const percentuale = Math.round((compilati / totale) * 100)
  
  const completo = campiMancanti.filter(c => c.obbligatorio).length === 0
  
  return { completo, campiMancanti, percentuale }
}
