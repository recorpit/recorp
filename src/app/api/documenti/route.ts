// src/app/api/documenti/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  uploadFile, 
  listFiles, 
  buildStoragePath,
  getStorageClient,
  STORAGE_BUCKET
} from '@/lib/supabase/storage'

// Categorie disponibili
const CATEGORIE = [
  'archivio',
  'committenti',
  'documenti',
  'locali',
  'ricevute',
  'agibilita',
  'fatture',
  'contratti',
  'aziendale',
  'altro'
]

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

// GET - Lista documenti da Supabase Storage + DB
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase()
    const categoria = searchParams.get('categoria')?.toLowerCase()
    const sottoCartella = searchParams.get('sottoCartella')

    // Recupera documenti dal database
    const whereClause: any = {}
    
    if (categoria) {
      whereClause.categoria = categoria.toUpperCase()
    }
    
    if (search) {
      whereClause.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { nomeVisualizzato: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ]
    }

    const documenti = await prisma.documento.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nome: true,
        nomeVisualizzato: true,
        path: true,
        categoria: true,
        dimensione: true,
        estensione: true,
        mimeType: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        artistaId: true,
        committenteId: true,
        localeId: true,
        agibilitaId: true,
      }
    })

    // Estrai sottocartella dal path (es: "committenti/NomeCliente/file.pdf" -> "NomeCliente")
    const documentiConSottocartella = documenti.map(doc => {
      const pathParts = doc.path.split('/')
      const sottoCartella = pathParts.length > 2 ? pathParts[1] : null
      return {
        ...doc,
        sottoCartella,
        modifiedAt: doc.updatedAt.toISOString(),
        createdAt: doc.createdAt.toISOString(),
      }
    })

    // Filtro per sottocartella se specificato
    let risultati = documentiConSottocartella
    if (sottoCartella) {
      risultati = risultati.filter(d => 
        d.sottoCartella?.toLowerCase() === sottoCartella.toLowerCase()
      )
    }

    // Statistiche per categoria
    const stats = await prisma.documento.groupBy({
      by: ['categoria'],
      _count: { id: true }
    })
    
    const statistiche: Record<string, number> = {}
    CATEGORIE.forEach(cat => {
      const found = stats.find(s => s.categoria.toLowerCase() === cat)
      statistiche[cat.toUpperCase()] = found?._count.id || 0
    })

    // Lista sottocartelle uniche per la categoria
    let sottoCartelle: string[] = []
    if (categoria) {
      const docsInCategoria = await prisma.documento.findMany({
        where: { categoria: categoria.toUpperCase() },
        select: { path: true }
      })
      
      const folders = new Set<string>()
      docsInCategoria.forEach(doc => {
        const parts = doc.path.split('/')
        if (parts.length > 2) {
          folders.add(parts[1])
        }
      })
      sottoCartelle = Array.from(folders).sort()
    }

    return NextResponse.json({
      documenti: risultati,
      totale: risultati.length,
      statistiche,
      sottoCartelle,
      categorie: CATEGORIE.map(c => c.toUpperCase()),
    })
  } catch (error) {
    console.error('Errore GET documenti:', error)
    return NextResponse.json({ error: 'Errore nel recupero documenti' }, { status: 500 })
  }
}

// POST - Upload documento su Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const categoria = (formData.get('categoria') as string || 'altro').toLowerCase()
    const sottoCartella = formData.get('sottoCartella') as string || null
    const tags = formData.get('tags') as string || null
    
    // Entità collegate (opzionali)
    const artistaId = formData.get('artistaId') as string || null
    const committenteId = formData.get('committenteId') as string || null
    const localeId = formData.get('localeId') as string || null
    const agibilitaId = formData.get('agibilitaId') as string || null

    if (!file) {
      return NextResponse.json({ error: 'Nessun file caricato' }, { status: 400 })
    }

    // Verifica categoria valida
    if (!CATEGORIE.includes(categoria)) {
      return NextResponse.json({ error: 'Categoria non valida' }, { status: 400 })
    }

    // Prepara nome file sicuro
    const originalName = file.name
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const ext = safeName.split('.').pop()?.toLowerCase() || ''
    
    // Costruisci path per Storage
    const storagePath = buildStoragePath(categoria, safeName, sottoCartella)
    
    // Leggi file come buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Upload su Supabase Storage
    const uploadResult = await uploadFile(buffer, storagePath, getMimeType(ext))
    
    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.error || 'Errore upload' }, { status: 500 })
    }

    // Salva metadata nel database
    const documento = await prisma.documento.create({
      data: {
        nome: safeName,
        nomeVisualizzato: originalName.replace(/\.[^/.]+$/, ''),
        path: uploadResult.path!,
        categoria: categoria.toUpperCase() as any,
        dimensione: buffer.length,
        estensione: ext,
        mimeType: getMimeType(ext),
        tags,
        artistaId,
        committenteId,
        localeId,
        agibilitaId,
      }
    })

    return NextResponse.json({
      ...documento,
      sottoCartella,
      modifiedAt: documento.updatedAt.toISOString(),
      createdAt: documento.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Errore upload documento:', error)
    return NextResponse.json({ error: 'Errore nell\'upload del documento' }, { status: 500 })
  }
}
