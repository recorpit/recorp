// src/app/api/export/locali/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const locali = await prisma.locale.findMany({
      include: { committenteDefault: true },
      orderBy: { nome: 'asc' },
    })
    
    const data = locali.map(l => ({
      nome: l.nome,
      indirizzo: l.indirizzo || '',
      cap: l.cap || '',
      citta: l.citta || '',
      provincia: l.provincia || '',
      // codiceINPS: l.codiceINPS || '',  // RIMUOVI,
      // telefono: l.telefono || '',      // RIMUOVI 
      // email: l.email || '',            // RIMUOVI
      committenteDefaultRagioneSociale: l.committenteDefault?.ragioneSociale || '',
      note: l.note || '',
    }))
    
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Locali')
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="locali_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Errore export' }, { status: 500 })
  }
}
