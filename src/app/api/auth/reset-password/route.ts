// src/app/api/auth/reset-password/route.ts
// API Richiesta Reset Password

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { sendEmail, getResetPasswordEmailTemplate } from '@/lib/mail'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email obbligatoria' },
        { status: 400 }
      )
    }
    
    // Cerca utente
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, nome: true, cognome: true, attivo: true }
    })
    
    // Non rivelare se l'utente esiste o meno (sicurezza)
    if (!user || !user.attivo) {
      // Restituisci successo comunque per non rivelare info
      return NextResponse.json({ 
        success: true,
        message: 'Se l\'email è registrata, riceverai le istruzioni per il reset'
      })
    }
    
    // Genera token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 ora
    
    // Elimina eventuali token precedenti per questo utente
    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email }
    })
    
    // Salva token nel database
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expires,
      }
    })
    
    // Genera URL reset
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password/conferma?token=${token}`
    
    // Invia email
    const { subject, html } = getResetPasswordEmailTemplate(
      resetUrl, 
      `${user.nome} ${user.cognome}`
    )
    
    await sendEmail({
      to: user.email,
      subject,
      html,
    })
    
    console.log(`Reset password email inviata a: ${user.email}`)
    
    return NextResponse.json({ 
      success: true,
      message: 'Email di reset inviata con successo'
    })
    
  } catch (error) {
    console.error('Errore reset password:', error)
    return NextResponse.json(
      { error: 'Errore durante la richiesta di reset' },
      { status: 500 }
    )
  }
}
