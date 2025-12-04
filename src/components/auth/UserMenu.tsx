// src/components/auth/UserMenu.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export function UserMenu() {
  const router = useRouter()
  const supabase = createClient()
  const { user, loading } = useCurrentUser()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Chiudi menu al click fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }
  
  if (loading) {
    return (
      <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse" />
    )
  }
  
  if (!user) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Accedi
      </Link>
    )
  }
  
  const initials = `${user.nome?.[0] || ''}${user.cognome?.[0] || ''}`.toUpperCase()
  
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {initials || <User className="w-4 h-4" />}
        </div>
        <span className="text-gray-200 hidden sm:block">{user.nome}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-3 border-b border-gray-700">
            <p className="text-white font-medium">{user.nome} {user.cognome}</p>
            <p className="text-gray-400 text-sm">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded">
              {user.ruolo}
            </span>
          </div>
          
          <div className="p-2">
            <Link
              href="/profilo"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <User className="w-4 h-4" />
              Profilo
            </Link>
            <Link
              href="/impostazioni"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Impostazioni
            </Link>
          </div>
          
          <div className="p-2 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Esci
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
