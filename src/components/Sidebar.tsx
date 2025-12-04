// src/components/Sidebar.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Building2, 
  FileText, 
  CreditCard,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Folder,
  BarChart3,
  Plus,
  List,
  Inbox,
  Film,
  Package,
  HardHat,
  Sparkles,
  UserCog,
  Loader2,
  Menu,
  X,
  Landmark
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

interface MenuItem {
  href: string
  label: string
  icon: any
  badge?: string
  disabled?: boolean
  permesso?: string
}

interface MenuSection {
  id: string
  label: string
  icon: any
  items?: MenuItem[]
  href?: string
  badge?: string
  disabled?: boolean
  permesso?: string
}

const menuSections: MenuSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/',
    permesso: 'dashboard.visualizza',
  },
  {
    id: 'anagrafiche',
    label: 'Anagrafiche',
    icon: Users,
    items: [
      { href: '/artisti', label: 'Artisti', icon: Users, permesso: 'artisti.visualizza' },
      { href: '/locali', label: 'Locali', icon: MapPin, permesso: 'locali.visualizza' },
      { href: '/committenti', label: 'Committenti', icon: Building2, permesso: 'committenti.visualizza' },
      { href: '/format', label: 'Format', icon: Sparkles, permesso: 'formats.visualizza' },
      { href: '/utenti', label: 'Utenti', icon: UserCog, permesso: 'utenti.visualizza' },
      { href: '/staff', label: 'Staff/Tecnici', icon: HardHat, badge: 'Soon', disabled: true },
      { href: '/materiali', label: 'Materiali/Servizi', icon: Package, badge: 'Soon', disabled: true },
      { href: '/mezzi', label: 'Mezzi', icon: Film, badge: 'Soon', disabled: true },
    ]
  },
  {
    id: 'agibilita',
    label: 'Agibilità',
    icon: FileText,
    permesso: 'agibilita.visualizza',
    items: [
      { href: '/agibilita', label: 'Lista Agibilità', icon: List, permesso: 'agibilita.visualizza' },
      { href: '/richieste-agibilita', label: 'Richieste', icon: Inbox, permesso: 'agibilita.visualizza' },
      { href: '/richieste-agibilita/chat', label: 'Nuova con AI', icon: Sparkles, permesso: 'agibilita.visualizza' },
      { href: '/agibilita/nuova', label: 'Nuova Agibilità', icon: Plus, permesso: 'agibilita.crea' },
    ]
  },
  {
    id: 'produzione',
    label: 'Produzione',
    icon: Film,
    badge: 'Soon',
    disabled: true,
    items: [
      { href: '/produzione/eventi', label: 'Eventi', icon: Film, disabled: true },
      { href: '/produzione/preventivi', label: 'Preventivi', icon: FileText, disabled: true },
      { href: '/produzione/dossier', label: 'Dossier Evento', icon: Folder, disabled: true },
    ]
  },
  {
    id: 'magazzino',
    label: 'Magazzino',
    icon: Package,
    badge: 'Soon',
    disabled: true,
    items: [
      { href: '/magazzino/inventario', label: 'Inventario', icon: List, disabled: true },
      { href: '/magazzino/pacchetti', label: 'Pacchetti', icon: Package, disabled: true },
      { href: '/magazzino/checkout', label: 'Check-out/Check-in', icon: FileText, disabled: true },
    ]
  },
  {
    id: 'staff-tecnica',
    label: 'Staff & Tecnica',
    icon: HardHat,
    badge: 'Soon',
    disabled: true,
    items: [
      { href: '/staff/gestione', label: 'Gestione Staff', icon: Users, disabled: true },
      { href: '/staff/assegnazioni', label: 'Assegnazioni', icon: FileText, disabled: true },
      { href: '/staff/turni', label: 'Turni', icon: FileText, disabled: true },
    ]
  },
  {
    id: 'economico',
    label: 'Economico',
    icon: CreditCard,
    items: [
      { href: '/fatturazione', label: 'Fatture Committenti', icon: Receipt, permesso: 'fatture.visualizza' },
      { href: '/pagamenti/occasionali', label: 'Prestazioni Occasionali', icon: Receipt, permesso: 'prestazioni.visualizza' },
      { href: '/pagamenti/contratti', label: 'Contratti / P.IVA', icon: CreditCard, permesso: 'pagamenti.visualizza' },
      { href: '/movimenti-bancari', label: 'Tesoreria', icon: Landmark },
    ]
  },
  {
    id: 'documenti',
    label: 'Documenti/Archivio',
    icon: Folder,
    href: '/documenti',
  },
  {
    id: 'report',
    label: 'Report & KPI',
    icon: BarChart3,
    href: '/report',
    permesso: 'report.visualizza',
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, loading } = useCurrentUser()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [permessi, setPermessi] = useState<Set<string>>(new Set())
  const [permessiLoaded, setPermessiLoaded] = useState(false)

  // Chiudi sidebar mobile quando cambia pagina
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Carica permessi utente
  useEffect(() => {
    if (user?.id) {
      loadPermessi()
    }
  }, [user?.id])

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
      setPermessiLoaded(true)
    }
  }

  const haPermesso = (permesso?: string): boolean => {
    if (!permesso) return true
    if (user?.ruolo === 'ADMIN') return true
    return permessi.has(permesso)
  }

  const menuFiltrato = useMemo(() => {
    return menuSections
      .map(section => {
        if (section.items) {
          const itemsFiltrati = section.items.filter(item => {
            if (item.disabled) return true
            return haPermesso(item.permesso)
          })
          if (itemsFiltrati.length === 0) return null
          return { ...section, items: itemsFiltrati }
        }
        if (!haPermesso(section.permesso)) return null
        return section
      })
      .filter(Boolean) as MenuSection[]
  }, [permessi, user?.ruolo])

  const toggleSection = (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null)
    } else {
      setExpandedSection(sectionId)
    }
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (pathname === href) return true
    if (pathname.startsWith(href + '/')) return false
    return pathname.startsWith(href)
  }

  // Loading
  if (loading || !permessiLoaded) {
    return (
      <>
        {/* Mobile header placeholder */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 z-50" />
        {/* Desktop sidebar placeholder */}
        <aside className="hidden lg:block bg-gray-900 text-white h-screen fixed left-0 top-0 w-64 z-40">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-gray-400" size={24} />
          </div>
        </aside>
      </>
    )
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!collapsed && (
          <Image src="/logo.png" alt="RECORP" width={120} height={32} className="brightness-0 invert" />
        )}
        {collapsed && (
          <Image src="/logo.png" alt="RECORP" width={32} height={32} className="brightness-0 invert mx-auto" />
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-800 transition-colors hidden lg:block"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        {/* Close button for mobile */}
        <button 
          onClick={() => setMobileOpen(false)}
          className="p-1 rounded hover:bg-gray-800 transition-colors lg:hidden"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="mt-2 px-2 pb-20">
        {menuFiltrato.map((section) => {
          const Icon = section.icon
          const isExpanded = expandedSection === section.id
          const hasItems = section.items && section.items.length > 0
          
          if (!hasItems && section.href) {
            const active = isActive(section.href)
            
            if (section.disabled) {
              return (
                <div
                  key={section.id}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg mb-1
                    text-gray-500 cursor-not-allowed
                    ${collapsed ? 'lg:justify-center' : ''}
                  `}
                  title={collapsed ? section.label : undefined}
                >
                  <Icon size={20} />
                  {(!collapsed || mobileOpen) && (
                    <>
                      <span className="flex-1">{section.label}</span>
                      {section.badge && (
                        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                          {section.badge}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )
            }
            
            return (
              <Link
                key={section.id}
                href={section.href}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg mb-1
                  transition-all duration-200
                  ${active 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                  ${collapsed && !mobileOpen ? 'lg:justify-center' : ''}
                `}
                title={collapsed ? section.label : undefined}
              >
                <Icon size={20} />
                {(!collapsed || mobileOpen) && <span>{section.label}</span>}
              </Link>
            )
          }
          
          return (
            <div key={section.id} className="mb-1">
              <button
                onClick={() => !section.disabled && toggleSection(section.id)}
                disabled={section.disabled}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg
                  transition-all duration-200
                  ${section.disabled 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                  ${collapsed && !mobileOpen ? 'lg:justify-center' : ''}
                `}
                title={collapsed ? section.label : undefined}
              >
                <Icon size={20} />
                {(!collapsed || mobileOpen) && (
                  <>
                    <span className="flex-1 text-left">{section.label}</span>
                    {section.badge && (
                      <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                        {section.badge}
                      </span>
                    )}
                    {!section.disabled && (
                      isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </>
                )}
              </button>
              
              {(!collapsed || mobileOpen) && isExpanded && section.items && (
                <div className="ml-4 mt-1 space-y-1">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon
                    const active = isActive(item.href)
                    
                    if (item.disabled) {
                      return (
                        <div
                          key={item.href}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 cursor-not-allowed"
                        >
                          <ItemIcon size={16} />
                          <span className="text-sm flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )
                    }
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                          transition-colors
                          ${active 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          }
                        `}
                      >
                        <ItemIcon size={16} />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            active ? 'bg-blue-700' : 'bg-gray-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-900">
        {haPermesso('impostazioni.visualizza') && (
          <Link 
            href="/impostazioni"
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg
              text-gray-400 hover:bg-gray-800 hover:text-white
              transition-colors
              ${collapsed && !mobileOpen ? 'lg:justify-center' : ''}
            `}
            title={collapsed ? 'Impostazioni' : undefined}
          >
            <Settings size={20} />
            {(!collapsed || mobileOpen) && <span>Impostazioni</span>}
          </Link>
        )}
        
        {(!collapsed || mobileOpen) && (
          <div className="mt-4 text-xs text-gray-500 text-center">
            RECORP v3.7
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 z-50 flex items-center px-4 border-b border-gray-800">
        <button 
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded hover:bg-gray-800 transition-colors text-white"
        >
          <Menu size={24} />
        </button>
        <div className="ml-3">
          <Image src="/logo.png" alt="RECORP" width={100} height={28} className="brightness-0 invert" />
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`
        lg:hidden fixed left-0 top-0 h-screen bg-gray-900 text-white z-50
        transition-transform duration-300 ease-in-out w-64
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        overflow-y-auto
      `}>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`
        hidden lg:block bg-gray-900 text-white h-screen fixed left-0 top-0 
        transition-all duration-300 ease-in-out z-40
        ${collapsed ? 'w-16' : 'w-64'}
        overflow-y-auto
      `}>
        {sidebarContent}
      </aside>
    </>
  )
}
