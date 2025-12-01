// src/app/api/artisti/[id]/documenti/[docId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// DELETE - Elimina documento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params
    
    // Trova documento
    const documento = await prisma.documentoArtista.findFirst({
      where: {
        id: docId,
        artistaId: id,
      },
    })
    
    if (!documento) {
      return NextResponse.json(
        { error: 'Documento non trovato' },
        { status: 404 }
      )
    }
    
    // Elimina file fisico
    const filePath = path.join(process.cwd(), 'public', documento.path)
    if (existsSync(filePath)) {
      await unlink(filePath)
    }
    
    // Elimina record dal database
    await prisma.documentoArtista.delete({
      where: { id: docId },
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

// GET - Scarica documento (redirect al file)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params
    
    const documento = await prisma.documentoArtista.findFirst({
      where: {
        id: docId,
        artistaId: id,
      },
    })
    
    if (!documento) {
      return NextResponse.json(
        { error: 'Documento non trovato' },
        { status: 404 }
      )
    }
    
    // Redirect al file
    return NextResponse.redirect(new URL(documento.path, request.url))
  } catch (error) {
    console.error('Errore GET documento:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero del documento' },
      { status: 500 }
    )
  }
}
