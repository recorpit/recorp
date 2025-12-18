// src/app/api/report/trend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const anno = parseInt(searchParams.get('anno') || new Date().getFullYear().toString())
    
    const mesi: any[] = []
    
    for (let mese = 0; mese < 12; mese++) {
      const dataInizio = new Date(anno, mese, 1)
      const dataFine = new Date(anno, mese + 1, 0, 23, 59, 59)
      
      // Fatturato mese
      const fatturatoMese = await prisma.agibilita.aggregate({
        where: {
          data: { gte: dataInizio, lte: dataFine },
          stato: { in: ['PRONTA', 'INVIATA_INPS', 'COMPLETATA'] }
        },
        _sum: { quotaAgenzia: true },
        _count: true
      })
      
      // Cachet mese (da ArtistaAgibilita)
      const cachetMese = await prisma.artistaAgibilita.aggregate({
        where: {
          agibilita: {
            data: { gte: dataInizio, lte: dataFine }
          }
        },
        _sum: { compensoNetto: true },
        _count: true
      })
      
      // Anno precedente per confronto
      const dataInizioPrev = new Date(anno - 1, mese, 1)
      const dataFinePrev = new Date(anno - 1, mese + 1, 0, 23, 59, 59)
      
      const fatturatoPrev = await prisma.agibilita.aggregate({
        where: {
          data: { gte: dataInizioPrev, lte: dataFinePrev },
          stato: { in: ['PRONTA', 'INVIATA_INPS', 'COMPLETATA'] }
        },
        _sum: { quotaAgenzia: true }
      })
      
      mesi.push({
        mese: mese + 1,
        nomeMese: dataInizio.toLocaleString('it-IT', { month: 'short' }),
        fatturato: Number(fatturatoMese._sum.quotaAgenzia || 0),
        fatturatoPrecedente: Number(fatturatoPrev._sum.quotaAgenzia || 0),
        cachet: Number(cachetMese._sum.compensoNetto || 0),
        margine: Number(fatturatoMese._sum.quotaAgenzia || 0) - Number(cachetMese._sum.compensoNetto || 0),
        eventi: fatturatoMese._count,
        prestazioni: cachetMese._count
      })
    }
    
    // Trend settimanale ultimo mese
    const oggi = new Date()
    const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1)
    const settimane: any[] = []
    
    let dataCorrente = new Date(inizioMese)
    let settimanaNum = 1
    
    while (dataCorrente <= oggi) {
      const inizioSettimana = new Date(dataCorrente)
      const fineSettimana = new Date(dataCorrente)
      fineSettimana.setDate(fineSettimana.getDate() + 6)
      if (fineSettimana > oggi) fineSettimana.setTime(oggi.getTime())
      
      const fatturatoSettimana = await prisma.agibilita.aggregate({
        where: {
          data: { gte: inizioSettimana, lte: fineSettimana },
          stato: { in: ['PRONTA', 'INVIATA_INPS', 'COMPLETATA'] }
        },
        _sum: { quotaAgenzia: true },
        _count: true
      })
      
      settimane.push({
        settimana: settimanaNum,
        label: `${inizioSettimana.getDate()}/${inizioSettimana.getMonth() + 1}`,
        fatturato: Number(fatturatoSettimana._sum.quotaAgenzia || 0),
        eventi: fatturatoSettimana._count
      })
      
      dataCorrente.setDate(dataCorrente.getDate() + 7)
      settimanaNum++
    }
    
    // Calcola totali anno
    const totaleAnno = mesi.reduce((acc, m) => ({
      fatturato: acc.fatturato + m.fatturato,
      fatturatoPrecedente: acc.fatturatoPrecedente + m.fatturatoPrecedente,
      cachet: acc.cachet + m.cachet,
      eventi: acc.eventi + m.eventi,
      prestazioni: acc.prestazioni + m.prestazioni
    }), { fatturato: 0, fatturatoPrecedente: 0, cachet: 0, eventi: 0, prestazioni: 0 })
    
    return NextResponse.json({
      anno,
      mesi,
      settimane,
      totali: {
        ...totaleAnno,
        margine: totaleAnno.fatturato - totaleAnno.cachet,
        variazione: totaleAnno.fatturatoPrecedente > 0
          ? ((totaleAnno.fatturato - totaleAnno.fatturatoPrecedente) / totaleAnno.fatturatoPrecedente * 100).toFixed(1)
          : null
      }
    })
  } catch (error) {
    console.error('Errore trend:', error)
    return NextResponse.json({ error: 'Errore nel calcolo trend', details: String(error) }, { status: 500 })
  }
}
