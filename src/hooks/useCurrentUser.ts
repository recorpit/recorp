// src/hooks/useCurrentUser.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AppUser {
  id: string
  email: string
  nome: string
  cognome: string
  ruolo: string
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

  return { user, loading }
}
