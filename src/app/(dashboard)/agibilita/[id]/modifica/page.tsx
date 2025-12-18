// src/app/(dashboard)/agibilita/[id]/modifica/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, X, AlertTriangle, Calendar, MapPin, Euro, Plus, Globe } from 'lucide-react'
import AutocompleteArtista from '@/components/AutocompleteArtista'
import AutocompleteLocale from '@/components/AutocompleteLocale'
import AutocompleteCommittente from '@/components/AutocompleteCommittente'
import { calcolaCompensi } from '@/lib/constants'

const generateId = () => Math.random().toString(36).substring(2, 9)
const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}
const getGiornoDopo = (data: string): string => {
  const d = new Date(data)
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

const QUALIFICHE = [
  { value: 'DJ', label: 'DJ' },
  { value: 'Vocalist', label: 'Vocalist' },
  { value: 'Corista', label: 'Corista' },
  { value: 'Musicista', label: 'Musicista' },
  { value: 'Ballerino', label: 'Ballerino/a' },
  { value: 'Lucista', label: 'Lucista' },
  { value: 'Fotografo', label: 'Fotografo' },
  { value: 'Truccatore', label: 'Truccatore' },
  { value: 'Altro', label: 'Altro' },
]

const PAESI_ESTERI = [
  { code: 'AT', name: 'Austria', belfiore: 'Z102' },
  { code: 'BE', name: 'Belgio', belfiore: 'Z103' },
  { code: 'CH', name: 'Svizzera', belfiore: 'Z133' },
  { code: 'DE', name: 'Germania', belfiore: 'Z112' },
  { code: 'ES', name: 'Spagna', belfiore: 'Z131' },
  { code: 'FR', name: 'Francia', belfiore: 'Z110' },
  { code: 'GB', name: 'Regno Unito', belfiore: 'Z114' },
  { code: 'HR', name: 'Croazia', belfiore: 'Z149' },
  { code: 'NL', name: 'Paesi Bassi', belfiore: 'Z126' },
  { code: 'PL', name: 'Polonia', belfiore: 'Z127' },
  { code: 'SI', name: 'Slovenia', belfiore: 'Z150' },
  { code: 'CZ', name: 'Rep. Ceca', belfiore: 'Z156' },
  { code: 'SK', name: 'Slovacchia', belfiore: 'Z155' },
  { code: 'HU', name: 'Ungheria', belfiore: 'Z134' },
  { code: 'RO', name: 'Romania', belfiore: 'Z129' },
  { code: 'GR', name: 'Grecia', belfiore: 'Z115' },
]

function isQualificaValida(q: string | null | undefined): boolean {
  if (!q) return false
  return q.trim().toUpperCase() !== 'ALTRO' && q.trim() !== ''
}

interface ArtistaInPeriodo {
  id: string
  nome: string
  cognome: string
  nomeDarte?: string
  qualifica?: string
  compensoNetto: string
  tipoContratto?: string
  partitaIva?: string
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
    estera: false, 
    paeseEstero: '', 
    luogoEstero: '', 
    indirizzoEstero: '' 
  })
  const [localeId, setLocaleId] = useState<string | null>(null)
  const [committenteId, setCommittenteId] = useState<string | null>(null)
  const [quotaCommittente, setQuotaCommittente] = useState(0)
  const [periodi, setPeriodi] = useState<Periodo[]>([])
  const [totali, setTotali] = useState({ 
    netto: 0, lordo: 0, ritenuta: 0, quotaAgenzia: 0, numPrestazioni: 0, importoFattura: 0 
  })

  const [showModalArtista, setShowModalArtista] = useState(false)
  const [modalArtistaPeriodoId, setModalArtistaPeriodoId] = useState<string | null>(null)
  const [nuovoArtista, setNuovoArtista] = useState({ 
    nome: '', cognome: '', codiceFiscale: '', nomeDarte: '', qualifica: 'DJ', email: '' 
  })
  const [savingArtista, setSavingArtista] = useState(false)

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
          estera: data.estera || false,
          paeseEstero: data.paeseEstero || '',
          luogoEstero: data.luogoEstero || '',
          indirizzoEstero: data.indirizzoEstero || '',
        })
        
        setLocaleId(data.localeId || null)
        setCommittenteId(data.committenteId || null)
        setQuotaCommittente(parseFloat(data.committente?.quotaAgenzia || '0'))
        
        // Raggruppa artisti per periodo (dataInizio|dataFine)
        const periodiMap = new Map<string, Periodo>()
        const dataDefault = formatDateForInput(data.data)
        
        for (const aa of data.artisti) {
          const dataInizio = formatDateForInput(aa.dataInizio) || dataDefault
          const dataFine = formatDateForInput(aa.dataFine) || dataInizio
          const key = `${dataInizio}|${dataFine}`
          
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
            qualifica: aa.qualifica || aa.artista.qualifica,
            compensoNetto: parseFloat(aa.compensoNetto).toString(),
            tipoContratto: aa.artista.tipoContratto,
            partitaIva: aa.artista.partitaIva,
          })
        }
        
        // Se non ci sono periodi, creane uno vuoto con la data dell'agibilità
        if (periodiMap.size === 0) {
          periodiMap.set('default', { 
            id: generateId(), 
            dataInizio: dataDefault || formatDateForInput(new Date()), 
            dataFine: getGiornoDopo(dataDefault || formatDateForInput(new Date())), 
            artisti: [] 
          })
        }
        
        // Ordina per data e setta
        const periodiArray = Array.from(periodiMap.values()).sort((a, b) => 
          a.dataInizio.localeCompare(b.dataInizio)
        )
        setPeriodi(periodiArray)
        
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadAgibilita()
  }, [id])
  
  // Ricalcola totali quando cambiano periodi o quota
  useEffect(() => {
    if (!agibilita) return
    
    let numPrestazioni = 0
    let totNetto = 0, totLordo = 0, totRitenuta = 0
    
    periodi.forEach(p => {
      numPrestazioni += p.artisti.length
      p.artisti.forEach(a => {
        const netto = parseFloat(a.compensoNetto || '0')
        if (a.tipoContratto === 'P_IVA' || a.tipoContratto === 'PARTITA_IVA' || a.partitaIva) {
          totNetto += netto
          totLordo += netto
        } else {
          const compensi = calcolaCompensi({ netto }, 0)
          totNetto += compensi.netto
          totLordo += compensi.lordo
          totRitenuta += compensi.ritenuta
        }
      })
    })
    
    const quotaAgenzia = quotaCommittente * numPrestazioni
    setTotali({ 
      netto: totNetto, 
      lordo: totLordo, 
      ritenuta: totRitenuta, 
      quotaAgenzia, 
      numPrestazioni, 
      importoFattura: totLordo + quotaAgenzia 
    })
  }, [periodi, agibilita, quotaCommittente])

  // Gestione periodi
  const addPeriodo = () => {
    const ultimo = periodi[periodi.length - 1]
    const dataInizio = ultimo?.dataFine || ultimo?.dataInizio || formatDateForInput(new Date())
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
      if (field === 'dataInizio' && value) {
        const nuovaDataFine = p.dataFine && p.dataFine > value ? p.dataFine : getGiornoDopo(value)
        return { ...p, dataInizio: value, dataFine: nuovaDataFine }
      }
      return { ...p, [field]: value }
    }))
  }
  
  // Gestione artisti
  const handleAddArtistaToPeriodo = (periodoId: string, artistaId: string, artista: any) => {
    if (!artista) return
    setPeriodi(periodi.map(p => {
      if (p.id !== periodoId) return p
      if (p.artisti.some(a => a.id === artistaId)) return p
      return {
        ...p,
        artisti: [...p.artisti, {
          id: artista.id,
          nome: artista.nome,
          cognome: artista.cognome,
          nomeDarte: artista.nomeDarte,
          qualifica: artista.qualifica,
          compensoNetto: artista.cachetBase?.toString() || '100',
          tipoContratto: artista.tipoContratto,
          partitaIva: artista.partitaIva,
        }]
      }
    }))
  }
  
  const handleRemoveArtistaFromPeriodo = (periodoId: string, artistaId: string) => {
    setPeriodi(periodi.map(p => 
      p.id === periodoId 
        ? { ...p, artisti: p.artisti.filter(a => a.id !== artistaId) } 
        : p
    ))
  }
  
  const handleArtistaCompensoChange = (periodoId: string, artistaId: string, compensoNetto: string) => {
    setPeriodi(periodi.map(p => 
      p.id === periodoId 
        ? { ...p, artisti: p.artisti.map(a => a.id === artistaId ? { ...a, compensoNetto } : a) } 
        : p
    ))
  }

  const handleArtistaQualificaChange = async (periodoId: string, artistaId: string, nuovaQualifica: string) => {
    // Aggiorna state locale
    setPeriodi(periodi.map(p => 
      p.id === periodoId 
        ? { ...p, artisti: p.artisti.map(a => a.id === artistaId ? { ...a, qualifica: nuovaQualifica } : a) } 
        : p
    ))
    
    // Aggiorna anche nel DB
    try {
      await fetch(`/api/artisti/${artistaId}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ qualifica: nuovaQualifica }) 
      })
      setSuccessMessage('✓ Qualifica aggiornata')
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (err) { 
      console.error('Errore aggiornamento qualifica:', err) 
    }
  }

  // Salvataggio nuovo artista
  const handleSaveArtista = async () => {
    if (!nuovoArtista.nome || !nuovoArtista.cognome || !nuovoArtista.codiceFiscale) {
      return
    }
    
    setSavingArtista(true)
    try {
      const res = await fetch('/api/artisti', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(nuovoArtista) 
      })
      
      if (res.ok) {
        const artista = await res.json()
        if (modalArtistaPeriodoId) {
          handleAddArtistaToPeriodo(modalArtistaPeriodoId, artista.id, artista)
        }
        setShowModalArtista(false)
        setModalArtistaPeriodoId(null)
        setNuovoArtista({ nome: '', cognome: '', codiceFiscale: '', nomeDarte: '', qualifica: 'DJ', email: '' })
      }
    } catch (err) { 
      console.error('Errore creazione artista:', err) 
    } finally { 
      setSavingArtista(false) 
    }
  }

  // Salvataggio agibilità
  const handleSave = async () => {
    const tuttiArtisti = periodi.flatMap(p => p.artisti)
    
    if (tuttiArtisti.some(a => !isQualificaValida(a.qualifica))) {
      setError('Modifica le qualifiche "Altro" prima di salvare')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    setSaving(true)
    setError('')
    
    try {
      // Codice Belfiore per estero
      let codiceBelfioreEstero: string | null = null
      if (form.estera && form.paeseEstero) {
        const paese = PAESI_ESTERI.find(p => p.code === form.paeseEstero)
        codiceBelfioreEstero = paese?.belfiore || null
      }
      
      const res = await fetch(`/api/agibilita/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localeId: form.estera ? null : localeId,
          committenteId,
          estera: form.estera,
          paeseEstero: form.paeseEstero || null,
          codiceBelfioreEstero,
          luogoEstero: form.luogoEstero || null,
          indirizzoEstero: form.indirizzoEstero || null,
          note: form.note,
          noteInterne: form.noteInterne,
          quotaAgenzia: totali.quotaAgenzia,
          totaleCompensiNetti: totali.netto,
          totaleCompensiLordi: totali.lordo,
          totaleRitenute: totali.ritenuta,
          importoFattura: totali.importoFattura,
          // Array artisti con date corrette per ogni periodo
          artisti: periodi.flatMap(p => p.artisti.map(a => ({
            artistaId: a.id,
            qualifica: a.qualifica,
            compensoNetto: parseFloat(a.compensoNetto || '0'),
            dataInizio: p.dataInizio,
            dataFine: p.dataFine || p.dataInizio,
          }))),
        })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nel salvataggio')
      }
      
      router.push(`/agibilita/${id}`)
    } catch (err: any) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
        {error || 'Agibilità non trovata'}
        <Link href="/agibilita" className="block mt-2 text-blue-600 hover:underline">
          Torna alla lista
        </Link>
      </div>
    )
  }

  const tuttiArtisti = periodi.flatMap(p => p.artisti)
  const hasQualificaAltro = tuttiArtisti.some(a => !isQualificaValida(a.qualifica))

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/agibilita/${id}`} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Modifica Agibilità</h1>
            <p className="text-gray-500 font-mono">{agibilita.codice}</p>
          </div>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving || hasQualificaAltro} 
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'Salvataggio...' : 'Salva Modifiche'}
        </button>
      </div>
      
      {/* Messaggi */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertTriangle size={20} />{error}
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMessage}
        </div>
      )}
      {hasQualificaAltro && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 flex items-center gap-2">
          <AlertTriangle size={20} />
          Modifica le qualifiche &quot;Altro&quot; prima di salvare
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Estera */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.estera} 
                onChange={(e) => setForm({ 
                  ...form, 
                  estera: e.target.checked, 
                  paeseEstero: e.target.checked ? form.paeseEstero : '' 
                })} 
                className="w-4 h-4 text-blue-600 rounded" 
              />
              <Globe size={18} className={form.estera ? 'text-blue-600' : 'text-gray-400'} />
              <span className="font-medium">Agibilità Estera</span>
            </label>
            
            {form.estera && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Paese *</label>
                  <select 
                    value={form.paeseEstero} 
                    onChange={(e) => setForm({ ...form, paeseEstero: e.target.value })} 
                    className="w-full md:w-64 px-4 py-2 border border-blue-200 rounded-lg bg-white"
                  >
                    <option value="">Seleziona paese...</option>
                    {PAESI_ESTERI.map(p => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                  {form.paeseEstero && (
                    <p className="text-xs text-blue-600 mt-1">
                      Codice Belfiore: {PAESI_ESTERI.find(p => p.code === form.paeseEstero)?.belfiore}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Luogo/Città</label>
                    <input 
                      type="text" 
                      value={form.luogoEstero} 
                      onChange={(e) => setForm({ ...form, luogoEstero: e.target.value })} 
                      placeholder="es. Monaco di Baviera"
                      className="w-full px-4 py-2 border border-blue-200 rounded-lg" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Indirizzo</label>
                    <input 
                      type="text" 
                      value={form.indirizzoEstero} 
                      onChange={(e) => setForm({ ...form, indirizzoEstero: e.target.value })} 
                      placeholder="es. Olympiastadion"
                      className="w-full px-4 py-2 border border-blue-200 rounded-lg" 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Riferimenti (solo se non estera) */}
          {!form.estera && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={20} /> Riferimenti
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Locale</label>
                  <AutocompleteLocale 
                    value={localeId} 
                    onChange={(id) => setLocaleId(id)} 
                    placeholder="Cerca locale..." 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Committente</label>
                  <AutocompleteCommittente
                    value={committenteId}
                    onChange={(id, c) => {
                      setCommittenteId(id)
                      setQuotaCommittente(parseFloat(String(c?.quotaAgenzia || '0')))
                    }}
                    placeholder="Cerca committente..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Committente per estera */}
          {form.estera && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Committente</h2>
              <AutocompleteCommittente
                value={committenteId}
                onChange={(id, c) => {
                  setCommittenteId(id)
                  setQuotaCommittente(parseFloat(String(c?.quotaAgenzia || '0')))
                }}
                placeholder="Cerca committente..."
              />
            </div>
          )}

          {/* Periodi */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar size={20} /> Periodi e Artisti
              </h2>
              <button 
                type="button" 
                onClick={addPeriodo} 
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus size={18} />Aggiungi Periodo
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
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                
                {/* Date */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Inizio *</label>
                    <input 
                      type="date" 
                      value={periodo.dataInizio} 
                      onChange={(e) => updatePeriodo(periodo.id, 'dataInizio', e.target.value)} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Fine *</label>
                    <input 
                      type="date" 
                      value={periodo.dataFine} 
                      onChange={(e) => updatePeriodo(periodo.id, 'dataFine', e.target.value)} 
                      min={periodo.dataInizio} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                </div>
                
                {/* Aggiungi artista */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aggiungi artista</label>
                  <AutocompleteArtista 
                    key={`search-${periodo.id}-${periodo.artisti.length}`} 
                    value={null} 
                    onChange={(id, a) => id && handleAddArtistaToPeriodo(periodo.id, id, a)} 
                    placeholder="Cerca artista..." 
                    excludeIds={periodo.artisti.map(a => a.id)} 
                    onAddNew={() => { 
                      setModalArtistaPeriodoId(periodo.id)
                      setShowModalArtista(true) 
                    }} 
                  />
                </div>
                
                {/* Lista artisti */}
                {periodo.artisti.length > 0 ? (
                  <div className="space-y-2">
                    {periodo.artisti.map((artista) => {
                      const qualificaNonValida = !isQualificaValida(artista.qualifica)
                      return (
                        <div 
                          key={artista.id} 
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            qualificaNonValida ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {artista.cognome} {artista.nome}
                              {artista.nomeDarte && (
                                <span className="text-gray-500"> &quot;{artista.nomeDarte}&quot;</span>
                              )}
                              {(artista.tipoContratto === 'P_IVA' || artista.partitaIva) && (
                                <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">P.IVA</span>
                              )}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {qualificaNonValida ? (
                                <>
                                  <select 
                                    value={artista.qualifica || 'Altro'} 
                                    onChange={(e) => handleArtistaQualificaChange(periodo.id, artista.id, e.target.value)} 
                                    className="text-sm px-2 py-1 border border-amber-300 bg-amber-100 rounded"
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
                                <span className="text-sm text-gray-500">{artista.qualifica}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-28">
                              <input 
                                type="number" 
                                value={artista.compensoNetto} 
                                onChange={(e) => handleArtistaCompensoChange(periodo.id, artista.id, e.target.value)} 
                                min="0" 
                                step="0.01" 
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
                    Nessun artista in questo periodo
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Note */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Note</h2>
            <textarea 
              value={form.note} 
              onChange={(e) => setForm({ ...form, note: e.target.value })} 
              rows={3} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
              placeholder="Note visibili..." 
            />
            <textarea 
              value={form.noteInterne} 
              onChange={(e) => setForm({ ...form, noteInterne: e.target.value })} 
              rows={2} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-3 focus:ring-2 focus:ring-blue-500" 
              placeholder="Note interne (non visibili al committente)..." 
            />
          </div>
        </div>

        {/* Sidebar - Riepilogo */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Euro size={20} /> Riepilogo
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
                  <p className="text-sm text-green-600">Quota Agenzia</p>
                  <p className="text-xl font-bold text-green-700">€{totali.quotaAgenzia.toFixed(2)}</p>
                  <p className="text-xs text-green-500">
                    €{quotaCommittente.toFixed(2)} × {totali.numPrestazioni} prestazioni
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t flex justify-between text-base">
                <span className="font-semibold">Importo Fattura</span>
                <span className="font-bold text-blue-600">€{totali.importoFattura.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              onClick={handleSave} 
              disabled={saving || hasQualificaAltro} 
              className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal Nuovo Artista */}
      {showModalArtista && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nuovo Artista</h3>
              <button 
                onClick={() => { setShowModalArtista(false); setModalArtistaPeriodoId(null) }} 
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <input 
                    type="text" 
                    value={nuovoArtista.nome} 
                    onChange={(e) => setNuovoArtista({ ...nuovoArtista, nome: e.target.value })} 
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cognome *</label>
                  <input 
                    type="text" 
                    value={nuovoArtista.cognome} 
                    onChange={(e) => setNuovoArtista({ ...nuovoArtista, cognome: e.target.value })} 
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Codice Fiscale *</label>
                <input 
                  type="text" 
                  value={nuovoArtista.codiceFiscale} 
                  onChange={(e) => setNuovoArtista({ ...nuovoArtista, codiceFiscale: e.target.value.toUpperCase() })} 
                  className="w-full px-3 py-2 border rounded-lg uppercase" 
                  maxLength={16}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome d&apos;arte</label>
                  <input 
                    type="text" 
                    value={nuovoArtista.nomeDarte} 
                    onChange={(e) => setNuovoArtista({ ...nuovoArtista, nomeDarte: e.target.value })} 
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Qualifica</label>
                  <select 
                    value={nuovoArtista.qualifica} 
                    onChange={(e) => setNuovoArtista({ ...nuovoArtista, qualifica: e.target.value })} 
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {QUALIFICHE.map(q => (
                      <option key={q.value} value={q.value}>{q.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                  type="email" 
                  value={nuovoArtista.email} 
                  onChange={(e) => setNuovoArtista({ ...nuovoArtista, email: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-lg" 
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => { setShowModalArtista(false); setModalArtistaPeriodoId(null) }} 
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button 
                onClick={handleSaveArtista} 
                disabled={savingArtista || !nuovoArtista.nome || !nuovoArtista.cognome || !nuovoArtista.codiceFiscale} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {savingArtista ? 'Salvataggio...' : 'Salva e Aggiungi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
