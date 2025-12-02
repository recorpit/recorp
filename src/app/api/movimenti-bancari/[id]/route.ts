// src/app/api/movimenti-bancari/[id]/route.ts
// API Movimento Bancario Singolo - GET, PUT, DELETE

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET - Dettaglio movimento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const { id } = await params
    
    const movimento = await prisma.movimentoBancario.findUnique({
      where: { id },
    })
    
    if (!movimento) {
      return NextResponse.json({ error: 'Movimento non trovato' }, { status: 404 })
    }
    
    return NextResponse.json(movimento)
    
  } catch (error) {
    console.error('Errore GET movimento:', error)
    return NextResponse.json({ error: 'Errore nel recupero del movimento' }, { status: 500 })
  }
}

// PUT - Aggiorna movimento (stato, categoria, note)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const { id } = await params
    const body = await request.json()
    
    const esistente = await prisma.movimentoBancario.findUnique({
      where: { id }
    })
    
    if (!esistente) {
      return NextResponse.json({ error: 'Movimento non trovato' }, { status: 404 })
    }
    
    const updateData: any = {
      updatedAt: new Date(),
    }
    
    // Aggiorna stato
    if (body.stato !== undefined) {
      updateData.stato = body.stato
    }
    
    // Aggiorna categoria
    if (body.categoria !== undefined) {
      updateData.categoria = body.categoria
    }
    
    // Aggiorna note
    if (body.note !== undefined) {
      updateData.note = body.note
    }
    
    // Collega fattura
    if (body.fatturaId !== undefined) {
      updateData.fatturaId = body.fatturaId
    }
    
    // Collega pagamento
    if (body.pagamentoId !== undefined) {
      updateData.pagamentoId = body.pagamentoId
    }
    
    const movimento = await prisma.movimentoBancario.update({
      where: { id },
      data: updateData,
    })
    
    return NextResponse.json(movimento)
    
  } catch (error) {
    console.error('Errore PUT movimento:', error)
    return NextResponse.json({ error: 'Errore nell\'aggiornamento del movimento' }, { status: 500 })
  }
}

// DELETE - Elimina movimento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const { id } = await params
    
    await prisma.movimentoBancario.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Errore DELETE movimento:', error)
    return NextResponse.json({ error: 'Errore nell\'eliminazione del movimento' }, { status: 500 })
  }
}
