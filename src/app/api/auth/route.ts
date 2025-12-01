// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, createSessionToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email e password richiesti' },
        { status: 400 }
      )
    }
    
    // Trova utente
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: {
        artista: {
          select: { id: true, nome: true, cognome: true, nomeDarte: true }
        },
        committente: {
          select: { id: true, ragioneSociale: true }
        }
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      )
    }
    
    // Verifica password
    const passwordValida = await verifyPassword(body.password, user.passwordHash)
    
    if (!passwordValida) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      )
    }
    
    // Verifica stato utente
    if (user.stato === 'PENDING') {
      return NextResponse.json(
        { error: 'Account non verificato. Controlla la tua email.' },
        { status: 403 }
      )
    }
    
    if (user.stato === 'SOSPESO') {
      return NextResponse.json(
        { error: 'Account sospeso. Contatta l\'assistenza.' },
        { status: 403 }
      )
    }
    
    if (user.stato === 'IN_APPROVAZIONE') {
      return NextResponse.json(
        { error: 'Account in attesa di approvazione.' },
        { status: 403 }
      )
    }
    
    if (user.stato === 'EMAIL_VERIFICATA' && user.ruolo === 'ARTISTA') {
      // Artista deve ancora firmare il contratto
      return NextResponse.json({
        success: true,
        requiresContract: true,
        userId: user.id,
        ruolo: user.ruolo,
        nome: user.nome,
        cognome: user.cognome,
      })
    }
    
    // Crea sessione
    const { token, expiresAt } = createSessionToken()
    
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        userAgent: request.headers.get('user-agent') || null,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
      }
    })
    
    // Aggiorna ultimo login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })
    
    // Imposta cookie sessione
    const cookieStore = await cookies()
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        cognome: user.cognome,
        ruolo: user.ruolo,
        stato: user.stato,
        artista: user.artista,
        committente: user.committente,
      },
      ruolo: user.ruolo,
    })
    
  } catch (error) {
    console.error('Errore login:', error)
    return NextResponse.json(
      { error: 'Errore nel login' },
      { status: 500 }
    )
  }
}

// Logout
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    
    if (sessionToken) {
      // Elimina sessione dal DB
      await prisma.userSession.deleteMany({
        where: { token: sessionToken }
      })
      
      // Rimuovi cookie
      cookieStore.delete('session')
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore logout:', error)
    return NextResponse.json(
      { error: 'Errore nel logout' },
      { status: 500 }
    )
  }
}
