// src/app/api/pagamenti/batch/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { sendEmail, templateEmailFirma } from '@/lib/email'
import { generaPdfRicevuta } from '@/lib/pdf-ricevuta'
import fs from 'fs/promises'
import path from 'path'

// GET - Lista batch o verifica batch pronto
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const checkPending = searchParams.get('checkPending')
    
    if (checkPending === 'true') {
      // Verifica se ci sono prestazioni pronte per generazione
      const oggi = new Date()
      const giorno = oggi.getDate()
      
      // Determina il periodo da considerare
      let dataInizio: Date
      let dataFine: Date
      let periodo: number
      
      if (giorno >= 1 && giorno <= 15) {
        // Siamo nella prima metà: controlliamo eventi 16-fine mese precedente
        const mesePrecedente = new Date(oggi.getFullYear(), oggi.getMonth() - 1, 16)
        const fineMesePrecedente = new Date(oggi.getFullYear(), oggi.getMonth(), 0)
        dataInizio = mesePrecedente
        dataFine = fineMesePrecedente
        periodo = 2
      } else {
        // Siamo nella seconda metà: controlliamo eventi 1-15 mese corrente
        dataInizio = new Date(oggi.getFullYear(), oggi.getMonth(), 1)
        dataFine = new Date(oggi.getFullYear(), oggi.getMonth(), 15, 23, 59, 59)
        periodo = 1
      }
      
      // Trova agibilità completate nel periodo senza prestazione generata
      const agibilitaPronte = await prisma.agibilita.findMany({
        where: {
          stato: 'COMPLETATA',
          data: {
            gte: dataInizio,
            lte: dataFine,
          },
          // Escludi quelle già con prestazione (check via artisti)
        },
        include: {
          artisti: {
            include: {
              artista: true
            }
          },
          committente: true,
          locale: true,
        }
      })
      
      // Filtra: solo normali O a rischio GIÀ incassate
      const agibilitaValide = agibilitaPronte.filter(ag => {
        if (!ag.committente.aRischio) return true
        // Se a rischio, controlla se fattura pagata
        return ag.statoFattura === 'PAGATA'
      })
      
      // Raggruppa per artista
      const artistiMap = new Map<string, any[]>()
      
      for (const ag of agibilitaValide) {
        for (const aa of ag.artisti) {
          const artistaId = aa.artistaId
          if (!artistiMap.has(artistaId)) {
            artistiMap.set(artistaId, [])
          }
          artistiMap.get(artistaId)!.push({
            agibilita: ag,
            compenso: aa
          })
        }
      }
      
      // Verifica dati completi per ogni artista
      const artistiPronti: any[] = []
      const artistiIncompleti: any[] = []
      
      for (const [artistaId, eventi] of artistiMap) {
        const artista = eventi[0].compenso.artista
        const datiMancanti: string[] = []
        
        if (!artista.codiceFiscale) datiMancanti.push('Codice Fiscale')
        if (!artista.indirizzo) datiMancanti.push('Indirizzo')
        if (!artista.cap) datiMancanti.push('CAP')
        if (!artista.citta) datiMancanti.push('Città')
        if (!artista.provincia) datiMancanti.push('Provincia')
        if (!artista.iban) datiMancanti.push('IBAN')
        if (!artista.email) datiMancanti.push('Email')
        
        const totaleNetto = eventi.reduce((sum, e) => sum + parseFloat(e.compenso.compensoNetto), 0)
        const totaleLordo = eventi.reduce((sum, e) => sum + parseFloat(e.compenso.compensoLordo), 0)
        
        const artistaInfo = {
          artista,
          eventi: eventi.length,
          totaleNetto,
          totaleLordo,
          datiMancanti,
          eventiDettaglio: eventi.map(e => ({
            locale: e.agibilita.locale.nome,
            data: e.agibilita.data,
            compensoNetto: e.compenso.compensoNetto,
          }))
        }
        
        if (datiMancanti.length === 0) {
          artistiPronti.push(artistaInfo)
        } else {
          artistiIncompleti.push(artistaInfo)
        }
      }
      
      return NextResponse.json({
        periodo: {
          dataInizio,
          dataFine,
          numero: periodo,
        },
        artistiPronti,
        artistiIncompleti,
        totaleArtistiPronti: artistiPronti.length,
        totaleArtistiIncompleti: artistiIncompleti.length,
        puoGenerare: artistiPronti.length > 0,
      })
    }
    
    // Lista batch esistenti
    const batch = await prisma.batchPagamento.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        _count: {
          select: { prestazioni: true }
        }
      }
    })
    
    return NextResponse.json(batch)
    
  } catch (error) {
    console.error('Errore GET batch:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero batch' },
      { status: 500 }
    )
  }
}

