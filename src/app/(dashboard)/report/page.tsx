// src/app/(dashboard)/report/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, DollarSign, Users, Calendar, Building2,
  AlertTriangle, FileText, CreditCard, BarChart3, PieChart, Activity,
  ChevronRight, RefreshCw, Download, Filter, Clock, MapPin
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

const QUALIFICA_LABELS: Record<string, string> = {
  DJ: 'DJ',
  VOCALIST: 'Vocalist',
  MUSICISTA: 'Musicista',
  BALLERINO: 'Ballerino',
  PERFORMER: 'Performer',
  ALTRO: 'Altro'
}

type KPIData = {
  periodo: { da: string; a: string }
  economici: {
    fatturato: number
    fatturatoPrecedente: number
    variazioneFatturato: string | null
    totaleCachet: number
    margine: number
    totalePagato: number
    totaleSospeso: number
  }
  operativi: {
    agibilita: { totale: number; bozza: number; pronta: number; inviata: number; completata: number; errore: number }
    prestazioni: number
    artistiAttivi: number
    totaleArtisti: number
    totaleCommittenti: number
    totaleLocali: number
  }
  classifiche: {
    topArtisti: { id: string; nome: string; prestazioni: number; fatturato: number }[]
    topCommittenti: { id: string; nome: string; eventi: number; fatturato: number }[]
    topLocali: { id: string; nome: string; citta: string; eventi: number }[]
    distribuzioneQualifica: Record<string, number>
  }
  alert: {
    committentiRischio: { id: string; nome: string; saldoAperto: number; eventiAperti: number }[]
    documentiScadenza: { id: string; nome: string; cognome: string; tipoDocumento: string; scadenzaDocumento: string }[]
    agibilitaDaInviare: number
    prestazioniDaPagare: number
  }
}

type TrendData = {
  anno: number
  mesi: { mese: number; nomeMese: string; fatturato: number; fatturatoPrecedente: number; cachet: number; margine: number; eventi: number; prestazioni: number }[]
  settimane: { settimana: number; label: string; fatturato: number; eventi: number }[]
  totali: { fatturato: number; fatturatoPrecedente: number; cachet: number; eventi: number; prestazioni: number; margine: number; variazione: string | null }
}

