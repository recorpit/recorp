// src/app/api/locali/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Lista locali
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const tipo = searchParams.get('tipo')
    const citta = searchParams.get('citta')
    
    const where: any = {}
    
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { citta: { contains: search, mode: 'insensitive' } },
        { indirizzo: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (tipo) {
      where.tipoLocale = tipo
    }
    
    if (citta) {
      where.citta = { contains: citta, mode: 'insensitive' }
    }
    
    const locali = await prisma.locale.findMany({
      where,
      orderBy: { nome: 'asc' },
      include: {
        committenteDefault: {
          select: {
            id: true,
            ragioneSociale: true,
            aRischio: true,
          }
        },
        _count: {
          select: { agibilita: true }
        }
      }
    })
    
    return NextResponse.json(locali)
  } catch (error) {
    console.error('Errore GET locali:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei locali' },
      { status: 500 }
    )
  }
}

// POST - Crea locale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const locale = await prisma.locale.create({
      data: {
        nome: body.nome,
        tipoLocale: body.tipoLocale || 'ALTRO',
        indirizzo: body.indirizzo || null,
        cap: body.cap || null,
        citta: body.citta || null,
        provincia: body.provincia || null,
        codiceBelfiore: body.codiceBelfiore || null,
        referenteNome: body.referenteNome || null,
        referenteTelefono: body.referenteTelefono || null,
        referenteEmail: body.referenteEmail || null,
        committenteDefaultId: body.committenteDefaultId || null,
        note: body.note || null,
        noteInterne: body.noteInterne || null,
      },
      include: {
        committenteDefault: true,
      }
    })
    
    return NextResponse.json(locale, { status: 201 })
  } catch (error) {
    console.error('Errore POST locale:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione del locale' },
      { status: 500 }
    )
  }
}
