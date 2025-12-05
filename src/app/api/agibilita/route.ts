// src/app/api/agibilita/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calcolaCompensi, calcolaScadenzaPagamento, generaCodiceAgibilita, round2 } from '@/lib/constants'
import { StatoAgibilita } from '@prisma/client'

// GET - Lista agibilità
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stato = searchParams.get('stato')
    const statoFattura = searchParams.get('statoFattura')
    const committenteId = searchParams.get('committenteId')
    const localeId = searchParams.get('localeId')
    const artistaId = searchParams.get('artistaId')
    const formatId = searchParams.get('formatId')
    const dataInizio = searchParams.get('dataInizio')
    const dataFine = searchParams.get('dataFine')
    
    const where: any = {}
    
    if (stato) where.stato = stato
    if (statoFattura) where.statoFattura = statoFattura
    if (committenteId) where.committenteId = committenteId
    if (localeId) where.localeId = localeId
    if (formatId) where.formatId = formatId
    
    // Filtro per artista (attraverso la relazione)
    if (artistaId) {
      where.artisti = {
        some: { artistaId }
      }
    }
    
    if (dataInizio || dataFine) {
      where.data = {}
      if (dataInizio) where.data.gte = new Date(dataInizio)
      if (dataFine) where.data.lte = new Date(dataFine)
    }
    
    const agibilita = await prisma.agibilita.findMany({
      where,
      orderBy: { data: 'desc' },
      include: {
        artisti: {
          include: {
            artista: {
              select: {
                id: true,
                nome: true,
                cognome: true,
                nomeDarte: true,
                codiceFiscale: true,
                iscritto: true,
              }
            }
          }
        },
        locale: {
          select: {
            id: true,
            nome: true,
            citta: true,
            codiceBelfiore: true,
          }
        },
        committente: {
          select: {
            id: true,
            ragioneSociale: true,
            aRischio: true,
            quotaAgenzia: true,
          }
        },
        format: {
          select: {
            id: true,
            nome: true,
            tipoFatturazione: true,
          }
        },
      }
    })
    
    return NextResponse.json(agibilita)
  } catch (error) {
    console.error('Errore GET agibilita:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero delle agibilità' },
      { status: 500 }
    )
  }
}

