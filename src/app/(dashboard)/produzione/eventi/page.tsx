// src/app/(dashboard)/produzione/eventi/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Calendar,
  MapPin,
  Building2,
  Users,
  Package,
  FileText,
  Loader2,
  AlertTriangle,
  ChevronDown,
  Filter
} from 'lucide-react'

// Costanti
const TIPO_EVENTO_LABELS: Record<string, string> = {
  'CONCERTO': 'Concerto',
  'FESTIVAL': 'Festival',
  'CLUB': 'Club',
  'APERITIVO': 'Aperitivo',
  'MATRIMONIO': 'Matrimonio',
  'CORPORATE': 'Corporate',
  'PIAZZA': 'Piazza',
  'PRIVATO': 'Privato',
  'FORMAT': 'Format',
  'ALTRO': 'Altro',
}

const STATO_EVENTO_LABELS: Record<string, { label: string; color: string }> = {
  'PREVENTIVO': { label: 'Preventivo', color: 'bg-gray-100 text-gray-700' },
  'PREVENTIVO_INVIATO': { label: 'Prev. Inviato', color: 'bg-yellow-100 text-yellow-700' },
  'CONFERMATO': { label: 'Confermato', color: 'bg-blue-100 text-blue-700' },
  'IN_PRODUZIONE': { label: 'In Produzione', color: 'bg-purple-100 text-purple-700' },
  'PRONTO': { label: 'Pronto', color: 'bg-green-100 text-green-700' },
  'IN_CORSO': { label: 'In Corso', color: 'bg-green-500 text-white' },
  'COMPLETATO': { label: 'Completato', color: 'bg-emerald-100 text-emerald-700' },
  'CHIUSO': { label: 'Chiuso', color: 'bg-gray-500 text-white' },
  'ANNULLATO': { label: 'Annullato', color: 'bg-red-100 text-red-700' },
  'SOSPESO': { label: 'Sospeso', color: 'bg-orange-100 text-orange-700' },
}

interface Evento {
  id: string
  codice: string
  nome: string
  tipo: string
  stato: string
  dataInizio: string
  dataFine: string | null
  oraInizioEvento: string | null
  committente: {
    id: string
    ragioneSociale: string
    aRischio: boolean
  } | null
  locale: {
    id: string
    nome: string
    citta: string | null
  } | null
  format: {
    id: string
    nome: string
  } | null
  ricavoPrevisto: number | null
  costoPrevisto: number | null
  _count: {
    assegnazioniStaff: number
    assegnazioniArtisti: number
    materialiEvento: number
    preventivi: number
  }
}

