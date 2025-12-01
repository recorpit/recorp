// src/hooks/useCurrentUser.ts
// Hook per accedere all'utente corrente

'use client'

import { useSession } from 'next-auth/react'
import type { RuoloUtente } from '@prisma/client'

interface CurrentUser {
  id: string
  email: string
  nome: string
  cognome: string
  ruolo: RuoloUtente
  nomeCompleto: string
  isAdmin: boolean
}

export function useCurrentUser(): {
  user: CurrentUser | null
  isLoading: boolean
  isAuthenticated: boolean
} {
  const { data: session, status } = useSession()
  
  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  
  if (!session?.user) {
    return { user: null, isLoading, isAuthenticated: false }
  }
  
  const user: CurrentUser = {
    id: session.user.id,
    email: session.user.email,
    nome: session.user.nome,
    cognome: session.user.cognome,
    ruolo: session.user.ruolo,
    nomeCompleto: `${session.user.nome} ${session.user.cognome}`,
    isAdmin: session.user.ruolo === 'ADMIN',
  }
  
  return { user, isLoading, isAuthenticated }
}

// Utility per verificare permessi
export function hasRole(userRuolo: RuoloUtente, allowedRoles: RuoloUtente[]): boolean {
  return allowedRoles.includes(userRuolo)
}

// Gerarchia ruoli (ADMIN ha tutti i permessi)
export function hasPermission(userRuolo: RuoloUtente, requiredRuolo: RuoloUtente): boolean {
  const hierarchy: Record<RuoloUtente, number> = {
    ADMIN: 100,
    FORMAT_MANAGER: 80,
    PRODUZIONE: 60,
    OPERATORE: 40,
    ARTISTICO: 20,
  }
  
  return hierarchy[userRuolo] >= hierarchy[requiredRuolo]
}
