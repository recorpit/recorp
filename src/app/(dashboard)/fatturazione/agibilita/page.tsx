// src/app/(dashboard)/fatturazione/agibilita/page.tsx
// Pagina Fatturazione Agibilità - Lista e Creazione Fatture
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, FileText, Check, Calendar, MapPin,
  Users, Building2, Search, ChevronDown, ChevronUp,
  Plus, Clock, CalendarClock
} from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

// Funzione per formattare importi
const formatImporto = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Mapping timing fatturazione
const TIMING_LABELS: Record<string, string> = {
  'GIORNALIERA': 'Giornaliera',
  'SETTIMANALE': 'Settimanale',
  'MENSILE': 'Mensile'
}

interface Artista {
  nome: string
  cognome: string
  nomeDarte: string | null
  compensoLordo: number
}

interface Agibilita {
  id: string
  codice: string
  data: string
  locale: { nome: string }
  totaleCompensiLordi: number
  quotaAgenzia: number
  importoTotale: number
  artisti: Artista[]
}

interface CommittenteGroup {
  committente: { id: string; ragioneSociale: string; quotaAgenzia: number; timingFatturazione?: string }
  agibilita: Agibilita[]
  totale: number
  count: number
}

export default function FatturazioneAgibilitaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const committenteIdParam = searchParams.get('committente')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [groups, setGroups] = useState<CommittenteGroup[]>([])
  const [totali, setTotali] = useState({ totale: 0, count: 0, committentiCount: 0 })
  
  // Tab attiva: 'standard' o 'anticipate'
  const [activeTab, setActiveTab] = useState<'standard' | 'anticipate'>('standard')
  
  // Stato selezione
  const [selectedAgibilita, setSelectedAgibilita] = useState<Set<string>>(new Set())
  const [expandedCommittenti, setExpandedCommittenti] = useState<Set<string>>(new Set())
  const [activeCommittente, setActiveCommittente] = useState<string | null>(committenteIdParam)
  
  // Filtri
  const [search, setSearch] = useState('')
  
  useEffect(() => {
    loadData()
  }, [activeTab])
  
  // Espandi automaticamente se c'è un committente selezionato
  useEffect(() => {
    if (committenteIdParam) {
      setExpandedCommittenti(new Set([committenteIdParam]))
      setActiveCommittente(committenteIdParam)
    }
  }, [committenteIdParam])
  
  async function loadData() {
    setLoading(true)
    try {
      const url = activeTab === 'anticipate' 
        ? '/api/fatturazione/da-fatturare?anticipate=true'
        : '/api/fatturazione/da-fatturare'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setGroups(data.byCommittente || [])
        setTotali({
          totale: data.totale,
          count: data.count,
          committentiCount: data.committentiCount
        })
        
        // Se c'è un solo committente, espandilo
        if (data.byCommittente?.length === 1) {
          setExpandedCommittenti(new Set([data.byCommittente[0].committente.id]))
        }
      }
    } catch (err) {
      console.error('Errore:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Toggle espansione committente
  const toggleCommittente = (id: string) => {
    setExpandedCommittenti(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }
  
  // Seleziona/deseleziona agibilità
  const toggleAgibilita = (id: string, committenteId: string) => {
    // Se cambia committente, resetta selezione
    if (activeCommittente && activeCommittente !== committenteId) {
      setSelectedAgibilita(new Set([id]))
      setActiveCommittente(committenteId)
    } else {
      setSelectedAgibilita(prev => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
      setActiveCommittente(committenteId)
    }
  }
  
  // Seleziona tutte di un committente
  const selectAllCommittente = (group: CommittenteGroup) => {
    const ids = group.agibilita.map(a => a.id)
    const allSelected = ids.every(id => selectedAgibilita.has(id))
    
    if (allSelected) {
      // Deseleziona tutte
      setSelectedAgibilita(prev => {
        const next = new Set(prev)
        ids.forEach(id => next.delete(id))
        return next
      })
    } else {
      // Seleziona tutte (e imposta committente attivo)
      setSelectedAgibilita(new Set(ids))
      setActiveCommittente(group.committente.id)
    }
  }
  
  // Calcola totale selezionato
  const totaleSelezionato = useMemo(() => {
    let tot = 0
    groups.forEach(g => {
      g.agibilita.forEach(a => {
        if (selectedAgibilita.has(a.id)) {
          tot += a.importoTotale
        }
      })
    })
    return tot
  }, [groups, selectedAgibilita])
  
  // Crea fattura
  const handleCreaFattura = async () => {
    if (selectedAgibilita.size === 0 || !activeCommittente) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/fatture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          committenteId: activeCommittente,
          agibilitaIds: Array.from(selectedAgibilita),
          // Non passo modalitaRighe - l'API userà il default del committente
          aliquotaIva: 22,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore creazione fattura')
      }
      
      const fattura = await res.json()
      router.push(`/fatture/${fattura.id}`)
      
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  // Filtro ricerca
  const groupsFiltrati = useMemo(() => {
    if (!search) return groups
    
    const term = search.toLowerCase()
    return groups.filter(g => 
      g.committente.ragioneSociale.toLowerCase().includes(term) ||
      g.agibilita.some(a => 
        a.codice.toLowerCase().includes(term) ||
        a.locale.nome.toLowerCase().includes(term)
      )
    )
  }, [groups, search])
  
  // Committente attivo (per mostrare info nella sidebar)
  const committenteAttivo = groups.find(g => g.committente.id === activeCommittente)
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <div className="flex gap-6">
      {/* Colonna principale */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/fatturazione"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agibilità da Fatturare</h1>
            <p className="text-gray-500">
              {totali.count} agibilità • {totali.committentiCount} committenti • €{formatImporto(totali.totale)}
            </p>
          </div>
        </div>
        
        {/* Tab Da Fatturare / Anticipate */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('standard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'standard'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Clock size={18} />
            Da Fatturare
          </button>
          <button
            onClick={() => setActiveTab('anticipate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'anticipate'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <CalendarClock size={18} />
            Anticipate (Future)
          </button>
        </div>
        
        {activeTab === 'anticipate' && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 text-sm">
            <strong>Fatturazione anticipata:</strong> Qui vedi tutte le agibilità, incluse quelle con data futura. 
            Utile per fatturare in anticipo rispetto al timing configurato per committente.
          </div>
        )}
        
        {/* Barra ricerca */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cerca committente, codice o locale..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Lista committenti con agibilità */}
        {groupsFiltrati.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Check className="mx-auto mb-4 text-green-500" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tutto fatturato!</h3>
            <p className="text-gray-500">Non ci sono agibilità da fatturare</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupsFiltrati.map(group => {
              const isExpanded = expandedCommittenti.has(group.committente.id)
              const selectedCount = group.agibilita.filter(a => selectedAgibilita.has(a.id)).length
              const allSelected = selectedCount === group.agibilita.length && selectedCount > 0
              const isActive = activeCommittente === group.committente.id
              
              return (
                <div 
                  key={group.committente.id}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                    isActive ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-100'
                  }`}
                >
                  {/* Header committente */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleCommittente(group.committente.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isActive ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Building2 size={20} className={isActive ? 'text-blue-600' : 'text-gray-500'} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{group.committente.ragioneSociale}</h3>
                            {group.committente.timingFatturazione && (
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                group.committente.timingFatturazione === 'GIORNALIERA' ? 'bg-green-100 text-green-700' :
                                group.committente.timingFatturazione === 'MENSILE' ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {TIMING_LABELS[group.committente.timingFatturazione] || 'Settimanale'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {group.count} agibilità • Quota €{formatImporto(group.committente.quotaAgenzia)}/artista
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {selectedCount > 0 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                            {selectedCount} selezionate
                          </span>
                        )}
                        <span className="text-lg font-bold text-gray-900">
                          €{formatImporto(group.totale)}
                        </span>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>
                  
                  {/* Lista agibilità */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {/* Seleziona tutte */}
                      <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() => selectAllCommittente(group)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-sm text-gray-600">Seleziona tutte</span>
                        </label>
                        {selectedCount > 0 && (
                          <span className="text-sm text-gray-500">
                            Totale selezionato: €{formatImporto(group.agibilita
                              .filter(a => selectedAgibilita.has(a.id))
                              .reduce((sum, a) => sum + a.importoTotale, 0))}
                          </span>
                        )}
                      </div>
                      
                      {/* Agibilità */}
                      <div className="divide-y divide-gray-100">
                        {group.agibilita.map(agi => {
                          const isSelected = selectedAgibilita.has(agi.id)
                          
                          return (
                            <label
                              key={agi.id}
                              className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleAgibilita(agi.id, group.committente.id)}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600"
                              />
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-blue-600">{agi.codice}</span>
                                  <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Calendar size={14} />
                                    {format(new Date(agi.data), 'EEE d MMM', { locale: it })}
                                  </span>
                                  <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <MapPin size={14} />
                                    {agi.locale.nome}
                                  </span>
                                </div>
                                <div className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                                  <Users size={14} />
                                  {agi.artisti.map(a => a.nomeDarte || `${a.nome} ${a.cognome}`).join(', ')}
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                  €{formatImporto(agi.importoTotale)}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Compensi €{formatImporto(agi.totaleCompensiLordi)}
                                </p>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Sidebar - Riepilogo e azioni */}
      <div className="w-80 shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-6">
          <h3 className="font-semibold text-gray-900 mb-4">Crea Fattura</h3>
          
          {selectedAgibilita.size === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <FileText size={40} className="mx-auto mb-2 opacity-50" />
              <p>Seleziona le agibilità da fatturare</p>
            </div>
          ) : (
            <>
              {/* Committente */}
              <div className="mb-4 pb-4 border-b border-gray-100">
                <p className="text-sm text-gray-500">Committente</p>
                <p className="font-medium">{committenteAttivo?.committente.ragioneSociale}</p>
              </div>
              
              {/* Riepilogo */}
              <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Agibilità:</span>
                  <span>{selectedAgibilita.size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Imponibile:</span>
                  <span>€{formatImporto(totaleSelezionato)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IVA 22%:</span>
                  <span>€{formatImporto(totaleSelezionato * 0.22)}</span>
                </div>
              </div>
              
              {/* Totale */}
              <div className="flex justify-between text-lg font-bold mb-6">
                <span>Totale:</span>
                <span className="text-blue-600">
                  €{formatImporto(totaleSelezionato * 1.22)}
                </span>
              </div>
              
              {/* Azioni */}
              <div className="space-y-3">
                <button
                  onClick={handleCreaFattura}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creazione...
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      Crea Fattura
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setSelectedAgibilita(new Set())
                    setActiveCommittente(null)
                  }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Annulla selezione
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
