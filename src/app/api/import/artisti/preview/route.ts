// src/app/api/import/artisti/preview/route.ts
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const REQUIRED_COLUMNS = ['cognome', 'nome', 'codicefiscale']

function validateCodiceFiscale(cf: string): boolean {
  if (!cf) return false
  const cfClean = cf.toUpperCase().trim()
  return /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/.test(cfClean)
}

function validateRow(row: Record<string, string>, rowNum: number) {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Campi obbligatori (chiavi normalizzate in minuscolo)
  if (!row.cognome?.trim()) errors.push('Cognome mancante')
  if (!row.nome?.trim()) errors.push('Nome mancante')
  if (!row.codicefiscale?.trim()) {
    errors.push('Codice fiscale mancante')
  } else if (!validateCodiceFiscale(row.codicefiscale)) {
    errors.push('Codice fiscale non valido')
  }
  
  // Warnings
  if (!row.email?.trim()) warnings.push('Email mancante')
  if (!row.telefono?.trim()) warnings.push('Telefono mancante')
  if (!row.iban?.trim()) warnings.push('IBAN mancante')
  
  return {
    row: rowNum,
    data: row,
    errors,
    warnings,
    valid: errors.length === 0
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Nessun file caricato' }, { status: 400 })
    }
    
    // Leggi file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    
    // Prendi primo foglio
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    
    // Converti in JSON
    const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
      defval: '',
      raw: false,
    })
    
    if (jsonData.length === 0) {
      return NextResponse.json({ error: 'File vuoto o formato non valido' }, { status: 400 })
    }
    
    // Normalizza nomi colonne (lowercase, rimuove spazi/underscore/trattini)
    const normalizedData = jsonData.map(row => {
      const normalized: Record<string, string> = {}
      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = key.toLowerCase().trim().replace(/[\s_\-]+/g, '')
        normalized[normalizedKey] = String(value || '').trim()
      }
      return normalized
    })
    
    // Estrai colonne
    const columns = Object.keys(normalizedData[0] || {})
    
    // Verifica colonne obbligatorie
    const missingColumns = REQUIRED_COLUMNS.filter(col => 
      !columns.includes(col)
    )
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Colonne mancanti: ${missingColumns.join(', ')}. Assicurati che il file abbia le colonne: Cognome, Nome, CodiceFiscale` 
      }, { status: 400 })
    }
    
    // Valida ogni riga
    const rows = normalizedData.map((row, index) => validateRow(row, index + 2)) // +2 per header
    
    return NextResponse.json({
      columns,
      rows,
      totalRows: rows.length,
      validRows: rows.filter(r => r.valid).length,
      invalidRows: rows.filter(r => !r.valid).length,
    })
  } catch (error) {
    console.error('Errore preview import:', error)
    return NextResponse.json({ error: 'Errore nel parsing del file' }, { status: 500 })
  }
}
