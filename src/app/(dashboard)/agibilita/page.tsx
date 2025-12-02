// src/app/(dashboard)/agibilita/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, AlertTriangle, ExternalLink, Upload, Copy, MoreVertical, Loader2, Edit, Layers } from 'lucide-react'
import { STATI_AGIBILITA } from '@/lib/constants'

export default function AgibilitaPage() {
  const router = useRouter()
  const [agibilita, setAgibilita] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statoFilter, setStatoFilter] = useState('')
  const [menuAperto, setMenuAperto] = useState<string | null>(null)
  const [duplicando, setDuplicando] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/agibilita')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAgibilita(data)
        }
      })
      .catch(err => console.error('Errore caricamento:', err))
      .finally(() => setLoading(false))
  }, [])

  // Chiudi menu quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAperto(null)
      }
    }
    
    if (menuAperto) {
      // Aggiungi listener solo quando menu è aperto, con delay
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 10)
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [menuAperto])

  // Duplica agibilità
  const handleDuplica = async (id: string, codice: string) => {
    if (!confirm(`Vuoi duplicare l'agibilità ${codice}?`)) return
    
    setDuplicando(id)
    setMenuAperto(null)
    
    try {
      const res = await fetch(`/api/agibilita/${id}/duplica`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Errore nella duplicazione')
      }
      
      router.push(`/agibilita/${data.agibilita.id}`)
      
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDuplicando(null)
    }
  }

  // Toggle menu
  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuAperto(prev => prev === id ? null : id)
  }

  // Filtra agibilità
  const agibilitaFiltrate = agibilita.filter(ag => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchCodice = ag.codice?.toLowerCase().includes(term)
      const matchLocale = ag.locale?.nome?.toLowerCase().includes(term)
      const matchFormat = ag.format?.nome?.toLowerCase().includes(term)
      const matchArtisti = ag.artisti?.some((aa: any) => {
        const artista = aa.artista
        const nome = `${artista.cognome} ${artista.nome}`.toLowerCase()
        const nomeDarte = artista.nomeDarte?.toLowerCase() || ''
        return nome.includes(term) || nomeDarte.includes(term)
      })
      
      if (!matchCodice && !matchLocale && !matchFormat && !matchArtisti) return false
    }
    
    if (statoFilter && ag.stato !== statoFilter) return false
    
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Agibilità</h1>
          <p className="text-sm text-gray-500">Gestione pratiche INPS</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/agibilita/import-massivo"
            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">Import ZIP</span>
          </Link>
          <Link
            href="/agibilita/nuova"
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus size={16} />
            <span>Nuova</span>
          </Link>
        </div>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select 
            value={statoFilter}
            onChange={(e) => setStatoFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti gli stati</option>
            {Object.entries(STATI_AGIBILITA).map(([key, value]) => (
              <option key={key} value={key}>{value.icon} {value.label}</option>
            ))}
          </select>
        </div>
        
        <div className="mt-3 flex gap-4 text-sm text-gray-600">
          <span>Totale: <strong>{agibilita.length}</strong></span>
          {searchTerm || statoFilter ? (
            <span>Filtrate: <strong>{agibilitaFiltrate.length}</strong></span>
          ) : null}
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Codice</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artisti</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Locale</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Committente</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Importo</th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {agibilitaFiltrate.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  {searchTerm || statoFilter ? 'Nessuna agibilità trovata' : 'Nessuna agibilità presente'}
                </td>
              </tr>
            ) : (
              agibilitaFiltrate.map((ag) => {
                const stato = STATI_AGIBILITA[ag.stato as keyof typeof STATI_AGIBILITA]
                const primoArtista = ag.artisti?.[0]?.artista
                const numArtisti = ag.artisti?.length || 0
                
                return (
                  <tr key={ag.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Link href={`/agibilita/${ag.id}`} className="text-blue-600 hover:text-blue-800 font-mono font-medium text-sm">
                          {ag.codice}
                        </Link>
                        {ag.format && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium hidden sm:inline-flex items-center gap-0.5">
                            <Layers size={10} />
                            {ag.format.nome}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {new Date(ag.data).toLocaleDateString('it-IT')}
                      {ag.dataFine && ag.dataFine !== ag.data && (
                        <span className="text-gray-500 hidden sm:inline"> → {new Date(ag.dataFine).toLocaleDateString('it-IT')}</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm">
                      {primoArtista ? (
                        <div className="flex items-center gap-1">
                          <span className="truncate max-w-[100px] sm:max-w-none">{primoArtista.nomeDarte || `${primoArtista.cognome} ${primoArtista.nome}`}</span>
                          {numArtisti > 1 && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              +{numArtisti - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/D</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      <span className="truncate max-w-[80px] sm:max-w-none block">{ag.locale?.nome}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm hidden md:table-cell">
                      {ag.committente ? (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-900 truncate max-w-[120px]">{ag.committente.ragioneSociale}</span>
                          {ag.committente.aRischio && (
                            <span className="text-red-500" title="A rischio">
                              <AlertTriangle size={12} />
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-amber-500 flex items-center gap-1 text-xs">
                          <AlertTriangle size={12} />
                          Da assegnare
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        ag.stato === 'BOZZA' ? 'bg-gray-100 text-gray-700' :
                        ag.stato === 'PRONTA' ? 'bg-blue-100 text-blue-700' :
                        ag.stato === 'INVIATA_INPS' ? 'bg-purple-100 text-purple-700' :
                        ag.stato === 'COMPLETATA' ? 'bg-green-100 text-green-700' :
                        ag.stato === 'ERRORE' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {stato?.icon} <span className="hidden sm:inline">{stato?.label || ag.stato}</span>
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium">
                      €{parseFloat(ag.importoFattura || 0).toFixed(0)}
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-1">
                        <Link 
                          href={`/agibilita/${ag.id}`}
                          className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
                        >
                          Apri
                        </Link>
                        
                        {/* Menu azioni */}
                        <div className="relative" ref={menuAperto === ag.id ? menuRef : null}>
                          <button
                            onClick={(e) => toggleMenu(ag.id, e)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                          >
                            {duplicando === ag.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <MoreVertical size={18} />
                            )}
                          </button>
                          
                          {menuAperto === ag.id && (
                            <div 
                              className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link
                                href={`/agibilita/${ag.id}/modifica`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                                onClick={() => setMenuAperto(null)}
                              >
                                <Edit size={16} />
                                Modifica
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleDuplica(ag.id, ag.codice)
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                              >
                                <Copy size={16} />
                                Duplica
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}