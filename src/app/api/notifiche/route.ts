// src/app/api/notifiche/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Lista notifiche
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const nonLette = searchParams.get('nonLette') === 'true'
    const tipo = searchParams.get('tipo')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const where: any = {}
    
    if (userId) {
      where.destinatarioId = userId
    }
    
    if (nonLette) {
      where.letto = false
    }
    
    if (tipo) {
      where.tipo = tipo
    }
    
    const notifiche = await prisma.notifica.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        User: {
          select: {
            id: true,
            nome: true,
            cognome: true,
          }
        }
      }
    })
    
    // Conta non lette
    const nonLetteCount = await prisma.notifica.count({
      where: {
        ...where,
        letto: false,
      }
    })
    
    return NextResponse.json({
      notifiche,
      nonLetteCount,
    })
  } catch (error) {
    console.error('Errore GET notifiche:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero delle notifiche' },
      { status: 500 }
    )
  }
}

// POST - Crea notifica
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const notifica = await prisma.notifica.create({
      data: {
        tipo: body.tipo,
        titolo: body.titolo,
        messaggio: body.messaggio,
        agibilitaId: body.agibilitaId || null,
        artistaId: body.artistaId || null,
        committenteId: body.committenteId || null,
        link: body.link || null,
        destinatarioId: body.destinatarioId || null,
      }
    })
    
    return NextResponse.json(notifica, { status: 201 })
  } catch (error) {
    console.error('Errore POST notifica:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione della notifica' },
      { status: 500 }
    )
  }
}

// PUT - Segna come letta
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificaIds, leggiTutte, userId } = body
    
    if (leggiTutte && userId) {
      await prisma.notifica.updateMany({
        where: {
          destinatarioId: userId,
          letto: false,
        },
        data: {
          letto: true,
          lettoAt: new Date(),
        }
      })
      
      return NextResponse.json({ success: true, message: 'Tutte le notifiche segnate come lette' })
    }
    
    if (notificaIds && Array.isArray(notificaIds)) {
      await prisma.notifica.updateMany({
        where: {
          id: { in: notificaIds }
        },
        data: {
          letto: true,
          lettoAt: new Date(),
        }
      })
      
      return NextResponse.json({ success: true, aggiornate: notificaIds.length })
    }
    
    return NextResponse.json(
      { error: 'Specificare notificaIds o leggiTutte' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Errore PUT notifiche:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento delle notifiche' },
      { status: 500 }
    )
  }
}