// POST - Crea agibilità (multi-artista)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verifica dati obbligatori - committente e format NON obbligatori
    if (!body.localeId || !body.data) {
      return NextResponse.json(
        { error: 'Dati obbligatori mancanti: locale, data' },
        { status: 400 }
      )
    }
    
    if (!body.artisti || !Array.isArray(body.artisti) || body.artisti.length === 0) {
      return NextResponse.json(
        { error: 'Almeno un artista è obbligatorio' },
        { status: 400 }
      )
    }
    
    // Verifica locale
    const locale = await prisma.locale.findUnique({ where: { id: body.localeId } })
    if (!locale) {
      return NextResponse.json({ error: 'Locale non trovato' }, { status: 404 })
    }
    
    // Verifica committente (opzionale)
    let committente = null
    if (body.committenteId) {
      committente = await prisma.committente.findUnique({ where: { id: body.committenteId } })
      if (!committente) {
        return NextResponse.json({ error: 'Committente non trovato' }, { status: 404 })
      }
    }
    
    // Verifica format (opzionale)
    let format = null
    if (body.formatId) {
      format = await prisma.format.findUnique({ where: { id: body.formatId } })
      if (!format) {
        return NextResponse.json({ error: 'Format non trovato' }, { status: 404 })
      }
    }
    
    // Verifica artisti (usa Set per ID unici, stesso artista può essere in più periodi)
    const artistiIds = body.artisti.map((a: any) => a.artistaId)
    const artistiIdsUnici = Array.from(new Set(artistiIds)) as string[]
    const artisti = await prisma.artista.findMany({
      where: { id: { in: artistiIdsUnici } }
    })
    
    if (artisti.length !== artistiIdsUnici.length) {
      return NextResponse.json({ error: 'Uno o più artisti non trovati' }, { status: 404 })
    }
    
    // Mappa artisti per ID
    const artistiMap = new Map(artisti.map(a => [a.id, a]))
    
    // Gestione codice (prenotato o nuovo)
    let codice = body.codice
    
    if (body.prenotazioneId) {
      const prenotazione = await prisma.prenotazioneNumero.findUnique({
        where: { id: body.prenotazioneId }
      })
      
      if (!prenotazione) {
        return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })
      }
      
      if (prenotazione.confermato) {
        return NextResponse.json({ error: 'Numero già utilizzato' }, { status: 400 })
      }
      
      if (new Date() > prenotazione.scadeAt) {
        return NextResponse.json({ error: 'Prenotazione scaduta' }, { status: 400 })
      }
      
      codice = prenotazione.codice
    } else if (!codice) {
      const anno = new Date().getFullYear()
      const ultimaAgibilita = await prisma.agibilita.findFirst({
        where: { codice: { startsWith: `AG-${anno}-` } },
        orderBy: { codice: 'desc' }
      })
      
      let progressivo = 1
      if (ultimaAgibilita) {
        const match = ultimaAgibilita.codice.match(/AG-\d{4}-(\d+)/)
        if (match) progressivo = parseInt(match[1]) + 1
      }
      
      codice = generaCodiceAgibilita(anno, progressivo)
    }
    
    // Calcola compensi per ogni artista e totali
    // quotaAgenzia del committente è un valore FISSO per prestazione (es. €10), NON una percentuale
    const quotaUnitaria = round2(parseFloat(committente?.quotaAgenzia?.toString() || '0'))
    let totaleNetti = 0
    let totaleLordi = 0
    let totaleRitenute = 0
    
    const artistiData = body.artisti.map((a: any) => {
      const artista = artistiMap.get(a.artistaId)!
      const compensi = calcolaCompensi({ netto: parseFloat(a.compensoNetto || '0') }, 0)
      
      totaleNetti += compensi.netto
      totaleLordi += compensi.lordo
      totaleRitenute += compensi.ritenuta
      
      // Calcola scadenza pagamento per questo artista
      const scadenzaPagamento = calcolaScadenzaPagamento(
        new Date(body.data),
        artista.tipoPagamento,
        committente?.aRischio || false
      )
      
      return {
        artistaId: a.artistaId,
        qualifica: artista.qualifica || null,
        compensoNetto: compensi.netto,
        compensoLordo: compensi.lordo,
        ritenuta: compensi.ritenuta,
        statoPagamento: committente?.aRischio ? 'IN_ATTESA_INCASSO' : 'DA_PAGARE',
        scadenzaPagamento,
        // Date individuali - usa dataInizio se presente, altrimenti data principale
        dataInizio: a.dataInizio ? new Date(a.dataInizio) : new Date(body.data),
        dataFine: a.dataFine ? new Date(a.dataFine) : null,
      }
    })
    
    // Arrotonda i totali per evitare decimali sporchi (es: 999.9999999)
    totaleNetti = round2(totaleNetti)
    totaleLordi = round2(totaleLordi)
    totaleRitenute = round2(totaleRitenute)
    
    // Calcola quota agenzia (quota fissa × numero prestazioni) e importo fattura
    const numPrestazioni = body.artisti.length
    const quotaAgenzia = round2(quotaUnitaria * numPrestazioni)
    const importoFattura = round2(totaleLordi + quotaAgenzia)
    
    // Determina stato
    const tuttiIscritti = artisti.every(a => a.iscritto && a.codiceFiscale && a.dataNascita)
    let stato: StatoAgibilita = 'BOZZA'
    if (tuttiIscritti && locale.codiceBelfiore) {
      stato = 'PRONTA'
    }
    
    // Crea agibilità con artisti in transazione
    const agibilita = await prisma.$transaction(async (tx) => {
      // Crea agibilità
      const ag = await tx.agibilita.create({
        data: {
          codice,
          localeId: body.localeId,
          committenteId: body.committenteId || null, // Può essere null
          formatId: body.formatId || null, // Può essere null
          richiedente: body.richiedente || 'COMMITTENTE',
          data: new Date(body.data),
          dataFine: body.dataFine ? new Date(body.dataFine) : null,
          luogoPrestazione: body.luogoPrestazione || null,
          // Flag estera
          estera: body.estera || false,
          paeseEstero: body.paeseEstero || null,
          totaleCompensiNetti: totaleNetti,
          totaleCompensiLordi: totaleLordi,
          totaleRitenute: totaleRitenute,
          quotaAgenzia,
          importoFattura,
          stato,
          bozzaOriginaleId: body.bozzaOriginaleId || null,
          note: body.note || null,
          noteInterne: body.noteInterne || null,
        },
      })
      
      // Crea righe artisti
      await tx.artistaAgibilita.createMany({
        data: artistiData.map((a: any) => ({
          agibilitaId: ag.id,
          ...a,
        }))
      })
      
      // Conferma prenotazione se usata
      if (body.prenotazioneId) {
        await tx.prenotazioneNumero.update({
          where: { id: body.prenotazioneId },
          data: { confermato: true, agibilitaId: ag.id }
        })
      }
      
      return ag
    })
    
    // Recupera agibilità completa
    const result = await prisma.agibilita.findUnique({
      where: { id: agibilita.id },
      include: {
        artisti: { include: { artista: true } },
        locale: true,
        committente: true,
        format: true,
      }
    })
    
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Errore POST agibilita:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione dell\'agibilità' },
      { status: 500 }
    )
  }
}