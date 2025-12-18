// src/app/api/agibilita/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.agibilitaId) {
      return NextResponse.json({ error: 'ID agibilità obbligatorio' }, { status: 400 })
    }
    
    const agibilita = await prisma.agibilita.findUnique({
      where: { id: body.agibilitaId },
      include: {
        locale: true,
        committente: true,
        artisti: {
          include: {
            artista: true
          }
        }
      }
    })
    
    if (!agibilita) {
      return NextResponse.json({ error: 'Agibilità non trovata' }, { status: 404 })
    }

    if (!agibilita.locale) {
      return NextResponse.json({ error: 'Agibilità senza locale associato' }, { status: 400 })
    }

    // Per ora restituiamo i dati JSON
    // TODO: Implementare generazione PDF con @react-pdf/renderer
    const pdfData = {
      agibilita: {
        id: agibilita.id,
        codice: agibilita.codice,
        data: agibilita.data,
        stato: agibilita.stato,
      },
      locale: {
        nome: agibilita.locale.nome,
        citta: agibilita.locale.citta,
        indirizzo: agibilita.locale.indirizzo,
      },
      committente: agibilita.committente ? {
        ragioneSociale: agibilita.committente.ragioneSociale,
        partitaIva: agibilita.committente.partitaIva,
      } : null,
      artisti: agibilita.artisti.map(aa => ({
        nome: aa.artista.nome,
        cognome: aa.artista.cognome,
        codiceFiscale: aa.artista.codiceFiscale,
        compensoLordo: aa.compensoLordo,
        compensoNetto: aa.compensoNetto,
        ritenuta: aa.ritenuta,
      })),
      totali: {
        lordo: agibilita.totaleCompensiLordi,
        netto: agibilita.totaleCompensiNetti,
        ritenute: agibilita.totaleRitenute,
      }
    }
    
    return NextResponse.json(pdfData)
  } catch (error) {
    console.error('Errore generazione PDF:', error)
    return NextResponse.json({ error: 'Errore nella generazione PDF' }, { status: 500 })
  }
}