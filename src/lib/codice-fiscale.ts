const DISPARI: Record<string, number> = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
  'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
  'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
  'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
}

const PARI: Record<string, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
  'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
  'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
}

const CONTROLLO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const MESI = 'ABCDEHLMPRST'

export function validaCodiceFiscale(cf: string): boolean {
  if (!cf || cf.length !== 16) return false
  
  cf = cf.toUpperCase()
  
  const pattern = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/
  if (!pattern.test(cf)) return false
  
  let somma = 0
  for (let i = 0; i < 15; i++) {
    const char = cf[i]
    somma += (i % 2 === 0) ? DISPARI[char] : PARI[char]
  }
  
  const controlloCalcolato = CONTROLLO[somma % 26]
  return cf[15] === controlloCalcolato
}

export function estraiDatiDaCF(cf: string): {
  sesso: 'M' | 'F'
  dataNascita: Date
  annoNascita: number
  meseNascita: number
  giornoNascita: number
} | null {
  if (!validaCodiceFiscale(cf)) return null
  
  cf = cf.toUpperCase()
  
  const anno = parseInt(cf.substring(6, 8))
  const annoCompleto = anno > 50 ? 1900 + anno : 2000 + anno
  const mese = MESI.indexOf(cf[8]) + 1
  let giorno = parseInt(cf.substring(9, 11))
  const sesso = giorno > 40 ? 'F' : 'M'
  if (giorno > 40) giorno -= 40
  
  return {
    sesso,
    dataNascita: new Date(annoCompleto, mese - 1, giorno),
    annoNascita: annoCompleto,
    meseNascita: mese,
    giornoNascita: giorno
  }
}