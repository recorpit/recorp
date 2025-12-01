// src/app/api/documenti/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat, mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

const ARCHIVIO_BASE = path.join(process.cwd(), 'public', 'uploads')

// Categorie disponibili (corrispondono alle cartelle in public/uploads/)
const CATEGORIE = [
  'archivio',
  'committenti',
  'documenti',
  'locali',
  'ricevute',
]

interface DocumentoFS {
  id: string
  nome: string
  nomeVisualizzato: string
  path: string
  fullPath: string
  categoria: string
  sottoCartella: string | null
  dimensione: number
  estensione: string
  mimeType: string
  createdAt: string
  modifiedAt: string
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

// Genera ID univoco dal path
function generateId(filePath: string): string {
  return Buffer.from(filePath).toString('base64url')
}

// Scansiona ricorsivamente una cartella
async function scanDirectory(
  dirPath: string, 
  categoria: string, 
  sottoCartella: string | null = null
): Promise<DocumentoFS[]> {
  const documenti: DocumentoFS[] = []
  
  if (!existsSync(dirPath)) {
    return documenti
  }
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      
      if (entry.isDirectory()) {
        // Scansiona sottocartella (cliente)
        const subDocs = await scanDirectory(fullPath, categoria, entry.name)
        documenti.push(...subDocs)
      } else if (entry.isFile()) {
        // Ignora file nascosti e di sistema
        if (entry.name.startsWith('.') || entry.name === 'Thumbs.db') {
          continue
        }
        
        try {
          const fileStat = await stat(fullPath)
          const ext = path.extname(entry.name).replace('.', '').toLowerCase()
          const relativePath = fullPath.replace(path.join(process.cwd(), 'public'), '')
          
          documenti.push({
            id: generateId(relativePath),
            nome: entry.name,
            nomeVisualizzato: entry.name.replace(/\.[^/.]+$/, ''), // Rimuovi estensione
            path: relativePath.replace(/\\/g, '/'), // Normalizza per URL
            fullPath,
            categoria: categoria.toUpperCase(),
            sottoCartella,
            dimensione: fileStat.size,
            estensione: ext,
            mimeType: getMimeType(ext),
            createdAt: fileStat.birthtime.toISOString(),
            modifiedAt: fileStat.mtime.toISOString(),
          })
        } catch (err) {
          console.error(`Errore stat file ${fullPath}:`, err)
        }
      }
    }
  } catch (err) {
    console.error(`Errore lettura cartella ${dirPath}:`, err)
  }
  
  return documenti
}

// GET - Lista documenti dal filesystem
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase()
    const categoria = searchParams.get('categoria')?.toLowerCase()
    const sottoCartella = searchParams.get('sottoCartella')
    
    let tuttiDocumenti: DocumentoFS[] = []
    
    // Se categoria specificata, scansiona solo quella cartella
    if (categoria && CATEGORIE.includes(categoria)) {
      const catPath = path.join(ARCHIVIO_BASE, categoria)
      tuttiDocumenti = await scanDirectory(catPath, categoria)
    } else {
      // Scansiona tutte le categorie
      for (const cat of CATEGORIE) {
        const catPath = path.join(ARCHIVIO_BASE, cat)
        if (existsSync(catPath)) {
          const docs = await scanDirectory(catPath, cat)
          tuttiDocumenti.push(...docs)
        }
      }
    }
    
    // Filtro per sottocartella (cliente)
    if (sottoCartella) {
      tuttiDocumenti = tuttiDocumenti.filter(d => 
        d.sottoCartella?.toLowerCase() === sottoCartella.toLowerCase()
      )
    }
    
    // Filtro per ricerca
    if (search) {
      tuttiDocumenti = tuttiDocumenti.filter(d => 
        d.nome.toLowerCase().includes(search) ||
        d.nomeVisualizzato.toLowerCase().includes(search) ||
        d.sottoCartella?.toLowerCase().includes(search)
      )
    }
    
    // Ordina per data modifica (più recenti prima)
    tuttiDocumenti.sort((a, b) => 
      new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    )
    
    // Statistiche per categoria
    const statistiche: Record<string, number> = {}
    for (const cat of CATEGORIE) {
      const catPath = path.join(ARCHIVIO_BASE, cat)
      if (existsSync(catPath)) {
        const docs = await scanDirectory(catPath, cat)
        statistiche[cat.toUpperCase()] = docs.length
      } else {
        statistiche[cat.toUpperCase()] = 0
      }
    }
    
    // Lista sottocartelle (clienti) per la categoria selezionata
    let sottoCartelle: string[] = []
    if (categoria) {
      const catPath = path.join(ARCHIVIO_BASE, categoria)
      if (existsSync(catPath)) {
        try {
          const entries = await readdir(catPath, { withFileTypes: true })
          sottoCartelle = entries
            .filter(e => e.isDirectory())
            .map(e => e.name)
            .sort()
        } catch (err) {
          console.error('Errore lettura sottocartelle:', err)
        }
      }
    }
    
    return NextResponse.json({
      documenti: tuttiDocumenti,
      totale: tuttiDocumenti.length,
      statistiche,
      sottoCartelle,
      categorie: CATEGORIE.map(c => c.toUpperCase()),
    })
  } catch (error) {
    console.error('Errore GET documenti:', error)
    return NextResponse.json({ error: 'Errore nel recupero documenti' }, { status: 500 })
  }
}

// POST - Upload documento
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const categoria = (formData.get('categoria') as string || 'altro').toLowerCase()
    const sottoCartella = formData.get('sottoCartella') as string || null
    
    if (!file) {
      return NextResponse.json({ error: 'Nessun file caricato' }, { status: 400 })
    }
    
    // Verifica categoria valida
    if (!CATEGORIE.includes(categoria)) {
      return NextResponse.json({ error: 'Categoria non valida' }, { status: 400 })
    }
    
    // Costruisci percorso destinazione
    let destDir = path.join(ARCHIVIO_BASE, categoria)
    if (sottoCartella) {
      destDir = path.join(destDir, sottoCartella)
    }
    
    // Crea cartella se non esiste
    if (!existsSync(destDir)) {
      await mkdir(destDir, { recursive: true })
    }
    
    // Nome file (evita sovrascritture)
    let fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    let filePath = path.join(destDir, fileName)
    let counter = 1
    
    while (existsSync(filePath)) {
      const ext = path.extname(fileName)
      const base = path.basename(fileName, ext)
      fileName = `${base}_${counter}${ext}`
      filePath = path.join(destDir, fileName)
      counter++
    }
    
    // Salva file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    
    // Leggi stat del file appena creato
    const fileStat = await stat(filePath)
    const ext = path.extname(fileName).replace('.', '').toLowerCase()
    const relativePath = filePath.replace(path.join(process.cwd(), 'public'), '')
    
    const documento: DocumentoFS = {
      id: generateId(relativePath),
      nome: fileName,
      nomeVisualizzato: fileName.replace(/\.[^/.]+$/, ''),
      path: relativePath.replace(/\\/g, '/'),
      fullPath: filePath,
      categoria: categoria.toUpperCase(),
      sottoCartella,
      dimensione: fileStat.size,
      estensione: ext,
      mimeType: getMimeType(ext),
      createdAt: fileStat.birthtime.toISOString(),
      modifiedAt: fileStat.mtime.toISOString(),
    }
    
    return NextResponse.json(documento, { status: 201 })
  } catch (error) {
    console.error('Errore upload documento:', error)
    return NextResponse.json({ error: 'Errore nell\'upload del documento' }, { status: 500 })
  }
}