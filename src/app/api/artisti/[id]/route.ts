// src/app/api/artisti/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Dettaglio artista
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const artista = await prisma.artista.findUnique({
      where: { id },
      include: {
        agibilita: {
          include: {
            agibilita: {
              select: {
                id: true,
                codice: true,
                data: true,
                stato: true,
                locale: {
                  select: {
                    nome: true,
                    citta: true,
                  }
                }
              }
            }
          },
          orderBy: {
            agibilita: {
              data: 'desc'
            }
          }
        },
        _count: {
          select: { agibilita: true }
        }
      }
    })
    
    if (!artista) {
      return NextResponse.json(
        { error: 'Artista non trovato' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(artista)
  } catch (error) {
    console.error('Errore GET artista:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dell\'artista' },
      { status: 500 }
    )
  }
}

// PATCH - Aggiorna artista (parziale)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Se si sta aggiornando il CF, verifica unicità
    if (body.codiceFiscale) {
      const cfUppercase = body.codiceFiscale.toUpperCase().trim()
      const esistente = await prisma.artista.findFirst({
        where: { 
          codiceFiscale: cfUppercase,
          NOT: { id }
        }
      })
      if (esistente) {
        return NextResponse.json(
          { error: `Codice fiscale ${cfUppercase} già registrato` },
          { status: 400 }
        )
      }
      body.codiceFiscale = cfUppercase
    }
    
    // Gestisci date
    if (body.dataNascita) {
      body.dataNascita = new Date(body.dataNascita)
    }
    if (body.scadenzaDocumento) {
      body.scadenzaDocumento = new Date(body.scadenzaDocumento)
    }
    
    const artista = await prisma.artista.update({
      where: { id },
      data: body
    })
    
    return NextResponse.json(artista)
  } catch (error: any) {
    console.error('Errore PATCH artista:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Artista non trovato' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento dell\'artista' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna artista (completo)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Se si sta aggiornando il CF, verifica unicità
    if (body.codiceFiscale) {
      const cfUppercase = body.codiceFiscale.toUpperCase().trim()
      const esistente = await prisma.artista.findFirst({
        where: { 
          codiceFiscale: cfUppercase,
          NOT: { id }
        }
      })
      if (esistente) {
        return NextResponse.json(
          { error: `Codice fiscale ${cfUppercase} già registrato` },
          { status: 400 }
        )
      }
    }
    
    // Determina se è P.IVA
    const haPartitaIva = !!(body.partitaIva && body.partitaIva.trim())
    const tipoContrattoIsPIVA = body.tipoContratto === 'P_IVA'
    const isPIVA = haPartitaIva || tipoContrattoIsPIVA
    
    // Verifica iscrizione completa
    const hasDocumento = body.tipoDocumento && body.numeroDocumento
    const hasCF = body.extraUE || body.codiceFiscale
    const iscritto = !!(hasCF && body.iban && hasDocumento && body.dataNascita && (body.email || body.telefono))
    
    const artista = await prisma.artista.update({
      where: { id },
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
        codiceCommercialista: isPIVA ? null : body.codiceCommercialista,
        tipoPagamento: body.tipoPagamento || 'STANDARD_15GG',
        iscritto,
        maggiorenne: body.maggiorenne ?? true,
        note: body.note || null,
        noteInterne: body.noteInterne || null,
      },
    })
    
    return NextResponse.json(artista)
  } catch (error: any) {
    console.error('Errore PUT artista:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Artista non trovato' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento dell\'artista' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina artista
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verifica se ha agibilità associate (attraverso ArtistaAgibilita)
    const agibilitaCount = await prisma.artistaAgibilita.count({
      where: { artistaId: id }
    })
    
    if (agibilitaCount > 0) {
      return NextResponse.json(
        { error: `Impossibile eliminare: l'artista ha ${agibilitaCount} agibilità associate` },
        { status: 400 }
      )
    }
    
    await prisma.artista.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Errore DELETE artista:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Artista non trovato' },
        { status: 404 }
      )
    }
    
    // Errore foreign key
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Impossibile eliminare: l\'artista è collegato ad altri record' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione dell\'artista' },
      { status: 500 }
    )
  }
}