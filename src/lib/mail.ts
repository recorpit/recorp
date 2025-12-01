// src/lib/mail.ts
// Utility per invio email con nodemailer

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const from = `"${process.env.SMTP_FROM_NAME || 'RECORP'}" <${process.env.SMTP_FROM_EMAIL}>`
  
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    })
    
    console.log('Email inviata:', info.messageId)
    return { success: true, messageId: info.messageId }
    
  } catch (error) {
    console.error('Errore invio email:', error)
    throw error
  }
}

// Template email reset password
export function getResetPasswordEmailTemplate(resetUrl: string, userName: string) {
  return {
    subject: 'Reset Password - RECORP',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #2563eb; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🎭 RECORP</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">Reset Password</h2>
              
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Ciao <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hai richiesto di reimpostare la tua password. Clicca sul pulsante qui sotto per procedere:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                      Reimposta Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Se non riesci a cliccare il pulsante, copia e incolla questo link nel tuo browser:
              </p>
              
              <p style="margin: 0 0 20px; padding: 12px; background-color: #f3f4f6; border-radius: 6px; word-break: break-all; font-size: 12px; color: #4b5563;">
                ${resetUrl}
              </p>
              
              <p style="margin: 20px 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                ⚠️ Questo link scadrà tra <strong>1 ora</strong>.
              </p>
              
              <p style="margin: 20px 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                Se non hai richiesto tu il reset della password, ignora questa email. Il tuo account è al sicuro.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} RECORP - OKL SRL
              </p>
              <p style="margin: 5px 0 0; color: #9ca3af; font-size: 12px;">
                Questa è un'email automatica, non rispondere.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }
}
