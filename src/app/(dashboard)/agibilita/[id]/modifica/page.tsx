// src/app/(dashboard)/agibilita/[id]/modifica/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, X, AlertTriangle, Calendar, MapPin, Users, Euro, Plus, Calculator } from 'lucide-react'
import AutocompleteArtista from '@/components/AutocompleteArtista'
import { calcolaCompensi } from '@/lib/constants'
import Modal from '@/components/Modal'

// Genera ID unico
const generateId = () => Math.random().toString(36).substring(2, 9)

// Formatta data per input
const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

// Calcola giorno dopo
const getGiornoDopo = (data: string): string => {
  const d = new Date(data)
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

// Lista qualifiche disponibili (valori allineati al database)
const QUALIFICHE = [
  { value: 'DJ', label: 'DJ' },
  { value: 'Vocalist', label: 'Vocalist' },
  { value: 'Corista', label: 'Corista' },
  { value: 'Musicista', label: 'Musicista' },
  { value: 'Ballerino', label: 'Ballerino/a' },
  { value: 'Lucista', label: 'Lucista' },
  { value: 'Fotografo', label: 'Fotografo' },
  { value: 'Truccatore', label: 'Truccatore' },
  { value: 'Altro', label: 'Altro (da specificare)' },
]

// Tipi contratto
const TIPI_CONTRATTO = [
  { value: 'OCCASIONALE', label: 'Prestazione Occasionale' },
  { value: 'COCOCO', label: 'Co.Co.Co.' },
  { value: 'PARTITA_IVA', label: 'Partita IVA' },
  { value: 'DIPENDENTE', label: 'Dipendente' },
]

// Controlla se qualifica è valida (non è ALTRO/Altro/altro o vuota)
function isQualificaValida(qualifica: string | null | undefined): boolean {
  if (!qualifica) return false
  const q = qualifica.trim().toUpperCase()
  return q !== 'ALTRO' && q !== ''
}

interface ArtistaInPeriodo {
  id: string
  nome: string
  cognome: string
  nomeDarte?: string
  codiceFiscale?: string
  qualifica?: string
  compensoNetto: string
  tipoContratto?: string
  partitaIva?: string
  cachetBase?: number
}

interface Periodo {
  id: string
  dataInizio: string
  dataFine: string
  artisti: ArtistaInPeriodo[]
}

export default function ModificaAgibilitaPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [agibilita, setAgibilita] = useState<any>(null)
  
  const [form, setForm] = useState({
    note: '',
    noteInterne: '',
  })
  
  const [periodi, setPeriodi] = useState<Periodo[]>([])
  
  // Totali
  const [totali, setTotali] = useState({
    netto: 0,
    lordo: 0,
    ritenuta: 0,
    quotaAgenzia: 0,
    quotaUnitaria: 0,
    numPrestazioni: 0,
    importoFattura: 0,
  })

  // Modal nuovo artista
  const [showModalArtista, setShowModalArtista] = useState(false)
  const [modalArtistaPeriodoId, setModalArtistaPeriodoId] = useState<string | null>(null)
  const [nuovoArtista, setNuovoArtista] = useState({
    nome: '', cognome: '', codiceFiscale: '', nomeDarte: '', 
    qualifica: 'DJ', email: '', tipoContratto: 'OCCASIONALE', cachetBase: ''
  })
  const [savingArtista, setSavingArtista] = useState(false)
  const [erroriArtista, setErroriArtista] = useState<any>({})

  // Carica agibilità esistente
  useEffect(() => {
    async function loadAgibilita() {
      try {
        const res = await fetch(`/api/agibilita/${id}`)
        if (!res.ok) throw new Error('Agibilità non trovata')
        
        const data = await res.json()
        setAgibilita(data)
        
        setForm({
          note: data.note || '',
          noteInterne: data.noteInterne || '',
        })
        
        // Raggruppa artisti per dataInizio/dataFine per creare periodi
        const periodiMap = new Map<string, Periodo>()
        
        for (const aa of data.artisti) {
          const dataInizio = formatDateForInput(aa.dataInizio || data.data)
          const dataFine = formatDateForInput(aa.dataFine || aa.dataInizio || data.dataFine || data.data)
          const key = `${dataInizio}-${dataFine}`
          
          if (!periodiMap.has(key)) {
            periodiMap.set(key, {
              id: generateId(),
              dataInizio,
              dataFine: dataFine !== dataInizio ? dataFine : getGiornoDopo(dataInizio),
              artisti: []
            })
          }
          
          periodiMap.get(key)!.artisti.push({
            id: aa.artista.id,
            nome: aa.artista.nome,
            cognome: aa.artista.cognome,
            nomeDarte: aa.artista.nomeDarte,
            codiceFiscale: aa.artista.codiceFiscale,
            qualifica: aa.qualifica || aa.artista.qualifica,
            compensoNetto: parseFloat(aa.compensoNetto).toString(),
            tipoContratto: aa.artista.tipoContratto,
            partitaIva: aa.artista.partitaIva,
            cachetBase: aa.artista.cachetBase,
          })
        }
        
        // Se non ci sono artisti, crea un periodo vuoto
        if (periodiMap.size === 0) {
          const oggi = formatDateForInput(data.data || new Date())
          periodiMap.set('default', {
            id: generateId(),
            dataInizio: oggi,
            dataFine: getGiornoDopo(oggi),
            artisti: []
          })
        }
        
        setPeriodi(Array.from(periodiMap.values()))
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadAgibilita()
  }, [id])
  
  // Ricalcola totali quando cambiano periodi
  useEffect(() => {
    if (!agibilita) return
    
    const quotaUnitaria = parseFloat(agibilita.committente?.quotaAgenzia?.toString() || '0')
    
    let numPrestazioni = 0
    periodi.forEach(p => {
      numPrestazioni += p.artisti.length
    })
    
    const quotaTotale = quotaUnitaria * numPrestazioni
    
    let totNetto = 0
    let totLordo = 0
    let totRitenuta = 0
    
    periodi.forEach(periodo => {
      periodo.artisti.forEach(a => {
        const netto = parseFloat(a.compensoNetto || '0')
        
        // Se ha P.IVA: netto = lordo, ritenuta = 0
        if (a.tipoContratto === 'P_IVA' || a.tipoContratto === 'PARTITA_IVA' || a.partitaIva) {
          totNetto += netto
          totLordo += netto // Per P.IVA, lordo = netto
          // Nessuna ritenuta per P.IVA
        } else {
          // Prestazione occasionale: ritenuta 20%
          const compensi = calcolaCompensi({ netto }, 0)
          totNetto += compensi.netto
          totLordo += compensi.lordo
          totRitenuta += compensi.ritenuta
        }
      })
    })
    
    setTotali({
      netto: totNetto,
      lordo: totLordo,
      ritenuta: totRitenuta,
      quotaAgenzia: quotaTotale,
      quotaUnitaria,
      numPrestazioni,
      importoFattura: totLordo + quotaTotale,
    })
  }, [periodi, agibilita])

  // Gestione periodi
  const addPeriodo = () => {
    const ultimoPeriodo = periodi[periodi.length - 1]
    const dataInizio = ultimoPeriodo?.dataFine || ultimoPeriodo?.dataInizio || formatDateForInput(new Date())
    
    setPeriodi([...periodi, {
      id: generateId(),
      dataInizio,
      dataFine: getGiornoDopo(dataInizio),
      artisti: []
    }])
  }
  
  const removePeriodo = (periodoId: string) => {
    if (periodi.length <= 1) return
    setPeriodi(periodi.filter(p => p.id !== periodoId))
  }
  
  const updatePeriodo = (periodoId: string, field: 'dataInizio' | 'dataFine', value: string) => {
    setPeriodi(periodi.map(p => {
      if (p.id !== periodoId) return p
      
      // Se cambio dataInizio, aggiorno anche dataFine al giorno dopo (se dataFine era <= dataInizio)
      if (field === 'dataInizio' && value) {
        const nuovaDataFine = p.dataFine && p.dataFine > value ? p.dataFine : getGiornoDopo(value)
        return { ...p, dataInizio: value, dataFine: nuovaDataFine }
      }
      
      return { ...p, [field]: value }
    }))
  }
  
  // Gestione artisti in periodi
  const handleAddArtistaToPeriodo = (periodoId: string, artistaId: string, artista: any) => {
    if (!artista) return
    
    setPeriodi(periodi.map(p => {
      if (p.id !== periodoId) return p
      
      if (p.artisti.some(a => a.id === artistaId)) {
        setError('Artista già presente in questo periodo')
        setTimeout(() => setError(''), 3000)
        return p
      }
      
      return {
        ...p,
        artisti: [...p.artisti, {
          id: artista.id,
          nome: artista.nome,
          cognome: artista.cognome,
          nomeDarte: artista.nomeDarte,
          codiceFiscale: artista.codiceFiscale,
          qualifica: artista.qualifica,
          compensoNetto: artista.cachetBase?.toString() || '100',
          tipoContratto: artista.tipoContratto,
          partitaIva: artista.partitaIva,
          cachetBase: artista.cachetBase,
        }]
      }
    }))
  }
  
  const handleRemoveArtistaFromPeriodo = (periodoId: string, artistaId: string) => {
    setPeriodi(periodi.map(p => {
      if (p.id !== periodoId) return p
      return {
        ...p,
        artisti: p.artisti.filter(a => a.id !== artistaId)
      }
    }))
  }
  
  const handleArtistaCompensoChange = (periodoId: string, artistaId: string, compensoNetto: string) => {
    setPeriodi(periodi.map(p => {
      if (p.id !== periodoId) return p
      return {
        ...p,
        artisti: p.artisti.map(a => 
          a.id === artistaId ? { ...a, compensoNetto } : a
        )
      }
    }))
  }

  // Modifica qualifica artista inline + aggiornamento DB
  const handleArtistaQualificaChange = async (periodoId: string, artistaId: string, nuovaQualifica: string) => {
    // Aggiorna stato locale immediatamente
    setPeriodi(periodi.map(p => {
      if (p.id !== periodoId) return p
      return {
        ...p,
        artisti: p.artisti.map(a => 
          a.id === artistaId ? { ...a, qualifica: nuovaQualifica } : a
        )
      }
    }))
    
    // Aggiorna nel database
    try {
      const res = await fetch(`/api/artisti/${artistaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qualifica: nuovaQualifica })
      })
      
      if (res.ok) {
        setSuccessMessage('✓ Qualifica aggiornata')
        setTimeout(() => setSuccessMessage(''), 2000)
      }
    } catch (err) {
      console.error('Errore aggiornamento qualifica:', err)
    }
  }

  // Salva nuovo artista
  const handleSaveArtista = async () => {
    const errori: any = {}
    if (!nuovoArtista.nome.trim()) errori.nome = 'Nome obbligatorio'
    if (!nuovoArtista.cognome.trim()) errori.cognome = 'Cognome obbligatorio'
    if (!nuovoArtista.codiceFiscale.trim()) errori.codiceFiscale = 'Codice fiscale obbligatorio'
    if (nuovoArtista.codiceFiscale && nuovoArtista.codiceFiscale.length !== 16) errori.codiceFiscale = 'CF non valido (16 caratteri)'
    
    if (Object.keys(errori).length > 0) {
      setErroriArtista(errori)
      return
    }
    
    setSavingArtista(true)
    try {
      const res = await fetch('/api/artisti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuovoArtista,
          cachetBase: nuovoArtista.cachetBase ? parseFloat(nuovoArtista.cachetBase) : null,
          inviaEmailInvito: !!nuovoArtista.email
        }),
      })
      if (res.ok) {
        const artista = await res.json()
        if (modalArtistaPeriodoId) {
          handleAddArtistaToPeriodo(modalArtistaPeriodoId, artista.id, artista)
        }
        setShowModalArtista(false)
        setModalArtistaPeriodoId(null)
        setNuovoArtista({ nome: '', cognome: '', codiceFiscale: '', nomeDarte: '', qualifica: 'DJ', email: '', tipoContratto: 'OCCASIONALE', cachetBase: '' })
        setErroriArtista({})
      }
    } catch (err) {
      console.error('Errore creazione artista:', err)
    } finally {
      setSavingArtista(false)
    }
  }

  // Salva modifiche
  const handleSave = async () => {
    const periodoSenzaData = periodi.find(p => !p.dataInizio)
    if (periodoSenzaData) {
      setError('Tutti i periodi devono avere una data di inizio')
      return
    }
    
    const periodoSenzaArtisti = periodi.find(p => p.artisti.length === 0)
    if (periodoSenzaArtisti) {
      setError('Tutti i periodi devono avere almeno un artista')
      return
    }
    
    // Verifica qualifiche "ALTRO" - blocca solo se ci sono
    const tuttiArtisti = periodi.flatMap(p => p.artisti)
    const artistiConQualificaAltro = tuttiArtisti.filter(a => !isQualificaValida(a.qualifica))
    if (artistiConQualificaAltro.length > 0) {
      setError(`Modifica la qualifica per: ${artistiConQualificaAltro.map(a => `${a.cognome} ${a.nome}`).join(', ')}`)
      return
    }
    
    setSaving(true)
    setError('')
    
    try {
      const periodiDaInviare = periodi.map(p => ({
        dataInizio: p.dataInizio,
        dataFine: p.dataFine || p.dataInizio,
        artisti: p.artisti.map(a => {
          const compensi = calcolaCompensi({ netto: parseFloat(a.compensoNetto || '0') }, 0)
          return {
            artistaId: a.id,
            qualifica: a.qualifica,
            compensoNetto: compensi.netto,
            compensoLordo: compensi.lordo,
            ritenuta: compensi.ritenuta,
          }
        })
      }))
      
      const res = await fetch(`/api/agibilita/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodi: periodiDaInviare,
          quotaAgenzia: totali.quotaAgenzia,
          totaleCompensiNetti: totali.netto,
          totaleCompensiLordi: totali.lordo,
          totaleRitenute: totali.ritenuta,
          importoFattura: totali.importoFattura,
          note: form.note,
          noteInterne: form.noteInterne,
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Errore nel salvataggio')
      }
      
      router.push(`/agibilita/${id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!agibilita) {
    return (
      <div className="p-6 bg-red-50 rounded-lg text-red-700">
        <p>{error || 'Agibilità non trovata'}</p>
        <Link href="/agibilita" className="text-blue-600 hover:underline mt-2 inline-block">
          Torna alla lista
        </Link>
      </div>
    )
  }

  const giàInviataINPS = !!agibilita.identificativoINPS
  const quotaCommittente = parseFloat(agibilita.committente?.quotaAgenzia || 0)

  // Tutti gli artisti per statistiche
  const tuttiArtisti = periodi.flatMap(p => p.artisti)
  const hasCompensoZero = tuttiArtisti.some(a => parseFloat(a.compensoNetto || '0') === 0)
  const hasQualificaAltro = tuttiArtisti.some(a => !isQualificaValida(a.qualifica))

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/agibilita/${id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Modifica Agibilità</h1>
            <p className="text-gray-500">{agibilita.codice}</p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving || hasQualificaAltro}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'Salvataggio...' : 'Salva Modifiche'}
        </button>
      </div>
      
      {/* Messaggi */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm animate-pulse">
          {successMessage}
        </div>
      )}
      
      {giàInviataINPS && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 flex items-center gap-2">
          <AlertTriangle size={20} />
          Questa agibilità è già stata inviata all&apos;INPS. Le modifiche non saranno riflesse sul portale INPS.
        </div>
      )}
      
      {hasQualificaAltro && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 flex items-center gap-2">
          <AlertTriangle size={20} />
          <span>
            <strong>Attenzione:</strong> Uno o più artisti hanno qualifica &quot;Altro&quot;. Seleziona una qualifica valida prima di salvare.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Riferimenti */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={20} />
              Riferimenti (non modificabili)
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Locale:</span>
                <p className="font-medium">{agibilita.locale?.nome}</p>
                <p className="text-xs text-gray-400">{agibilita.locale?.citta} ({agibilita.locale?.provincia})</p>
              </div>
              <div>
                <span className="text-gray-500">Committente:</span>
                <p className="font-medium">{agibilita.committente?.ragioneSociale || 'Non assegnato'}</p>
                {quotaCommittente > 0 && (
                  <p className="text-xs text-blue-500">Quota: €{quotaCommittente.toFixed(2)} per prestazione</p>
                )}
              </div>
            </div>
          </div>

          {/* Periodi e Artisti */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar size={20} />
                Periodi e Artisti
              </h2>
              <button
                type="button"
                onClick={addPeriodo}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus size={18} />
                Aggiungi Periodo
              </button>
            </div>
            
            {periodi.map((periodo, index) => (
              <div key={periodo.id} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar size={18} className="text-blue-500" />
                    Periodo {index + 1}
                  </h3>
                  {periodi.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePeriodo(periodo.id)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                      title="Rimuovi periodo"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                
                {/* Date periodo */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Inizio <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={periodo.dataInizio}
                      onChange={(e) => updatePeriodo(periodo.id, 'dataInizio', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Fine <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={periodo.dataFine}
                      onChange={(e) => updatePeriodo(periodo.id, 'dataFine', e.target.value)}
                      min={periodo.dataInizio}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Ricerca artisti */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aggiungi artista</label>
                  <AutocompleteArtista
                    key={`search-${periodo.id}-${periodo.artisti.length}`}
                    value={null}
                    onChange={(artistaId, artista) => {
                      if (artistaId) handleAddArtistaToPeriodo(periodo.id, artistaId, artista)
                    }}
                    placeholder="Cerca per nome, cognome, nome d'arte..."
                    excludeIds={periodo.artisti.map(a => a.id)}
                    onAddNew={() => {
                      setModalArtistaPeriodoId(periodo.id)
                      setShowModalArtista(true)
                    }}
                  />
                </div>
                
                {/* Lista artisti del periodo */}
                {periodo.artisti.length > 0 ? (
                  <div className="space-y-2">
                    {periodo.artisti.map((artista) => {
                      const qualificaNonValida = !isQualificaValida(artista.qualifica)
                      
                      return (
                        <div 
                          key={artista.id} 
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            qualificaNonValida 
                              ? 'bg-amber-50 border border-amber-200' 
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {artista.cognome} {artista.nome}
                              {artista.nomeDarte && <span className="text-gray-500"> &quot;{artista.nomeDarte}&quot;</span>}
                              {(artista.tipoContratto === 'P_IVA' || artista.tipoContratto === 'PARTITA_IVA' || artista.partitaIva) && (
                                <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">P.IVA</span>
                              )}
                            </p>
                            {/* Mostra qualifica: se valida solo testo, se non valida dropdown */}
                            <div className="flex items-center gap-2 mt-1">
                              {qualificaNonValida ? (
                                <>
                                  <select
                                    value={artista.qualifica || 'Altro'}
                                    onChange={(e) => handleArtistaQualificaChange(periodo.id, artista.id, e.target.value)}
                                    className="text-sm px-2 py-1 border border-amber-300 bg-amber-100 text-amber-800 rounded"
                                  >
                                    {QUALIFICHE.map(q => (
                                      <option key={q.value} value={q.value}>{q.label}</option>
                                    ))}
                                  </select>
                                  <span className="text-xs text-amber-600 flex items-center gap-1">
                                    <AlertTriangle size={12} />
                                    Seleziona qualifica
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-gray-500">
                                  {artista.qualifica}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-32">
                              <input
                                type="number"
                                value={artista.compensoNetto}
                                onChange={(e) => handleArtistaCompensoChange(periodo.id, artista.id, e.target.value)}
                                min="0"
                                step="0.01"
                                placeholder="Netto €"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveArtistaFromPeriodo(periodo.id, artista.id)}
                              className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Nessun artista in questo periodo</p>
                    <p className="text-sm">Usa la ricerca sopra per aggiungere artisti</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Warning compenso zero */}
          {hasCompensoZero && tuttiArtisti.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-700">
              <AlertTriangle size={18} />
              <span className="text-sm">Uno o più artisti hanno compenso a €0.</span>
            </div>
          )}
          
          {/* Riepilogo per Periodi */}
          {tuttiArtisti.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calculator size={20} />
                Riepilogo per Periodo
              </h2>
              
              <div className="space-y-3 mb-6">
                {periodi.map((periodo, index) => {
                  if (periodo.artisti.length === 0) return null
                  
                  const totPeriodo = periodo.artisti.reduce((acc, a) => {
                    const compensi = calcolaCompensi({ netto: parseFloat(a.compensoNetto || '0') }, 0)
                    return {
                      netto: acc.netto + compensi.netto,
                      lordo: acc.lordo + compensi.lordo,
                      numArtisti: acc.numArtisti + 1
                    }
                  }, { netto: 0, lordo: 0, numArtisti: 0 })
                  
                  const dataInizioFmt = periodo.dataInizio ? new Date(periodo.dataInizio).toLocaleDateString('it-IT') : '-'
                  const dataFineFmt = periodo.dataFine ? new Date(periodo.dataFine).toLocaleDateString('it-IT') : dataInizioFmt
                  
                  return (
                    <div key={periodo.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            Periodo {index + 1}: {dataInizioFmt} → {dataFineFmt}
                          </p>
                          <p className="text-sm text-gray-500">
                            {totPeriodo.numArtisti} artist{totPeriodo.numArtisti === 1 ? 'a' : 'i'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Netto: €{totPeriodo.netto.toFixed(2)}</p>
                          <p className="font-medium">Lordo: €{totPeriodo.lordo.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        {periodo.artisti.map(a => (
                          <div key={a.id} className="flex justify-between text-sm py-1">
                            <span className="text-gray-600">
                              {a.cognome} {a.nome} 
                              <span className="text-gray-400 ml-1">({a.qualifica || 'N/D'})</span>
                            </span>
                            <span className="font-medium">€{parseFloat(a.compensoNetto || '0').toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Note</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (visibili a committente)
                </label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({...form, note: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Note visibili..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note Interne (non visibili)
                </label>
                <textarea
                  value={form.noteInterne}
                  onChange={(e) => setForm({...form, noteInterne: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Note interne..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Riepilogo */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Euro size={20} />
              Riepilogo Economico
            </h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Totale Netto</span>
                <span className="font-medium">€{totali.netto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Totale Lordo</span>
                <span className="font-medium">€{totali.lordo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ritenute (20%)</span>
                <span className="font-medium text-red-600">€{totali.ritenuta.toFixed(2)}</span>
              </div>
              
              <div className="pt-3 border-t">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-600">Quota Committente</p>
                  <p className="text-xl font-bold text-green-700">€{totali.quotaAgenzia.toFixed(2)}</p>
                  <p className="text-xs text-green-500">
                    €{totali.quotaUnitaria.toFixed(2)} × {totali.numPrestazioni} prestazioni
                  </p>
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-gray-900">Importo Fattura</span>
                  <span className="font-bold text-blue-600">€{totali.importoFattura.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleSave}
                disabled={saving || hasQualificaAltro}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save size={20} />
                {saving ? 'Salvataggio...' : 'Salva Modifiche'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal Nuovo Artista */}
      <Modal isOpen={showModalArtista} onClose={() => { setShowModalArtista(false); setModalArtistaPeriodoId(null) }} title="Nuovo Artista (registrazione rapida)">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                value={nuovoArtista.nome}
                onChange={(e) => setNuovoArtista(prev => ({ ...prev, nome: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg ${erroriArtista.nome ? 'border-red-500' : 'border-gray-300'}`}
              />
              {erroriArtista.nome && <p className="text-xs text-red-500 mt-1">{erroriArtista.nome}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
              <input
                type="text"
                value={nuovoArtista.cognome}
                onChange={(e) => setNuovoArtista(prev => ({ ...prev, cognome: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg ${erroriArtista.cognome ? 'border-red-500' : 'border-gray-300'}`}
              />
              {erroriArtista.cognome && <p className="text-xs text-red-500 mt-1">{erroriArtista.cognome}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale *</label>
            <input
              type="text"
              value={nuovoArtista.codiceFiscale}
              onChange={(e) => setNuovoArtista(prev => ({ ...prev, codiceFiscale: e.target.value.toUpperCase() }))}
              maxLength={16}
              className={`w-full px-3 py-2 border rounded-lg uppercase ${erroriArtista.codiceFiscale ? 'border-red-500' : 'border-gray-300'}`}
            />
            {erroriArtista.codiceFiscale && <p className="text-xs text-red-500 mt-1">{erroriArtista.codiceFiscale}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome d&apos;arte</label>
              <input
                type="text"
                value={nuovoArtista.nomeDarte}
                onChange={(e) => setNuovoArtista(prev => ({ ...prev, nomeDarte: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualifica *</label>
              <select
                value={nuovoArtista.qualifica}
                onChange={(e) => setNuovoArtista(prev => ({ ...prev, qualifica: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {QUALIFICHE.map(q => (
                  <option key={q.value} value={q.value}>{q.label}</option>
                ))}
              </select>
              {nuovoArtista.qualifica === 'Altro' && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  La qualifica &quot;Altro&quot; andrà specificata in seguito
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Contratto</label>
              <select
                value={nuovoArtista.tipoContratto}
                onChange={(e) => setNuovoArtista(prev => ({ ...prev, tipoContratto: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {TIPI_CONTRATTO.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cachet Base (€)</label>
              <input
                type="number"
                value={nuovoArtista.cachetBase}
                onChange={(e) => setNuovoArtista(prev => ({ ...prev, cachetBase: e.target.value }))}
                min="0"
                step="0.01"
                placeholder="100.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={nuovoArtista.email}
              onChange={(e) => setNuovoArtista(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => { setShowModalArtista(false); setModalArtistaPeriodoId(null) }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annulla</button>
            <button type="button" onClick={handleSaveArtista} disabled={savingArtista} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {savingArtista ? 'Salvataggio...' : 'Salva e Aggiungi'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}