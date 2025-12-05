// src/hooks/usePermessi.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

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
  
  const haPermesso = useCallback((permesso: string): boolean => {
    return permessi.has(permesso)
  }, [permessi])
  
  const haPermessi = useCallback((permessiRichiesti: string[]): boolean => {
    return permessiRichiesti.every(p => permessi.has(p))
  }, [permessi])
  
  const haAlmenoUnPermesso = useCallback((permessiRichiesti: string[]): boolean => {
    return permessiRichiesti.some(p => permessi.has(p))
  }, [permessi])
  
  const puoAccedereModulo = useCallback((modulo: string): boolean => {
    return permessi.has(`${modulo}.visualizza`)
  }, [permessi])
  
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
