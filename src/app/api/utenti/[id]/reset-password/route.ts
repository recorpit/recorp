// src/app/api/utenti/[id]/reset-password/route.ts
// API Reset Password (Admin)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { sendEmail, getResetPasswordEmailTemplate } from '@/lib/mail'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'OPERATORE'].includes(session.user.ruolo)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: params.id }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }
    
    // Genera token reset
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 ora
    
    // Elimina eventuali token precedenti
    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email }
    })
    
    // Crea nuovo token
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expires,
      }
    })
    
    // Invia email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password/conferma?token=${token}`
    
    const { subject, html } = getResetPasswordEmailTemplate(
      resetUrl, 
      `${user.nome} ${user.cognome}`
    )
    
    await sendEmail({
      to: user.email,
      subject,
      html,
    })
    
    console.log(`Reset password inviato a: ${user.email}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email di reset password inviata' 
    })
    
  } catch (error) {
    console.error('Errore reset password:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
