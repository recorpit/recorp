// src/app/(dashboard)/movimenti-bancari/page.tsx
// Pagina Tesoreria - Stile Sibill
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Upload, Search, Calendar, ArrowUpRight, ArrowDownLeft,
  Check, X, FileText, Plus, ChevronDown, Landmark, SlidersHorizontal, 
  Clock, AlertTriangle, Building2, ExternalLink, TrendingUp, TrendingDown,
  RefreshCw, Link2, Unlink, BarChart3, PieChart, Send, Bell,
  Filter, Download, MoreHorizontal, Eye, Edit2, Trash2, CreditCard,
  Wallet, BanknoteIcon, Receipt, ArrowRight, ChevronRight, Settings,
  Zap, Target, Activity
} from 'lucide-react'
import { format, differenceInDays, startOfMonth, endOfMonth, subMonths, addMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, subDays } from 'date-fns'
import { it } from 'date-fns/locale'
import Link from 'next/link'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, ComposedChart, Line, PieChart as RechartsPie, Pie, Cell
} from 'recharts'

// ============ INTERFACES ============

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

interface Scadenza {
  id: string
  numero: string
  progressivo: number
  dataEmissione: string
  dataScadenza: string | null
  totale: number
  stato: string
  committente: {
    id: string
    ragioneSociale: string
  }
}

interface Regola {
  id: string
  nome: string
  condizione: string
  categoria: string
  attiva: boolean
}

interface Stats {
  totaleEntrate: number
  totaleUscite: number
  saldo: number
  daVerificare: number
  verificati: number
  nonCategorizzati: number
}

interface StatsScadenze {
  totaleScadute: number
  totaleInScadenza: number
  totaleFuture: number
  countScadute: number
  countInScadenza: number
  countFuture: number
}

// ============ CONSTANTS ============

