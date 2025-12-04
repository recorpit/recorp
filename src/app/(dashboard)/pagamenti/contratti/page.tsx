// src/app/(dashboard)/pagamenti/contratti/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  FileText, Users, Clock, CheckCircle, 
  AlertTriangle, Euro, Search, RefreshCw,
  Upload, Check, X, Calendar, Download, Send,
  Mail, Building2, ChevronDown, ChevronUp,
  Plus, Settings, Eye, Loader2, Filter
} from 'lucide-react'

type TipoVista = 'P_IVA' | 'FULL_TIME'

const STATI_PIVA: Record<string, { label: string; color: string }> = {
  DA_RICHIEDERE: { label: 'Da Richiedere', color: 'bg-gray-100 text-gray-700' },
  RICHIESTA_INVIATA: { label: 'Richiesta Inviata', color: 'bg-yellow-100 text-yellow-700' },
  FATTURA_RICEVUTA: { label: 'Fattura Ricevuta', color: 'bg-blue-100 text-blue-700' },
  INVIATA_CONSULENTE: { label: 'Inviata Consulente', color: 'bg-purple-100 text-purple-700' },
  IN_DISTINTA: { label: 'In Distinta', color: 'bg-indigo-100 text-indigo-700' },
  PAGATA: { label: 'Pagata', color: 'bg-green-100 text-green-700' },
}

const STATI_BUSTA: Record<string, { label: string; color: string }> = {
  DA_ELABORARE: { label: 'Da Elaborare', color: 'bg-gray-100 text-gray-700' },
  INVIATA_CONSULENTE: { label: 'Inviata Consulente', color: 'bg-yellow-100 text-yellow-700' },
  RICEVUTA: { label: 'Busta Ricevuta', color: 'bg-blue-100 text-blue-700' },
  PAGATA: { label: 'Pagata', color: 'bg-green-100 text-green-700' },
}

