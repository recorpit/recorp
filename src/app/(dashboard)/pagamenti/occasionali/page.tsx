// src/app/(dashboard)/pagamenti/occasionali/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  AlertTriangle, Calendar, CheckCircle, Clock, 
  Users, Euro, Bell, Search, Download, Copy, Mail,
  ChevronDown, ChevronUp, RefreshCw, Zap, FileText,
  ExternalLink, Send, Eye
} from 'lucide-react'

const STATI_PRESTAZIONE: Record<string, { label: string; color: string }> = {
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

export default function PrestazioniOccasionaliPage() {
  const [loading, setLoading] = useState(true)
  const [batchPending, setBatchPending] = useState<any>(null)
  const [prestazioni, setPrestazioni] = useState<any[]>([])
  const [totali, setTotali] = useState<any>({})
  const [generandoBatch, setGenerandoBatch] = useState(false)
  const [showForzaModal, setShowForzaModal] = useState(false)
  
  const [vistaAttiva, setVistaAttiva] = useState<'attesa_firma' | 'pagabili' | 'pagate'>('attesa_firma')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Per selezione distinta
  const [selezionati, setSelezionati] = useState<string[]>([])
  const [generandoDistinta, setGenerandoDistinta] = useState(false)
  
  // Per invio email
  const [inviandoEmail, setInviandoEmail] = useState<string | null>(null)
  const [inviandoTutte, setInviandoTutte] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const resBatch = await fetch('/api/pagamenti/batch?checkPending=true')
      const dataBatch = await resBatch.json()
      setBatchPending(dataBatch)
      
      const resPrest = await fetch('/api/pagamenti/prestazioni')
      const dataPrest = await resPrest.json()
      setPrestazioni(dataPrest.prestazioni || [])
      setTotali(dataPrest.totali || {})
      
    } catch (error) {
      console.error('Errore caricamento:', error)
    } finally {
      setLoading(false)
    }
  }

  async function generaBatch(forza: boolean = false) {
    setGenerandoBatch(true)
    try {
      const res = await fetch('/api/pagamenti/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forza })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        const emailInfo = data.email 
          ? `\n\n📧 Email inviate: ${data.email.inviate}\n❌ Email fallite: ${data.email.fallite}`
          : ''
        alert(`✅ Batch generato! ${data.prestazioniGenerate} prestazioni create.${emailInfo}`)
        loadData()
        setShowForzaModal(false)
        setVistaAttiva('attesa_firma')
      } else {
        alert(`Errore: ${data.error}`)
      }
    } catch (error) {
      alert('Errore nella generazione')
    } finally {
      setGenerandoBatch(false)
    }
  }

  async function generaDistinta() {
    if (selezionati.length === 0) {
      alert('Seleziona almeno una prestazione')
      return
    }
    
    if (!confirm(`Generare distinta per ${selezionati.length} prestazioni?\n\nLe prestazioni verranno segnate come PAGATE.`)) {
      return
    }
    
    setGenerandoDistinta(true)
    try {
      const res = await fetch('/api/pagamenti/distinta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prestazioniIds: selezionati })
      })
      
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `distinta_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        setSelezionati([])
        loadData()
        alert('✅ Distinta generata e prestazioni segnate come PAGATE!')
      } else {
        const data = await res.json()
        alert(`Errore: ${data.error}`)
      }
    } catch (error) {
      alert('Errore generazione distinta')
    } finally {
      setGenerandoDistinta(false)
    }
  }

  function copiaLink(token: string, prestazioneId: string) {
    const link = `${window.location.origin}/firma/${token}`
    navigator.clipboard.writeText(link)
    setCopiedLink(prestazioneId)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  async function inviaEmail(prestazione: any, tipo: 'firma' | 'sollecito' = 'firma') {
    setInviandoEmail(prestazione.id)
    try {
      const res = await fetch('/api/pagamenti/invia-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prestazioneId: prestazione.id, tipo })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        alert(`✅ Email inviata a ${prestazione.artista.email}`)
        loadData()
      } else {
        alert(`Errore: ${data.error}`)
      }
    } catch (error) {
      alert('Errore invio email')
    } finally {
      setInviandoEmail(null)
    }
  }

  async function inviaTutteEmail() {
    const daInviare = inAttesaFirma.filter(p => !p.dataInvioLink && p.artista?.email)
    
    if (daInviare.length === 0) {
      alert('Nessuna email da inviare')
      return
    }
    
    if (!confirm(`Inviare ${daInviare.length} email?`)) {
      return
    }
    
    setInviandoTutte(true)
    try {
      const res = await fetch('/api/pagamenti/invia-email', {
        method: 'PUT',
      })
      
      const data = await res.json()
      
      if (res.ok) {
        alert(`✅ ${data.message}\n\n${data.dettagli?.join('\n') || ''}`)
        loadData()
      } else {
        alert(`Errore: ${data.error}`)
      }
    } catch (error) {
      alert('Errore invio email')
    } finally {
      setInviandoTutte(false)
    }
  }

  // Filtra prestazioni
  const inAttesaFirma = prestazioni.filter(p => p.stato === 'GENERATA' || p.stato === 'SOLLECITATA')
  const pagabili = prestazioni.filter(p => p.stato === 'PAGABILE')
  const pagate = prestazioni.filter(p => p.stato === 'PAGATA')

  const prestazioniFiltrate = vistaAttiva === 'attesa_firma' 
    ? inAttesaFirma 
    : vistaAttiva === 'pagabili' 
      ? pagabili 
      : pagate

  const prestazioniVisualizzate = prestazioniFiltrate.filter(p => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    const nome = `${p.artista?.cognome} ${p.artista?.nome}`.toLowerCase()
    const codice = p.codice?.toLowerCase() || ''
    return nome.includes(search) || codice.includes(search)
  })

  // Calcola totali
  const totalePagabili = pagabili.reduce((sum, p) => sum + parseFloat(p.totalePagato || 0), 0)
  const emailDaInviare = inAttesaFirma.filter(p => !p.dataInvioLink).length

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
          <h1 className="text-2xl font-bold text-gray-900">Prestazioni Occasionali</h1>
          <p className="text-gray-500">Gestione ricevute e pagamenti</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForzaModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Zap size={18} />
            Genera Ricevute
          </button>
          <button
            onClick={loadData}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Modal Forza Generazione */}
      {showForzaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">⚡ Genera Ricevute</h2>
            <p className="text-gray-600 mb-4">
              Genera le ricevute per tutte le agibilità completate degli artisti in prestazione occasionale.
            </p>
            <p className="text-sm text-orange-600 mb-6">
              ⚡ Le email con i link firma verranno inviate automaticamente agli artisti.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowForzaModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={() => generaBatch(true)}
                disabled={generandoBatch}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {generandoBatch ? 'Generazione...' : 'Genera Ora'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Vista */}
      <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex gap-2">
        <button
          onClick={() => setVistaAttiva('attesa_firma')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            vistaAttiva === 'attesa_firma' 
              ? 'bg-yellow-500 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Mail size={18} />
          In Attesa Firma
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            vistaAttiva === 'attesa_firma' ? 'bg-yellow-400' : 'bg-gray-200'
          }`}>
            {inAttesaFirma.length}
          </span>
        </button>
        
        <button
          onClick={() => setVistaAttiva('pagabili')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            vistaAttiva === 'pagabili' 
              ? 'bg-green-500 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Euro size={18} />
          Da Pagare
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            vistaAttiva === 'pagabili' ? 'bg-green-400' : 'bg-gray-200'
          }`}>
            {pagabili.length}
          </span>
        </button>
        
        <button
          onClick={() => setVistaAttiva('pagate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            vistaAttiva === 'pagate' 
              ? 'bg-emerald-500 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <CheckCircle size={18} />
          Pagate
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            vistaAttiva === 'pagate' ? 'bg-emerald-400' : 'bg-gray-200'
          }`}>
            {pagate.length}
          </span>
        </button>
      </div>

      {/* Barra azioni per vista attesa firma */}
      {vistaAttiva === 'attesa_firma' && inAttesaFirma.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-yellow-800">
                {emailDaInviare > 0 
                  ? `${emailDaInviare} email da inviare` 
                  : 'Tutte le email sono state inviate'}
              </p>
              <p className="text-sm text-yellow-600">
                Gli artisti devono firmare per sbloccare il pagamento
              </p>
            </div>
            {emailDaInviare > 0 && (
              <button
                onClick={inviaTutteEmail}
                disabled={inviandoTutte}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
              >
                <Send size={18} />
                {inviandoTutte ? 'Invio in corso...' : `Invia Tutte (${emailDaInviare})`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Barra azioni per vista pagabili */}
      {vistaAttiva === 'pagabili' && pagabili.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selezionati.length === pagabili.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelezionati(pagabili.map(p => p.id))
                    } else {
                      setSelezionati([])
                    }
                  }}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-sm text-green-700">
                  Seleziona tutti ({pagabili.length})
                </span>
              </label>
              {selezionati.length > 0 && (
                <span className="text-sm font-medium text-green-800">
                  {selezionati.length} selezionati - €{pagabili.filter(p => selezionati.includes(p.id)).reduce((sum, p) => sum + parseFloat(p.totalePagato || 0), 0).toFixed(2)}
                </span>
              )}
            </div>
            <button
              onClick={generaDistinta}
              disabled={selezionati.length === 0 || generandoDistinta}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              {generandoDistinta ? 'Generazione...' : 'Genera CSV e Segna Pagati'}
            </button>
          </div>
        </div>
      )}

      {/* Ricerca */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca artista o codice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Lista Prestazioni */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={20} />
            {vistaAttiva === 'attesa_firma' && 'Prestazioni in Attesa Firma'}
            {vistaAttiva === 'pagabili' && 'Prestazioni da Pagare'}
            {vistaAttiva === 'pagate' && 'Prestazioni Pagate'}
            <span className="text-sm font-normal text-gray-500">
              ({prestazioniVisualizzate.length})
            </span>
          </h2>
        </div>
        
        {prestazioniVisualizzate.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {vistaAttiva === 'attesa_firma' && 'Nessuna prestazione in attesa di firma'}
            {vistaAttiva === 'pagabili' && 'Nessuna prestazione da pagare'}
            {vistaAttiva === 'pagate' && 'Nessuna prestazione pagata'}
          </div>
        ) : (
          <div className="divide-y">
            {prestazioniVisualizzate.map((p) => (
              <div key={p.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  {/* Checkbox per pagabili */}
                  {vistaAttiva === 'pagabili' && (
                    <input
                      type="checkbox"
                      checked={selezionati.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelezionati([...selezionati, p.id])
                        } else {
                          setSelezionati(selezionati.filter(id => id !== p.id))
                        }
                      }}
                      className="w-5 h-5 rounded border-gray-300 mr-4"
                    />
                  )}
                  
                  {/* Info artista */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-blue-600">
                        {p.artista?.cognome?.[0]}{p.artista?.nome?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {p.artista?.cognome} {p.artista?.nome}
                      </p>
                      <p className="text-sm text-gray-500">
                        {p.codice} • {p.dataEmissione && new Date(p.dataEmissione).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Stato e importo */}
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      STATI_PRESTAZIONE[p.stato]?.color || 'bg-gray-100'
                    }`}>
                      {STATI_PRESTAZIONE[p.stato]?.label || p.stato}
                    </span>
                    
                    <div className="text-right w-24">
                      <p className="font-semibold text-gray-900">
                        €{parseFloat(p.totalePagato || 0).toFixed(2)}
                      </p>
                    </div>
                    
                    {/* Azioni per attesa firma */}
                    {vistaAttiva === 'attesa_firma' && (
                      <div className="flex items-center gap-2">
                        {/* Stato email */}
                        {p.dataInvioLink ? (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle size={14} />
                            Inviata
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Non inviata
                          </span>
                        )}
                        
                        {/* Copia link */}
                        <button
                          onClick={() => copiaLink(p.tokenFirma, p.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                          title="Copia link"
                        >
                          {copiedLink === p.id ? (
                            <CheckCircle size={18} className="text-green-500" />
                          ) : (
                            <Copy size={18} />
                          )}
                        </button>
                        
                        {/* Apri link */}
                        <a
                          href={`/firma/${p.tokenFirma}`}
                          target="_blank"
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                          title="Apri pagina firma"
                        >
                          <ExternalLink size={18} />
                        </a>
                        
                        {/* Invia email */}
                        <button
                          onClick={() => inviaEmail(p, p.stato === 'SOLLECITATA' ? 'sollecito' : 'firma')}
                          disabled={inviandoEmail === p.id || !p.artista?.email}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 text-sm"
                          title={p.artista?.email || 'Email mancante'}
                        >
                          {inviandoEmail === p.id ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <Mail size={14} />
                          )}
                          {p.stato === 'SOLLECITATA' ? 'Sollecita' : 'Invia'}
                        </button>
                      </div>
                    )}
                    
                    {/* Info per pagate */}
                    {vistaAttiva === 'pagate' && p.dataPagamento && (
                      <span className="text-sm text-gray-500">
                        Pagata il {new Date(p.dataPagamento).toLocaleDateString('it-IT')}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Email artista (se mancante) */}
                {vistaAttiva === 'attesa_firma' && !p.artista?.email && (
                  <p className="mt-2 text-sm text-red-500 ml-14">
                    ⚠️ Email artista mancante - usa il link manuale
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Riepilogo pagabili */}
      {vistaAttiva === 'pagabili' && pagabili.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Totale da pagare:</span>
            <span className="text-2xl font-bold text-green-600">
              €{totalePagabili.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