const CATEGORIE = [
  { value: 'COSTI_VARIABILI', label: 'Costi Variabili', color: 'bg-purple-100 text-purple-700', dotColor: 'bg-purple-500' },
  { value: 'COSTI_FISSI', label: 'Costi Fissi', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500' },
  { value: 'COMPENSI_ARTISTI', label: 'Compensi Artisti', color: 'bg-orange-100 text-orange-700', dotColor: 'bg-orange-500' },
  { value: 'INCASSI_FATTURE', label: 'Incassi Fatture', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
  { value: 'STIPENDI', label: 'Stipendi', color: 'bg-indigo-100 text-indigo-700', dotColor: 'bg-indigo-500' },
  { value: 'TASSE', label: 'Tasse e Contributi', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' },
  { value: 'UTENZE', label: 'Utenze', color: 'bg-yellow-100 text-yellow-700', dotColor: 'bg-yellow-500' },
  { value: 'FORNITORI', label: 'Fornitori', color: 'bg-cyan-100 text-cyan-700', dotColor: 'bg-cyan-500' },
  { value: 'ALTRO', label: 'Altro', color: 'bg-gray-100 text-gray-700', dotColor: 'bg-gray-500' },
]

const formatImporto = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ============ MAIN COMPONENT ============

export default function TesoreriaPage() {
  // State principale
  const [loading, setLoading] = useState(true)
  const [movimenti, setMovimenti] = useState<MovimentoBancario[]>([])
  const [stats, setStats] = useState<Stats>({
    totaleEntrate: 0, totaleUscite: 0, saldo: 0,
    daVerificare: 0, verificati: 0, nonCategorizzati: 0,
  })
  
  // Tab attiva
  const [activeTab, setActiveTab] = useState<'dashboard' | 'movimenti' | 'scadenze' | 'cashflow' | 'regole'>('dashboard')
  
  // Scadenze
  const [scadenze, setScadenze] = useState<Scadenza[]>([])
  const [statsScadenze, setStatsScadenze] = useState<StatsScadenze>({
    totaleScadute: 0, totaleInScadenza: 0, totaleFuture: 0,
    countScadute: 0, countInScadenza: 0, countFuture: 0,
  })
  const [filtroScadenze, setFiltroScadenze] = useState<'tutte' | 'scadute' | 'in_scadenza' | 'future'>('tutte')
  
  // Regole
  const [regole, setRegole] = useState<Regola[]>([])
  const [showNuovaRegola, setShowNuovaRegola] = useState(false)
  
  // Filtri movimenti
  const [filtroRapido, setFiltroRapido] = useState<'tutti' | 'entrate' | 'uscite' | 'da_verificare' | 'non_categorizzati'>('tutti')
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
  const [showRiconciliaModal, setShowRiconciliaModal] = useState<string | null>(null)
  
  // Upload
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Cashflow
  const [periodoAnalisi, setPeriodoAnalisi] = useState<'mese' | 'trimestre' | 'anno'>('mese')

  // ============ EFFECTS ============

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'movimenti') {
      loadMovimenti()
    }
    if (activeTab === 'dashboard' || activeTab === 'scadenze') {
      loadScadenze()
    }
    if (activeTab === 'regole') {
      loadRegole()
    }
  }, [activeTab, filtroRapido, dateFrom, dateTo, categoriaFiltro, filtroScadenze])

  // ============ API CALLS ============

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

  async function loadScadenze() {
    try {
      const params = new URLSearchParams()
      params.set('stato', 'nonPagate')
      if (filtroScadenze !== 'tutte') params.set('filtroScadenza', filtroScadenze)
      
      const res = await fetch(`/api/fatture/scadenze?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setScadenze(data.fatture || [])
        setStatsScadenze(data.stats || statsScadenze)
      }
    } catch (err) {
      console.error('Errore caricamento scadenze:', err)
    }
  }

  async function loadRegole() {
    // TODO: API regole
    setRegole([
      { id: '1', nome: 'Bonifici INPS', condizione: 'contiene "INPS"', categoria: 'TASSE', attiva: true },
      { id: '2', nome: 'Affitto ufficio', condizione: 'contiene "CANONE LOCAZIONE"', categoria: 'COSTI_FISSI', attiva: true },
      { id: '3', nome: 'Compensi artisti', condizione: 'contiene "COMPENSO"', categoria: 'COMPENSI_ARTISTI', attiva: true },
    ])
  }

  // ============ HANDLERS ============

  const movimentiFiltrati = useMemo(() => {
    return movimenti.filter(m => {
      if (!search) return true
      const term = search.toLowerCase()
      return m.descrizione.toLowerCase().includes(term) || 
             m.riferimentoInterno?.toLowerCase().includes(term)
    })
  }, [movimenti, search])

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) newSelected.delete(id)
    else newSelected.add(id)
    setSelected(newSelected)
  }

  const handleSelectAll = () => {
    if (selectAll) setSelected(new Set())
    else setSelected(new Set(movimentiFiltrati.map(m => m.id)))
    setSelectAll(!selectAll)
  }

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/movimenti-bancari/import', { method: 'POST', body: formData })
      if (res.ok) loadMovimenti()
    } catch (err) {
      console.error('Errore upload:', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setShowScaricaMenu(false)
    }
  }

  const handleSollecito = async (scadenzaId: string) => {
    // TODO: Invia sollecito email
    alert('Sollecito inviato!')
  }

  const getCategoriaInfo = (cat: string | null) => CATEGORIE.find(c => c.value === cat) || null

  // Calcoli per dashboard
  const cashflowMensile = useMemo(() => {
    const oggi = new Date()
    const inizioMese = startOfMonth(oggi)
    const fineMese = endOfMonth(oggi)
    
    const movimentiMese = movimenti.filter(m => {
      const data = new Date(m.data)
      return data >= inizioMese && data <= fineMese
    })
    
    const entrate = movimentiMese.filter(m => m.tipo === 'ENTRATA').reduce((s, m) => s + Number(m.importo), 0)
    const uscite = movimentiMese.filter(m => m.tipo === 'USCITA').reduce((s, m) => s + Math.abs(Number(m.importo)), 0)
    
    return { entrate, uscite, saldo: entrate - uscite }
  }, [movimenti])

  const categorieRiepilogo = useMemo(() => {
    const riepilogo: Record<string, number> = {}
    movimenti.forEach(m => {
      const cat = m.categoria || 'NON_CATEGORIZZATO'
      riepilogo[cat] = (riepilogo[cat] || 0) + Math.abs(Number(m.importo))
    })
    return Object.entries(riepilogo)
      .map(([cat, tot]) => ({ categoria: cat, totale: tot }))
      .sort((a, b) => b.totale - a.totale)
      .slice(0, 5)
  }, [movimenti])

  // Dati per grafico andamento giornaliero (ultimi 30 giorni)
  const datiGraficoGiornaliero = useMemo(() => {
    const oggi = new Date()
    const trentaGiorniFa = subDays(oggi, 30)
    
    const giorni = eachDayOfInterval({ start: trentaGiorniFa, end: oggi })
    
    let saldoProgressivo = 0
    // Calcola saldo iniziale (movimenti prima dei 30 giorni)
    movimenti.forEach(m => {
      const data = new Date(m.data)
      if (data < trentaGiorniFa) {
        saldoProgressivo += Number(m.importo)
      }
    })
    
    return giorni.map(giorno => {
      const movimentiGiorno = movimenti.filter(m => {
        const data = new Date(m.data)
        return format(data, 'yyyy-MM-dd') === format(giorno, 'yyyy-MM-dd')
      })
      
      const entrate = movimentiGiorno.filter(m => m.tipo === 'ENTRATA').reduce((s, m) => s + Number(m.importo), 0)
      const uscite = movimentiGiorno.filter(m => m.tipo === 'USCITA').reduce((s, m) => s + Math.abs(Number(m.importo)), 0)
      saldoProgressivo += entrate - uscite
      
      return {
        data: format(giorno, 'd MMM', { locale: it }),
        dataFull: format(giorno, 'dd/MM/yyyy'),
        entrate,
        uscite,
        saldo: saldoProgressivo,
        netto: entrate - uscite
      }
    })
  }, [movimenti])

  // Dati per grafico mensile (ultimi 6 mesi)
  const datiGraficoMensile = useMemo(() => {
    const oggi = new Date()
    const seiMesiFa = subMonths(oggi, 5)
    
    const mesi = eachMonthOfInterval({ start: startOfMonth(seiMesiFa), end: endOfMonth(oggi) })
    
    return mesi.map(mese => {
      const inizioMese = startOfMonth(mese)
      const fineMese = endOfMonth(mese)
      
      const movimentiMese = movimenti.filter(m => {
        const data = new Date(m.data)
        return data >= inizioMese && data <= fineMese
      })
      
      const entrate = movimentiMese.filter(m => m.tipo === 'ENTRATA').reduce((s, m) => s + Number(m.importo), 0)
      const uscite = movimentiMese.filter(m => m.tipo === 'USCITA').reduce((s, m) => s + Math.abs(Number(m.importo)), 0)
      
      return {
        mese: format(mese, 'MMM yy', { locale: it }),
        meseFull: format(mese, 'MMMM yyyy', { locale: it }),
        entrate,
        uscite,
        netto: entrate - uscite
      }
    })
  }, [movimenti])

  // Dati per grafico a torta categorie
  const datiGraficoCategorie = useMemo(() => {
    const riepilogo: Record<string, number> = {}
    movimenti.filter(m => m.tipo === 'USCITA').forEach(m => {
      const cat = m.categoria || 'NON_CATEGORIZZATO'
      riepilogo[cat] = (riepilogo[cat] || 0) + Math.abs(Number(m.importo))
    })
    
    return Object.entries(riepilogo)
      .map(([cat, tot]) => {
        const info = CATEGORIE.find(c => c.value === cat)
        return { 
          name: info?.label || 'Non categorizzato', 
          value: tot,
          color: info?.dotColor?.replace('bg-', '#').replace('-500', '') || '#gray'
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [movimenti])

  // Colori per il grafico a torta
  const COLORS_PIE = ['#8b5cf6', '#3b82f6', '#f97316', '#22c55e', '#ef4444', '#6b7280']

  // ============ RENDER ============

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="text-blue-600" size={28} />
            Tesoreria
          </h1>
          <p className="text-gray-500">Gestione flussi di cassa, scadenze e riconciliazione</p>
        </div>
        
        {/* Menu azioni */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { loadMovimenti(); loadScadenze(); }}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Aggiorna"
          >
            <RefreshCw size={20} className="text-gray-600" />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowScaricaMenu(!showScaricaMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              Azioni
              <ChevronDown size={16} />
            </button>
            
            {showScaricaMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowScaricaMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-20">
                  <button
                    onClick={() => { setShowScaricaMenu(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 rounded-t-lg"
                  >
                    <Plus size={18} className="text-gray-500" />
                    Nuovo movimento manuale
                  </button>
                  <label className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 cursor-pointer">
                    <Upload size={18} className="text-gray-500" />
                    Importa movimenti (CSV/Excel)
                    <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <hr className="my-1" />
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50">
                    <Link2 size={18} className="text-gray-500" />
                    Collega conto bancario (PSD2)
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 rounded-b-lg">
                    <Download size={18} className="text-gray-500" />
                    Esporta report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab principali */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'movimenti', label: 'Movimenti', icon: CreditCard },
          { id: 'scadenze', label: 'Scadenze', icon: Clock, badge: statsScadenze.countScadute },
          { id: 'cashflow', label: 'Cash Flow', icon: Activity },
          { id: 'regole', label: 'Regole', icon: Zap },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.badge && tab.badge > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ============ TAB DASHBOARD ============ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Saldo Attuale</p>
                  <p className={`text-2xl font-bold ${stats.saldo >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    €{formatImporto(stats.saldo)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Wallet size={24} className="text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Entrate (mese)</p>
                  <p className="text-2xl font-bold text-green-600">€{formatImporto(cashflowMensile.entrate)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp size={24} className="text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Uscite (mese)</p>
                  <p className="text-2xl font-bold text-red-600">€{formatImporto(cashflowMensile.uscite)}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <TrendingDown size={24} className="text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Da Incassare</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    €{formatImporto(statsScadenze.totaleScadute + statsScadenze.totaleInScadenza + statsScadenze.totaleFuture)}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Receipt size={24} className="text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {(statsScadenze.countScadute > 0 || stats.daVerificare > 0) && (
            <div className="space-y-2">
              {statsScadenze.countScadute > 0 && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="text-red-500" size={20} />
                  <span className="text-red-700">
                    <strong>{statsScadenze.countScadute} fatture scadute</strong> per un totale di €{formatImporto(statsScadenze.totaleScadute)}
                  </span>
                  <button 
                    onClick={() => setActiveTab('scadenze')}
                    className="ml-auto text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    Gestisci <ChevronRight size={16} />
                  </button>
                </div>
              )}
              
              {stats.daVerificare > 0 && (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Clock className="text-yellow-500" size={20} />
                  <span className="text-yellow-700">
                    <strong>{stats.daVerificare} movimenti</strong> da verificare e categorizzare
                  </span>
                  <button 
                    onClick={() => { setActiveTab('movimenti'); setFiltroRapido('da_verificare'); }}
                    className="ml-auto text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
                  >
                    Verifica <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Griglia dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ultimi movimenti */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Ultimi Movimenti</h3>
                <button 
                  onClick={() => setActiveTab('movimenti')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Vedi tutti →
                </button>
              </div>
              <div className="space-y-3">
                {movimenti.slice(0, 5).map(mov => (
                  <div key={mov.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${mov.tipo === 'ENTRATA' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {mov.tipo === 'ENTRATA' ? (
                          <ArrowDownLeft size={16} className="text-green-600" />
                        ) : (
                          <ArrowUpRight size={16} className="text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{mov.descrizione}</p>
                        <p className="text-xs text-gray-500">{format(new Date(mov.data), 'd MMM', { locale: it })}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${mov.tipo === 'ENTRATA' ? 'text-green-600' : 'text-gray-900'}`}>
                      {mov.tipo === 'USCITA' ? '-' : '+'}€{formatImporto(Math.abs(Number(mov.importo)))}
                    </span>
                  </div>
                ))}
                {movimenti.length === 0 && (
                  <p className="text-center text-gray-500 py-4">Nessun movimento</p>
                )}
              </div>
            </div>

            {/* Scadenze prossime */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Scadenze Prossime</h3>
                <button 
                  onClick={() => setActiveTab('scadenze')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Vedi tutte →
                </button>
              </div>
              <div className="space-y-3">
                {scadenze.slice(0, 5).map(scad => {
                  const dataScad = scad.dataScadenza ? new Date(scad.dataScadenza) : null
                  const giorniRimanenti = dataScad ? differenceInDays(dataScad, new Date()) : null
                  const isScaduta = giorniRimanenti !== null && giorniRimanenti < 0
                  
                  return (
                    <div key={scad.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Fatt. {scad.progressivo}/{new Date(scad.dataEmissione).getFullYear()}
                        </p>
                        <p className="text-xs text-gray-500">{scad.committente?.ragioneSociale}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">€{formatImporto(Number(scad.totale))}</p>
                        <p className={`text-xs ${isScaduta ? 'text-red-600' : 'text-gray-500'}`}>
                          {dataScad ? (isScaduta ? `Scaduta da ${Math.abs(giorniRimanenti!)}gg` : format(dataScad, 'd MMM', { locale: it })) : '-'}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {scadenze.length === 0 && (
                  <p className="text-center text-gray-500 py-4">Nessuna scadenza</p>
                )}
              </div>
            </div>

            {/* Ripartizione per categoria */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Ripartizione per Categoria</h3>
              <div className="space-y-3">
                {categorieRiepilogo.map(({ categoria, totale }) => {
                  const info = getCategoriaInfo(categoria)
                  const percentuale = stats.totaleUscite > 0 ? (totale / stats.totaleUscite) * 100 : 0
                  return (
                    <div key={categoria} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{info?.label || 'Non categorizzato'}</span>
                        <span className="font-medium">€{formatImporto(totale)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${info?.dotColor || 'bg-gray-400'}`}
                          style={{ width: `${Math.min(percentuale, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                {categorieRiepilogo.length === 0 && (
                  <p className="text-center text-gray-500 py-4">Nessun dato</p>
                )}
              </div>
            </div>

            {/* Azioni rapide */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Azioni Rapide</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Upload size={20} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Importa movimenti</span>
                </button>
                <button 
                  onClick={() => setActiveTab('scadenze')}
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Send size={20} className="text-yellow-600" />
                  </div>
                  <span className="text-sm font-medium">Invia solleciti</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('movimenti'); setFiltroRapido('non_categorizzati'); }}
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Target size={20} className="text-purple-600" />
                  </div>
                  <span className="text-sm font-medium">Categorizza</span>
                </button>
                <button 
                  onClick={() => setActiveTab('regole')}
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Zap size={20} className="text-green-600" />
                  </div>
                  <span className="text-sm font-medium">Crea regola</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB MOVIMENTI ============ */}
      {activeTab === 'movimenti' && (
        <>
          {/* Filtri rapidi */}
          <div className="flex items-center gap-6 border-b">
            {[
              { id: 'tutti', label: 'Tutti' },
              { id: 'entrate', label: 'Entrate', icon: ArrowDownLeft, color: 'green' },
              { id: 'uscite', label: 'Uscite', icon: ArrowUpRight, color: 'red' },
              { id: 'da_verificare', label: 'Da verificare', color: 'yellow' },
              { id: 'non_categorizzati', label: 'Non categorizzati', color: 'purple' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFiltroRapido(f.id as any)}
                className={`pb-3 px-1 font-medium transition-colors border-b-2 flex items-center gap-1 ${
                  filtroRapido === f.id 
                    ? `border-${f.color || 'gray'}-600 text-${f.color || 'gray'}-600` 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.icon && <f.icon size={16} />}
                {f.label}
              </button>
            ))}
          </div>
          
          {/* Barra ricerca e filtri */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Ricerca descrizioni e note"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg" />
            <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg min-w-[160px]">
              <option value="">Tutte le categorie</option>
              {CATEGORIE.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
            </select>
          </div>
          
          {/* Azioni batch */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-blue-700">{selected.size} movimenti selezionati</span>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                Categorizza
              </button>
              <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                Verifica tutti
              </button>
            </div>
          )}
          
          {/* Tabella movimenti */}
          <div className="bg-white rounded-xl border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
              </div>
            ) : movimentiFiltrati.length === 0 ? (
              <div className="p-12 text-center">
                <Landmark size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun movimento</h3>
                <p className="text-gray-500 mb-4">Carica i movimenti bancari per iniziare</p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                  <Upload size={18} />
                  Importa movimenti
                  <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="w-4 h-4 rounded" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrizione</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Importo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stato</th>
                    <th className="w-12 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movimentiFiltrati.map((mov) => {
                    const categoriaInfo = getCategoriaInfo(mov.categoria)
                    return (
                      <tr key={mov.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.has(mov.id)} onChange={() => toggleSelect(mov.id)} className="w-4 h-4 rounded" />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{format(new Date(mov.data), 'd MMM yyyy', { locale: it })}</div>
                          <div className="text-xs text-gray-500">{mov.tipo === 'ENTRATA' ? 'Accredito' : 'Addebito'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 max-w-md truncate">{mov.descrizione}</div>
                          {mov.riferimentoInterno && <div className="text-xs text-gray-500">{mov.riferimentoInterno}</div>}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className={`font-semibold ${mov.tipo === 'ENTRATA' ? 'text-green-600' : 'text-gray-900'}`}>
                            {mov.tipo === 'USCITA' ? '-' : '+'}€{formatImporto(Math.abs(Number(mov.importo)))}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <button
                              onClick={() => setShowCategoriaMenu(showCategoriaMenu === mov.id ? null : mov.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                categoriaInfo ? categoriaInfo.color : 'bg-gray-100 text-gray-500 border border-dashed border-gray-300'
                              }`}
                            >
                              {categoriaInfo ? categoriaInfo.label : 'Seleziona'}
                              <ChevronDown size={12} />
                            </button>
                            {showCategoriaMenu === mov.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowCategoriaMenu(null)} />
                                <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-20 max-h-64 overflow-auto">
                                  {CATEGORIE.map(cat => (
                                    <button
                                      key={cat.value}
                                      onClick={() => handleCategoriaChange(mov.id, cat.value)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                                    >
                                      <span className={`w-2 h-2 rounded-full ${cat.dotColor}`} />
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
                              mov.stato === 'VERIFICATO' ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            <Check size={16} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button className="p-1.5 hover:bg-gray-100 rounded">
                            <MoreHorizontal size={18} className="text-gray-400" />
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

      {/* ============ TAB SCADENZE ============ */}
      {activeTab === 'scadenze' && (
        <>
          {/* Filtri scadenze */}
          <div className="flex items-center gap-6 border-b">
            {[
              { id: 'tutte', label: `Tutte (${statsScadenze.countScadute + statsScadenze.countInScadenza + statsScadenze.countFuture})` },
              { id: 'scadute', label: `Scadute (${statsScadenze.countScadute})`, icon: AlertTriangle, color: 'red' },
              { id: 'in_scadenza', label: `In scadenza 7gg (${statsScadenze.countInScadenza})`, icon: Clock, color: 'yellow' },
              { id: 'future', label: `Future (${statsScadenze.countFuture})`, color: 'green' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFiltroScadenze(f.id as any)}
                className={`pb-3 px-1 font-medium transition-colors border-b-2 flex items-center gap-1 ${
                  filtroScadenze === f.id 
                    ? `border-${f.color || 'gray'}-600 text-${f.color || 'gray'}-600` 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.icon && <f.icon size={16} />}
                {f.label}
              </button>
            ))}
          </div>
          
          {/* Stats scadenze */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <AlertTriangle size={18} />
                <span className="text-sm font-medium">Scadute</span>
              </div>
              <p className="text-2xl font-bold text-red-700">€{formatImporto(statsScadenze.totaleScadute)}</p>
              <p className="text-sm text-red-600">{statsScadenze.countScadute} fatture</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-1">
                <Clock size={18} />
                <span className="text-sm font-medium">In scadenza (7gg)</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700">€{formatImporto(statsScadenze.totaleInScadenza)}</p>
              <p className="text-sm text-yellow-600">{statsScadenze.countInScadenza} fatture</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Calendar size={18} />
                <span className="text-sm font-medium">Future</span>
              </div>
              <p className="text-2xl font-bold text-green-700">€{formatImporto(statsScadenze.totaleFuture)}</p>
              <p className="text-sm text-green-600">{statsScadenze.countFuture} fatture</p>
            </div>
          </div>
          
          {/* Tabella scadenze */}
          <div className="bg-white rounded-xl border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
              </div>
            ) : scadenze.length === 0 ? (
              <div className="p-12 text-center">
                <Check size={48} className="mx-auto text-green-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna scadenza</h3>
                <p className="text-gray-500">Tutte le fatture sono state pagate</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fattura</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Committente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emissione</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scadenza</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Importo</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stato</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scadenze.map((scad) => {
                    const dataScad = scad.dataScadenza ? new Date(scad.dataScadenza) : null
                    const giorniRimanenti = dataScad ? differenceInDays(dataScad, new Date()) : null
                    let statoColor = 'bg-green-100 text-green-700'
                    let statoLabel = 'In tempo'
                    if (giorniRimanenti !== null) {
                      if (giorniRimanenti < 0) { statoColor = 'bg-red-100 text-red-700'; statoLabel = `Scaduta da ${Math.abs(giorniRimanenti)}gg` }
                      else if (giorniRimanenti <= 7) { statoColor = 'bg-yellow-100 text-yellow-700'; statoLabel = giorniRimanenti === 0 ? 'Oggi' : `Tra ${giorniRimanenti}gg` }
                      else { statoLabel = `Tra ${giorniRimanenti}gg` }
                    }
                    return (
                      <tr key={scad.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{scad.progressivo}/{new Date(scad.dataEmissione).getFullYear()}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-900">{scad.committente?.ragioneSociale || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{format(new Date(scad.dataEmissione), 'd MMM yyyy', { locale: it })}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{dataScad ? format(dataScad, 'd MMM yyyy', { locale: it }) : '-'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">€{formatImporto(Number(scad.totale))}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statoColor}`}>{statoLabel}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleSollecito(scad.id)} className="p-1.5 hover:bg-yellow-100 rounded text-yellow-600" title="Invia sollecito">
                              <Send size={16} />
                            </button>
                            <Link href={`/fatturazione/${scad.id}`} className="p-1.5 hover:bg-gray-100 rounded text-gray-400">
                              <ExternalLink size={16} />
                            </Link>
                          </div>
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

      {/* ============ TAB CASHFLOW ============ */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Analisi Cash Flow</h2>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              {['mese', 'trimestre', 'anno'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriodoAnalisi(p as any)}
                  className={`px-3 py-1 rounded text-sm font-medium ${periodoAnalisi === p ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Riepilogo periodo */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500">Entrate periodo</p>
              <p className="text-2xl font-bold text-green-600">€{formatImporto(cashflowMensile.entrate)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500">Uscite periodo</p>
              <p className="text-2xl font-bold text-red-600">€{formatImporto(cashflowMensile.uscite)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500">Flusso netto</p>
              <p className={`text-2xl font-bold ${cashflowMensile.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                €{formatImporto(cashflowMensile.saldo)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500">Previsione fine mese</p>
              <p className="text-2xl font-bold text-blue-600">€{formatImporto(stats.saldo + statsScadenze.totaleInScadenza)}</p>
            </div>
          </div>
          
          {/* Grafico Andamento */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Andamento Cash Flow</h3>
              <div className="text-sm text-gray-500">Ultimi 30 giorni</div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={datiGraficoGiornaliero}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="data" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `€${formatImporto(value)}`, 
                      name === 'entrate' ? 'Entrate' : name === 'uscite' ? 'Uscite' : 'Saldo'
                    ]}
                    labelFormatter={(label) => `Data: ${label}`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="saldo" 
                    fill="#dbeafe" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Saldo"
                  />
                  <Bar dataKey="entrate" fill="#22c55e" name="Entrate" barSize={8} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="uscite" fill="#ef4444" name="Uscite" barSize={8} radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grafici affiancati */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grafico Mensile */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Confronto Mensile</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datiGraficoMensile}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mese" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `€${formatImporto(value)}`, 
                        name === 'entrate' ? 'Entrate' : name === 'uscite' ? 'Uscite' : 'Netto'
                      ]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Bar dataKey="entrate" fill="#22c55e" name="Entrate" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="uscite" fill="#ef4444" name="Uscite" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grafico Categorie */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Uscite per Categoria</h3>
              <div className="h-64 flex items-center">
                {datiGraficoCategorie.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={datiGraficoCategorie}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {datiGraficoCategorie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`€${formatImporto(value)}`, 'Importo']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full text-center text-gray-500">
                    <PieChart size={48} className="mx-auto text-gray-300 mb-2" />
                    Nessun dato disponibile
                  </div>
                )}
              </div>
              {/* Legenda categorie */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {datiGraficoCategorie.slice(0, 6).map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS_PIE[i] }} />
                    <span className="text-gray-600 truncate">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Previsioni */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Previsioni Prossimi 30 Giorni</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Entrate previste</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                    <span>Fatture in scadenza</span>
                    <span className="font-semibold text-green-600">€{formatImporto(statsScadenze.totaleInScadenza)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                    <span>Fatture future</span>
                    <span className="font-semibold text-green-600">€{formatImporto(statsScadenze.totaleFuture)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Uscite previste</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                    <span>Pagamenti ricorrenti</span>
                    <span className="font-semibold text-red-600">-</span>
                  </div>
                  <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                    <span>Scadenze fornitori</span>
                    <span className="font-semibold text-red-600">-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB REGOLE ============ */}
      {activeTab === 'regole' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Regole di Categorizzazione</h2>
              <p className="text-sm text-gray-500">Automatizza la categorizzazione dei movimenti</p>
            </div>
            <button 
              onClick={() => setShowNuovaRegola(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              Nuova regola
            </button>
          </div>
          
          {/* Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Zap className="text-blue-500 mt-0.5" size={20} />
              <div>
                <p className="text-blue-800 font-medium">Come funzionano le regole?</p>
                <p className="text-blue-700 text-sm mt-1">
                  Le regole vengono applicate automaticamente ai nuovi movimenti importati. 
                  Se la descrizione del movimento contiene il testo specificato, viene assegnata la categoria corrispondente.
                </p>
              </div>
            </div>
          </div>
          
          {/* Lista regole */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome regola</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condizione</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Attiva</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regole.map((regola) => {
                  const catInfo = getCategoriaInfo(regola.categoria)
                  return (
                    <tr key={regola.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{regola.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{regola.condizione}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${catInfo?.color || 'bg-gray-100 text-gray-700'}`}>
                          {catInfo?.label || regola.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button className={`w-10 h-6 rounded-full transition-colors ${regola.attiva ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${regola.attiva ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1.5 hover:bg-gray-100 rounded"><Edit2 size={16} className="text-gray-400" /></button>
                          <button className="p-1.5 hover:bg-red-100 rounded"><Trash2 size={16} className="text-red-400" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
