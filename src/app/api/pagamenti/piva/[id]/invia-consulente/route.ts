// src/app/api/pagamenti/piva/[id]/invia-consulente/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import fs from 'fs/promises'
import path from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const raggruppamento = await prisma.raggruppamentoCompensoPIVA.findUnique({
      where: { id },
      include: {
        artista: true,
      }
    })
    
    if (!raggruppamento) {
      return NextResponse.json({ error: 'Raggruppamento non trovato' }, { status: 404 })
    }
    
    if (raggruppamento.stato !== 'FATTURA_RICEVUTA') {
      return NextResponse.json({ 
        error: 'Devi prima registrare la fattura ricevuta' 
      }, { status: 400 })
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
    
    // Prepara allegato PDF se presente
    let attachments: any[] = []
    if (raggruppamento.pdfFatturaPath) {
      try {
        const pdfPath = path.join(process.cwd(), 'public', raggruppamento.pdfFatturaPath)
        const pdfBuffer = await fs.readFile(pdfPath)
        attachments.push({
          filename: `Fattura_${raggruppamento.numeroFattura}_${raggruppamento.artista.cognome}.pdf`,
          content: pdfBuffer,
        })
      } catch (e) {
        console.warn('PDF non trovato:', raggruppamento.pdfFatturaPath)
      }
    }
    
    const nomeArtista = `${raggruppamento.artista.nome} ${raggruppamento.artista.cognome}`
    const partitaIva = raggruppamento.artista.partitaIva || 'N/D'
    
    // Genera email
    const htmlEmail = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Fattura Ricevuta - P.IVA</h1>
          </div>
          
          <div class="content">
            <p>Buongiorno,</p>
            
            <p>Vi inviamo in allegato la fattura ricevuta da un collaboratore con Partita IVA.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Dati Collaboratore</h3>
              <p><strong>Nome:</strong> ${nomeArtista}</p>
              <p><strong>P.IVA:</strong> ${partitaIva}</p>
              <p><strong>Codice Fiscale:</strong> ${raggruppamento.artista.codiceFiscale || 'N/D'}</p>
            </div>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Dati Fattura</h3>
              <p><strong>Numero Fattura:</strong> ${raggruppamento.numeroFattura}</p>
              <p><strong>Data Fattura:</strong> ${new Date(raggruppamento.dataFattura!).toLocaleDateString('it-IT')}</p>
              <p><strong>Periodo:</strong> ${new Date(raggruppamento.periodoInizio).toLocaleDateString('it-IT')} - ${new Date(raggruppamento.periodoFine).toLocaleDateString('it-IT')}</p>
            </div>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Importi</h3>
              <p><strong>Imponibile:</strong> € ${Number(raggruppamento.totaleImponibile).toFixed(2)}</p>
              ${Number(raggruppamento.totaleRitenuta4) > 0 ? `
                <p><strong>Ritenuta 4%:</strong> € ${Number(raggruppamento.totaleRitenuta4).toFixed(2)}</p>
                <p><strong>Netto da pagare:</strong> € ${Number(raggruppamento.totaleNetto).toFixed(2)}</p>
              ` : ''}
              <p><strong>Prestazioni:</strong> ${raggruppamento.numeroAgibilita}</p>
            </div>
            
            ${raggruppamento.note ? `
              <div class="info-box">
                <h3 style="margin-top: 0;">Note</h3>
                <p>${raggruppamento.note}</p>
              </div>
            ` : ''}
            
            <p>In allegato troverete la copia della fattura in formato PDF.</p>
            
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
      subject: `Fattura P.IVA - ${nomeArtista} - ${raggruppamento.numeroFattura}`,
      html: htmlEmail,
    })
    
    // Aggiorna stato
    const updated = await prisma.raggruppamentoCompensoPIVA.update({
      where: { id },
      data: {
        stato: 'INVIATA_CONSULENTE',
        dataInvioConsulente: new Date(),
        emailConsulente: impostazioni.emailConsulente,
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: `Fattura inviata a ${impostazioni.emailConsulente}`,
      raggruppamento: updated
    })
  } catch (error) {
    console.error('Errore invio fattura consulente:', error)
    return NextResponse.json({ error: 'Errore nell\'invio email' }, { status: 500 })
  }
}
