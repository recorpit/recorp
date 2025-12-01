// src/app/(dashboard)/committenti/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Plus, AlertTriangle, Building2, Search, Loader2 } from 'lucide-react'

interface Committente {
  id: string
  ragioneSociale: string
  partitaIva: string | null
  codiceFiscale: string | null
  cittaFatturazione: string | null
  quotaAgenzia: number
  aRischio: boolean
  _count: {
    agibilita: number
    fatture: number
    localiDefault: number
  }
}

export default function CommittentiPage() {
  const [committenti, setCommittenti] = useState<Committente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filtri
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroStato, setFiltroStato] = useState<'tutti' | 'rischio' | 'regolari'>('tutti')
  
  // Carica committenti
  useEffect(() => {
    async function loadCommittenti() {
      try {
        const res = await fetch('/api/committenti')
        if (!res.ok) throw new Error('Errore caricamento')
        const data = await res.json()
        
        // Converti Decimal in numeri
        const converted = data.map((c: any) => ({
          ...c,
          quotaAgenzia: c.quotaAgenzia ? Number(c.quotaAgenzia) : 0,
        }))
        
        setCommittenti(converted)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadCommittenti()
  }, [])
  
  // Filtra committenti
  const committentiFiltrati = useMemo(() => {
    return committenti.filter(c => {
      // Filtro ricerca
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchRagioneSociale = c.ragioneSociale?.toLowerCase().includes(query)
        const matchPIVA = c.partitaIva?.toLowerCase().includes(query)
        const matchCF = c.codiceFiscale?.toLowerCase().includes(query)
        const matchCitta = c.cittaFatturazione?.toLowerCase().includes(query)
        
        if (!matchRagioneSociale && !matchPIVA && !matchCF && !matchCitta) {
          return false
        }
      }
      
      // Filtro stato
      if (filtroStato === 'rischio' && !c.aRischio) return false
      if (filtroStato === 'regolari' && c.aRischio) return false
      
      return true
    })
  }, [committenti, searchQuery, filtroStato])
  
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
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Committenti</h1>
          <p className="text-gray-500">Gestione entità fiscali e fatturazione</p>
        </div>
        <Link
          href="/committenti/nuovo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuovo Committente
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
                placeholder="Cerca per ragione sociale, P.IVA, CF, città..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select 
            value={filtroStato}
            onChange={(e) => setFiltroStato(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="tutti">Tutti ({committenti.length})</option>
            <option value="rischio">A rischio ({committenti.filter(c => c.aRischio).length})</option>
            <option value="regolari">Regolari ({committenti.filter(c => !c.aRischio).length})</option>
          </select>
        </div>
        
        {/* Contatore risultati */}
        {(searchQuery || filtroStato !== 'tutti') && (
          <div className="mt-3 text-sm text-gray-500">
            {committentiFiltrati.length} risultat{committentiFiltrati.length === 1 ? 'o' : 'i'} 
            {searchQuery && ` per "${searchQuery}"`}
            {filtroStato !== 'tutti' && ` (${filtroStato})`}
            {(searchQuery || filtroStato !== 'tutti') && (
              <button 
                onClick={() => { setSearchQuery(''); setFiltroStato('tutti'); }}
                className="ml-2 text-blue-600 hover:underline"
              >
                Rimuovi filtri
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Committente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                P.IVA / CF
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quota Agenzia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agibilità
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {committentiFiltrati.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <Building2 className="mx-auto mb-2 text-gray-300" size={48} />
                  {committenti.length === 0 ? (
                    <>
                      <p>Nessun committente registrato</p>
                      <Link 
                        href="/committenti/nuovo"
                        className="text-blue-600 hover:underline mt-2 inline-block"
                      >
                        Aggiungi il primo committente
                      </Link>
                    </>
                  ) : (
                    <>
                      <p>Nessun risultato per i filtri selezionati</p>
                      <button 
                        onClick={() => { setSearchQuery(''); setFiltroStato('tutti'); }}
                        className="text-blue-600 hover:underline mt-2 inline-block"
                      >
                        Rimuovi filtri
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              committentiFiltrati.map((committente) => (
                <tr key={committente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${committente.aRischio ? 'bg-red-100' : 'bg-purple-100'}
                      `}>
                        <Building2 
                          size={20} 
                          className={committente.aRischio ? 'text-red-600' : 'text-purple-600'} 
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{committente.ragioneSociale}</p>
                        {committente.cittaFatturazione && (
                          <p className="text-sm text-gray-500">{committente.cittaFatturazione}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {committente.partitaIva && (
                        <p className="text-gray-900">{committente.partitaIva}</p>
                      )}
                      {committente.codiceFiscale && (
                        <p className="text-gray-500">{committente.codiceFiscale}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${committente.quotaAgenzia > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      €{committente.quotaAgenzia.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-900">{committente._count.agibilita}</span>
                      {committente._count.localiDefault > 0 && (
                        <span className="text-gray-500">
                          ({committente._count.localiDefault} locali)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {committente.aRischio ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <AlertTriangle size={12} />
                        A rischio
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Regolare
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/committenti/${committente.id}`}
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
