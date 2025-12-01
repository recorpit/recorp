// src/app/api/auth/registrazione/artista/route.ts
// API Registrazione Artista con hash password

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      // Dati personali
      nome,
      cognome,
      email,
      telefono,
      codiceFiscale,
      dataNascita,
      luogoNascita,
      provinciaNascita,
      
      // Residenza
      indirizzoResidenza,
      cittaResidenza,
      provinciaResidenza,
      capResidenza,
      
      // Professionale
      qualifica,
      nomeDarte,
      
      // Documento
      tipoDocumento,
      numeroDocumento,
      scadenzaDocumento,
      
      // Bancario
      iban,
      
      // Password
      password,
      
      // Privacy
      privacyAccettata,
      marketingAccettato,
      
      // Token invito (opzionale)
      token,
    } = body
    
    // Validazioni base
    if (!nome || !cognome || !email || !password || !codiceFiscale) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti' },
        { status: 400 }
      )
    }
    
    if (!privacyAccettata) {
      return NextResponse.json(
        { error: 'Devi accettare l\'informativa privacy' },
        { status: 400 }
      )
    }
    
    // Validazione password
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 8 caratteri' },
        { status: 400 }
      )
    }
    
    // Verifica email non già registrata
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Esiste già un account con questa email' },
        { status: 400 }
      )
    }
    
    // Verifica CF non già registrato
    const existingArtista = await prisma.artista.findUnique({
      where: { codiceFiscale: codiceFiscale.toUpperCase() },
    })
    
    if (existingArtista) {
      return NextResponse.json(
        { error: 'Esiste già un artista con questo codice fiscale' },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Transazione: crea User e Artista insieme
    const result = await prisma.$transaction(async (tx) => {
      // Crea User
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          nome,
          cognome,
          ruolo: 'ARTISTICO',
          attivo: true,
        },
      })
      
      // Crea Artista collegato
      const artista = await tx.artista.create({
        data: {
          nome,
          cognome,
          nomeDarte: nomeDarte || null,
          codiceFiscale: codiceFiscale.toUpperCase(),
          email: email.toLowerCase(),
          telefono,
          indirizzo: indirizzoResidenza,
          cap: capResidenza,
          citta: cittaResidenza,
          provincia: provinciaResidenza,
          dataNascita: dataNascita ? new Date(dataNascita) : null,
          comuneNascita: luogoNascita,
          provinciaNascita,
          iban: iban?.toUpperCase() || null,
          tipoDocumento: tipoDocumento || null,
          numeroDocumento: numeroDocumento?.toUpperCase() || null,
          scadenzaDocumento: scadenzaDocumento ? new Date(scadenzaDocumento) : null,
          qualifica: qualifica || 'Altro',
          tipoContratto: 'PRESTAZIONE_OCCASIONALE',
          tipoPagamento: 'STANDARD_15GG',
          iscritto: false,
          maggiorenne: true,
          nazionalita: 'IT',
          extraUE: false,
        },
      })
      
      return { user, artista }
    })
    
    // TODO: Inviare email di verifica
    
    return NextResponse.json({
      success: true,
      message: 'Registrazione completata con successo',
      userId: result.user.id,
      artistaId: result.artista.id,
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Errore registrazione artista:', error)
    
    // Gestione errori Prisma
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0]
      if (field === 'email') {
        return NextResponse.json(
          { error: 'Esiste già un account con questa email' },
          { status: 400 }
        )
      }
      if (field === 'codiceFiscale') {
        return NextResponse.json(
          { error: 'Esiste già un artista con questo codice fiscale' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Errore durante la registrazione' },
      { status: 500 }
    )
  }
}
