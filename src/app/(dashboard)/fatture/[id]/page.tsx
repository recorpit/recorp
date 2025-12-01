// src/app/(dashboard)/fatture/[id]/page.tsx
// Pagina Dettaglio Fattura con Modifica Bozza, Nota di Credito, Download XML
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Download, Send, Check, X, Euro, Calendar, 
  Building2, FileText, Users, MapPin, AlertCircle,
  Clock, CreditCard, FileCode, Trash2, ChevronDown,
  Edit3, ReceiptText, Save
} from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface RigaFattura {
  numeroLinea: number
  descrizione: string
  quantita: number
  prezzoUnitario: number
  prezzoTotale: number
  aliquotaIva: number
}

interface Fattura {
  id: string
  numero: string
  anno: number
  progressivo: number
  dataEmissione: string
  dataScadenza: string
  dataPagamento: string | null
  imponibile: number
  iva: number
  totale: number
  aliquotaIva: number
  stato: string
  modalitaRighe: string
  descrizioneGenerica: string | null
  splitPayment: boolean
  causale: string
  righeFattura: RigaFattura[]
  progressivoInvio: string
  tipoPagamento: string
  note: string | null
  committente?: {
    id: string
    ragioneSociale: string
    partitaIva: string
    codiceFiscale: string
    codiceSDI: string
    isPubblicaAmministrazione: boolean
  }
  agibilita?: Array<{
    id: string
    codice: string
    data: string
    totaleCompensiLordi: number
    quotaAgenzia: number
    locale: { nome: string }
    artisti?: Array<{
      compensoLordo: number
      artista: {
        nome: string
        cognome: string
        nomeDarte: string | null
      }
    }>
  }>
  scadenzaPagamento: {
    nome: string
    giorni: number
  } | null
  noteDiCredito?: Array<{
    id: string
    numero: string
    totale: number
    stato: string
  }>
}

