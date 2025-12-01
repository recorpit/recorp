// src/app/api/format/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Singolo format
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    const format = await prisma.format.findUnique({
      where: { id },
      include: {
        committenti: {
          include: {
            committente: true
          },
          orderBy: { ordine: 'asc' }
        },
        utentiAbilitati: {
          include: {
            user: {
              select: {
                id: true,
                nome: true,
                cognome: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: { agibilita: true }
        }
      }
    })
    
    if (!format) {
      return NextResponse.json(
        { error: 'Format non trovato' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(format)
  } catch (error) {
    console.error('Errore GET format:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero del format' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna format
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Verifica esistenza
    const esistente = await prisma.format.findUnique({
      where: { id }
    })
    
    if (!esistente) {
      return NextResponse.json(
        { error: 'Format non trovato' },
        { status: 404 }
      )
    }
    
    // Se cambia nome, verifica univocità
    if (body.nome && body.nome !== esistente.nome) {
      const altroConNome = await prisma.format.findUnique({
        where: { nome: body.nome }
      })
      if (altroConNome) {
        return NextResponse.json(
          { error: 'Esiste già un format con questo nome' },
          { status: 400 }
        )
      }
    }
    
    // Aggiorna in transazione
    const format = await prisma.$transaction(async (tx) => {
      // Elimina committenti esistenti se ne arrivano di nuovi
      if (body.committentiIds !== undefined) {
        await tx.formatCommittente.deleteMany({
          where: { formatId: id }
        })
        
        // Ricrea committenti
        if (body.committentiIds.length > 0) {
          await tx.formatCommittente.createMany({
            data: body.committentiIds.map((committenteId: string, index: number) => ({
              formatId: id,
              committenteId,
              ordine: index,
            }))
          })
        }
      }
      
      // Aggiorna format
      return await tx.format.update({
        where: { id },
        data: {
          nome: body.nome !== undefined ? body.nome : esistente.nome,
          descrizione: body.descrizione !== undefined ? body.descrizione : esistente.descrizione,
          tipoFatturazione: body.tipoFatturazione !== undefined ? body.tipoFatturazione : esistente.tipoFatturazione,
          attivo: body.attivo !== undefined ? body.attivo : esistente.attivo,
        },
        include: {
          committenti: {
            include: {
              committente: true
            },
            orderBy: { ordine: 'asc' }
          },
          utentiAbilitati: {
            include: {
              user: {
                select: {
                  id: true,
                  nome: true,
                  cognome: true,
                  email: true,
                }
              }
            }
          }
        }
      })
    })
    
    return NextResponse.json(format)
  } catch (error) {
    console.error('Errore PUT format:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del format' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina format
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Verifica esistenza e agibilità collegate
    const format = await prisma.format.findUnique({
      where: { id },
      include: {
        _count: {
          select: { agibilita: true }
        }
      }
    })
    
    if (!format) {
      return NextResponse.json(
        { error: 'Format non trovato' },
        { status: 404 }
      )
    }
    
    if (format._count.agibilita > 0) {
      return NextResponse.json(
        { error: `Non è possibile eliminare: ${format._count.agibilita} agibilità collegate` },
        { status: 400 }
      )
    }
    
    // Elimina (cascade elimina relazioni)
    await prisma.format.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore DELETE format:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del format' },
      { status: 500 }
    )
  }
}
