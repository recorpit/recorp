// src/app/api/firma/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Recupera prestazione da firmare tramite token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    
    const prestazione = await prisma.prestazioneOccasionale.findUnique({
      where: { tokenFirma: token },
      include: {
        artista: true,
      }
    })
    
    if (!prestazione) {
      return NextResponse.json(
        { error: 'Link non valido o prestazione non trovata' },
        { status: 404 }
      )
    }
    
    // Verifica scadenza
    if (prestazione.tokenScadenza && new Date() > prestazione.tokenScadenza) {
      return NextResponse.json(
        { error: 'Il link è scaduto. Contatta OKL SRL per un nuovo link.' },
        { status: 410 }
      )
    }
    
    // Verifica se già firmata
    if (prestazione.stato === 'FIRMATA' || prestazione.stato === 'PAGABILE' || 
        prestazione.stato === 'IN_DISTINTA' || prestazione.stato === 'PAGATA') {
      return NextResponse.json({
        giaFirmata: true,
        dataFirma: prestazione.dataFirma,
        prestazione: {
          codice: prestazione.codice,
          artista: `${prestazione.artista.cognome} ${prestazione.artista.nome}`,
        }
      })
    }
    
    // Calcola se può richiedere anticipo (-5€)
    const compensoNetto = parseFloat(prestazione.compensoNetto as any)
    const puoAnticipare = compensoNetto <= 200
    
    // Calcola max rimborso spese (50% del netto)
    const maxRimborsoSpese = compensoNetto * 0.5
    
    // Numero proposto (quello già assegnato o prossimo)
    const numeroProposto = prestazione.numero
    
    return NextResponse.json({
      prestazione: {
        codice: prestazione.codice,
        numero: prestazione.numero,
        anno: prestazione.anno,
        dataEmissione: prestazione.dataEmissione,
        agibilitaIncluse: prestazione.agibilitaIncluse,
        compensoLordo: prestazione.compensoLordo,
        compensoNetto: prestazione.compensoNetto,
        ritenuta: prestazione.ritenuta,
        totalePagato: prestazione.totalePagato,
        causaleBonifico: prestazione.causaleBonifico,
      },
      artista: {
        nome: prestazione.artista.nome,
        cognome: prestazione.artista.cognome,
        codiceFiscale: prestazione.artista.codiceFiscale,
        indirizzo: prestazione.artista.indirizzo,
        cap: prestazione.artista.cap,
        citta: prestazione.artista.citta,
        provincia: prestazione.artista.provincia,
      },
      opzioni: {
        puoAnticipare,
        scontoAnticipo: 5,
        maxRimborsoSpese,
      },
      numeroProposto,
      scadenzaLink: prestazione.tokenScadenza,
    })
    
  } catch (error) {
    console.error('Errore GET firma:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero della prestazione' },
      { status: 500 }
    )
  }
}

