// src/app/api/impostazioni/pagamenti/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const settings = await prisma.impostazioni.findFirst({
      where: { chiave: 'pagamenti' }
    })
    
    if (settings) {
      return NextResponse.json(JSON.parse(settings.valore))
    }
    
    // Default
    return NextResponse.json({
      conti: [
        { id: '1', nome: 'Conto Principale', iban: '', banca: '', principale: true }
      ],
      impostazioni: {
        giorniPagamentoDefault: '30',
        giorniPagamentoAnticipato: '7',
        scontoAnticipo: '5.00',
        causaleBoificoDefault: 'Compenso prestazione artistica - {codice}',
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    await prisma.impostazioni.upsert({
      where: { chiave: 'pagamenti' },
      update: { valore: JSON.stringify(data), updatedAt: new Date() },
      create: { chiave: 'pagamenti', valore: JSON.stringify(data) }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Errore salvataggio' }, { status: 500 })
  }
}
