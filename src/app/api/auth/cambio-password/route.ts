// src/app/api/auth/cambio-password/route.ts
// API Cambio Password

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { passwordAttuale, nuovaPassword } = body
    
    // Validazione
    if (!passwordAttuale || !nuovaPassword) {
      return NextResponse.json(
        { error: 'Password attuale e nuova password sono obbligatorie' },
        { status: 400 }
      )
    }
    
    // Validazione nuova password
    if (nuovaPassword.length < 8) {
      return NextResponse.json(
        { error: 'La nuova password deve essere di almeno 8 caratteri' },
        { status: 400 }
      )
    }
    
    // Carica utente con password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }
    
    // Verifica password attuale
    const passwordMatch = await bcrypt.compare(passwordAttuale, user.password)
    
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'La password attuale non è corretta' },
        { status: 400 }
      )
    }
    
    // Hash nuova password
    const hashedPassword = await bcrypt.hash(nuovaPassword, 12)
    
    // Aggiorna password
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
      }
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Password cambiata con successo' 
    })
    
  } catch (error) {
    console.error('Errore cambio password:', error)
    return NextResponse.json(
      { error: 'Errore durante il cambio password' },
      { status: 500 }
    )
  }
}
