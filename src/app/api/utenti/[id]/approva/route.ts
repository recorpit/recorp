// src/app/api/utenti/[id]/approva/route.ts
// API Approva Utente (per locali/committenti in attesa)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
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
    
    if (user.stato !== 'IN_APPROVAZIONE') {
      return NextResponse.json({ error: 'Utente non in attesa di approvazione' }, { status: 400 })
    }
    
    // Approva
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        stato: 'ATTIVO',
        attivo: true,
      }
    })
    
    // Invia email di notifica
    await sendEmail({
      to: user.email,
      subject: 'RECORP - Account Approvato!',
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
            <td style="background-color: #16a34a; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🎉 Account Approvato!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Ciao <strong>${user.nome}</strong>,
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Ottime notizie! Il tuo account RECORP è stato approvato. Ora puoi accedere a tutte le funzionalità del sistema.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                      Accedi Ora
                    </a>
                  </td>
                </tr>
              </table>
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
    
    console.log(`Utente ${user.email} approvato`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Utente approvato' 
    })
    
  } catch (error) {
    console.error('Errore approvazione utente:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
