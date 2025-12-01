// src/app/api/impostazioni/azienda/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Cerca impostazioni esistenti
    const settings = await prisma.impostazioni.findFirst({
      where: { chiave: 'azienda' }
    })
    
    if (settings) {
      return NextResponse.json(JSON.parse(settings.valore))
    }
    
    // Default da env
    return NextResponse.json({
      nome: process.env.AZIENDA_NOME || '',
      ragioneSociale: process.env.AZIENDA_NOME || '',
      partitaIva: process.env.AZIENDA_PIVA || '',
      codiceFiscale: process.env.AZIENDA_CF || '',
      indirizzo: process.env.AZIENDA_INDIRIZZO || '',
      cap: '',
      citta: '',
      provincia: '',
      telefono: '',
      email: '',
      pec: '',
      codiceSDI: '0000000',
      iban: '',
      banca: '',
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: process.env.SMTP_PORT || '465',
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: '',
      smtpFromName: process.env.SMTP_FROM_NAME || '',
      smtpFromEmail: process.env.SMTP_FROM_EMAIL || '',
    })
  } catch (error) {
    console.error('Errore GET impostazioni azienda:', error)
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Upsert impostazioni
    await prisma.impostazioni.upsert({
      where: { chiave: 'azienda' },
      update: { valore: JSON.stringify(data), updatedAt: new Date() },
      create: { chiave: 'azienda', valore: JSON.stringify(data) }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore PUT impostazioni azienda:', error)
    return NextResponse.json({ error: 'Errore salvataggio' }, { status: 500 })
  }
}
