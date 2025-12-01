// src/app/api/agibilita/bozze/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CONFIG } from '@/lib/constants'

// GET - Lista bozze
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const stato = searchParams.get('stato')
    
    const where: any = {}
    
    if (userId) {
      where.creatoDaId = userId
    }
    
    if (stato) {
      where.stato = stato
    }
    
    const bozze = await prisma.bozzaAgibilita.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        creatoDa: {
          select: {
            id: true,
            nome: true,
            cognome: true,
          }
        },
        lockedByUser: {
          select: {
            id: true,
            nome: true,
            cognome: true,
          }
        }
      }
    })
    
    // Aggiungi info lock scaduto
    const now = new Date()
    const bozzeConInfo = bozze.map(bozza => ({
      ...bozza,
      lockScaduto: bozza.lockScadeAt ? now > bozza.lockScadeAt : true,
      isLocked: bozza.lockedById && bozza.lockScadeAt && now < bozza.lockScadeAt,
    }))
    
    return NextResponse.json(bozzeConInfo)
  } catch (error) {
    console.error('Errore GET bozze:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero delle bozze' },
      { status: 500 }
    )
  }
}

// POST - Crea nuova bozza
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Calcola scadenza lock
    const lockScadeAt = new Date()
    lockScadeAt.setMinutes(lockScadeAt.getMinutes() + CONFIG.LOCK_SCADENZA_MINUTI)
    
    const bozza = await prisma.bozzaAgibilita.create({
      data: {
        codicePrenotato: body.codicePrenotato || null,
        prenotazioneId: body.prenotazioneId || null,
        datiArtisti: body.datiArtisti || null,
        datiLocale: body.datiLocale || null,
        datiCommittente: body.datiCommittente || null,
        datiPrestazione: body.datiPrestazione || null,
        datiEconomici: body.datiEconomici || null,
        stato: 'IN_LAVORAZIONE',
        percentualeCompletamento: body.percentualeCompletamento || 0,
        lockedById: body.userId || null,
        lockedByName: body.userName || null,
        lockedAt: new Date(),
        lockScadeAt,
        creatoDaId: body.userId || null,
      },
      include: {
        creatoDa: {
          select: { id: true, nome: true, cognome: true }
        }
      }
    })
    
    return NextResponse.json(bozza, { status: 201 })
  } catch (error) {
    console.error('Errore POST bozza:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione della bozza' },
      { status: 500 }
    )
  }
}
