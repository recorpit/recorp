// src/app/(dashboard)/impostazioni/anagrafiche/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Briefcase, MapPin, Upload, Download, ArrowRight, Database } from 'lucide-react'

interface Stats {
  artisti: number
  committenti: number
  locali: number
}

export default function AnagrafichePage() {
  const [stats, setStats] = useState<Stats>({ artisti: 0, committenti: 0, locali: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [artisti, committenti, locali] = await Promise.all([
        fetch('/api/artisti?count=true').then(r => r.json()),
        fetch('/api/committenti?count=true').then(r => r.json()),
        fetch('/api/locali?count=true').then(r => r.json()),
      ])
      
      setStats({
        artisti: artisti.count || artisti.length || 0,
        committenti: committenti.count || committenti.length || 0,
        locali: locali.count || locali.length || 0,
      })
    } catch (err) {
      console.error('Errore caricamento stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const sections = [
    {
      title: 'Artisti',
      description: 'Importa o esporta l\'anagrafica completa degli artisti',
      icon: Users,
      href: '/impostazioni/anagrafiche/artisti',
      count: stats.artisti,
      color: 'blue',
    },
    {
      title: 'Committenti',
      description: 'Gestisci i committenti (chi paga le agibilità)',
      icon: Briefcase,
      href: '/impostazioni/anagrafiche/committenti',
      count: stats.committenti,
      color: 'green',
    },
    {
      title: 'Locali',
      description: 'Importa i locali dove si svolgono le prestazioni',
      icon: MapPin,
      href: '/impostazioni/anagrafiche/locali',
      count: stats.locali,
      color: 'purple',
    },
  ]

  const colorClasses: Record<string, { bg: string, text: string, icon: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
    green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'text-green-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500' },
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import/Export Anagrafiche</h1>
        <p className="text-gray-500 mt-1">Gestione massiva dei dati tramite file Excel o CSV</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {sections.map((section) => {
          const colors = colorClasses[section.color]
          return (
            <div key={section.title} className={`${colors.bg} rounded-lg p-4 text-center`}>
              <p className={`text-3xl font-bold ${colors.text}`}>
                {loading ? '...' : section.count}
              </p>
              <p className="text-sm text-gray-600">{section.title}</p>
            </div>
          )
        })}
      </div>

      {/* Section Cards */}
      <div className="space-y-4">
        {sections.map((section) => {
          const colors = colorClasses[section.color]
          return (
            <Link
              key={section.href}
              href={section.href}
              className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <section.icon className={colors.icon} size={28} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-lg">{section.title}</h3>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${colors.text} font-medium`}>
                        {loading ? '...' : section.count} record
                      </span>
                      <ArrowRight 
                        size={20} 
                        className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" 
                      />
                    </div>
                  </div>
                  <p className="text-gray-500 mt-1">{section.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Upload size={14} />
                      Import CSV/Excel
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Download size={14} />
                      Export Excel
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Database className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-blue-800">Formati Supportati</p>
            <p className="text-sm text-blue-700 mt-1">
              Puoi importare file <strong>.xlsx</strong> (Excel), <strong>.xls</strong> o <strong>.csv</strong> (separatore virgola o punto e virgola).
              Scarica il template per vedere la struttura corretta dei dati.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
