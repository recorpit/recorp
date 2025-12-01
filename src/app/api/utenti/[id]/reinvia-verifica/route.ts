// src/app/api/utenti/[id]/reinvia-verifica/route.ts
// API Reinvia Email Verifica

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { sendEmail } from '@/lib/mail'

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
    
    if (user.emailVerificata) {
      return NextResponse.json({ error: 'Email già verificata' }, { status: 400 })
    }
    
    // Genera nuovo token
    const tokenVerifica = crypto.randomBytes(32).toString('hex')
    const tokenVerificaExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 giorni
    
    await prisma.user.update({
      where: { id: params.id },
      data: {
        tokenVerifica,
        tokenVerificaExp,
      }
    })
    
    // Invia email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const verifyUrl = `${baseUrl}/registrazione/completa?token=${tokenVerifica}`
    
    await sendEmail({
      to: user.email,
      subject: 'RECORP - Verifica il tuo indirizzo email',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background-color: #2563eb; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🎭 RECORP</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1f2937;">Verifica la tua email</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Ciao <strong>${user.nome}</strong>,
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Clicca il pulsante qui sotto per verificare il tuo indirizzo email e completare la registrazione:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 30px 0;">
                    <a href="${verifyUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                      Verifica Email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #9ca3af; font-size: 14px;">
                ⚠️ Questo link scadrà tra <strong>7 giorni</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} RECORP - OKL SRL</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    })
    
    console.log(`Email verifica reinviata a: ${user.email}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email di verifica inviata' 
    })
    
  } catch (error) {
    console.error('Errore reinvio verifica:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