export default function ContrattiPage() {
  const [loading, setLoading] = useState(true)
  const [vistaAttiva, setVistaAttiva] = useState<TipoVista>('P_IVA')
  const [searchTerm, setSearchTerm] = useState('')
  
  // P.IVA
  const [artistiPIVA, setArtistiPIVA] = useState<any[]>([])
  const [raggruppamenti, setRaggruppamenti] = useState<any[]>([])
  const [impostazioniPIVA, setImpostazioniPIVA] = useState<any>(null)
  const [expandedArtista, setExpandedArtista] = useState<string | null>(null)
  
  // Full Time
  const [calcoliFullTime, setCalcoliFullTime] = useState<any[]>([])
  const [totaliFullTime, setTotaliFullTime] = useState<any>(null)
  const [meseSelezionato, setMeseSelezionato] = useState(() => {
    const oggi = new Date()
    return { anno: oggi.getFullYear(), mese: oggi.getMonth() + 1 }
  })
  
  // Modali
  const [modalFattura, setModalFattura] = useState<any>(null)
  const [modalDettaglio, setModalDettaglio] = useState<any>(null)
  const [formFattura, setFormFattura] = useState({
    numeroFattura: '',
    dataFattura: '',
    pdfFile: null as File | null,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [vistaAttiva, meseSelezionato])

  async function loadData() {
    setLoading(true)
    try {
      if (vistaAttiva === 'P_IVA') {
        // Carica artisti P.IVA da triggerare
        const res = await fetch('/api/pagamenti/piva?daTriggerare=true')
        const data = await res.json()
        setArtistiPIVA(data.artisti || [])
        setImpostazioniPIVA(data.impostazioni)
        
        // Carica raggruppamenti esistenti
        const resRagg = await fetch('/api/pagamenti/piva')
        const raggData = await resRagg.json()
        setRaggruppamenti(raggData)
      } else {
        // Carica calcoli full time
        const res = await fetch(
          `/api/pagamenti/fulltime?anno=${meseSelezionato.anno}&mese=${meseSelezionato.mese}&ricalcola=true`
        )
        const data = await res.json()
        setCalcoliFullTime(data.calcoli || [])
        setTotaliFullTime(data.totali)
      }
    } catch (error) {
      console.error('Errore caricamento:', error)
    } finally {
      setLoading(false)
    }
  }

  // Crea raggruppamento e invia richiesta fattura
  async function creaRaggruppamentoEInvia(artista: any) {
    if (!confirm(`Vuoi creare il raggruppamento e inviare la richiesta fattura a ${artista.artista.email}?`)) {
      return
    }
    
    setSaving(true)
    try {
      // Crea raggruppamento
      const resCreate = await fetch('/api/pagamenti/piva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistaId: artista.artista.id,
          artistaAgibilitaIds: artista.agibilitaNonRaggruppate.map((a: any) => a.id),
        })
      })
      
      if (!resCreate.ok) throw new Error('Errore creazione raggruppamento')
      const raggruppamento = await resCreate.json()
      
      // Invia richiesta
      const resInvia = await fetch(`/api/pagamenti/piva/${raggruppamento.id}/invia-richiesta`, {
        method: 'POST'
      })
      
      if (!resInvia.ok) throw new Error('Errore invio email')
      
      alert('✅ Raggruppamento creato e richiesta inviata!')
      loadData()
    } catch (error) {
      console.error(error)
      alert('Errore durante l\'operazione')
    } finally {
      setSaving(false)
    }
  }

  // Registra fattura ricevuta
  async function registraFattura() {
    if (!formFattura.numeroFattura || !formFattura.dataFattura) {
      alert('Compila numero e data fattura')
      return
    }
    
    setSaving(true)
    try {
      // TODO: Upload PDF se presente
      let pdfPath = null
      
      const res = await fetch(`/api/pagamenti/piva/${modalFattura.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REGISTRA_FATTURA',
          numeroFattura: formFattura.numeroFattura,
          dataFattura: formFattura.dataFattura,
          pdfFatturaPath: pdfPath,
        })
      })
      
      if (!res.ok) throw new Error('Errore registrazione')
      
      alert('✅ Fattura registrata!')
      setModalFattura(null)
      setFormFattura({ numeroFattura: '', dataFattura: '', pdfFile: null })
      loadData()
    } catch (error) {
      console.error(error)
      alert('Errore durante la registrazione')
    } finally {
      setSaving(false)
    }
  }

  // Invia al consulente
  async function inviaAlConsulente(raggruppamentoId: string) {
    if (!confirm('Inviare la fattura al consulente del lavoro?')) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/pagamenti/piva/${raggruppamentoId}/invia-consulente`, {
        method: 'POST'
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Errore invio')
      }
      
      alert('✅ Fattura inviata al consulente!')
      loadData()
    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Errore durante l\'invio')
    } finally {
      setSaving(false)
    }
  }

  // Invia calcolo full time al consulente
  async function inviaFullTimeConsulente(calcoloId: string) {
    if (!confirm('Inviare il riepilogo al consulente del lavoro?')) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/pagamenti/fulltime/${calcoloId}/invia-consulente`, {
        method: 'POST'
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Errore invio')
      }
      
      alert('✅ Riepilogo inviato al consulente!')
      loadData()
    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Errore durante l\'invio')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)
  }

  const meseCorrente = new Date(meseSelezionato.anno, meseSelezionato.mese - 1)
    .toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratti / P.IVA</h1>
          <p className="text-gray-500">Gestione pagamenti per P.IVA e Full Time</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/impostazioni/pagamenti"
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Impostazioni"
          >
            <Settings size={20} />
          </Link>
          <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Tab Vista */}
      <div className="bg-white rounded-xl shadow-sm p-2 mb-6 inline-flex gap-2">
        <button
          onClick={() => setVistaAttiva('P_IVA')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            vistaAttiva === 'P_IVA' 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileText size={18} />
          P.IVA
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            vistaAttiva === 'P_IVA' ? 'bg-purple-500' : 'bg-gray-200'
          }`}>
            {artistiPIVA.filter(a => a.daTriggerare).length}
          </span>
        </button>
        
        <button
          onClick={() => setVistaAttiva('FULL_TIME')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            vistaAttiva === 'FULL_TIME' 
              ? 'bg-green-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users size={18} />
          Full Time
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            vistaAttiva === 'FULL_TIME' ? 'bg-green-500' : 'bg-gray-200'
          }`}>
            {calcoliFullTime.length}
          </span>
        </button>
      </div>

      {/* ==================== VISTA P.IVA ==================== */}
      {vistaAttiva === 'P_IVA' && (
        <div className="space-y-6">
          {/* Info e impostazioni */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="text-purple-800">
                <strong>Trigger automatico:</strong> dopo {impostazioniPIVA?.giorniTrigger || 30} giorni 
                oppure al raggiungimento di {formatCurrency(impostazioniPIVA?.importoMinimo || 100)}
              </p>
            </div>
            <Link
              href="/impostazioni/pagamenti"
              className="text-purple-700 hover:text-purple-900 text-sm underline"
            >
              Modifica
            </Link>
          </div>

          {/* Artisti da triggerare */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-yellow-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle size={20} className="text-yellow-600" />
                Artisti da Fatturare ({artistiPIVA.filter(a => a.daTriggerare).length})
              </h2>
            </div>
            
            {artistiPIVA.filter(a => a.daTriggerare).length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle size={40} className="mx-auto mb-2 text-green-500" />
                Nessun artista P.IVA da fatturare
              </div>
            ) : (
              <div className="divide-y">
                {artistiPIVA.filter(a => a.daTriggerare).map((item) => (
                  <div key={item.artista.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="font-semibold text-purple-600">
                            {item.artista.cognome?.[0]}{item.artista.nome?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.artista.cognome} {item.artista.nome}
                          </p>
                          <p className="text-sm text-gray-500">
                            P.IVA: {item.artista.partitaIva || 'N/D'} • {item.artista.email || 'No email'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{item.numeroAgibilita} agibilità</p>
                          <p className="font-semibold text-lg text-purple-600">
                            {formatCurrency(item.totaleNetto)}
                          </p>
                        </div>
                        
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.motivoTrigger === 'IMPORTO' 
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.motivoTrigger === 'IMPORTO' ? '≥€100' : `${item.giorniPassati}gg`}
                        </span>
                        
                        <button
                          onClick={() => setExpandedArtista(
                            expandedArtista === item.artista.id ? null : item.artista.id
                          )}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          {expandedArtista === item.artista.id ? <ChevronUp /> : <ChevronDown />}
                        </button>
                        
                        <button
                          onClick={() => creaRaggruppamentoEInvia(item)}
                          disabled={saving || !item.artista.email}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                          <Send size={16} />
                          Richiedi Fattura
                        </button>
                      </div>
                    </div>
                    
                    {/* Dettaglio agibilità */}
                    {expandedArtista === item.artista.id && (
                      <div className="mt-4 bg-gray-50 rounded-lg p-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500">
                              <th className="pb-2">Data</th>
                              <th className="pb-2">Locale</th>
                              <th className="pb-2">Codice</th>
                              <th className="pb-2 text-right">Netto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.agibilitaNonRaggruppate.map((ag: any) => (
                              <tr key={ag.id} className="border-t border-gray-200">
                                <td className="py-2">
                                  {new Date(ag.agibilita.data).toLocaleDateString('it-IT')}
                                </td>
                                <td className="py-2">{ag.agibilita.locale?.nome}</td>
                                <td className="py-2">{ag.agibilita.codice}</td>
                                <td className="py-2 text-right">{formatCurrency(ag.compensoNetto)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Raggruppamenti in corso */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">
                Raggruppamenti in Lavorazione
              </h2>
            </div>
            
            {raggruppamenti.filter(r => r.stato !== 'PAGATA').length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nessun raggruppamento in lavorazione
              </div>
            ) : (
              <div className="divide-y">
                {raggruppamenti.filter(r => r.stato !== 'PAGATA').map((ragg) => (
                  <div key={ragg.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <FileText size={20} className="text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {ragg.artista.cognome} {ragg.artista.nome}
                          </p>
                          <p className="text-sm text-gray-500">
                            {ragg.numeroAgibilita} agibilità • 
                            {new Date(ragg.periodoInizio).toLocaleDateString('it-IT')} - 
                            {new Date(ragg.periodoFine).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${STATI_PIVA[ragg.stato]?.color}`}>
                          {STATI_PIVA[ragg.stato]?.label}
                        </span>
                        
                        <p className="font-semibold">{formatCurrency(Number(ragg.totaleNetto))}</p>
                        
                        {/* Azioni in base allo stato */}
                        {ragg.stato === 'RICHIESTA_INVIATA' && (
                          <button
                            onClick={() => setModalFattura(ragg)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Registra Fattura
                          </button>
                        )}
                        
                        {ragg.stato === 'FATTURA_RICEVUTA' && (
                          <button
                            onClick={() => inviaAlConsulente(ragg.id)}
                            disabled={saving}
                            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                          >
                            Invia Consulente
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== VISTA FULL TIME ==================== */}
      {vistaAttiva === 'FULL_TIME' && (
        <div className="space-y-6">
          {/* Selettore mese */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMeseSelezionato(m => ({
                  anno: m.mese === 1 ? m.anno - 1 : m.anno,
                  mese: m.mese === 1 ? 12 : m.mese - 1
                }))}
                className="p-2 hover:bg-gray-100 rounded"
              >
                ←
              </button>
              <h2 className="text-lg font-semibold capitalize">{meseCorrente}</h2>
              <button
                onClick={() => setMeseSelezionato(m => ({
                  anno: m.mese === 12 ? m.anno + 1 : m.anno,
                  mese: m.mese === 12 ? 1 : m.mese + 1
                }))}
                className="p-2 hover:bg-gray-100 rounded"
              >
                →
              </button>
            </div>
            
            {totaliFullTime && (
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Totale Buste Paga:</span>
                  <span className="ml-2 font-semibold">{formatCurrency(totaliFullTime.totaleBustePaga)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Gettoni Agenzia:</span>
                  <span className="ml-2 font-semibold text-green-600">
                    {formatCurrency(totaliFullTime.totaleGettoniAgenzia)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Lista dipendenti */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-green-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users size={20} className="text-green-600" />
                Dipendenti Full Time - {meseCorrente}
              </h2>
            </div>
            
            {calcoliFullTime.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nessun dipendente full time
              </div>
            ) : (
              <div className="divide-y">
                {calcoliFullTime.map((calcolo) => (
                  <div key={calcolo.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="font-semibold text-green-600">
                            {calcolo.artista.cognome?.[0]}{calcolo.artista.nome?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {calcolo.artista.cognome} {calcolo.artista.nome}
                          </p>
                          <p className="text-sm text-gray-500">
                            {calcolo.numeroPresenze} presenze • 
                            Stipendio: {formatCurrency(Number(calcolo.stipendioFisso))}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right text-sm">
                          <p className="text-gray-500">Compensi Agibilità</p>
                          <p className="font-medium">{formatCurrency(Number(calcolo.totaleNettoAgibilita))}</p>
                        </div>
                        
                        <div className="text-right text-sm">
                          <p className="text-gray-500">Gettoni Agenzia</p>
                          <p className="font-medium text-green-600">
                            -{formatCurrency(Number(calcolo.totaleGettoniAgenzia))}
                          </p>
                        </div>
                        
                        <div className="text-right text-sm">
                          <p className="text-gray-500">Rimborsi</p>
                          <p className="font-medium">{formatCurrency(Number(calcolo.totaleRimborsiSpesa))}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Totale Busta</p>
                          <p className="font-semibold text-lg">{formatCurrency(Number(calcolo.totaleBustaPaga))}</p>
                        </div>
                        
                        <span className={`px-3 py-1 rounded-full text-sm ${STATI_BUSTA[calcolo.stato]?.color}`}>
                          {STATI_BUSTA[calcolo.stato]?.label}
                        </span>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => setModalDettaglio(calcolo)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title="Dettaglio"
                          >
                            <Eye size={18} />
                          </button>
                          
                          {calcolo.stato === 'DA_ELABORARE' && (
                            <button
                              onClick={() => inviaFullTimeConsulente(calcolo.id)}
                              disabled={saving}
                              className="px-3 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Invia Consulente
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Registra Fattura */}
      {modalFattura && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              📄 Registra Fattura Ricevuta
            </h2>
            <p className="text-gray-600 mb-4">
              Artista: <strong>{modalFattura.artista.cognome} {modalFattura.artista.nome}</strong>
              <br />
              Importo: <strong>{formatCurrency(Number(modalFattura.totaleNetto))}</strong>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero Fattura *
                </label>
                <input
                  type="text"
                  value={formFattura.numeroFattura}
                  onChange={(e) => setFormFattura({...formFattura, numeroFattura: e.target.value})}
                  placeholder="Es: FT-2024-001"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fattura *
                </label>
                <input
                  type="date"
                  value={formFattura.dataFattura}
                  onChange={(e) => setFormFattura({...formFattura, dataFattura: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carica Fattura PDF
                </label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center text-gray-500">
                  <Upload size={24} className="mx-auto mb-2" />
                  <p className="text-sm">Trascina o clicca per caricare PDF</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setModalFattura(null)
                  setFormFattura({ numeroFattura: '', dataFattura: '', pdfFile: null })
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={registraFattura}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Salvataggio...' : 'Registra'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dettaglio Full Time */}
      {modalDettaglio && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                📋 Dettaglio {modalDettaglio.artista.cognome} {modalDettaglio.artista.nome}
              </h2>
              <button onClick={() => setModalDettaglio(null)} className="p-2 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            {/* Riepilogo */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Stipendio Fisso</p>
                <p className="text-xl font-semibold">{formatCurrency(Number(modalDettaglio.stipendioFisso))}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Gettoni Agenzia</p>
                <p className="text-xl font-semibold text-green-600">
                  {formatCurrency(Number(modalDettaglio.totaleGettoniAgenzia))}
                </p>
              </div>
            </div>
            
            {/* Presenze */}
            {modalDettaglio.dettagliPresenze?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Presenze ({modalDettaglio.numeroPresenze})</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Data</th>
                      <th className="p-2 text-left">Locale</th>
                      <th className="p-2 text-right">Compenso</th>
                      <th className="p-2 text-right">Gettone</th>
                      <th className="p-2 text-right">Per Busta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalDettaglio.dettagliPresenze.map((d: any) => (
                      <tr key={d.id} className="border-t">
                        <td className="p-2">{new Date(d.dataAgibilita).toLocaleDateString('it-IT')}</td>
                        <td className="p-2">{d.localeNome}</td>
                        <td className="p-2 text-right">{formatCurrency(Number(d.compensoNetto))}</td>
                        <td className="p-2 text-right text-green-600">-{formatCurrency(Number(d.gettoneAgenzia))}</td>
                        <td className="p-2 text-right font-medium">{formatCurrency(Number(d.nettoPerBustaPaga))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Rimborsi */}
            {modalDettaglio.rimborsiSpesa?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Rimborsi Spesa</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Data</th>
                      <th className="p-2 text-left">Tipo</th>
                      <th className="p-2 text-left">Descrizione</th>
                      <th className="p-2 text-right">Importo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalDettaglio.rimborsiSpesa.map((r: any) => (
                      <tr key={r.id} className="border-t">
                        <td className="p-2">{new Date(r.data).toLocaleDateString('it-IT')}</td>
                        <td className="p-2">{r.tipo}</td>
                        <td className="p-2">{r.descrizione || '-'}</td>
                        <td className="p-2 text-right">{formatCurrency(Number(r.importo))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Totale */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">TOTALE BUSTA PAGA</span>
                <span className="text-2xl font-bold text-green-700">
                  {formatCurrency(Number(modalDettaglio.totaleBustaPaga))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
