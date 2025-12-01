// src/app/(dashboard)/report/alert/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, AlertTriangle, Clock, FileWarning, Building2, 
  CreditCard, Calendar, User, RefreshCw, Mail, Bell
} from 'lucide-react'

type AlertData = {
  committentiRischio: { 
    id: string
    nome: string
    saldoAperto: number
    eventiAperti: number 
  }[]
  documentiScadenza: { 
    id: string
    nome: string
    cognome: string
    tipoDocumento: string
    scadenzaDocumento: string 
  }[]
  agibilitaDaInviare: number
  prestazioniDaPagare: number
}

export default function AlertPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AlertData | null>(null)
  const [tab, setTab] = useState<'rischio' | 'documenti' | 'agibilita' | 'pagamenti'>('rischio')
  
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch('/api/report/kpi')
        if (res.ok) {
          const kpi = await res.json()
          setData(kpi.alert)
        }
      } catch (error) {
        console.error('Errore:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)
  }
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT')
  }
  
  const getDaysUntil = (dateStr: string) => {
    const today = new Date()
    const target = new Date(dateStr)
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }
  
  const getTipoDocumentoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      CARTA_IDENTITA: 'Carta d\'Identità',
      PASSAPORTO: 'Passaporto',
      PATENTE: 'Patente',
    }
    return labels[tipo] || tipo
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  const totalAlerts = (data?.committentiRischio.length || 0) + 
                      (data?.documentiScadenza.length || 0) + 
                      (data?.agibilitaDaInviare || 0) + 
                      (data?.prestazioniDaPagare || 0)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/report" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alert & Scadenze</h1>
            <p className="text-gray-500">{totalAlerts} elementi richiedono attenzione</p>
          </div>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw size={18} />
          Aggiorna
        </button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setTab('rischio')}
          className={`p-4 rounded-xl border-2 transition-all ${
            tab === 'rischio' 
              ? 'border-red-500 bg-red-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${tab === 'rischio' ? 'bg-red-200' : 'bg-red-100'}`}>
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-gray-900">{data?.committentiRischio.length || 0}</p>
              <p className="text-sm text-gray-500">Committenti a Rischio</p>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => setTab('documenti')}
          className={`p-4 rounded-xl border-2 transition-all ${
            tab === 'documenti' 
              ? 'border-yellow-500 bg-yellow-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${tab === 'documenti' ? 'bg-yellow-200' : 'bg-yellow-100'}`}>
              <FileWarning className="text-yellow-600" size={24} />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-gray-900">{data?.documentiScadenza.length || 0}</p>
              <p className="text-sm text-gray-500">Documenti in Scadenza</p>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => setTab('agibilita')}
          className={`p-4 rounded-xl border-2 transition-all ${
            tab === 'agibilita' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${tab === 'agibilita' ? 'bg-blue-200' : 'bg-blue-100'}`}>
              <Clock className="text-blue-600" size={24} />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-gray-900">{data?.agibilitaDaInviare || 0}</p>
              <p className="text-sm text-gray-500">Agibilità da Inviare</p>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => setTab('pagamenti')}
          className={`p-4 rounded-xl border-2 transition-all ${
            tab === 'pagamenti' 
              ? 'border-orange-500 bg-orange-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${tab === 'pagamenti' ? 'bg-orange-200' : 'bg-orange-100'}`}>
              <CreditCard className="text-orange-600" size={24} />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-gray-900">{data?.prestazioniDaPagare || 0}</p>
              <p className="text-sm text-gray-500">Pagamenti in Sospeso</p>
            </div>
          </div>
        </button>
      </div>
      
      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm">
        {/* Committenti a Rischio */}
        {tab === 'rischio' && (
          <div>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} />
                Committenti a Rischio con Saldo Aperto
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Committenti segnati come &quot;a rischio&quot; con prestazioni non ancora pagate
              </p>
            </div>
            
            {data?.committentiRischio && data.committentiRischio.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {data.committentiRischio.map(c => (
                  <div key={c.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Building2 className="text-red-600" size={20} />
                      </div>
                      <div>
                        <Link href={`/committenti/${c.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {c.nome}
                        </Link>
                        <p className="text-sm text-gray-500">{c.eventiAperti} eventi con pagamenti aperti</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{formatCurrency(c.saldoAperto)}</p>
                      <p className="text-sm text-gray-500">saldo aperto</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="mx-auto mb-2 text-gray-300" size={40} />
                <p>Nessun committente a rischio con saldo aperto</p>
              </div>
            )}
          </div>
        )}
        
        {/* Documenti in Scadenza */}
        {tab === 'documenti' && (
          <div>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileWarning className="text-yellow-500" size={20} />
                Documenti in Scadenza (prossimi 30 giorni)
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Artisti con documenti di identità in scadenza
              </p>
            </div>
            
            {data?.documentiScadenza && data.documentiScadenza.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {data.documentiScadenza.map(d => {
                  const days = getDaysUntil(d.scadenzaDocumento)
                  return (
                    <div key={d.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${days <= 7 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                          <User className={days <= 7 ? 'text-red-600' : 'text-yellow-600'} size={20} />
                        </div>
                        <div>
                          <Link href={`/artisti/${d.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                            {d.cognome} {d.nome}
                          </Link>
                          <p className="text-sm text-gray-500">{getTipoDocumentoLabel(d.tipoDocumento)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${days <= 7 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {formatDate(d.scadenzaDocumento)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {days === 0 ? 'Scade oggi!' : days === 1 ? 'Scade domani' : `tra ${days} giorni`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <FileWarning className="mx-auto mb-2 text-gray-300" size={40} />
                <p>Nessun documento in scadenza nei prossimi 30 giorni</p>
              </div>
            )}
          </div>
        )}
        
        {/* Agibilità da Inviare */}
        {tab === 'agibilita' && (
          <div>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="text-blue-500" size={20} />
                Agibilità da Inviare
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Agibilità confermate ma non ancora inviate al portale INPS
              </p>
            </div>
            
            <div className="p-8 text-center">
              {data?.agibilitaDaInviare && data.agibilitaDaInviare > 0 ? (
                <>
                  <div className="text-5xl font-bold text-blue-600 mb-2">{data.agibilitaDaInviare}</div>
                  <p className="text-gray-500 mb-4">agibilità pronte per l&apos;invio</p>
                  <Link
                    href="/agibilita?stato=CONFERMATA"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Vai alle Agibilità
                  </Link>
                </>
              ) : (
                <>
                  <Clock className="mx-auto mb-2 text-gray-300" size={40} />
                  <p className="text-gray-500">Tutte le agibilità sono state inviate</p>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Pagamenti in Sospeso */}
        {tab === 'pagamenti' && (
          <div>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="text-orange-500" size={20} />
                Prestazioni da Pagare
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Prestazioni con stato &quot;Da Pagare&quot;
              </p>
            </div>
            
            <div className="p-8 text-center">
              {data?.prestazioniDaPagare && data.prestazioniDaPagare > 0 ? (
                <>
                  <div className="text-5xl font-bold text-orange-600 mb-2">{data.prestazioniDaPagare}</div>
                  <p className="text-gray-500 mb-4">prestazioni in attesa di pagamento</p>
                  <Link
                    href="/pagamenti/occasionali"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Vai ai Pagamenti
                  </Link>
                </>
              ) : (
                <>
                  <CreditCard className="mx-auto mb-2 text-gray-300" size={40} />
                  <p className="text-gray-500">Tutti i pagamenti sono stati effettuati</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
