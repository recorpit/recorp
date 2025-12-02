// src/app/api/auth/verifica-invito/route.ts
// API Verifica Token Invito

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token mancante' },
        { status: 400 }
      )
    }
    
    // Cerca utente con questo token
    const user = await prisma.user.findFirst({
      where: { 
        tokenVerifica: token,
        stato: 'PENDING',
      },
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        tokenVerificaExp: true,
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { valid: false, error: 'Token non valido o già utilizzato' },
        { status: 400 }
      )
    }
    
    // Verifica scadenza
    if (user.tokenVerificaExp && new Date() > user.tokenVerificaExp) {
      return NextResponse.json(
        { valid: false, error: 'Token scaduto. Richiedi un nuovo invito.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ 
      valid: true,
      email: user.email,
      nome: `${user.nome} ${user.cognome}`,
    })
    
  } catch (error) {
    console.error('Errore verifica invito:', error)
    return NextResponse.json(
      { valid: false, error: 'Errore verifica token' },
      { status: 500 }
    )
  }
}
