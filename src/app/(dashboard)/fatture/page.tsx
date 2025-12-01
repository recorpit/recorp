// src/app/(dashboard)/fatture/page.tsx
// Lista Fatture e Note di Credito con selezione multipla e esportazione massiva Easyfatt
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, FileText, Search, Filter, Download, Check,
  Calendar, Building2, Euro, ChevronDown, X,
  CheckSquare, Square, FileCode, Clock, Eye, ReceiptText
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import { it } from 'date-fns/locale'

interface Committente {
  id: string
  ragioneSociale: string
  partitaIva: string
}

interface Fattura {
  id: string
  numero: string
  anno: number
  progressivo: number
  dataEmissione: string
  dataScadenza: string
  totale: number
  imponibile: number
  stato: string
  splitPayment: boolean
  committente: Committente
}

interface NotaDiCredito {
  id: string
  numero: string
  anno: number
  progressivo: number
  dataEmissione: string
  totale: number
  imponibile: number
  stato: string
  tipo: string
  fatturaRiferimento: {
    id: string
    numero: string
    committente: {
      id: string
      ragioneSociale: string
      partitaIva: string
    }
  }
}

const STATI_COLORI: Record<string, { bg: string; text: string; label: string }> = {
  'BOZZA': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Bozza' },
  'EMESSA': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Emessa' },
  'ESPORTATA': { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Esportata' },
  'INVIATA': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Inviata' },
  'PAGATA': { bg: 'bg-green-100', text: 'text-green-700', label: 'Pagata' },
  'ANNULLATA': { bg: 'bg-red-100', text: 'text-red-700', label: 'Annullata' },
}

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
]

