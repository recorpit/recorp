// src/app/api/import/locali/preview/route.ts
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const REQUIRED_COLUMNS = ['nome', 'indirizzo', 'citta']

function validateRow(row: Record<string, string>, rowNum: number) {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!row.nome?.trim()) errors.push('Nome mancante')
  if (!row.indirizzo?.trim()) errors.push('Indirizzo mancante')
  if (!row.citta?.trim()) errors.push('Città mancante')
  
  if (!row.provincia?.trim()) warnings.push('Provincia mancante')
  if (!row.codiceinps?.trim()) warnings.push('Codice INPS mancante')
  
  return { row: rowNum, data: row, errors, warnings, valid: errors.length === 0 }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'Nessun file' }, { status: 400 })
    
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '', raw: false })
    
    if (jsonData.length === 0) return NextResponse.json({ error: 'File vuoto' }, { status: 400 })
    
    const normalizedData = jsonData.map(row => {
      const normalized: Record<string, string> = {}
      for (const [key, value] of Object.entries(row)) {
        normalized[key.toLowerCase().trim().replace(/\s+/g, '')] = String(value || '').trim()
      }
      return normalized
    })
    
    const columns = Object.keys(normalizedData[0] || {})
    const missingColumns = REQUIRED_COLUMNS.filter(col => !columns.includes(col))
    if (missingColumns.length > 0) {
      return NextResponse.json({ error: `Colonne mancanti: ${missingColumns.join(', ')}` }, { status: 400 })
    }
    
    const rows = normalizedData.map((row, i) => validateRow(row, i + 2))
    
    return NextResponse.json({ columns, rows })
  } catch (error) {
    return NextResponse.json({ error: 'Errore parsing' }, { status: 500 })
  }
}
