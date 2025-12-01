// src/app/api/agibilita/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Funzione per arrotondare a 2 decimali
const round2 = (n: number) => Math.round(n * 100) / 100

// GET - Singola agibilità
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const agibilita = await prisma.agibilita.findUnique({
      where: { id },
      include: {
        artisti: {
          include: {
            artista: true,
          }
        },
        locale: true,
        committente: true,
        fattura: true,
      },
    })
    
    if (!agibilita) {
      return NextResponse.json(
        { error: 'Agibilità non trovata' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(agibilita)
  } catch (error) {
    console.error('Errore GET agibilita:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dell\'agibilità' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna agibilità completa (con periodi e artisti)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Verifica esistenza
    const esistente = await prisma.agibilita.findUnique({
      where: { id },
      include: {
        artisti: true,
        committente: true,
      }
    })
    
    if (!esistente) {
      return NextResponse.json(
        { error: 'Agibilità non trovata' },
        { status: 404 }
      )
    }
    
    // Se riceviamo periodi (nuova struttura)
    if (body.periodi && Array.isArray(body.periodi)) {
      // Calcola data minima/massima dai periodi
      const tutteLeDateInizio = body.periodi.map((p: any) => p.dataInizio).filter(Boolean)
      const tutteLeDateFine = body.periodi.map((p: any) => p.dataFine || p.dataInizio).filter(Boolean)
      const dataMinima = tutteLeDateInizio.sort()[0]
      const dataMassima = tutteLeDateFine.sort().reverse()[0]
      
      // Prepara tutti gli artisti da tutti i periodi con arrotondamento
      const tuttiArtisti: any[] = []
      for (const periodo of body.periodi) {
        for (const artista of periodo.artisti) {
          tuttiArtisti.push({
            artistaId: artista.artistaId,
            dataInizio: periodo.dataInizio,
            dataFine: periodo.dataFine || periodo.dataInizio,
            compensoNetto: round2(Number(artista.compensoNetto || 0)),
            compensoLordo: round2(Number(artista.compensoLordo || 0)),
            ritenuta: round2(Number(artista.ritenuta || 0)),
            qualifica: artista.qualifica,
          })
        }
      }
      
      // Verifica artisti esistono
      const artistiIds = Array.from(new Set(tuttiArtisti.map(a => a.artistaId)))
      const artistiDB = await prisma.artista.findMany({
        where: { id: { in: artistiIds } }
      })
      
      if (artistiDB.length !== artistiIds.length) {
        return NextResponse.json({ error: 'Uno o più artisti non trovati' }, { status: 404 })
      }
      
      // Transazione per aggiornare tutto insieme
      const agibilita = await prisma.$transaction(async (tx) => {
        // 1. Elimina tutti gli artisti esistenti
        await tx.artistaAgibilita.deleteMany({
          where: { agibilitaId: id }
        })
        
        // 2. Crea nuovi artisti con date individuali
        if (tuttiArtisti.length > 0) {
          await tx.artistaAgibilita.createMany({
            data: tuttiArtisti.map((a: any) => ({
              agibilitaId: id,
              artistaId: a.artistaId,
              dataInizio: new Date(a.dataInizio),
              dataFine: new Date(a.dataFine),
              qualifica: a.qualifica || null,
              compensoNetto: a.compensoNetto,
              compensoLordo: a.compensoLordo,
              ritenuta: a.ritenuta,
            }))
          })
        }
        
        // 3. Aggiorna agibilità con valori arrotondati
        return await tx.agibilita.update({
          where: { id },
          data: {
            data: new Date(dataMinima),
            dataFine: dataMassima !== dataMinima ? new Date(dataMassima) : null,
            quotaAgenzia: round2(Number(body.quotaAgenzia || 0)),
            totaleCompensiNetti: round2(Number(body.totaleCompensiNetti || 0)),
            totaleCompensiLordi: round2(Number(body.totaleCompensiLordi || 0)),
            totaleRitenute: round2(Number(body.totaleRitenute || 0)),
            importoFattura: round2(Number(body.importoFattura || 0)),
            note: body.note !== undefined ? body.note : esistente.note,
            noteInterne: body.noteInterne !== undefined ? body.noteInterne : esistente.noteInterne,
            updatedAt: new Date(),
          },
          include: {
            artisti: {
              include: {
                artista: true,
              }
            },
            locale: true,
            committente: true,
          },
        })
      })
      
      return NextResponse.json(agibilita)
    }
    
    // Fallback: vecchia struttura (artisti senza periodi)
    const artistiDaCreare = body.artisti?.filter((a: any) => !a.id) || []
    const artistiEsistentiIds = body.artisti?.filter((a: any) => a.id).map((a: any) => a.artistaId) || []
    const artistiDaRimuovere = esistente.artisti.filter(a => !artistiEsistentiIds.includes(a.artistaId))
    
    // Transazione per aggiornare tutto insieme
    const agibilita = await prisma.$transaction(async (tx) => {
      // 1. Rimuovi artisti non più presenti
      if (artistiDaRimuovere.length > 0) {
        await tx.artistaAgibilita.deleteMany({
          where: {
            id: { in: artistiDaRimuovere.map(a => a.id) }
          }
        })
      }
      
      // 2. Aggiorna artisti esistenti con arrotondamento
      for (const artista of body.artisti?.filter((a: any) => a.id) || []) {
        await tx.artistaAgibilita.updateMany({
          where: {
            agibilitaId: id,
            artistaId: artista.artistaId,
          },
          data: {
            qualifica: artista.qualifica,
            compensoNetto: round2(Number(artista.compensoNetto || 0)),
            compensoLordo: round2(Number(artista.compensoLordo || 0)),
            ritenuta: round2(Number(artista.ritenuta || 0)),
          }
        })
      }
      
      // 3. Crea nuovi artisti con arrotondamento
      if (artistiDaCreare.length > 0) {
        await tx.artistaAgibilita.createMany({
          data: artistiDaCreare.map((a: any) => ({
            agibilitaId: id,
            artistaId: a.artistaId,
            qualifica: a.qualifica,
            compensoNetto: round2(Number(a.compensoNetto || 0)),
            compensoLordo: round2(Number(a.compensoLordo || 0)),
            ritenuta: round2(Number(a.ritenuta || 0)),
          }))
        })
      }
      
      // 4. Aggiorna agibilità con arrotondamento
      return await tx.agibilita.update({
        where: { id },
        data: {
          data: body.data ? new Date(body.data) : esistente.data,
          dataFine: body.dataFine ? new Date(body.dataFine) : null,
          luogoPrestazione: body.luogoPrestazione || null,
          quotaAgenzia: round2(Number(body.quotaAgenzia || 0)),
          totaleCompensiNetti: round2(Number(body.totaleCompensiNetti || 0)),
          totaleCompensiLordi: round2(Number(body.totaleCompensiLordi || 0)),
          totaleRitenute: round2(Number(body.totaleRitenute || 0)),
          importoFattura: round2(Number(body.importoFattura || 0)),
          note: body.note !== undefined ? body.note : esistente.note,
          noteInterne: body.noteInterne !== undefined ? body.noteInterne : esistente.noteInterne,
          updatedAt: new Date(),
        },
        include: {
          artisti: {
            include: {
              artista: true,
            }
          },
          locale: true,
          committente: true,
        },
      })
    })
    
    return NextResponse.json(agibilita)
  } catch (error) {
    console.error('Errore PUT agabilita:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento dell\'agibilità' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina agibilità
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const agibilita = await prisma.agibilita.findUnique({
      where: { id }
    })
    
    if (!agibilita) {
      return NextResponse.json(
        { error: 'Agibilità non trovata' },
        { status: 404 }
      )
    }
    
    // Verifica che non sia già fatturata
    if (agibilita.statoFattura === 'FATTURATA') {
      return NextResponse.json(
        { error: 'Non è possibile eliminare un\'agibilità già fatturata' },
        { status: 400 }
      )
    }
    
    // Elimina in cascata (ArtistaAgibilita viene eliminato automaticamente)
    await prisma.agibilita.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore DELETE agibilita:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione dell\'agibilità' },
      { status: 500 }
    )
  }
}