// src/app/api/impostazioni/test-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json()
    
    if (!to) {
      return NextResponse.json({ error: 'Email destinatario mancante' }, { status: 400 })
    }
    
    // Carica impostazioni SMTP dal DB o usa env
    let smtpConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      fromName: process.env.SMTP_FROM_NAME || 'RECORP',
      fromEmail: process.env.SMTP_FROM_EMAIL,
    }
    
    // Prova a caricare da DB
    const settings = await prisma.impostazioni.findFirst({
      where: { chiave: 'azienda' }
    })
    
    if (settings) {
      const data = JSON.parse(settings.valore)
      if (data.smtpHost) {
        smtpConfig = {
          host: data.smtpHost,
          port: parseInt(data.smtpPort || '465'),
          secure: parseInt(data.smtpPort || '465') === 465,
          user: data.smtpUser,
          pass: data.smtpPass,
          fromName: data.smtpFromName || 'RECORP',
          fromEmail: data.smtpFromEmail,
        }
      }
    }
    
    if (!smtpConfig.host || !smtpConfig.user) {
      return NextResponse.json({ 
        error: 'Configurazione SMTP mancante. Configura host e username.' 
      }, { status: 400 })
    }
    
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    })
    
    await transporter.sendMail({
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to,
      subject: '✅ Test Email RECORP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Test Email RECORP</h2>
          <p>Se stai leggendo questa email, la configurazione SMTP è corretta!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Inviata da: ${smtpConfig.fromEmail}<br>
            Server: ${smtpConfig.host}:${smtpConfig.port}<br>
            Data: ${new Date().toLocaleString('it-IT')}
          </p>
        </div>
      `,
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Errore test email:', error)
    return NextResponse.json({ 
      error: error.message || 'Errore invio email' 
    }, { status: 500 })
  }
}
