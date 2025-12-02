// src/app/(dashboard)/locali/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Plus, MapPin, Search, Building2, Loader2 } from 'lucide-react'

// Costanti locali per evitare problemi di import
const TIPI_LOCALE: Record<string, string> = {
  'DISCOTECA': 'Discoteca',
  'LOCALE_NOTTURNO': 'Locale Notturno',
  'PUB': 'Pub',
  'RISTORANTE': 'Ristorante',
  'HOTEL': 'Hotel',
  'TEATRO': 'Teatro',
  'ARENA': 'Arena',
  'STABILIMENTO': 'Stabilimento Balneare',
  'PIAZZA': 'Piazza/Spazio Aperto',
  'FIERA': 'Fiera/Evento',
  'ALTRO': 'Altro',
}

interface Locale {
  id: string
  nome: string
  tipoLocale: string
  indirizzo: string | null
  citta: string | null
  cap: string | null
  provincia: string | null
  codiceBelfiore: string | null
  committenteDefault: {
    id: string
    ragioneSociale: string
    aRischio: boolean
  } | null
  _count: {
    agibilita: number
  }
}

export default function LocaliPage() {
  const [locali, setLocali] = useState<Locale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filtri
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [filtroCommittente, setFiltroCommittente] = useState<'tutti' | 'con_committente' | 'senza_committente'>('tutti')
  
  // Carica locali
  useEffect(() => {
    async function loadLocali() {
      try {
        const res = await fetch('/api/locali')
        if (!res.ok) throw new Error('Errore caricamento')
        const data = await res.json()
        setLocali(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadLocali()
  }, [])
  
  // Filtra locali
  const localiFiltrati = useMemo(() => {
    return locali.filter(l => {
      // Filtro ricerca
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchNome = l.nome?.toLowerCase().includes(query)
        const matchCitta = l.citta?.toLowerCase().includes(query)
        const matchIndirizzo = l.indirizzo?.toLowerCase().includes(query)
        const matchProvincia = l.provincia?.toLowerCase().includes(query)
        const matchCommittente = l.committenteDefault?.ragioneSociale?.toLowerCase().includes(query)
        const matchBelfiore = l.codiceBelfiore?.toLowerCase().includes(query)
        
        if (!matchNome && !matchCitta && !matchIndirizzo && !matchProvincia && !matchCommittente && !matchBelfiore) {
          return false
        }
      }
      
      // Filtro tipo
      if (filtroTipo && l.tipoLocale !== filtroTipo) return false
      
      // Filtro committente
      if (filtroCommittente === 'con_committente' && !l.committenteDefault) return false
      if (filtroCommittente === 'senza_committente' && l.committenteDefault) return false
      
      return true
    })
  }, [locali, searchQuery, filtroTipo, filtroCommittente])
  
  // Statistiche
  const stats = useMemo(() => ({
    totali: locali.length,
    conCommittente: locali.filter(l => l.committenteDefault).length,
    senzaCommittente: locali.filter(l => !l.committenteDefault).length,
  }), [locali])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg text-red-700">
        <p>{error}</p>
      </div>
    )
  }
  
  const hasFilters = searchQuery || filtroTipo || filtroCommittente !== 'tutti'
  
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Locali</h1>
          <p className="text-sm text-gray-500">Gestione luoghi di esibizione</p>
        </div>
        <Link
          href="/locali/nuovo"
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus size={16} />
          <span>Nuovo</span>
        </Link>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cerca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select 
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tipo</option>
              {Object.entries(TIPI_LOCALE).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
            <select 
              value={filtroCommittente}
              onChange={(e) => setFiltroCommittente(e.target.value as any)}
              className="flex-1 sm:flex-none px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="tutti">Tutti ({stats.totali})</option>
              <option value="con_committente">Con committente ({stats.conCommittente})</option>
              <option value="senza_committente">Senza committente ({stats.senzaCommittente})</option>
            </select>
          </div>
        </div>
        
        {/* Contatore risultati */}
        {hasFilters && (
          <div className="mt-3 text-sm text-gray-500">
            {localiFiltrati.length} risultat{localiFiltrati.length === 1 ? 'o' : 'i'}
            {searchQuery && ` per "${searchQuery}"`}
            <button 
              onClick={() => { setSearchQuery(''); setFiltroTipo(''); setFiltroCommittente('tutti'); }}
              className="ml-2 text-blue-600 hover:underline"
            >
              Rimuovi filtri
            </button>
          </div>
        )}
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Locale
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                  Indirizzo
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Belfiore
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                  Committente
                </th>
                <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Agib.
                </th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {localiFiltrati.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <MapPin className="mx-auto mb-2 text-gray-300" size={48} />
                    {locali.length === 0 ? (
                      <>
                        <p>Nessun locale registrato</p>
                        <Link 
                          href="/locali/nuovo"
                          className="text-blue-600 hover:underline mt-2 inline-block"
                        >
                          Aggiungi il primo locale
                        </Link>
                      </>
                    ) : (
                      <>
                        <p>Nessun risultato per i filtri selezionati</p>
                        <button 
                          onClick={() => { setSearchQuery(''); setFiltroTipo(''); setFiltroCommittente('tutti'); }}
                          className="text-blue-600 hover:underline mt-2 inline-block"
                        >
                          Rimuovi filtri
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                localiFiltrati.map((locale) => (
                  <tr key={locale.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <MapPin size={16} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{locale.nome}</p>
                          <p className="text-xs text-gray-500">
                            {TIPI_LOCALE[locale.tipoLocale] || locale.tipoLocale}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                      <div className="text-xs">
                        {locale.indirizzo && <p className="text-gray-900 truncate max-w-[150px]">{locale.indirizzo}</p>}
                        <p className="text-gray-500">
                          {[locale.citta, locale.provincia].filter(Boolean).join(' ')}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      {locale.codiceBelfiore ? (
                        <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                          {locale.codiceBelfiore}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden md:table-cell">
                      {locale.committenteDefault ? (
                        <span className="text-xs text-gray-900 truncate max-w-[120px] block">
                          {locale.committenteDefault.ragioneSociale}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <span className="text-gray-900 text-sm">{locale._count.agibilita}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <Link
                        href={`/locali/${locale.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Apri
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}