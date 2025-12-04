// src/app/api/pagamenti/piva/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Dettaglio raggruppamento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const raggruppamento = await prisma.raggruppamentoCompensoPIVA.findUnique({
      where: { id },
      include: {
        artista: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            nomeDarte: true,
            email: true,
            partitaIva: true,
            applicaRitenuta4: true,
            iban: true,
            telefono: true,
          }
        },
        agibilitaCollegate: {
          include: {
            artistaAgibilita: {
              include: {
                agibilita: {
                  include: {
                    locale: { select: { id: true, nome: true, citta: true } },
                    committente: { select: { id: true, ragioneSociale: true } },
                  }
                }
              }
            }
          },
          orderBy: {
            artistaAgibilita: {
              agibilita: { data: 'asc' }
            }
          }
        }
      }
    })
    
    if (!raggruppamento) {
      return NextResponse.json({ error: 'Raggruppamento non trovato' }, { status: 404 })
    }
    
    return NextResponse.json(raggruppamento)
  } catch (error) {
    console.error('Errore GET raggruppamento:', error)
    return NextResponse.json({ error: 'Errore nel recupero' }, { status: 500 })
  }
}

// PATCH - Aggiorna stato raggruppamento
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const raggruppamento = await prisma.raggruppamentoCompensoPIVA.findUnique({
      where: { id },
      include: { artista: true }
    })
    
    if (!raggruppamento) {
      return NextResponse.json({ error: 'Raggruppamento non trovato' }, { status: 404 })
    }
    
    const updateData: any = {}
    
    // Aggiorna campi specifici in base all'azione
    if (body.action === 'INVIA_RICHIESTA') {
      updateData.stato = 'RICHIESTA_INVIATA'
      updateData.dataRichiestaFattura = new Date()
      updateData.emailRichiestaInviata = true
      // TODO: Inviare email effettiva
    }
    
    if (body.action === 'REGISTRA_FATTURA') {
      if (!body.numeroFattura || !body.dataFattura) {
        return NextResponse.json({ 
          error: 'Numero e data fattura sono obbligatori' 
        }, { status: 400 })
      }
      updateData.stato = 'FATTURA_RICEVUTA'
      updateData.numeroFattura = body.numeroFattura
      updateData.dataFattura = new Date(body.dataFattura)
      updateData.pdfFatturaPath = body.pdfFatturaPath || null
      updateData.dataRicezioneFattura = new Date()
    }
    
    if (body.action === 'INVIA_CONSULENTE') {
      if (raggruppamento.stato !== 'FATTURA_RICEVUTA') {
        return NextResponse.json({ 
          error: 'Devi prima registrare la fattura' 
        }, { status: 400 })
      }
      updateData.stato = 'INVIATA_CONSULENTE'
      updateData.dataInvioConsulente = new Date()
      updateData.emailConsulente = body.emailConsulente
      // TODO: Inviare email al consulente con PDF
    }
    
    if (body.action === 'INSERISCI_DISTINTA') {
      updateData.stato = 'IN_DISTINTA'
      updateData.dataInserimentoDistinta = new Date()
    }
    
    if (body.action === 'SEGNA_PAGATO') {
      updateData.stato = 'PAGATA'
      updateData.dataPagamento = body.dataPagamento ? new Date(body.dataPagamento) : new Date()
    }
    
    // Aggiorna note se presenti
    if (body.note !== undefined) {
      updateData.note = body.note
    }
    
    const updated = await prisma.raggruppamentoCompensoPIVA.update({
      where: { id },
      data: updateData,
      include: {
        artista: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            email: true,
          }
        }
      }
    })
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Errore PATCH raggruppamento:', error)
    return NextResponse.json({ error: 'Errore nell\'aggiornamento' }, { status: 500 })
  }
}

// DELETE - Elimina raggruppamento (solo se DA_RICHIEDERE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const raggruppamento = await prisma.raggruppamentoCompensoPIVA.findUnique({
      where: { id }
    })
    
    if (!raggruppamento) {
      return NextResponse.json({ error: 'Raggruppamento non trovato' }, { status: 404 })
    }
    
    if (raggruppamento.stato !== 'DA_RICHIEDERE') {
      return NextResponse.json({ 
        error: 'Non puoi eliminare un raggruppamento già in lavorazione' 
      }, { status: 400 })
    }
    
    // Rimuovi riferimento dalle agibilità
    await prisma.artistaAgibilita.updateMany({
      where: { raggruppamentoPIVAId: id },
      data: { raggruppamentoPIVAId: null }
    })
    
    // Elimina raggruppamento (cascade elimina anche agibilitaCollegate)
    await prisma.raggruppamentoCompensoPIVA.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore DELETE raggruppamento:', error)
    return NextResponse.json({ error: 'Errore nell\'eliminazione' }, { status: 500 })
  }
}