const STATI_COLORI: Record<string, { bg: string; text: string; label: string }> = {
  'BOZZA': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Bozza' },
  'EMESSA': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Emessa' },
  'ESPORTATA': { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Esportata' },
  'INVIATA': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Inviata' },
  'PAGATA': { bg: 'bg-green-100', text: 'text-green-700', label: 'Pagata' },
  'ANNULLATA': { bg: 'bg-red-100', text: 'text-red-700', label: 'Annullata' },
}

const TIPI_PAGAMENTO: Record<string, string> = {
  'BONIFICO_VISTA': 'Bonifico vista fattura',
  'BONIFICO_30GG': 'Bonifico 30 gg F.M.',
  'CARTA_CREDITO': 'Carta di credito',
  'CONTANTI': 'Contanti',
  'RIBA_30GG': 'RIBA 30 gg F.M.',
}

export default function DettaglioFatturaPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [fattura, setFattura] = useState<Fattura | null>(null)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAnnullaConfirm, setShowAnnullaConfirm] = useState(false)
  const [showXmlDropdown, setShowXmlDropdown] = useState(false)
  const xmlDropdownRef = useRef<HTMLDivElement>(null)
  
  // Modifica bozza
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({
    causale: '',
    note: '',
    tipoPagamento: 'BONIFICO_30GG',
    dataScadenza: '',
    modalitaRighe: 'DETTAGLIO_SPESE_INCLUSE',
    numero: '',
    descrizioneGenerica: '',
  })
  const [editRighe, setEditRighe] = useState<RigaFattura[]>([])
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    async function loadFattura() {
      try {
        const res = await fetch(`/api/fatture/${id}`)
        if (!res.ok) throw new Error('Fattura non trovata')
        const data = await res.json()
        setFattura(data)
        
        // Pre-popola dati modifica
        setEditData({
          causale: data.causale || '',
          note: data.note || '',
          tipoPagamento: data.tipoPagamento || 'BONIFICO_30GG',
          dataScadenza: data.dataScadenza ? data.dataScadenza.split('T')[0] : '',
          modalitaRighe: data.modalitaRighe || 'DETTAGLIO_SPESE_INCLUSE',
          numero: data.numero || '',
          descrizioneGenerica: data.descrizioneGenerica || '',
        })
        setEditRighe(data.righeFattura || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadFattura()
  }, [id])
  
  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (xmlDropdownRef.current && !xmlDropdownRef.current.contains(event.target as Node)) {
        setShowXmlDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Scarica XML
  const handleDownloadXML = async (formato: 'fatturapa' | 'easyfatt') => {
    try {
      setActionLoading('xml')
      setShowXmlDropdown(false)
      
      const endpoint = formato === 'fatturapa' 
        ? `/api/fatture/${id}/xml`
        : `/api/fatture/${id}/easyfatt`
      
      const res = await fetch(endpoint)
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore generazione XML')
      }
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `fattura_${fattura?.numero}.xml`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading('')
    }
  }
  
  // Salva modifiche bozza
  const handleSaveBozza = async () => {
    if (!fattura) return
    
    try {
      setSaving(true)
      
      // Ricalcola totali
      const imponibile = editRighe.reduce((sum, r) => sum + r.prezzoTotale, 0)
      const iva = imponibile * (fattura.aliquotaIva / 100)
      const totale = fattura.splitPayment ? imponibile : imponibile + iva
      
      const res = await fetch(`/api/fatture/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          causale: editData.causale,
          note: editData.note,
          tipoPagamento: editData.tipoPagamento,
          dataScadenza: editData.dataScadenza ? new Date(editData.dataScadenza).toISOString() : null,
          modalitaRighe: editData.modalitaRighe,
          numero: editData.numero,
          descrizioneGenerica: editData.descrizioneGenerica,
          righeFattura: editRighe,
          imponibile,
          iva,
          totale,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore salvataggio')
      }
      
      // Ricarica
      const resFattura = await fetch(`/api/fatture/${id}`)
      if (resFattura.ok) {
        const data = await resFattura.json()
        setFattura(data)
        setEditRighe(data.righeFattura || [])
      }
      
      setEditMode(false)
      
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  // Modifica riga
  const updateRiga = (index: number, field: keyof RigaFattura, value: any) => {
    setEditRighe(prev => {
      const newRighe = [...prev]
      newRighe[index] = { ...newRighe[index], [field]: value }
      
      // Ricalcola prezzo totale se cambia quantità o prezzo unitario
      if (field === 'quantita' || field === 'prezzoUnitario') {
        newRighe[index].prezzoTotale = newRighe[index].quantita * newRighe[index].prezzoUnitario
      }
      
      return newRighe
    })
  }
  
  // Aggiungi riga
  const addRiga = () => {
    setEditRighe(prev => [...prev, {
      numeroLinea: prev.length + 1,
      descrizione: '',
      quantita: 1,
      prezzoUnitario: 0,
      prezzoTotale: 0,
      aliquotaIva: fattura?.aliquotaIva || 22,
    }])
  }
  
  // Rimuovi riga
  const removeRiga = (index: number) => {
    setEditRighe(prev => prev.filter((_, i) => i !== index).map((r, i) => ({ ...r, numeroLinea: i + 1 })))
  }
  
  // Rigenera righe in base alla modalità
  const rigeneraRighe = (modalita: string) => {
    if (!fattura?.agibilita || fattura.agibilita.length === 0) {
      alert('Nessuna agibilità collegata per rigenerare le righe')
      return
    }
    
    const aliquotaIva = fattura.aliquotaIva || 22
    const nuoveRighe: RigaFattura[] = []
    let numeroLinea = 1
    
    if (modalita === 'VOCE_UNICA') {
      // Una sola riga con totale complessivo
      let totale = 0
      fattura.agibilita.forEach(agi => {
        const quotaPerArtista = Number(agi.quotaAgenzia) || 0
        agi.artisti?.forEach(art => {
          totale += Number(art.compensoLordo) + quotaPerArtista
        })
      })
      
      nuoveRighe.push({
        numeroLinea: 1,
        descrizione: editData.descrizioneGenerica || 'Servizi di produzione artistica',
        quantita: 1,
        prezzoUnitario: totale,
        prezzoTotale: totale,
        aliquotaIva,
      })
      
    } else if (modalita === 'DETTAGLIO_SPESE_INCLUSE') {
      // Una riga per artista con spese incluse
      fattura.agibilita.forEach(agi => {
        const quotaPerArtista = Number(agi.quotaAgenzia) || 0
        agi.artisti?.forEach(art => {
          const nome = art.artista.nomeDarte || `${art.artista.nome} ${art.artista.cognome}`
          const importo = Number(art.compensoLordo) + quotaPerArtista
          
          nuoveRighe.push({
            numeroLinea,
            descrizione: `${nome} - Compenso e gestione`,
            quantita: 1,
            prezzoUnitario: importo,
            prezzoTotale: importo,
            aliquotaIva,
          })
          numeroLinea++
        })
      })
      
    } else if (modalita === 'DETTAGLIO_SPESE_SEPARATE') {
      // Righe per compensi + riga spese
      let totaleSpese = 0
      let numArtisti = 0
      
      fattura.agibilita.forEach(agi => {
        const quotaPerArtista = Number(agi.quotaAgenzia) || 0
        agi.artisti?.forEach(art => {
          const nome = art.artista.nomeDarte || `${art.artista.nome} ${art.artista.cognome}`
          const compenso = Number(art.compensoLordo)
          
          nuoveRighe.push({
            numeroLinea,
            descrizione: `${nome} - Compenso lordo`,
            quantita: 1,
            prezzoUnitario: compenso,
            prezzoTotale: compenso,
            aliquotaIva,
          })
          
          totaleSpese += quotaPerArtista
          numArtisti++
          numeroLinea++
        })
      })
      
      // Riga spese gestione
      if (totaleSpese > 0) {
        const quotaMedia = totaleSpese / numArtisti
        nuoveRighe.push({
          numeroLinea,
          descrizione: `Spese di gestione`,
          quantita: numArtisti,
          prezzoUnitario: quotaMedia,
          prezzoTotale: totaleSpese,
          aliquotaIva,
        })
      }
    }
    
    setEditRighe(nuoveRighe)
  }
  
  // Handler cambio modalità righe
  const handleModalitaChange = (nuovaModalita: string) => {
    setEditData({ ...editData, modalitaRighe: nuovaModalita })
    rigeneraRighe(nuovaModalita)
  }
  
  // Cambia stato
  const handleCambiaStato = async (nuovoStato: string) => {
    try {
      setActionLoading(nuovoStato)
      
      const res = await fetch(`/api/fatture/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato: nuovoStato }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore aggiornamento')
      }
      
      const resFattura = await fetch(`/api/fatture/${id}`)
      if (resFattura.ok) {
        setFattura(await resFattura.json())
      }
      
      setShowAnnullaConfirm(false)
      
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading('')
    }
  }
  
  // Elimina fattura
  const handleDelete = async () => {
    try {
      setActionLoading('delete')
      
      const res = await fetch(`/api/fatture/${id}`, { method: 'DELETE' })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore eliminazione')
      }
      
      router.push('/fatture')
      
    } catch (err: any) {
      alert(err.message)
      setShowDeleteConfirm(false)
    } finally {
      setActionLoading('')
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (error || !fattura) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="mb-4 text-red-500" size={48} />
        <p className="text-gray-600 mb-4">{error || 'Fattura non trovata'}</p>
        <Link href="/fatture" className="text-blue-600 hover:text-blue-700">
          Torna alla lista
        </Link>
      </div>
    )
  }
  
  const statoInfo = STATI_COLORI[fattura.stato] || STATI_COLORI['BOZZA']
  const agibilitaCollegate = fattura.agibilita || []
  const noteDiCredito = fattura.noteDiCredito || []
  const isBozza = fattura.stato === 'BOZZA'
  const isEmessa = ['EMESSA', 'ESPORTATA', 'INVIATA', 'PAGATA'].includes(fattura.stato)
  
  // Calcolo totali in modifica
  const editImponibile = editRighe.reduce((sum, r) => sum + r.prezzoTotale, 0)
  const editIva = editImponibile * (fattura.aliquotaIva / 100)
  const editTotale = fattura.splitPayment ? editImponibile : editImponibile + editIva
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/fatture" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Fattura {fattura.numero}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statoInfo.bg} ${statoInfo.text}`}>
                {statoInfo.label}
              </span>
            </div>
            <p className="text-gray-500">
              Emessa il {format(new Date(fattura.dataEmissione), 'd MMMM yyyy', { locale: it })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bottoni per BOZZA */}
          {isBozza && (
            <>
              {editMode ? (
                <>
                  <button
                    onClick={() => {
                      setEditMode(false)
                      setEditRighe(fattura.righeFattura || [])
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleSaveBozza}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Save size={18} />
                    )}
                    Salva Modifiche
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Edit3 size={18} />
                    Modifica
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                    Elimina
                  </button>
                  <button
                    onClick={() => handleCambiaStato('EMESSA')}
                    disabled={actionLoading === 'EMESSA'}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading === 'EMESSA' ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Check size={18} />
                    )}
                    Emetti Fattura
                  </button>
                </>
              )}
            </>
          )}
          
          {/* Bottoni per fatture EMESSE */}
          {isEmessa && (
            <>
              {/* Dropdown XML */}
              <div className="relative" ref={xmlDropdownRef}>
                <button
                  onClick={() => setShowXmlDropdown(!showXmlDropdown)}
                  disabled={actionLoading === 'xml'}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {actionLoading === 'xml' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                  ) : (
                    <Download size={18} />
                  )}
                  Scarica XML
                  <ChevronDown size={16} />
                </button>
                
                {showXmlDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => handleDownloadXML('fatturapa')}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                    >
                      <FileCode size={18} className="text-blue-600" />
                      <div>
                        <p className="font-medium">FatturaPA (SDI)</p>
                        <p className="text-xs text-gray-500">Formato ufficiale per AdE</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDownloadXML('easyfatt')}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-t"
                    >
                      <FileText size={18} className="text-green-600" />
                      <div>
                        <p className="font-medium">Easyfatt (Danea)</p>
                        <p className="text-xs text-gray-500">Per importazione in Danea</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              
              {(fattura.stato === 'EMESSA' || fattura.stato === 'ESPORTATA') && (
                <button
                  onClick={() => handleCambiaStato('INVIATA')}
                  disabled={actionLoading === 'INVIATA'}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Send size={18} />
                  Segna Inviata
                </button>
              )}
              
              {fattura.stato !== 'PAGATA' && (
                <button
                  onClick={() => handleCambiaStato('PAGATA')}
                  disabled={actionLoading === 'PAGATA'}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Check size={18} />
                  Segna Pagata
                </button>
              )}
              
              {/* Annulla - solo per EMESSA e ESPORTATA, propone Nota di Credito */}
              {(fattura.stato === 'EMESSA' || fattura.stato === 'ESPORTATA') && (
                <button
                  onClick={() => setShowAnnullaConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <X size={18} />
                  Annulla
                </button>
              )}
            </>
          )}
          
          {/* Bottone Elimina per fatture ANNULLATE */}
          {fattura.stato === 'ANNULLATA' && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 size={18} />
              Elimina Definitivamente
            </button>
          )}
        </div>
      </div>
      
      {/* Contenuto */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonna principale */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dati Committente */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="text-gray-400" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Committente</h2>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                {fattura.committente?.ragioneSociale?.charAt(0) || '?'}
              </div>
              <div>
                <Link 
                  href={`/committenti/${fattura.committente?.id}`}
                  className="text-lg font-medium text-blue-600 hover:text-blue-700"
                >
                  {fattura.committente?.ragioneSociale || 'N/D'}
                </Link>
                <p className="text-gray-500">P.IVA: {fattura.committente?.partitaIva || 'N/D'}</p>
                <p className="text-gray-500">SDI: {fattura.committente?.codiceSDI || 'N/D'}</p>
                {fattura.committente?.isPubblicaAmministrazione && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                    Pubblica Amministrazione
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Righe Fattura */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Dettaglio Righe</h2>
              {editMode && (
                <button
                  onClick={addRiga}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Aggiungi Riga
                </button>
              )}
            </div>
            
            {editMode ? (
              <div className="space-y-4">
                {editRighe.map((riga, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-4">
                      <span className="text-gray-400 font-medium">{index + 1}.</span>
                      <div className="flex-1 space-y-3">
                        <textarea
                          value={riga.descrizione}
                          onChange={(e) => updateRiga(index, 'descrizione', e.target.value)}
                          placeholder="Descrizione..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Quantità</label>
                            <input
                              type="number"
                              value={riga.quantita}
                              onChange={(e) => updateRiga(index, 'quantita', parseFloat(e.target.value) || 0)}
                              min="1"
                              step="1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Prezzo Unitario</label>
                            <input
                              type="number"
                              value={riga.prezzoUnitario}
                              onChange={(e) => updateRiga(index, 'prezzoUnitario', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Totale Riga</label>
                            <input
                              type="text"
                              value={`€${riga.prezzoTotale.toFixed(2)}`}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeRiga(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Totale modifica */}
                <div className="pt-4 border-t flex justify-end">
                  <div className="text-right">
                    <p className="text-gray-500">Nuovo Imponibile: <span className="font-medium">€{editImponibile.toFixed(2)}</span></p>
                    <p className="text-gray-500">IVA {fattura.aliquotaIva}%: <span className="font-medium">€{editIva.toFixed(2)}</span></p>
                    <p className="text-xl font-bold text-blue-600 mt-2">Totale: €{editTotale.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 text-sm font-medium text-gray-500">#</th>
                      <th className="pb-3 text-sm font-medium text-gray-500">Descrizione</th>
                      <th className="pb-3 text-sm font-medium text-gray-500 text-right">Importo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fattura.righeFattura.map((riga) => (
                      <tr key={riga.numeroLinea} className="border-b last:border-0">
                        <td className="py-3 text-gray-500">{riga.numeroLinea}</td>
                        <td className="py-3">{riga.descrizione}</td>
                        <td className="py-3 text-right font-medium">
                          €{Number(riga.prezzoTotale).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Campi modificabili in bozza */}
          {editMode && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Dettagli Fattura</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numero Fattura</label>
                  <input
                    type="text"
                    value={editData.numero}
                    onChange={(e) => setEditData({ ...editData, numero: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Es: 1/2025"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Pagamento</label>
                  <select
                    value={editData.tipoPagamento}
                    onChange={(e) => setEditData({ ...editData, tipoPagamento: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {Object.entries(TIPI_PAGAMENTO).map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Scadenza</label>
                  <input
                    type="date"
                    value={editData.dataScadenza}
                    onChange={(e) => setEditData({ ...editData, dataScadenza: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modalità Righe</label>
                  <select
                    value={editData.modalitaRighe}
                    onChange={(e) => handleModalitaChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="DETTAGLIO_SPESE_INCLUSE">Dettaglio con spese incluse</option>
                    <option value="DETTAGLIO_SPESE_SEPARATE">Dettaglio + spese separate</option>
                    <option value="VOCE_UNICA">Voce unica generica</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Cambiando modalità le righe verranno rigenerate automaticamente</p>
                </div>
              </div>
              
              {editData.modalitaRighe === 'VOCE_UNICA' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione Generica</label>
                  <input
                    type="text"
                    value={editData.descrizioneGenerica}
                    onChange={(e) => setEditData({ ...editData, descrizioneGenerica: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Es: Prestazioni artistiche mese di Novembre 2024"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Causale</label>
                <input
                  type="text"
                  value={editData.causale}
                  onChange={(e) => setEditData({ ...editData, causale: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Causale fattura..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  value={editData.note}
                  onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Note interne..."
                />
              </div>
            </div>
          )}
          
          {/* Agibilità Collegate */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Agibilità Collegate ({agibilitaCollegate.length})
            </h2>
            
            {agibilitaCollegate.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>Nessuna agibilità collegata</p>
              </div>
            ) : (
              <div className="space-y-3">
                {agibilitaCollegate.map(agi => (
                  <Link
                    key={agi.id}
                    href={`/agibilita/${agi.id}`}
                    className="block p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-blue-600">{agi.codice}</span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(agi.data), 'EEEE d MMMM yyyy', { locale: it })}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {agi.locale.nome}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {agi.artisti?.length || 0} artisti
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Colonna laterale */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Totali */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Totali</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Imponibile:</span>
                <span className="font-medium">€{Number(fattura.imponibile).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IVA {fattura.aliquotaIva}%:</span>
                <span className="font-medium">€{Number(fattura.iva).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-3 border-t">
                <span>Totale:</span>
                <span className="text-blue-600">€{Number(fattura.totale).toFixed(2)}</span>
              </div>
              
              {fattura.splitPayment && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Split Payment</strong>
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Il committente pagherà €{Number(fattura.imponibile).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Info Fatturazione */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Info Fatturazione</h2>
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Modalità righe</p>
                <p className="font-medium">
                  {fattura.modalitaRighe === 'VOCE_UNICA' && 'Voce unica generica'}
                  {fattura.modalitaRighe === 'DETTAGLIO_SPESE_INCLUSE' && 'Dettaglio con spese incluse'}
                  {fattura.modalitaRighe === 'DETTAGLIO_SPESE_SEPARATE' && 'Dettaglio + spese separate'}
                </p>
              </div>
              
              <div>
                <p className="text-gray-500">Tipo pagamento</p>
                <p className="font-medium">{TIPI_PAGAMENTO[fattura.tipoPagamento] || fattura.tipoPagamento}</p>
              </div>
              
              {fattura.scadenzaPagamento && (
                <div>
                  <p className="text-gray-500">Termini pagamento</p>
                  <p className="font-medium">{fattura.scadenzaPagamento.nome}</p>
                </div>
              )}
              
              <div>
                <p className="text-gray-500">Data scadenza</p>
                <p className="font-medium">
                  {fattura.dataScadenza 
                    ? format(new Date(fattura.dataScadenza), 'd MMMM yyyy', { locale: it })
                    : 'Non specificata'
                  }
                </p>
              </div>
              
              {fattura.causale && (
                <div>
                  <p className="text-gray-500">Causale</p>
                  <p className="font-medium">{fattura.causale}</p>
                </div>
              )}
              
              {fattura.note && (
                <div>
                  <p className="text-gray-500">Note</p>
                  <p className="font-medium">{fattura.note}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Note di Credito */}
          {noteDiCredito.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Note di Credito</h2>
              
              <div className="space-y-2">
                {noteDiCredito.map(nc => (
                  <Link
                    key={nc.id}
                    href={`/note-credito/${nc.id}`}
                    className="block p-3 border rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{nc.numero}</span>
                      <span className="text-red-600">-€{Number(nc.totale).toFixed(2)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal Elimina (per BOZZA e ANNULLATA) */}
      {showDeleteConfirm && (isBozza || fattura.stato === 'ANNULLATA') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isBozza ? 'Eliminare la bozza?' : 'Eliminare la fattura annullata?'}
            </h3>
            <p className="text-gray-600 mb-4">
              {isBozza 
                ? `La bozza n. ${fattura.numero} sarà eliminata definitivamente. Le agibilità collegate torneranno "Da fatturare".`
                : `La fattura annullata n. ${fattura.numero} sarà eliminata definitivamente dall'archivio.`
              }
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === 'delete' ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Annulla (per fatture EMESSE - propone Nota di Credito) */}
      {showAnnullaConfirm && isEmessa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertCircle className="text-yellow-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Come vuoi procedere?
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              La fattura n. {fattura.numero} è già stata emessa. Scegli come procedere:
            </p>
            
            <div className="space-y-3 mb-6">
              {/* Opzione Nota di Credito */}
              <Link
                href={`/note-credito/nuova?fatturaId=${fattura.id}`}
                className="flex items-start gap-4 p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ReceiptText className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Crea Nota di Credito</p>
                  <p className="text-sm text-gray-500">
                    Per storno parziale o totale. Consigliato se la fattura è già stata inviata al SDI.
                  </p>
                </div>
              </Link>
              
              {/* Opzione Annulla */}
              <button
                onClick={() => handleCambiaStato('ANNULLATA')}
                disabled={actionLoading === 'ANNULLATA'}
                className="w-full flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all text-left"
              >
                <div className="p-2 bg-red-100 rounded-lg">
                  <X className="text-red-600" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Annulla Fattura</p>
                  <p className="text-sm text-gray-500">
                    Segna la fattura come annullata. Le agibilità torneranno &quot;Da fatturare&quot;.
                  </p>
                </div>
              </button>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowAnnullaConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
