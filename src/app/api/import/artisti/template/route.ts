// src/app/api/import/artisti/template/route.ts
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    // Definisci colonne template
    const headers = [
      'cognome',
      'nome',
      'codiceFiscale',
      'nomeDarte',
      'dataNascita',
      'luogoNascita',
      'provinciaNascita',
      'sesso',
      'cittadinanza',
      'indirizzo',
      'cap',
      'citta',
      'provincia',
      'telefono',
      'email',
      'iban',
      'bic',
      'qualifica',
      'cachetBase',
      'tipoContratto',
      'tipoDocumento',
      'numeroDocumento',
      'scadenzaDocumento',
      'codiceCommercialista',  // Ultima colonna
    ]
    
    // Riga esempio
    const exampleRow = {
      cognome: 'ROSSI',
      nome: 'MARIO',
      codiceFiscale: 'RSSMRA80A01H501Z',
      nomeDarte: 'DJ Mario',
      dataNascita: '01/01/1980',
      luogoNascita: 'ROMA',
      provinciaNascita: 'RM',
      sesso: 'M',
      cittadinanza: 'IT',
      indirizzo: 'Via Roma 123',
      cap: '00100',
      citta: 'ROMA',
      provincia: 'RM',
      telefono: '+39 333 1234567',
      email: 'mario.rossi@email.it',
      iban: 'IT00X0000000000000000000000',
      bic: 'UNCRITM1XXX',
      qualifica: 'DJ',
      cachetBase: '100',
      tipoContratto: 'PRESTAZIONE OCCASIONALE',
      tipoDocumento: 'CARTA_IDENTITA',
      numeroDocumento: 'AB1234567',
      scadenzaDocumento: '31/12/2030',
      codiceCommercialista: '10001000000',  // Esempio
    }
    
    // Crea workbook
    const ws = XLSX.utils.json_to_sheet([exampleRow], { header: headers })
    
    // Imposta larghezza colonne
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length, 15) }))
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Artisti')
    
    // Aggiungi foglio istruzioni
    const instructions = [
      { Campo: 'cognome', Obbligatorio: 'SI', Descrizione: 'Cognome artista (maiuscolo)' },
      { Campo: 'nome', Obbligatorio: 'SI', Descrizione: 'Nome artista (maiuscolo)' },
      { Campo: 'codiceFiscale', Obbligatorio: 'SI', Descrizione: 'Codice fiscale 16 caratteri' },
      { Campo: 'nomeDarte', Obbligatorio: 'NO', Descrizione: 'Nome artistico' },
      { Campo: 'dataNascita', Obbligatorio: 'NO', Descrizione: 'Formato: DD/MM/YYYY' },
      { Campo: 'luogoNascita', Obbligatorio: 'NO', Descrizione: 'Comune di nascita' },
      { Campo: 'provinciaNascita', Obbligatorio: 'NO', Descrizione: 'Sigla provincia (2 lettere)' },
      { Campo: 'sesso', Obbligatorio: 'NO', Descrizione: 'M o F' },
      { Campo: 'cittadinanza', Obbligatorio: 'NO', Descrizione: 'Default: IT (codice ISO)' },
      { Campo: 'indirizzo', Obbligatorio: 'NO', Descrizione: 'Indirizzo residenza' },
      { Campo: 'cap', Obbligatorio: 'NO', Descrizione: 'CAP (5 cifre)' },
      { Campo: 'citta', Obbligatorio: 'NO', Descrizione: 'Città residenza' },
      { Campo: 'provincia', Obbligatorio: 'NO', Descrizione: 'Sigla provincia (2 lettere)' },
      { Campo: 'telefono', Obbligatorio: 'NO', Descrizione: 'Numero telefono' },
      { Campo: 'email', Obbligatorio: 'NO', Descrizione: 'Email per comunicazioni' },
      { Campo: 'iban', Obbligatorio: 'NO', Descrizione: 'IBAN per pagamenti' },
      { Campo: 'bic', Obbligatorio: 'NO', Descrizione: 'Codice BIC/SWIFT della banca (8-11 caratteri)' },
      { Campo: 'qualifica', Obbligatorio: 'NO', Descrizione: 'DJ, Cantante, Ballerino, Musicista, ecc. (vedi Impostazioni > Qualifiche)' },
      { Campo: 'cachetBase', Obbligatorio: 'NO', Descrizione: 'Compenso netto predefinito' },
      { Campo: 'tipoContratto', Obbligatorio: 'NO', Descrizione: 'PRESTAZIONE OCCASIONALE, P.IVA, A CHIAMATA, FULL TIME' },
      { Campo: 'tipoDocumento', Obbligatorio: 'NO', Descrizione: 'CARTA_IDENTITA, PASSAPORTO, PATENTE, PERMESSO_SOGGIORNO' },
      { Campo: 'numeroDocumento', Obbligatorio: 'NO', Descrizione: 'Numero documento identità' },
      { Campo: 'scadenzaDocumento', Obbligatorio: 'NO', Descrizione: 'Formato: DD/MM/YYYY' },
      { Campo: 'codiceCommercialista', Obbligatorio: 'NO', Descrizione: 'Se vuoto viene generato automaticamente (10001000000, 10002000000...)' },
    ]
    const wsInstr = XLSX.utils.json_to_sheet(instructions)
    wsInstr['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 60 }]
    XLSX.utils.book_append_sheet(wb, wsInstr, 'Istruzioni')
    
    // Genera buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_artisti.xlsx"',
      },
    })
  } catch (error) {
    console.error('Errore generazione template:', error)
    return NextResponse.json({ error: 'Errore generazione template' }, { status: 500 })
  }
}
