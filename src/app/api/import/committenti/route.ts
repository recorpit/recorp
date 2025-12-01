// src/app/api/import/committenti/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'

function normalizeRow(row: Record<string, string>) {
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    normalized[key.toLowerCase().trim().replace(/\s+/g, '')] = String(value || '').trim()
  }
  return normalized
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mode = formData.get('mode') as string || 'create'
    
    if (!file) return NextResponse.json({ error: 'Nessun file' }, { status: 400 })
    
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '', raw: false })
    
    let imported = 0, updated = 0
    const errors: { row: number; message: string }[] = []
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = normalizeRow(jsonData[i])
      const rowNum = i + 2
      
      try {
        const piva = row.partitaiva?.replace(/\s/g, '')
        if (!piva || !row.ragionesociale) {
          errors.push({ row: rowNum, message: 'Dati obbligatori mancanti' })
          continue
        }
        
        const existing = await prisma.committente.findFirst({
          where: { partitaIva: piva }
        })
        
        if (existing && mode === 'create') continue
        
        const data = {
          ragioneSociale: row.ragionesociale.toUpperCase(),
          partitaIva: piva,
          codiceFiscale: row.codicefiscale?.toUpperCase() || piva,
          email: row.email?.toLowerCase() || null,
          pec: row.pec?.toLowerCase() || null,
          telefono: row.telefono || null,
          codiceSDI: row.codesdi || '0000000',
          indirizzoFatturazione: row.indirizzofatturazione || null,
          capFatturazione: row.capfatturazione || null,
          cittaFatturazione: row.cittafatturazione?.toUpperCase() || null,
          provinciaFatturazione: row.provinciafatturazione?.toUpperCase().substring(0, 2) || null,
          quotaAgenzia: row.quotaagenzia ? parseFloat(row.quotaagenzia) : 0,
          giorniPagamento: row.giornipagamento ? parseInt(row.giornipagamento) : 30,
          iban: row.iban?.toUpperCase().replace(/\s/g, '') || null,
          aRischio: row.arischio?.toLowerCase() === 'si' || row.arischio === '1',
          note: row.note || null,
        }
        
        if (existing && mode === 'update') {
          await prisma.committente.update({ where: { id: existing.id }, data })
          updated++
        } else {
          await prisma.committente.create({ data })
          imported++
        }
      } catch (err: any) {
        errors.push({ row: rowNum, message: err.message || 'Errore database' })
      }
    }
    
    return NextResponse.json({ success: errors.length === 0, imported, updated, errors })
  } catch (error) {
    return NextResponse.json({ error: 'Errore import' }, { status: 500 })
  }
}
