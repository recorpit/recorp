// src/app/(dashboard)/magazzino/materiali/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Package,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wrench,
  Filter
} from 'lucide-react'

// Costanti
const CATEGORIA_LABELS: Record<string, { label: string; color: string }> = {
  'AUDIO': { label: 'Audio', color: 'bg-blue-100 text-blue-700' },
  'LUCI': { label: 'Luci', color: 'bg-yellow-100 text-yellow-700' },
  'VIDEO': { label: 'Video', color: 'bg-purple-100 text-purple-700' },
  'LED': { label: 'LED', color: 'bg-pink-100 text-pink-700' },
  'STRUTTURE': { label: 'Strutture', color: 'bg-gray-100 text-gray-700' },
  'BACKLINE': { label: 'Backline', color: 'bg-green-100 text-green-700' },
  'ELETTRICO': { label: 'Elettrico', color: 'bg-orange-100 text-orange-700' },
  'TRASPORTO': { label: 'Trasporto', color: 'bg-indigo-100 text-indigo-700' },
  'CONSUMABILE': { label: 'Consumabile', color: 'bg-red-100 text-red-700' },
  'ALTRO': { label: 'Altro', color: 'bg-gray-100 text-gray-700' },
}

const STATO_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  'DISPONIBILE': { label: 'Disponibile', color: 'text-green-600', icon: CheckCircle },
  'IN_USO': { label: 'In Uso', color: 'text-blue-600', icon: Package },
  'MANUTENZIONE': { label: 'Manutenzione', color: 'text-orange-600', icon: Wrench },
  'DANNEGGIATO': { label: 'Danneggiato', color: 'text-red-600', icon: AlertTriangle },
  'DISMESSO': { label: 'Dismesso', color: 'text-gray-400', icon: XCircle },
}

interface Materiale {
  id: string
  codice: string
  nome: string
  descrizione: string | null
  categoria: string
  quantitaTotale: number
  quantitaDisponibile: number
  stato: string
  marca: string | null
  modello: string | null
  ubicazione: string | null
  prezzoNoleggio: number | null
  attivo: boolean
  consumabile: boolean
  _count: {
    movimenti: number
    eventiMateriale: number
    pacchetti: number
  }
}

