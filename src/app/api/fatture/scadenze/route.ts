// src/app/api/fatture/scadenze/route.ts
// API Scadenze Fatture - Lista fatture non pagate con scadenze

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const filtroScadenza = searchParams.get('filtroScadenza') // scadute, in_scadenza, future
    
    const oggi = new Date()
    oggi.setHours(0, 0, 0, 0)
    
    const tra7giorni = new Date(oggi)
    tra7giorni.setDate(tra7giorni.getDate() + 7)
    
    // Fatture non pagate (EMESSA, ESPORTATA, INVIATA)
    const where: any = {
      stato: { in: ['EMESSA', 'ESPORTATA', 'INVIATA'] },
      dataPagamento: null,
    }
    
    // Filtro per scadenza
    if (filtroScadenza === 'scadute') {
      where.dataScadenza = { lt: oggi }
    } else if (filtroScadenza === 'in_scadenza') {
      where.dataScadenza = { gte: oggi, lte: tra7giorni }
    } else if (filtroScadenza === 'future') {
      where.dataScadenza = { gt: tra7giorni }
    }
    
    const fatture = await prisma.fattura.findMany({
      where,
      select: {
        id: true,
        numero: true,
        progressivo: true,
        dataEmissione: true,
        dataScadenza: true,
        totale: true,
        stato: true,
        committente: {
          select: {
            id: true,
            ragioneSociale: true,
          }
        }
      },
      orderBy: [
        { dataScadenza: 'asc' },
        { dataEmissione: 'asc' },
      ],
    })
    
    // Calcola stats per tutte le fatture non pagate
    const tutteFatture = await prisma.fattura.findMany({
      where: {
        stato: { in: ['EMESSA', 'ESPORTATA', 'INVIATA'] },
        dataPagamento: null,
      },
      select: {
        totale: true,
        dataScadenza: true,
      }
    })
    
    let totaleScadute = 0
    let totaleInScadenza = 0
    let totaleFuture = 0
    let countScadute = 0
    let countInScadenza = 0
    let countFuture = 0
    
    tutteFatture.forEach(f => {
      const totale = Number(f.totale)
      if (!f.dataScadenza) {
        // Senza scadenza, considera come futura
        totaleFuture += totale
        countFuture++
      } else {
        const scad = new Date(f.dataScadenza)
        if (scad < oggi) {
          totaleScadute += totale
          countScadute++
        } else if (scad <= tra7giorni) {
          totaleInScadenza += totale
          countInScadenza++
        } else {
          totaleFuture += totale
          countFuture++
        }
      }
    })
    
    return NextResponse.json({
      fatture,
      stats: {
        totaleScadute,
        totaleInScadenza,
        totaleFuture,
        countScadute,
        countInScadenza,
        countFuture,
      }
    })
    
  } catch (error) {
    console.error('Errore GET scadenze:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero delle scadenze' },
      { status: 500 }
    )
  }
}
