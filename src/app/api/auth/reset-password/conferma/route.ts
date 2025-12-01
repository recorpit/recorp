// src/app/api/auth/reset-password/conferma/route.ts
// API Conferma Reset Password - Imposta nuova password

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

// GET - Verifica validità token
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
    
    // Cerca token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })
    
    if (!resetToken) {
      return NextResponse.json(
        { valid: false, error: 'Token non valido' },
        { status: 400 }
      )
    }
    
    // Verifica scadenza
    if (new Date() > resetToken.expires) {
      // Elimina token scaduto
      await prisma.passwordResetToken.delete({
        where: { token }
      })
      
      return NextResponse.json(
        { valid: false, error: 'Token scaduto' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ 
      valid: true,
      email: resetToken.email 
    })
    
  } catch (error) {
    console.error('Errore verifica token:', error)
    return NextResponse.json(
      { valid: false, error: 'Errore verifica token' },
      { status: 500 }
    )
  }
}

// POST - Imposta nuova password
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
    
    // Cerca token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })
    
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token non valido o già utilizzato' },
        { status: 400 }
      )
    }
    
    // Verifica scadenza
    if (new Date() > resetToken.expires) {
      await prisma.passwordResetToken.delete({
        where: { token }
      })
      
      return NextResponse.json(
        { error: 'Token scaduto. Richiedi un nuovo reset.' },
        { status: 400 }
      )
    }
    
    // Hash nuova password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Aggiorna password utente
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword }
    })
    
    // Elimina token usato
    await prisma.passwordResetToken.delete({
      where: { token }
    })
    
    // Elimina tutti i token per questo utente (per sicurezza)
    await prisma.passwordResetToken.deleteMany({
      where: { email: resetToken.email }
    })
    
    console.log(`Password reimpostata per: ${resetToken.email}`)
    
    return NextResponse.json({ 
      success: true,
      message: 'Password reimpostata con successo'
    })
    
  } catch (error) {
    console.error('Errore reset password:', error)
    return NextResponse.json(
      { error: 'Errore durante il reset della password' },
      { status: 500 }
    )
  }
}
