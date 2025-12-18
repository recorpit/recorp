// src/components/auth/ProtectedRoute.tsx
// Componente per proteggere route con verifica ruoli

'use client'

import { useCurrentUser, hasRole } from '@/hooks/useCurrentUser'
import type { RuoloUtente } from '@/types/prisma-enums'
import { AlertTriangle } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: RuoloUtente[]
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading } = useCurrentUser()
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  // Non autenticato (gestito dal middleware, ma fallback)
  if (!user) {
    return null
  }
  
  // Verifica ruoli se specificati
  if (allowedRoles && !hasRole(user.ruolo, allowedRoles)) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
          <AlertTriangle className="text-yellow-600" size={32} />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Accesso non autorizzato
        </h2>
        <p className="text-gray-600 max-w-md">
          Non hai i permessi necessari per accedere a questa sezione.
          Contatta l&apos;amministratore se ritieni di dover avere accesso.
        </p>
      </div>
    )
  }
  
  return <>{children}</>
}

// Componente per mostrare contenuto solo ad admin
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      {children}
    </ProtectedRoute>
  )
}

// Componente per nascondere elementi in base al ruolo
export function ShowForRoles({ 
  roles, 
  children 
}: { 
  roles: RuoloUtente[]
  children: React.ReactNode 
}) {
  const { user } = useCurrentUser()
  
  if (!user || !hasRole(user.ruolo, roles)) {
    return null
  }
  
  return <>{children}</>
}
