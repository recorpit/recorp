// src/hooks/usePermessi.ts
// Hook per gestione permessi lato client

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface PermessoInfo {
  codice: string
  attivo: boolean
}

export function usePermessi() {
  const { data: session } = useSession()
  const [permessi, setPermessi] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (session?.user?.id) {
      loadPermessi()
    } else {
      setPermessi(new Set())
      setLoading(false)
    }
  }, [session?.user?.id])
  
  const loadPermessi = async () => {
    try {
      const res = await fetch('/api/auth/miei-permessi')
      if (res.ok) {
        const data = await res.json()
        setPermessi(new Set(data.permessi))
      }
    } catch (err) {
      console.error('Errore caricamento permessi:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Verifica singolo permesso
  const haPermesso = useCallback((permesso: string): boolean => {
    return permessi.has(permesso)
  }, [permessi])
  
  // Verifica multipli permessi (AND)
  const haPermessi = useCallback((permessiRichiesti: string[]): boolean => {
    return permessiRichiesti.every(p => permessi.has(p))
  }, [permessi])
  
  // Verifica almeno uno (OR)
  const haAlmenoUnPermesso = useCallback((permessiRichiesti: string[]): boolean => {
    return permessiRichiesti.some(p => permessi.has(p))
  }, [permessi])
  
  // Verifica accesso a modulo
  const puoAccedereModulo = useCallback((modulo: string): boolean => {
    return permessi.has(`${modulo}.visualizza`)
  }, [permessi])
  
  // Verifica azione su modulo
  const puoEseguireAzione = useCallback((modulo: string, azione: string): boolean => {
    return permessi.has(`${modulo}.${azione}`)
  }, [permessi])
  
  return {
    permessi,
    loading,
    haPermesso,
    haPermessi,
    haAlmenoUnPermesso,
    puoAccedereModulo,
    puoEseguireAzione,
    reload: loadPermessi,
  }
}

// Componente per rendere condizionalmente in base ai permessi
export function ConPermesso({ 
  permesso, 
  children,
  fallback = null
}: { 
  permesso: string | string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { haPermesso, haAlmenoUnPermesso, loading } = usePermessi()
  
  if (loading) return null
  
  const hasAccess = Array.isArray(permesso) 
    ? haAlmenoUnPermesso(permesso)
    : haPermesso(permesso)
  
  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Componente per nascondere azioni non permesse
export function AzionePermessa({
  modulo,
  azione,
  children,
}: {
  modulo: string
  azione: string
  children: React.ReactNode
}) {
  const { puoEseguireAzione, loading } = usePermessi()
  
  if (loading) return null
  
  return puoEseguireAzione(modulo, azione) ? <>{children}</> : null
}
