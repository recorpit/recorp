// src/lib/paesi-esteri.ts
// Paesi esteri con codici Belfiore per agibilità INPS

export interface PaeseEstero {
  code: string      // Codice ISO 2 lettere
  name: string      // Nome paese
  belfiore: string  // Codice Belfiore (inizia con Z)
  capRegex?: string // Regex per validazione CAP (opzionale)
  capLength?: number // Lunghezza CAP tipica
}

export const PAESI_ESTERI: PaeseEstero[] = [
  { code: 'AT', name: 'Austria', belfiore: 'Z102', capLength: 4 },
  { code: 'BE', name: 'Belgio', belfiore: 'Z103', capLength: 4 },
  { code: 'CH', name: 'Svizzera', belfiore: 'Z133', capLength: 4 },
  { code: 'DE', name: 'Germania', belfiore: 'Z112', capLength: 5 },
  { code: 'ES', name: 'Spagna', belfiore: 'Z131', capLength: 5 },
  { code: 'FR', name: 'Francia', belfiore: 'Z110', capLength: 5 },
  { code: 'GB', name: 'Regno Unito', belfiore: 'Z114', capLength: 0 }, // UK ha formato alfanumerico
  { code: 'HR', name: 'Croazia', belfiore: 'Z149', capLength: 5 },
  { code: 'NL', name: 'Paesi Bassi', belfiore: 'Z126', capLength: 4 },
  { code: 'PL', name: 'Polonia', belfiore: 'Z127', capLength: 5 },
  { code: 'PT', name: 'Portogallo', belfiore: 'Z128', capLength: 4 },
  { code: 'SI', name: 'Slovenia', belfiore: 'Z150', capLength: 4 },
  { code: 'CZ', name: 'Repubblica Ceca', belfiore: 'Z156', capLength: 5 },
  { code: 'SK', name: 'Slovacchia', belfiore: 'Z155', capLength: 5 },
  { code: 'HU', name: 'Ungheria', belfiore: 'Z134', capLength: 4 },
  { code: 'RO', name: 'Romania', belfiore: 'Z129', capLength: 6 },
  { code: 'BG', name: 'Bulgaria', belfiore: 'Z104', capLength: 4 },
  { code: 'GR', name: 'Grecia', belfiore: 'Z115', capLength: 5 },
  { code: 'DK', name: 'Danimarca', belfiore: 'Z107', capLength: 4 },
  { code: 'SE', name: 'Svezia', belfiore: 'Z132', capLength: 5 },
  { code: 'FI', name: 'Finlandia', belfiore: 'Z109', capLength: 5 },
  { code: 'NO', name: 'Norvegia', belfiore: 'Z125', capLength: 4 },
  { code: 'IE', name: 'Irlanda', belfiore: 'Z116', capLength: 0 }, // Irlanda ha formato alfanumerico
  { code: 'LU', name: 'Lussemburgo', belfiore: 'Z120', capLength: 4 },
  { code: 'MC', name: 'Monaco', belfiore: 'Z123', capLength: 5 },
  { code: 'SM', name: 'San Marino', belfiore: 'Z130', capLength: 5 },
  { code: 'MT', name: 'Malta', belfiore: 'Z121', capLength: 0 }, // Malta ha formato alfanumerico
  { code: 'CY', name: 'Cipro', belfiore: 'Z211', capLength: 4 },
  { code: 'EE', name: 'Estonia', belfiore: 'Z144', capLength: 5 },
  { code: 'LV', name: 'Lettonia', belfiore: 'Z145', capLength: 4 },
  { code: 'LT', name: 'Lituania', belfiore: 'Z146', capLength: 5 },
]

// Funzione per ottenere codice Belfiore da codice paese
export function getBelfioreFromPaese(codePaese: string): string | null {
  const paese = PAESI_ESTERI.find(p => p.code === codePaese)
  return paese?.belfiore || null
}

// Funzione per ottenere nome paese da codice
export function getNomePaese(codePaese: string): string | null {
  const paese = PAESI_ESTERI.find(p => p.code === codePaese)
  return paese?.name || null
}

// Funzione per ottenere paese da codice Belfiore
export function getPaeseFromBelfiore(belfiore: string): PaeseEstero | null {
  return PAESI_ESTERI.find(p => p.belfiore === belfiore) || null
}

// Validazione CAP flessibile (italiano o estero)
export function isValidCAP(cap: string, isEstero: boolean = false, paeseCode?: string): boolean {
  if (!cap) return true // CAP opzionale
  
  if (!isEstero) {
    // CAP italiano: esattamente 5 cifre
    return /^[0-9]{5}$/.test(cap)
  }
  
  // CAP estero: più flessibile
  // Accetta 3-10 caratteri alfanumerici (con possibili spazi per UK/IE)
  const capClean = cap.replace(/\s/g, '')
  
  if (paeseCode) {
    const paese = PAESI_ESTERI.find(p => p.code === paeseCode)
    if (paese?.capLength === 0) {
      // Paesi con CAP alfanumerico (UK, IE, MT)
      return /^[A-Z0-9]{3,10}$/i.test(capClean)
    }
    if (paese?.capLength) {
      // Verifica lunghezza specifica
      return capClean.length === paese.capLength && /^[0-9]+$/.test(capClean)
    }
  }
  
  // Default: 3-10 caratteri
  return capClean.length >= 3 && capClean.length <= 10
}

// Validazione P.IVA flessibile (italiana o estera)
export function isValidPIVA(piva: string, isEstero: boolean = false): boolean {
  if (!piva) return true // P.IVA opzionale
  
  if (!isEstero) {
    // P.IVA italiana: esattamente 11 cifre
    return /^[0-9]{11}$/.test(piva)
  }
  
  // P.IVA estera: può avere prefisso lettere (es. DE123456789, FR12345678901)
  // Lunghezza variabile da 8 a 15 caratteri
  const pivaClean = piva.replace(/\s/g, '').toUpperCase()
  return /^[A-Z]{0,2}[0-9A-Z]{8,15}$/.test(pivaClean)
}

// Validazione Provincia
export function isValidProvincia(provincia: string, isEstero: boolean = false): boolean {
  if (!provincia) return true // Opzionale
  
  if (!isEstero) {
    // Provincia italiana: 2 lettere maiuscole
    return /^[A-Z]{2}$/.test(provincia.toUpperCase())
  }
  
  // Estera: più flessibile, 2-4 caratteri
  return provincia.length >= 2 && provincia.length <= 4
}
