// src/app/api/utenti/[id]/permessi/route.ts
// API Gestione Permessi Utente

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { invalidaCachePermessi } from '@/lib/permessi'

// GET - Ottieni permessi utente
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.ruolo !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    // Carica utente con ruolo
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, ruolo: true, nome: true, cognome: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }
    
    // Carica tutti i permessi disponibili
    const tuttiPermessi = await prisma.permesso.findMany({
      where: { attivo: true },
      orderBy: [{ modulo: 'asc' }, { azione: 'asc' }]
    })
    
    // Carica permessi del ruolo
    const permessiRuolo = await prisma.permessoRuolo.findMany({
      where: { ruolo: user.ruolo },
      select: { permessoId: true }
    })
    const permessiRuoloIds = new Set(permessiRuolo.map(p => p.permessoId))
    
    // Carica permessi custom utente
    const permessiUtente = await prisma.permessoUtente.findMany({
      where: { userId: params.id },
      select: { permessoId: true, concesso: true }
    })
    const permessiUtenteMap = new Map(
      permessiUtente.map(p => [p.permessoId, p.concesso])
    )
    
    // Costruisci risposta con stato effettivo di ogni permesso
    const permessiConStato = tuttiPermessi.map(p => {
      const daRuolo = permessiRuoloIds.has(p.id)
      const customOverride = permessiUtenteMap.get(p.id)
      
      // Calcola stato effettivo
      let attivo: boolean
      let fonte: 'ruolo' | 'custom_aggiunto' | 'custom_revocato' | 'nessuno'
      
      if (customOverride !== undefined) {
        attivo = customOverride
        fonte = customOverride ? 'custom_aggiunto' : 'custom_revocato'
      } else {
        attivo = daRuolo
        fonte = daRuolo ? 'ruolo' : 'nessuno'
      }
      
      return {
        id: p.id,
        codice: p.codice,
        nome: p.nome,
        modulo: p.modulo,
        azione: p.azione,
        attivo,
        daRuolo,
        fonte,
      }
    })
    
    // Raggruppa per modulo
    const perModulo: Record<string, typeof permessiConStato> = {}
    for (const p of permessiConStato) {
      if (!perModulo[p.modulo]) {
        perModulo[p.modulo] = []
      }
      perModulo[p.modulo].push(p)
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        nome: user.nome,
        cognome: user.cognome,
        ruolo: user.ruolo,
      },
      permessi: permessiConStato,
      perModulo,
    })
    
  } catch (error) {
    console.error('Errore caricamento permessi:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// PUT - Aggiorna permessi custom utente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.ruolo !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const body = await request.json()
    const { permessi } = body // Array di { permessoId, concesso }
    
    if (!Array.isArray(permessi)) {
      return NextResponse.json({ error: 'Formato non valido' }, { status: 400 })
    }
    
    // Verifica utente esiste
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, ruolo: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }
    
    // Carica permessi del ruolo per confronto
    const permessiRuolo = await prisma.permessoRuolo.findMany({
      where: { ruolo: user.ruolo },
      select: { permessoId: true }
    })
    const permessiRuoloIds = new Set(permessiRuolo.map(p => p.permessoId))
    
    // Elimina tutti i permessi custom esistenti
    await prisma.permessoUtente.deleteMany({
      where: { userId: params.id }
    })
    
    // Aggiungi solo i permessi custom (diversi dal ruolo)
    const permessiDaCreare = []
    
    for (const { permessoId, concesso } of permessi) {
      const daRuolo = permessiRuoloIds.has(permessoId)
      
      // Salva solo se è un override rispetto al ruolo
      if ((concesso && !daRuolo) || (!concesso && daRuolo)) {
        permessiDaCreare.push({
          userId: params.id,
          permessoId,
          concesso,
        })
      }
    }
    
    if (permessiDaCreare.length > 0) {
      await prisma.permessoUtente.createMany({
        data: permessiDaCreare
      })
    }
    
    // Invalida cache
    invalidaCachePermessi(params.id)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Permessi aggiornati',
      customCount: permessiDaCreare.length
    })
    
  } catch (error) {
    console.error('Errore aggiornamento permessi:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// DELETE - Rimuovi tutti i permessi custom (ripristina default ruolo)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.ruolo !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    await prisma.permessoUtente.deleteMany({
      where: { userId: params.id }
    })
    
    // Invalida cache
    invalidaCachePermessi(params.id)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Permessi ripristinati al default del ruolo' 
    })
    
  } catch (error) {
    console.error('Errore reset permessi:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
