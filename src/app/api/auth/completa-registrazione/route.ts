// src/app/api/auth/completa-registrazione/route.ts
// API Completa Registrazione - Imposta password e attiva account

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body
    
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token e password sono obbligatori' },
        { status: 400 }
      )
    }
    
    // Validazione password
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 8 caratteri' },
        { status: 400 }
      )
    }
    
    // Cerca utente con questo token
    const user = await prisma.user.findFirst({
      where: { 
        tokenVerifica: token,
        stato: 'PENDING',
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Token non valido o già utilizzato' },
        { status: 400 }
      )
    }
    
    // Verifica scadenza
    if (user.tokenVerificaExp && new Date() > user.tokenVerificaExp) {
      return NextResponse.json(
        { error: 'Token scaduto. Richiedi un nuovo invito.' },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Aggiorna utente: imposta password, attiva account, rimuovi token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        stato: 'ATTIVO',
        emailVerificata: true,
        emailVerificataAt: new Date(),
        tokenVerifica: null,
        tokenVerificaExp: null,
        attivo: true,
      }
    })
    
    console.log(`✅ Registrazione completata per: ${user.email}`)
    
    return NextResponse.json({ 
      success: true,
      message: 'Registrazione completata con successo' 
    })
    
  } catch (error) {
    console.error('Errore completamento registrazione:', error)
    return NextResponse.json(
      { error: 'Errore durante il completamento della registrazione' },
      { status: 500 }
    )
  }
}
