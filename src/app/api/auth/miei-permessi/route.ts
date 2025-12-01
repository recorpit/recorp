// src/app/api/auth/miei-permessi/route.ts
// API per ottenere i permessi dell'utente corrente

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPermessiUtente } from '@/lib/permessi'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const permessi = await getPermessiUtente(
      session.user.id, 
      session.user.ruolo
    )
    
    return NextResponse.json({
      permessi: Array.from(permessi),
      ruolo: session.user.ruolo,
    })
    
  } catch (error) {
    console.error('Errore caricamento permessi:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
