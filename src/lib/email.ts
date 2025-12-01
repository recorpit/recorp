// src/lib/email.ts
import nodemailer from 'nodemailer'

// Configurazione SMTP da variabili ambiente
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true per 465, false per altri
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Dati mittente
const FROM_NAME = process.env.SMTP_FROM_NAME || 'OKL SRL'
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: {
    filename: string
    content: Buffer
    contentType?: string
  }[]
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    })
    return true
  } catch (error) {
    console.error('Errore invio email:', error)
    return false
  }
}

// Template email per firma prestazione
export function templateEmailFirma(params: {
  nomeArtista: string
  cognomeArtista: string
  codice: string
  importoNetto: string
  linkFirma: string
  scadenzaLink: string
  prestazioni: { locale: string; data: string }[]
}): { subject: string; html: string; text: string } {
  
  const prestazioniHtml = params.prestazioni
    .map(p => `<li>${p.locale} - ${p.data}</li>`)
    .join('')
  
  const prestazioniText = params.prestazioni
    .map(p => `  • ${p.locale} - ${p.data}`)
    .join('\n')

  const subject = `Ricevuta prestazione ${params.codice} - Firma richiesta`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #2563eb; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .amount { font-size: 24px; font-weight: bold; color: #059669; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">🎭 OKL SRL</h1>
      <p style="margin:5px 0 0;">Ricevuta Prestazione Occasionale</p>
    </div>
    
    <div class="content">
      <p>Ciao <strong>${params.nomeArtista}</strong>,</p>
      
      <p>è pronta la ricevuta per le tue prestazioni:</p>
      
      <ul>
        ${prestazioniHtml}
      </ul>
      
      <p>Importo netto da ricevere:</p>
      <p class="amount">€${params.importoNetto}</p>
      
      <p>Per procedere al pagamento, clicca il bottone qui sotto per firmare digitalmente la ricevuta:</p>
      
      <p style="text-align: center;">
        <a href="${params.linkFirma}" class="button">✍️ Firma la Ricevuta</a>
      </p>
      
      <div class="warning">
        ⚠️ <strong>Importante:</strong> Il link scade il <strong>${params.scadenzaLink}</strong>. 
        Dopo la scadenza dovrai richiedere un nuovo link.
      </div>
      
      <p>Nella pagina di firma potrai:</p>
      <ul>
        <li>Verificare i dati della ricevuta</li>
        <li>Richiedere un rimborso spese (se hai documentazione)</li>
        <li>Scegliere pagamento anticipato (-5€) o standard (15 giorni)</li>
      </ul>
      
      <p>Se hai domande, rispondi a questa email.</p>
      
      <p>Grazie,<br><strong>OKL SRL</strong></p>
    </div>
    
    <div class="footer">
      <p>OKL SRL - Via Monte Pasubio - 36010 Zanè (VI)<br>
      P.IVA 04433920248</p>
      <p style="color: #9ca3af; font-size: 10px;">
        Se il bottone non funziona, copia questo link nel browser:<br>
        ${params.linkFirma}
      </p>
    </div>
  </div>
</body>
</html>
  `
  
  const text = `
Ciao ${params.nomeArtista},

è pronta la ricevuta per le tue prestazioni:

${prestazioniText}

Importo netto da ricevere: €${params.importoNetto}

Per procedere al pagamento, clicca il link seguente per firmare digitalmente la ricevuta:

${params.linkFirma}

⚠️ IMPORTANTE: Il link scade il ${params.scadenzaLink}.

Nella pagina di firma potrai:
- Verificare i dati della ricevuta
- Richiedere un rimborso spese (se hai documentazione)
- Scegliere pagamento anticipato (-5€) o standard (15 giorni)

Se hai domande, rispondi a questa email.

Grazie,
OKL SRL

---
OKL SRL - Via Monte Pasubio - 36010 Zanè (VI)
P.IVA 04433920248
  `
  
  return { subject, html, text }
}

// Template sollecito
export function templateEmailSollecito(params: {
  nomeArtista: string
  codice: string
  linkFirma: string
  scadenzaLink: string
}): { subject: string; html: string; text: string } {
  
  const subject = `⚠️ Sollecito: Firma ricevuta ${params.codice}`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #2563eb; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">⚠️ Sollecito Firma</h1>
    </div>
    
    <div class="content">
      <p>Ciao <strong>${params.nomeArtista}</strong>,</p>
      
      <p>ti ricordiamo che la ricevuta <strong>${params.codice}</strong> è ancora in attesa della tua firma.</p>
      
      <div class="warning">
        ⚠️ Il link scadrà il <strong>${params.scadenzaLink}</strong>!
      </div>
      
      <p style="text-align: center;">
        <a href="${params.linkFirma}" class="button">✍️ Firma Ora</a>
      </p>
      
      <p>Senza la tua firma non possiamo procedere al pagamento.</p>
      
      <p>Grazie,<br><strong>OKL SRL</strong></p>
    </div>
    
    <div class="footer">
      <p>OKL SRL - Via Monte Pasubio - 36010 Zanè (VI)</p>
    </div>
  </div>
</body>
</html>
  `
  
  const text = `
Ciao ${params.nomeArtista},

ti ricordiamo che la ricevuta ${params.codice} è ancora in attesa della tua firma.

⚠️ Il link scadrà il ${params.scadenzaLink}!

Clicca qui per firmare: ${params.linkFirma}

Senza la tua firma non possiamo procedere al pagamento.

Grazie,
OKL SRL
  `
  
  return { subject, html, text }
}