export default function EventiPage() {
  const [eventi, setEventi] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filtri
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroStato, setFiltroStato] = useState<string>('')
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [filtroData, setFiltroData] = useState<'tutti' | 'futuri' | 'passati' | 'oggi' | 'settimana'>('futuri')
  const [showFilters, setShowFilters] = useState(false)
  
  // Carica eventi
  useEffect(() => {
    loadEventi()
  }, [])
  
  const loadEventi = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/produzione/eventi')
      if (!res.ok) throw new Error('Errore caricamento')
      const data = await res.json()
      setEventi(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Filtra eventi
  const eventiFiltrati = useMemo(() => {
    const oggi = new Date()
    oggi.setHours(0, 0, 0, 0)
    const settimana = new Date(oggi)
    settimana.setDate(settimana.getDate() + 7)
    
    return eventi.filter(e => {
      const dataEvento = new Date(e.dataInizio)
      dataEvento.setHours(0, 0, 0, 0)
      
      // Filtro ricerca
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchNome = e.nome?.toLowerCase().includes(query)
        const matchCodice = e.codice?.toLowerCase().includes(query)
        const matchCommittente = e.committente?.ragioneSociale?.toLowerCase().includes(query)
        const matchLocale = e.locale?.nome?.toLowerCase().includes(query)
        
        if (!matchNome && !matchCodice && !matchCommittente && !matchLocale) {
          return false
        }
      }
      
      // Filtro stato
      if (filtroStato && e.stato !== filtroStato) return false
      
      // Filtro tipo
      if (filtroTipo && e.tipo !== filtroTipo) return false
      
      // Filtro data
      if (filtroData === 'futuri' && dataEvento < oggi) return false
      if (filtroData === 'passati' && dataEvento >= oggi) return false
      if (filtroData === 'oggi' && dataEvento.getTime() !== oggi.getTime()) return false
      if (filtroData === 'settimana' && (dataEvento < oggi || dataEvento > settimana)) return false
      
      return true
    })
  }, [eventi, searchQuery, filtroStato, filtroTipo, filtroData])
  
  // Statistiche
  const stats = useMemo(() => {
    const oggi = new Date()
    oggi.setHours(0, 0, 0, 0)
    
    return {
      totali: eventi.length,
      futuri: eventi.filter(e => new Date(e.dataInizio) >= oggi).length,
      inProduzione: eventi.filter(e => e.stato === 'IN_PRODUZIONE').length,
      confermati: eventi.filter(e => e.stato === 'CONFERMATO').length,
    }
  }, [eventi])
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }
  
  const formatCurrency = (value: number | null) => {
    if (!value) return '-'
    return new Intl.NumberFormat('it-IT', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }
  
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
        <button onClick={loadEventi} className="mt-2 text-red-600 underline">
          Riprova
        </button>
      </div>
    )
  }
  
  const hasFilters = searchQuery || filtroStato || filtroTipo || filtroData !== 'futuri'
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventi / Produzione</h1>
          <p className="text-gray-500">Gestione eventi e dossier produzione</p>
        </div>
        <Link
          href="/produzione/eventi/nuovo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuovo Evento
        </Link>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Totali</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totali}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Futuri</p>
          <p className="text-2xl font-bold text-blue-600">{stats.futuri}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Confermati</p>
          <p className="text-2xl font-bold text-green-600">{stats.confermati}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">In Produzione</p>
          <p className="text-2xl font-bold text-purple-600">{stats.inProduzione}</p>
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
                placeholder="Cerca per nome, codice, committente, locale..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select 
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="tutti">Tutte le date</option>
            <option value="futuri">Solo futuri</option>
            <option value="oggi">Oggi</option>
            <option value="settimana">Prossimi 7 giorni</option>
            <option value="passati">Passati</option>
          </select>
          
          <select 
            value={filtroStato}
            onChange={(e) => setFiltroStato(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti gli stati</option>
            {Object.entries(STATO_EVENTO_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Altri filtri</span>
            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {/* Filtri espansi */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4">
            <select 
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tutti i tipi</option>
              {Object.entries(TIPO_EVENTO_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Contatore risultati */}
        {hasFilters && (
          <div className="mt-3 text-sm text-gray-500">
            {eventiFiltrati.length} risultat{eventiFiltrati.length === 1 ? 'o' : 'i'}
            <button 
              onClick={() => { 
                setSearchQuery(''); 
                setFiltroStato(''); 
                setFiltroTipo(''); 
                setFiltroData('futuri'); 
              }}
              className="ml-2 text-blue-600 hover:underline"
            >
              Rimuovi filtri
            </button>
          </div>
        )}
      </div>
      
      {/* Lista eventi */}
      <div className="space-y-4">
        {eventiFiltrati.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="mx-auto mb-4 text-gray-300" size={48} />
            {eventi.length === 0 ? (
              <>
                <p className="text-gray-500">Nessun evento registrato</p>
                <Link 
                  href="/produzione/eventi/nuovo"
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  Crea il primo evento
                </Link>
              </>
            ) : (
              <>
                <p className="text-gray-500">Nessun risultato per i filtri selezionati</p>
                <button 
                  onClick={() => { 
                    setSearchQuery(''); 
                    setFiltroStato(''); 
                    setFiltroTipo(''); 
                    setFiltroData('futuri'); 
                  }}
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  Rimuovi filtri
                </button>
              </>
            )}
          </div>
        ) : (
          eventiFiltrati.map((evento) => (
            <Link
              key={evento.id}
              href={`/produzione/eventi/${evento.id}`}
              className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Info principale */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-500">{evento.codice}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATO_EVENTO_LABELS[evento.stato]?.color || 'bg-gray-100'
                      }`}>
                        {STATO_EVENTO_LABELS[evento.stato]?.label || evento.stato}
                      </span>
                      <span className="text-xs text-gray-400">
                        {TIPO_EVENTO_LABELS[evento.tipo] || evento.tipo}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {evento.nome}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(evento.dataInizio)}
                        {evento.oraInizioEvento && ` - ${evento.oraInizioEvento}`}
                      </span>
                      
                      {evento.locale && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {evento.locale.nome}
                          {evento.locale.citta && `, ${evento.locale.citta}`}
                        </span>
                      )}
                      
                      {evento.committente && (
                        <span className="flex items-center gap-1">
                          <Building2 size={14} />
                          {evento.committente.ragioneSociale}
                          {evento.committente.aRischio && (
                            <AlertTriangle size={14} className="text-red-500" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats e importi */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1" title="Artisti">
                        <Users size={14} />
                        {evento._count.assegnazioniArtisti}
                      </span>
                      <span className="flex items-center gap-1" title="Staff">
                        <Users size={14} className="text-purple-500" />
                        {evento._count.assegnazioniStaff}
                      </span>
                      <span className="flex items-center gap-1" title="Materiali">
                        <Package size={14} />
                        {evento._count.materialiEvento}
                      </span>
                      {evento._count.preventivi > 0 && (
                        <span className="flex items-center gap-1" title="Preventivi">
                          <FileText size={14} />
                          {evento._count.preventivi}
                        </span>
                      )}
                    </div>
                    
                    {(evento.ricavoPrevisto || evento.costoPrevisto) && (
                      <div className="text-right">
                        {evento.ricavoPrevisto && (
                          <p className="text-sm font-medium text-green-600">
                            {formatCurrency(evento.ricavoPrevisto)}
                          </p>
                        )}
                        {evento.costoPrevisto && (
                          <p className="text-xs text-gray-400">
                            Costi: {formatCurrency(evento.costoPrevisto)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