export default function ReportPage() {
  const [loading, setLoading] = useState(true)
  const [kpi, setKpi] = useState<KPIData | null>(null)
  const [trend, setTrend] = useState<TrendData | null>(null)
  const [periodo, setPeriodo] = useState('anno') // anno, trimestre, mese, custom
  const [anno, setAnno] = useState(new Date().getFullYear())
  const [dateRange, setDateRange] = useState({
    da: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    a: new Date().toISOString().split('T')[0]
  })
  
  // Calcola date in base al periodo
  const getDateRange = () => {
    const oggi = new Date()
    switch (periodo) {
      case 'mese':
        return {
          da: new Date(oggi.getFullYear(), oggi.getMonth(), 1).toISOString().split('T')[0],
          a: oggi.toISOString().split('T')[0]
        }
      case 'trimestre':
        const trimestre = Math.floor(oggi.getMonth() / 3)
        return {
          da: new Date(oggi.getFullYear(), trimestre * 3, 1).toISOString().split('T')[0],
          a: oggi.toISOString().split('T')[0]
        }
      case 'anno':
        return {
          da: new Date(oggi.getFullYear(), 0, 1).toISOString().split('T')[0],
          a: oggi.toISOString().split('T')[0]
        }
      case 'custom':
        return dateRange
      default:
        return dateRange
    }
  }
  
  const loadData = async () => {
    setLoading(true)
    try {
      const range = getDateRange()
      
      const [kpiRes, trendRes] = await Promise.all([
        fetch(`/api/report/kpi?da=${range.da}&a=${range.a}`),
        fetch(`/api/report/trend?anno=${anno}`)
      ])
      
      if (kpiRes.ok) {
        const kpiData = await kpiRes.json()
        setKpi(kpiData)
      }
      
      if (trendRes.ok) {
        const trendData = await trendRes.json()
        setTrend(trendData)
      }
    } catch (error) {
      console.error('Errore caricamento report:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadData()
  }, [periodo, dateRange, anno])
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)
  }
  
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('it-IT').format(value)
  }
  
  // Prepara dati per grafico a torta qualifiche
  const pieData = kpi ? Object.entries(kpi.classifiche.distribuzioneQualifica).map(([key, value]) => ({
    name: QUALIFICA_LABELS[key] || key,
    value
  })) : []
  
  if (loading && !kpi) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report & KPI</h1>
          <p className="text-gray-500">Analisi performance e indicatori chiave</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Selettore periodo */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            {['mese', 'trimestre', 'anno', 'custom'].map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  periodo === p 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p === 'mese' ? 'Mese' : p === 'trimestre' ? 'Trimestre' : p === 'anno' ? 'Anno' : 'Custom'}
              </button>
            ))}
          </div>
          
          {periodo === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.da}
                onChange={e => setDateRange(prev => ({ ...prev, da: e.target.value }))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={dateRange.a}
                onChange={e => setDateRange(prev => ({ ...prev, a: e.target.value }))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}
          
          <button
            onClick={loadData}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Aggiorna"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      {kpi && (
        <>
          {/* KPI Cards - Economici */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Fatturato */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Fatturato</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpi.economici.fatturato)}</p>
                  {kpi.economici.variazioneFatturato && (
                    <div className={`flex items-center gap-1 text-sm ${
                      parseFloat(kpi.economici.variazioneFatturato) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {parseFloat(kpi.economici.variazioneFatturato) >= 0 ? (
                        <TrendingUp size={16} />
                      ) : (
                        <TrendingDown size={16} />
                      )}
                      {kpi.economici.variazioneFatturato}% vs anno prec.
                    </div>
                  )}
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <DollarSign className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
            
            {/* Cachet Pagati */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Cachet Artisti</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpi.economici.totaleCachet)}</p>
                  <p className="text-sm text-gray-500">
                    Pagati: {formatCurrency(kpi.economici.totalePagato)}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <CreditCard className="text-orange-600" size={24} />
                </div>
              </div>
            </div>
            
            {/* Margine */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Margine</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpi.economici.margine)}</p>
                  <p className="text-sm text-gray-500">
                    {kpi.economici.fatturato > 0 
                      ? `${((kpi.economici.margine / kpi.economici.fatturato) * 100).toFixed(1)}% del fatturato`
                      : '-'
                    }
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
              </div>
            </div>
            
            {/* Sospeso */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Da Pagare</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpi.economici.totaleSospeso)}</p>
                  <p className="text-sm text-gray-500">
                    {kpi.alert.prestazioniDaPagare} prestazioni
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <Clock className="text-red-600" size={24} />
                </div>
              </div>
            </div>
          </div>
          
          {/* KPI Cards - Operativi */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{kpi.operativi.agibilita.totale}</p>
                  <p className="text-xs text-gray-500">Agibilità</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{kpi.operativi.prestazioni}</p>
                  <p className="text-xs text-gray-500">Prestazioni</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{kpi.operativi.artistiAttivi}</p>
                  <p className="text-xs text-gray-500">Artisti Attivi</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Users className="text-gray-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{kpi.operativi.totaleArtisti}</p>
                  <p className="text-xs text-gray-500">Artisti Totali</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Building2 className="text-yellow-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{kpi.operativi.totaleCommittenti}</p>
                  <p className="text-xs text-gray-500">Committenti</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <MapPin className="text-pink-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{kpi.operativi.totaleLocali}</p>
                  <p className="text-xs text-gray-500">Locali</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Alert Section */}
          {(kpi.alert.agibilitaDaInviare > 0 || 
            kpi.alert.prestazioniDaPagare > 0 || 
            kpi.alert.committentiRischio.length > 0 ||
            kpi.alert.documentiScadenza.length > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="text-yellow-600" size={20} />
                <h3 className="font-semibold text-yellow-800">Attenzione</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpi.alert.agibilitaDaInviare > 0 && (
                  <Link href="/agibilita?stato=PRONTA" className="flex items-center gap-2 text-yellow-700 hover:text-yellow-900">
                    <span className="font-bold">{kpi.alert.agibilitaDaInviare}</span>
                    <span className="text-sm">agibilità da inviare</span>
                    <ChevronRight size={16} />
                  </Link>
                )}
                {kpi.alert.prestazioniDaPagare > 0 && (
                  <Link href="/pagamenti/occasionali" className="flex items-center gap-2 text-yellow-700 hover:text-yellow-900">
                    <span className="font-bold">{kpi.alert.prestazioniDaPagare}</span>
                    <span className="text-sm">prestazioni da pagare</span>
                    <ChevronRight size={16} />
                  </Link>
                )}
                {kpi.alert.committentiRischio.length > 0 && (
                  <Link href="/report/alert" className="flex items-center gap-2 text-yellow-700 hover:text-yellow-900">
                    <span className="font-bold">{kpi.alert.committentiRischio.length}</span>
                    <span className="text-sm">committenti a rischio</span>
                    <ChevronRight size={16} />
                  </Link>
                )}
                {kpi.alert.documentiScadenza.length > 0 && (
                  <Link href="/report/alert" className="flex items-center gap-2 text-yellow-700 hover:text-yellow-900">
                    <span className="font-bold">{kpi.alert.documentiScadenza.length}</span>
                    <span className="text-sm">documenti in scadenza</span>
                    <ChevronRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          )}
          
          {/* Grafici */}
          {trend && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Andamento Fatturato */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Andamento Fatturato {anno}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAnno(anno - 1)}
                      className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                      ◀
                    </button>
                    <span className="text-sm font-medium">{anno}</span>
                    <button
                      onClick={() => setAnno(anno + 1)}
                      className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                      disabled={anno >= new Date().getFullYear()}
                    >
                      ▶
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trend.mesi}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nomeMese" />
                    <YAxis tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Mese: ${label}`}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="fatturato" 
                      name="Fatturato" 
                      stroke="#3b82f6" 
                      fill="#93c5fd" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="fatturatoPrecedente" 
                      name={`${anno - 1}`}
                      stroke="#9ca3af" 
                      fill="#e5e7eb" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Margine Mensile */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Margine Mensile</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trend.mesi}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nomeMese" />
                    <YAxis tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="fatturato" name="Fatturato" fill="#3b82f6" />
                    <Bar dataKey="cachet" name="Cachet" fill="#f59e0b" />
                    <Bar dataKey="margine" name="Margine" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Distribuzione Qualifiche */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Distribuzione per Qualifica</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              
              {/* Eventi per Mese */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Eventi e Prestazioni</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trend.mesi}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nomeMese" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="eventi" 
                      name="Eventi" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="prestazioni" 
                      name="Prestazioni" 
                      stroke="#ec4899" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          {/* Classifiche */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Artisti */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Top 10 Artisti</h3>
                <Link href="/report/classifiche" className="text-blue-600 text-sm hover:underline">
                  Vedi tutti
                </Link>
              </div>
              <div className="space-y-3">
                {kpi.classifiche.topArtisti.slice(0, 5).map((artista, idx) => (
                  <div key={artista.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                      idx === 1 ? 'bg-gray-300 text-gray-700' :
                      idx === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{artista.nome}</p>
                      <p className="text-xs text-gray-500">{artista.prestazioni} prestazioni</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(artista.fatturato)}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Top Committenti */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Top 10 Committenti</h3>
                <Link href="/report/classifiche" className="text-blue-600 text-sm hover:underline">
                  Vedi tutti
                </Link>
              </div>
              <div className="space-y-3">
                {kpi.classifiche.topCommittenti.slice(0, 5).map((committente, idx) => (
                  <div key={committente.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                      idx === 1 ? 'bg-gray-300 text-gray-700' :
                      idx === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{committente.nome}</p>
                      <p className="text-xs text-gray-500">{committente.eventi} eventi</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(committente.fatturato)}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Top Locali */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Top 10 Locali</h3>
                <Link href="/report/classifiche" className="text-blue-600 text-sm hover:underline">
                  Vedi tutti
                </Link>
              </div>
              <div className="space-y-3">
                {kpi.classifiche.topLocali.slice(0, 5).map((locale, idx) => (
                  <div key={locale.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                      idx === 1 ? 'bg-gray-300 text-gray-700' :
                      idx === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{locale.nome}</p>
                      <p className="text-xs text-gray-500">{locale.citta}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-600">{locale.eventi} eventi</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Status Agibilità */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Stato Agibilità</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{kpi.operativi.agibilita.totale}</p>
                <p className="text-sm text-gray-500">Totale</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">{kpi.operativi.agibilita.bozza}</p>
                <p className="text-sm text-gray-500">Bozza</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{kpi.operativi.agibilita.pronta}</p>
                <p className="text-sm text-gray-500">Pronte</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{kpi.operativi.agibilita.inviata}</p>
                <p className="text-sm text-gray-500">Inviate INPS</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{kpi.operativi.agibilita.completata}</p>
                <p className="text-sm text-gray-500">Completate</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-600">{kpi.operativi.agibilita.errore}</p>
                <p className="text-sm text-gray-500">Errore</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
