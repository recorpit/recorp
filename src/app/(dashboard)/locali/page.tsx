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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locali</h1>
          <p className="text-gray-500">Gestione luoghi di esibizione</p>
        </div>
        <Link
          href="/locali/nuovo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuovo Locale
        </Link>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cerca per nome, città, indirizzo, committente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select 
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti i tipi</option>
            {Object.entries(TIPI_LOCALE).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
          <select 
            value={filtroCommittente}
            onChange={(e) => setFiltroCommittente(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="tutti">Tutti ({stats.totali})</option>
            <option value="con_committente">Con committente ({stats.conCommittente})</option>
            <option value="senza_committente">Senza committente ({stats.senzaCommittente})</option>
          </select>
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
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Locale
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Indirizzo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cod. Belfiore
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Committente Default
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agibilità
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <MapPin size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{locale.nome}</p>
                        <p className="text-sm text-gray-500">
                          {TIPI_LOCALE[locale.tipoLocale] || locale.tipoLocale}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {locale.indirizzo && <p className="text-gray-900">{locale.indirizzo}</p>}
                      <p className="text-gray-500">
                        {[locale.citta, locale.provincia].filter(Boolean).join(' ')}
                        {locale.cap && ` - ${locale.cap}`}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {locale.codiceBelfiore ? (
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {locale.codiceBelfiore}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {locale.committenteDefault ? (
                      <Link 
                        href={`/committenti/${locale.committenteDefault.id}`}
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Building2 size={14} />
                        {locale.committenteDefault.ragioneSociale}
                        {locale.committenteDefault.aRischio && (
                          <span className="text-red-500 ml-1" title="A rischio">⚠️</span>
                        )}
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-sm">Non impostato</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900">{locale._count.agibilita}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/locali/${locale.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Modifica
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
