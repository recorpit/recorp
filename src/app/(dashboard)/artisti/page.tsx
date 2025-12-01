// src/app/(dashboard)/artisti/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Users, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react'

// Costanti locali per evitare problemi di import
const QUALIFICA_LABELS: Record<string, string> = {
  'DJ': 'DJ',
  'Vocalist': 'Vocalist',
  'Corista': 'Corista',
  'Musicista': 'Musicista',
  'Ballerino': 'Ballerino/a',
  'Lucista': 'Lucista',
  'Fotografo': 'Fotografo',
  'Truccatore': 'Truccatore',
  'ALTRO': 'Altro',
}

const TIPI_CONTRATTO: Record<string, string> = {
  'OCCASIONALE': 'Occasionale',
  'COCOCO': 'Co.Co.Co.',
  'PARTITA_IVA': 'Partita IVA',
  'DIPENDENTE': 'Dipendente',
}

interface Artista {
  id: string
  nome: string
  cognome: string
  nomeDarte: string | null
  codiceFiscale: string | null
  qualifica: string
  tipoContratto: string
  iscritto: boolean
  extraUE: boolean
  _count: {
    agibilita: number
  }
}

export default function ArtistiPage() {
  const [artisti, setArtisti] = useState<Artista[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filtri
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroIscritto, setFiltroIscritto] = useState<'tutti' | 'iscritti' | 'non_iscritti'>('tutti')
  const [filtroQualifica, setFiltroQualifica] = useState<string>('')
  
  // Carica artisti
  useEffect(() => {
    async function loadArtisti() {
      try {
        const res = await fetch('/api/artisti')
        if (!res.ok) throw new Error('Errore caricamento')
        const data = await res.json()
        setArtisti(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadArtisti()
  }, [])
  
  // Filtra artisti
  const artistiFiltrati = useMemo(() => {
    return artisti.filter(a => {
      // Filtro ricerca
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchNome = a.nome?.toLowerCase().includes(query)
        const matchCognome = a.cognome?.toLowerCase().includes(query)
        const matchNomeDarte = a.nomeDarte?.toLowerCase().includes(query)
        const matchCF = a.codiceFiscale?.toLowerCase().includes(query)
        
        if (!matchNome && !matchCognome && !matchNomeDarte && !matchCF) {
          return false
        }
      }
      
      // Filtro iscritto
      if (filtroIscritto === 'iscritti' && !a.iscritto) return false
      if (filtroIscritto === 'non_iscritti' && a.iscritto) return false
      
      // Filtro qualifica
      if (filtroQualifica && a.qualifica !== filtroQualifica) return false
      
      return true
    })
  }, [artisti, searchQuery, filtroIscritto, filtroQualifica])
  
  // Statistiche
  const stats = useMemo(() => ({
    totali: artisti.length,
    iscritti: artisti.filter(a => a.iscritto).length,
    nonIscritti: artisti.filter(a => !a.iscritto).length,
  }), [artisti])
  
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
  
  const hasFilters = searchQuery || filtroIscritto !== 'tutti' || filtroQualifica
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Artisti</h1>
          <p className="text-gray-500">Gestione anagrafica artisti</p>
        </div>
        <Link
          href="/artisti/nuovo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuovo Artista
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
                placeholder="Cerca per nome, cognome, nome d'arte, CF..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select 
            value={filtroIscritto}
            onChange={(e) => setFiltroIscritto(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="tutti">Tutti ({stats.totali})</option>
            <option value="iscritti">Iscritti ({stats.iscritti})</option>
            <option value="non_iscritti">Non iscritti ({stats.nonIscritti})</option>
          </select>
          <select 
            value={filtroQualifica}
            onChange={(e) => setFiltroQualifica(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutte le qualifiche</option>
            {Object.entries(QUALIFICA_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        
        {/* Contatore risultati */}
        {hasFilters && (
          <div className="mt-3 text-sm text-gray-500">
            {artistiFiltrati.length} risultat{artistiFiltrati.length === 1 ? 'o' : 'i'}
            {searchQuery && ` per "${searchQuery}"`}
            <button 
              onClick={() => { setSearchQuery(''); setFiltroIscritto('tutti'); setFiltroQualifica(''); }}
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
                Artista
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Codice Fiscale
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qualifica
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contratto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agibilità
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Iscritto
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {artistiFiltrati.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <Users className="mx-auto mb-2 text-gray-300" size={48} />
                  {artisti.length === 0 ? (
                    <>
                      <p>Nessun artista registrato</p>
                      <Link 
                        href="/artisti/nuovo"
                        className="text-blue-600 hover:underline mt-2 inline-block"
                      >
                        Aggiungi il primo artista
                      </Link>
                    </>
                  ) : (
                    <>
                      <p>Nessun risultato per i filtri selezionati</p>
                      <button 
                        onClick={() => { setSearchQuery(''); setFiltroIscritto('tutti'); setFiltroQualifica(''); }}
                        className="text-blue-600 hover:underline mt-2 inline-block"
                      >
                        Rimuovi filtri
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              artistiFiltrati.map((artista) => (
                <tr key={artista.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                        ${artista.iscritto ? 'bg-blue-500' : 'bg-gray-400'}
                      `}>
                        {artista.nome.charAt(0)}{artista.cognome.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {artista.cognome} {artista.nome}
                        </p>
                        {artista.nomeDarte && (
                          <p className="text-sm text-gray-500">&quot;{artista.nomeDarte}&quot;</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {artista.codiceFiscale ? (
                      <span className="font-mono text-sm">{artista.codiceFiscale}</span>
                    ) : artista.extraUE ? (
                      <span className="text-gray-400 text-sm">Extra UE</span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${artista.qualifica === 'ALTRO' ? 'text-amber-600 font-medium' : ''}`}>
                      {QUALIFICA_LABELS[artista.qualifica] || artista.qualifica}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">
                      {TIPI_CONTRATTO[artista.tipoContratto] || artista.tipoContratto}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900">{artista._count.agibilita}</span>
                  </td>
                  <td className="px-6 py-4">
                    {artista.iscritto ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircle size={16} />
                        <span className="text-sm">Sì</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <XCircle size={16} />
                        <span className="text-sm">No</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/artisti/${artista.id}`}
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
