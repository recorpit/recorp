// src/app/api/utenti/[id]/sospendi/route.ts
// API Sospendi/Riattiva Utente

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.ruolo !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    // Non permettere di sospendere se stessi
    if (params.id === session.user.id) {
      return NextResponse.json({ error: 'Non puoi sospendere te stesso' }, { status: 400 })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: params.id }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }
    
    // Toggle stato
    const nuovoStato = user.stato === 'SOSPESO' ? 'ATTIVO' : 'SOSPESO'
    const attivo = nuovoStato !== 'SOSPESO'
    
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        stato: nuovoStato,
        attivo,
      }
    })
    
    console.log(`Utente ${user.email} ${nuovoStato === 'SOSPESO' ? 'sospeso' : 'riattivato'}`)
    
    return NextResponse.json({ 
      success: true, 
      stato: nuovoStato,
      message: nuovoStato === 'SOSPESO' ? 'Utente sospeso' : 'Utente riattivato'
    })
    
  } catch (error) {
    console.error('Errore sospensione utente:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
