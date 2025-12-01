// src/app/api/agibilita/import-massivo-zip/route.ts
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

interface ImportResult {
  fileName: string
  success: boolean
  agibilitaId?: string
  agibilitaCodice?: string
  esito?: string
  error?: string
  matchedBy?: string
  emailInviate?: { artisti: number; committente: boolean }
}

// POST - Import massivo ZIP INPS
export async function POST(request: NextRequest) {
  const results: ImportResult[] = []
  
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Nessun file ZIP caricato' },
        { status: 400 }
      )
    }
    
    // Carica impostazioni email una volta sola
    const emailSettings = await prisma.impostazioni.findFirst({
      where: { chiave: 'email' }
    })
    const settings = emailSettings 
      ? JSON.parse(emailSettings.valore) 
      : { emailAbilitata: false }
    
    // Processa ogni file
    for (const file of files) {
      const result = await processZipFile(file, settings)
      results.push(result)
    }
    
    // Calcola statistiche
    const stats = {
      totale: results.length,
      successi: results.filter(r => r.success).length,
      errori: results.filter(r => !r.success).length,
      emailArtistiInviate: results.reduce((acc, r) => acc + (r.emailInviate?.artisti || 0), 0),
      emailCommittentiInviate: results.filter(r => r.emailInviate?.committente).length,
    }
    
    return NextResponse.json({
      success: true,
      stats,
      results
    })
    
  } catch (error) {
    console.error('Errore import massivo ZIP:', error)
    return NextResponse.json(
      { error: 'Errore nel processamento', dettagli: String(error) },
      { status: 500 }
    )
  }
}

