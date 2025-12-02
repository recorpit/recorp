// src/app/api/richieste-agibilita/[id]/route.ts
// API Richiesta Agibilità Singola - GET, PUT, DELETE

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET - Dettaglio richiesta
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const { id } = await params
    
    const richiesta = await prisma.richiestaAgibilita.findUnique({
      where: { id },
      include: {
        Agibilita: {
          include: {
            locale: true,
            artisti: {
              include: {
                artista: true
              }
            }
          }
        },
        User: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            email: true,
          }
        }
      },
    })
    
    if (!richiesta) {
      return NextResponse.json(
        { error: 'Richiesta non trovata' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(richiesta)
    
  } catch (error) {
    console.error('Errore GET richiesta:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero della richiesta' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna richiesta (stato, note, assegnazione)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const { id } = await params
    const body = await request.json()
    
    const esistente = await prisma.richiestaAgibilita.findUnique({
      where: { id }
    })
    
    if (!esistente) {
      return NextResponse.json(
        { error: 'Richiesta non trovata' },
        { status: 404 }
      )
    }
    
    const updateData: any = {
      updatedAt: new Date(),
    }
    
    // Aggiorna stato
    if (body.stato) {
      updateData.stato = body.stato
    }
    
    // Aggiorna note
    if (body.note !== undefined) {
      updateData.note = body.note
    }
    
    if (body.noteInterne !== undefined) {
      updateData.noteInterne = body.noteInterne
    }
    
    // Assegna a utente
    if (body.assegnatoA !== undefined) {
      updateData.assegnatoA = body.assegnatoA || null
    }
    
    // Collega agibilità creata
    if (body.agibilitaId !== undefined) {
      updateData.agibilitaId = body.agibilitaId
      if (body.agibilitaId) {
        updateData.stato = 'EVASA'
      }
    }
    
    // Aggiorna dati richiesta (se modificati)
    if (body.datiRichiesta) {
      updateData.datiRichiesta = body.datiRichiesta
    }
    
    const richiesta = await prisma.richiestaAgibilita.update({
      where: { id },
      data: updateData,
      include: {
        Agibilita: true,
        User: {
          select: {
            id: true,
            nome: true,
            cognome: true,
          }
        }
      },
    })
    
    return NextResponse.json(richiesta)
    
  } catch (error) {
    console.error('Errore PUT richiesta:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della richiesta' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina richiesta (solo se NUOVA o RIFIUTATA)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const { id } = await params
    
    const richiesta = await prisma.richiestaAgibilita.findUnique({
      where: { id }
    })
    
    if (!richiesta) {
      return NextResponse.json(
        { error: 'Richiesta non trovata' },
        { status: 404 }
      )
    }
    
    // Non permettere eliminazione se evasa
    if (richiesta.stato === 'EVASA') {
      return NextResponse.json(
        { error: 'Impossibile eliminare una richiesta già evasa' },
        { status: 400 }
      )
    }
    
    await prisma.richiestaAgibilita.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Errore DELETE richiesta:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione della richiesta' },
      { status: 500 }
    )
  }
}
