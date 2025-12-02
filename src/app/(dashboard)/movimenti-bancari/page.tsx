// src/app/(dashboard)/movimenti-bancari/page.tsx
// Pagina Movimenti Bancari - Stile Finom
'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Upload, Search, Calendar, ArrowUpRight, ArrowDownLeft,
  Check, X, FileText, Plus,
  ChevronDown, Landmark, SlidersHorizontal
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
  stato: 'DA_VERIFICARE' | 'VERIFICATO' | 'IGNORATO'
  categoria: string | null
  riferimentoInterno?: string
  fatturaId?: string
  pagamentoId?: string
  note?: string
}

interface Stats {
  totaleEntrate: number
  totaleUscite: number
  saldo: number
  daVerificare: number
  verificati: number
  nonCategorizzati: number
}

const CATEGORIE = [
  { value: 'COSTI_VARIABILI', label: 'Costi Variabili', color: 'bg-purple-100 text-purple-700' },
  { value: 'COSTI_FISSI', label: 'Costi Fissi', color: 'bg-blue-100 text-blue-700' },
  { value: 'COMPENSI_ARTISTI', label: 'Compensi Artisti', color: 'bg-orange-100 text-orange-700' },
  { value: 'INCASSI_FATTURE', label: 'Incassi Fatture', color: 'bg-green-100 text-green-700' },
  { value: 'TASSE', label: 'Tasse e Contributi', color: 'bg-red-100 text-red-700' },
  { value: 'ALTRO', label: 'Altro', color: 'bg-gray-100 text-gray-700' },
]