// POST - Genera batch prestazioni
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artistiIds, forza } = body // forza = true per generazione forzata
    
    const oggi = new Date()
    const anno = oggi.getFullYear()
    const mese = oggi.getMonth() + 1
    const giorno = oggi.getDate()
    
    // Determina periodo
    let dataInizio: Date
    let dataFine: Date
    let periodo: number
    
    if (forza) {
      // FORZA: prendi tutte le agibilità completate degli ultimi 60 giorni
      dataInizio = new Date(oggi.getFullYear(), oggi.getMonth() - 2, 1)
      dataFine = oggi
      periodo = 0 // Speciale per forzato
    } else if (giorno >= 1 && giorno <= 15) {
      const mesePrecedente = new Date(oggi.getFullYear(), oggi.getMonth() - 1, 16)
      const fineMesePrecedente = new Date(oggi.getFullYear(), oggi.getMonth(), 0)
      dataInizio = mesePrecedente
      dataFine = fineMesePrecedente
      periodo = 2
    } else {
      dataInizio = new Date(oggi.getFullYear(), oggi.getMonth(), 1)
      dataFine = new Date(oggi.getFullYear(), oggi.getMonth(), 15, 23, 59, 59)
      periodo = 1
    }
    
    // Trova agibilità completate nel periodo
    const agibilitaPronte = await prisma.agibilita.findMany({
      where: {
        stato: 'COMPLETATA',
        data: {
          gte: dataInizio,
          lte: dataFine,
        },
      },
      include: {
        artisti: {
          include: {
            artista: true
          }
        },
        committente: true,
        locale: true,
      }
    })
    
    // Filtra: solo normali O a rischio GIÀ incassate
    const agibilitaValide = agibilitaPronte.filter(ag => {
      if (!ag.committente.aRischio) return true
      return ag.statoFattura === 'PAGATA'
    })
    
    // Raggruppa per artista
    const artistiMap = new Map<string, any[]>()
    
    for (const ag of agibilitaValide) {
      for (const aa of ag.artisti) {
        const artistaId = aa.artistaId
        
        // Se artistiIds specificati, filtra
        if (artistiIds && artistiIds.length > 0 && !artistiIds.includes(artistaId)) {
          continue
        }
        
        const artista = aa.artista
        
        // IMPORTANTE: Solo artisti in PRESTAZIONE_OCCASIONALE
        if (artista.tipoContratto !== 'PRESTAZIONE_OCCASIONALE') {
          continue
        }
        
        // Verifica dati completi
        if (!artista.codiceFiscale || !artista.indirizzo || !artista.cap || 
            !artista.citta || !artista.provincia || !artista.iban || !artista.email) {
          continue
        }
        
        if (!artistiMap.has(artistaId)) {
          artistiMap.set(artistaId, [])
        }
        artistiMap.get(artistaId)!.push({
          agibilita: ag,
          compenso: aa
        })
      }
    }
    
    if (artistiMap.size === 0) {
      return NextResponse.json(
        { error: 'Nessuna prestazione pronta per la generazione' },
        { status: 400 }
      )
    }
    
    // Crea batch
    const progressivoBatch = await prisma.batchPagamento.count({
      where: { anno }
    }) + 1
    
    const codiceBatch = `BP-${anno}-${progressivoBatch.toString().padStart(2, '0')}`
    
    const batch = await prisma.batchPagamento.create({
      data: {
        codice: codiceBatch,
        anno,
        mese,
        periodo,
        dataInizio,
        dataFine,
        dataGenerazione: oggi,
        stato: 'GENERATO',
      }
    })
    
    // Genera prestazioni per ogni artista
    const prestazioniGenerate: any[] = []
    
    for (const [artistaId, eventi] of artistiMap) {
      const artista = eventi[0].compenso.artista
      
      // Calcola totali
      const totaleNettoOriginale = eventi.reduce((sum, e) => sum + parseFloat(e.compenso.compensoNetto), 0)
      const totaleLordoOriginale = eventi.reduce((sum, e) => sum + parseFloat(e.compenso.compensoLordo), 0)
      const totaleRitenutaOriginale = eventi.reduce((sum, e) => sum + parseFloat(e.compenso.ritenuta), 0)
      
      // Ottieni progressivo per artista
      let progressivo = await prisma.progressivoRicevuta.findUnique({
        where: {
          artistaId_anno: { artistaId, anno }
        }
      })
      
      if (!progressivo) {
        progressivo = await prisma.progressivoRicevuta.create({
          data: { artistaId, anno, ultimoNumero: 0 }
        })
      }
      
      const nuovoNumero = progressivo.ultimoNumero + 1
      
      await prisma.progressivoRicevuta.update({
        where: { id: progressivo.id },
        data: { ultimoNumero: nuovoNumero }
      })
      
      // Codice prestazione
      const cfCorto = artista.codiceFiscale?.substring(0, 6) || artistaId.substring(0, 6)
      const codicePrestazione = `PO-${anno}-${cfCorto}-${nuovoNumero.toString().padStart(3, '0')}`
      
      // Token firma
      const tokenFirma = crypto.randomBytes(32).toString('hex')
      const tokenScadenza = new Date(oggi.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 giorni
      
      // Causale bonifico
      const causaleParti = eventi.map(e => 
        `${e.agibilita.locale.nome} ${new Date(e.agibilita.data).toLocaleDateString('it-IT')}`
      )
      const causaleBonifico = `Prestazione ${causaleParti.join(', ')}`
      
      // Agibilità incluse (JSON)
      const agibilitaIncluse = eventi.map(e => ({
        id: e.agibilita.id,
        codice: e.agibilita.codice,
        locale: e.agibilita.locale.nome,
        data: e.agibilita.data,
        compensoLordo: e.compenso.compensoLordo,
        compensoNetto: e.compenso.compensoNetto,
        ritenuta: e.compenso.ritenuta,
      }))
      
      const prestazione = await prisma.prestazioneOccasionale.create({
        data: {
          numero: nuovoNumero,
          anno,
          codice: codicePrestazione,
          artistaId,
          batchId: batch.id,
          agibilitaIncluse,
          compensoLordoOriginale: totaleLordoOriginale,
          compensoNettoOriginale: totaleNettoOriginale,
          ritenutaOriginale: totaleRitenutaOriginale,
          compensoLordo: totaleLordoOriginale,
          compensoNetto: totaleNettoOriginale,
          ritenuta: totaleRitenutaOriginale,
          totalePagato: totaleNettoOriginale,
          stato: 'GENERATA',
          dataEmissione: oggi,
          dataInvioLink: oggi, // TODO: inviare email
          tokenFirma,
          tokenScadenza,
          dataScadenzaLink: tokenScadenza,
          causaleBonifico,
        },
        include: {
          artista: true,
        }
      })
      
      prestazioniGenerate.push(prestazione)
    }
    
    // Aggiorna stats batch
    await prisma.batchPagamento.update({
      where: { id: batch.id },
      data: {
        totalePrestazioniGenerate: prestazioniGenerate.length,
        totaleImporto: prestazioniGenerate.reduce((sum, p) => sum + parseFloat(p.totalePagato), 0),
      }
    })
    
    // INVIO EMAIL AUTOMATICO
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const emailResults: { artista: string; email: string; success: boolean; error?: string }[] = []
    
    // Dati committente da env
    const committente = {
      nome: process.env.AZIENDA_NOME || 'OKL SRL',
      piva: process.env.AZIENDA_PIVA || '04433920248',
      indirizzo: process.env.AZIENDA_INDIRIZZO || 'Via Monte Pasubio - 36010 Zanè (VI)'
    }
    
    for (const prestazione of prestazioniGenerate) {
      const artista = prestazione.artista
      
      if (!artista.email) {
        emailResults.push({
          artista: `${artista.cognome} ${artista.nome}`,
          email: '',
          success: false,
          error: 'Email mancante'
        })
        continue
      }
      
      const linkFirma = `${baseUrl}/firma/${prestazione.tokenFirma}`
      const scadenzaLink = new Date(prestazione.tokenScadenza).toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      
      const agibilitaIncluse = prestazione.agibilitaIncluse as any[] || []
      
      const emailData = templateEmailFirma({
        nomeArtista: artista.nome || '',
        cognomeArtista: artista.cognome || '',
        codice: prestazione.codice || '',
        importoNetto: parseFloat(prestazione.compensoNetto as any).toFixed(2),
        linkFirma,
        scadenzaLink,
        prestazioni: agibilitaIncluse.map((ag: any) => ({
          locale: ag.locale || 'N/D',
          data: ag.data ? new Date(ag.data).toLocaleDateString('it-IT') : 'N/D'
        })),
      })
      
      try {
        // Genera PDF ricevuta
        const pdfBuffer = await generaPdfRicevuta({
          numero: prestazione.numero,
          anno: prestazione.anno,
          codice: prestazione.codice || '',
          dataEmissione: prestazione.dataEmissione || new Date(),
          artista: {
            nome: artista.nome || '',
            cognome: artista.cognome || '',
            codiceFiscale: artista.codiceFiscale || '',
            indirizzo: artista.indirizzo || '',
            cap: artista.cap || '',
            citta: artista.citta || '',
            provincia: artista.provincia || '',
          },
          committente,
          prestazioni: agibilitaIncluse.map((ag: any) => ({
            locale: ag.locale || 'N/D',
            data: new Date(ag.data),
            descrizione: 'Prestazione artistica'
          })),
          compensoLordo: parseFloat(prestazione.compensoLordo as any),
          ritenuta: parseFloat(prestazione.ritenuta as any),
          compensoNetto: parseFloat(prestazione.compensoNetto as any),
          rimborsoSpese: 0,
          totalePagato: parseFloat(prestazione.totalePagato as any),
        })
        
        // Salva PDF su disco
        // Struttura: /ricevute/COGNOME_NOME_CF/YYYY-MM/Ricevuta_XXX.pdf
        const cfClean = (artista.codiceFiscale || 'NOCODE').toUpperCase()
        const nomeClean = `${artista.cognome}_${artista.nome}`.toUpperCase().replace(/[^A-Z0-9_]/g, '')
        const cartellaArtista = `${nomeClean}_${cfClean}`
        
        // Mese di riferimento dalla prima agibilità
        const primaAgibilita = agibilitaIncluse[0]
        const dataRif = primaAgibilita?.data ? new Date(primaAgibilita.data) : new Date()
        const meseRif = `${dataRif.getFullYear()}-${String(dataRif.getMonth() + 1).padStart(2, '0')}`
        
        const baseDir = process.env.RICEVUTE_DIR || path.join(process.cwd(), 'ricevute')
        const targetDir = path.join(baseDir, cartellaArtista, meseRif)
        const fileName = `Ricevuta_${prestazione.codice}.pdf`
        const filePath = path.join(targetDir, fileName)
        
        // Crea cartella se non esiste
        await fs.mkdir(targetDir, { recursive: true })
        
        // Salva PDF
        await fs.writeFile(filePath, pdfBuffer)
        
        // Path relativo per database
        const pdfPathRelativo = path.join(cartellaArtista, meseRif, fileName)
        
        const success = await sendEmail({
          to: artista.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
          attachments: [{
            filename: fileName,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }]
        })
        
        // Aggiorna database con path PDF
        await prisma.prestazioneOccasionale.update({
          where: { id: prestazione.id },
          data: { 
            dataInvioLink: success ? new Date() : undefined,
            pdfPath: pdfPathRelativo
          }
        })
        
        emailResults.push({
          artista: `${artista.cognome} ${artista.nome}`,
          email: artista.email,
          success,
          error: success ? undefined : 'Errore SMTP'
        })
      } catch (err) {
        emailResults.push({
          artista: `${artista.cognome} ${artista.nome}`,
          email: artista.email,
          success: false,
          error: String(err)
        })
      }
    }
    
    const emailInviate = emailResults.filter(r => r.success).length
    const emailFallite = emailResults.filter(r => !r.success).length
    
    return NextResponse.json({
      success: true,
      batch,
      prestazioniGenerate: prestazioniGenerate.length,
      email: {
        inviate: emailInviate,
        fallite: emailFallite,
        dettagli: emailResults
      },
      prestazioni: prestazioniGenerate.map(p => ({
        codice: p.codice,
        artista: `${p.artista.cognome} ${p.artista.nome}`,
        totale: p.totalePagato,
        linkFirma: `/firma/${p.tokenFirma}`,
      }))
    })
    
  } catch (error) {
    console.error('Errore POST batch:', error)
    return NextResponse.json(
      { error: 'Errore nella generazione batch', dettagli: String(error) },
      { status: 500 }
    )
  }
}
