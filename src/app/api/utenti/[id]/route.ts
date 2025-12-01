// src/app/api/utenti/[id]/route.ts
// API Singolo Utente - GET, PUT, DELETE

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Dettaglio utente
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'OPERATORE'].includes(session.user.ruolo)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        telefono: true,
        ruolo: true,
        stato: true,
        emailVerificata: true,
        attivo: true,
        createdAt: true,
        lastLoginAt: true,
        formatGestiti: {
          include: {
            format: { select: { id: true, nome: true } }
          }
        }
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }
    
    return NextResponse.json(user)
    
  } catch (error) {
    console.error('Errore caricamento utente:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// PUT - Aggiorna utente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.ruolo !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const body = await request.json()
    const { nome, cognome, telefono, ruolo } = body
    
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        nome,
        cognome,
        telefono,
        ruolo,
      }
    })
    
    return NextResponse.json(user)
    
  } catch (error) {
    console.error('Errore aggiornamento utente:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// DELETE - Elimina utente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.ruolo !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    // Non permettere di eliminare se stessi
    if (params.id === session.user.id) {
      return NextResponse.json({ error: 'Non puoi eliminare te stesso' }, { status: 400 })
    }
    
    await prisma.user.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Errore eliminazione utente:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
