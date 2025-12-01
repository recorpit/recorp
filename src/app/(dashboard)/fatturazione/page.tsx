// src/app/(dashboard)/fatturazione/page.tsx
// Dashboard Fatturazione - Panoramica Agibilità e Produzione
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  FileText, Users, Music, Euro, TrendingUp, Clock, 
  AlertCircle, CheckCircle, ArrowRight, Calendar,
  Building2, Filter, ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface StatisticheFatturazione {
  // Generale
  totaleAnno: number
  totaleMese: number
  incassatoAnno: number
  daIncassare: number
  
  // Agibilità
  agibilitaDaFatturare: number
  agibilitaImportoDaFatturare: number
  agibilitaFatturate: number
  agibilitaImportoFatturato: number
  
  // Produzione (futuro)
  produzioneDaFatturare: number
  produzioneImportoDaFatturare: number
  
  // Previsioni
  fatturatoFuturo: number // fatture emesse non ancora pagate
  previsioneMese: number // stima basata su agibilità da fatturare
  scadenzeMese: number // fatture in scadenza nel mese
}

interface AgibilitaDaFatturare {
  id: string
  codice: string
  data: string
  locale: { nome: string }
  committente: { id: string; ragioneSociale: string } | null
  totaleCompensiLordi: number
  quotaAgenzia: number
  artisti: { artista: { nome: string; cognome: string } }[]
}

interface CommittenteGroup {
  committente: { id: string; ragioneSociale: string }
  agibilita: AgibilitaDaFatturare[]
  totale: number
  count: number
}

