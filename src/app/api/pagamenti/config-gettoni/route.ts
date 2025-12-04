// src/app/api/pagamenti/config-gettoni/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Lista configurazioni gettoni full time
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistaId = searchParams.get('artistaId')
    
    if (artistaId) {
      // Singola configurazione
      const config = await prisma.configGettoneFullTime.findUnique({
        where: { artistaId },
        include: {
          artista: {
            select: {
              id: true,
              nome: true,
              cognome: true,
              nomeDarte: true,
              tipoContratto: true,
            }
          }
        }
      })
      return NextResponse.json(config)
    }
    
    // Tutte le configurazioni
    const configs = await prisma.configGettoneFullTime.findMany({
      include: {
        artista: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            nomeDarte: true,
            tipoContratto: true,
            attivo: true,
          }
        }
      },
      orderBy: {
        artista: { cognome: 'asc' }
      }
    })
    
    return NextResponse.json(configs)
  } catch (error) {
    console.error('Errore GET config gettoni:', error)
    return NextResponse.json({ error: 'Errore nel recupero dati' }, { status: 500 })
  }
}

// POST - Crea/aggiorna configurazione gettoni
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.artistaId) {
      return NextResponse.json({ error: 'artistaId è obbligatorio' }, { status: 400 })
    }
    
    // Verifica che l'artista sia FULL_TIME
    const artista = await prisma.artista.findUnique({
      where: { id: body.artistaId }
    })
    
    if (!artista) {
      return NextResponse.json({ error: 'Artista non trovato' }, { status: 404 })
    }
    
    if (artista.tipoContratto !== 'FULL_TIME') {
      return NextResponse.json({ 
        error: 'La configurazione gettoni è solo per artisti FULL_TIME' 
      }, { status: 400 })
    }
    
    const config = await prisma.configGettoneFullTime.upsert({
      where: { artistaId: body.artistaId },
      update: {
        gettoneBase: body.gettoneBase ? parseFloat(body.gettoneBase) : 50,
        gettoniPerTipoEvento: body.gettoniPerTipoEvento || null,
        gettoniPerTipoLocale: body.gettoniPerTipoLocale || null,
        stipendioFissoMensile: body.stipendioFissoMensile ? parseFloat(body.stipendioFissoMensile) : 0,
        attivo: body.attivo !== false,
        note: body.note || null,
      },
      create: {
        artistaId: body.artistaId,
        gettoneBase: body.gettoneBase ? parseFloat(body.gettoneBase) : 50,
        gettoniPerTipoEvento: body.gettoniPerTipoEvento || null,
        gettoniPerTipoLocale: body.gettoniPerTipoLocale || null,
        stipendioFissoMensile: body.stipendioFissoMensile ? parseFloat(body.stipendioFissoMensile) : 0,
        attivo: body.attivo !== false,
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
    
    return NextResponse.json(config)
  } catch (error) {
    console.error('Errore POST config gettoni:', error)
    return NextResponse.json({ error: 'Errore nel salvataggio' }, { status: 500 })
  }
}
