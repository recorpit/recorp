// src/app/api/agibilita/[id]/carica-zip-inps/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parseStringPromise } from 'xml2js'
import AdmZip from 'adm-zip'
import fs from 'fs'
import path from 'path'
import { slugify } from '@/lib/constants'
import { sendEmail, templateEmailAgibilitaArtista, templateEmailAgibilitaLocale } from '@/lib/email'

// Crea directory se non esiste
function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// POST - Carica ZIP INPS (XML risposta + PDF)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'File ZIP mancante' },
        { status: 400 }
      )
    }
    
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'Il file deve essere uno ZIP' },
        { status: 400 }
      )
    }
    
    // Carica agibilità
    const agibilita = await prisma.agibilita.findUnique({
      where: { id },
      include: {
        locale: true,
        committente: true,
        artisti: {
          include: {
            artista: true
          }
        }
      }
    })
    
    if (!agibilita) {
      return NextResponse.json(
        { error: 'Agibilità non trovata' },
        { status: 404 }
      )
    }

    if (!agibilita.locale) {
      return NextResponse.json(
        { error: 'Agibilità senza locale associato' },
        { status: 400 }
      )
    }
    
    // Converti File in Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Estrai ZIP in memoria
    const zip = new AdmZip(buffer)
    const zipEntries = zip.getEntries()
    
    // Trova file XML risposta e PDF
    let xmlRispostaEntry: ReturnType<typeof zip.getEntries>[number] | null = null
    let pdfEntry: ReturnType<typeof zip.getEntries>[number] | null = null
    
    for (const entry of zipEntries) {
      const fileName = entry.entryName.toLowerCase()
      
      if (fileName.includes('esitoimportazione') && fileName.endsWith('.xml')) {
        xmlRispostaEntry = entry
      }
      
      if (fileName.includes('riepilogo') && fileName.endsWith('.pdf')) {
        pdfEntry = entry
      }
    }
    
    if (!xmlRispostaEntry) {
      return NextResponse.json(
        { error: 'XML risposta INPS non trovato nello ZIP' },
        { status: 400 }
      )
    }
    
    if (!pdfEntry) {
      return NextResponse.json(
        { error: 'PDF certificato non trovato nello ZIP' },
        { status: 400 }
      )
    }
    
    // Leggi XML risposta
    const xmlContent = xmlRispostaEntry.getData().toString('utf8')
    
    // Parsa XML
    const result = await parseStringPromise(xmlContent, { 
      explicitArray: false,
      mergeAttrs: true 
    })
    
    if (!result.ImportAgibilita) {
      return NextResponse.json(
        { error: 'Formato XML non valido' },
        { status: 400 }
      )
    }
    
    const agibilitaXML = result.ImportAgibilita.ElencoAgibilita?.Agibilita
    
    if (!agibilitaXML) {
      return NextResponse.json(
        { error: 'Nessuna agibilità trovata nel file XML' },
        { status: 400 }
      )
    }
    
    // Estrai dati risposta INPS
    const esito = agibilitaXML.Esito || 'ERRORE'
    const erroreINPS = agibilitaXML.Errore || null
    const identificativoINPS = agibilitaXML.IdentificativoAgibilita 
      ? parseInt(agibilitaXML.IdentificativoAgibilita) 
      : null
    
    const occupazione = agibilitaXML.Occupazioni?.Occupazione
    const identificativoOccupazioneINPS = occupazione?.IdentificativoOccupazione
      ? parseInt(occupazione.IdentificativoOccupazione)
      : null
    
    const periodo = occupazione?.Periodi?.Periodo
    const identificativoPeriodoINPS = periodo?.IdentificativoPeriodo
      ? parseInt(periodo.IdentificativoPeriodo)
      : null
    
    const hashINPS = result.ImportAgibilita.Segnatura?.Hash || null
    
    // Salva PDF nelle cartelle corrette
    const pdfBuffer = pdfEntry.getData()
    
    // Formatta data per nome file (DD-MM-YYYY)
    const dataEvento = new Date(agibilita.data)
    const dataFormattataFile = dataEvento.toLocaleDateString('it-IT').replace(/\//g, '-')
    
    // Nome file: "DD-MM-YYYY nome locale.pdf"
    // Rimuovi caratteri non validi dal nome locale
    const nomeLocalePulito = agibilita.locale.nome
      .replace(/[<>:"/\\|?*]/g, '') // Rimuovi caratteri non validi Windows
      .replace(/\s+/g, ' ')         // Normalizza spazi
      .trim()
    
    const pdfFileName = `${dataFormattataFile} ${nomeLocalePulito}.pdf`
    
    // Path base uploads
    const uploadsBase = path.join(process.cwd(), 'public', 'uploads')
    
    // Cartella locale
    const localeSlug = slugify(agibilita.locale.nome)
    const localePath = path.join(uploadsBase, 'locali', localeSlug, 'agibilita')
    ensureDir(localePath)
    const localePdfPath = path.join(localePath, pdfFileName)
    fs.writeFileSync(localePdfPath, pdfBuffer)
    
    // Path relativo per DB
    const pdfPathRelativo = `/uploads/locali/${localeSlug}/agibilita/${pdfFileName}`
    
    // Se committente diverso dal locale, salva anche lì
    let committenteHasCopia = false
    if (agibilita.committenteId !== agibilita.locale.committenteDefaultId) {
      const committenteSlug = slugify(agibilita.committente!.ragioneSociale)
      const committentePath = path.join(uploadsBase, 'committenti', committenteSlug, 'agibilita')
      ensureDir(committentePath)
      const committentePdfPath = path.join(committentePath, pdfFileName)
      fs.writeFileSync(committentePdfPath, pdfBuffer)
      committenteHasCopia = true
    }
    
    // Aggiorna agibilità
    await prisma.agibilita.update({
      where: { id },
      data: {
        esitoINPS: esito,
        erroreINPS,
        identificativoINPS,
        identificativoOccupazioneINPS,
        identificativoPeriodoINPS,
        hashINPS,
        rispostaINPSAt: new Date(),
        ricevutaINPSPath: pdfPathRelativo,
        ricevutaCaricataAt: new Date(),
        stato: esito === 'OK' ? 'COMPLETATA' : 'ERRORE',
      }
    })
    
    // Aggiorna lavoratori (artisti)
    const lavoratori = Array.isArray(occupazione?.Lavoratori?.Lavoratore)
      ? occupazione.Lavoratori.Lavoratore
      : occupazione?.Lavoratori?.Lavoratore 
        ? [occupazione.Lavoratori.Lavoratore]
        : []
    
    for (const lavoratore of lavoratori) {
      const cf = lavoratore.CodiceFiscale
      const identificativoLavoratoreINPS = lavoratore.IdentificativoLavoratore
        ? parseInt(lavoratore.IdentificativoLavoratore)
        : null
      const matricolaEnpals = lavoratore.MatricolaEnpals || null
      
      // Trova artista corrispondente
      const artistaAgibilita = agibilita.artisti.find(
        (aa: any) => aa.artista.codiceFiscale === cf
      )
      
      if (artistaAgibilita) {
        // Aggiorna ArtistaAgibilita
        await prisma.artistaAgibilita.update({
          where: { id: artistaAgibilita.id },
          data: {
            identificativoLavoratoreINPS
          }
        })
        
        // Aggiorna matricola artista se presente e non già salvata
        if (matricolaEnpals && !artistaAgibilita.artista.matricolaEnpals) {
          await prisma.artista.update({
            where: { id: artistaAgibilita.artistaId },
            data: {
              matricolaEnpals
            }
          })
        }
      }
    }
    
    // ==========================================
    // INVIO EMAIL SE ESITO OK (controlla impostazioni)
    // ==========================================
    let emailInviate = { artisti: 0, committente: false }
    
    if (esito === 'OK') {
      // Carica impostazioni email
      const emailSettings = await prisma.impostazioni.findFirst({
        where: { chiave: 'email' }
      })
      
      const settings = emailSettings 
        ? JSON.parse(emailSettings.valore) 
        : { emailAbilitata: false }
      
      // Invia email solo se sistema abilitato
      if (settings.emailAbilitata) {
        const dataFormattata = new Date(agibilita.data).toLocaleDateString('it-IT', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
        
        const numArtisti = agibilita.artisti.length
        const allegaPdfAdArtista = numArtisti === 1 // Solo se 1 artista
        
        // Email a ogni artista con email (se abilitato)
        if (settings.invioEmailArtista) {
          for (const aa of agibilita.artisti) {
            const artista = aa.artista
            if (artista.email) {
              const template = templateEmailAgibilitaArtista({
                nomeArtista: artista.nome,
                codiceAgibilita: agibilita.codice,
                dataEvento: dataFormattata,
                locale: agibilita.locale.nome,
                compensoNetto: parseFloat(aa.compensoNetto.toString()).toFixed(2),
                allegaPdf: allegaPdfAdArtista
              })
              
              const sent = await sendEmail({
                to: artista.email,
                subject: template.subject,
                html: template.html,
                text: template.text,
                attachments: allegaPdfAdArtista ? [{
                  filename: pdfFileName,
                  content: pdfBuffer,
                  contentType: 'application/pdf'
                }] : undefined
              })
              
              if (sent) emailInviate.artisti++
            }
          }
        }
        
        // Email al COMMITTENTE (se abilitato e ha email)
        if (settings.invioEmailCommittente && agibilita.committente!.email) {
          const artistiNomi = agibilita.artisti.map((aa: any) => 
            aa.artista.nomeDarte || `${aa.artista.cognome} ${aa.artista.nome}`
          )
          
          const template = templateEmailAgibilitaLocale({
            nomeLocale: agibilita.committente!.ragioneSociale,
            codiceAgibilita: agibilita.codice,
            dataEvento: dataFormattata,
            artisti: artistiNomi
          })
          
          const sent = await sendEmail({
            to: agibilita.committente!.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
            attachments: [{
              filename: pdfFileName,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }]
          })
          
          if (sent) emailInviate.committente = true
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      esito,
      identificativoINPS,
      hashINPS,
      pdfPath: pdfPathRelativo,
      pdfSalvatoIn: {
        locale: localeSlug,
        committente: committenteHasCopia ? slugify(agibilita.committente!.ragioneSociale) : null
      },
      lavoratoriAggiornati: lavoratori.length,
      emailInviate,
      erroreINPS
    })
    
  } catch (error) {
    console.error('Errore caricamento ZIP INPS:', error)
    return NextResponse.json(
      { error: 'Errore nel processamento dello ZIP', dettagli: String(error) },
      { status: 500 }
    )
  }
}
