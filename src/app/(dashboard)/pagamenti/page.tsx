// src/app/(dashboard)/pagamenti/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  CreditCard, AlertTriangle, Calendar, CheckCircle, Clock, 
  FileText, Download, Users, Euro, Bell, Filter, Search,
  ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react'

const STATI_PRESTAZIONE = {
  DA_GENERARE: { label: 'Da Generare', color: 'bg-gray-100 text-gray-700' },
  IN_ATTESA_INCASSO: { label: 'Attesa Incasso', color: 'bg-orange-100 text-orange-700' },
  GENERATA: { label: 'In Attesa Firma', color: 'bg-yellow-100 text-yellow-700' },
  SOLLECITATA: { label: 'Sollecitata', color: 'bg-amber-100 text-amber-700' },
  FIRMATA: { label: 'Firmata', color: 'bg-blue-100 text-blue-700' },
  SCADUTA: { label: 'Scaduta', color: 'bg-red-100 text-red-700' },
  PAGABILE: { label: 'Pagabile', color: 'bg-green-100 text-green-700' },
  IN_DISTINTA: { label: 'In Distinta', color: 'bg-purple-100 text-purple-700' },
  PAGATA: { label: 'Pagata', color: 'bg-emerald-100 text-emerald-700' },
}

export default function PagamentiPage() {
  const [loading, setLoading] = useState(true)
  const [batchPending, setBatchPending] = useState<any>(null)
  const [prestazioni, setPrestazioni] = useState<any[]>([])
  const [perArtista, setPerArtista] = useState<any[]>([])
  const [totali, setTotali] = useState<any>({})
  const [generandoBatch, setGenerandoBatch] = useState(false)
  
  const [filtroStato, setFiltroStato] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [espanso, setEspanso] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Verifica batch pending
      const resBatch = await fetch('/api/pagamenti/batch?checkPending=true')
      const dataBatch = await resBatch.json()
      setBatchPending(dataBatch)
      
      // Lista prestazioni
      const resPrest = await fetch('/api/pagamenti/prestazioni')
      const dataPrest = await resPrest.json()
      setPrestazioni(dataPrest.prestazioni || [])
      setPerArtista(dataPrest.perArtista || [])
      setTotali(dataPrest.totali || {})
      
    } catch (error) {
      console.error('Errore caricamento:', error)
    } finally {
      setLoading(false)
    }
  }

  async function generaBatch() {
    setGenerandoBatch(true)
    try {
      const res = await fetch('/api/pagamenti/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      const data = await res.json()
      
      if (res.ok) {
        alert(`Batch generato! ${data.prestazioniGenerate} prestazioni create.`)
        loadData()
      } else {
        alert(`Errore: ${data.error}`)
      }
    } catch (error) {
      alert('Errore nella generazione')
    } finally {
      setGenerandoBatch(false)
    }
  }

  // Filtra prestazioni
  const prestazioniFiltrate = prestazioni.filter(p => {
    if (filtroStato && p.stato !== filtroStato) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const nome = `${p.artista?.cognome} ${p.artista?.nome}`.toLowerCase()
      const codice = p.codice?.toLowerCase() || ''
      if (!nome.includes(search) && !codice.includes(search)) return false
    }
    return true
  })

  // Stats
  const oggi = new Date()
  const inScadenza = prestazioni.filter(p => {
    if (p.stato !== 'PAGABILE') return false
    if (!p.dataScadenzaPagamento) return false
    const scad = new Date(p.dataScadenzaPagamento)
    const diff = (scad.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  })

  const scadute = prestazioni.filter(p => {
    if (p.stato !== 'PAGABILE') return false
    if (!p.dataScadenzaPagamento) return false
    return new Date(p.dataScadenzaPagamento) < oggi
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagamenti</h1>
          <p className="text-gray-500">Gestione prestazioni e pagamenti artisti</p>
        </div>
        <button
          onClick={loadData}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Alert Batch Pending */}
      {batchPending && batchPending.puoGenerare && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Bell className="text-blue-600 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-blue-800">
                  {batchPending.totaleArtistiPronti} prestazioni pronte per generazione
                </p>
                <p className="text-sm text-blue-600">
                  Periodo: {new Date(batchPending.periodo.dataInizio).toLocaleDateString('it-IT')} - {new Date(batchPending.periodo.dataFine).toLocaleDateString('it-IT')}
                </p>
                {batchPending.totaleArtistiIncompleti > 0 && (
                  <p className="text-sm text-orange-600 mt-1">
                    ⚠️ {batchPending.totaleArtistiIncompleti} artisti con dati incompleti
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={generaBatch}
              disabled={generandoBatch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generandoBatch ? 'Generazione...' : 'Genera Ricevute'}
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totali.inAttesaFirma || 0}</p>
              <p className="text-sm text-gray-500">In Attesa Firma</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Euro size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totali.pagabili || 0}</p>
              <p className="text-sm text-gray-500">Pagabili</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{inScadenza.length}</p>
              <p className="text-sm text-gray-500">In Scadenza (7gg)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totali.pagate || 0}</p>
              <p className="text-sm text-gray-500">Pagate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Scadute */}
      {scadute.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={20} />
            <p className="font-medium text-red-800">
              {scadute.length} pagamenti scaduti da effettuare!
            </p>
          </div>
        </div>
      )}

      {/* Filtri */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca artista o codice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filtroStato}
            onChange={(e) => setFiltroStato(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti gli stati</option>
            {Object.entries(STATI_PRESTAZIONE).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista Per Artista */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users size={20} />
            Pagamenti per Artista
          </h2>
        </div>
        
        {perArtista.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nessuna prestazione trovata
          </div>
        ) : (
          <div className="divide-y">
            {perArtista.map((gruppo) => {
              const artista = gruppo.artista
              const isEspanso = espanso === artista.id
              
              return (
                <div key={artista.id}>
                  {/* Riga Artista */}
                  <div
                    className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setEspanso(isEspanso ? null : artista.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-blue-600">
                          {artista.cognome?.[0]}{artista.nome?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {artista.cognome} {artista.nome}
                          {artista.nomeDarte && (
                            <span className="text-gray-500 ml-2">({artista.nomeDarte})</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {gruppo.prestazioni.length} prestazioni
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {gruppo.totaleDaPagare > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Da pagare</p>
                          <p className="font-semibold text-green-600">
                            €{gruppo.totaleDaPagare.toFixed(2)}
                          </p>
                        </div>
                      )}
                      {gruppo.totaleInAttesa > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">In attesa</p>
                          <p className="font-medium text-yellow-600">
                            €{gruppo.totaleInAttesa.toFixed(2)}
                          </p>
                        </div>
                      )}
                      {isEspanso ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                  
                  {/* Dettaglio Prestazioni */}
                  {isEspanso && (
                    <div className="bg-gray-50 p-4 space-y-2">
                      {gruppo.prestazioni.map((p: any) => (
                        <div 
                          key={p.id}
                          className="flex items-center justify-between bg-white rounded-lg p-3 border"
                        >
                          <div>
                            <p className="font-mono text-sm text-gray-600">{p.codice}</p>
                            <p className="text-sm text-gray-500">
                              {p.dataEmissione && new Date(p.dataEmissione).toLocaleDateString('it-IT')}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              STATI_PRESTAZIONE[p.stato as keyof typeof STATI_PRESTAZIONE]?.color || 'bg-gray-100'
                            }`}>
                              {STATI_PRESTAZIONE[p.stato as keyof typeof STATI_PRESTAZIONE]?.label || p.stato}
                            </span>
                            <span className="font-medium">€{parseFloat(p.totalePagato).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Calendario Scadenze */}
      {inScadenza.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-orange-50">
            <h2 className="font-semibold text-orange-800 flex items-center gap-2">
              <Calendar size={20} />
              Scadenze Prossimi 7 Giorni
            </h2>
          </div>
          <div className="divide-y">
            {inScadenza.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{p.artista.cognome} {p.artista.nome}</p>
                  <p className="text-sm text-gray-500">{p.codice}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">€{parseFloat(p.totalePagato).toFixed(2)}</p>
                  <p className="text-sm text-orange-600">
                    Scade: {new Date(p.dataScadenzaPagamento).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
