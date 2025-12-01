// src/app/api/auth/invito/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateToken } from '@/lib/auth'

// GET - Verifica e recupera dati invito
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token mancante' },
        { status: 400 }
      )
    }
    
    const invito = await prisma.invitoRegistrazione.findUnique({
      where: { token }
    })
    
    if (!invito) {
      return NextResponse.json(
        { error: 'Invito non trovato' },
        { status: 404 }
      )
    }
    
    if (invito.usato) {
      return NextResponse.json(
        { error: 'Invito già utilizzato' },
        { status: 400 }
      )
    }
    
    if (new Date() > invito.scadeAt) {
      return NextResponse.json(
        { error: 'Invito scaduto' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      tipo: invito.tipo,
      email: invito.email,
      nome: invito.nome,
      cognome: invito.cognome,
      telefono: invito.telefono,
      codiceFiscale: invito.codiceFiscale,
      partitaIva: invito.partitaIva,
      ragioneSociale: invito.ragioneSociale,
    })
    
  } catch (error) {
    console.error('Errore GET invito:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dell\'invito' },
      { status: 500 }
    )
  }
}

// POST - Crea nuovo invito (solo admin/operatore)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // TODO: Verificare autenticazione admin/operatore
    
    if (!body.email || !body.tipo) {
      return NextResponse.json(
        { error: 'Email e tipo richiesti' },
        { status: 400 }
      )
    }
    
    // Verifica email non già registrata
    const userEsistente = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() }
    })
    
    if (userEsistente) {
      return NextResponse.json(
        { error: 'Email già registrata nel sistema' },
        { status: 400 }
      )
    }
    
    // Genera token e scadenza (7 giorni)
    const token = generateToken(16) // Token più corto
    const scadeAt = new Date()
    scadeAt.setDate(scadeAt.getDate() + 7)
    
    // Crea invito
    const invito = await prisma.invitoRegistrazione.create({
      data: {
        token,
        email: body.email.toLowerCase(),
        tipo: body.tipo,
        nome: body.nome || null,
        cognome: body.cognome || null,
        telefono: body.telefono || null,
        codiceFiscale: body.codiceFiscale?.toUpperCase() || null,
        partitaIva: body.partitaIva || null,
        ragioneSociale: body.ragioneSociale || null,
        artistaId: body.artistaId || null,
        committenteId: body.committenteId || null,
        formatId: body.formatId || null,
        scadeAt,
        creatoDa: body.creatoDa || null, // ID admin che crea
      }
    })
    
    // Genera URL registrazione
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const tipoPath = body.tipo === 'ARTISTA' ? 'artista' : 'locale'
    const registrationUrl = `${baseUrl}/registrazione/${tipoPath}?token=${token}`
    
    // TODO: Invia email con link
    // await sendInviteEmail(body.email, registrationUrl, body.tipo)
    
    return NextResponse.json({
      success: true,
      invito: {
        id: invito.id,
        token: invito.token,
        email: invito.email,
        tipo: invito.tipo,
        scadeAt: invito.scadeAt,
        registrationUrl,
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Errore POST invito:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione dell\'invito' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina/invalida invito
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID invito mancante' },
        { status: 400 }
      )
    }
    
    await prisma.invitoRegistrazione.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Errore DELETE invito:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione dell\'invito' },
      { status: 500 }
    )
  }
}
