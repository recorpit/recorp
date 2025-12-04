// src/app/api/auth/miei-permessi/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()
    
    if (error || !supabaseUser) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Ottieni utente dal DB
    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
      select: { id: true, ruolo: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Ottieni permessi per ruolo
    const permessiRuolo = await prisma.permessoRuolo.findMany({
      where: { ruolo: user.ruolo },
      include: { permesso: true }
    })

    // Ottieni permessi specifici utente
    const permessiUtente = await prisma.permessoUtente.findMany({
      where: { userId: user.id },
      include: { permesso: true }
    })

    // Combina permessi
    const permessiMap = new Map<string, boolean>()
    
    // Prima i permessi del ruolo
    for (const pr of permessiRuolo) {
      permessiMap.set(pr.permesso.codice, true)
    }
    
    // Poi i permessi specifici utente (override)
    for (const pu of permessiUtente) {
      permessiMap.set(pu.permesso.codice, pu.concesso)
    }

    // Converti in array
    const permessi = Array.from(permessiMap.entries())
      .filter(([_, concesso]) => concesso)
      .map(([codice]) => codice)

    return NextResponse.json({ permessi, ruolo: user.ruolo })
  } catch (error) {
    console.error('Errore caricamento permessi:', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
