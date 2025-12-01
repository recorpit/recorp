// src/app/api/utenti/route.ts
// API Gestione Utenti

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/mail'

// GET - Lista utenti
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'OPERATORE'].includes(session.user.ruolo)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const users = await prisma.user.findMany({
      orderBy: [
        { ruolo: 'asc' },
        { cognome: 'asc' },
      ],
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        telefono: true,
        ruolo: true,
        stato: true,
        emailVerificata: true,
        attivo: true,
        createdAt: true,
        lastLoginAt: true,
        formatGestiti: {
          include: {
            format: {
              select: { id: true, nome: true }
            }
          }
        }
      }
    })
    
    return NextResponse.json(users)
    
  } catch (error) {
    console.error('Errore caricamento utenti:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// POST - Crea nuovo utente
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.ruolo !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const body = await request.json()
    const { 
      nome, 
      cognome, 
      email, 
      telefono, 
      ruolo, 
      formatIds,
      inviaEmail,      // true = invia invito, false = imposta password manuale
      password,        // password se inviaEmail = false
    } = body
    
    // Validazione
    if (!nome || !cognome || !email) {
      return NextResponse.json({ error: 'Nome, cognome e email sono obbligatori' }, { status: 400 })
    }
    
    // Se non invia email, serve password
    if (!inviaEmail && !password) {
      return NextResponse.json({ error: 'Password obbligatoria se non si invia invito' }, { status: 400 })
    }
    
    if (!inviaEmail && password.length < 8) {
      return NextResponse.json({ error: 'La password deve essere di almeno 8 caratteri' }, { status: 400 })
    }
    
    // Verifica email unica
    const esistente = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (esistente) {
      return NextResponse.json({ error: 'Email già registrata' }, { status: 400 })
    }
    
    let passwordHash: string
    let tokenVerifica: string | null = null
    let tokenVerificaExp: Date | null = null
    let stato: 'PENDING' | 'ATTIVO'
    let emailVerificata: boolean
    
    if (inviaEmail) {
      // Genera token invito e password temporanea
      tokenVerifica = crypto.randomBytes(32).toString('hex')
      tokenVerificaExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 giorni
      passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12)
      stato = 'PENDING'
      emailVerificata = false
    } else {
      // Password impostata manualmente
      passwordHash = await bcrypt.hash(password, 12)
      stato = 'ATTIVO'
      emailVerificata = true
    }
    
    // Crea utente
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: passwordHash,
        nome,
        cognome,
        telefono,
        ruolo: ruolo || 'OPERATORE',
        stato,
        emailVerificata,
        tokenVerifica,
        tokenVerificaExp,
        attivo: true,
      }
    })
    
    // Se format manager, assegna i format
    if (ruolo === 'FORMAT_MANAGER' && formatIds?.length > 0) {
      await prisma.userFormat.createMany({
        data: formatIds.map((formatId: string) => ({
          userId: user.id,
          formatId,
        }))
      })
    }
    
    // Invia email invito se richiesto
    if (inviaEmail) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const inviteUrl = `${baseUrl}/registrazione/completa?token=${tokenVerifica}`
        
        await sendEmail({
          to: email,
          subject: '🎭 Benvenuto in RECORP - Completa la registrazione',
          html: getInviteEmailTemplate(nome, cognome, ruolo, inviteUrl),
        })
        
        console.log(`✅ Email invito inviata a: ${email}`)
      } catch (emailError) {
        console.error('❌ Errore invio email:', emailError)
        // Non blocchiamo la creazione, ma segnaliamo
        return NextResponse.json({
          ...user,
          warning: 'Utente creato ma errore nell\'invio email. Usa "Reinvia invito" per riprovare.'
        }, { status: 201 })
      }
    }
    
    return NextResponse.json({
      ...user,
      message: inviaEmail 
        ? 'Utente creato e invito inviato!' 
        : 'Utente creato con password impostata'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Errore creazione utente:', error)
    return NextResponse.json({ error: 'Errore nella creazione' }, { status: 500 })
  }
}

// Template email invito - Design professionale
function getInviteEmailTemplate(nome: string, cognome: string, ruolo: string, inviteUrl: string) {
  const ruoloLabel: Record<string, string> = {
    ADMIN: 'Amministratore',
    OPERATORE: 'Operatore',
    FORMAT_MANAGER: 'Format Manager',
    PRODUZIONE: 'Produzione',
    ARTISTICO: 'Area Artistica',
  }
  
  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Benvenuto in RECORP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          
          <!-- Header con gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 48px 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎭</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                RECORP
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 500;">
                Gestione Agibilità e Spettacoli
              </p>
            </td>
          </tr>
          
          <!-- Contenuto principale -->
          <tr>
            <td style="padding: 48px 40px;">
              <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 24px; font-weight: 600;">
                Benvenuto nel team! 👋
              </h2>
              
              <p style="margin: 0 0 24px; color: #64748b; font-size: 16px; line-height: 1.6;">
                Ciao <strong style="color: #1e293b;">${nome} ${cognome}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #64748b; font-size: 16px; line-height: 1.6;">
                Sei stato invitato a far parte di <strong style="color: #1e293b;">RECORP</strong>, 
                la piattaforma di gestione agibilità INPS per artisti e spettacoli di OKL SRL.
              </p>
              
              <!-- Badge ruolo -->
              <div style="margin: 0 0 32px; padding: 16px 20px; background-color: #f1f5f9; border-radius: 12px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Il tuo ruolo
                </p>
                <p style="margin: 4px 0 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                  ${ruoloLabel[ruolo] || ruolo}
                </p>
              </div>
              
              <p style="margin: 0 0 32px; color: #64748b; font-size: 16px; line-height: 1.6;">
                Per completare la registrazione e impostare la tua password, clicca sul pulsante qui sotto:
              </p>
              
              <!-- Pulsante CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 16px 48px; border-radius: 12px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                      Completa Registrazione →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Link alternativo -->
              <p style="margin: 32px 0 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                Se il pulsante non funziona, copia e incolla questo link nel browser:
              </p>
              <p style="margin: 8px 0 0; padding: 12px 16px; background-color: #f8fafc; border-radius: 8px; word-break: break-all; font-size: 12px; color: #64748b; font-family: monospace;">
                ${inviteUrl}
              </p>
              
              <!-- Avviso scadenza -->
              <div style="margin: 32px 0 0; padding: 16px 20px; background-color: #fef3c7; border-radius: 12px; display: flex; align-items: flex-start;">
                <span style="margin-right: 12px; font-size: 20px;">⏰</span>
                <div>
                  <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                    Link valido per 7 giorni
                  </p>
                  <p style="margin: 4px 0 0; color: #a16207; font-size: 13px;">
                    Dopo la scadenza dovrai richiedere un nuovo invito.
                  </p>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 32px 40px; border-top: 1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0; color: #1e293b; font-size: 14px; font-weight: 600;">
                      OKL SRL
                    </p>
                    <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">
                      Via Monte Pasubio - 36010 Zanè (VI)
                    </p>
                  </td>
                  <td align="right">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      © ${new Date().getFullYear()} RECORP
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #94a3b8; font-size: 11px; text-align: center;">
                Questa è un'email automatica. Se non hai richiesto l'accesso a RECORP, 
                puoi ignorare questo messaggio.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
