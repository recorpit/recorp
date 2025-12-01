// src/app/api/pagamenti/prestazioni/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Genera PDF prestazione occasionale
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const prestazione = await prisma.prestazioneOccasionale.findUnique({
      where: { id },
      include: {
        artista: true,
      }
    })
    
    if (!prestazione) {
      return NextResponse.json(
        { error: 'Prestazione non trovata' },
        { status: 404 }
      )
    }
    
    const artista = prestazione.artista
    const agibilita = prestazione.agibilitaIncluse as any[]
    
    // Data formattata
    const dataEmissione = prestazione.dataEmissione 
      ? new Date(prestazione.dataEmissione).toLocaleDateString('it-IT')
      : new Date().toLocaleDateString('it-IT')
    
    // Dettaglio prestazioni
    const dettaglioPrestazioni = agibilita.map(ag => 
      `${ag.locale} - ${new Date(ag.data).toLocaleDateString('it-IT')}`
    ).join(', ')
    
    // Genera HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 12px;
      line-height: 1.4;
      padding: 40px;
    }
    .header { margin-bottom: 30px; }
    .artista { font-weight: bold; margin-bottom: 20px; }
    .destinatario { margin-bottom: 40px; }
    .destinatario-left { float: left; }
    .destinatario-right { float: right; text-align: right; }
    .clear { clear: both; }
    .titolo { 
      font-weight: bold; 
      margin: 30px 0 20px; 
      font-size: 11px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0;
    }
    th { 
      background: #2563eb; 
      color: white; 
      padding: 10px; 
      text-align: left;
    }
    td { 
      padding: 10px; 
      border-bottom: 1px solid #ddd;
    }
    .totale-row td {
      font-weight: bold;
      background: #f3f4f6;
    }
    .netto-row td {
      font-weight: bold;
      font-size: 14px;
    }
    .note { 
      font-style: italic; 
      font-size: 10px; 
      margin: 20px 0;
      color: #666;
    }
    .dichiarazione {
      margin: 30px 0;
      padding: 15px;
      background: #fef3c7;
      border: 1px solid #fcd34d;
      font-size: 11px;
    }
    .firma {
      margin-top: 50px;
      text-align: right;
    }
    .firma-line {
      border-top: 1px solid #000;
      width: 200px;
      margin-left: auto;
      padding-top: 5px;
      text-align: center;
    }
    .firma-data {
      margin-top: 20px;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="artista">
      ${artista.cognome?.toUpperCase()} ${artista.nome?.toUpperCase()}<br>
      ${artista.indirizzo || ''}<br>
      ${artista.cap || ''} – ${artista.citta?.toUpperCase() || ''} - ${artista.provincia?.toUpperCase() || ''}<br>
      ${artista.codiceFiscale || ''}
    </div>
  </div>
  
  <div class="destinatario">
    <div class="destinatario-left">
      <strong>SPETT.LE</strong><br>
      OKL SRL<br>
      VIA MONTE PASUBIO<br>
      36010 – ZANE' – (VI)<br>
      P.I. 04433920248
    </div>
    <div class="destinatario-right">
      RICEVUTA NUM: ${prestazione.numero}<br>
      DATA: ${dataEmissione}
    </div>
    <div class="clear"></div>
  </div>
  
  <div class="titolo">
    DESCRIZIONE ATTIVITÀ: COMPENSO PER PRESTAZIONE ARTISTICA DELLO SPETTACOLO
  </div>
  
  <table>
    <thead>
      <tr>
        <th>DESCRIZIONE COMPENSO</th>
        <th style="text-align: right;">IMPORTO</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>COMPENSO PER PRESTAZIONE DI LAVORO AUTONOMO OCCASIONALE<br>
        <span style="font-size: 10px; color: #666;">(${dettaglioPrestazioni})</span></td>
        <td style="text-align: right;">${parseFloat(prestazione.compensoLordo as any).toFixed(2)} €</td>
      </tr>
      ${prestazione.rimborsoSpese ? `
      <tr>
        <td>RIMBORSO SPESE DOCUMENTATE</td>
        <td style="text-align: right;">${parseFloat(prestazione.rimborsoSpese as any).toFixed(2)} €</td>
      </tr>
      ` : ''}
      <tr class="totale-row">
        <td>COMPENSO LORDO</td>
        <td style="text-align: right;">${parseFloat(prestazione.compensoLordo as any).toFixed(2)} €</td>
      </tr>
      <tr>
        <td>RITENUTA D'ACCONTO IRPEF 20% - Art. 25 DPR 633/72</td>
        <td style="text-align: right;">${parseFloat(prestazione.ritenuta as any).toFixed(2)} €</td>
      </tr>
      ${parseFloat(prestazione.scontoAnticipo as any) > 0 ? `
      <tr>
        <td>SPESE GESTIONE ANTICIPATA</td>
        <td style="text-align: right;">-${parseFloat(prestazione.scontoAnticipo as any).toFixed(2)} €</td>
      </tr>
      ` : ''}
      <tr class="netto-row">
        <td>NETTO A PAGARE</td>
        <td style="text-align: right;">${parseFloat(prestazione.totalePagato as any).toFixed(2)} €</td>
      </tr>
    </tbody>
  </table>
  
  <div class="note">
    <em>Imposta di bollo da 2,00 euro assolta sull'originale per importi maggiori di 77,47 euro.</em><br>
    <em>Operazione esclusa da IVA ai sensi dell'art. 5 del D.P.R. 633/72.</em>
  </div>
  
  <div class="dichiarazione">
    <strong>•</strong> Il sottoscritto dichiara che, nell'anno solare in corso, <strong>alla data odierna</strong>:<br><br>
    non ha conseguito redditi derivanti dall'esercizio di attività di lavoro autonomo occasionale pari o eccedenti 
    i 10.000 euro e <strong>si obbliga a comunicare l'eventuale superamento</strong> del limite annuo, anche successivamente 
    alla data odierna.
  </div>
  
  <div class="firma">
    ${prestazione.dataFirma ? `
    <div class="firma-data">
      Firmato digitalmente il ${new Date(prestazione.dataFirma).toLocaleDateString('it-IT')} alle ${new Date(prestazione.dataFirma).toLocaleTimeString('it-IT')}<br>
      da: ${prestazione.firmaNome} ${prestazione.firmaCognome}<br>
      IP: ${prestazione.firmaIP || 'N/D'}
    </div>
    ` : `
    <div class="firma-line">(Firma)</div>
    `}
  </div>
</body>
</html>
    `
    
    // Per ora restituiamo HTML (per conversione PDF lato client o con libreria esterna)
    // In produzione useresti puppeteer, html-pdf, o un servizio esterno
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      }
    })
    
  } catch (error) {
    console.error('Errore generazione PDF:', error)
    return NextResponse.json(
      { error: 'Errore nella generazione PDF' },
      { status: 500 }
    )
  }
}
