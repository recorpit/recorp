import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stato = searchParams.get('stato')
    const localeId = searchParams.get('localeId')
    const artistaId = searchParams.get('artistaId')
    
    const eventi = await prisma.evento.findMany({
      where: {
        ...(stato && { stato: stato as any }),
        ...(localeId && { localeId }),
        ...(artistaId && { artistaId }),
      },
      include: {
        locale: true,
        artista: true,
        agibilita: true
      },
      orderBy: { data: 'desc' }
    })
    
    return NextResponse.json(eventi)
  } catch (error) {
    console.error('Errore GET eventi:', error)
    return NextResponse.json({ error: 'Errore nel recupero eventi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.localeId || !body.data) {
      return NextResponse.json({ error: 'Locale e data obbligatori' }, { status: 400 })
    }
    
    const evento = await prisma.evento.create({
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
        stato: body.stato || 'BOZZA',
        note: body.note || null,
        noteInterne: body.noteInterne || null,
      },
      include: {
        locale: true,
        artista: true
      }
    })
    
    return NextResponse.json(evento, { status: 201 })
  } catch (error) {
    console.error('Errore POST evento:', error)
    return NextResponse.json({ error: 'Errore nella creazione evento' }, { status: 500 })
  }
}