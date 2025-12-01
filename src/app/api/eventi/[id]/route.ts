import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const evento = await prisma.evento.findUnique({
      where: { id },
      include: {
        locale: true,
        artista: true,
        agibilita: true
      }
    })
    
    if (!evento) {
      return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 })
    }
    
    return NextResponse.json(evento)
  } catch (error) {
    console.error('Errore GET evento:', error)
    return NextResponse.json({ error: 'Errore nel recupero evento' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const evento = await prisma.evento.update({
      where: { id },
      data: {
        localeId: body.localeId,
        artistaId: body.artistaId || null,
        nome: body.nome || null,
        data: new Date(body.data),
        oraInizio: body.oraInizio || null,
        oraFine: body.oraFine || null,
        compensoLordo: body.compensoLordo ? parseFloat(body.compensoLordo) : null,
        compensoNetto: body.compensoNetto ? parseFloat(body.compensoNetto) : null,
        speseViaggio: body.speseViaggio ? parseFloat(body.speseViaggio) : null,
        speseAlloggio: body.speseAlloggio ? parseFloat(body.speseAlloggio) : null,
        stato: body.stato,
        note: body.note || null,
        noteInterne: body.noteInterne || null,
      },
      include: {
        locale: true,
        artista: true
      }
    })
    
    return NextResponse.json(evento)
  } catch (error) {
    console.error('Errore PUT evento:', error)
    return NextResponse.json({ error: 'Errore nell\'aggiornamento evento' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.evento.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore DELETE evento:', error)
    return NextResponse.json({ error: 'Errore nell\'eliminazione evento' }, { status: 500 })
  }
}