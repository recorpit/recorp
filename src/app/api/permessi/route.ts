// src/app/api/permessi/route.ts
// API Lista Permessi

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { MODULI, AZIONI } from '@/lib/permessi'

export const dynamic = 'force-dynamic'

// GET - Lista tutti i permessi
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.ruolo !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const permessi = await prisma.permesso.findMany({
      where: { attivo: true },
      orderBy: [{ modulo: 'asc' }, { azione: 'asc' }]
    })
    
    // Raggruppa per modulo
    const perModulo: Record<string, typeof permessi> = {}
    for (const p of permessi) {
      if (!perModulo[p.modulo]) {
        perModulo[p.modulo] = []
      }
      perModulo[p.modulo].push(p)
    }
    
    return NextResponse.json({
      permessi,
      perModulo,
      moduli: MODULI,
      azioni: AZIONI,
    })
    
  } catch (error) {
    console.error('Errore caricamento permessi:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
