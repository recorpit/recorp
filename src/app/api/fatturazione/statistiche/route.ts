// src/app/api/fatturazione/statistiche/route.ts
// API Statistiche Fatturazione - Dashboard

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const annoCorrente = new Date().getFullYear()
    const meseCorrente = new Date().getMonth()
    
    const inizioAnno = new Date(annoCorrente, 0, 1)
    const fineAnno = new Date(annoCorrente, 11, 31, 23, 59, 59)
    const inizioMese = new Date(annoCorrente, meseCorrente, 1)
    const fineMese = new Date(annoCorrente, meseCorrente + 1, 0, 23, 59, 59)
    
    // ============================================
    // FATTURE - STATISTICHE GENERALI
    // Escludi BOZZA e ANNULLATA dai totali
    // ============================================
    
    // Totale fatturato anno (solo EMESSA, INVIATA, PAGATA)
    const fatturatoAnno = await prisma.fattura.aggregate({
      where: {
        anno: annoCorrente,
        stato: { in: ['EMESSA', 'INVIATA', 'PAGATA'] }
      },
      _sum: { totale: true }
    })
    
    // Totale fatturato mese (solo EMESSA, INVIATA, PAGATA)
    const fatturatoMese = await prisma.fattura.aggregate({
      where: {
        anno: annoCorrente,
        stato: { in: ['EMESSA', 'INVIATA', 'PAGATA'] },
        dataEmissione: {
          gte: inizioMese,
          lte: fineMese
        }
      },
      _sum: { totale: true }
    })
    
    // Incassato (fatture pagate)
    const incassato = await prisma.fattura.aggregate({
      where: {
        anno: annoCorrente,
        stato: 'PAGATA'
      },
      _sum: { totale: true }
    })
    
    // Da incassare (emesse o inviate)
    const daIncassare = await prisma.fattura.aggregate({
      where: {
        stato: { in: ['EMESSA', 'INVIATA'] }
      },
      _sum: { totale: true }
    })
    
    // Conteggio fatture per stato (per info)
    const countFatture = await prisma.fattura.groupBy({
      by: ['stato'],
      where: { anno: annoCorrente },
      _count: true
    })
    
    const fattureBozza = countFatture.find(c => c.stato === 'BOZZA')?._count || 0
    const fattureEmesse = countFatture.find(c => c.stato === 'EMESSA')?._count || 0
    const fattureInviate = countFatture.find(c => c.stato === 'INVIATA')?._count || 0
    const fatturePagate = countFatture.find(c => c.stato === 'PAGATA')?._count || 0
    const fattureAnnullate = countFatture.find(c => c.stato === 'ANNULLATA')?._count || 0
    
    // ============================================
    // AGIBILITÀ - DA FATTURARE
    // ============================================
    
    // Count agibilità da fatturare
    const agibilitaDaFatturare = await prisma.agibilita.count({
      where: {
        statoFattura: 'DA_FATTURARE',
        committenteId: { not: null }
      }
    })
    
    // Importo agibilità da fatturare (compensi + quote)
    const agibilitaImporti = await prisma.agibilita.findMany({
      where: {
        statoFattura: 'DA_FATTURARE',
        committenteId: { not: null }
      },
      select: {
        totaleCompensiLordi: true,
        quotaAgenzia: true,
        artisti: {
          select: { id: true }
        }
      }
    })
    
    let agibilitaImportoDaFatturare = 0
    agibilitaImporti.forEach(agi => {
      // totaleCompensiLordi + (quotaAgenzia * numero artisti)
      agibilitaImportoDaFatturare += Number(agi.totaleCompensiLordi) + (Number(agi.quotaAgenzia) * agi.artisti.length)
    })
    
    // Agibilità fatturate nel mese (collegate a fatture emesse nel mese)
    const agibilitaFatturateMese = await prisma.agibilita.count({
      where: {
        statoFattura: { in: ['FATTURATA', 'PAGATA'] },
        fattura: {
          stato: { in: ['EMESSA', 'INVIATA', 'PAGATA'] }, // Escludi BOZZA
          dataEmissione: {
            gte: inizioMese,
            lte: fineMese
          }
        }
      }
    })
    
    // Importo agibilità fatturate anno (solo da fatture emesse/inviate/pagate)
    const agibilitaFatturateAnno = await prisma.fattura.aggregate({
      where: {
        anno: annoCorrente,
        stato: { in: ['EMESSA', 'INVIATA', 'PAGATA'] }
      },
      _sum: { imponibile: true }
    })
    
    // ============================================
    // PREVISIONI
    // ============================================
    
    // Fatturato futuro (fatture emesse/inviate = incassi previsti)
    const fatturatoFuturo = Number(daIncassare._sum.totale || 0)
    
    // Previsione mese (stima basata su agibilità da fatturare)
    // Assumiamo che verranno fatturate nel mese corrente
    const previsioneMese = agibilitaImportoDaFatturare * 1.22 // + IVA 22%
    
    // ============================================
    // SCADENZE MESE
    // ============================================
    
    // Conta fatture con scadenza nel mese corrente (non ancora pagate)
    const scadenzeMese = await prisma.fattura.count({
      where: {
        stato: { in: ['EMESSA', 'ESPORTATA', 'INVIATA'] },
        dataScadenza: {
          gte: inizioMese,
          lte: fineMese
        }
      }
    })
    
    // ============================================
    // RESPONSE
    // ============================================
    
    return NextResponse.json({
      // Generale (ESCLUSO BOZZA e ANNULLATA)
      totaleAnno: Number(fatturatoAnno._sum.totale || 0),
      totaleMese: Number(fatturatoMese._sum.totale || 0),
      incassatoAnno: Number(incassato._sum.totale || 0),
      daIncassare: Number(daIncassare._sum.totale || 0),
      
      // Conteggi fatture per info
      fattureEmesseAnno: fattureEmesse + fattureInviate + fatturePagate,
      fattureBozza,
      fattureAnnullate,
      
      // Agibilità
      agibilitaDaFatturare,
      agibilitaImportoDaFatturare: Math.round(agibilitaImportoDaFatturare * 100) / 100,
      agibilitaFatturate: agibilitaFatturateMese,
      agibilitaImportoFatturato: Number(agibilitaFatturateAnno._sum.imponibile || 0),
      
      // Produzione (placeholder per futuro)
      produzioneDaFatturare: 0,
      produzioneImportoDaFatturare: 0,
      
      // Previsioni
      fatturatoFuturo,
      previsioneMese: Math.round(previsioneMese * 100) / 100,
      scadenzeMese,
    })
    
  } catch (error) {
    console.error('Errore statistiche fatturazione:', error)
    return NextResponse.json(
      { error: 'Errore nel calcolo delle statistiche' },
      { status: 500 }
    )
  }
}
