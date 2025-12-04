// src/app/api/impostazioni/pagamenti/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Recupera impostazioni pagamenti
export async function GET() {
  try {
    let impostazioni = await prisma.impostazioniPagamenti.findFirst({
      where: { id: 'default' }
    })
    
    // Se non esistono, crea default
    if (!impostazioni) {
      impostazioni = await prisma.impostazioniPagamenti.create({
        data: { id: 'default' }
      })
    }
    
    return NextResponse.json(impostazioni)
  } catch (error) {
    console.error('Errore GET impostazioni pagamenti:', error)
    return NextResponse.json({ error: 'Errore nel recupero' }, { status: 500 })
  }
}

// PUT - Aggiorna impostazioni pagamenti
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const impostazioni = await prisma.impostazioniPagamenti.upsert({
      where: { id: 'default' },
      update: {
        // P.IVA
        pivaGiorniTrigger: body.pivaGiorniTrigger ?? 30,
        pivaImportoMinimo: body.pivaImportoMinimo ? parseFloat(body.pivaImportoMinimo) : 100,
        pivaApplicaRitenuta4: body.pivaApplicaRitenuta4 ?? true,
        
        // Trasferta
        trasfertaItaliaDefault: body.trasfertaItaliaDefault ? parseFloat(body.trasfertaItaliaDefault) : 0,
        
        // Email consulente
        emailConsulente: body.emailConsulente || null,
        emailConsulenteCC: body.emailConsulenteCC || null,
        
        // Template
        templateEmailRichiestaFattura: body.templateEmailRichiestaFattura || null,
        templateEmailInvioConsulente: body.templateEmailInvioConsulente || null,
      },
      create: {
        id: 'default',
        pivaGiorniTrigger: body.pivaGiorniTrigger ?? 30,
        pivaImportoMinimo: body.pivaImportoMinimo ? parseFloat(body.pivaImportoMinimo) : 100,
        pivaApplicaRitenuta4: body.pivaApplicaRitenuta4 ?? true,
        trasfertaItaliaDefault: body.trasfertaItaliaDefault ? parseFloat(body.trasfertaItaliaDefault) : 0,
        emailConsulente: body.emailConsulente || null,
        emailConsulenteCC: body.emailConsulenteCC || null,
        templateEmailRichiestaFattura: body.templateEmailRichiestaFattura || null,
        templateEmailInvioConsulente: body.templateEmailInvioConsulente || null,
      }
    })
    
    return NextResponse.json(impostazioni)
  } catch (error) {
    console.error('Errore PUT impostazioni pagamenti:', error)
    return NextResponse.json({ error: 'Errore nel salvataggio' }, { status: 500 })
  }
}
