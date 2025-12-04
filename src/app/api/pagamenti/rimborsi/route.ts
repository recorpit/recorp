// src/app/api/pagamenti/rimborsi/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Lista rimborsi spesa
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistaId = searchParams.get('artistaId')
    const anno = searchParams.get('anno') ? parseInt(searchParams.get('anno')!) : undefined
    const mese = searchParams.get('mese') ? parseInt(searchParams.get('mese')!) : undefined
    
    const where: any = {}
    if (artistaId) where.artistaId = artistaId
    
    if (anno && mese) {
      const inizioMese = new Date(anno, mese - 1, 1)
      const fineMese = new Date(anno, mese, 0, 23, 59, 59)
      where.data = { gte: inizioMese, lte: fineMese }
    }
    
    const rimborsi = await prisma.rimborsoSpesa.findMany({
      where,
      include: {
        artista: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            nomeDarte: true,
          }
        },
        agibilita: {
          select: {
            id: true,
            codice: true,
            data: true,
            locale: { select: { nome: true } }
          }
        }
      },
      orderBy: { data: 'desc' }
    })
    
    return NextResponse.json(rimborsi)
  } catch (error) {
    console.error('Errore GET rimborsi:', error)
    return NextResponse.json({ error: 'Errore nel recupero dati' }, { status: 500 })
  }
}

// POST - Crea nuovo rimborso spesa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.artistaId || !body.importo || !body.data) {
      return NextResponse.json({ 
        error: 'artistaId, importo e data sono obbligatori' 
      }, { status: 400 })
    }
    
    const rimborso = await prisma.rimborsoSpesa.create({
      data: {
        artistaId: body.artistaId,
        tipo: body.tipo || 'TRASFERTA_ITALIA',
        descrizione: body.descrizione || null,
        importo: parseFloat(body.importo),
        data: new Date(body.data),
        agibilitaId: body.agibilitaId || null,
        documentoPath: body.documentoPath || null,
        note: body.note || null,
      },
      include: {
        artista: {
          select: {
            id: true,
            nome: true,
            cognome: true,
          }
        }
      }
    })
    
    return NextResponse.json(rimborso, { status: 201 })
  } catch (error) {
    console.error('Errore POST rimborso:', error)
    return NextResponse.json({ error: 'Errore nella creazione' }, { status: 500 })
  }
}