async function processZipFile(file: File, emailSettings: any): Promise<ImportResult> {
  const fileName = file.name
  
  try {
    // Verifica estensione
    if (!fileName.endsWith('.zip')) {
      return { fileName, success: false, error: 'Non è un file ZIP' }
    }
    
    // Converti File in Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Estrai ZIP
    const zip = new AdmZip(buffer)
    const zipEntries = zip.getEntries()
    
    // Trova file XML risposta e PDF
    let xmlRispostaEntry = null
    let pdfEntry = null
    
    for (const entry of zipEntries) {
      const entryName = entry.entryName.toLowerCase()
      
      if (entryName.includes('esitoimportazione') && entryName.endsWith('.xml')) {
        xmlRispostaEntry = entry
      }
      
      if (entryName.includes('riepilogo') && entryName.endsWith('.pdf')) {
        pdfEntry = entry
      }
    }
    
    if (!xmlRispostaEntry) {
      return { fileName, success: false, error: 'XML risposta INPS non trovato nello ZIP' }
    }
    
    if (!pdfEntry) {
      return { fileName, success: false, error: 'PDF certificato non trovato nello ZIP' }
    }
    
    // Leggi e parsa XML
    const xmlContent = xmlRispostaEntry.getData().toString('utf8')
    const result = await parseStringPromise(xmlContent, { 
      explicitArray: false,
      mergeAttrs: true 
    })
    
    if (!result.ImportAgibilita) {
      return { fileName, success: false, error: 'Formato XML non valido' }
    }
    
    const agibilitaXML = result.ImportAgibilita.ElencoAgibilita?.Agibilita
    
    if (!agibilitaXML) {
      return { fileName, success: false, error: 'Nessuna agibilità nel file XML' }
    }
    
    // Estrai dati per matching
    const occupazione = agibilitaXML.Occupazioni?.Occupazione
    const periodo = occupazione?.Periodi?.Periodo
    const codiceComuneXML = occupazione?.CodiceComune || agibilitaXML.CodiceComune
    
    // Data prestazione
    const dataDal = periodo?.DataDal
    if (!dataDal) {
      return { fileName, success: false, error: 'Data prestazione non trovata in XML' }
    }
    
    // Lista CF lavoratori
    const lavoratoriXML = Array.isArray(occupazione?.Lavoratori?.Lavoratore)
      ? occupazione.Lavoratori.Lavoratore
      : occupazione?.Lavoratori?.Lavoratore 
        ? [occupazione.Lavoratori.Lavoratore]
        : []
    
    if (lavoratoriXML.length === 0) {
      return { fileName, success: false, error: 'Nessun lavoratore trovato in XML' }
    }
    
    const codiciFiscali = lavoratoriXML.map((l: any) => l.CodiceFiscale).filter(Boolean)
    
    // === MATCHING: Cerca agibilità nel DB ===
    const dataInizio = new Date(dataDal)
    dataInizio.setHours(0, 0, 0, 0)
    const dataFine = new Date(dataDal)
    dataFine.setHours(23, 59, 59, 999)
    
    // Prima prova: Data + CF + Codice Belfiore
    let agibilita = await prisma.agibilita.findFirst({
      where: {
        data: {
          gte: dataInizio,
          lte: dataFine
        },
        locale: {
          codiceBelfiore: codiceComuneXML
        },
        artisti: {
          some: {
            artista: {
              codiceFiscale: { in: codiciFiscali }
            }
          }
        },
        // Non già completata/elaborata
        identificativoINPS: null
      },
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
    
    let matchedBy = 'data+cf+belfiore'
    
    // Fallback: Data + CF (senza Belfiore)
    if (!agibilita) {
      agibilita = await prisma.agibilita.findFirst({
        where: {
          data: {
            gte: dataInizio,
            lte: dataFine
          },
          artisti: {
            some: {
              artista: {
                codiceFiscale: { in: codiciFiscali }
              }
            }
          },
          identificativoINPS: null
        },
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
      matchedBy = 'data+cf'
    }
    
    if (!agibilita) {
      return { 
        fileName, 
        success: false, 
        error: `Agibilità non trovata per data ${dataDal} e CF: ${codiciFiscali.join(', ')}` 
      }
    }
    
    // === PROCESSA (stessa logica dell'endpoint singolo) ===
    
    // Estrai dati risposta INPS
    const esito = agibilitaXML.Esito || 'ERRORE'
    const erroreINPS = agibilitaXML.Errore || null
    const identificativoINPS = agibilitaXML.IdentificativoAgibilita 
      ? parseInt(agibilitaXML.IdentificativoAgibilita) 
      : null
    
    const identificativoOccupazioneINPS = occupazione?.IdentificativoOccupazione
      ? parseInt(occupazione.IdentificativoOccupazione)
      : null
    
    const identificativoPeriodoINPS = periodo?.IdentificativoPeriodo
      ? parseInt(periodo.IdentificativoPeriodo)
      : null
    
    const hashINPS = result.ImportAgibilita.Segnatura?.Hash || null
    
    // Salva PDF
    const pdfBuffer = pdfEntry.getData()
    
    const dataEvento = new Date(agibilita.data)
    const dataFormattataFile = dataEvento.toLocaleDateString('it-IT').replace(/\//g, '-')
    
    const nomeLocalePulito = agibilita.locale.nome
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    const pdfFileName = `${dataFormattataFile} ${nomeLocalePulito}.pdf`
    
    const uploadsBase = path.join(process.cwd(), 'public', 'uploads')
    
    // Cartella locale
    const localeSlug = slugify(agibilita.locale.nome)
    const localePath = path.join(uploadsBase, 'locali', localeSlug, 'agibilita')
    ensureDir(localePath)
    const localePdfPath = path.join(localePath, pdfFileName)
    fs.writeFileSync(localePdfPath, pdfBuffer)
    
    const pdfPathRelativo = `/uploads/locali/${localeSlug}/agibilita/${pdfFileName}`
    
    // Copia per committente se diverso
    if (agibilita.committenteId !== agibilita.locale.committenteDefaultId) {
      const committenteSlug = slugify(agibilita.committente.ragioneSociale)
      const committentePath = path.join(uploadsBase, 'committenti', committenteSlug, 'agibilita')
      ensureDir(committentePath)
      fs.writeFileSync(path.join(committentePath, pdfFileName), pdfBuffer)
    }
    
    // Aggiorna DB
    await prisma.agibilita.update({
      where: { id: agibilita.id },
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
    
    // Aggiorna lavoratori
    for (const lavoratore of lavoratoriXML) {
      const cf = lavoratore.CodiceFiscale
      const identificativoLavoratoreINPS = lavoratore.IdentificativoLavoratore
        ? parseInt(lavoratore.IdentificativoLavoratore)
        : null
      const matricolaEnpals = lavoratore.MatricolaEnpals || null
      
      const artistaAgibilita = agibilita.artisti.find(
        (aa: any) => aa.artista.codiceFiscale === cf
      )
      
      if (artistaAgibilita) {
        await prisma.artistaAgibilita.update({
          where: { id: artistaAgibilita.id },
          data: { identificativoLavoratoreINPS }
        })
        
        if (matricolaEnpals && !artistaAgibilita.artista.matricolaEnpals) {
          await prisma.artista.update({
            where: { id: artistaAgibilita.artistaId },
            data: { matricolaEnpals }
          })
        }
      }
    }
    
    // === INVIO EMAIL ===
    let emailInviate = { artisti: 0, committente: false }
    
    if (esito === 'OK' && emailSettings.emailAbilitata) {
      const dataFormattata = new Date(agibilita.data).toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      
      const numArtisti = agibilita.artisti.length
      const allegaPdfAdArtista = numArtisti === 1
      
      // Email artisti
      if (emailSettings.invioEmailArtista) {
        for (const aa of agibilita.artisti) {
          const artista = aa.artista
          if (artista.email) {
            try {
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
            } catch (e) {
              console.error(`Errore invio email artista ${artista.email}:`, e)
            }
          }
        }
      }
      
      // Email committente
      if (emailSettings.invioEmailCommittente && agibilita.committente.email) {
        try {
          const artistiNomi = agibilita.artisti.map((aa: any) => 
            aa.artista.nomeDarte || `${aa.artista.cognome} ${aa.artista.nome}`
          )
          
          const template = templateEmailAgibilitaLocale({
            nomeLocale: agibilita.committente.ragioneSociale,
            codiceAgibilita: agibilita.codice,
            dataEvento: dataFormattata,
            artisti: artistiNomi
          })
          
          const sent = await sendEmail({
            to: agibilita.committente.email,
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
        } catch (e) {
          console.error(`Errore invio email committente:`, e)
        }
      }
    }
    
    return {
      fileName,
      success: true,
      agibilitaId: agibilita.id,
      agibilitaCodice: agibilita.codice,
      esito,
      matchedBy,
      emailInviate
    }
    
  } catch (error) {
    console.error(`Errore processamento ${fileName}:`, error)
    return {
      fileName,
      success: false,
      error: `Errore: ${String(error)}`
    }
  }
}