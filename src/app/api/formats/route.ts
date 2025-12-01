// src/app/api/formats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Lista formats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const attivo = searchParams.get('attivo')
    
    const where: any = {}
    
    // Default: solo attivi
    if (attivo === 'false') {
      where.attivo = false
    } else if (attivo === 'all') {
      // Tutti
    } else {
      where.attivo = true
    }
    
    const formats = await prisma.format.findMany({
      where,
      orderBy: { nome: 'asc' },
      include: {
        committenti: {
          include: {
            committente: {
              select: {
                id: true,
                ragioneSociale: true,
                partitaIva: true,
                quotaAgenzia: true,
              }
            }
          },
          orderBy: { ordine: 'asc' }
        },
        _count: {
          select: {
            agibilita: true,
            utentiAbilitati: true,
          }
        }
      }
    })
    
    return NextResponse.json(formats)
  } catch (error) {
    console.error('Errore GET formats:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei formats' },
      { status: 500 }
    )
  }
}

// POST - Crea nuovo format
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.nome?.trim()) {
      return NextResponse.json(
        { error: 'Nome obbligatorio' },
        { status: 400 }
      )
    }
    
    // Verifica nome univoco
    const esistente = await prisma.format.findUnique({
      where: { nome: body.nome.trim() }
    })
    
    if (esistente) {
      return NextResponse.json(
        { error: 'Esiste già un format con questo nome' },
        { status: 400 }
      )
    }
    
    const format = await prisma.format.create({
      data: {
        nome: body.nome.trim(),
        descrizione: body.descrizione || null,
        tipoFatturazione: body.tipoFatturazione || 'COMMITTENTE',
        attivo: body.attivo !== false,
      },
      include: {
        committenti: {
          include: {
            committente: true
          }
        }
      }
    })
    
    return NextResponse.json(format, { status: 201 })
  } catch (error) {
    console.error('Errore POST format:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione del format' },
      { status: 500 }
    )
  }
}