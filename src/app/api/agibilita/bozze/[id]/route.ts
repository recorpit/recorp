// src/app/api/agibilita/bozze/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CONFIG } from '@/lib/constants'

// GET - Singola bozza
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const bozza = await prisma.bozzaAgibilita.findUnique({
      where: { id },
      include: {
        creatoDa: {
          select: { id: true, nome: true, cognome: true }
        },
        lockedByUser: {
          select: { id: true, nome: true, cognome: true }
        }
      }
    })
    
    if (!bozza) {
      return NextResponse.json(
        { error: 'Bozza non trovata' },
        { status: 404 }
      )
    }
    
    const now = new Date()
    const lockScaduto = bozza.lockScadeAt ? now > bozza.lockScadeAt : true
    const isLocked = bozza.lockedById && !lockScaduto
    
    return NextResponse.json({
      ...bozza,
      lockScaduto,
      isLocked,
    })
  } catch (error) {
    console.error('Errore GET bozza:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero della bozza' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna bozza (con verifica lock)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Verifica esistenza e lock
    const bozza = await prisma.bozzaAgibilita.findUnique({
      where: { id }
    })
    
    if (!bozza) {
      return NextResponse.json(
        { error: 'Bozza non trovata' },
        { status: 404 }
      )
    }
    
    // Verifica lock
    const now = new Date()
    const lockScaduto = bozza.lockScadeAt ? now > bozza.lockScadeAt : true
    
    if (!lockScaduto && bozza.lockedById && bozza.lockedById !== body.userId) {
      return NextResponse.json(
        { 
          error: `Bozza in uso da ${bozza.lockedByName || 'altro utente'}`,
          lockedBy: bozza.lockedByName,
          lockScadeAt: bozza.lockScadeAt,
        },
        { status: 423 } // Locked
      )
    }
    
    // Rinnova lock
    const lockScadeAt = new Date()
    lockScadeAt.setMinutes(lockScadeAt.getMinutes() + CONFIG.LOCK_SCADENZA_MINUTI)
    
    // Calcola percentuale completamento
    let percentuale = 0
    if (body.datiArtisti) percentuale += 20
    if (body.datiLocale) percentuale += 20
    if (body.datiCommittente) percentuale += 20
    if (body.datiPrestazione) percentuale += 20
    if (body.datiEconomici) percentuale += 20
    
    const bozzaAggiornata = await prisma.bozzaAgibilita.update({
      where: { id },
      data: {
        codicePrenotato: body.codicePrenotato !== undefined ? body.codicePrenotato : bozza.codicePrenotato,
        prenotazioneId: body.prenotazioneId !== undefined ? body.prenotazioneId : bozza.prenotazioneId,
        datiArtisti: body.datiArtisti !== undefined ? body.datiArtisti : bozza.datiArtisti,
        datiLocale: body.datiLocale !== undefined ? body.datiLocale : bozza.datiLocale,
        datiCommittente: body.datiCommittente !== undefined ? body.datiCommittente : bozza.datiCommittente,
        datiPrestazione: body.datiPrestazione !== undefined ? body.datiPrestazione : bozza.datiPrestazione,
        datiEconomici: body.datiEconomici !== undefined ? body.datiEconomici : bozza.datiEconomici,
        stato: body.stato || bozza.stato,
        percentualeCompletamento: percentuale,
        lockedById: body.userId || bozza.lockedById,
        lockedByName: body.userName || bozza.lockedByName,
        lockedAt: new Date(),
        lockScadeAt,
      },
      include: {
        creatoDa: {
          select: { id: true, nome: true, cognome: true }
        }
      }
    })
    
    return NextResponse.json(bozzaAggiornata)
  } catch (error) {
    console.error('Errore PUT bozza:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della bozza' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina bozza
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
    
    // Verifica lock (se non force)
    if (!force) {
      const now = new Date()
      const lockScaduto = bozza.lockScadeAt ? now > bozza.lockScadeAt : true
      
      if (!lockScaduto && bozza.lockedById && bozza.lockedById !== userId) {
        return NextResponse.json(
          { error: `Bozza in uso da ${bozza.lockedByName}` },
          { status: 423 }
        )
      }
    }
    
    // Rilascia prenotazione numero se presente
    if (bozza.prenotazioneId) {
      await prisma.prenotazioneNumero.delete({
        where: { id: bozza.prenotazioneId }
      }).catch(() => {}) // Ignora se già eliminata
    }
    
    await prisma.bozzaAgibilita.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore DELETE bozza:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione della bozza' },
      { status: 500 }
    )
  }
}
