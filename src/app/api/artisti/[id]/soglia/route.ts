// src/app/api/artisti/[id]/soglia/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calcolaAlertSoglia, SOGLIA_PRESTAZIONE_OCCASIONALE } from '@/lib/constants'

// GET - Verifica soglia annuale per artista
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const anno = parseInt(searchParams.get('anno') || new Date().getFullYear().toString())
    
    // Verifica artista
    const artista = await prisma.artista.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        cognome: true,
        nomeDarte: true,
        tipoContratto: true,
      }
    })
    
    if (!artista) {
      return NextResponse.json(
        { error: 'Artista non trovato' },
        { status: 404 }
      )
    }
    
    // Calcola somma compensi lordi dell'anno
    const inizioAnno = new Date(anno, 0, 1)
    const fineAnno = new Date(anno, 11, 31, 23, 59, 59)
    
    const somma = await prisma.agibilita.aggregate({
      where: {
        artistaId: id,
        data: {
          gte: inizioAnno,
          lte: fineAnno
        },
        stato: { not: 'ERRORE' }
      },
      _sum: {
        compensoLordo: true
      },
      _count: {
        id: true
      }
    })
    
    const totale = parseFloat(somma._sum.compensoLordo?.toString() || '0')
    const numeroAgibilita = somma._count.id
    
    // Calcola alert
    const alert = calcolaAlertSoglia(totale)
    
    // Dettaglio agibilità dell'anno
    const agibilita = await prisma.agibilita.findMany({
      where: {
        artistaId: id,
        data: {
          gte: inizioAnno,
          lte: fineAnno
        },
        stato: { not: 'ERRORE' }
      },
      select: {
        id: true,
        codice: true,
        data: true,
        compensoLordo: true,
        locale: {
          select: { nome: true }
        }
      },
      orderBy: { data: 'asc' }
    })
    
    return NextResponse.json({
      artista: {
        id: artista.id,
        nome: `${artista.nome} ${artista.cognome}`,
        nomeDarte: artista.nomeDarte,
        tipoContratto: artista.tipoContratto,
      },
      anno,
      soglia: SOGLIA_PRESTAZIONE_OCCASIONALE,
      totale,
      numeroAgibilita,
      alert,
      residuo: Math.max(0, SOGLIA_PRESTAZIONE_OCCASIONALE - totale),
      agibilita: agibilita.map(a => ({
        ...a,
        compensoLordo: parseFloat(a.compensoLordo.toString()),
      })),
    })
    
  } catch (error) {
    console.error('Errore calcolo soglia:', error)
    return NextResponse.json(
      { error: 'Errore nel calcolo della soglia' },
      { status: 500 }
    )
  }
}
