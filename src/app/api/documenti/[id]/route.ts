// src/app/api/documenti/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { deleteFile } from '@/lib/supabase/storage'

// GET - Dettagli documento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const documento = await prisma.documento.findUnique({
      where: { id },
      include: {
        artista: { select: { id: true, nome: true, cognome: true } },
        committente: { select: { id: true, ragioneSociale: true } },
        locale: { select: { id: true, nome: true } },
        agibilita: { select: { id: true, codice: true } },
      }
    })

    if (!documento) {
      return NextResponse.json({ error: 'Documento non trovato' }, { status: 404 })
    }

    // Estrai sottocartella dal path
    const pathParts = documento.path.split('/')
    const sottoCartella = pathParts.length > 2 ? pathParts[1] : null

    return NextResponse.json({
      ...documento,
      sottoCartella,
      modifiedAt: documento.updatedAt.toISOString(),
      createdAt: documento.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Errore GET documento:', error)
    return NextResponse.json({ error: 'Errore nel recupero documento' }, { status: 500 })
  }
}

// DELETE - Elimina documento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Trova documento
    const documento = await prisma.documento.findUnique({
      where: { id }
    })

    if (!documento) {
      return NextResponse.json({ error: 'Documento non trovato' }, { status: 404 })
    }

    // Elimina da Supabase Storage
    const deleted = await deleteFile(documento.path)
    
    if (!deleted) {
      console.warn(`File non eliminato da storage: ${documento.path}`)
      // Continua comunque a eliminare dal DB
    }

    // Elimina dal database
    await prisma.documento.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore DELETE documento:', error)
    return NextResponse.json({ error: 'Errore nell\'eliminazione documento' }, { status: 500 })
  }
}

// PATCH - Aggiorna metadata documento
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const documento = await prisma.documento.update({
      where: { id },
      data: {
        nomeVisualizzato: body.nomeVisualizzato,
        descrizione: body.descrizione,
        tags: body.tags,
      }
    })

    return NextResponse.json(documento)
  } catch (error) {
    console.error('Errore PATCH documento:', error)
    return NextResponse.json({ error: 'Errore nell\'aggiornamento documento' }, { status: 500 })
  }
}
