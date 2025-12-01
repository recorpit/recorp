// src/app/api/utenti/[id]/format/route.ts
// API Gestione Format Utente

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PUT - Aggiorna format assegnati
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
    const { formatIds } = body
    
    const user = await prisma.user.findUnique({
      where: { id: params.id }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }
    
    // Rimuovi tutti i format esistenti
    await prisma.userFormat.deleteMany({
      where: { userId: params.id }
    })
    
    // Aggiungi i nuovi format
    if (formatIds && formatIds.length > 0) {
      await prisma.userFormat.createMany({
        data: formatIds.map((formatId: string) => ({
          userId: params.id,
          formatId,
        }))
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Format aggiornati' 
    })
    
  } catch (error) {
    console.error('Errore aggiornamento format:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
