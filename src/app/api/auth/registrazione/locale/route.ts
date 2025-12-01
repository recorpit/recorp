// src/app/api/auth/registrazione/locale/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, generateTokenWithExpiry, validatePassword, validatePartitaIva } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validazioni campi obbligatori
    const campiObbligatori = [
      'ragioneSociale', 'indirizzoSede', 'cittaSede', 'provinciaSede', 'capSede',
      'nomeReferente', 'cognomeReferente', 'emailReferente', 'telefonoReferente',
      'password'
    ]
    
    for (const campo of campiObbligatori) {
      if (!body[campo]) {
        return NextResponse.json(
          { error: `Campo obbligatorio mancante: ${campo}` },
          { status: 400 }
        )
      }
    }
    
    // Valida password
    const passwordValidation = validatePassword(body.password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password non valida: ' + passwordValidation.errors.join(', ') },
        { status: 400 }
      )
    }
    
    // Valida P.IVA se presente
    if (body.partitaIva && !validatePartitaIva(body.partitaIva)) {
      return NextResponse.json(
        { error: 'Partita IVA non valida' },
        { status: 400 }
      )
    }
    
    // Verifica email non già registrata
    const emailEsistente = await prisma.user.findUnique({
      where: { email: body.emailReferente.toLowerCase() }
    })
    
    if (emailEsistente) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 400 }
      )
    }
    
    // Verifica almeno un locale
    if (!body.locali || body.locali.length === 0) {
      return NextResponse.json(
        { error: 'Inserisci almeno un locale' },
        { status: 400 }
      )
    }
    
    // Verifica locali validi
    for (const locale of body.locali) {
      if (!locale.nome || !locale.citta) {
        return NextResponse.json(
          { error: 'Ogni locale deve avere nome e città' },
          { status: 400 }
        )
      }
    }
    
    // Verifica P.IVA non già registrata (se presente)
    let committenteId: string | null = null
    
    if (body.partitaIva) {
      const pivaEsistente = await prisma.committente.findFirst({
        where: { partitaIva: body.partitaIva }
      })
      
      if (pivaEsistente) {
        // Verifica che non sia già collegato a un utente
        const committenteConUtente = await prisma.user.findFirst({
          where: { committenteId: pivaEsistente.id }
        })
        
        if (committenteConUtente) {
          return NextResponse.json(
            { error: 'Questa P.IVA è già collegata a un account. Contatta l\'assistenza.' },
            { status: 400 }
          )
        }
        
        committenteId = pivaEsistente.id
      }
    }
    
    // Hash password
    const passwordHash = await hashPassword(body.password)
    
    // Token verifica email
    const { token: tokenVerifica, expiresAt: tokenVerificaScade } = generateTokenWithExpiry(48)
    
    // Crea tutto in transazione
    const result = await prisma.$transaction(async (tx) => {
      // Se non esiste committente, crealo
      if (!committenteId) {
        const nuovoCommittente = await tx.committente.create({
          data: {
            ragioneSociale: body.ragioneSociale,
            partitaIva: body.partitaIva || null,
            codiceFiscale: body.codiceFiscaleAzienda || body.partitaIva || null,
            indirizzo: body.indirizzoSede,
            citta: body.cittaSede,
            provincia: body.provinciaSede.toUpperCase(),
            cap: body.capSede,
            email: body.emailReferente.toLowerCase(),
            telefono: body.telefonoReferente,
            nomeReferente: `${body.nomeReferente} ${body.cognomeReferente}`,
          }
        })
        committenteId = nuovoCommittente.id
      }
      
      // Crea locali
      for (const localeData of body.locali) {
        await tx.locale.create({
          data: {
            nome: localeData.nome,
            tipo: localeData.tipo || 'CLUB',
            indirizzo: localeData.indirizzo || null,
            citta: localeData.citta,
            provincia: localeData.provincia?.toUpperCase() || body.provinciaSede.toUpperCase(),
            cap: localeData.cap || null,
            committenteDefaultId: committenteId,
          }
        })
      }
      
      // Crea utente
      const user = await tx.user.create({
        data: {
          email: body.emailReferente.toLowerCase(),
          passwordHash,
          nome: body.nomeReferente,
          cognome: body.cognomeReferente,
          telefono: body.telefonoReferente,
          ruolo: 'COMMITTENTE',
          stato: 'PENDING', // In attesa verifica email, poi IN_APPROVAZIONE
          committenteId,
          privacyAccettata: body.privacyAccettata === true,
          privacyAccettataAt: body.privacyAccettata ? new Date() : null,
          marketingAccettato: body.marketingAccettato === true,
          tokenVerifica,
          tokenVerificaScade,
          tokenInvito: body.token || null,
        }
      })
      
      // Se c'era un invito, segnalo come usato
      if (body.token) {
        await tx.invitoRegistrazione.updateMany({
          where: { token: body.token },
          data: { usato: true, usatoAt: new Date() }
        })
      }
      
      return user
    })
    
    // TODO: Invia email di verifica
    // await sendVerificationEmail(result.email, tokenVerifica)
    
    return NextResponse.json({
      success: true,
      message: 'Registrazione completata. Controlla la tua email per verificare l\'account.',
      userId: result.id,
    }, { status: 201 })
    
  } catch (error) {
    console.error('Errore registrazione locale:', error)
    return NextResponse.json(
      { error: 'Errore nella registrazione' },
      { status: 500 }
    )
  }
}
