// src/app/api/import/locali/template/route.ts
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    const headers = [
      'nome', 'indirizzo', 'cap', 'citta', 'provincia',
      'codiceINPS', 'telefono', 'email', 'committenteDefaultRagioneSociale', 'note'
    ]
    
    const exampleRow = {
      nome: 'DISCO CLUB ESEMPIO',
      indirizzo: 'Via della Musica 1',
      cap: '36100',
      citta: 'VICENZA',
      provincia: 'VI',
      codiceINPS: '1234567890',
      telefono: '+39 0444 123456',
      email: 'info@discoclub.it',
      committenteDefaultRagioneSociale: 'AZIENDA ESEMPIO SRL',
      note: ''
    }
    
    const ws = XLSX.utils.json_to_sheet([exampleRow], { header: headers })
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length, 15) }))
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Locali')
    
    const instructions = [
      { Campo: 'nome', Obbligatorio: 'SI', Descrizione: 'Nome del locale/venue' },
      { Campo: 'indirizzo', Obbligatorio: 'SI', Descrizione: 'Indirizzo completo' },
      { Campo: 'cap', Obbligatorio: 'NO', Descrizione: 'CAP' },
      { Campo: 'citta', Obbligatorio: 'SI', Descrizione: 'Città' },
      { Campo: 'provincia', Obbligatorio: 'NO', Descrizione: 'Sigla provincia (2 lettere)' },
      { Campo: 'codiceINPS', Obbligatorio: 'NO', Descrizione: 'Codice INPS del locale per agibilità' },
      { Campo: 'telefono', Obbligatorio: 'NO', Descrizione: 'Telefono locale' },
      { Campo: 'email', Obbligatorio: 'NO', Descrizione: 'Email locale' },
      { Campo: 'committenteDefaultRagioneSociale', Obbligatorio: 'NO', Descrizione: 'Ragione sociale committente associato (deve esistere)' },
      { Campo: 'note', Obbligatorio: 'NO', Descrizione: 'Note libere' },
    ]
    const wsInstr = XLSX.utils.json_to_sheet(instructions)
    wsInstr['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 50 }]
    XLSX.utils.book_append_sheet(wb, wsInstr, 'Istruzioni')
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_locali.xlsx"',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
