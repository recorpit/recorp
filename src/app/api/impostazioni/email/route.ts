// src/app/api/impostazioni/email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Impostazioni email di default (tutto disabilitato)
const DEFAULT_EMAIL_SETTINGS = {
  // Toggle abilitazione invio
  emailAbilitata: false,
  
  // Notifiche su conferma agibilità INPS
  invioEmailCommittente: false,    // Email al committente con PDF
  invioEmailArtista: false,        // Email all'artista con compenso
  
  // Notifiche pagamenti
  invioEmailFirma: false,          // Email richiesta firma ricevuta
  invioEmailSollecito: false,      // Solleciti firma
  invioEmailPagamento: false,      // Conferma pagamento effettuato
  
  // Notifiche artisti
  invioEmailInvitoArtista: false,  // Invito completamento iscrizione
  
  // Giorni prima del sollecito automatico
  giorniSollecito: 3,
}

export async function GET() {
  try {
    const settings = await prisma.impostazioni.findFirst({
      where: { chiave: 'email' }
    })
    
    if (settings) {
      return NextResponse.json({
        ...DEFAULT_EMAIL_SETTINGS,
        ...JSON.parse(settings.valore)
      })
    }
    
    return NextResponse.json(DEFAULT_EMAIL_SETTINGS)
  } catch (error) {
    console.error('Errore GET impostazioni email:', error)
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    await prisma.impostazioni.upsert({
      where: { chiave: 'email' },
      update: { valore: JSON.stringify(data), updatedAt: new Date() },
      create: { chiave: 'email', valore: JSON.stringify(data) }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore PUT impostazioni email:', error)
    return NextResponse.json({ error: 'Errore salvataggio' }, { status: 500 })
  }
}
