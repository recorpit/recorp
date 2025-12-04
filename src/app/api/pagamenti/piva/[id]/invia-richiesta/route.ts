// src/app/api/pagamenti/piva/[id]/invia-richiesta/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'

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
        agibilitaCollegate: {
          include: {
            artistaAgibilita: {
              include: {
                agibilita: {
                  include: {
                    locale: { select: { nome: true } }
                  }
                }
              }
            }
          },
          orderBy: {
            artistaAgibilita: {
              agibilita: { data: 'asc' }
            }
          }
        }
      }
    })
    
    if (!raggruppamento) {
      return NextResponse.json({ error: 'Raggruppamento non trovato' }, { status: 404 })
    }
    
    if (!raggruppamento.artista.email) {
      return NextResponse.json({ error: 'Artista senza email' }, { status: 400 })
    }
    
    // Carica impostazioni per template
    const impostazioni = await prisma.impostazioniPagamenti.findFirst({
      where: { id: 'default' }
    })
    
    // Prepara dettaglio prestazioni
    const dettaglioPrestazioni = raggruppamento.agibilitaCollegate.map(ac => {
      const aa = ac.artistaAgibilita
      const ag = aa.agibilita
      return {
        data: new Date(ag.data).toLocaleDateString('it-IT'),
        locale: ag.locale?.nome || 'N/D',
        codice: ag.codice,
        compensoNetto: Number(ac.compensoNetto).toFixed(2),
        ritenuta4: Number(ac.ritenuta4).toFixed(2),
      }
    })
    
    // Genera HTML email
    const htmlEmail = generaEmailRichiestaFattura({
      artista: raggruppamento.artista,
      totaleNetto: Number(raggruppamento.totaleNetto),
      totaleRitenuta4: Number(raggruppamento.totaleRitenuta4),
      totaleImponibile: Number(raggruppamento.totaleImponibile),
      periodoInizio: raggruppamento.periodoInizio,
      periodoFine: raggruppamento.periodoFine,
      prestazioni: dettaglioPrestazioni,
      templateCustom: impostazioni?.templateEmailRichiestaFattura,
    })
    
    // Invia email
    await sendEmail({
      to: raggruppamento.artista.email,
      subject: `Richiesta fattura - Compensi dal ${new Date(raggruppamento.periodoInizio).toLocaleDateString('it-IT')} al ${new Date(raggruppamento.periodoFine).toLocaleDateString('it-IT')}`,
      html: htmlEmail,
    })
    
    // Aggiorna stato
    const updated = await prisma.raggruppamentoCompensoPIVA.update({
      where: { id },
      data: {
        stato: 'RICHIESTA_INVIATA',
        dataRichiestaFattura: new Date(),
        emailRichiestaInviata: true,
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: `Email inviata a ${raggruppamento.artista.email}`,
      raggruppamento: updated
    })
  } catch (error) {
    console.error('Errore invio richiesta fattura:', error)
    return NextResponse.json({ error: 'Errore nell\'invio email' }, { status: 500 })
  }
}

function generaEmailRichiestaFattura(params: {
  artista: any,
  totaleNetto: number,
  totaleRitenuta4: number,
  totaleImponibile: number,
  periodoInizio: Date,
  periodoFine: Date,
  prestazioni: any[],
  templateCustom?: string | null,
}) {
  const { artista, totaleNetto, totaleRitenuta4, totaleImponibile, periodoInizio, periodoFine, prestazioni } = params
  
  const nomeCompleto = `${artista.nome} ${artista.cognome}`
  const periodo = `${new Date(periodoInizio).toLocaleDateString('it-IT')} - ${new Date(periodoFine).toLocaleDateString('it-IT')}`
  
  const righeTabella = prestazioni.map(p => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.data}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.locale}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.codice}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€ ${p.compensoNetto}</td>
      ${totaleRitenuta4 > 0 ? `<td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€ ${p.ritenuta4}</td>` : ''}
    </tr>
  `).join('')
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .totali { background: #fff; padding: 15px; border-radius: 8px; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; background: white; }
        th { background: #f3f4f6; padding: 10px; text-align: left; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Richiesta Fattura</h1>
        </div>
        
        <div class="content">
          <p>Gentile <strong>${nomeCompleto}</strong>,</p>
          
          <p>Ti chiediamo cortesemente di inviarci la fattura per i compensi maturati nel periodo <strong>${periodo}</strong>.</p>
          
          <h3>Riepilogo prestazioni:</h3>
          
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Locale</th>
                <th>Rif.</th>
                <th style="text-align: right;">Netto</th>
                ${totaleRitenuta4 > 0 ? '<th style="text-align: right;">Rit. 4%</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${righeTabella}
            </tbody>
          </table>
          
          <div class="totali">
            <table>
              <tr>
                <td><strong>Totale Netto:</strong></td>
                <td style="text-align: right;"><strong>€ ${totaleNetto.toFixed(2)}</strong></td>
              </tr>
              ${totaleRitenuta4 > 0 ? `
              <tr>
                <td>Ritenuta d'acconto 4%:</td>
                <td style="text-align: right;">€ ${totaleRitenuta4.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Totale Imponibile Fattura:</strong></td>
                <td style="text-align: right;"><strong>€ ${totaleImponibile.toFixed(2)}</strong></td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <p style="margin-top: 20px;">
            ${totaleRitenuta4 > 0 
              ? `Ti ricordiamo che in qualità di sostituto d'imposta applicheremo la ritenuta d'acconto del 4%.
                 <br>L'importo della fattura dovrà essere di <strong>€ ${totaleImponibile.toFixed(2)}</strong>.`
              : `L'importo della fattura dovrà essere di <strong>€ ${totaleNetto.toFixed(2)}</strong>.`
            }
          </p>
          
          <p>
            Ti preghiamo di inviare la fattura in formato PDF rispondendo a questa email o caricandola direttamente nel portale.
          </p>
          
          <p>Grazie per la collaborazione!</p>
        </div>
        
        <div class="footer">
          <p>OKL S.r.l. - Gestione Artisti</p>
          <p>Questa è un'email automatica, per favore non rispondere a questo indirizzo.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
