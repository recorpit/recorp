// src/app/api/report/kpi/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const da = searchParams.get('da')
    const a = searchParams.get('a')
    
    const dataInizio = da ? new Date(da) : new Date(new Date().getFullYear(), 0, 1)
    const dataFine = a ? new Date(a) : new Date()
    dataFine.setHours(23, 59, 59, 999)
    
    const annoCorrente = dataInizio.getFullYear()
    const dataInizioPrecedente = new Date(dataInizio)
    dataInizioPrecedente.setFullYear(annoCorrente - 1)
    const dataFinePrecedente = new Date(dataFine)
    dataFinePrecedente.setFullYear(annoCorrente - 1)
    
    // ============ KPI ECONOMICI ============
    
    const fatturatoResult = await prisma.agibilita.aggregate({
      where: {
        data: { gte: dataInizio, lte: dataFine },
        stato: { in: ['PRONTA', 'INVIATA_INPS', 'COMPLETATA'] }
      },
      _sum: { quotaAgenzia: true }
    })
    const fatturato = Number(fatturatoResult._sum.quotaAgenzia || 0)
    
    const fatturatoPrecResult = await prisma.agibilita.aggregate({
      where: {
        data: { gte: dataInizioPrecedente, lte: dataFinePrecedente },
        stato: { in: ['PRONTA', 'INVIATA_INPS', 'COMPLETATA'] }
      },
      _sum: { quotaAgenzia: true }
    })
    const fatturatoPrecedente = Number(fatturatoPrecResult._sum.quotaAgenzia || 0)
    
    const cachetResult = await prisma.artistaAgibilita.aggregate({
      where: {
        agibilita: {
          data: { gte: dataInizio, lte: dataFine }
        }
      },
      _sum: { compensoNetto: true }
    })
    const totaleCachet = Number(cachetResult._sum.compensoNetto || 0)
    
    // Fix: 'PAGATO' non 'PAGATA'
    const pagamentiEffettuati = await prisma.artistaAgibilita.aggregate({
      where: {
        agibilita: {
          data: { gte: dataInizio, lte: dataFine }
        },
        statoPagamento: 'PAGATO'
      },
      _sum: { compensoNetto: true }
    })
    const totalePagato = Number(pagamentiEffettuati._sum?.compensoNetto || 0)
    
    // Fix: 'IN_ATTESA_INCASSO' non 'IN_ATTESA'
    const pagamentiSospeso = await prisma.artistaAgibilita.aggregate({
      where: {
        agibilita: {
          data: { gte: dataInizio, lte: dataFine }
        },
        statoPagamento: { in: ['DA_PAGARE', 'IN_ATTESA_INCASSO'] }
      },
      _sum: { compensoNetto: true }
    })
    const totaleSospeso = Number(pagamentiSospeso._sum?.compensoNetto || 0)
    
    // ============ KPI OPERATIVI ============
    
    const agibilitaPerStato = await prisma.agibilita.groupBy({
      by: ['stato'],
      where: {
        data: { gte: dataInizio, lte: dataFine }
      },
      _count: true
    })
    
    const agibilitaStats = {
      totale: agibilitaPerStato.reduce((acc, s) => acc + s._count, 0),
      bozza: agibilitaPerStato.find(s => s.stato === 'BOZZA')?._count || 0,
      pronta: agibilitaPerStato.find(s => s.stato === 'PRONTA')?._count || 0,
      inviata: agibilitaPerStato.find(s => s.stato === 'INVIATA_INPS')?._count || 0,
      completata: agibilitaPerStato.find(s => s.stato === 'COMPLETATA')?._count || 0,
      errore: agibilitaPerStato.find(s => s.stato === 'ERRORE')?._count || 0,
    }
    
    const prestazioniTotali = await prisma.artistaAgibilita.count({
      where: {
        agibilita: {
          data: { gte: dataInizio, lte: dataFine }
        }
      }
    })
    
    const artistiAttivi = await prisma.artistaAgibilita.findMany({
      where: {
        agibilita: {
          data: { gte: dataInizio, lte: dataFine }
        }
      },
      select: { artistaId: true },
      distinct: ['artistaId']
    })
    
    const totaleArtisti = await prisma.artista.count({
      where: { iscritto: true }
    })
    
    const totaleCommittenti = await prisma.committente.count()
    const totaleLocali = await prisma.locale.count()
    
    // ============ CLASSIFICHE ============
    
    const topArtistiPrestazioni = await prisma.artistaAgibilita.groupBy({
      by: ['artistaId'],
      where: {
        agibilita: {
          data: { gte: dataInizio, lte: dataFine }
        }
      },
      _count: true,
      _sum: { compensoNetto: true },
      orderBy: { _count: { artistaId: 'desc' } },
      take: 10
    })
    
    const artistiIds = topArtistiPrestazioni.map(a => a.artistaId)
    const artisti = await prisma.artista.findMany({
      where: { id: { in: artistiIds } },
      select: { id: true, nome: true, cognome: true, nomeDarte: true }
    })
    
    const topArtisti = topArtistiPrestazioni.map(a => {
      const artista = artisti.find(ar => ar.id === a.artistaId)
      return {
        id: a.artistaId,
        nome: artista?.nomeDarte || `${artista?.cognome} ${artista?.nome}`,
        prestazioni: a._count,
        fatturato: Number(a._sum.compensoNetto || 0)
      }
    })
    
    const topCommittentiFatturato = await prisma.agibilita.groupBy({
      by: ['committenteId'],
      where: {
        data: { gte: dataInizio, lte: dataFine },
        stato: { in: ['PRONTA', 'INVIATA_INPS', 'COMPLETATA'] },
        committenteId: { not: null }
      },
      _count: true,
      _sum: { quotaAgenzia: true },
      orderBy: { _sum: { quotaAgenzia: 'desc' } },
      take: 10
    })
    
    // Fix: filtra null prima di passare a prisma
    const committentiIds = topCommittentiFatturato
      .map(c => c.committenteId)
      .filter((id): id is string => id !== null)
    
    const committenti = await prisma.committente.findMany({
      where: { id: { in: committentiIds } },
      select: { id: true, ragioneSociale: true }
    })
    
    const topCommittenti = topCommittentiFatturato.map(c => {
      const committente = committenti.find(co => co.id === c.committenteId)
      return {
        id: c.committenteId,
        nome: committente?.ragioneSociale || 'N/D',
        eventi: c._count,
        fatturato: Number(c._sum.quotaAgenzia || 0)
      }
    })
    
    const topLocaliEventi = await prisma.agibilita.groupBy({
      by: ['localeId'],
      where: {
        data: { gte: dataInizio, lte: dataFine }
      },
      _count: true,
      orderBy: { _count: { localeId: 'desc' } },
      take: 10
    })
    
    const localiIds = topLocaliEventi.map(l => l.localeId)
    const locali = await prisma.locale.findMany({
      where: { id: { in: localiIds } },
      select: { id: true, nome: true, citta: true }
    })
    
    const topLocali = topLocaliEventi.map(l => {
      const locale = locali.find(lo => lo.id === l.localeId)
      return {
        id: l.localeId,
        nome: locale?.nome || 'N/D',
        citta: locale?.citta || '',
        eventi: l._count
      }
    })
    
    const distribuzioneQualifica = await prisma.artistaAgibilita.groupBy({
      by: ['artistaId'],
      where: {
        agibilita: {
          data: { gte: dataInizio, lte: dataFine }
        }
      },
      _count: true
    })
    
    const artistiPerQualifica = await prisma.artista.findMany({
      where: { id: { in: distribuzioneQualifica.map(d => d.artistaId) } },
      select: { id: true, qualifica: true }
    })
    
    const qualificheCount: Record<string, number> = {}
    distribuzioneQualifica.forEach(d => {
      const artista = artistiPerQualifica.find(a => a.id === d.artistaId)
      const qualifica = artista?.qualifica || 'ALTRO'
      qualificheCount[qualifica] = (qualificheCount[qualifica] || 0) + d._count
    })
    
    // ============ ALERT ============
    
    // Fix: query separata per committenti a rischio
    const committentiRischioBase = await prisma.committente.findMany({
      where: { aRischio: true },
      select: { id: true, ragioneSociale: true }
    })
    
    const alertCommittenti: { id: string; nome: string; saldoAperto: number; eventiAperti: number }[] = []
    
    for (const c of committentiRischioBase) {
      const agibilitaAperte = await prisma.agibilita.findMany({
        where: {
          committenteId: c.id,
          stato: { in: ['PRONTA', 'INVIATA_INPS', 'COMPLETATA'] }
        },
        include: {
          artisti: {
            where: {
              statoPagamento: { in: ['DA_PAGARE', 'IN_ATTESA_INCASSO'] }
            }
          }
        }
      })
      
      const saldoAperto = agibilitaAperte.reduce((acc: number, a: any) => 
        acc + a.artisti.reduce((acc2: number, p: any) => acc2 + Number(p.compensoNetto || 0), 0), 0
      )
      const eventiAperti = agibilitaAperte.filter(a => a.artisti.length > 0).length
      
      if (saldoAperto > 0) {
        alertCommittenti.push({
          id: c.id,
          nome: c.ragioneSociale,
          saldoAperto,
          eventiAperti
        })
      }
    }
    
    const oggi = new Date()
    const fra30giorni = new Date()
    fra30giorni.setDate(fra30giorni.getDate() + 30)
    
    const documentiScadenza = await prisma.artista.findMany({
      where: {
        scadenzaDocumento: {
          gte: oggi,
          lte: fra30giorni
        }
      },
      select: {
        id: true,
        nome: true,
        cognome: true,
        tipoDocumento: true,
        scadenzaDocumento: true
      },
      orderBy: { scadenzaDocumento: 'asc' }
    })
    
    const agibilitaDaInviare = await prisma.agibilita.count({
      where: {
        stato: 'PRONTA',
        data: { gte: oggi }
      }
    })
    
    const prestazioniDaPagare = await prisma.artistaAgibilita.count({
      where: {
        statoPagamento: 'DA_PAGARE'
      }
    })
    
    return NextResponse.json({
      periodo: {
        da: dataInizio.toISOString(),
        a: dataFine.toISOString()
      },
      economici: {
        fatturato,
        fatturatoPrecedente,
        variazioneFatturato: fatturatoPrecedente > 0 
          ? ((fatturato - fatturatoPrecedente) / fatturatoPrecedente * 100).toFixed(1)
          : null,
        totaleCachet,
        margine: fatturato - totaleCachet,
        totalePagato,
        totaleSospeso
      },
      operativi: {
        agibilita: agibilitaStats,
        prestazioni: prestazioniTotali,
        artistiAttivi: artistiAttivi.length,
        totaleArtisti,
        totaleCommittenti,
        totaleLocali
      },
      classifiche: {
        topArtisti,
        topCommittenti,
        topLocali,
        distribuzioneQualifica: qualificheCount
      },
      alert: {
        committentiRischio: alertCommittenti,
        documentiScadenza,
        agibilitaDaInviare,
        prestazioniDaPagare
      }
    })
  } catch (error) {
    console.error('Errore KPI:', error)
    return NextResponse.json({ error: 'Errore nel calcolo KPI', details: String(error) }, { status: 500 })
  }
}