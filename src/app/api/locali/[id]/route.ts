// src/app/api/locali/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Singolo locale
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const locale = await prisma.locale.findUnique({
      where: { id },
      include: {
        committenteDefault: true,
        agibilita: {
          include: {
            artisti: {
              include: {
                artista: true
              }
            },
            committente: true,
          },
          orderBy: { data: 'desc' },
          take: 10,
        },
      },
    })
    
    if (!locale) {
      return NextResponse.json(
        { error: 'Locale non trovato' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(locale)
  } catch (error) {
    console.error('Errore GET locale:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero del locale' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna locale
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const locale = await prisma.locale.update({
      where: { id },
      data: {
        nome: body.nome,
        tipoLocale: body.tipoLocale || 'ALTRO',
        indirizzo: body.indirizzo || null,
        cap: body.cap || null,
        citta: body.citta || null,
        provincia: body.provincia || null,
        codiceBelfiore: body.codiceBelfiore || null,
        referenteNome: body.referenteNome || null,
        referenteTelefono: body.referenteTelefono || null,
        referenteEmail: body.referenteEmail || null,
        committenteDefaultId: body.committenteDefaultId || null,
        note: body.note || null,
        noteInterne: body.noteInterne || null,
      },
      include: {
        committenteDefault: true,
      }
    })
    
    return NextResponse.json(locale)
  } catch (error) {
    console.error('Errore PUT locale:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del locale' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina locale
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verifica agibilità collegate
    const agibilitaCount = await prisma.agibilita.count({
      where: { localeId: id }
    })
    
    if (agibilitaCount > 0) {
      return NextResponse.json(
        { error: `Impossibile eliminare: ${agibilitaCount} agibilità collegate` },
        { status: 400 }
      )
    }
    
    await prisma.locale.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore DELETE locale:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del locale' },
      { status: 500 }
    )
  }
}
