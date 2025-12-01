// src/app/api/agibilita/bozze/[id]/lock/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CONFIG } from '@/lib/constants'

// POST - Acquisisci lock
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, userName } = body
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId richiesto' },
        { status: 400 }
      )
    }
    
    const bozza = await prisma.bozzaAgibilita.findUnique({
      where: { id }
    })
    
    if (!bozza) {
      return NextResponse.json(
        { error: 'Bozza non trovata' },
        { status: 404 }
      )
    }
    
    // Verifica se già locked da altro utente
    const now = new Date()
    const lockScaduto = bozza.lockScadeAt ? now > bozza.lockScadeAt : true
    
    if (!lockScaduto && bozza.lockedById && bozza.lockedById !== userId) {
      return NextResponse.json(
        {
          error: `Bozza in uso da ${bozza.lockedByName || 'altro utente'}`,
          lockedBy: bozza.lockedByName,
          lockedById: bozza.lockedById,
          lockScadeAt: bozza.lockScadeAt,
        },
        { status: 423 }
      )
    }
    
    // Acquisisci/rinnova lock
    const lockScadeAt = new Date()
    lockScadeAt.setMinutes(lockScadeAt.getMinutes() + CONFIG.LOCK_SCADENZA_MINUTI)
    
    const bozzaAggiornata = await prisma.bozzaAgibilita.update({
      where: { id },
      data: {
        lockedById: userId,
        lockedByName: userName || null,
        lockedAt: new Date(),
        lockScadeAt,
      }
    })
    
    return NextResponse.json({
      success: true,
      lockScadeAt: bozzaAggiornata.lockScadeAt,
      minutiRimanenti: CONFIG.LOCK_SCADENZA_MINUTI,
    })
    
  } catch (error) {
    console.error('Errore lock bozza:', error)
    return NextResponse.json(
      { error: 'Errore nell\'acquisizione del lock' },
      { status: 500 }
    )
  }
}

// DELETE - Rilascia lock
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const force = searchParams.get('force') === 'true'
    
    const bozza = await prisma.bozzaAgibilita.findUnique({
      where: { id }
    })
    
    if (!bozza) {
      return NextResponse.json(
        { error: 'Bozza non trovata' },
        { status: 404 }
      )
    }
    
    // Verifica proprietà lock (se non force)
    if (!force && bozza.lockedById && bozza.lockedById !== userId) {
      return NextResponse.json(
        { error: 'Non sei il proprietario del lock' },
        { status: 403 }
      )
    }
    
    await prisma.bozzaAgibilita.update({
      where: { id },
      data: {
        lockedById: null,
        lockedByName: null,
        lockedAt: null,
        lockScadeAt: null,
      }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Errore unlock bozza:', error)
    return NextResponse.json(
      { error: 'Errore nel rilascio del lock' },
      { status: 500 }
    )
  }
}

// PUT - Rinnova lock
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body
    
    const bozza = await prisma.bozzaAgibilita.findUnique({
      where: { id }
    })
    
    if (!bozza) {
      return NextResponse.json(
        { error: 'Bozza non trovata' },
        { status: 404 }
      )
    }
    
    // Verifica proprietà lock
    if (bozza.lockedById !== userId) {
      return NextResponse.json(
        { error: 'Non sei il proprietario del lock' },
        { status: 403 }
      )
    }
    
    // Rinnova
    const lockScadeAt = new Date()
    lockScadeAt.setMinutes(lockScadeAt.getMinutes() + CONFIG.LOCK_SCADENZA_MINUTI)
    
    await prisma.bozzaAgibilita.update({
      where: { id },
      data: {
        lockedAt: new Date(),
        lockScadeAt,
      }
    })
    
    return NextResponse.json({
      success: true,
      lockScadeAt,
      minutiRimanenti: CONFIG.LOCK_SCADENZA_MINUTI,
    })
    
  } catch (error) {
    console.error('Errore rinnovo lock:', error)
    return NextResponse.json(
      { error: 'Errore nel rinnovo del lock' },
      { status: 500 }
    )
  }
}
