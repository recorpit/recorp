// src/app/api/import/committenti/template/route.ts
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    const headers = [
      'ragioneSociale', 'partitaIva', 'codiceFiscale', 'email', 'pec', 'telefono',
      'codiceSDI', 'indirizzoFatturazione', 'capFatturazione', 'cittaFatturazione',
      'provinciaFatturazione', 'quotaAgenzia', 'giorniPagamento', 'iban', 'aRischio', 'note'
    ]
    
    const exampleRow = {
      ragioneSociale: 'AZIENDA ESEMPIO SRL',
      partitaIva: '12345678901',
      codiceFiscale: '12345678901',
      email: 'info@azienda.it',
      pec: 'azienda@pec.it',
      telefono: '+39 02 12345678',
      codiceSDI: '0000000',
      indirizzoFatturazione: 'Via Roma 1',
      capFatturazione: '20100',
      cittaFatturazione: 'MILANO',
      provinciaFatturazione: 'MI',
      quotaAgenzia: '50',
      giorniPagamento: '30',
      iban: 'IT00X0000000000000000000000',
      aRischio: 'NO',
      note: ''
    }
    
    const ws = XLSX.utils.json_to_sheet([exampleRow], { header: headers })
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length, 15) }))
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Committenti')
    
    const instructions = [
      { Campo: 'ragioneSociale', Obbligatorio: 'SI', Descrizione: 'Nome azienda committente' },
      { Campo: 'partitaIva', Obbligatorio: 'SI', Descrizione: 'Partita IVA (11 cifre)' },
      { Campo: 'codiceFiscale', Obbligatorio: 'NO', Descrizione: 'Se diverso da P.IVA' },
      { Campo: 'email', Obbligatorio: 'NO', Descrizione: 'Email principale' },
      { Campo: 'pec', Obbligatorio: 'NO', Descrizione: 'PEC per fatturazione' },
      { Campo: 'telefono', Obbligatorio: 'NO', Descrizione: 'Telefono' },
      { Campo: 'codiceSDI', Obbligatorio: 'NO', Descrizione: 'Codice SDI (default: 0000000)' },
      { Campo: 'indirizzoFatturazione', Obbligatorio: 'NO', Descrizione: 'Indirizzo sede' },
      { Campo: 'capFatturazione', Obbligatorio: 'NO', Descrizione: 'CAP' },
      { Campo: 'cittaFatturazione', Obbligatorio: 'NO', Descrizione: 'Città' },
      { Campo: 'provinciaFatturazione', Obbligatorio: 'NO', Descrizione: 'Sigla provincia' },
      { Campo: 'quotaAgenzia', Obbligatorio: 'NO', Descrizione: 'Quota fissa agenzia in € (default: 0)' },
      { Campo: 'giorniPagamento', Obbligatorio: 'NO', Descrizione: 'Giorni per pagamento (default: 30)' },
      { Campo: 'iban', Obbligatorio: 'NO', Descrizione: 'IBAN committente' },
      { Campo: 'aRischio', Obbligatorio: 'NO', Descrizione: 'SI/NO - committente a rischio' },
      { Campo: 'note', Obbligatorio: 'NO', Descrizione: 'Note libere' },
    ]
    const wsInstr = XLSX.utils.json_to_sheet(instructions)
    wsInstr['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 50 }]
    XLSX.utils.book_append_sheet(wb, wsInstr, 'Istruzioni')
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_committenti.xlsx"',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
