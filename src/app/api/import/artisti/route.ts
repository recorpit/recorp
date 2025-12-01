// src/app/api/import/artisti/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'

// Funzione per costruire la mappa qualifiche dal database
async function buildQualificaMap(): Promise<Record<string, string>> {
  const qualifiche = await prisma.qualificaConfig.findMany({
    where: { attivo: true }
  })
  
  const map: Record<string, string> = {}
  
  for (const q of qualifiche) {
    // Aggiungi il nome stesso
    map[q.nome.toLowerCase()] = q.nome
    
    // Aggiungi i sinonimi
    if (q.sinonimi) {
      const sinonimi = q.sinonimi.split(',').map(s => s.trim().toLowerCase())
      for (const sin of sinonimi) {
        if (sin) {
          map[sin] = q.nome
        }
      }
    }
  }
  
  return map
}

// Fallback se non ci sono qualifiche nel DB
const QUALIFICA_FALLBACK: Record<string, string> = {
  'dj': 'DJ',
  'vocalist': 'Vocalist/Cantante',
  'cantante': 'Vocalist/Cantante',
  'corista': 'Corista',
  'musicista': 'Musicista',
  'ballerino': 'Ballerino/a',
  'ballerina': 'Ballerino/a',
  'lucista': 'Tecnico Luci',
  'fotografo': 'Fotografo',
  'truccatore': 'Truccatore',
  'altro': 'Altro',
}

const TIPO_CONTRATTO_MAP: Record<string, string> = {
  'prestazione occasionale': 'PRESTAZIONE_OCCASIONALE',
  'occasionale': 'PRESTAZIONE_OCCASIONALE',
  'p.iva': 'P_IVA',
  'piva': 'P_IVA',
  'partita iva': 'P_IVA',
  'a chiamata': 'A_CHIAMATA',
  'chiamata': 'A_CHIAMATA',
  'full time': 'FULL_TIME',
  'fulltime': 'FULL_TIME',
}

const TIPO_DOCUMENTO_MAP: Record<string, string> = {
  'carta_identita': 'CARTA_IDENTITA',
  'carta identita': 'CARTA_IDENTITA',
  'cartaidentita': 'CARTA_IDENTITA',
  'carta di identita': 'CARTA_IDENTITA',
  'ci': 'CARTA_IDENTITA',
  'passaporto': 'PASSAPORTO',
  'passport': 'PASSAPORTO',
  'patente': 'PATENTE',
  'patente guida': 'PATENTE',
  'permesso_soggiorno': 'PERMESSO_SOGGIORNO',
  'permesso soggiorno': 'PERMESSO_SOGGIORNO',
  'permessosoggiorno': 'PERMESSO_SOGGIORNO',
  'altro': 'ALTRO',
}

function mapTipoDocumento(value: string | undefined): string | null {
  if (!value) return null
  const normalized = value.toLowerCase().trim().replace(/[\s_\-]+/g, ' ')
  return TIPO_DOCUMENTO_MAP[normalized] || TIPO_DOCUMENTO_MAP[value.toLowerCase().trim()] || null
}

function parseDate(value: string): Date | null {
  if (!value) return null
  
  // Prova vari formati
  const formats = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
  ]
  
  for (const format of formats) {
    const match = value.match(format)
    if (match) {
      if (format === formats[0]) {
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]))
      } else if (format === formats[1]) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
      } else {
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]))
      }
    }
  }
  
  return null
}

