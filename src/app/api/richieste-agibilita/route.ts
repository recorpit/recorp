// src/app/api/richieste-agibilita/route.ts
// API Richieste Agibilità - Lista e Creazione

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Genera codice univoco per richiesta
function generateCodice(): string {
  const anno = new Date().getFullYear().toString().slice(-2)
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `RIC-${anno}-${random}`
}

// GET - Lista richieste
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const stato = searchParams.get('stato')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const where: any = {}
    if (stato && stato !== 'tutti') {
      where.stato = stato
    }
    
    const richieste = await prisma.richiestaAgibilita.findMany({
      where,
      include: {
        Agibilita: {
          select: {
            id: true,
            codice: true,
            data: true,
            stato: true,
          }
        },
        User: {
          select: {
            id: true,
            nome: true,
            cognome: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    
    // Conta per stato
    const counts = await prisma.richiestaAgibilita.groupBy({
      by: ['stato'],
      _count: true,
    })
    
    const countByStato = counts.reduce((acc, c) => {
      acc[c.stato] = c._count
      return acc
    }, {} as Record<string, number>)
    
    return NextResponse.json({
      richieste,
      counts: countByStato,
      totale: richieste.length,
    })
    
  } catch (error) {
    console.error('Errore GET richieste:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero delle richieste' },
      { status: 500 }
    )
  }
}

// POST - Nuova richiesta
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Validazione base
    if (!body.dataEvento) {
      return NextResponse.json(
        { error: 'Data evento obbligatoria' },
        { status: 400 }
      )
    }
    
    if (!body.locale?.nome) {
      return NextResponse.json(
        { error: 'Locale obbligatorio' },
        { status: 400 }
      )
    }
    
    if (!body.artisti || body.artisti.length === 0) {
      return NextResponse.json(
        { error: 'Almeno un artista obbligatorio' },
        { status: 400 }
      )
    }
    
    // Genera codice univoco
    let codice = generateCodice()
    let exists = await prisma.richiestaAgibilita.findUnique({ where: { codice } })
    while (exists) {
      codice = generateCodice()
      exists = await prisma.richiestaAgibilita.findUnique({ where: { codice } })
    }
    
    // Prepara dati richiesta
    const datiRichiesta = {
      dataEvento: body.dataEvento,
      dataFine: body.dataFine || null,
      locale: {
        id: body.locale.id || null, // null se nuovo locale
        nome: body.locale.nome,
        citta: body.locale.citta || null,
        indirizzo: body.locale.indirizzo || null,
        isNuovo: !body.locale.id,
      },
      artisti: body.artisti.map((a: any) => ({
        id: a.id || null, // null se artista non in anagrafica
        nomeDarte: a.nomeDarte || null,
        nome: a.nome || null,
        cognome: a.cognome || null,
        compensoNetto: a.compensoNetto || 0,
        qualifica: a.qualifica || 'Artista',
        isNuovo: !a.id,
      })),
      committente: body.committente || null,
    }
    
    const richiesta = await prisma.richiestaAgibilita.create({
      data: {
        codice,
        richiedente: session.user?.name || session.user?.email || 'Utente',
        emailRichiedente: session.user?.email || null,
        datiRichiesta,
        note: body.note || null,
        noteInterne: body.noteInterne || null,
        stato: 'NUOVA',
      },
    })
    
    return NextResponse.json(richiesta, { status: 201 })
    
  } catch (error) {
    console.error('Errore POST richiesta:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione della richiesta' },
      { status: 500 }
    )
  }
}
