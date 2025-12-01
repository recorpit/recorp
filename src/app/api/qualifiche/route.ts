// src/app/api/qualifiche/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Qualifiche predefinite con codici INPS
const QUALIFICHE_DEFAULT = [
  { nome: 'DJ', codiceInps: '032', sinonimi: 'dj,deejay,disc jockey,discjockey', ordine: 1 },
  { nome: 'Vocalist/Cantante', codiceInps: '031', sinonimi: 'vocalist,cantante,singer,voce', ordine: 2 },
  { nome: 'Corista', codiceInps: '013', sinonimi: 'corista,coro,backing vocal,backingvocal', ordine: 3 },
  { nome: 'Musicista', codiceInps: '081', sinonimi: 'musicista,strumentista,chitarrista,bassista,batterista,tastierista,pianista,violinista,sassofonista,trombettista,percussionista', ordine: 4 },
  { nome: 'Ballerino/a', codiceInps: '092', sinonimi: 'ballerino,ballerina,ballerino/a,danzatore,danzatrice,dancer,gogo,go-go,go go', ordine: 5 },
  { nome: 'Tecnico Luci', codiceInps: '117', sinonimi: 'lucista,light designer,lightdesigner,tecnico luci,tecnicoluci,lighting', ordine: 6 },
  { nome: 'Fotografo', codiceInps: '126', sinonimi: 'fotografo,fotografa,photographer,foto', ordine: 7 },
  { nome: 'Truccatore', codiceInps: '141', sinonimi: 'truccatore,truccatrice,makeup,make up,makeup artist,makeupartist,mua', ordine: 8 },
  { nome: 'Altro', codiceInps: '032', sinonimi: 'altro,other', ordine: 99 },
]

// GET - Lista qualifiche
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const soloAttive = searchParams.get('attive') !== 'false'
    const seed = searchParams.get('seed') === 'true'
    
    // Seed iniziale se richiesto
    if (seed) {
      const esistenti = await prisma.qualificaConfig.count()
      if (esistenti === 0) {
        await prisma.qualificaConfig.createMany({
          data: QUALIFICHE_DEFAULT
        })
        return NextResponse.json({ 
          message: 'Qualifiche inizializzate', 
          count: QUALIFICHE_DEFAULT.length 
        })
      }
      return NextResponse.json({ message: 'Qualifiche già presenti', count: esistenti })
    }
    
    const qualifiche = await prisma.qualificaConfig.findMany({
      where: soloAttive ? { attivo: true } : undefined,
      orderBy: { ordine: 'asc' }
    })
    
    return NextResponse.json(qualifiche)
  } catch (error) {
    console.error('Errore GET qualifiche:', error)
    return NextResponse.json({ error: 'Errore nel recupero delle qualifiche' }, { status: 500 })
  }
}

// POST - Crea nuova qualifica
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validazioni
    if (!body.nome?.trim()) {
      return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
    }
    
    if (!body.codiceInps?.trim()) {
      return NextResponse.json({ error: 'Codice INPS obbligatorio' }, { status: 400 })
    }
    
    // Verifica codice INPS (3 cifre)
    if (!/^\d{3}$/.test(body.codiceInps.trim())) {
      return NextResponse.json({ error: 'Codice INPS deve essere di 3 cifre' }, { status: 400 })
    }
    
    // Verifica nome univoco
    const esistente = await prisma.qualificaConfig.findUnique({
      where: { nome: body.nome.trim() }
    })
    
    if (esistente) {
      return NextResponse.json({ error: 'Esiste già una qualifica con questo nome' }, { status: 400 })
    }
    
    // Trova ordine massimo
    const ultimaQualifica = await prisma.qualificaConfig.findFirst({
      orderBy: { ordine: 'desc' }
    })
    const nuovoOrdine = (ultimaQualifica?.ordine || 0) + 1
    
    const qualifica = await prisma.qualificaConfig.create({
      data: {
        nome: body.nome.trim(),
        codiceInps: body.codiceInps.trim(),
        sinonimi: body.sinonimi?.trim() || body.nome.toLowerCase(),
        attivo: body.attivo !== false,
        ordine: body.ordine || nuovoOrdine,
      }
    })
    
    return NextResponse.json(qualifica, { status: 201 })
  } catch (error) {
    console.error('Errore POST qualifica:', error)
    return NextResponse.json({ error: 'Errore nella creazione della qualifica' }, { status: 500 })
  }
}
