// src/app/(dashboard)/impostazioni/page.tsx
'use client'

import Link from 'next/link'
import { 
  Building2, Users, MapPin, Briefcase, 
  CreditCard, FileText, Database, ArrowRight,
  Upload, Settings
} from 'lucide-react'

const sections = [
  {
    title: 'Dati Azienda',
    description: 'Configura ragione sociale, P.IVA, indirizzo e contatti aziendali',
    icon: Building2,
    href: '/impostazioni/azienda',
    color: 'blue',
  },
  {
    title: 'Import Anagrafiche',
    description: 'Carica in blocco artisti, committenti e locali da file Excel/CSV',
    icon: Upload,
    href: '/impostazioni/anagrafiche',
    color: 'green',
  },
  {
    title: 'Pagamenti',
    description: 'Gestisci conti bancari, IBAN e modalità di pagamento',
    icon: CreditCard,
    href: '/impostazioni/pagamenti',
    color: 'purple',
  },
  {
    title: 'Configurazione INPS',
    description: 'Parametri per generazione XML agibilità e comunicazioni',
    icon: FileText,
    href: '/impostazioni/inps',
    color: 'orange',
  },
  {
    title: 'Sistema',
    description: 'Backup database, log attività e manutenzione',
    icon: Database,
    href: '/impostazioni/sistema',
    color: 'gray',
  },
]

const colorClasses: Record<string, { bg: string, icon: string, hover: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', hover: 'hover:bg-blue-100' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', hover: 'hover:bg-green-100' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', hover: 'hover:bg-purple-100' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', hover: 'hover:bg-orange-100' },
  gray: { bg: 'bg-gray-50', icon: 'text-gray-600', hover: 'hover:bg-gray-100' },
}

export default function ImpostazioniPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
        <p className="text-gray-500 mt-1">Configura e personalizza il sistema RECORP</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const colors = colorClasses[section.color]
          return (
            <Link
              key={section.href}
              href={section.href}
              className={`bg-white rounded-lg shadow-sm p-6 ${colors.hover} transition-colors group`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <section.icon className={colors.icon} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{section.title}</h3>
                    <ArrowRight size={18} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      
      {/* Quick Stats */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Stato Sistema</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">v3.6</p>
            <p className="text-xs text-gray-500">Versione</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">●</p>
            <p className="text-xs text-gray-500">Database OK</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">●</p>
            <p className="text-xs text-gray-500">Email SMTP OK</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">IT</p>
            <p className="text-xs text-gray-500">Lingua</p>
          </div>
        </div>
      </div>
    </div>
  )
}
