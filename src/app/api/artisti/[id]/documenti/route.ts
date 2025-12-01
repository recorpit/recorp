// src/app/api/artisti/[id]/documenti/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// GET - Lista documenti artista
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const documenti = await prisma.documentoArtista.findMany({
      where: { artistaId: id },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(documenti)
  } catch (error) {
    console.error('Errore GET documenti:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei documenti' },
      { status: 500 }
    )
  }
}

// POST - Upload nuovo documento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: artistaId } = await params
    
    // Verifica che l'artista esista
    const artista = await prisma.artista.findUnique({
      where: { id: artistaId }
    })
    
    if (!artista) {
      return NextResponse.json(
        { error: 'Artista non trovato' },
        { status: 404 }
      )
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const tipo = formData.get('tipo') as string | null
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nessun file caricato' },
        { status: 400 }
      )
    }
    
    if (!tipo) {
      return NextResponse.json(
        { error: 'Tipo documento mancante' },
        { status: 400 }
      )
    }
    
    // Verifica dimensione (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File troppo grande (max 10MB)' },
        { status: 400 }
      )
    }
    
    // Verifica tipo file
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo file non supportato. Usa PDF, JPG o PNG.' },
        { status: 400 }
      )
    }
    
    // Genera nome cartella: cognome-nome-CF (tutto lowercase, senza spazi)
    const sanitize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '')
    const cognome = sanitize(artista.cognome || 'sconosciuto')
    const nome = sanitize(artista.nome || 'sconosciuto')
    const cf = (artista.codiceFiscale || artista.id).toUpperCase()
    const folderName = `${cognome}-${nome}-${cf}`
    
    // Crea cartella se non esiste
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documenti', folderName)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
    
    // Genera nome file univoco
    const timestamp = Date.now()
    const ext = path.extname(file.name) || '.pdf'
    const safeFileName = `${tipo.toLowerCase()}_${timestamp}${ext}`
    const filePath = path.join(uploadDir, safeFileName)
    const publicPath = `/uploads/documenti/${folderName}/${safeFileName}`
    
    // Salva file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    
    // Salva record nel database
    const documento = await prisma.documentoArtista.create({
      data: {
        artistaId,
        tipo: tipo as any,
        nome: file.name,
        path: publicPath,
        mimeType: file.type,
        dimensione: file.size,
      },
    })
    
    return NextResponse.json(documento, { status: 201 })
  } catch (error) {
    console.error('Errore POST documento:', error)
    return NextResponse.json(
      { error: 'Errore nel caricamento del documento' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina documento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const documentoId = searchParams.get('documentoId')
    
    if (!documentoId) {
      return NextResponse.json(
        { error: 'ID documento mancante' },
        { status: 400 }
      )
    }
    
    // Trova documento
    const documento = await prisma.documentoArtista.findUnique({
      where: { id: documentoId }
    })
    
    if (!documento) {
      return NextResponse.json(
        { error: 'Documento non trovato' },
        { status: 404 }
      )
    }
    
    // Elimina file fisico
    try {
      const filePath = path.join(process.cwd(), 'public', documento.path)
      if (existsSync(filePath)) {
        await unlink(filePath)
      }
    } catch (e) {
      console.error('Errore eliminazione file:', e)
      // Continua comunque con l'eliminazione dal DB
    }
    
    // Elimina record dal database
    await prisma.documentoArtista.delete({
      where: { id: documentoId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore DELETE documento:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del documento' },
      { status: 500 }
    )
  }
}