// POST - Firma prestazione
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { 
      numeroRicevuta,
      tipoPagamento, 
      rimborsoSpese, 
      accettazione,
      firmaNome,
      firmaCognome,
    } = body
    
    const prestazione = await prisma.prestazioneOccasionale.findUnique({
      where: { tokenFirma: token },
      include: {
        artista: true,
      }
    })
    
    if (!prestazione) {
      return NextResponse.json(
        { error: 'Link non valido' },
        { status: 404 }
      )
    }
    
    // Verifica scadenza
    if (prestazione.tokenScadenza && new Date() > prestazione.tokenScadenza) {
      return NextResponse.json(
        { error: 'Il link è scaduto' },
        { status: 410 }
      )
    }
    
    // Verifica già firmata
    if (prestazione.dataFirma) {
      return NextResponse.json(
        { error: 'Prestazione già firmata' },
        { status: 400 }
      )
    }
    
    // Validazioni
    if (!accettazione) {
      return NextResponse.json(
        { error: 'Devi accettare le condizioni per firmare' },
        { status: 400 }
      )
    }
    
    if (!firmaNome || !firmaCognome) {
      return NextResponse.json(
        { error: 'Nome e cognome obbligatori' },
        { status: 400 }
      )
    }
    
    // Verifica corrispondenza nome
    const nomeAtteso = prestazione.artista.nome?.toLowerCase().trim()
    const cognomeAtteso = prestazione.artista.cognome?.toLowerCase().trim()
    const nomeInserito = firmaNome.toLowerCase().trim()
    const cognomeInserito = firmaCognome.toLowerCase().trim()
    
    if (nomeInserito !== nomeAtteso || cognomeInserito !== cognomeAtteso) {
      return NextResponse.json(
        { error: 'Nome e cognome non corrispondono ai dati registrati' },
        { status: 400 }
      )
    }
    
    // Calcola importi
    const compensoNettoOriginale = parseFloat(prestazione.compensoNettoOriginale as any)
    const compensoLordoOriginale = parseFloat(prestazione.compensoLordoOriginale as any)
    const ritenutaOriginale = parseFloat(prestazione.ritenutaOriginale as any)
    
    let rimborsoSpeseFinal = 0
    let scontoAnticipo = 0
    let compensoNetto = compensoNettoOriginale
    let compensoLordo = compensoLordoOriginale
    let ritenuta = ritenutaOriginale
    
    // Rimborso spese
    if (rimborsoSpese && rimborsoSpese > 0) {
      const maxRimborso = compensoNettoOriginale * 0.5
      rimborsoSpeseFinal = Math.min(rimborsoSpese, maxRimborso)
      
      // Ricalcola: netto resta uguale, ma lordo e ritenuta diminuiscono
      // Nuovo netto = originale - rimborso
      // Nuovo lordo = nuovo netto / 0.8
      compensoNetto = compensoNettoOriginale - rimborsoSpeseFinal
      compensoLordo = compensoNetto / 0.8
      ritenuta = compensoLordo * 0.2
    }
    
    // Anticipo -5€
    if (tipoPagamento === 'ANTICIPATO' && compensoNettoOriginale <= 200) {
      scontoAnticipo = 5
    }
    
    // Totale pagato
    const totalePagato = compensoNetto + rimborsoSpeseFinal - scontoAnticipo
    
    // Data scadenza pagamento
    const oggi = new Date()
    let dataScadenzaPagamento: Date
    
    if (tipoPagamento === 'ANTICIPATO') {
      dataScadenzaPagamento = oggi // Immediato
    } else {
      dataScadenzaPagamento = new Date(oggi.getTime() + 15 * 24 * 60 * 60 * 1000) // 15 giorni
    }
    
    // Ottieni IP e User Agent
    const firmaIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const firmaUserAgent = request.headers.get('user-agent') || 'unknown'
    
    // Gestione numero ricevuta
    let numeroFinale = prestazione.numero
    const anno = prestazione.anno
    
    if (numeroRicevuta && numeroRicevuta !== prestazione.numero) {
      numeroFinale = numeroRicevuta
      
      // Aggiorna progressivo se il nuovo numero è maggiore
      const progressivo = await prisma.progressivoRicevuta.findUnique({
        where: {
          artistaId_anno: { 
            artistaId: prestazione.artistaId, 
            anno 
          }
        }
      })
      
      if (progressivo && numeroRicevuta > progressivo.ultimoNumero) {
        await prisma.progressivoRicevuta.update({
          where: { id: progressivo.id },
          data: { ultimoNumero: numeroRicevuta }
        })
      } else if (!progressivo) {
        await prisma.progressivoRicevuta.create({
          data: {
            artistaId: prestazione.artistaId,
            anno,
            ultimoNumero: numeroRicevuta
          }
        })
      }
      
      // Aggiorna codice prestazione
      const cfCorto = prestazione.artista.codiceFiscale?.substring(0, 6) || prestazione.artistaId.substring(0, 6)
      const nuovoCodice = `PO-${anno}-${cfCorto}-${numeroFinale.toString().padStart(3, '0')}`
      
      await prisma.prestazioneOccasionale.update({
        where: { id: prestazione.id },
        data: { 
          numero: numeroFinale,
          codice: nuovoCodice
        }
      })
    }
    
    // Aggiorna prestazione
    const updated = await prisma.prestazioneOccasionale.update({
      where: { id: prestazione.id },
      data: {
        stato: 'PAGABILE',
        tipoPagamento: tipoPagamento || 'STANDARD',
        rimborsoSpese: rimborsoSpeseFinal > 0 ? rimborsoSpeseFinal : null,
        compensoLordo,
        compensoNetto,
        ritenuta,
        scontoAnticipo,
        totalePagato,
        dataFirma: oggi,
        dataScadenzaPagamento,
        firmaNome,
        firmaCognome,
        firmaIP,
        firmaUserAgent,
        firmaAccettazione: true,
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Prestazione firmata con successo',
      dettagli: {
        codice: updated.codice,
        compensoNetto: updated.compensoNetto,
        rimborsoSpese: updated.rimborsoSpese,
        scontoAnticipo: updated.scontoAnticipo,
        totalePagato: updated.totalePagato,
        dataScadenzaPagamento: updated.dataScadenzaPagamento,
        tipoPagamento: updated.tipoPagamento,
      }
    })
    
  } catch (error) {
    console.error('Errore POST firma:', error)
    return NextResponse.json(
      { error: 'Errore nella firma', dettagli: String(error) },
      { status: 500 }
    )
  }
}
