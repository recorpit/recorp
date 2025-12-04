// src/app/api/staff/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Dettaglio staff
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: params.id },
      include: {
        assegnazioni: {
          include: {
            evento: {
              select: {
                id: true,
                codice: true,
                nome: true,
                dataInizio: true,
                stato: true,
                locale: {
                  select: { nome: true, citta: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        _count: {
          select: {
            assegnazioni: true
          }
        }
      }
    })
    
    if (!staff) {
      return NextResponse.json({ error: 'Staff non trovato' }, { status: 404 })
    }
    
    return NextResponse.json(staff)
  } catch (error) {
    console.error('Errore GET staff:', error)
    return NextResponse.json({ error: 'Errore nel recupero staff' }, { status: 500 })
  }
}

// PUT - Aggiorna staff
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Verifica esistenza
    const existing = await prisma.staff.findUnique({
      where: { id: params.id }
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Staff non trovato' }, { status: 404 })
    }
    
    // Verifica CF duplicato se modificato
    if (body.codiceFiscale && body.codiceFiscale !== existing.codiceFiscale) {
      const duplicate = await prisma.staff.findFirst({
        where: { 
          codiceFiscale: body.codiceFiscale,
          NOT: { id: params.id }
        }
      })
      if (duplicate) {
        return NextResponse.json({ 
          error: 'Codice fiscale già presente' 
        }, { status: 400 })
      }
    }
    
    const staff = await prisma.staff.update({
      where: { id: params.id },
      data: {
        nome: body.nome,
        cognome: body.cognome,
        codiceFiscale: body.codiceFiscale || null,
        email: body.email || null,
        telefono: body.telefono || null,
        telefonoSecondario: body.telefonoSecondario || null,
        indirizzo: body.indirizzo || null,
        cap: body.cap || null,
        citta: body.citta || null,
        provincia: body.provincia || null,
        dataNascita: body.dataNascita ? new Date(body.dataNascita) : null,
        comuneNascita: body.comuneNascita || null,
        provinciaNascita: body.provinciaNascita || null,
        tipoCollaboratore: body.tipoCollaboratore,
        competenzaAudio: parseInt(body.competenzaAudio) || 0,
        competenzaLuci: parseInt(body.competenzaLuci) || 0,
        competenzaVideo: parseInt(body.competenzaVideo) || 0,
        competenzaLED: parseInt(body.competenzaLED) || 0,
        competenzaRigging: parseInt(body.competenzaRigging) || 0,
        competenzaStagehand: parseInt(body.competenzaStagehand) || 0,
        competenzaDJTech: parseInt(body.competenzaDJTech) || 0,
        competenzaDriver: parseInt(body.competenzaDriver) || 0,
        tipologiaDJ: body.tipologiaDJ || null,
        costoGettone: body.costoGettone ? parseFloat(body.costoGettone) : null,
        costoOrario: body.costoOrario ? parseFloat(body.costoOrario) : null,
        patente: body.patente || false,
        tipologiaPatente: body.tipologiaPatente || null,
        automunito: body.automunito || false,
        preferenzeOperative: body.preferenzeOperative || null,
        disponibilitaMacro: body.disponibilitaMacro || null,
        iban: body.iban || null,
        note: body.note,
        noteInterne: body.noteInterne,
        attivo: body.attivo,
      }
    })
    
    return NextResponse.json(staff)
  } catch (error) {
    console.error('Errore PUT staff:', error)
    return NextResponse.json({ error: 'Errore nell\'aggiornamento staff' }, { status: 500 })
  }
}

// DELETE - Elimina staff (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica esistenza
    const existing = await prisma.staff.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { assegnazioni: true }
        }
      }
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Staff non trovato' }, { status: 404 })
    }
    
    // Se ha assegnazioni, disattiva invece di eliminare
    if (existing._count.assegnazioni > 0) {
      await prisma.staff.update({
        where: { id: params.id },
        data: { attivo: false }
      })
      return NextResponse.json({ 
        success: true, 
        message: 'Staff disattivato (ha assegnazioni associate)' 
      })
    }
    
    // Elimina
    await prisma.staff.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore DELETE staff:', error)
    return NextResponse.json({ error: 'Errore nell\'eliminazione staff' }, { status: 500 })
  }
}
