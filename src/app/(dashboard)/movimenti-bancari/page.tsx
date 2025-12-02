// src/app/(dashboard)/movimenti-bancari/page.tsx
// Pagina Movimenti Bancari - Import e Riconciliazione
'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Upload, Search, Filter, Calendar, ArrowUpRight, ArrowDownLeft,
  CheckCircle, XCircle, AlertCircle, FileText, Download,
  RefreshCw, Link2, Unlink, Building2, Landmark, TrendingUp, TrendingDown
} from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface MovimentoBancario {
  id: string
  data: string
  dataValuta: string
  descrizione: string
  importo: number
  tipo: 'ENTRATA' | 'USCITA'
  stato: 'DA_RICONCILIARE' | 'RICONCILIATO' | 'IGNORATO'
  riferimentoInterno?: string
  fatturaId?: string
  pagamentoId?: string
  note?: string
  fattura?: { numero: string; committente: { ragioneSociale: string } }
  pagamento?: { artista: { nome: string; cognome: string } }
}

interface Stats {
  totaleEntrate: number
  totaleUscite: number
  saldo: number
  daRiconciliare: number
  riconciliati: number
}

const formatImporto = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function MovimentiBancariPage() {
  const [loading, setLoading] = useState(true)
  const [movimenti, setMovimenti] = useState<MovimentoBancario[]>([])
  const [stats, setStats] = useState<Stats>({
    totaleEntrate: 0,
    totaleUscite: 0,
    saldo: 0,
    daRiconciliare: 0,
    riconciliati: 0,
  })
  
  // Filtri
  const [filtroStato, setFiltroStato] = useState<string>('tutti')
  const [filtroTipo, setFiltroTipo] = useState<string>('tutti')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  // Upload
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    loadMovimenti()
  }, [filtroStato, filtroTipo, dateFrom, dateTo])
  
  async function loadMovimenti() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroStato !== 'tutti') params.set('stato', filtroStato)
      if (filtroTipo !== 'tutti') params.set('tipo', filtroTipo)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      
      const res = await fetch(`/api/movimenti-bancari?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setMovimenti(data.movimenti || [])
        setStats(data.stats || stats)
      }
    } catch (err) {
      console.error('Errore caricamento:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Upload file CSV/Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    setUploadError('')
    setUploadSuccess('')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/movimenti-bancari/import', {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore durante l\'import')
      }
      
      const data = await res.json()
      setUploadSuccess(`Importati ${data.importati} movimenti, ${data.duplicati} duplicati ignorati`)
      loadMovimenti()
      
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }
  
  // Filtra per ricerca
  const movimentiFiltrati = movimenti.filter(m => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      m.descrizione.toLowerCase().includes(term) ||
      m.riferimentoInterno?.toLowerCase().includes(term) ||
      m.fattura?.committente?.ragioneSociale?.toLowerCase().includes(term) ||
      m.fattura?.numero?.toLowerCase().includes(term)
    )
  })
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="text-blue-600" size={28} />
            Movimenti Bancari
          </h1>
          <p className="text-gray-500">Import e riconciliazione movimenti</p>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
              uploading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {uploading ? (
              <RefreshCw size={20} className="animate-spin" />
            ) : (
              <Upload size={20} />
            )}
            Importa Movimenti
          </label>
        </div>
      </div>
      
      {/* Messaggi upload */}
      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle size={20} />
          {uploadError}
        </div>
      )}
      {uploadSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
          <CheckCircle size={20} />
          {uploadSuccess}
        </div>
      )}
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">Entrate</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">€{formatImporto(stats.totaleEntrate)}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <TrendingDown size={18} />
            <span className="text-sm font-medium">Uscite</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">€{formatImporto(stats.totaleUscite)}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Landmark size={18} />
            <span className="text-sm font-medium">Saldo</span>
          </div>
          <p className={`text-2xl font-bold ${stats.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            €{formatImporto(stats.saldo)}
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">Da riconciliare</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.daRiconciliare}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle size={18} />
            <span className="text-sm font-medium">Riconciliati</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.riconciliati}</p>
        </div>
      </div>
      
      {/* Filtri */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          {/* Ricerca */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cerca descrizione, riferimento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Stato */}
          <select
            value={filtroStato}
            onChange={(e) => setFiltroStato(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="tutti">Tutti gli stati</option>
            <option value="DA_RICONCILIARE">Da riconciliare</option>
            <option value="RICONCILIATO">Riconciliati</option>
            <option value="IGNORATO">Ignorati</option>
          </select>
          
          {/* Tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="tutti">Entrate e uscite</option>
            <option value="ENTRATA">Solo entrate</option>
            <option value="USCITA">Solo uscite</option>
          </select>
          
          {/* Date */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Da"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="A"
          />
        </div>
      </div>
      
      {/* Lista movimenti */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : movimentiFiltrati.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <Landmark size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun movimento</h3>
          <p className="text-gray-500 mb-4">
            Importa i movimenti bancari da un file CSV o Excel
          </p>
          <label
            htmlFor="file-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            <Upload size={18} />
            Importa Movimenti
          </label>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrizione</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Importo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stato</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collegamento</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movimentiFiltrati.map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(mov.data), 'd MMM yyyy', { locale: it })}
                      </div>
                      {mov.dataValuta !== mov.data && (
                        <div className="text-xs text-gray-500">
                          Val: {format(new Date(mov.dataValuta), 'd MMM', { locale: it })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-md truncate">
                        {mov.descrizione}
                      </div>
                      {mov.riferimentoInterno && (
                        <div className="text-xs text-gray-500">
                          Rif: {mov.riferimentoInterno}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className={`flex items-center justify-end gap-1 font-semibold ${
                        mov.tipo === 'ENTRATA' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {mov.tipo === 'ENTRATA' ? (
                          <ArrowDownLeft size={16} />
                        ) : (
                          <ArrowUpRight size={16} />
                        )}
                        €{formatImporto(Math.abs(mov.importo))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {mov.stato === 'RICONCILIATO' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <CheckCircle size={12} />
                          Riconciliato
                        </span>
                      ) : mov.stato === 'IGNORATO' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          <XCircle size={12} />
                          Ignorato
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          <AlertCircle size={12} />
                          Da verificare
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {mov.fattura ? (
                        <div className="flex items-center gap-1 text-sm">
                          <FileText size={14} className="text-blue-500" />
                          <span>Fatt. {mov.fattura.numero}</span>
                          <span className="text-gray-400">-</span>
                          <span className="text-gray-600 truncate max-w-[150px]">
                            {mov.fattura.committente?.ragioneSociale}
                          </span>
                        </div>
                      ) : mov.pagamento ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 size={14} className="text-purple-500" />
                          <span>
                            {mov.pagamento.artista?.nome} {mov.pagamento.artista?.cognome}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {mov.stato === 'DA_RICONCILIARE' ? (
                          <button
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Collega"
                          >
                            <Link2 size={16} />
                          </button>
                        ) : mov.stato === 'RICONCILIATO' ? (
                          <button
                            className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
                            title="Scollega"
                          >
                            <Unlink size={16} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Info formato */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Formati supportati per l'import</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>CSV</strong> - Separatore virgola o punto e virgola, encoding UTF-8</li>
          <li>• <strong>Excel</strong> - File .xlsx o .xls</li>
          <li>• Colonne richieste: Data, Descrizione, Importo (o Dare/Avere separati)</li>
          <li>• Colonne opzionali: Data Valuta, Riferimento</li>
        </ul>
      </div>
    </div>
  )
}
