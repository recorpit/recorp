// src/app/api/staff/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Lista staff con filtri
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const attivo = searchParams.get('attivo')
    const tipoCollaboratore = searchParams.get('tipoCollaboratore')
    const competenza = searchParams.get('competenza') // audio, luci, video, etc
    const search = searchParams.get('search')
    
    const where: any = {}
    
    if (attivo !== null) {
      where.attivo = attivo === 'true'
    }
    
    if (tipoCollaboratore) {
      where.tipoCollaboratore = tipoCollaboratore
    }
    
    // Filtro per competenza specifica (livello >= 1)
    if (competenza) {
      const competenzaField = `competenza${competenza.charAt(0).toUpperCase() + competenza.slice(1)}`
      where[competenzaField] = { gte: 1 }
    }
    
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { cognome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { codiceFiscale: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    const staff = await prisma.staff.findMany({
      where,
      include: {
        _count: {
          select: {
            assegnazioni: true
          }
        }
      },
      orderBy: [
        { cognome: 'asc' },
        { nome: 'asc' }
      ]
    })
    
    return NextResponse.json(staff)
  } catch (error) {
    console.error('Errore GET staff:', error)
    return NextResponse.json({ error: 'Errore nel recupero staff' }, { status: 500 })
  }
}

// POST - Crea nuovo staff
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validazione campi obbligatori
    if (!body.nome || !body.cognome) {
      return NextResponse.json({ 
        error: 'Nome e cognome sono obbligatori' 
      }, { status: 400 })
    }
    
    // Verifica CF duplicato
    if (body.codiceFiscale) {
      const existing = await prisma.staff.findUnique({
        where: { codiceFiscale: body.codiceFiscale }
      })
      if (existing) {
        return NextResponse.json({ 
          error: 'Codice fiscale già presente' 
        }, { status: 400 })
      }
    }
    
    const staff = await prisma.staff.create({
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
        tipoCollaboratore: body.tipoCollaboratore || 'ESTERNO',
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
        note: body.note || null,
        noteInterne: body.noteInterne || null,
        attivo: body.attivo !== false,
      }
    })
    
    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    console.error('Errore POST staff:', error)
    return NextResponse.json({ error: 'Errore nella creazione staff' }, { status: 500 })
  }
}
