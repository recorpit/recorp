// src/app/api/auth/profilo/route.ts
// API Aggiornamento Profilo Utente

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { nome, cognome } = body
    
    // Validazione
    if (!nome || !cognome) {
      return NextResponse.json(
        { error: 'Nome e cognome sono obbligatori' },
        { status: 400 }
      )
    }
    
    // Aggiorna utente
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        nome,
        cognome,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        ruolo: true,
      }
    })
    
    return NextResponse.json(user)
    
  } catch (error) {
    console.error('Errore aggiornamento profilo:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'aggiornamento del profilo' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        ruolo: true,
        createdAt: true,
        lastLoginAt: true,
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(user)
    
  } catch (error) {
    console.error('Errore caricamento profilo:', error)
    return NextResponse.json(
      { error: 'Errore durante il caricamento del profilo' },
      { status: 500 }
    )
  }
}
