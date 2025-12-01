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
        evento: { include: { locale: true } },
        artista: true
      }
    })
    
    if (!agibilita) {
      return NextResponse.json({ error: 'Agibilità non trovata' }, { status: 404 })
    }
    
    // Per ora restituiamo i dati JSON
    // TODO: Implementare generazione PDF con @react-pdf/renderer
    const pdfData = {
      artista: {
        nome: agibilita.artista.nome,
        cognome: agibilita.artista.cognome,
        codiceFiscale: agibilita.artista.codiceFiscale
      },
      evento: {
        nome: agibilita.evento.nome,
        data: agibilita.evento.data,
        locale: agibilita.evento.locale.nome
      },
      compenso: {
        lordo: agibilita.compensoLordo,
        netto: agibilita.compensoNetto,
        contributi: agibilita.contributiINPS
      }
    }
    
    return NextResponse.json(pdfData)
  } catch (error) {
    console.error('Errore generazione PDF:', error)
    return NextResponse.json({ error: 'Errore nella generazione PDF' }, { status: 500 })
  }
}