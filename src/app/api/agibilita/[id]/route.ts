// src/app/api/agibilita/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calcolaCompensi } from '@/lib/constants'

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
        format: true,
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

// PUT - Aggiorna agibilità completa (con periodi, artisti e supporto estera)
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
    
    // Determina se è estera
    const isEstera = body.estera === true
    
    // Se riceviamo artisti con struttura nuova (array con dataInizio/dataFine per ogni artista)
    if (body.artisti && Array.isArray(body.artisti) && body.artisti.length > 0) {
      
      // Deduplica artisti: stesso artista + stessa dataInizio = duplicato
      const artistiUnici = new Map<string, any>()
      body.artisti.forEach((a: any) => {
        const chiave = `${a.artistaId}|${a.dataInizio}`
        if (!artistiUnici.has(chiave)) {
          artistiUnici.set(chiave, a)
        } else {
          console.log(`[PUT] DUPLICATO RIMOSSO: ${chiave}`)
        }
      })
      const artistiDedupe = Array.from(artistiUnici.values())
      console.log(`[PUT] Artisti dopo dedupe: ${artistiDedupe.length} (erano ${body.artisti.length})`)
      
      // Calcola data minima/massima dagli artisti
      const tutteLeDateInizio = artistiDedupe.map((a: any) => a.dataInizio).filter(Boolean)
      const tutteLeDateFine = artistiDedupe.map((a: any) => a.dataFine || a.dataInizio).filter(Boolean)
      const dataMinima = tutteLeDateInizio.sort()[0]
      const dataMassima = tutteLeDateFine.sort().reverse()[0]
      
      // Verifica artisti esistono
      const artistiIds = Array.from(new Set(artistiDedupe.map((a: any) => a.artistaId))) as string[]
      const artistiDB = await prisma.artista.findMany({
        where: { id: { in: artistiIds } }
      })
      
      if (artistiDB.length !== artistiIds.length) {
        return NextResponse.json({ error: 'Uno o più artisti non trovati' }, { status: 404 })
      }
      
      // Mappa artisti per calcolo compensi
      const artistiMap = new Map(artistiDB.map(a => [a.id, a]))
      
      // Calcola compensi per ogni artista
      let totaleNetti = 0
      let totaleLordi = 0
      let totaleRitenute = 0
      
      const artistiData = artistiDedupe.map((a: any) => {
        const artista = artistiMap.get(a.artistaId)!
        const netto = round2(Number(a.compensoNetto || 0))
        
        // Calcola lordo e ritenuta
        let lordo = netto
        let ritenuta = 0
        
        // Solo se non è P.IVA applica ritenuta
        if (artista.tipoContratto !== 'P_IVA' && !artista.partitaIva) {
          const compensi = calcolaCompensi({ netto }, 0)
          lordo = compensi.lordo
          ritenuta = compensi.ritenuta
        }
        
        totaleNetti += netto
        totaleLordi += lordo
        totaleRitenute += ritenuta
        
        return {
          artistaId: a.artistaId,
          dataInizio: new Date(a.dataInizio),
          dataFine: a.dataFine ? new Date(a.dataFine) : new Date(a.dataInizio),
          qualifica: a.qualifica || artista.qualifica || null,
          compensoNetto: netto,
          compensoLordo: lordo,
          ritenuta: ritenuta,
        }
      })
      
      // Arrotonda totali
      totaleNetti = round2(totaleNetti)
      totaleLordi = round2(totaleLordi)
      totaleRitenute = round2(totaleRitenute)
      
      // Calcola quota agenzia
      const committente = body.committenteId 
        ? await prisma.committente.findUnique({ where: { id: body.committenteId } })
        : esistente.committente
      
      const quotaUnitaria = round2(parseFloat(committente?.quotaAgenzia?.toString() || '0'))
      const quotaAgenzia = round2(quotaUnitaria * artistiDedupe.length)
      const importoFattura = round2(totaleLordi + quotaAgenzia)
      
      // Transazione per aggiornare tutto insieme
      const agibilita = await prisma.$transaction(async (tx) => {
        // 1. Elimina tutti gli artisti esistenti
        await tx.artistaAgibilita.deleteMany({
          where: { agibilitaId: id }
        })
        
        // 2. Crea nuovi artisti con date individuali
        if (artistiData.length > 0) {
          await tx.artistaAgibilita.createMany({
            data: artistiData.map((a: any) => ({
              agibilitaId: id,
              ...a,
            }))
          })
        }
        
        // 3. Aggiorna agibilità
        return await tx.agibilita.update({
          where: { id },
          data: {
            // Locale: null se estera
            localeId: isEstera ? null : (body.localeId !== undefined ? body.localeId : esistente.localeId),
            committenteId: body.committenteId !== undefined ? body.committenteId : esistente.committenteId,
            
            // Date
            data: dataMinima ? new Date(dataMinima) : esistente.data,
            dataFine: dataMassima && dataMassima !== dataMinima ? new Date(dataMassima) : null,
            
            // Campi estera
            estera: isEstera,
            paeseEstero: body.paeseEstero || null,
            codiceBelfioreEstero: body.codiceBelfioreEstero || null,
            luogoEstero: body.luogoEstero || null,
            indirizzoEstero: body.indirizzoEstero || null,
            
            // Totali
            quotaAgenzia: body.quotaAgenzia !== undefined ? round2(Number(body.quotaAgenzia)) : quotaAgenzia,
            totaleCompensiNetti: body.totaleCompensiNetti !== undefined ? round2(Number(body.totaleCompensiNetti)) : totaleNetti,
            totaleCompensiLordi: body.totaleCompensiLordi !== undefined ? round2(Number(body.totaleCompensiLordi)) : totaleLordi,
            totaleRitenute: body.totaleRitenute !== undefined ? round2(Number(body.totaleRitenute)) : totaleRitenute,
            importoFattura: body.importoFattura !== undefined ? round2(Number(body.importoFattura)) : importoFattura,
            
            // Note
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
            format: true,
          },
        })
      })
      
      return NextResponse.json(agibilita)
    }
    
    // Se riceviamo periodi (struttura alternativa)
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
            localeId: isEstera ? null : (body.localeId !== undefined ? body.localeId : esistente.localeId),
            committenteId: body.committenteId !== undefined ? body.committenteId : esistente.committenteId,
            data: new Date(dataMinima),
            dataFine: dataMassima !== dataMinima ? new Date(dataMassima) : null,
            
            // Campi estera
            estera: isEstera,
            paeseEstero: body.paeseEstero || null,
            codiceBelfioreEstero: body.codiceBelfioreEstero || null,
            luogoEstero: body.luogoEstero || null,
            indirizzoEstero: body.indirizzoEstero || null,
            
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
            format: true,
          },
        })
      })
      
      return NextResponse.json(agibilita)
    }
    
    // Fallback: aggiornamento semplice senza artisti
    const agibilita = await prisma.agibilita.update({
      where: { id },
      data: {
        localeId: isEstera ? null : (body.localeId !== undefined ? body.localeId : esistente.localeId),
        committenteId: body.committenteId !== undefined ? body.committenteId : esistente.committenteId,
        data: body.data ? new Date(body.data) : esistente.data,
        dataFine: body.dataFine ? new Date(body.dataFine) : null,
        luogoPrestazione: body.luogoPrestazione || null,
        
        // Campi estera
        estera: isEstera,
        paeseEstero: body.paeseEstero || null,
        codiceBelfioreEstero: body.codiceBelfioreEstero || null,
        luogoEstero: body.luogoEstero || null,
        indirizzoEstero: body.indirizzoEstero || null,
        
        quotaAgenzia: body.quotaAgenzia !== undefined ? round2(Number(body.quotaAgenzia)) : undefined,
        totaleCompensiNetti: body.totaleCompensiNetti !== undefined ? round2(Number(body.totaleCompensiNetti)) : undefined,
        totaleCompensiLordi: body.totaleCompensiLordi !== undefined ? round2(Number(body.totaleCompensiLordi)) : undefined,
        totaleRitenute: body.totaleRitenute !== undefined ? round2(Number(body.totaleRitenute)) : undefined,
        importoFattura: body.importoFattura !== undefined ? round2(Number(body.importoFattura)) : undefined,
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
        format: true,
      },
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