// src/lib/auth.ts
// Autenticazione con Supabase Auth

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import type { RuoloUtente } from '@prisma/client'

// Tipo utente per l'applicazione
export interface AppUser {
  id: string
  email: string
  nome: string
  cognome: string
  ruolo: RuoloUtente
  supabaseId: string
}

// Ottiene l'utente corrente dalla sessione Supabase + dati da tabella User
export async function auth(): Promise<{ user: AppUser | null }> {
  try {
    const supabase = await createClient()
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()
    
    if (error || !supabaseUser) {
      return { user: null }
    }

    // Cerca l'utente nella tabella User tramite email
    const dbUser = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
    })

    if (!dbUser || !dbUser.attivo) {
      return { user: null }
    }

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        nome: dbUser.nome,
        cognome: dbUser.cognome,
        ruolo: dbUser.ruolo,
        supabaseId: supabaseUser.id,
      }
    }
  } catch (error) {
    console.error('Errore auth:', error)
    return { user: null }
  }
}

// Aggiorna ultimo login
export async function updateLastLogin(email: string) {
  try {
    await prisma.user.update({
      where: { email },
      data: { lastLoginAt: new Date() },
    })
  } catch (error) {
    console.error('Errore aggiornamento lastLogin:', error)
  }
}

// Sign out
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
