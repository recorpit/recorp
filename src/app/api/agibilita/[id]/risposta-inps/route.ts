// src/app/api/agibilita/[id]/risposta-inps/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parseStringPromise } from 'xml2js'

// POST - Carica e processa risposta XML INPS
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'File XML mancante' },
        { status: 400 }
      )
    }
    
    // Leggi contenuto XML
    const xmlContent = await file.text()
    
    // Parsa XML
    const result = await parseStringPromise(xmlContent, { 
      explicitArray: false,
      mergeAttrs: true 
    })
    
    if (!result.ImportAgibilita) {
      return NextResponse.json(
        { error: 'Formato XML non valido' },
        { status: 400 }
      )
    }
    
    const agibilitaXML = result.ImportAgibilita.ElencoAgibilita?.Agibilita
    
    if (!agibilitaXML) {
      return NextResponse.json(
        { error: 'Nessuna agibilità trovata nel file' },
        { status: 400 }
      )
    }
    
    // Estrai dati risposta INPS
    const esito = agibilitaXML.Esito || 'ERRORE'
    const erroreINPS = agibilitaXML.Errore || null
    const identificativoINPS = agibilitaXML.IdentificativoAgibilita 
      ? parseInt(agibilitaXML.IdentificativoAgibilita) 
      : null
    
    const occupazione = agibilitaXML.Occupazioni?.Occupazione
    const identificativoOccupazioneINPS = occupazione?.IdentificativoOccupazione
      ? parseInt(occupazione.IdentificativoOccupazione)
      : null
    
    const periodo = occupazione?.Periodi?.Periodo
    const identificativoPeriodoINPS = periodo?.IdentificativoPeriodo
      ? parseInt(periodo.IdentificativoPeriodo)
      : null
    
    const hashINPS = result.ImportAgibilita.Segnatura?.Hash || null
    
    // Aggiorna agibilità
    await prisma.agibilita.update({
      where: { id },
      data: {
        esitoINPS: esito,
        erroreINPS,
        identificativoINPS,
        identificativoOccupazioneINPS,
        identificativoPeriodoINPS,
        hashINPS,
        rispostaINPSAt: new Date(),
        stato: esito === 'OK' ? 'INVIATA_INPS' : 'ERRORE',
      }
    })
    
    // Aggiorna lavoratori (artisti)
    const lavoratori = Array.isArray(occupazione?.Lavoratori?.Lavoratore)
      ? occupazione.Lavoratori.Lavoratore
      : occupazione?.Lavoratori?.Lavoratore 
        ? [occupazione.Lavoratori.Lavoratore]
        : []
    
    // Recupera agibilità con artisti
    const agibilita = await prisma.agibilita.findUnique({
      where: { id },
      include: {
        artisti: {
          include: {
            artista: true
          }
        }
      }
    })
    
    if (!agibilita) {
      return NextResponse.json(
        { error: 'Agibilità non trovata dopo aggiornamento' },
        { status: 404 }
      )
    }
    
    // Mappa lavoratori INPS agli artisti
    for (const lavoratore of lavoratori) {
      const cf = lavoratore.CodiceFiscale
      const identificativoLavoratoreINPS = lavoratore.IdentificativoLavoratore
        ? parseInt(lavoratore.IdentificativoLavoratore)
        : null
      const matricolaEnpals = lavoratore.MatricolaEnpals || null
      
      // Trova artista corrispondente
      const artistaAgibilita = agibilita.artisti.find(
        (aa: any) => aa.artista.codiceFiscale === cf
      )
      
      if (artistaAgibilita) {
        // Aggiorna ArtistaAgibilita
        await prisma.artistaAgibilita.update({
          where: { id: artistaAgibilita.id },
          data: {
            identificativoLavoratoreINPS
          }
        })
        
        // Aggiorna matricola artista se presente e non già salvata
        if (matricolaEnpals && !artistaAgibilita.artista.matricolaEnpals) {
          await prisma.artista.update({
            where: { id: artistaAgibilita.artistaId },
            data: {
              matricolaEnpals
            }
          })
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      esito,
      identificativoINPS,
      hashINPS,
      erroreINPS,
      lavoratoriAggiornati: lavoratori.length
    })
    
  } catch (error) {
    console.error('Errore parsing risposta INPS:', error)
    return NextResponse.json(
      { error: 'Errore nel processamento della risposta INPS', dettagli: String(error) },
      { status: 500 }
    )
  }
}
