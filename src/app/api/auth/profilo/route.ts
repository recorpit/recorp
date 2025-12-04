// src/app/api/auth/profilo/route.ts
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

    // Ottieni dati utente dal DB
    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        ruolo: true,
        attivo: true,
      }
    })

    if (!user || !user.attivo) {
      return NextResponse.json({ error: 'Utente non trovato o non attivo' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Errore profilo:', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()
    
    if (error || !supabaseUser) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const body = await request.json()
    const { nome, cognome } = body

    const user = await prisma.user.update({
      where: { email: supabaseUser.email! },
      data: { nome, cognome },
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        ruolo: true,
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Errore aggiornamento profilo:', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
