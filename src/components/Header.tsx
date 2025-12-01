// src/components/Header.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { User, LogOut, ChevronDown, Settings, Loader2 } from 'lucide-react'

export default function Header() {
  const { data: session, status } = useSession()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Click outside per chiudere dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await signOut({ callbackUrl: '/login' })
  }

  // Loading state
  if (status === 'loading') {
    return (
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6 sticky top-0 z-30">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm">Caricamento...</span>
        </div>
      </header>
    )
  }

  // Dati utente dalla sessione
  const user = session?.user
  const userName = user ? `${user.nome} ${user.cognome}` : 'Utente'
  const userEmail = user?.email || ''
  const userRole = user?.ruolo || ''
  const initials = user 
    ? `${user.nome?.[0] || ''}${user.cognome?.[0] || ''}`.toUpperCase()
    : 'U'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Spazio per eventuale breadcrumb o titolo pagina */}
      <div></div>
      
      {/* Menu utente */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
            {initials}
          </div>
          <div className="text-left hidden md:block">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">{userRole}</p>
          </div>
          <ChevronDown 
            size={16} 
            className={`text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            {/* Info utente */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                {userRole}
              </span>
            </div>
            
            {/* Links */}
            <div className="py-1">
              <Link
                href="/profilo"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <User size={18} />
                <span>Il mio profilo</span>
              </Link>
              
              <Link
                href="/impostazioni"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <Settings size={18} />
                <span>Impostazioni</span>
              </Link>
            </div>
            
            <div className="border-t border-gray-200 my-1" />
            
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
              <span>Esci</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