export default function FatturePage() {
  // Tab attivo
  const [activeTab, setActiveTab] = useState<'fatture' | 'notecredito'>('fatture')
  
  const [loading, setLoading] = useState(true)
  const [fatture, setFatture] = useState<Fattura[]>([])
  const [noteCredito, setNoteCredito] = useState<NotaDiCredito[]>([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [paginationNC, setPaginationNC] = useState({ page: 1, pages: 1, total: 0 })
  
  // Filtri
  const [filtroStato, setFiltroStato] = useState('')
  const [filtroAnno, setFiltroAnno] = useState(new Date().getFullYear().toString())
  const [ricerca, setRicerca] = useState('')
  
  // Selezione multipla
  const [selezionate, setSelezionate] = useState<Set<string>>(new Set())
  const [showExportPanel, setShowExportPanel] = useState(false)
  
  // Export per periodo
  const [exportMode, setExportMode] = useState<'selection' | 'period'>('selection')
  const [exportAnno, setExportAnno] = useState(new Date().getFullYear())
  const [exportMese, setExportMese] = useState<number | null>(null)
  const [exportDataInizio, setExportDataInizio] = useState('')
  const [exportDataFine, setExportDataFine] = useState('')
  const [exportUltimaSettimana, setExportUltimaSettimana] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportPreview, setExportPreview] = useState<{ count: number; totale: number } | null>(null)
  
  // Carica fatture
  const loadFatture = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroStato) params.set('stato', filtroStato)
      if (filtroAnno) params.set('anno', filtroAnno)
      params.set('limit', '50')
      
      const res = await fetch(`/api/fatture?${params}`)
      if (res.ok) {
        const data = await res.json()
        setFatture(data.data || [])
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 })
      }
    } catch (err) {
      console.error('Errore caricamento fatture:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Carica note di credito
  const loadNoteCredito = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroStato) params.set('stato', filtroStato)
      if (filtroAnno) params.set('anno', filtroAnno)
      params.set('limit', '50')
      
      const res = await fetch(`/api/note-credito?${params}`)
      if (res.ok) {
        const data = await res.json()
        setNoteCredito(data.data || [])
        setPaginationNC(data.pagination || { page: 1, pages: 1, total: 0 })
      }
    } catch (err) {
      console.error('Errore caricamento note di credito:', err)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (activeTab === 'fatture') {
      loadFatture()
    } else {
      loadNoteCredito()
    }
  }, [filtroStato, filtroAnno, activeTab])
  
  // Carica anteprima esportazione per periodo
  useEffect(() => {
    if (exportMode !== 'period' || !showExportPanel) {
      setExportPreview(null)
      return
    }
    
    async function loadPreview() {
      const params = new URLSearchParams()
      
      if (exportUltimaSettimana) {
        const oggi = new Date()
        const settimanaFa = subDays(oggi, 7)
        params.set('dataInizio', format(settimanaFa, 'yyyy-MM-dd'))
        params.set('dataFine', format(oggi, 'yyyy-MM-dd'))
      } else if (exportMese) {
        params.set('anno', exportAnno.toString())
        params.set('mese', exportMese.toString())
      } else if (exportDataInizio || exportDataFine) {
        if (exportDataInizio) params.set('dataInizio', exportDataInizio)
        if (exportDataFine) params.set('dataFine', exportDataFine)
      } else {
        params.set('anno', exportAnno.toString())
      }
      
      try {
        const res = await fetch(`/api/fatture/esporta-easyfatt?${params}`)
        if (res.ok) {
          const data = await res.json()
          setExportPreview({ count: data.count, totale: data.totale })
        }
      } catch (err) {
        console.error('Errore preview:', err)
      }
    }
    
    const timeout = setTimeout(loadPreview, 300)
    return () => clearTimeout(timeout)
  }, [exportMode, exportAnno, exportMese, exportDataInizio, exportDataFine, exportUltimaSettimana, showExportPanel])
  
  // Filtra per ricerca - Fatture
  const fattureFiltrate = fatture.filter(f => {
    if (!ricerca) return true
    const search = ricerca.toLowerCase()
    return (
      f.numero.toLowerCase().includes(search) ||
      f.committente.ragioneSociale.toLowerCase().includes(search) ||
      f.committente.partitaIva?.includes(search)
    )
  })
  
  // Filtra per ricerca - Note di Credito
  const noteCreditoFiltrate = noteCredito.filter(nc => {
    if (!ricerca) return true
    const search = ricerca.toLowerCase()
    return (
      nc.numero.toLowerCase().includes(search) ||
      nc.fatturaRiferimento?.committente?.ragioneSociale?.toLowerCase().includes(search) ||
      nc.fatturaRiferimento?.numero?.toLowerCase().includes(search)
    )
  })
  
  // Fatture esportabili (non BOZZA e non ANNULLATA)
  const fattureEsportabili = fattureFiltrate.filter(f => 
    !['BOZZA', 'ANNULLATA'].includes(f.stato)
  )
  
  // Toggle selezione singola
  const toggleSelezione = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setSelezionate(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }
  
  // Seleziona/deseleziona tutte (solo esportabili)
  const toggleTutte = () => {
    if (selezionate.size === fattureEsportabili.length && fattureEsportabili.length > 0) {
      setSelezionate(new Set())
    } else {
      setSelezionate(new Set(fattureEsportabili.map(f => f.id)))
    }
  }
  
  // Esporta fatture
  const handleExport = async () => {
    setExporting(true)
    
    try {
      let body: any = {}
      
      if (exportMode === 'selection') {
        if (selezionate.size === 0) {
          alert('Seleziona almeno una fattura da esportare')
          setExporting(false)
          return
        }
        body.fattureIds = Array.from(selezionate)
      } else {
        if (exportUltimaSettimana) {
          const oggi = new Date()
          const settimanaFa = subDays(oggi, 7)
          body.dataInizio = format(settimanaFa, 'yyyy-MM-dd')
          body.dataFine = format(oggi, 'yyyy-MM-dd')
        } else if (exportMese) {
          body.anno = exportAnno
          body.mese = exportMese
        } else if (exportDataInizio || exportDataFine) {
          body.dataInizio = exportDataInizio
          body.dataFine = exportDataFine
        } else {
          body.anno = exportAnno
        }
      }
      
      const res = await fetch('/api/fatture/esporta-easyfatt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore esportazione')
      }
      
      // Scarica file
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'Fatture_Easyfatt.xml'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // Chiudi pannello e ricarica lista
      setShowExportPanel(false)
      setSelezionate(new Set())
      
      // Ricarica per vedere lo stato aggiornato
      await loadFatture()
      
    } catch (err: any) {
      alert(err.message)
    } finally {
      setExporting(false)
    }
  }
  
  // Calcola totale selezionate
  const totaleSelezionate = fatture
    .filter(f => selezionate.has(f.id))
    .reduce((sum, f) => sum + Number(f.totale), 0)
  
  // Reset selezione quando cambio tab
  useEffect(() => {
    setSelezionate(new Set())
  }, [activeTab])
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fatturazione</h1>
          <p className="text-gray-500">
            {activeTab === 'fatture' 
              ? `${pagination.total} fatture totali`
              : `${paginationNC.total} note di credito totali`
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {activeTab === 'fatture' && (
            <>
              {/* Bottone Export */}
              <button
                onClick={() => setShowExportPanel(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download size={20} />
                Esporta Easyfatt
                {selezionate.size > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {selezionate.size}
                  </span>
                )}
              </button>
              
              <Link
                href="/fatture/nuova"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Nuova Fattura
              </Link>
            </>
          )}
          
          {activeTab === 'notecredito' && (
            <Link
              href="/note-credito/nuova"
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus size={20} />
              Nuova Nota di Credito
            </Link>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('fatture')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'fatture'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText size={18} />
          Fatture
        </button>
        <button
          onClick={() => setActiveTab('notecredito')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'notecredito'
              ? 'bg-white text-red-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ReceiptText size={18} />
          Note di Credito
        </button>
      </div>
      
      {/* Filtri */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Ricerca */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={ricerca}
              onChange={(e) => setRicerca(e.target.value)}
              placeholder={activeTab === 'fatture' 
                ? "Cerca per numero o committente..." 
                : "Cerca per numero, fattura o committente..."
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Filtro Stato */}
          <select
            value={filtroStato}
            onChange={(e) => setFiltroStato(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti gli stati</option>
            {activeTab === 'fatture' && <option value="BOZZA">Bozza</option>}
            <option value="EMESSA">Emessa</option>
            {activeTab === 'fatture' && <option value="ESPORTATA">Esportata</option>}
            <option value="INVIATA">Inviata</option>
            {activeTab === 'fatture' && <option value="PAGATA">Pagata</option>}
            {activeTab === 'fatture' && <option value="ANNULLATA">Annullata</option>}
          </select>
          
          {/* Filtro Anno */}
          <select
            value={filtroAnno}
            onChange={(e) => setFiltroAnno(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti gli anni</option>
            {[...Array(5)].map((_, i) => {
              const anno = new Date().getFullYear() - i
              return <option key={anno} value={anno}>{anno}</option>
            })}
          </select>
          
          {/* Selezione multipla - solo per fatture */}
          {activeTab === 'fatture' && fattureEsportabili.length > 0 && (
            <button
              onClick={toggleTutte}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {selezionate.size === fattureEsportabili.length && fattureEsportabili.length > 0 ? (
                <CheckSquare size={18} className="text-blue-600" />
              ) : (
                <Square size={18} />
              )}
              {selezionate.size > 0 ? `${selezionate.size} selezionate` : 'Seleziona'}
            </button>
          )}
        </div>
        
        {/* Barra selezione */}
        {activeTab === 'fatture' && selezionate.size > 0 && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selezionate.size} fatture selezionate
              </span>
              <span className="text-sm font-medium text-blue-600">
                Totale: €{totaleSelezionate.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => setSelezionate(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Deseleziona tutte
            </button>
          </div>
        )}
      </div>
      
      {/* Lista Fatture */}
      {activeTab === 'fatture' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : fattureFiltrate.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <FileText className="mx-auto mb-4 text-gray-300" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna fattura</h3>
              <p className="text-gray-500 mb-4">Non ci sono fatture che corrispondono ai filtri</p>
              <Link
                href="/fatture/nuova"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                Crea Prima Fattura
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left w-10"></th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Numero</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Data</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Committente</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Importo</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Stato</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 w-24">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fattureFiltrate.map(fattura => {
                    const statoInfo = STATI_COLORI[fattura.stato] || STATI_COLORI['BOZZA']
                    const isEsportabile = !['BOZZA', 'ANNULLATA'].includes(fattura.stato)
                    const isSelezionata = selezionate.has(fattura.id)
                    
                    return (
                      <tr 
                        key={fattura.id}
                        className={`hover:bg-gray-50 transition-colors ${isSelezionata ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          {isEsportabile && (
                            <button
                              onClick={(e) => toggleSelezione(fattura.id, e)}
                              className="p-1 rounded hover:bg-gray-200 transition-colors"
                            >
                              {isSelezionata ? (
                                <CheckSquare size={18} className="text-blue-600" />
                              ) : (
                                <Square size={18} className="text-gray-400" />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">
                            {fattura.numero}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {format(new Date(fattura.dataEmissione), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{fattura.committente.ragioneSociale}</p>
                            <p className="text-sm text-gray-500">{fattura.committente.partitaIva}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-gray-900">
                            €{Number(fattura.totale).toFixed(2)}
                          </span>
                          {fattura.splitPayment && (
                            <span className="block text-xs text-yellow-600">Split Payment</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statoInfo.bg} ${statoInfo.text}`}>
                            {statoInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            href={`/fatture/${fattura.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye size={16} />
                            Dettagli
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      {/* Lista Note di Credito */}
      {activeTab === 'notecredito' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : noteCreditoFiltrate.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <ReceiptText className="mx-auto mb-4 text-gray-300" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna nota di credito</h3>
              <p className="text-gray-500 mb-4">Non ci sono note di credito che corrispondono ai filtri</p>
              <Link
                href="/note-credito/nuova"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Plus size={20} />
                Crea Nota di Credito
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Numero</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Data</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fattura Rif.</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Committente</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Tipo</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Importo</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Stato</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 w-24">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {noteCreditoFiltrate.map(nc => {
                    const statoInfo = STATI_COLORI[nc.stato] || STATI_COLORI['EMESSA']
                    
                    return (
                      <tr 
                        key={nc.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-red-600">
                            {nc.numero}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {format(new Date(nc.dataEmissione), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          {nc.fatturaRiferimento && (
                            <Link
                              href={`/fatture/${nc.fatturaRiferimento.id}`}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {nc.fatturaRiferimento.numero}
                            </Link>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{nc.fatturaRiferimento?.committente?.ragioneSociale || 'N/D'}</p>
                            <p className="text-sm text-gray-500">{nc.fatturaRiferimento?.committente?.partitaIva || ''}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            nc.tipo === 'TOTALE' 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {nc.tipo === 'TOTALE' ? 'Totale' : 'Parziale'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-red-600">
                            -€{Number(nc.totale).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statoInfo.bg} ${statoInfo.text}`}>
                            {statoInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            href={`/note-credito/${nc.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Eye size={16} />
                            Dettagli
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      {/* Pannello Esportazione */}
      {showExportPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Esporta Fatture (Easyfatt)
              </h3>
              <button
                onClick={() => setShowExportPanel(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Modalità esportazione */}
              <div className="flex gap-2">
                <button
                  onClick={() => setExportMode('selection')}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    exportMode === 'selection' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Selezione ({selezionate.size})
                </button>
                <button
                  onClick={() => setExportMode('period')}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    exportMode === 'period' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Per Periodo
                </button>
              </div>
              
              {exportMode === 'selection' ? (
                <div className="p-4 bg-gray-50 rounded-lg">
                  {selezionate.size === 0 ? (
                    <p className="text-center text-gray-500">
                      Seleziona le fatture dalla lista prima di esportare
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>{selezionate.size}</strong> fatture selezionate
                      </p>
                      <p className="text-lg font-semibold text-blue-600">
                        Totale: €{totaleSelezionate.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Scorciatoia ultima settimana */}
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={exportUltimaSettimana}
                      onChange={(e) => {
                        setExportUltimaSettimana(e.target.checked)
                        if (e.target.checked) {
                          setExportMese(null)
                          setExportDataInizio('')
                          setExportDataFine('')
                        }
                      }}
                      className="rounded text-blue-600"
                    />
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900">Ultima settimana</p>
                        <p className="text-xs text-gray-500">
                          Da {format(subDays(new Date(), 7), 'd MMM', { locale: it })} a oggi
                        </p>
                      </div>
                    </div>
                  </label>
                  
                  {!exportUltimaSettimana && (
                    <>
                      {/* Selezione rapida mese */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Anno
                        </label>
                        <select
                          value={exportAnno}
                          onChange={(e) => setExportAnno(parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          {[...Array(5)].map((_, i) => {
                            const anno = new Date().getFullYear() - i
                            return <option key={anno} value={anno}>{anno}</option>
                          })}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mese (opzionale)
                        </label>
                        <select
                          value={exportMese || ''}
                          onChange={(e) => setExportMese(e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Tutto l&apos;anno</option>
                          {MESI.map((mese, i) => (
                            <option key={i} value={i + 1}>{mese}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-500 mb-3">Oppure specifica un intervallo:</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Da</label>
                            <input
                              type="date"
                              value={exportDataInizio}
                              onChange={(e) => { setExportDataInizio(e.target.value); setExportMese(null); }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">A</label>
                            <input
                              type="date"
                              value={exportDataFine}
                              onChange={(e) => { setExportDataFine(e.target.value); setExportMese(null); }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Preview */}
                  {exportPreview && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>{exportPreview.count}</strong> fatture trovate
                      </p>
                      <p className="text-lg font-semibold text-blue-600">
                        Totale: €{exportPreview.totale.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Info stato ESPORTATA */}
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <p>Le fatture esportate verranno segnate come &quot;Esportata&quot;. Potrai comunque ri-esportarle in futuro.</p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowExportPanel(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Annulla
              </button>
              <button
                onClick={handleExport}
                disabled={exporting || (exportMode === 'selection' && selezionate.size === 0)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <FileCode size={20} />
                )}
                Esporta XML
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
