// src/app/(dashboard)/impostazioni/layout.tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Settings, Building2, Users, MapPin, Briefcase, 
  CreditCard, FileText, Database, ChevronRight,
  Upload, Shield, Bell, Palette, Mail, Tag
} from 'lucide-react'

const menuItems = [
  {
    title: 'Azienda',
    icon: Building2,
    href: '/impostazioni/azienda',
    description: 'Dati aziendali, logo, contatti'
  },
  {
    title: 'Anagrafiche',
    icon: Users,
    href: '/impostazioni/anagrafiche',
    description: 'Import/export massivo dati',
    children: [
      { title: 'Artisti', href: '/impostazioni/anagrafiche/artisti', icon: Users },
      { title: 'Committenti', href: '/impostazioni/anagrafiche/committenti', icon: Briefcase },
      { title: 'Locali', href: '/impostazioni/anagrafiche/locali', icon: MapPin },
    ]
  },
  {
    title: 'Qualifiche Artisti',
    icon: Tag,
    href: '/impostazioni/qualifiche',
    description: 'Categorie e codici INPS'
  },
  {
    title: 'Pagamenti',
    icon: CreditCard,
    href: '/impostazioni/pagamenti',
    description: 'Conti bancari, modalità pagamento'
  },
  {
    title: 'INPS / Agibilità',
    icon: FileText,
    href: '/impostazioni/inps',
    description: 'Configurazione XML, credenziali'
  },
  {
    title: 'Email',
    icon: Mail,
    href: '/impostazioni/email',
    description: 'Notifiche e invio automatico'
  },
  {
    title: 'Sistema',
    icon: Database,
    href: '/impostazioni/sistema',
    description: 'Backup, log, manutenzione'
  },
]

export default function ImpostazioniLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  const isActive = (href: string) => {
    if (href === '/impostazioni/anagrafiche') {
      return pathname.startsWith('/impostazioni/anagrafiche')
    }
    return pathname === href || pathname.startsWith(href + '/')
  }
  
  const isChildActive = (href: string) => pathname === href

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Settings className="text-gray-600" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Impostazioni</h2>
              <p className="text-xs text-gray-500">Configura il sistema</p>
            </div>
          </div>
          
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon size={18} />
                  <span className="flex-1 font-medium text-sm">{item.title}</span>
                  {item.children && (
                    <ChevronRight 
                      size={16} 
                      className={`transition-transform ${isActive(item.href) ? 'rotate-90' : ''}`} 
                    />
                  )}
                </Link>
                
                {/* Sottomenù */}
                {item.children && isActive(item.href) && (
                  <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isChildActive(child.href)
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        <child.icon size={14} />
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
