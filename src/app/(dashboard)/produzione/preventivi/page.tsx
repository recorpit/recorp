// src/app/(dashboard)/produzione/preventivi/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  FileText,
  Loader2,
  Calendar,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Send,
  Euro
} from 'lucide-react'

const STATO_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  'BOZZA': { label: 'Bozza', color: 'bg-gray-100 text-gray-700', icon: FileText },
  'INVIATO': { label: 'Inviato', color: 'bg-blue-100 text-blue-700', icon: Send },
  'VISIONATO': { label: 'Visionato', color: 'bg-yellow-100 text-yellow-700', icon: Eye },
  'ACCETTATO': { label: 'Accettato', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  'RIFIUTATO': { label: 'Rifiutato', color: 'bg-red-100 text-red-700', icon: XCircle },
  'SCADUTO': { label: 'Scaduto', color: 'bg-gray-100 text-gray-500', icon: Clock },
  'REVISIONATO': { label: 'Revisionato', color: 'bg-purple-100 text-purple-700', icon: FileText },
}

interface Preventivo {
  id: string
  numero: string
  versione: number
  stato: string
  dataEmissione: string
  dataScadenza: string | null
  totaleImponibile: number
  totaleIva: number
  totale: number
  accettato: boolean
  evento: {
    id: string
    codice: string
    nome: string
    dataInizio: string
    committente: {
      ragioneSociale: string
    } | null
  }
}

export default function PreventiviPage() {
  const [preventivi, setPreventivi] = useState<Preventivo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroStato, setFiltroStato] = useState('')
  
  useEffect(() => {
    loadPreventivi()
  }, [])
  
  const loadPreventivi = async () => {
    try {
      setLoading(true)
      // TODO: Implementare API preventivi
      // Per ora mostriamo una lista vuota
      setPreventivi([])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const preventiviFiltrati = useMemo(() => {
    return preventivi.filter(p => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchNumero = p.numero?.toLowerCase().includes(query)
        const matchEvento = p.evento?.nome?.toLowerCase().includes(query)
        const matchCommittente = p.evento?.committente?.ragioneSociale?.toLowerCase().includes(query)
        
        if (!matchNumero && !matchEvento && !matchCommittente) return false
      }
      
      if (filtroStato && p.stato !== filtroStato) return false
      
      return true
    })
  }, [preventivi, searchQuery, filtroStato])
  
  const stats = useMemo(() => ({
    totali: preventivi.length,
    bozze: preventivi.filter(p => p.stato === 'BOZZA').length,
    inviati: preventivi.filter(p => p.stato === 'INVIATO' || p.stato === 'VISIONATO').length,
    accettati: preventivi.filter(p => p.stato === 'ACCETTATO').length,
    valoreAccettati: preventivi
      .filter(p => p.stato === 'ACCETTATO')
      .reduce((sum, p) => sum + (p.totale || 0), 0),
  }), [preventivi])
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preventivi</h1>
          <p className="text-gray-500">Gestione preventivi eventi</p>
        </div>
        <Link
          href="/produzione/preventivi/nuovo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuovo Preventivo
        </Link>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Totali</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totali}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Bozze</p>
          <p className="text-2xl font-bold text-gray-600">{stats.bozze}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">In Attesa</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inviati}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Accettati</p>
          <p className="text-2xl font-bold text-green-600">{stats.accettati}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Valore Accettati</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(stats.valoreAccettati)}</p>
        </div>
      </div>
      
      {/* Filtri */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cerca per numero, evento, committente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
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
        </div>
      </div>
      
      {/* Lista Preventivi */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {preventiviFiltrati.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="mx-auto mb-2 text-gray-300" size={48} />
            {preventivi.length === 0 ? (
              <>
                <p>Nessun preventivo creato</p>
                <p className="text-sm mt-2">I preventivi vengono creati dalla scheda evento</p>
                <Link 
                  href="/produzione/eventi"
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  Vai agli eventi
                </Link>
              </>
            ) : (
              <p>Nessun risultato per i filtri selezionati</p>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preventivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Committente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Totale</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {preventiviFiltrati.map((p) => {
                const statoInfo = STATO_LABELS[p.stato] || STATO_LABELS['BOZZA']
                const Icon = statoInfo.icon
                
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-mono font-medium">{p.numero}</p>
                      <p className="text-sm text-gray-500">
                        v{p.versione} - {formatDate(p.dataEmissione)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/produzione/eventi/${p.evento?.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {p.evento?.nome}
                      </Link>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar size={12} />
                        {p.evento?.dataInizio && formatDate(p.evento.dataInizio)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1">
                        <Building2 size={14} className="text-gray-400" />
                        {p.evento?.committente?.ragioneSociale || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statoInfo.color}`}>
                        <Icon size={12} />
                        {statoInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold">{formatCurrency(p.totale)}</p>
                      <p className="text-xs text-gray-500">+ IVA {formatCurrency(p.totaleIva)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/produzione/preventivi/${p.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Apri
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
