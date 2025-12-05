// src/components/auth/UserMenu.tsx
// Menu utente per header/sidebar

'use client'

import { useState, useRef, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'
import Link from 'next/link'

export function UserMenu() {
  const { user, isLoading } = useCurrentUser()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Chiudi menu quando si clicca fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
    )
  }
  
  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <User size={18} />
        Accedi
      </Link>
    )
  }
  
  const initials = `${user.nome[0]}${user.cognome[0]}`.toUpperCase()
  
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }
  
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
          {initials}
        </div>
        
        {/* Nome (nascosto su mobile) */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">{user.nomeCompleto}</p>
          <p className="text-xs text-gray-500">{user.ruolo}</p>
        </div>
        
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          {/* Header utente */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.nomeCompleto}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          
          {/* Links */}
          <div className="py-1">
            <Link
              href="/profilo"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User size={16} />
              Il mio profilo
            </Link>
            
            <Link
              href="/impostazioni"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings size={16} />
              Impostazioni
            </Link>
          </div>
          
          {/* Logout */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Esci
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
