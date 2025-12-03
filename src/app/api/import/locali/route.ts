// /src/app/api/import/locali/route.ts
// API per importare/aggiornare locali con codice Belfiore

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Dati dei locali completi da importare
const localiCompleti = [
  { nome: "VILLA BONIN", indirizzo: "Via dei Frassini 22", citta: "Vicenza", provincia: "VI", cap: "36100", telefono: "0444 912578", codiceBelfiore: "L840" },
  { nome: "ALBERT CLUB", indirizzo: "Via Vecchia Ferriera 22", citta: "Vicenza", provincia: "VI", cap: "36100", telefono: "0444 511180", codiceBelfiore: "L840" },
  { nome: "CLUBBINO", indirizzo: "Via Vecchia Ferriera 22", citta: "Vicenza", provincia: "VI", cap: "36100", telefono: "0444 511180", codiceBelfiore: "L840" },
  { nome: "ANIMA CLUB", indirizzo: "Via G.B. Tiepolo 1", citta: "Spresiano", provincia: "TV", cap: "31027", telefono: "0422 881109", codiceBelfiore: "I925" },
  { nome: "JASHIRA", indirizzo: "Via Primo Maggio 5", citta: "Cavazzale", provincia: "VI", cap: "36010", telefono: "345 2251525", codiceBelfiore: "F556" },
  { nome: "MIDAS CLUB", indirizzo: "Viale S. Lazzaro 108", citta: "Vicenza", provincia: "VI", cap: "36100", telefono: "0444 963963", codiceBelfiore: "L840" },
  { nome: "MELETTE ASIAGO", indirizzo: "Via Melette", citta: "Gallio", provincia: "VI", cap: "36032", telefono: "", codiceBelfiore: "D884" },
  { nome: "BAR CASTEI", indirizzo: "Via Castellani 3", citta: "Asiago", provincia: "VI", cap: "36012", telefono: "0424 462167", codiceBelfiore: "A465" },
  { nome: "BAR SMERALDO", indirizzo: "Via G. Matteotti 192", citta: "Vicenza", provincia: "VI", cap: "36100", telefono: "0444 311800", codiceBelfiore: "L840" },
  { nome: "SHED CLUB", indirizzo: "Via della Libertà 86", citta: "Bassano del Grappa", provincia: "VI", cap: "36061", telefono: "0424 529044", codiceBelfiore: "A703" },
  { nome: "NIGHT AND DAY", indirizzo: "Via Velo 7", citta: "Bassano del Grappa", provincia: "VI", cap: "36061", telefono: "0424 504838", codiceBelfiore: "A703" },
  { nome: "ARYA'S CLUB", indirizzo: "Via Staizza 43", citta: "Castelfranco Veneto", provincia: "TV", cap: "31033", telefono: "331 1276901", codiceBelfiore: "C111" },
  { nome: "MADLEN", indirizzo: "Viale dell'Industria 93", citta: "Trissino", provincia: "VI", cap: "36070", telefono: "0445 160011", codiceBelfiore: "L433" },
  { nome: "DORIAN GRAY", indirizzo: "Via Belobono 13", citta: "Verona", provincia: "VR", cap: "37135", telefono: "045 7612587", codiceBelfiore: "L781" },
  { nome: "MIU DISCO DINNER", indirizzo: "Via Valcesano 136", citta: "Mondolfo", provincia: "PU", cap: "61037", telefono: "347 3971748", codiceBelfiore: "F347" },
  { nome: "VANITA' MANTOVA", indirizzo: "Viale della Favorita 17", citta: "Mantova", provincia: "MN", cap: "46100", telefono: "0376 391467", codiceBelfiore: "E897" },
  { nome: "TWEET CLUB", indirizzo: "Via Giacomo Matteotti 46", citta: "Bassano del Grappa", provincia: "VI", cap: "36061", telefono: "", codiceBelfiore: "A703" },
  { nome: "AL PAKSTALL TENNIS BAR", indirizzo: "Contrada Fontana 19", citta: "Gallio", provincia: "VI", cap: "36032", telefono: "331 2502527", codiceBelfiore: "D884" },
  { nome: "CALA' DEL GOLFO", indirizzo: "Via Andrea Doria", citta: "San Salvo Marina", provincia: "CH", cap: "66050", telefono: "0873 801736", codiceBelfiore: "I148" },
  { nome: "LE VIGNE TERRE DI CONFINE", indirizzo: "Via Perlena 21", citta: "Fara Vicentino", provincia: "VI", cap: "36030", telefono: "0445 1670127", codiceBelfiore: "D496" },
  { nome: "VINO QUOTIDIANO", indirizzo: "Viale Europa 71", citta: "Thiene", provincia: "VI", cap: "36016", telefono: "0445 367145", codiceBelfiore: "L157" },
  { nome: "COLLEGE FERRARA", indirizzo: "Via Arianuova 91", citta: "Ferrara", provincia: "FE", cap: "44121", telefono: "349 0927367", codiceBelfiore: "D548" },
  { nome: "COCOBEACH", indirizzo: "Via Catullo 5", citta: "Lonato del Garda", provincia: "BS", cap: "25017", telefono: "349 5810205", codiceBelfiore: "M312" },
  { nome: "SKYLIGHT DISCO", indirizzo: "Via delle Fontanelle 28", citta: "San Bonifacio", provincia: "VR", cap: "37047", telefono: "045 7612587", codiceBelfiore: "H783" },
  { nome: "COOKIES CLUB", indirizzo: "Via San Bortolo 2", citta: "Pove del Grappa", provincia: "VI", cap: "36020", telefono: "", codiceBelfiore: "G943" },
  { nome: "NORDEST", indirizzo: "Via Pomaroli 67", citta: "Caldogno", provincia: "VI", cap: "36030", telefono: "0444 585180", codiceBelfiore: "B386" },
  { nome: "CASA DEI GELSI", indirizzo: "Via Cavalieri Vittorio Veneto 95", citta: "Rosà", provincia: "VI", cap: "36027", telefono: "0424 561754", codiceBelfiore: "H556" },
  { nome: "POCOLOCO", indirizzo: "Via del Sacro Tugurio 118", citta: "Rivotorto di Assisi", provincia: "PG", cap: "06081", telefono: "338 7222484", codiceBelfiore: "A475" },
  { nome: "BOBADILLA", indirizzo: "Via Pascolo 34", citta: "Dalmine", provincia: "BG", cap: "24044", telefono: "035 561463", codiceBelfiore: "D245" },
  { nome: "MACRILLO", indirizzo: "Via Roma 18", citta: "Gallio", provincia: "VI", cap: "36032", telefono: "333 2346717", codiceBelfiore: "D884" },
  { nome: "ALCATRAZ", indirizzo: "Via Valtellina 25", citta: "Milano", provincia: "MI", cap: "20159", telefono: "02 69016352", codiceBelfiore: "F205" },
  { nome: "PLAYA", indirizzo: "Via Pagnana 46", citta: "Castelfranco Veneto", provincia: "TV", cap: "31033", telefono: "328 4514896", codiceBelfiore: "C111" },
  { nome: "VILLA DELLE ROSE", indirizzo: "Via Misano Monte", citta: "Misano Adriatico", provincia: "RN", cap: "47843", telefono: "393 5027597", codiceBelfiore: "F244" },
  { nome: "VILLA PEGGY", indirizzo: "Via Borgo Padova", citta: "Cittadella", provincia: "PD", cap: "35013", telefono: "", codiceBelfiore: "C743" },
]

