// src/app/api/pagamenti/distinta/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST - Genera distinta CSV bonifici
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prestazioniIds } = body
    
    if (!prestazioniIds || prestazioniIds.length === 0) {
      return NextResponse.json(
        { error: 'Nessuna prestazione selezionata' },
        { status: 400 }
      )
    }
    
    // Recupera prestazioni pagabili
    const prestazioni = await prisma.prestazioneOccasionale.findMany({
      where: {
        id: { in: prestazioniIds },
        stato: 'PAGABILE',
      },
      include: {
        artista: true,
      }
    })
    
    if (prestazioni.length === 0) {
      return NextResponse.json(
        { error: 'Nessuna prestazione pagabile trovata' },
        { status: 400 }
      )
    }
    
    // Verifica IBAN
    const senzaIBAN = prestazioni.filter(p => !p.artista.iban)
    if (senzaIBAN.length > 0) {
      return NextResponse.json({
        error: 'IBAN mancante per alcuni artisti',
        artisti: senzaIBAN.map(p => `${p.artista.cognome} ${p.artista.nome}`)
      }, { status: 400 })
    }
    
    // Raggruppa per artista (CF)
    const perArtista = new Map<string, any>()
    
    for (const p of prestazioni) {
      const cf = p.artista.codiceFiscale || p.artistaId
      
      if (!perArtista.has(cf)) {
        perArtista.set(cf, {
          artista: p.artista,
          prestazioni: [],
          totale: 0,
          causali: [],
        })
      }
      
      const gruppo = perArtista.get(cf)!
      gruppo.prestazioni.push(p)
      gruppo.totale += parseFloat(p.totalePagato as any)
      if (p.causaleBonifico) {
        gruppo.causali.push(p.causaleBonifico)
      }
    }
    
    // Genera CSV
    const righe: string[] = []
    
    // Header
    righe.push('Beneficiario;IBAN;Importo;Causale')
    
    let totaleGenerale = 0
    
    for (const [cf, gruppo] of perArtista) {
      const beneficiario = `${gruppo.artista.cognome} ${gruppo.artista.nome}`
      const iban = gruppo.artista.iban || ''
      const importo = gruppo.totale.toFixed(2).replace('.', ',')
      
      // Costruisci causale dettagliata
      let causale = ''
      if (gruppo.causali.length === 1) {
        causale = gruppo.causali[0]
      } else {
        causale = `Prestazioni: ${gruppo.causali.join(' / ')}`
      }
      // Tronca a 140 caratteri
      causale = causale.substring(0, 140)
      
      righe.push(`${beneficiario};${iban};${importo};${causale}`)
      totaleGenerale += gruppo.totale
    }
    
    // Riga totale
    righe.push('')
    righe.push(`TOTALE;;;${totaleGenerale.toFixed(2).replace('.', ',')}`)
    
    const csv = righe.join('\n')
    
    // Genera ID distinta
    const oggi = new Date()
    const distinaId = `DST-${oggi.toISOString().split('T')[0]}-${Date.now().toString().slice(-6)}`
    
    // Aggiorna stato prestazioni a PAGATA (non più IN_DISTINTA)
    await prisma.prestazioneOccasionale.updateMany({
      where: { id: { in: prestazioniIds } },
      data: {
        stato: 'PAGATA',
        dataPagamento: oggi,
        distinaId,
        distinaGenerataAt: oggi,
      }
    })
    
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${distinaId}.csv"`,
      }
    })
    
  } catch (error) {
    console.error('Errore generazione distinta:', error)
    return NextResponse.json(
      { error: 'Errore nella generazione distinta' },
      { status: 500 }
    )
  }
}

// GET - Lista distinte generate
export async function GET(request: NextRequest) {
  try {
    // Raggruppa prestazioni per distinaId
    const prestazioni = await prisma.prestazioneOccasionale.findMany({
      where: {
        distinaId: { not: null }
      },
      select: {
        distinaId: true,
        distinaGenerataAt: true,
        totalePagato: true,
        stato: true,
      }
    })
    
    const distinte = new Map<string, any>()
    
    for (const p of prestazioni) {
      if (!p.distinaId) continue
      
      if (!distinte.has(p.distinaId)) {
        distinte.set(p.distinaId, {
          id: p.distinaId,
          dataGenerazione: p.distinaGenerataAt,
          totale: 0,
          numeroPrestazioni: 0,
          stato: 'IN_DISTINTA',
        })
      }
      
      const d = distinte.get(p.distinaId)!
      d.totale += parseFloat(p.totalePagato as any)
      d.numeroPrestazioni++
      
      if (p.stato === 'PAGATA') {
        d.stato = 'PAGATA'
      }
    }
    
    return NextResponse.json(Array.from(distinte.values()))
    
  } catch (error) {
    console.error('Errore GET distinte:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero distinte' },
      { status: 500 }
    )
  }
}
