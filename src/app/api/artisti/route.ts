// src/app/api/artisti/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Lista artisti
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const iscritto = searchParams.get('iscritto')
    const qualifica = searchParams.get('qualifica')
    
    const where: any = {}
    
    if (search) {
      // Divido la ricerca in parole per supportare "nome cognome" o "cognome nome"
      const parole = search.trim().split(/\s+/).filter(p => p.length > 0)
      
      if (parole.length === 1) {
        // Ricerca singola parola
        where.OR = [
          { nome: { contains: parole[0], mode: 'insensitive' } },
          { cognome: { contains: parole[0], mode: 'insensitive' } },
          { nomeDarte: { contains: parole[0], mode: 'insensitive' } },
          { codiceFiscale: { contains: parole[0], mode: 'insensitive' } },
        ]
      } else {
        // Ricerca multi-parola: ogni parola deve matchare in almeno un campo
        where.AND = parole.map(parola => ({
          OR: [
            { nome: { contains: parola, mode: 'insensitive' } },
            { cognome: { contains: parola, mode: 'insensitive' } },
            { nomeDarte: { contains: parola, mode: 'insensitive' } },
          ]
        }))
      }
    }
    
    if (iscritto !== null && iscritto !== undefined) {
      where.iscritto = iscritto === 'true'
    }
    
    if (qualifica) {
      where.codiceQualificaINPS = qualifica
    }
    
    const artisti = await prisma.artista.findMany({
      where,
      orderBy: [
        { cognome: 'asc' },
        { nome: 'asc' },
      ],
      include: {
        _count: {
          select: { agibilita: true }
        }
      }
    })
    
    return NextResponse.json(artisti)
  } catch (error) {
    console.error('Errore GET artisti:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero degli artisti' },
      { status: 500 }
    )
  }
}

// Genera codice commercialista univoco
async function generaCodiceCommercialista(): Promise<string> {
  // Trova il massimo codice esistente
  const ultimoArtista = await prisma.artista.findFirst({
    where: {
      codiceCommercialista: { not: null }
    },
    orderBy: { codiceCommercialista: 'desc' },
    select: { codiceCommercialista: true }
  })
  
  let prossimoNumero = 10001 // Parte da 10001
  
  if (ultimoArtista?.codiceCommercialista) {
    // Estrai il numero dal codice (potrebbe essere "10001", "10002", "1000100000", etc.)
    const codice = ultimoArtista.codiceCommercialista
    // Prova a parsare come numero intero
    const parsed = parseInt(codice, 10)
    if (!isNaN(parsed) && parsed >= 10001) {
      prossimoNumero = parsed + 1
    }
  }
  
  // Verifica che non esista già (safety check)
  let tentativo = 0
  let codiceFinal = prossimoNumero.toString()
  
  while (tentativo < 100) {
    const esiste = await prisma.artista.findFirst({
      where: { codiceCommercialista: codiceFinal }
    })
    
    if (!esiste) {
      return codiceFinal
    }
    
    prossimoNumero++
    codiceFinal = prossimoNumero.toString()
    tentativo++
  }
  
  // Fallback: usa timestamp
  return `CC${Date.now()}`
}

// POST - Crea artista
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verifica CF unico (se presente)
    if (body.codiceFiscale && body.codiceFiscale.trim()) {
      const cfUppercase = body.codiceFiscale.toUpperCase().trim()
      const esistente = await prisma.artista.findFirst({
        where: { codiceFiscale: cfUppercase }
      })
      if (esistente) {
        return NextResponse.json(
          { error: `Codice fiscale ${cfUppercase} già registrato per ${esistente.cognome} ${esistente.nome}` },
          { status: 400 }
        )
      }
    }
    
    // Determina se è P.IVA
    const haPartitaIva = !!(body.partitaIva && body.partitaIva.trim())
    const tipoContrattoIsPIVA = body.tipoContratto === 'P_IVA'
    const isPIVA = haPartitaIva || tipoContrattoIsPIVA
    
    // Genera codice commercialista SOLO se NON è P.IVA
    let codiceCommercialista = null
    
    if (!isPIVA) {
      // Se fornito dall'utente, verifica unicità
      if (body.codiceCommercialista?.trim()) {
        codiceCommercialista = body.codiceCommercialista.toUpperCase().trim()
        const esistenteCodice = await prisma.artista.findFirst({
          where: { codiceCommercialista }
        })
        if (esistenteCodice) {
          return NextResponse.json(
            { error: `Codice commercialista ${codiceCommercialista} già in uso` },
            { status: 400 }
          )
        }
      } else {
        // Genera automaticamente
        codiceCommercialista = await generaCodiceCommercialista()
      }
    }
    
    // Verifica iscrizione completa
    const hasDocumento = body.tipoDocumento && body.numeroDocumento
    const hasCF = body.extraUE || body.codiceFiscale
    const iscritto = !!(hasCF && body.iban && hasDocumento && body.dataNascita && (body.email || body.telefono))
    
    const artista = await prisma.artista.create({
      data: {
        nome: body.nome,
        cognome: body.cognome,
        nomeDarte: body.nomeDarte || null,
        codiceFiscale: body.codiceFiscale?.toUpperCase() || null,
        extraUE: body.extraUE || false,
        codiceFiscaleEstero: body.codiceFiscaleEstero || null,
        partitaIva: body.partitaIva || null,
        nazionalita: body.nazionalita || 'IT',
        email: body.email || null,
        telefono: body.telefono || null,
        telefonoSecondario: body.telefonoSecondario || null,
        indirizzo: body.indirizzo || null,
        cap: body.cap || null,
        citta: body.citta || null,
        provincia: body.provincia || null,
        dataNascita: body.dataNascita ? new Date(body.dataNascita) : null,
        sesso: body.sesso || null,
        comuneNascita: body.comuneNascita || null,
        provinciaNascita: body.provinciaNascita || null,
        qualifica: body.qualifica || 'Altro',
        tipoContratto: body.tipoContratto || 'PRESTAZIONE_OCCASIONALE',
        matricolaEnpals: body.matricolaEnpals || null,
        cachetBase: body.cachetBase || null,
        tipoDocumento: body.tipoDocumento || null,
        numeroDocumento: body.numeroDocumento || null,
        scadenzaDocumento: body.scadenzaDocumento ? new Date(body.scadenzaDocumento) : null,
        iban: body.iban || null,
        bic: body.bic?.toUpperCase() || null,
        codiceCommercialista, // Sarà null se è P.IVA
        tipoPagamento: body.tipoPagamento || 'STANDARD_15GG',
        iscritto,
        maggiorenne: body.maggiorenne ?? true,
        note: body.note || null,
        noteInterne: body.noteInterne || null,
      },
    })
    
    return NextResponse.json(artista, { status: 201 })
  } catch (error: any) {
    console.error('Errore POST artista:', error)
    
    // Gestisci errore di unicità
    if (error.code === 'P2002') {
      const campo = error.meta?.target?.[0] || 'campo'
      return NextResponse.json(
        { error: `Valore duplicato per ${campo}` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Errore nella creazione dell\'artista' },
      { status: 500 }
    )
  }
}