// Varianti dei nomi per il matching
const variantiNomi: Record<string, string[]> = {
  "ANIMA CLUB": ["ANIMA"],
  "DORIAN GRAY": ["DORIAN"],
  "MIU DISCO DINNER": ["MIU", "MIU MIU"],
  "AL PAKSTALL TENNIS BAR": ["TENNIS GALLIO"],
  "PLAYA": ["PLAYA LOCA", "PLAYA DISCO"],
}

function normalizzaNome(nome: string): string {
  return nome.toUpperCase().trim()
    .replace(/[''`]/g, "'")
    .replace(/\s+/g, ' ')
}

function trovaNomeCorrispondente(nomeDb: string): string | null {
  const nomeNorm = normalizzaNome(nomeDb)
  
  // Match diretto
  const localeMatch = localiCompleti.find(l => normalizzaNome(l.nome) === nomeNorm)
  if (localeMatch) return localeMatch.nome
  
  // Match con varianti
  for (const [nomeUfficiale, varianti] of Object.entries(variantiNomi)) {
    if (varianti.some(v => normalizzaNome(v) === nomeNorm)) {
      return nomeUfficiale
    }
  }
  
  // Match parziale (contiene)
  const localePartial = localiCompleti.find(l => 
    nomeNorm.includes(normalizzaNome(l.nome)) || 
    normalizzaNome(l.nome).includes(nomeNorm)
  )
  if (localePartial) return localePartial.nome
  
  return null
}

// GET - Lista locali da importare con anteprima
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const dryRun = searchParams.get('dry_run') !== 'false'
  
  const supabase = await createClient()
  
  // Verifica autenticazione
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }
  
  // Recupera locali esistenti dal database
  const { data: localiDb, error: dbError } = await supabase
    .from('locali')
    .select('id, nome, indirizzo, citta, provincia, cap, telefono, codiceBelfiore')
    .order('nome')
  
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  
  // Prepara report di matching
  const report = {
    totaleLocaliDb: localiDb?.length || 0,
    totaleLocaliImport: localiCompleti.length,
    daAggiornare: [] as any[],
    nuovi: [] as any[],
    nonTrovati: [] as string[],
    giaCompleti: [] as string[],
  }
  
  // Analizza ogni locale da importare
  for (const localeImport of localiCompleti) {
    const localeDb = localiDb?.find(l => {
      const nomeCorr = trovaNomeCorrispondente(l.nome)
      return nomeCorr === localeImport.nome
    })
    
    if (localeDb) {
      // Verifica se ha già tutti i dati
      const haIndirizzo = localeDb.indirizzo && localeDb.indirizzo.trim() !== ''
      const haBelfiore = localeDb.codiceBelfiore && localeDb.codiceBelfiore.trim() !== ''
      
      if (haIndirizzo && haBelfiore) {
        report.giaCompleti.push(localeDb.nome)
      } else {
        report.daAggiornare.push({
          id: localeDb.id,
          nomeDb: localeDb.nome,
          nomeImport: localeImport.nome,
          vecchiDati: {
            indirizzo: localeDb.indirizzo,
            citta: localeDb.citta,
            codiceBelfiore: localeDb.codiceBelfiore,
          },
          nuoviDati: localeImport,
        })
      }
    } else {
      // Locale non trovato nel DB - da inserire come nuovo
      report.nuovi.push(localeImport)
    }
  }
  
  // Locali nel DB non matchati
  const localiMatchati = new Set(report.daAggiornare.map(l => l.id))
  const localiGiaCompleti = new Set(
    localiDb?.filter(l => report.giaCompleti.includes(l.nome)).map(l => l.id) || []
  )
  
  localiDb?.forEach(l => {
    if (!localiMatchati.has(l.id) && !localiGiaCompleti.has(l.id)) {
      const nomeCorr = trovaNomeCorrispondente(l.nome)
      if (!nomeCorr) {
        report.nonTrovati.push(l.nome)
      }
    }
  })
  
  return NextResponse.json({
    dryRun,
    report,
    message: dryRun 
      ? 'Anteprima import. Usa POST per eseguire.' 
      : 'Usa POST per eseguire import.',
  })
}

// POST - Esegue l'import/aggiornamento
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  // Verifica autenticazione
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }
  
  // Verifica ruolo admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('ruolo')
    .eq('id', user.id)
    .single()
  
  if (profile?.ruolo !== 'admin' && profile?.ruolo !== 'superadmin') {
    return NextResponse.json({ error: 'Richiesto ruolo admin' }, { status: 403 })
  }
  
  const body = await request.json().catch(() => ({}))
  const { inserisciNuovi = false } = body
  
  // Recupera locali esistenti
  const { data: localiDb, error: dbError } = await supabase
    .from('locali')
    .select('id, nome, indirizzo, citta, provincia, cap, telefono, codiceBelfiore')
  
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  
  const risultati = {
    aggiornati: 0,
    inseriti: 0,
    errori: [] as string[],
    dettagli: [] as any[],
  }
  
  // Aggiorna locali esistenti
  for (const localeImport of localiCompleti) {
    const localeDb = localiDb?.find(l => {
      const nomeCorr = trovaNomeCorrispondente(l.nome)
      return nomeCorr === localeImport.nome
    })
    
    if (localeDb) {
      const { error: updateError } = await supabase
        .from('locali')
        .update({
          indirizzo: localeImport.indirizzo,
          citta: localeImport.citta,
          provincia: localeImport.provincia,
          cap: localeImport.cap,
          telefono: localeImport.telefono || null,
          codiceBelfiore: localeImport.codiceBelfiore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', localeDb.id)
      
      if (updateError) {
        risultati.errori.push(`Errore aggiornamento ${localeDb.nome}: ${updateError.message}`)
      } else {
        risultati.aggiornati++
        risultati.dettagli.push({
          azione: 'UPDATE',
          nome: localeDb.nome,
          codiceBelfiore: localeImport.codiceBelfiore,
        })
      }
    } else if (inserisciNuovi) {
      // Inserisci nuovo locale
      const { error: insertError } = await supabase
        .from('locali')
        .insert({
          nome: localeImport.nome,
          indirizzo: localeImport.indirizzo,
          citta: localeImport.citta,
          provincia: localeImport.provincia,
          cap: localeImport.cap,
          telefono: localeImport.telefono || null,
          codiceBelfiore: localeImport.codiceBelfiore,
          attivo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      
      if (insertError) {
        risultati.errori.push(`Errore inserimento ${localeImport.nome}: ${insertError.message}`)
      } else {
        risultati.inseriti++
        risultati.dettagli.push({
          azione: 'INSERT',
          nome: localeImport.nome,
          codiceBelfiore: localeImport.codiceBelfiore,
        })
      }
    }
  }
  
  return NextResponse.json({
    success: risultati.errori.length === 0,
    risultati,
    message: `Aggiornati: ${risultati.aggiornati}, Inseriti: ${risultati.inseriti}, Errori: ${risultati.errori.length}`,
  })
}
