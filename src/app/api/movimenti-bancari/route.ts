// src/app/api/movimenti-bancari/route.ts
// API Movimenti Bancari - Lista e Creazione

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Lista movimenti
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const stato = searchParams.get('stato')
    const tipo = searchParams.get('tipo')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    const where: any = {}
    
    if (stato && stato !== 'tutti') {
      where.stato = stato
    }
    
    if (tipo && tipo !== 'tutti') {
      where.tipo = tipo
    }
    
    if (from || to) {
      where.data = {}
      if (from) where.data.gte = new Date(from)
      if (to) where.data.lte = new Date(to)
    }
    
    const movimenti = await prisma.movimentoBancario.findMany({
      where,
      orderBy: { data: 'desc' },
      take: limit,
    })
    
    // Calcola stats
    const allMovimenti = await prisma.movimentoBancario.findMany({
      where,
      select: { importo: true, tipo: true, stato: true }
    })
    
    const stats = {
      totaleEntrate: allMovimenti.filter(m => m.tipo === 'ENTRATA').reduce((s, m) => s + Number(m.importo), 0),
      totaleUscite: allMovimenti.filter(m => m.tipo === 'USCITA').reduce((s, m) => s + Math.abs(Number(m.importo)), 0),
      saldo: allMovimenti.reduce((s, m) => s + Number(m.importo), 0),
      daRiconciliare: allMovimenti.filter(m => m.stato === 'DA_RICONCILIARE').length,
      riconciliati: allMovimenti.filter(m => m.stato === 'RICONCILIATO').length,
    }
    
    return NextResponse.json({ movimenti, stats })
    
  } catch (error) {
    console.error('Errore GET movimenti:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei movimenti' },
      { status: 500 }
    )
  }
}

// POST - Crea movimento singolo (manuale)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const body = await request.json()
    
    const movimento = await prisma.movimentoBancario.create({
      data: {
        data: new Date(body.data),
        dataValuta: body.dataValuta ? new Date(body.dataValuta) : new Date(body.data),
        descrizione: body.descrizione,
        importo: body.importo,
        tipo: body.importo >= 0 ? 'ENTRATA' : 'USCITA',
        stato: 'DA_RICONCILIARE',
        riferimentoInterno: body.riferimentoInterno || null,
        note: body.note || null,
      },
    })
    
    return NextResponse.json(movimento, { status: 201 })
    
  } catch (error) {
    console.error('Errore POST movimento:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione del movimento' },
      { status: 500 }
    )
  }
}
