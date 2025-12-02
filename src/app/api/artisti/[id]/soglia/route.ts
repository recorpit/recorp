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
    
    // Calcola somma compensi lordi dell'anno tramite ArtistaAgibilita
    const inizioAnno = new Date(anno, 0, 1)
    const fineAnno = new Date(anno, 11, 31, 23, 59, 59)
    
    const somma = await prisma.artistaAgibilita.aggregate({
      where: {
        artistaId: id,
        agibilita: {
          data: {
            gte: inizioAnno,
            lte: fineAnno
          },
          stato: { not: 'ERRORE' }
        }
      },
      _sum: {
        compensoLordo: true
      },
      _count: {
        id: true
      }
    })
    
    const totale = parseFloat(somma._sum?.compensoLordo?.toString() || '0')
    const numeroAgibilita = somma._count?.id || 0
    
    // Calcola alert
    const alert = calcolaAlertSoglia(totale)
    
    // Dettaglio agibilità dell'anno
    const artistaAgibilita = await prisma.artistaAgibilita.findMany({
      where: {
        artistaId: id,
        agibilita: {
          data: {
            gte: inizioAnno,
            lte: fineAnno
          },
          stato: { not: 'ERRORE' }
        }
      },
      select: {
        id: true,
        compensoLordo: true,
        agibilita: {
          select: {
            id: true,
            codice: true,
            data: true,
            locale: {
              select: { nome: true }
            }
          }
        }
      },
      orderBy: { agibilita: { data: 'asc' } }
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
      agibilita: artistaAgibilita.map(aa => ({
        id: aa.agibilita.id,
        codice: aa.agibilita.codice,
        data: aa.agibilita.data,
        compensoLordo: parseFloat(aa.compensoLordo.toString()),
        locale: aa.agibilita.locale,
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