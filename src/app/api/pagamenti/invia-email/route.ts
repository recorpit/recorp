// src/app/api/pagamenti/invia-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, templateEmailFirma, templateEmailSollecito } from '@/lib/email'

// POST - Invia email per firma prestazione
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prestazioneId, tipo } = body // tipo: 'firma' | 'sollecito'
    
    if (!prestazioneId) {
      return NextResponse.json(
        { error: 'ID prestazione obbligatorio' },
        { status: 400 }
      )
    }
    
    // Recupera prestazione
    const prestazione = await prisma.prestazioneOccasionale.findUnique({
      where: { id: prestazioneId },
      include: {
        artista: true,
      }
    })
    
    if (!prestazione) {
      return NextResponse.json(
        { error: 'Prestazione non trovata' },
        { status: 404 }
      )
    }
    
    // Verifica email artista
    if (!prestazione.artista.email) {
      return NextResponse.json(
        { error: 'Email artista mancante' },
        { status: 400 }
      )
    }
    
    // Verifica stato
    if (!['GENERATA', 'SOLLECITATA'].includes(prestazione.stato)) {
      return NextResponse.json(
        { error: `Impossibile inviare email: stato ${prestazione.stato}` },
        { status: 400 }
      )
    }
    
    // Verifica token
    if (!prestazione.tokenFirma) {
      return NextResponse.json(
        { error: 'Token firma mancante' },
        { status: 400 }
      )
    }
    
    // Costruisci link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000'
    const linkFirma = `${baseUrl}/firma/${prestazione.tokenFirma}`
    
    // Scadenza link formattata
    const scadenzaLink = prestazione.tokenScadenza 
      ? new Date(prestazione.tokenScadenza).toLocaleDateString('it-IT', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Non specificata'
    
    // Prepara dati prestazioni
    const agibilitaIncluse = prestazione.agibilitaIncluse as any[] || []
    const prestazioniDettaglio = agibilitaIncluse.map((ag: any) => ({
      locale: ag.locale || 'N/D',
      data: ag.data ? new Date(ag.data).toLocaleDateString('it-IT') : 'N/D'
    }))
    
    // Genera template
    let emailData
    
    if (tipo === 'sollecito') {
      emailData = templateEmailSollecito({
        nomeArtista: prestazione.artista.nome || '',
        codice: prestazione.codice || '',
        linkFirma,
        scadenzaLink,
      })
    } else {
      emailData = templateEmailFirma({
        nomeArtista: prestazione.artista.nome || '',
        cognomeArtista: prestazione.artista.cognome || '',
        codice: prestazione.codice || '',
        importoNetto: parseFloat(prestazione.compensoNetto as any).toFixed(2),
        linkFirma,
        scadenzaLink,
        prestazioni: prestazioniDettaglio,
      })
    }
    
    // Invia email
    const success = await sendEmail({
      to: prestazione.artista.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    })
    
    if (!success) {
      return NextResponse.json(
        { error: 'Errore nell\'invio email. Verifica configurazione SMTP.' },
        { status: 500 }
      )
    }
    
    // Aggiorna stato e data invio
    const updateData: any = {
      dataInvioLink: new Date(),
    }
    
    if (tipo === 'sollecito') {
      updateData.stato = 'SOLLECITATA'
      updateData.dataSollecito = new Date()
    }
    
    await prisma.prestazioneOccasionale.update({
      where: { id: prestazioneId },
      data: updateData,
    })
    
    return NextResponse.json({
      success: true,
      message: `Email inviata a ${prestazione.artista.email}`,
      tipo: tipo || 'firma',
    })
    
  } catch (error) {
    console.error('Errore invio email:', error)
    return NextResponse.json(
      { error: 'Errore nell\'invio email', dettagli: String(error) },
      { status: 500 }
    )
  }
}

// POST /api/pagamenti/invia-email/batch - Invia email a tutti in attesa firma
export async function PUT(request: NextRequest) {
  try {
    // Trova tutte le prestazioni in stato GENERATA senza email inviata
    const prestazioni = await prisma.prestazioneOccasionale.findMany({
      where: {
        stato: 'GENERATA',
        dataInvioLink: null,
      },
      include: {
        artista: true,
      }
    })
    
    if (prestazioni.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nessuna email da inviare',
        inviate: 0,
      })
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    let inviate = 0
    let errori = 0
    const dettagli: string[] = []
    
    for (const prestazione of prestazioni) {
      if (!prestazione.artista.email || !prestazione.tokenFirma) {
        errori++
        dettagli.push(`${prestazione.artista.cognome}: email o token mancante`)
        continue
      }
      
      const linkFirma = `${baseUrl}/firma/${prestazione.tokenFirma}`
      const scadenzaLink = prestazione.tokenScadenza 
        ? new Date(prestazione.tokenScadenza).toLocaleDateString('it-IT')
        : 'Non specificata'
      
      const agibilitaIncluse = prestazione.agibilitaIncluse as any[] || []
      
      const emailData = templateEmailFirma({
        nomeArtista: prestazione.artista.nome || '',
        cognomeArtista: prestazione.artista.cognome || '',
        codice: prestazione.codice || '',
        importoNetto: parseFloat(prestazione.compensoNetto as any).toFixed(2),
        linkFirma,
        scadenzaLink,
        prestazioni: agibilitaIncluse.map((ag: any) => ({
          locale: ag.locale || 'N/D',
          data: ag.data ? new Date(ag.data).toLocaleDateString('it-IT') : 'N/D'
        })),
      })
      
      const success = await sendEmail({
        to: prestazione.artista.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      })
      
      if (success) {
        await prisma.prestazioneOccasionale.update({
          where: { id: prestazione.id },
          data: { dataInvioLink: new Date() },
        })
        inviate++
        dettagli.push(`✅ ${prestazione.artista.cognome} ${prestazione.artista.nome}`)
      } else {
        errori++
        dettagli.push(`❌ ${prestazione.artista.cognome}: errore invio`)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Inviate ${inviate} email, ${errori} errori`,
      inviate,
      errori,
      dettagli,
    })
    
  } catch (error) {
    console.error('Errore invio batch email:', error)
    return NextResponse.json(
      { error: 'Errore nell\'invio email batch' },
      { status: 500 }
    )
  }
}
