// src/lib/pdf-ricevuta.ts
import PDFDocument from 'pdfkit'

interface DatiRicevuta {
  numero: number
  anno: number
  codice: string
  dataEmissione: Date
  
  // Artista
  artista: {
    nome: string
    cognome: string
    codiceFiscale: string
    indirizzo: string
    cap: string
    citta: string
    provincia: string
  }
  
  // Committente
  committente: {
    nome: string
    piva: string
    indirizzo: string
  }
  
  // Prestazioni
  prestazioni: {
    locale: string
    data: Date
    descrizione?: string
  }[]
  
  // Importi
  compensoLordo: number
  ritenuta: number
  compensoNetto: number
  rimborsoSpese: number
  totalePagato: number
}

export async function generaPdfRicevuta(dati: DatiRicevuta): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
        bufferPages: true
      })
      
      const chunks: Buffer[] = []
      
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
      
      // --- INTESTAZIONE ---
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('RICEVUTA PER PRESTAZIONE OCCASIONALE', { align: 'center' })
      
      doc.moveDown(0.5)
      
      doc.fontSize(12)
         .font('Helvetica')
         .text(`N. ${dati.numero}/${dati.anno}`, { align: 'center' })
      
      doc.moveDown(1.5)
      
      // --- DATI PRESTATORE ---
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('PRESTATORE D\'OPERA')
      
      doc.font('Helvetica')
         .fontSize(10)
         .text(`${dati.artista.cognome} ${dati.artista.nome}`)
         .text(`C.F.: ${dati.artista.codiceFiscale}`)
         .text(`${dati.artista.indirizzo}`)
         .text(`${dati.artista.cap} ${dati.artista.citta} (${dati.artista.provincia})`)
      
      doc.moveDown(1)
      
      // --- DATI COMMITTENTE ---
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('COMMITTENTE')
      
      doc.font('Helvetica')
         .fontSize(10)
         .text(dati.committente.nome)
         .text(`P.IVA: ${dati.committente.piva}`)
         .text(dati.committente.indirizzo)
      
      doc.moveDown(1.5)
      
      // --- PRESTAZIONI ---
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('PRESTAZIONI EFFETTUATE')
      
      doc.moveDown(0.5)
      
      // Tabella prestazioni
      const tableTop = doc.y
      const col1 = 50
      const col2 = 200
      const col3 = 400
      
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .text('Data', col1, tableTop)
         .text('Luogo', col2, tableTop)
         .text('Descrizione', col3, tableTop)
      
      doc.moveTo(col1, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke()
      
      let y = tableTop + 20
      doc.font('Helvetica')
      
      for (const p of dati.prestazioni) {
        const dataStr = new Date(p.data).toLocaleDateString('it-IT')
        doc.text(dataStr, col1, y)
           .text(p.locale, col2, y)
           .text(p.descrizione || 'Prestazione artistica', col3, y)
        y += 15
      }
      
      doc.moveDown(2)
      doc.y = y + 20
      
      // --- IMPORTI ---
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('DETTAGLIO COMPENSO')
      
      doc.moveDown(0.5)
      
      const importiX = 350
      const labelX = 50
      
      doc.fontSize(10)
         .font('Helvetica')
      
      doc.text('Compenso Lordo:', labelX)
         .text(`€ ${dati.compensoLordo.toFixed(2)}`, importiX, doc.y - 12, { align: 'right', width: 150 })
      
      doc.text('Ritenuta d\'acconto 20%:', labelX)
         .text(`- € ${dati.ritenuta.toFixed(2)}`, importiX, doc.y - 12, { align: 'right', width: 150 })
      
      doc.text('Compenso Netto:', labelX)
         .text(`€ ${dati.compensoNetto.toFixed(2)}`, importiX, doc.y - 12, { align: 'right', width: 150 })
      
      if (dati.rimborsoSpese > 0) {
        doc.text('Rimborso Spese:', labelX)
           .text(`+ € ${dati.rimborsoSpese.toFixed(2)}`, importiX, doc.y - 12, { align: 'right', width: 150 })
      }
      
      doc.moveDown(0.5)
      doc.moveTo(labelX, doc.y)
         .lineTo(500, doc.y)
         .stroke()
      doc.moveDown(0.3)
      
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .text('TOTALE DA CORRISPONDERE:', labelX)
         .text(`€ ${dati.totalePagato.toFixed(2)}`, importiX, doc.y - 14, { align: 'right', width: 150 })
      
      doc.moveDown(2)
      
      // --- DICHIARAZIONE ---
      doc.fontSize(9)
         .font('Helvetica')
         .text(
           'Il sottoscritto dichiara, sotto la propria responsabilità, che nell\'anno solare in corso ' +
           'non ha conseguito redditi derivanti dall\'esercizio di attività di lavoro autonomo ' +
           'occasionale superiori ad euro 5.000,00 e si impegna a comunicare tempestivamente ' +
           'l\'eventuale superamento di detto limite.',
           { align: 'justify' }
         )
      
      doc.moveDown(1.5)
      
      // --- DATA E FIRMA ---
      const dataEmissione = new Date(dati.dataEmissione).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      
      doc.fontSize(10)
         .text(`Data: ${dataEmissione}`, labelX)
      
      doc.moveDown(1.5)
      
      doc.text('In fede', 400)
      doc.moveDown(2)
      doc.text('_______________________________', 350)
      doc.fontSize(9)
         .text(`(${dati.artista.cognome} ${dati.artista.nome})`, 350)
      
      // --- FOOTER ---
      doc.fontSize(8)
         .fillColor('#666666')
         .text(
           'Documento generato automaticamente - ' + dati.codice,
           50,
           doc.page.height - 50,
           { align: 'center' }
         )
      
      doc.end()
      
    } catch (error) {
      reject(error)
    }
  })
}
