// src/app/api/import/locali/route.ts
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
        if (!row.nome || !row.indirizzo || !row.citta) {
          errors.push({ row: rowNum, message: 'Dati obbligatori mancanti' })
          continue
        }
        
        // Cerca locale esistente per nome+città
        const existing = await prisma.locale.findFirst({
          where: {
            nome: row.nome.toUpperCase(),
            citta: row.citta.toUpperCase()
          }
        })
        
        if (existing && mode === 'create') continue
        
        // Cerca committente default se specificato
        let committenteDefaultId = null
        if (row.committentedefaultragionesociale) {
          const committente = await prisma.committente.findFirst({
            where: {
              ragioneSociale: {
                contains: row.committentedefaultragionesociale,
                mode: 'insensitive'
              }
            }
          })
          if (committente) committenteDefaultId = committente.id
        }
        
        const data = {
          nome: row.nome.toUpperCase(),
          indirizzo: row.indirizzo,
          cap: row.cap || null,
          citta: row.citta.toUpperCase(),
          provincia: row.provincia?.toUpperCase().substring(0, 2) || null,
          codiceINPS: row.codiceinps || null,
          telefono: row.telefono || null,
          email: row.email?.toLowerCase() || null,
          committenteDefaultId,
          note: row.note || null,
        }
        
        if (existing && mode === 'update') {
          await prisma.locale.update({ where: { id: existing.id }, data })
          updated++
        } else {
          await prisma.locale.create({ data })
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
