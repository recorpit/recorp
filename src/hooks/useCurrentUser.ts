// src/hooks/useCurrentUser.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RuoloUtente } from '@prisma/client'

export interface AppUser {
  id: string
  email: string
  nome: string
  cognome: string
  ruolo: RuoloUtente
}

// Helper per verificare ruoli
export function hasRole(userRole: RuoloUtente, allowedRoles: RuoloUtente[]): boolean {
  return allowedRoles.includes(userRole)
}

export function useCurrentUser() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        // Ottieni utente Supabase
        const { data: { user: supabaseUser } } = await supabase.auth.getUser()
        
        if (!supabaseUser) {
          setUser(null)
          setLoading(false)
          return
        }

        // Ottieni dati utente dal DB
        const res = await fetch('/api/auth/profilo')
        if (res.ok) {
          const data = await res.json()
          setUser(data)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Errore fetch user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Ascolta cambiamenti auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Ricarica dati utente
          const res = await fetch('/api/auth/profilo')
          if (res.ok) {
            const data = await res.json()
            setUser(data)
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Esporta sia loading che isLoading per compatibilità
  return { user, loading, isLoading: loading }
}
