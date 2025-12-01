// src/app/api/export/committenti/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    const committenti = await prisma.committente.findMany({
      orderBy: { ragioneSociale: 'asc' },
    })
    
    const data = committenti.map(c => ({
      ragioneSociale: c.ragioneSociale,
      partitaIva: c.partitaIva,
      codiceFiscale: c.codiceFiscale || '',
      email: c.email || '',
      pec: c.pec || '',
      telefono: c.telefono || '',
      codiceSDI: c.codiceSDI || '',
      indirizzoFatturazione: c.indirizzoFatturazione || '',
      capFatturazione: c.capFatturazione || '',
      cittaFatturazione: c.cittaFatturazione || '',
      provinciaFatturazione: c.provinciaFatturazione || '',
      quotaAgenzia: c.quotaAgenzia?.toString() || '0',
      giorniPagamento: c.giorniPagamento?.toString() || '30',
      iban: c.iban || '',
      aRischio: c.aRischio ? 'SI' : 'NO',
      note: c.note || '',
    }))
    
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Committenti')
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="committenti_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Errore export' }, { status: 500 })
  }
}
