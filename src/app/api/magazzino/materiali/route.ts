// src/app/api/magazzino/materiali/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Lista materiali con filtri
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    const stato = searchParams.get('stato')
    const attivo = searchParams.get('attivo')
    const consumabile = searchParams.get('consumabile')
    const search = searchParams.get('search')
    
    const where: any = {}
    
    if (categoria) where.categoria = categoria
    if (stato) where.stato = stato
    if (attivo !== null) where.attivo = attivo === 'true'
    if (consumabile !== null) where.consumabile = consumabile === 'true'
    
    if (search) {
      where.OR = [
        { codice: { contains: search, mode: 'insensitive' } },
        { nome: { contains: search, mode: 'insensitive' } },
        { descrizione: { contains: search, mode: 'insensitive' } },
        { marca: { contains: search, mode: 'insensitive' } },
        { modello: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    const materiali = await prisma.materiale.findMany({
      where,
      include: {
        _count: {
          select: {
            movimenti: true,
            eventiMateriale: true,
            pacchetti: true,
          }
        }
      },
      orderBy: [
        { categoria: 'asc' },
        { nome: 'asc' }
      ]
    })
    
    return NextResponse.json(materiali)
  } catch (error) {
    console.error('Errore GET materiali:', error)
    return NextResponse.json({ error: 'Errore nel recupero materiali' }, { status: 500 })
  }
}

// POST - Crea nuovo materiale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validazione
    if (!body.codice || !body.nome) {
      return NextResponse.json({ 
        error: 'Codice e nome sono obbligatori' 
      }, { status: 400 })
    }
    
    // Verifica codice duplicato
    const existing = await prisma.materiale.findUnique({
      where: { codice: body.codice }
    })
    if (existing) {
      return NextResponse.json({ 
        error: 'Codice già esistente' 
      }, { status: 400 })
    }
    
    const materiale = await prisma.materiale.create({
      data: {
        codice: body.codice.toUpperCase(),
        nome: body.nome,
        descrizione: body.descrizione || null,
        categoria: body.categoria || 'ALTRO',
        quantitaTotale: parseInt(body.quantitaTotale) || 1,
        quantitaDisponibile: parseInt(body.quantitaDisponibile) || parseInt(body.quantitaTotale) || 1,
        prezzoAcquisto: body.prezzoAcquisto ? parseFloat(body.prezzoAcquisto) : null,
        prezzoNoleggio: body.prezzoNoleggio ? parseFloat(body.prezzoNoleggio) : null,
        prezzoVendita: body.prezzoVendita ? parseFloat(body.prezzoVendita) : null,
        marca: body.marca || null,
        modello: body.modello || null,
        numeroSerie: body.numeroSerie || null,
        ubicazione: body.ubicazione || null,
        stato: body.stato || 'DISPONIBILE',
        dataAcquisto: body.dataAcquisto ? new Date(body.dataAcquisto) : null,
        dataScadenza: body.dataScadenza ? new Date(body.dataScadenza) : null,
        ultimaManutenzione: body.ultimaManutenzione ? new Date(body.ultimaManutenzione) : null,
        prossimaManutenzione: body.prossimaManutenzione ? new Date(body.prossimaManutenzione) : null,
        note: body.note || null,
        immagine: body.immagine || null,
        qrCode: body.qrCode || null,
        attivo: body.attivo !== false,
        consumabile: body.consumabile || false,
      }
    })
    
    return NextResponse.json(materiale, { status: 201 })
  } catch (error) {
    console.error('Errore POST materiale:', error)
    return NextResponse.json({ error: 'Errore nella creazione materiale' }, { status: 500 })
  }
}
