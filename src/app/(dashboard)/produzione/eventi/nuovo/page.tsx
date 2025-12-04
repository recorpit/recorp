// src/app/(dashboard)/produzione/eventi/nuovo/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Users,
  Sparkles
} from 'lucide-react'

// Costanti
const TIPI_EVENTO = [
  { value: 'CONCERTO', label: 'Concerto' },
  { value: 'FESTIVAL', label: 'Festival' },
  { value: 'CLUB', label: 'Club' },
  { value: 'APERITIVO', label: 'Aperitivo' },
  { value: 'MATRIMONIO', label: 'Matrimonio' },
  { value: 'CORPORATE', label: 'Corporate' },
  { value: 'PIAZZA', label: 'Piazza' },
  { value: 'PRIVATO', label: 'Privato' },
  { value: 'FORMAT', label: 'Format' },
  { value: 'ALTRO', label: 'Altro' },
]

interface Committente {
  id: string
  ragioneSociale: string
}

interface Locale {
  id: string
  nome: string
  citta: string | null
  indirizzo: string | null
}

interface Format {
  id: string
  nome: string
}

interface User {
  id: string
  nome: string
  cognome: string
}

export default function NuovoEventoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Dati per select
  const [committenti, setCommittenti] = useState<Committente[]>([])
  const [locali, setLocali] = useState<Locale[]>([])
  const [formats, setFormats] = useState<Format[]>([])
  const [utenti, setUtenti] = useState<User[]>([])
  
  // Form data
  const [formData, setFormData] = useState({
    nome: '',
    descrizione: '',
    tipo: 'CONCERTO',
    dataInizio: '',
    dataFine: '',
    oraCarico: '',
    oraInizioEvento: '',
    oraFineEvento: '',
    oraScarico: '',
    committenteId: '',
    localeId: '',
    formatId: '',
    indirizzoEvento: '',
    cittaEvento: '',
    provinciaEvento: '',
    capienzaPrevista: '',
    ricavoPrevisto: '',
    costoPrevisto: '',
    responsabileId: '',
    note: '',
    noteInterne: '',
  })
  
  // Carica dati per select
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      const [commRes, locRes, formatRes, userRes] = await Promise.all([
        fetch('/api/committenti'),
        fetch('/api/locali'),
        fetch('/api/formats'),
        fetch('/api/utenti'),
      ])
      
      if (commRes.ok) setCommittenti(await commRes.json())
      if (locRes.ok) setLocali(await locRes.json())
      if (formatRes.ok) setFormats(await formatRes.json())
      if (userRes.ok) setUtenti(await userRes.json())
    } catch (err) {
      console.error('Errore caricamento dati:', err)
    }
  }
  
  // Quando si seleziona un locale, precompila indirizzo
  useEffect(() => {
    if (formData.localeId) {
      const locale = locali.find(l => l.id === formData.localeId)
      if (locale) {
        setFormData(prev => ({
          ...prev,
          indirizzoEvento: locale.indirizzo || '',
          cittaEvento: locale.citta || '',
        }))
      }
    }
  }, [formData.localeId, locali])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/produzione/eventi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nella creazione')
      }
      
      const evento = await res.json()
      router.push(`/produzione/eventi/${evento.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/produzione/eventi"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuovo Evento</h1>
          <p className="text-gray-500">Crea un nuovo evento o produzione</p>
        </div>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonna principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dati base */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Informazioni Evento
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Evento *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Es: Serata House @ Villa Bonin"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo Evento
                  </label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {TIPI_EVENTO.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Format
                  </label>
                  <select
                    name="formatId"
                    value={formData.formatId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Nessun format --</option>
                    {formats.map(f => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrizione
                  </label>
                  <textarea
                    name="descrizione"
                    value={formData.descrizione}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Descrizione evento..."
                  />
                </div>
              </div>
            </div>
            
            {/* Date e orari */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={20} />
                Date e Orari
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inizio *
                  </label>
                  <input
                    type="date"
                    name="dataInizio"
                    value={formData.dataInizio}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Fine
                  </label>
                  <input
                    type="date"
                    name="dataFine"
                    value={formData.dataFine}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ora Carico
                  </label>
                  <input
                    type="time"
                    name="oraCarico"
                    value={formData.oraCarico}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ora Inizio
                  </label>
                  <input
                    type="time"
                    name="oraInizioEvento"
                    value={formData.oraInizioEvento}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ora Fine
                  </label>
                  <input
                    type="time"
                    name="oraFineEvento"
                    value={formData.oraFineEvento}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ora Scarico
                  </label>
                  <input
                    type="time"
                    name="oraScarico"
                    value={formData.oraScarico}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Location */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Location
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Locale
                  </label>
                  <select
                    name="localeId"
                    value={formData.localeId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Seleziona locale --</option>
                    {locali.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.nome} {l.citta && `(${l.citta})`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capienza prevista
                  </label>
                  <input
                    type="number"
                    name="capienzaPrevista"
                    value={formData.capienzaPrevista}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Es: 500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indirizzo evento
                  </label>
                  <input
                    type="text"
                    name="indirizzoEvento"
                    value={formData.indirizzoEvento}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Via/Piazza..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Città
                  </label>
                  <input
                    type="text"
                    name="cittaEvento"
                    value={formData.cittaEvento}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    name="provinciaEvento"
                    value={formData.provinciaEvento}
                    onChange={handleChange}
                    maxLength={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Es: VI"
                  />
                </div>
              </div>
            </div>
            
            {/* Note */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Note</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note (visibili al cliente)
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note interne
                  </label>
                  <textarea
                    name="noteInterne"
                    value={formData.noteInterne}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Colonna laterale */}
          <div className="space-y-6">
            {/* Committente */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 size={20} />
                Committente
              </h2>
              
              <select
                name="committenteId"
                value={formData.committenteId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Seleziona committente --</option>
                {committenti.map(c => (
                  <option key={c.id} value={c.id}>{c.ragioneSociale}</option>
                ))}
              </select>
            </div>
            
            {/* Responsabile */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} />
                Responsabile
              </h2>
              
              <select
                name="responsabileId"
                value={formData.responsabileId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Seleziona responsabile --</option>
                {utenti.map(u => (
                  <option key={u.id} value={u.id}>{u.nome} {u.cognome}</option>
                ))}
              </select>
            </div>
            
            {/* Budget */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget Previsto</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ricavo previsto (€)
                  </label>
                  <input
                    type="number"
                    name="ricavoPrevisto"
                    value={formData.ricavoPrevisto}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo previsto (€)
                  </label>
                  <input
                    type="number"
                    name="costoPrevisto"
                    value={formData.costoPrevisto}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                {formData.ricavoPrevisto && formData.costoPrevisto && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-500">Margine previsto</p>
                    <p className={`text-xl font-bold ${
                      parseFloat(formData.ricavoPrevisto) - parseFloat(formData.costoPrevisto) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      € {(parseFloat(formData.ricavoPrevisto) - parseFloat(formData.costoPrevisto)).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}
            
            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                type="submit"
                disabled={loading || !formData.nome || !formData.dataInizio}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                Crea Evento
              </button>
              
              <Link
                href="/produzione/eventi"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annulla
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
