// src/app/api/pagamenti/fulltime/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Dettaglio calcolo mensile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const calcolo = await prisma.calcoloMensileFullTime.findUnique({
      where: { id },
      include: {
        artista: {
          include: {
            configGettone: true,
          }
        },
        dettagliPresenze: {
          include: {
            artistaAgibilita: {
              include: {
                agibilita: {
                  include: {
                    locale: { select: { id: true, nome: true, citta: true } },
                    committente: { select: { id: true, ragioneSociale: true } },
                    format: { select: { id: true, nome: true } },
                  }
                }
              }
            }
          },
          orderBy: { dataAgibilita: 'asc' }
        },
        rimborsiSpesa: {
          orderBy: { data: 'asc' }
        }
      }
    })
    
    if (!calcolo) {
      return NextResponse.json({ error: 'Calcolo non trovato' }, { status: 404 })
    }
    
    return NextResponse.json(calcolo)
  } catch (error) {
    console.error('Errore GET calcolo:', error)
    return NextResponse.json({ error: 'Errore nel recupero' }, { status: 500 })
  }
}

// PATCH - Aggiorna calcolo mensile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const calcolo = await prisma.calcoloMensileFullTime.findUnique({
      where: { id }
    })
    
    if (!calcolo) {
      return NextResponse.json({ error: 'Calcolo non trovato' }, { status: 404 })
    }
    
    const updateData: any = {}
    
    // Azioni specifiche
    if (body.action === 'INVIA_CONSULENTE') {
      updateData.stato = 'INVIATA_CONSULENTE'
      updateData.dataInvioConsulente = new Date()
      // TODO: Inviare email al consulente con riepilogo
    }
    
    if (body.action === 'CARICA_BUSTA_PAGA') {
      if (!body.pdfBustaPagaPath) {
        return NextResponse.json({ error: 'PDF busta paga obbligatorio' }, { status: 400 })
      }
      updateData.stato = 'RICEVUTA'
      updateData.pdfBustaPagaPath = body.pdfBustaPagaPath
      updateData.dataRicezioneBustaPaga = new Date()
      
      if (body.costoLordoAzienda) {
        updateData.costoLordoAzienda = parseFloat(body.costoLordoAzienda)
      }
      if (body.costiAccessori) {
        updateData.costiAccessori = parseFloat(body.costiAccessori)
      }
    }
    
    if (body.action === 'SEGNA_PAGATO') {
      updateData.stato = 'PAGATA'
      updateData.dataPagamento = body.dataPagamento ? new Date(body.dataPagamento) : new Date()
    }
    
    // Aggiornamenti diretti
    if (body.costoLordoAzienda !== undefined) {
      updateData.costoLordoAzienda = body.costoLordoAzienda ? parseFloat(body.costoLordoAzienda) : null
    }
    if (body.costiAccessori !== undefined) {
      updateData.costiAccessori = body.costiAccessori ? parseFloat(body.costiAccessori) : null
    }
    if (body.note !== undefined) {
      updateData.note = body.note
    }
    
    const updated = await prisma.calcoloMensileFullTime.update({
      where: { id },
      data: updateData,
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
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Errore PATCH calcolo:', error)
    return NextResponse.json({ error: 'Errore nell\'aggiornamento' }, { status: 500 })
  }
}