// ============================================
// EMAIL ARTISTA - INVITO ISCRIZIONE
// ============================================

export function templateEmailInvitoArtista(params: {
  nome: string
  cognome: string
}): { subject: string; html: string; text: string } {
  
  const subject = `[OKL SRL] Completa la tua iscrizione`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">🎭 OKL SRL</h1>
    </div>
    <div class="content">
      <h2>Benvenuto/a ${params.nome}!</h2>
      <p>Sei stato/a registrato/a nel sistema RECORP per la gestione delle agibilità INPS.</p>
      <p>Per completare la tua iscrizione e ricevere i documenti delle tue prestazioni, ti chiediamo di fornire i dati mancanti:</p>
      <ul>
        <li>Documento di identità</li>
        <li>Indirizzo di residenza</li>
        <li>IBAN per i pagamenti</li>
        <li>Data e luogo di nascita</li>
      </ul>
      <p>Se hai domande, rispondi a questa email.</p>
      <p>Grazie,<br><strong>OKL SRL</strong></p>
    </div>
    <div class="footer">
      <p>OKL SRL - Via Monte Pasubio - 36010 Zanè (VI)<br>P.IVA 04433920248</p>
    </div>
  </div>
</body>
</html>
  `
  
  const text = `
Benvenuto/a ${params.nome}!

Sei stato/a registrato/a nel sistema RECORP per la gestione delle agibilità INPS.

Per completare la tua iscrizione, ti chiediamo di fornire:
- Documento di identità
- Indirizzo di residenza
- IBAN per i pagamenti
- Data e luogo di nascita

Se hai domande, rispondi a questa email.

Grazie,
OKL SRL
  `
  
  return { subject, html, text }
}

// ============================================
// EMAIL ARTISTA - NUOVA AGIBILITÀ CONFERMATA
// ============================================

export function templateEmailAgibilitaArtista(params: {
  nomeArtista: string
  codiceAgibilita: string
  dataEvento: string
  locale: string
  compensoNetto: string
  allegaPdf: boolean
}): { subject: string; html: string; text: string } {
  
  const subject = `[Agibilità ${params.codiceAgibilita}] ${params.locale} - ${params.dataEvento}`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 15px 0; }
    .compenso { font-size: 24px; font-weight: bold; color: #059669; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">✅ Agibilità Confermata</h1>
    </div>
    <div class="content">
      <p>Ciao <strong>${params.nomeArtista}</strong>,</p>
      <p>L'agibilità INPS per la tua prestazione è stata confermata.</p>
      
      <div class="info-box">
        <p><strong>📋 Codice:</strong> ${params.codiceAgibilita}</p>
        <p><strong>📅 Data:</strong> ${params.dataEvento}</p>
        <p><strong>📍 Locale:</strong> ${params.locale}</p>
        <p><strong>💰 Compenso Netto:</strong> <span class="compenso">€${params.compensoNetto}</span></p>
      </div>
      
      ${params.allegaPdf ? '<p>📎 In allegato trovi il certificato di agibilità.</p>' : ''}
      
      <p>Per qualsiasi informazione, contattaci.</p>
      <p>Grazie,<br><strong>OKL SRL</strong></p>
    </div>
    <div class="footer">
      <p>OKL SRL - Via Monte Pasubio - 36010 Zanè (VI)<br>P.IVA 04433920248</p>
    </div>
  </div>
</body>
</html>
  `
  
  const text = `
Ciao ${params.nomeArtista},

L'agibilità INPS per la tua prestazione è stata confermata.

📋 Codice: ${params.codiceAgibilita}
📅 Data: ${params.dataEvento}
📍 Locale: ${params.locale}
💰 Compenso Netto: €${params.compensoNetto}

${params.allegaPdf ? 'In allegato trovi il certificato di agibilità.' : ''}

Per qualsiasi informazione, contattaci.

Grazie,
OKL SRL
  `
  
  return { subject, html, text }
}

// ============================================
// EMAIL LOCALE - CERTIFICATO AGIBILITÀ
// ============================================

export function templateEmailAgibilitaLocale(params: {
  nomeLocale: string
  codiceAgibilita: string
  dataEvento: string
  artisti: string[]
}): { subject: string; html: string; text: string } {
  
  const listaArtisti = params.artisti.join(', ')
  const subject = `[Agibilità ${params.codiceAgibilita}] Certificato per ${params.dataEvento}`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">🎭 Certificato Agibilità</h1>
    </div>
    <div class="content">
      <p>Gentile <strong>${params.nomeLocale}</strong>,</p>
      <p>In allegato il certificato di agibilità INPS per la prestazione artistica.</p>
      
      <div class="info-box">
        <p><strong>📋 Codice:</strong> ${params.codiceAgibilita}</p>
        <p><strong>📅 Data:</strong> ${params.dataEvento}</p>
        <p><strong>🎤 Artisti:</strong> ${listaArtisti}</p>
      </div>
      
      <p>Cordiali saluti,<br><strong>OKL SRL</strong></p>
    </div>
    <div class="footer">
      <p>OKL SRL - Via Monte Pasubio - 36010 Zanè (VI)<br>P.IVA 04433920248</p>
    </div>
  </div>
</body>
</html>
  `
  
  const text = `
Gentile ${params.nomeLocale},

In allegato il certificato di agibilità INPS per la prestazione artistica.

📋 Codice: ${params.codiceAgibilita}
📅 Data: ${params.dataEvento}
🎤 Artisti: ${listaArtisti}

Cordiali saluti,
OKL SRL
  `
  
  return { subject, html, text }
}
