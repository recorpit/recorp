// src/app/api/produzione/eventi/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Lista eventi con filtri
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stato = searchParams.get('stato')
    const tipo = searchParams.get('tipo')
    const committenteId = searchParams.get('committenteId')
    const localeId = searchParams.get('localeId')
    const formatId = searchParams.get('formatId')
    const dataInizio = searchParams.get('dataInizio')
    const dataFine = searchParams.get('dataFine')
    const search = searchParams.get('search')
    
    const where: any = {}
    
    if (stato) where.stato = stato
    if (tipo) where.tipo = tipo
    if (committenteId) where.committenteId = committenteId
    if (localeId) where.localeId = localeId
    if (formatId) where.formatId = formatId
    
    if (dataInizio) {
      where.dataInizio = { gte: new Date(dataInizio) }
    }
    if (dataFine) {
      where.dataInizio = { ...where.dataInizio, lte: new Date(dataFine) }
    }
    
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { codice: { contains: search, mode: 'insensitive' } },
        { committente: { ragioneSociale: { contains: search, mode: 'insensitive' } } },
        { locale: { nome: { contains: search, mode: 'insensitive' } } },
      ]
    }
    
    const eventi = await prisma.evento.findMany({
      where,
      include: {
        committente: {
          select: { id: true, ragioneSociale: true, aRischio: true }
        },
        locale: {
          select: { id: true, nome: true, citta: true }
        },
        format: {
          select: { id: true, nome: true }
        },
        responsabile: {
          select: { id: true, nome: true, cognome: true }
        },
        _count: {
          select: {
            assegnazioniStaff: true,
            assegnazioniArtisti: true,
            materialiEvento: true,
            preventivi: true,
          }
        }
      },
      orderBy: { dataInizio: 'desc' }
    })
    
    return NextResponse.json(eventi)
  } catch (error) {
    console.error('Errore GET eventi:', error)
    return NextResponse.json({ error: 'Errore nel recupero eventi' }, { status: 500 })
  }
}

// POST - Crea nuovo evento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validazione campi obbligatori
    if (!body.nome || !body.dataInizio) {
      return NextResponse.json({ 
        error: 'Nome e data inizio sono obbligatori' 
      }, { status: 400 })
    }
    
    // Genera codice evento: EVT-ANNO-PROGRESSIVO
    const anno = new Date().getFullYear()
    
    // Trova o crea progressivo
    const progressivo = await prisma.progressivoEvento.upsert({
      where: { anno_tipo: { anno, tipo: 'EVENTO' } },
      update: { ultimoNumero: { increment: 1 } },
      create: { anno, tipo: 'EVENTO', ultimoNumero: 1 }
    })
    
    const codice = `EVT-${anno}-${String(progressivo.ultimoNumero).padStart(4, '0')}`
    
    const evento = await prisma.evento.create({
      data: {
        codice,
        nome: body.nome,
        descrizione: body.descrizione || null,
        tipo: body.tipo || 'CONCERTO',
        stato: body.stato || 'PREVENTIVO',
        dataInizio: new Date(body.dataInizio),
        dataFine: body.dataFine ? new Date(body.dataFine) : null,
        oraCarico: body.oraCarico || null,
        oraInizioEvento: body.oraInizioEvento || null,
        oraFineEvento: body.oraFineEvento || null,
        oraScarico: body.oraScarico || null,
        committenteId: body.committenteId || null,
        localeId: body.localeId || null,
        formatId: body.formatId || null,
        indirizzoEvento: body.indirizzoEvento || null,
        cittaEvento: body.cittaEvento || null,
        provinciaEvento: body.provinciaEvento || null,
        capienzaPrevista: body.capienzaPrevista ? parseInt(body.capienzaPrevista) : null,
        ricavoPrevisto: body.ricavoPrevisto ? parseFloat(body.ricavoPrevisto) : null,
        costoPrevisto: body.costoPrevisto ? parseFloat(body.costoPrevisto) : null,
        responsabileId: body.responsabileId || null,
        note: body.note || null,
        noteInterne: body.noteInterne || null,
      },
      include: {
        committente: true,
        locale: true,
        format: true,
        responsabile: true,
      }
    })
    
    // Crea dossier vuoto collegato
    await prisma.dossierEvento.create({
      data: {
        eventoId: evento.id
      }
    })
    
    return NextResponse.json(evento, { status: 201 })
  } catch (error) {
    console.error('Errore POST evento:', error)
    return NextResponse.json({ error: 'Errore nella creazione evento' }, { status: 500 })
  }
}