export default function FatturazionePage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatisticheFatturazione | null>(null)
  const [agibilitaByCommittente, setAgibilitaByCommittente] = useState<CommittenteGroup[]>([])
  const [filtroMese, setFiltroMese] = useState<string>('tutti')
  
  useEffect(() => {
    loadData()
  }, [])
  
  async function loadData() {
    try {
      // Carica statistiche
      const resStats = await fetch('/api/fatturazione/statistiche')
      if (resStats.ok) {
        setStats(await resStats.json())
      }
      
      // Carica agibilità da fatturare raggruppate per committente
      const resAgibilita = await fetch('/api/fatturazione/da-fatturare')
      if (resAgibilita.ok) {
        const data = await resAgibilita.json()
        setAgibilitaByCommittente(data.byCommittente || [])
      }
      
    } catch (err) {
      console.error('Errore caricamento:', err)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  const annoCorrente = new Date().getFullYear()
  const meseCorrente = format(new Date(), 'MMMM yyyy', { locale: it })
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fatturazione</h1>
          <p className="text-gray-500">Panoramica e gestione fatture {annoCorrente}</p>
        </div>
        
        <Link
          href="/fatture"
          className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <FileText size={20} />
          Archivio Fatture
        </Link>
      </div>
      
      {/* Statistiche Generali */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Fatturato Anno */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Euro className="text-blue-600" size={20} />
            </div>
            <span className="text-xs text-gray-400">{annoCorrente}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            €{(stats?.totaleAnno || 0).toLocaleString('it-IT')}
          </p>
          <p className="text-sm text-gray-500">Fatturato totale</p>
        </div>
        
        {/* Incassato */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <span className="text-xs text-green-600 font-medium">
              {stats?.totaleAnno ? Math.round((stats.incassatoAnno / stats.totaleAnno) * 100) : 0}%
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            €{(stats?.incassatoAnno || 0).toLocaleString('it-IT')}
          </p>
          <p className="text-sm text-gray-500">Incassato</p>
        </div>
        
        {/* Da Incassare */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            €{(stats?.daIncassare || 0).toLocaleString('it-IT')}
          </p>
          <p className="text-sm text-gray-500">Da incassare</p>
        </div>
        
        {/* Da Fatturare */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            €{((stats?.agibilitaImportoDaFatturare || 0) + (stats?.produzioneImportoDaFatturare || 0)).toLocaleString('it-IT')}
          </p>
          <p className="text-sm text-gray-500">Da fatturare</p>
        </div>
      </div>
      
      {/* Sezioni Da Fatturare */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* AGIBILITÀ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Music className="text-blue-600" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Agibilità</h2>
                  <p className="text-sm text-gray-500">
                    {stats?.agibilitaDaFatturare || 0} da fatturare
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-600">
                  €{(stats?.agibilitaImportoDaFatturare || 0).toLocaleString('it-IT')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Lista raggruppata per committente */}
          <div className="max-h-96 overflow-y-auto">
            {agibilitaByCommittente.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <CheckCircle size={40} className="mx-auto mb-2 opacity-50" />
                <p>Tutto fatturato!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {agibilitaByCommittente.map((group) => (
                  <Link
                    key={group.committente.id}
                    href={`/fatturazione/agibilita?committente=${group.committente.id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Building2 size={18} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {group.committente.ragioneSociale}
                          </p>
                          <p className="text-sm text-gray-500">
                            {group.count} agibilità
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-gray-900">
                          €{group.totale.toLocaleString('it-IT')}
                        </span>
                        <ChevronRight size={20} className="text-gray-400" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer con link */}
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <Link
              href="/fatturazione/agibilita"
              className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Vedi tutte le agibilità da fatturare
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        
        {/* PRODUZIONE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="text-orange-600" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Produzione</h2>
                  <p className="text-sm text-gray-500">
                    {stats?.produzioneDaFatturare || 0} da fatturare
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-orange-600">
                  €{(stats?.produzioneImportoDaFatturare || 0).toLocaleString('it-IT')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Placeholder per produzione */}
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-orange-300" />
            </div>
            <p className="text-gray-500 mb-4">
              Modulo produzione in arrivo
            </p>
            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
              Prossimamente
            </span>
          </div>
          
          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <button
              disabled
              className="flex items-center justify-center gap-2 text-gray-400 font-medium w-full cursor-not-allowed"
            >
              Gestione produzione
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Dettaglio Mese Corrente */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Dettaglio {meseCorrente}
          </h2>
          <select
            value={filtroMese}
            onChange={(e) => setFiltroMese(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
          >
            <option value="tutti">Tutti i mesi</option>
            <option value="corrente">Mese corrente</option>
            <option value="precedente">Mese precedente</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Fatturato mese</p>
            <p className="text-xl font-bold">€{(stats?.totaleMese || 0).toLocaleString('it-IT')}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">Agibilità fatturate</p>
            <p className="text-xl font-bold text-blue-700">{stats?.agibilitaFatturate || 0}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 mb-1">Da fatturare</p>
            <p className="text-xl font-bold text-purple-700">{stats?.agibilitaDaFatturare || 0}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 mb-1">Incassi previsti</p>
            <p className="text-xl font-bold text-green-700">€{(stats?.fatturatoFuturo || 0).toLocaleString('it-IT')}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-600 mb-1">Scadenze mese</p>
            <p className="text-xl font-bold text-yellow-700">{stats?.scadenzeMese || 0}</p>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/fatturazione/agibilita"
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="p-2 bg-blue-100 rounded-lg">
            <Music className="text-blue-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Fattura Agibilità</p>
            <p className="text-sm text-gray-500">{stats?.agibilitaDaFatturare || 0} in attesa</p>
          </div>
        </Link>
        
        <Link
          href="/fatture"
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="p-2 bg-gray-100 rounded-lg">
            <FileText className="text-gray-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Archivio Fatture</p>
            <p className="text-sm text-gray-500">Tutte le fatture</p>
          </div>
        </Link>
        
        <Link
          href="/fatture?stato=EMESSA,INVIATA"
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-yellow-300 hover:shadow-md transition-all"
        >
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Clock className="text-yellow-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Da Incassare</p>
            <p className="text-sm text-gray-500">€{(stats?.daIncassare || 0).toLocaleString('it-IT')}</p>
          </div>
        </Link>
        
        <Link
          href="/committenti"
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="p-2 bg-purple-100 rounded-lg">
            <Building2 className="text-purple-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Committenti</p>
            <p className="text-sm text-gray-500">Gestione anagrafica</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