const formatImporto = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function MovimentiBancariPage() {
  const [loading, setLoading] = useState(true)
  const [movimenti, setMovimenti] = useState<MovimentoBancario[]>([])
  const [stats, setStats] = useState<Stats>({
    totaleEntrate: 0,
    totaleUscite: 0,
    saldo: 0,
    daVerificare: 0,
    verificati: 0,
    nonCategorizzati: 0,
  })
  
  // Tab attiva
  const [activeTab, setActiveTab] = useState<'movimenti' | 'pagamenti' | 'regole'>('movimenti')
  
  // Filtri rapidi
  const [filtroRapido, setFiltroRapido] = useState<'tutti' | 'entrate' | 'uscite' | 'da_verificare' | 'non_categorizzati'>('tutti')
  
  // Filtri avanzati
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  
  // Selezione
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  
  // Menu dropdown
  const [showScaricaMenu, setShowScaricaMenu] = useState(false)
  const [showCategoriaMenu, setShowCategoriaMenu] = useState<string | null>(null)
  
  // Upload
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    loadMovimenti()
  }, [filtroRapido, dateFrom, dateTo, categoriaFiltro])
  
  async function loadMovimenti() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (filtroRapido === 'entrate') params.set('tipo', 'ENTRATA')
      if (filtroRapido === 'uscite') params.set('tipo', 'USCITA')
      if (filtroRapido === 'da_verificare') params.set('stato', 'DA_VERIFICARE')
      if (filtroRapido === 'non_categorizzati') params.set('nonCategorizzati', 'true')
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      if (categoriaFiltro) params.set('categoria', categoriaFiltro)
      
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
  
  // Filtra per ricerca
  const movimentiFiltrati = movimenti.filter(m => {
    if (!search) return true
    const term = search.toLowerCase()
    return m.descrizione.toLowerCase().includes(term) || m.riferimentoInterno?.toLowerCase().includes(term)
  })
  
  // Toggle selezione
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelected(newSelected)
  }
  
  // Seleziona tutti
  const handleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set())
    } else {
      setSelected(new Set(movimentiFiltrati.map(m => m.id)))
    }
    setSelectAll(!selectAll)
  }
  
  // Verifica movimento
  const handleVerifica = async (id: string, verificato: boolean) => {
    try {
      await fetch(`/api/movimenti-bancari/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato: verificato ? 'VERIFICATO' : 'DA_VERIFICARE' }),
      })
      loadMovimenti()
    } catch (err) {
      console.error('Errore:', err)
    }
  }
  
  // Cambia categoria
  const handleCategoriaChange = async (id: string, categoria: string) => {
    try {
      await fetch(`/api/movimenti-bancari/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria }),
      })
      setShowCategoriaMenu(null)
      loadMovimenti()
    } catch (err) {
      console.error('Errore:', err)
    }
  }
  
  // Upload file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/movimenti-bancari/import', {
        method: 'POST',
        body: formData,
      })
      
      if (res.ok) {
        loadMovimenti()
      }
    } catch (err) {
      console.error('Errore upload:', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setShowScaricaMenu(false)
    }
  }
  
  const getCategoriaInfo = (cat: string | null) => {
    return CATEGORIE.find(c => c.value === cat) || null
  }
  
  return (
    <div className="space-y-4">
      {/* Header con Tab principali */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('movimenti')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'movimenti' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Movimenti
          </button>
          <button
            onClick={() => setActiveTab('pagamenti')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'pagamenti' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pagamenti
          </button>
          <button
            onClick={() => setActiveTab('regole')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'regole' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Regole
          </button>
        </div>
        
        {/* Menu Scarica */}
        <div className="relative">
          <button
            onClick={() => setShowScaricaMenu(!showScaricaMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Scarica
            <ChevronDown size={16} />
          </button>
          
          {showScaricaMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowScaricaMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                <button
                  onClick={() => {
                    // TODO: Modal crea movimento
                    setShowScaricaMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 rounded-t-lg"
                >
                  <Plus size={18} className="text-gray-500" />
                  Crea movimento
                </button>
                <label className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 rounded-b-lg cursor-pointer">
                  <Upload size={18} className="text-gray-500" />
                  Carica movimenti
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </>
          )}
        </div>
      </div>
      
      {activeTab === 'movimenti' && (
        <>
          {/* Filtri rapidi */}
          <div className="flex items-center gap-6 border-b">
            <button
              onClick={() => setFiltroRapido('tutti')}
              className={`pb-3 px-1 font-medium transition-colors border-b-2 ${
                filtroRapido === 'tutti' 
                  ? 'border-gray-900 text-gray-900' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Tutti
            </button>
            <button
              onClick={() => setFiltroRapido('entrate')}
              className={`pb-3 px-1 font-medium transition-colors border-b-2 flex items-center gap-1 ${
                filtroRapido === 'entrate' 
                  ? 'border-green-600 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Entrate
              <ArrowDownLeft size={16} />
            </button>
            <button
              onClick={() => setFiltroRapido('uscite')}
              className={`pb-3 px-1 font-medium transition-colors border-b-2 flex items-center gap-1 ${
                filtroRapido === 'uscite' 
                  ? 'border-red-600 text-red-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Uscite
              <ArrowUpRight size={16} />
            </button>
            <button
              onClick={() => setFiltroRapido('da_verificare')}
              className={`pb-3 px-1 font-medium transition-colors border-b-2 ${
                filtroRapido === 'da_verificare' 
                  ? 'border-yellow-600 text-yellow-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Da verificare
            </button>
            <button
              onClick={() => setFiltroRapido('non_categorizzati')}
              className={`pb-3 px-1 font-medium transition-colors border-b-2 ${
                filtroRapido === 'non_categorizzati' 
                  ? 'border-purple-600 text-purple-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Non categorizzati
            </button>
          </div>
          
          {/* Barra ricerca e filtri */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Ricerca descrizioni e note"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Data"
              />
            </div>
            
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[160px]"
            >
              <option value="">Categoria</option>
              {CATEGORIE.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <SlidersHorizontal size={20} className="text-gray-600" />
            </button>
          </div>
          
          {/* Tabella movimenti */}
          <div className="bg-white rounded-xl border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              </div>
            ) : movimentiFiltrati.length === 0 ? (
              <div className="p-12 text-center">
                <Landmark size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun movimento</h3>
                <p className="text-gray-500 mb-4">Carica i movimenti bancari per iniziare</p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 cursor-pointer">
                  <Upload size={18} />
                  Carica movimenti
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button className="flex items-center gap-1 hover:text-gray-700">
                        Data
                        <ChevronDown size={14} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrizione
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Importo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verificato
                    </th>
                    <th className="w-12 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movimentiFiltrati.map((mov) => {
                    const categoriaInfo = getCategoriaInfo(mov.categoria)
                    
                    return (
                      <tr key={mov.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(mov.id)}
                            onChange={() => toggleSelect(mov.id)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {format(new Date(mov.data), 'd MMMM yyyy', { locale: it })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {mov.tipo === 'ENTRATA' ? 'Accredito' : 'Bonifico'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                              Entry
                            </span>
                            <div>
                              <div className="text-sm font-medium text-gray-900 max-w-md truncate">
                                {mov.descrizione}
                              </div>
                              {mov.riferimentoInterno && (
                                <div className="text-xs text-gray-500">
                                  {mov.riferimentoInterno}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className={`font-semibold ${
                            mov.tipo === 'ENTRATA' ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            {mov.tipo === 'USCITA' ? '-' : ''}€{formatImporto(Math.abs(mov.importo))}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <button
                              onClick={() => setShowCategoriaMenu(showCategoriaMenu === mov.id ? null : mov.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                categoriaInfo 
                                  ? categoriaInfo.color 
                                  : 'bg-gray-100 text-gray-500 border border-dashed border-gray-300'
                              }`}
                            >
                              {categoriaInfo ? categoriaInfo.label : 'Seleziona'}
                              <X size={12} className={categoriaInfo ? '' : 'hidden'} />
                            </button>
                            
                            {showCategoriaMenu === mov.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowCategoriaMenu(null)} />
                                <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-20">
                                  {CATEGORIE.map(cat => (
                                    <button
                                      key={cat.value}
                                      onClick={() => handleCategoriaChange(mov.id, cat.value)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                                    >
                                      <span className={`w-2 h-2 rounded-full ${cat.color.split(' ')[0]}`} />
                                      {cat.label}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleVerifica(mov.id, mov.stato !== 'VERIFICATO')}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              mov.stato === 'VERIFICATO'
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-red-100 text-red-500 hover:bg-red-200'
                            }`}
                          >
                            {mov.stato === 'VERIFICATO' ? <Check size={16} /> : <X size={16} />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button className="p-1.5 hover:bg-gray-100 rounded">
                            <FileText size={18} className="text-gray-400" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
      
      {activeTab === 'pagamenti' && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Landmark size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Pagamenti programmati</h3>
          <p className="text-gray-500">Questa sezione mostrerà i pagamenti da effettuare</p>
        </div>
      )}
      
      {activeTab === 'regole' && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Landmark size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Regole di categorizzazione</h3>
          <p className="text-gray-500">Crea regole per categorizzare automaticamente i movimenti</p>
        </div>
      )}
    </div>
  )
}
