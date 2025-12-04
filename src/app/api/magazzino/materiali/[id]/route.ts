// src/app/api/magazzino/materiali/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Dettaglio materiale
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const materiale = await prisma.materiale.findUnique({
      where: { id: params.id },
      include: {
        movimenti: {
          orderBy: { data: 'desc' },
          take: 50
        },
        eventiMateriale: {
          include: {
            evento: {
              select: {
                id: true,
                codice: true,
                nome: true,
                dataInizio: true,
                stato: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        pacchetti: {
          include: {
            pacchetto: {
              select: {
                id: true,
                codice: true,
                nome: true,
              }
            }
          }
        },
        _count: {
          select: {
            movimenti: true,
            eventiMateriale: true,
          }
        }
      }
    })
    
    if (!materiale) {
      return NextResponse.json({ error: 'Materiale non trovato' }, { status: 404 })
    }
    
    return NextResponse.json(materiale)
  } catch (error) {
    console.error('Errore GET materiale:', error)
    return NextResponse.json({ error: 'Errore nel recupero materiale' }, { status: 500 })
  }
}

// PUT - Aggiorna materiale
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Verifica esistenza
    const existing = await prisma.materiale.findUnique({
      where: { id: params.id }
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Materiale non trovato' }, { status: 404 })
    }
    
    // Verifica codice duplicato se modificato
    if (body.codice && body.codice !== existing.codice) {
      const duplicate = await prisma.materiale.findFirst({
        where: { 
          codice: body.codice,
          NOT: { id: params.id }
        }
      })
      if (duplicate) {
        return NextResponse.json({ 
          error: 'Codice già esistente' 
        }, { status: 400 })
      }
    }
    
    const materiale = await prisma.materiale.update({
      where: { id: params.id },
      data: {
        codice: body.codice?.toUpperCase(),
        nome: body.nome,
        descrizione: body.descrizione,
        categoria: body.categoria,
        quantitaTotale: body.quantitaTotale ? parseInt(body.quantitaTotale) : undefined,
        quantitaDisponibile: body.quantitaDisponibile ? parseInt(body.quantitaDisponibile) : undefined,
        prezzoAcquisto: body.prezzoAcquisto ? parseFloat(body.prezzoAcquisto) : null,
        prezzoNoleggio: body.prezzoNoleggio ? parseFloat(body.prezzoNoleggio) : null,
        prezzoVendita: body.prezzoVendita ? parseFloat(body.prezzoVendita) : null,
        marca: body.marca,
        modello: body.modello,
        numeroSerie: body.numeroSerie,
        ubicazione: body.ubicazione,
        stato: body.stato,
        dataAcquisto: body.dataAcquisto ? new Date(body.dataAcquisto) : null,
        dataScadenza: body.dataScadenza ? new Date(body.dataScadenza) : null,
        ultimaManutenzione: body.ultimaManutenzione ? new Date(body.ultimaManutenzione) : null,
        prossimaManutenzione: body.prossimaManutenzione ? new Date(body.prossimaManutenzione) : null,
        note: body.note,
        immagine: body.immagine,
        qrCode: body.qrCode,
        attivo: body.attivo,
        consumabile: body.consumabile,
      }
    })
    
    return NextResponse.json(materiale)
  } catch (error) {
    console.error('Errore PUT materiale:', error)
    return NextResponse.json({ error: 'Errore nell\'aggiornamento materiale' }, { status: 500 })
  }
}

// DELETE - Elimina materiale
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.materiale.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            eventiMateriale: true,
            movimenti: true,
          }
        }
      }
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Materiale non trovato' }, { status: 404 })
    }
    
    // Se ha eventi/movimenti associati, disattiva invece di eliminare
    if (existing._count.eventiMateriale > 0 || existing._count.movimenti > 0) {
      await prisma.materiale.update({
        where: { id: params.id },
        data: { attivo: false }
      })
      return NextResponse.json({ 
        success: true, 
        message: 'Materiale disattivato (ha movimenti/eventi associati)' 
      })
    }
    
    await prisma.materiale.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore DELETE materiale:', error)
    return NextResponse.json({ error: 'Errore nell\'eliminazione materiale' }, { status: 500 })
  }
}
