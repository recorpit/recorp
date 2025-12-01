// src/components/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
  Loader2
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

interface MenuItem {
  href: string
  label: string
  icon: any
  badge?: string
  disabled?: boolean
  permesso?: string // permesso richiesto per vedere questa voce
}

interface MenuSection {
  id: string
  label: string
  icon: any
  items?: MenuItem[]
  href?: string
  badge?: string
  disabled?: boolean
  permesso?: string // permesso richiesto per vedere questa sezione
}

// Menu completo con permessi associati
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
      { href: '/agibilita/richieste', label: 'Richieste Agibilità', icon: Inbox, badge: '0', permesso: 'agibilita.visualizza' },
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
  const { data: session, status } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [permessi, setPermessi] = useState<Set<string>>(new Set())
  const [permessiLoaded, setPermessiLoaded] = useState(false)

  // Carica permessi utente
  useEffect(() => {
    if (session?.user?.id) {
      loadPermessi()
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
      setPermessiLoaded(true)
    }
  }

  // Verifica se l'utente ha un permesso
  const haPermesso = (permesso?: string): boolean => {
    // Se non c'è permesso specificato, mostra sempre
    if (!permesso) return true
    // Admin vede tutto
    if (session?.user?.ruolo === 'ADMIN') return true
    // Controlla permesso
    return permessi.has(permesso)
  }

  // Filtra menu in base ai permessi
  const menuFiltrato = useMemo(() => {
    return menuSections
      .map(section => {
        // Se la sezione ha items, filtra quelli visibili
        if (section.items) {
          const itemsFiltrati = section.items.filter(item => {
            // Voci disabilitate (Soon) sempre visibili
            if (item.disabled) return true
            // Controlla permesso
            return haPermesso(item.permesso)
          })
          
          // Se non ci sono items visibili, nascondi la sezione
          if (itemsFiltrati.length === 0) return null
          
          return { ...section, items: itemsFiltrati }
        }
        
        // Sezione singola: controlla permesso
        if (!haPermesso(section.permesso)) return null
        
        return section
      })
      .filter(Boolean) as MenuSection[]
  }, [permessi, session?.user?.ruolo])

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
  if (status === 'loading' || !permessiLoaded) {
    return (
      <aside className={`bg-gray-900 text-white h-screen fixed left-0 top-0 transition-all duration-300 ease-in-out z-40 ${collapsed ? 'w-16' : 'w-64'}`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-800">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      </aside>
    )
  }

  return (
    <aside className={`
      bg-gray-900 text-white h-screen fixed left-0 top-0 
      transition-all duration-300 ease-in-out z-40
      ${collapsed ? 'w-16' : 'w-64'}
      overflow-y-auto
    `}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎭</span>
            <span className="font-bold text-xl">RECORP</span>
          </div>
        )}
        {collapsed && <span className="text-2xl mx-auto">🎭</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-800 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="mt-2 px-2 pb-20">
        {menuFiltrato.map((section) => {
          const Icon = section.icon
          const isExpanded = expandedSection === section.id
          const hasItems = section.items && section.items.length > 0
          
          // Voce singola (non espandibile)
          if (!hasItems && section.href) {
            const active = isActive(section.href)
            
            if (section.disabled) {
              return (
                <div
                  key={section.id}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg mb-1
                    text-gray-500 cursor-not-allowed
                    ${collapsed ? 'justify-center' : ''}
                  `}
                  title={collapsed ? section.label : undefined}
                >
                  <Icon size={20} />
                  {!collapsed && (
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
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? section.label : undefined}
              >
                <Icon size={20} />
                {!collapsed && <span>{section.label}</span>}
              </Link>
            )
          }
          
          // Sezione espandibile
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
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? section.label : undefined}
              >
                <Icon size={20} />
                {!collapsed && (
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
              
              {/* Sottomenu */}
              {!collapsed && isExpanded && section.items && (
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
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? 'Impostazioni' : undefined}
          >
            <Settings size={20} />
            {!collapsed && <span>Impostazioni</span>}
          </Link>
        )}
        
        {!collapsed && (
          <div className="mt-4 text-xs text-gray-500 text-center">
            RECORP v3.7
          </div>
        )}
      </div>
    </aside>
  )
}