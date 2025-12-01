import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generaXMLINPS } from '@/lib/inps-xml'

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
    
    // Verifica dati necessari
    if (!agibilita.artista.dataNascita || !agibilita.artista.comuneNascita) {
      return NextResponse.json({ 
        error: 'Dati artista incompleti: data e comune di nascita obbligatori' 
      }, { status: 400 })
    }
    
    const xml = generaXMLINPS({
      artista: {
        codiceFiscale: agibilita.artista.codiceFiscale,
        cognome: agibilita.artista.cognome,
        nome: agibilita.artista.nome,
        dataNascita: agibilita.artista.dataNascita,
        comuneNascita: agibilita.artista.comuneNascita
      },
      evento: {
        data: agibilita.evento.data,
        luogo: agibilita.evento.locale.indirizzoEvento || agibilita.evento.locale.nome,
        tipoAttivita: agibilita.tipoAttivita || '001',
        compenso: Number(agibilita.compensoLordo)
      }
    })
    
    // Aggiorna stato agibilità
    await prisma.agibilita.update({
      where: { id: body.agibilitaId },
      data: {
        stato: 'PRONTA_INVIO',
        xmlGeneratoAt: new Date()
      }
    })
    
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="agibilita_${agibilita.id}.xml"`
      }
    })
  } catch (error) {
    console.error('Errore generazione XML:', error)
    return NextResponse.json({ error: 'Errore nella generazione XML' }, { status: 500 })
  }
}