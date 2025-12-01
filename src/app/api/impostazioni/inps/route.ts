// src/app/api/impostazioni/inps/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const settings = await prisma.impostazioni.findFirst({
      where: { chiave: 'inps' }
    })
    
    if (settings) {
      return NextResponse.json(JSON.parse(settings.valore))
    }
    
    // Default
    return NextResponse.json({
      matricolaINPS: '',
      codiceFiscaleAzienda: process.env.AZIENDA_PIVA || '',
      ragioneSocialeAzienda: process.env.AZIENDA_NOME || '',
      comuneSede: '',
      provinciaSede: '',
      capSede: '',
      indirizzoSede: '',
      cfRappresentante: '',
      cognomeRappresentante: '',
      nomeRappresentante: '',
      usernameINPS: '',
      passwordINPS: '',
      pinINPS: '',
      tipoInvioDefault: 'I',
      categoriaDefault: 'L',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    await prisma.impostazioni.upsert({
      where: { chiave: 'inps' },
      update: { valore: JSON.stringify(data), updatedAt: new Date() },
      create: { chiave: 'inps', valore: JSON.stringify(data) }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Errore salvataggio' }, { status: 500 })
  }
}
