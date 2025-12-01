// src/app/api/pagamenti/prestazioni/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Dettaglio prestazione
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const prestazione = await prisma.prestazioneOccasionale.findUnique({
      where: { id },
      include: {
        artista: true,
        batch: true,
      }
    })
    
    if (!prestazione) {
      return NextResponse.json(
        { error: 'Prestazione non trovata' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(prestazione)
    
  } catch (error) {
    console.error('Errore GET prestazione:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero prestazione' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna stato prestazione
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const prestazione = await prisma.prestazioneOccasionale.findUnique({
      where: { id }
    })
    
    if (!prestazione) {
      return NextResponse.json(
        { error: 'Prestazione non trovata' },
        { status: 404 }
      )
    }
    
    const updateData: any = {}
    
    // Cambio stato manuale
    if (body.stato) {
      updateData.stato = body.stato
      
      if (body.stato === 'PAGATA') {
        updateData.dataPagamento = new Date()
      }
    }
    
    // Inserisci in distinta
    if (body.distinaId) {
      updateData.distinaId = body.distinaId
      updateData.distinaGenerataAt = new Date()
      updateData.stato = 'IN_DISTINTA'
    }
    
    // Note
    if (body.note !== undefined) {
      updateData.note = body.note
    }
    
    const updated = await prisma.prestazioneOccasionale.update({
      where: { id },
      data: updateData,
      include: {
        artista: true,
      }
    })
    
    return NextResponse.json(updated)
    
  } catch (error) {
    console.error('Errore PUT prestazione:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento' },
      { status: 500 }
    )
  }
}
