// src/app/api/auth/register/route.ts
// API Registrazione Utente

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { email, password, nome, cognome, ruolo } = body
    
    // Validazione
    if (!email || !password || !nome || !cognome) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      )
    }
    
    // Verifica email valida
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email non valida' },
        { status: 400 }
      )
    }
    
    // Verifica password minima
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 8 caratteri' },
        { status: 400 }
      )
    }
    
    // Verifica se email già esistente
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Esiste già un utente con questa email' },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Crea utente
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        nome,
        cognome,
        ruolo: ruolo || 'OPERATORE',
        attivo: true,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        ruolo: true,
        createdAt: true,
      },
    })
    
    return NextResponse.json(user, { status: 201 })
    
  } catch (error) {
    console.error('Errore registrazione:', error)
    return NextResponse.json(
      { error: 'Errore durante la registrazione' },
      { status: 500 }
    )
  }
}
