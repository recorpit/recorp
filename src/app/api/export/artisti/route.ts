// src/app/api/export/artisti/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    const artisti = await prisma.artista.findMany({
      orderBy: [{ cognome: 'asc' }, { nome: 'asc' }],
    })
    
    const data = artisti.map(a => ({
      cognome: a.cognome,
      nome: a.nome,
      codiceFiscale: a.codiceFiscale,
      codiceCommercialista: a.codiceCommercialista || '',
      nomeDarte: a.nomeDarte || '',
      dataNascita: a.dataNascita ? a.dataNascita.toLocaleDateString('it-IT') : '',
      luogoNascita: a.luogoNascita || '',
      provinciaNascita: a.provinciaNascita || '',
      sesso: a.sesso || '',
      cittadinanza: a.cittadinanza || '',
      indirizzo: a.indirizzo || '',
      cap: a.cap || '',
      citta: a.citta || '',
      provincia: a.provincia || '',
      telefono: a.telefono || '',
      email: a.email || '',
      iban: a.iban || '',
      bic: a.bic || '',
      qualifica: a.qualifica || '',
      cachetBase: a.cachetBase?.toString() || '',
      tipoContratto: a.tipoContratto || '',
      tipoDocumento: a.tipoDocumento || '',
      numeroDocumento: a.numeroDocumento || '',
      scadenzaDocumento: a.scadenzaDocumento ? a.scadenzaDocumento.toLocaleDateString('it-IT') : '',
      iscritto: a.iscritto ? 'SI' : 'NO',
    }))
    
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Artisti')
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="artisti_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Errore export:', error)
    return NextResponse.json({ error: 'Errore export' }, { status: 500 })
  }
}
