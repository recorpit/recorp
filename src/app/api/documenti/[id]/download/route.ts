// src/app/api/documenti/[id]/download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// Decodifica ID in path
function decodeId(id: string): string {
  try {
    return Buffer.from(id, 'base64url').toString('utf-8')
  } catch {
    return ''
  }
}

// Determina MIME type dall'estensione
function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv',
    'txt': 'text/plain',
    'zip': 'application/zip',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
  }
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream'
}

// GET - Download documento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const relativePath = decodeId(id)
    
    if (!relativePath) {
      return NextResponse.json({ error: 'ID non valido' }, { status: 400 })
    }
    
    const fullPath = path.join(process.cwd(), 'public', relativePath)
    
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'File non trovato' }, { status: 404 })
    }
    
    // Verifica che sia dentro la cartella uploads (sicurezza)
    const uploadsBase = path.join(process.cwd(), 'public', 'uploads')
    if (!fullPath.startsWith(uploadsBase)) {
      return NextResponse.json({ error: 'Accesso non autorizzato' }, { status: 403 })
    }
    
    const fileStat = await stat(fullPath)
    const fileName = path.basename(fullPath)
    const ext = path.extname(fileName).replace('.', '').toLowerCase()
    
    // Leggi file
    const fileBuffer = await readFile(fullPath)
    
    // Ritorna file per download
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': getMimeType(ext),
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': fileStat.size.toString(),
      }
    })
  } catch (error) {
    console.error('Errore download documento:', error)
    return NextResponse.json({ error: 'Errore nel download del documento' }, { status: 500 })
  }
}