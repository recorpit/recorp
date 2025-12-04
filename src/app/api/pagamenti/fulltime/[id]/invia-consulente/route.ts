// src/app/api/pagamenti/fulltime/[id]/invia-consulente/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const calcolo = await prisma.calcoloMensileFullTime.findUnique({
      where: { id },
      include: {
        artista: true,
        dettagliPresenze: {
          orderBy: { dataAgibilita: 'asc' }
        },
        rimborsiSpesa: {
          orderBy: { data: 'asc' }
        }
      }
    })
    
    if (!calcolo) {
      return NextResponse.json({ error: 'Calcolo non trovato' }, { status: 404 })
    }
    
    // Carica impostazioni
    const impostazioni = await prisma.impostazioniPagamenti.findFirst({
      where: { id: 'default' }
    })
    
    if (!impostazioni?.emailConsulente) {
      return NextResponse.json({ 
        error: 'Email consulente non configurata. Vai in Impostazioni > Pagamenti.' 
      }, { status: 400 })
    }
    
    const nomeArtista = `${calcolo.artista.nome} ${calcolo.artista.cognome}`
    const meseNome = new Date(calcolo.anno, calcolo.mese - 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
    
    // Genera tabella presenze
    const righePresenze = calcolo.dettagliPresenze.map(d => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(d.dataAgibilita).toLocaleDateString('it-IT')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${d.localeNome || 'N/D'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${d.tipoEvento || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€ ${Number(d.compensoNetto).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€ ${Number(d.gettoneAgenzia).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>€ ${Number(d.nettoPerBustaPaga).toFixed(2)}</strong></td>
      </tr>
    `).join('')
    
    // Genera tabella rimborsi
    const righeRimborsi = calcolo.rimborsiSpesa.map(r => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(r.data).toLocaleDateString('it-IT')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.tipo}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.descrizione || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€ ${Number(r.importo).toFixed(2)}</td>
      </tr>
    `).join('')
    
    const htmlEmail = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          table { width: 100%; border-collapse: collapse; background: white; margin: 10px 0; }
          th { background: #f3f4f6; padding: 10px; text-align: left; }
          .totali { background: #ecfdf5; padding: 15px; border-radius: 8px; margin-top: 20px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Riepilogo Mensile - Full Time</h1>
            <p style="margin: 0;">${meseNome}</p>
          </div>
          
          <div class="content">
            <p>Buongiorno,</p>
            
            <p>Vi inviamo il riepilogo mensile per l'elaborazione della busta paga.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">👤 Dipendente</h3>
              <p><strong>Nome:</strong> ${nomeArtista}</p>
              <p><strong>Codice Fiscale:</strong> ${calcolo.artista.codiceFiscale || 'N/D'}</p>
              <p><strong>Mese:</strong> ${meseNome}</p>
            </div>
            
            ${calcolo.dettagliPresenze.length > 0 ? `
              <div class="info-box">
                <h3 style="margin-top: 0;">📅 Presenze (${calcolo.numeroPresenze})</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Locale</th>
                      <th>Tipo</th>
                      <th style="text-align: right;">Compenso</th>
                      <th style="text-align: right;">Gettone Ag.</th>
                      <th style="text-align: right;">Per Busta</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${righePresenze}
                  </tbody>
                </table>
              </div>
            ` : ''}
            
            ${calcolo.rimborsiSpesa.length > 0 ? `
              <div class="info-box">
                <h3 style="margin-top: 0;">🧾 Rimborsi Spesa</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Descrizione</th>
                      <th style="text-align: right;">Importo</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${righeRimborsi}
                  </tbody>
                </table>
              </div>
            ` : ''}
            
            <div class="totali">
              <h3 style="margin-top: 0;">💰 Riepilogo Importi</h3>
              <table style="background: transparent;">
                <tr>
                  <td>Stipendio Fisso:</td>
                  <td style="text-align: right;">€ ${Number(calcolo.stipendioFisso).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Totale Compensi Agibilità:</td>
                  <td style="text-align: right;">€ ${Number(calcolo.totaleNettoAgibilita).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Gettoni Agenzia (da detrarre):</td>
                  <td style="text-align: right;">- € ${Number(calcolo.totaleGettoniAgenzia).toFixed(2)}</td>
                </tr>
                <tr>
                  <td><strong>Netto per Busta Paga:</strong></td>
                  <td style="text-align: right;"><strong>€ ${Number(calcolo.nettoPerBustaPaga).toFixed(2)}</strong></td>
                </tr>
                <tr>
                  <td>Rimborsi Spesa (Trasferta Italia):</td>
                  <td style="text-align: right;">€ ${Number(calcolo.totaleRimborsiSpesa).toFixed(2)}</td>
                </tr>
                <tr style="border-top: 2px solid #059669;">
                  <td><strong>TOTALE BUSTA PAGA:</strong></td>
                  <td style="text-align: right; font-size: 1.2em;"><strong>€ ${Number(calcolo.totaleBustaPaga).toFixed(2)}</strong></td>
                </tr>
              </table>
            </div>
            
            ${calcolo.note ? `
              <div class="info-box">
                <h3 style="margin-top: 0;">📝 Note</h3>
                <p>${calcolo.note}</p>
              </div>
            ` : ''}
            
            <p>Restiamo a disposizione per eventuali chiarimenti.</p>
            
            <p>Cordiali saluti</p>
          </div>
          
          <div class="footer">
            <p>OKL S.r.l. - Gestione Pagamenti</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    // Invia email
    await sendEmail({
      to: impostazioni.emailConsulente,
      subject: `Riepilogo Full Time - ${nomeArtista} - ${meseNome}`,
      html: htmlEmail,
    })
    
    // Aggiorna stato
    const updated = await prisma.calcoloMensileFullTime.update({
      where: { id },
      data: {
        stato: 'INVIATA_CONSULENTE',
        dataInvioConsulente: new Date(),
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: `Riepilogo inviato a ${impostazioni.emailConsulente}`,
      calcolo: updated
    })
  } catch (error) {
    console.error('Errore invio riepilogo consulente:', error)
    return NextResponse.json({ error: 'Errore nell\'invio email' }, { status: 500 })
  }
}