function normalizeRow(row: Record<string, string>) {
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    // Rimuove spazi, underscore, trattini e converte in minuscolo
    const normalizedKey = key.toLowerCase().trim().replace(/[\s_\-]+/g, '')
    normalized[normalizedKey] = String(value || '').trim()
  }
  return normalized
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mode = formData.get('mode') as string || 'create'
    
    if (!file) {
      return NextResponse.json({ error: 'Nessun file caricato' }, { status: 400 })
    }
    
    // Carica mappa qualifiche dal database
    let QUALIFICA_MAP = await buildQualificaMap()
    
    // Se il DB è vuoto, usa fallback
    if (Object.keys(QUALIFICA_MAP).length === 0) {
      QUALIFICA_MAP = QUALIFICA_FALLBACK
    }
    
    // Leggi file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
      defval: '',
      raw: false,
    })
    
    let imported = 0
    let updated = 0
    const errors: { row: number; message: string }[] = []
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = normalizeRow(jsonData[i])
      const rowNum = i + 2
      
      try {
        const cf = row.codicefiscale?.toUpperCase().trim()
        
        if (!cf || !row.cognome || !row.nome) {
          errors.push({ row: rowNum, message: 'Dati obbligatori mancanti' })
          continue
        }
        
        // Verifica se esiste
        const existing = await prisma.artista.findUnique({
          where: { codiceFiscale: cf }
        })
        
        if (existing && mode === 'create') {
          // Skip duplicato
          continue
        }
        
        // Prepara dati
        const dataNascita = parseDate(row.datanascita)
        const scadenzaDocumento = parseDate(row.scadenzadocumento)
        
        const qualifica = row.qualifica 
          ? QUALIFICA_MAP[row.qualifica.toLowerCase()] || 'Altro'
          : 'Altro'
        
        const tipoContratto = row.tipocontratto
          ? TIPO_CONTRATTO_MAP[row.tipocontratto.toLowerCase()] || 'PRESTAZIONE_OCCASIONALE'
          : 'PRESTAZIONE_OCCASIONALE'
        
        // Codice commercialista: usa quello dell'Excel se presente, altrimenti genera
        let codiceCommercialista = row.codicecommercialista?.trim() || existing?.codiceCommercialista || null
        
        // Se non c'è e stiamo creando, genera automaticamente
        if (!codiceCommercialista && (!existing || mode === 'create')) {
          const ultimoArtista = await prisma.artista.findFirst({
            where: { codiceCommercialista: { startsWith: '1000' } },
            orderBy: { codiceCommercialista: 'desc' }
          })
          let prossimoNumero = 1
          if (ultimoArtista?.codiceCommercialista) {
            const codice = ultimoArtista.codiceCommercialista
            const numeroStr = codice.substring(4).replace(/0+$/, '')
            prossimoNumero = (parseInt(numeroStr) || 0) + 1
          }
          // Per evitare conflitti in import batch, aggiungo l'indice della riga
          const numero = prossimoNumero + i
          codiceCommercialista = `1000${numero}${'0'.repeat(7 - numero.toString().length)}`
        }
        
        const artistaData = {
          cognome: row.cognome.toUpperCase(),
          nome: row.nome.toUpperCase(),
          codiceFiscale: cf,
          nomeDarte: row.nomedarte || null,
          dataNascita,
          comuneNascita: row.luogonascita?.toUpperCase() || null,
          provinciaNascita: row.provincianascita?.toUpperCase().substring(0, 2) || null,
          sesso: row.sesso?.toUpperCase().charAt(0) === 'F' ? 'F' : 'M',
          nazionalita: row.cittadinanza || row.nazionalita || 'IT',
          indirizzo: row.indirizzo || null,
          cap: row.cap || null,
          citta: row.citta?.toUpperCase() || null,
          provincia: row.provincia?.toUpperCase().substring(0, 2) || null,
          telefono: row.telefono || null,
          email: row.email?.toLowerCase() || null,
          iban: row.iban?.toUpperCase().replace(/\s/g, '') || null,
          bic: row.bic?.toUpperCase().replace(/\s/g, '') || null,
          codiceCommercialista,
          qualifica: qualifica,
          cachetBase: row.cachetbase ? parseFloat(row.cachetbase) : null,
          tipoContratto: tipoContratto as any,
          tipoDocumento: mapTipoDocumento(row.tipodocumento),
          numeroDocumento: row.numerodocumento || null,
          scadenzaDocumento,
          iscritto: !!(cf && row.cognome && row.nome && row.email && row.iban),
        }
        
        if (existing && mode === 'update') {
          await prisma.artista.update({
            where: { id: existing.id },
            data: artistaData,
          })
          updated++
        } else {
          await prisma.artista.create({
            data: artistaData,
          })
          imported++
        }
      } catch (err: any) {
        errors.push({ row: rowNum, message: err.message || 'Errore database' })
      }
    }
    
    return NextResponse.json({
      success: errors.length === 0,
      imported,
      updated,
      errors,
    })
  } catch (error) {
    console.error('Errore import:', error)
    return NextResponse.json({ error: 'Errore durante l\'import' }, { status: 500 })
  }
}