export default function MaterialiPage() {
  const [materiali, setMateriali] = useState<Materiale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filtri
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('')
  const [filtroStato, setFiltroStato] = useState<string>('')
  const [filtroAttivo, setFiltroAttivo] = useState<'tutti' | 'attivi' | 'inattivi'>('attivi')
  
  // Carica materiali
  useEffect(() => {
    loadMateriali()
  }, [])
  
  const loadMateriali = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/magazzino/materiali')
      if (!res.ok) throw new Error('Errore caricamento')
      const data = await res.json()
      setMateriali(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Filtra materiali
  const materialiFiltrati = useMemo(() => {
    return materiali.filter(m => {
      // Filtro ricerca
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchCodice = m.codice?.toLowerCase().includes(query)
        const matchNome = m.nome?.toLowerCase().includes(query)
        const matchMarca = m.marca?.toLowerCase().includes(query)
        const matchModello = m.modello?.toLowerCase().includes(query)
        
        if (!matchCodice && !matchNome && !matchMarca && !matchModello) {
          return false
        }
      }
      
      // Filtro categoria
      if (filtroCategoria && m.categoria !== filtroCategoria) return false
      
      // Filtro stato
      if (filtroStato && m.stato !== filtroStato) return false
      
      // Filtro attivo
      if (filtroAttivo === 'attivi' && !m.attivo) return false
      if (filtroAttivo === 'inattivi' && m.attivo) return false
      
      return true
    })
  }, [materiali, searchQuery, filtroCategoria, filtroStato, filtroAttivo])
  
  // Statistiche
  const stats = useMemo(() => ({
    totali: materiali.length,
    disponibili: materiali.filter(m => m.stato === 'DISPONIBILE' && m.attivo).length,
    inUso: materiali.filter(m => m.stato === 'IN_USO').length,
    manutenzione: materiali.filter(m => m.stato === 'MANUTENZIONE').length,
  }), [materiali])
  
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
        <button onClick={loadMateriali} className="mt-2 text-red-600 underline">
          Riprova
        </button>
      </div>
    )
  }
  
  const hasFilters = searchQuery || filtroCategoria || filtroStato || filtroAttivo !== 'attivi'
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materiali</h1>
          <p className="text-gray-500">Gestione inventario magazzino</p>
        </div>
        <Link
          href="/magazzino/materiali/nuovo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuovo Materiale
        </Link>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Totali</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totali}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Disponibili</p>
          <p className="text-2xl font-bold text-green-600">{stats.disponibili}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">In Uso</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inUso}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Manutenzione</p>
          <p className="text-2xl font-bold text-orange-600">{stats.manutenzione}</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cerca per codice, nome, marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select 
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutte le categorie</option>
            {Object.entries(CATEGORIA_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <select 
            value={filtroStato}
            onChange={(e) => setFiltroStato(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti gli stati</option>
            {Object.entries(STATO_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <select 
            value={filtroAttivo}
            onChange={(e) => setFiltroAttivo(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="tutti">Tutti</option>
            <option value="attivi">Solo attivi</option>
            <option value="inattivi">Solo dismessi</option>
          </select>
        </div>
        
        {hasFilters && (
          <div className="mt-3 text-sm text-gray-500">
            {materialiFiltrati.length} risultat{materialiFiltrati.length === 1 ? 'o' : 'i'}
            <button 
              onClick={() => { 
                setSearchQuery(''); 
                setFiltroCategoria(''); 
                setFiltroStato(''); 
                setFiltroAttivo('attivi'); 
              }}
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
                Materiale
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantità
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ubicazione
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prezzo Nol.
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {materialiFiltrati.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <Package className="mx-auto mb-2 text-gray-300" size={48} />
                  {materiali.length === 0 ? (
                    <>
                      <p>Nessun materiale registrato</p>
                      <Link 
                        href="/magazzino/materiali/nuovo"
                        className="text-blue-600 hover:underline mt-2 inline-block"
                      >
                        Aggiungi il primo
                      </Link>
                    </>
                  ) : (
                    <>
                      <p>Nessun risultato per i filtri selezionati</p>
                      <button 
                        onClick={() => { 
                          setSearchQuery(''); 
                          setFiltroCategoria(''); 
                          setFiltroStato(''); 
                          setFiltroAttivo('attivi'); 
                        }}
                        className="text-blue-600 hover:underline mt-2 inline-block"
                      >
                        Rimuovi filtri
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              materialiFiltrati.map((m) => {
                const StatoIcon = STATO_LABELS[m.stato]?.icon || Package
                
                return (
                  <tr key={m.id} className={`hover:bg-gray-50 ${!m.attivo ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-mono text-sm text-gray-500">{m.codice}</p>
                        <p className="font-medium text-gray-900">{m.nome}</p>
                        {(m.marca || m.modello) && (
                          <p className="text-sm text-gray-500">
                            {[m.marca, m.modello].filter(Boolean).join(' - ')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        CATEGORIA_LABELS[m.categoria]?.color || 'bg-gray-100 text-gray-700'
                      }`}>
                        {CATEGORIA_LABELS[m.categoria]?.label || m.categoria}
                      </span>
                      {m.consumabile && (
                        <span className="ml-2 px-2 py-1 rounded text-xs bg-red-50 text-red-600">
                          Cons.
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-medium ${
                        m.quantitaDisponibile === 0 ? 'text-red-600' :
                        m.quantitaDisponibile < m.quantitaTotale ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {m.quantitaDisponibile}
                      </span>
                      <span className="text-gray-400"> / {m.quantitaTotale}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 ${
                        STATO_LABELS[m.stato]?.color || 'text-gray-600'
                      }`}>
                        <StatoIcon size={16} />
                        <span className="text-sm">
                          {STATO_LABELS[m.stato]?.label || m.stato}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {m.ubicazione || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {m.prezzoNoleggio ? (
                        <span className="font-medium">€ {m.prezzoNoleggio}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/magazzino/materiali/${m.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Modifica
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
