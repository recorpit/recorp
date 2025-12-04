// src/app/api/magazzino/pacchetti/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Lista pacchetti
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    const attivo = searchParams.get('attivo')
    const search = searchParams.get('search')
    
    const where: any = {}
    
    if (categoria) where.categoria = categoria
    if (attivo !== null) where.attivo = attivo === 'true'
    
    if (search) {
      where.OR = [
        { codice: { contains: search, mode: 'insensitive' } },
        { nome: { contains: search, mode: 'insensitive' } },
        { descrizione: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    const pacchetti = await prisma.pacchetto.findMany({
      where,
      include: {
        materiali: {
          include: {
            materiale: {
              select: {
                id: true,
                codice: true,
                nome: true,
                categoria: true,
                quantitaDisponibile: true,
              }
            }
          }
        },
        _count: {
          select: {
            materiali: true,
            eventiPacchetto: true,
          }
        }
      },
      orderBy: [
        { categoria: 'asc' },
        { nome: 'asc' }
      ]
    })
    
    return NextResponse.json(pacchetti)
  } catch (error) {
    console.error('Errore GET pacchetti:', error)
    return NextResponse.json({ error: 'Errore nel recupero pacchetti' }, { status: 500 })
  }
}

// POST - Crea nuovo pacchetto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.codice || !body.nome) {
      return NextResponse.json({ 
        error: 'Codice e nome sono obbligatori' 
      }, { status: 400 })
    }
    
    // Verifica codice duplicato
    const existing = await prisma.pacchetto.findUnique({
      where: { codice: body.codice }
    })
    if (existing) {
      return NextResponse.json({ 
        error: 'Codice già esistente' 
      }, { status: 400 })
    }
    
    const pacchetto = await prisma.pacchetto.create({
      data: {
        codice: body.codice.toUpperCase(),
        nome: body.nome,
        descrizione: body.descrizione || null,
        categoria: body.categoria || null,
        prezzoNoleggio: body.prezzoNoleggio ? parseFloat(body.prezzoNoleggio) : null,
        attivo: body.attivo !== false,
        // Crea anche i materiali associati se forniti
        materiali: body.materiali ? {
          create: body.materiali.map((m: any) => ({
            materialeId: m.materialeId,
            quantita: m.quantita || 1,
          }))
        } : undefined,
      },
      include: {
        materiali: {
          include: {
            materiale: true
          }
        }
      }
    })
    
    return NextResponse.json(pacchetto, { status: 201 })
  } catch (error) {
    console.error('Errore POST pacchetto:', error)
    return NextResponse.json({ error: 'Errore nella creazione pacchetto' }, { status: 500 })
  }
}
