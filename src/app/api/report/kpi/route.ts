// src/app/api/report/kpi/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const da = searchParams.get('da')
    const a = searchParams.get('a')
    
    // Date filter
    const dataInizio = da ? new Date(da) : new Date(new Date().getFullYear(), 0, 1)
    const dataFine = a ? new Date(a) : new Date()
    dataFine.setHours(23, 59, 59, 999)
    
    // Anno precedente per confronto
    const annoCorrente = dataInizio.getFullYear()
    const dataInizioPrecedente = new Date(dataInizio)
    dataInizioPrecedente.setFullYear(annoCorrente - 1)
    const dataFinePrecedente = new Date(dataFine)
    dataFinePrecedente.setFullYear(annoCorrente - 1)
    
    // ============ KPI ECONOMICI ============
    
    // Totale quota agenzia (fatturato)
    const fatturatoResult = await prisma.agibilita.aggregate({
      where: {
        data: { gte: dataInizio, lte: dataFine },
        stato: { in: ['PRONTA', 'INVIATA_INPS', 'COMPLETATA'] }
      },
      _sum: { quotaAgenzia: true }
    })
    const fatturato = Number(fatturatoResult._sum.quotaAgenzia || 0)
    
    // Fatturato anno precedente
    const fatturatoPrecResult = await prisma.agibilita.aggregate({
      where: {
        data: { gte: dataInizioPrecedente, lte: dataFinePrecedente },
        stato: { in: ['PRONTA', 'INVIATA_INPS', 'COMPLETATA'] }
      },
      _sum: { quotaAgenzia: true }
    })
    const fatturatoPrecedente = Number(fatturatoPrecResult._sum.quotaAgenzia || 0)
    
    // Totale cachet artisti (da ArtistaAgibilita)
    const cachetResult = await prisma.artistaAgibilita.aggregate({
      where: {
        agibilita: {
          data: { gte: dataInizio, lte: dataFine }
        }
      },
      _sum: { compensoNetto: true }
    })
    const totaleCachet = Number(cachetResult._sum.compensoNetto || 0)
    
    // Pagamenti effettuati
    const pagamentiEffettuati = await prisma.artistaAgibilita.aggregate({
      where: {
        agibilita: {
          data: { gte: dataInizio, lte: dataFine }
        },
        statoPagamento: 'PAGATA'
      },
      _sum: { compensoNetto: true }
    })
    const totalePagato = Number(pagamentiEffettuati._sum.compensoNetto || 0)
    
    // Pagamenti in sospeso
    const pagamentiSospeso = await prisma.artistaAgibilita.aggregate({
      where: {
        agibilita: {
          data: { gte: dataInizio, lte: dataFine }
        },
        statoPagamento: { in: ['DA_PAGARE', 'IN_ATTESA'] }
      },
      _sum: { compensoNetto: true }
    })
    const totaleSospeso = Number(pagamentiSospeso._sum.compensoNetto || 0)
    
    // ============ KPI OPERATIVI ============
    
    // Agibilità per stato
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
    
    // Prestazioni totali (ArtistaAgibilita = singole prestazioni artista)
    const prestazioniTotali = await prisma.artistaAgibilita.count({
      where: {
        agibilita: {
          data: { gte: dataInizio, lte: dataFine }
        }
      }
    })
    
    // Artisti attivi (con almeno 1 prestazione nel periodo)
    const artistiAttivi = await prisma.artistaAgibilita.findMany({
      where: {
        agibilita: {
          data: { gte: dataInizio, lte: dataFine }
        }
      },
      select: { artistaId: true },
      distinct: ['artistaId']
    })
    
    // Totale artisti iscritti
    const totaleArtisti = await prisma.artista.count({
      where: { iscritto: true }
    })
    
    // Totale committenti
    const totaleCommittenti = await prisma.committente.count()
    
    // Totale locali
    const totaleLocali = await prisma.locale.count()
    
    // ============ CLASSIFICHE ============
    
    // Top 10 artisti per numero prestazioni
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
    
    // Recupera nomi artisti
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
    
    // Top 10 committenti per fatturato
    const topCommittentiFatturato = await prisma.agibilita.groupBy({
      by: ['committenteId'],
      where: {
        data: { gte: dataInizio, lte: dataFine },
        stato: { in: ['PRONTA', 'INVIATA_INPS', 'COMPLETATA'] }
      },
      _count: true,
      _sum: { quotaAgenzia: true },
      orderBy: { _sum: { quotaAgenzia: 'desc' } },
      take: 10
    })
    
    const committentiIds = topCommittentiFatturato.map(c => c.committenteId)
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
    
    // Top 10 locali per numero eventi
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
    
    // Distribuzione per qualifica
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
    
    // Committenti a rischio con saldo aperto
    const committentiRischio = await prisma.committente.findMany({
      where: { aRischio: true },
      include: {
        agibilita: {
          where: {
            stato: { in: ['PRONTA', 'INVIATA_INPS', 'COMPLETATA'] }
          },
          include: {
            artisti: {
              where: {
                statoPagamento: { in: ['DA_PAGARE', 'IN_ATTESA'] }
              }
            }
          }
        }
      }
    })
    
    const alertCommittenti = committentiRischio
      .map(c => ({
        id: c.id,
        nome: c.ragioneSociale,
        saldoAperto: c.agibilita.reduce((acc, a) => 
          acc + a.artisti.reduce((acc2, p) => acc2 + Number(p.compensoNetto || 0), 0), 0
        ),
        eventiAperti: c.agibilita.filter(a => a.artisti.length > 0).length
      }))
      .filter(c => c.saldoAperto > 0)
    
    // Documenti in scadenza (prossimi 30 giorni)
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
    
    // Agibilità da inviare (PRONTA ma non ancora INVIATA_INPS)
    const agibilitaDaInviare = await prisma.agibilita.count({
      where: {
        stato: 'PRONTA',
        data: { gte: oggi }
      }
    })
    
    // Prestazioni da pagare
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
