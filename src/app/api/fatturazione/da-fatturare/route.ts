// src/app/api/fatturazione/da-fatturare/route.ts
// API Agibilità da Fatturare - Raggruppate per Committente

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const committenteId = searchParams.get('committente')
    
    // Filtro base
    const where: any = {
      statoFattura: 'DA_FATTURARE',
      committenteId: { not: null }
    }
    
    // Se filtro per committente specifico
    if (committenteId) {
      where.committenteId = committenteId
    }
    
    // Carica agibilità da fatturare
    const agibilita = await prisma.agibilita.findMany({
      where,
      include: {
        locale: {
          select: { nome: true }
        },
        committente: {
          select: { id: true, ragioneSociale: true, quotaAgenzia: true }
        },
        artisti: {
          include: {
            artista: {
              select: { nome: true, cognome: true, nomeDarte: true }
            }
          }
        }
      },
      orderBy: [
        { committente: { ragioneSociale: 'asc' } },
        { data: 'desc' }
      ]
    })
    
    // Raggruppa per committente
    const byCommittente = new Map<string, {
      committente: { id: string; ragioneSociale: string; quotaAgenzia: number }
      agibilita: any[]
      totale: number
      count: number
    }>()
    
    agibilita.forEach(agi => {
      if (!agi.committente) return
      
      const key = agi.committente.id
      const quotaPerArtista = Number(agi.committente.quotaAgenzia || 0)
      const importo = Number(agi.totaleCompensiLordi) + (quotaPerArtista * agi.artisti.length)
      
      if (!byCommittente.has(key)) {
        byCommittente.set(key, {
          committente: {
            id: agi.committente.id,
            ragioneSociale: agi.committente.ragioneSociale,
            quotaAgenzia: quotaPerArtista
          },
          agibilita: [],
          totale: 0,
          count: 0
        })
      }
      
      const group = byCommittente.get(key)!
      group.agibilita.push({
        id: agi.id,
        codice: agi.codice,
        data: agi.data,
        locale: agi.locale,
        totaleCompensiLordi: Number(agi.totaleCompensiLordi),
        quotaAgenzia: Number(agi.quotaAgenzia),
        importoTotale: importo,
        artisti: agi.artisti.map(aa => ({
          nome: aa.artista.nome,
          cognome: aa.artista.cognome,
          nomeDarte: aa.artista.nomeDarte,
          compensoLordo: Number(aa.compensoLordo)
        }))
      })
      group.totale += importo
      group.count++
    })
    
    // Converti in array ordinato per totale decrescente
    const result = Array.from(byCommittente.values())
      .sort((a, b) => b.totale - a.totale)
    
    // Totali generali
    const totaleGenerale = result.reduce((sum, g) => sum + g.totale, 0)
    const countGenerale = result.reduce((sum, g) => sum + g.count, 0)
    
    return NextResponse.json({
      byCommittente: result,
      totale: Math.round(totaleGenerale * 100) / 100,
      count: countGenerale,
      committentiCount: result.length
    })
    
  } catch (error) {
    console.error('Errore agibilità da fatturare:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero delle agibilità' },
      { status: 500 }
    )
  }
}
