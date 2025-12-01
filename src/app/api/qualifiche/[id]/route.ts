// src/app/api/qualifiche/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Singola qualifica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const qualifica = await prisma.qualificaConfig.findUnique({
      where: { id }
    })
    
    if (!qualifica) {
      return NextResponse.json({ error: 'Qualifica non trovata' }, { status: 404 })
    }
    
    return NextResponse.json(qualifica)
  } catch (error) {
    console.error('Errore GET qualifica:', error)
    return NextResponse.json({ error: 'Errore nel recupero della qualifica' }, { status: 500 })
  }
}

// PUT - Aggiorna qualifica
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const esistente = await prisma.qualificaConfig.findUnique({
      where: { id }
    })
    
    if (!esistente) {
      return NextResponse.json({ error: 'Qualifica non trovata' }, { status: 404 })
    }
    
    // Validazioni
    if (body.nome !== undefined && !body.nome?.trim()) {
      return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
    }
    
    if (body.codiceInps !== undefined) {
      if (!body.codiceInps?.trim()) {
        return NextResponse.json({ error: 'Codice INPS obbligatorio' }, { status: 400 })
      }
      if (!/^\d{3}$/.test(body.codiceInps.trim())) {
        return NextResponse.json({ error: 'Codice INPS deve essere di 3 cifre' }, { status: 400 })
      }
    }
    
    // Verifica nome univoco (se cambiato)
    if (body.nome && body.nome.trim() !== esistente.nome) {
      const conStessoNome = await prisma.qualificaConfig.findUnique({
        where: { nome: body.nome.trim() }
      })
      if (conStessoNome) {
        return NextResponse.json({ error: 'Esiste già una qualifica con questo nome' }, { status: 400 })
      }
    }
    
    const qualifica = await prisma.qualificaConfig.update({
      where: { id },
      data: {
        nome: body.nome?.trim() ?? esistente.nome,
        codiceInps: body.codiceInps?.trim() ?? esistente.codiceInps,
        sinonimi: body.sinonimi?.trim() ?? esistente.sinonimi,
        attivo: body.attivo !== undefined ? body.attivo : esistente.attivo,
        ordine: body.ordine !== undefined ? body.ordine : esistente.ordine,
      }
    })
    
    return NextResponse.json(qualifica)
  } catch (error) {
    console.error('Errore PUT qualifica:', error)
    return NextResponse.json({ error: 'Errore nell\'aggiornamento della qualifica' }, { status: 500 })
  }
}

// DELETE - Elimina qualifica
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const qualifica = await prisma.qualificaConfig.findUnique({
      where: { id }
    })
    
    if (!qualifica) {
      return NextResponse.json({ error: 'Qualifica non trovata' }, { status: 404 })
    }
    
    // Verifica se è usata da artisti
    const artistiConQualifica = await prisma.artista.count({
      where: { qualifica: qualifica.nome as any }
    })
    
    if (artistiConQualifica > 0) {
      // Invece di eliminare, disattiva
      await prisma.qualificaConfig.update({
        where: { id },
        data: { attivo: false }
      })
      return NextResponse.json({ 
        message: 'Qualifica disattivata (usata da artisti esistenti)',
        disattivata: true
      })
    }
    
    await prisma.qualificaConfig.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore DELETE qualifica:', error)
    return NextResponse.json({ error: 'Errore nell\'eliminazione della qualifica' }, { status: 500 })
  }
}
