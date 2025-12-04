// src/app/api/produzione/eventi/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Dettaglio evento con tutte le relazioni
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const evento = await prisma.evento.findUnique({
      where: { id: params.id },
      include: {
        committente: true,
        locale: true,
        format: true,
        responsabile: {
          select: { id: true, nome: true, cognome: true, email: true }
        },
        dossier: true,
        preventivi: {
          orderBy: { versione: 'desc' },
          include: {
            voci: {
              orderBy: { ordine: 'asc' }
            }
          }
        },
        vociEconomiche: {
          orderBy: { createdAt: 'asc' }
        },
        assegnazioniStaff: {
          include: {
            staff: {
              select: { 
                id: true, 
                nome: true, 
                cognome: true, 
                telefono: true,
                competenzaAudio: true,
                competenzaLuci: true,
                competenzaVideo: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        assegnazioniArtisti: {
          include: {
            artista: {
              select: { 
                id: true, 
                nome: true, 
                cognome: true, 
                nomeDarte: true,
                cachetBase: true,
              }
            },
            agibilita: {
              select: { id: true, codice: true, stato: true }
            }
          },
          orderBy: { ordineScaletta: 'asc' }
        },
        materialiEvento: {
          include: {
            materiale: true,
            pacchetto: true
          },
          orderBy: { createdAt: 'asc' }
        },
        documentiEvento: {
          orderBy: { tipo: 'asc' }
        }
      }
    })
    
    if (!evento) {
      return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 })
    }
    
    // Calcola margini
    const ricavoEffettivo = evento.vociEconomiche
      .filter(v => v.tipo === 'RICAVO')
      .reduce((sum, v) => sum + (Number(v.importoEffettivo) || Number(v.importoPrevisto) || 0), 0)
    
    const costoEffettivo = evento.vociEconomiche
      .filter(v => v.tipo === 'COSTO')
      .reduce((sum, v) => sum + (Number(v.importoEffettivo) || Number(v.importoPrevisto) || 0), 0)
    
    const margineCalcolato = ricavoEffettivo - costoEffettivo
    
    return NextResponse.json({
      ...evento,
      _calcolati: {
        ricavoEffettivo,
        costoEffettivo,
        margineCalcolato
      }
    })
  } catch (error) {
    console.error('Errore GET evento:', error)
    return NextResponse.json({ error: 'Errore nel recupero evento' }, { status: 500 })
  }
}

// PUT - Aggiorna evento
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Verifica esistenza
    const existing = await prisma.evento.findUnique({
      where: { id: params.id }
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 })
    }
    
    const evento = await prisma.evento.update({
      where: { id: params.id },
      data: {
        nome: body.nome,
        descrizione: body.descrizione,
        tipo: body.tipo,
        stato: body.stato,
        dataInizio: body.dataInizio ? new Date(body.dataInizio) : undefined,
        dataFine: body.dataFine ? new Date(body.dataFine) : null,
        oraCarico: body.oraCarico,
        oraInizioEvento: body.oraInizioEvento,
        oraFineEvento: body.oraFineEvento,
        oraScarico: body.oraScarico,
        committenteId: body.committenteId || null,
        localeId: body.localeId || null,
        formatId: body.formatId || null,
        indirizzoEvento: body.indirizzoEvento,
        cittaEvento: body.cittaEvento,
        provinciaEvento: body.provinciaEvento,
        capienzaPrevista: body.capienzaPrevista ? parseInt(body.capienzaPrevista) : null,
        capienzaEffettiva: body.capienzaEffettiva ? parseInt(body.capienzaEffettiva) : null,
        ricavoPrevisto: body.ricavoPrevisto ? parseFloat(body.ricavoPrevisto) : null,
        ricavoEffettivo: body.ricavoEffettivo ? parseFloat(body.ricavoEffettivo) : null,
        costoPrevisto: body.costoPrevisto ? parseFloat(body.costoPrevisto) : null,
        costoEffettivo: body.costoEffettivo ? parseFloat(body.costoEffettivo) : null,
        marginePrevisto: body.marginePrevisto ? parseFloat(body.marginePrevisto) : null,
        margineEffettivo: body.margineEffettivo ? parseFloat(body.margineEffettivo) : null,
        responsabileId: body.responsabileId || null,
        note: body.note,
        noteInterne: body.noteInterne,
      },
      include: {
        committente: true,
        locale: true,
        format: true,
        responsabile: true,
      }
    })
    
    return NextResponse.json(evento)
  } catch (error) {
    console.error('Errore PUT evento:', error)
    return NextResponse.json({ error: 'Errore nell\'aggiornamento evento' }, { status: 500 })
  }
}

// DELETE - Elimina evento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica esistenza
    const existing = await prisma.evento.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            assegnazioniStaff: true,
            assegnazioniArtisti: true,
          }
        }
      }
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 })
    }
    
    // Verifica se può essere eliminato (solo in stato PREVENTIVO o ANNULLATO)
    if (!['PREVENTIVO', 'ANNULLATO', 'SOSPESO'].includes(existing.stato)) {
      return NextResponse.json({ 
        error: 'Non è possibile eliminare un evento in questo stato. Prima annullalo.' 
      }, { status: 400 })
    }
    
    // Elimina (le relazioni vengono eliminate in cascata)
    await prisma.evento.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore DELETE evento:', error)
    return NextResponse.json({ error: 'Errore nell\'eliminazione evento' }, { status: 500 })
  }
}
