// src/app/(dashboard)/staff/nuovo/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  User,
  Phone,
  Star,
  Car,
  Euro
} from 'lucide-react'

// Costanti
const TIPI_COLLABORATORE = [
  { value: 'INTERNO', label: 'Interno' },
  { value: 'ESTERNO', label: 'Esterno' },
  { value: 'OCCASIONALE', label: 'Collaborazione Occasionale' },
  { value: 'PARTITA_IVA', label: 'Partita IVA' },
]

const COMPETENZE = [
  { key: 'competenzaAudio', label: 'Audio' },
  { key: 'competenzaLuci', label: 'Luci' },
  { key: 'competenzaVideo', label: 'Video' },
  { key: 'competenzaLED', label: 'LED' },
  { key: 'competenzaRigging', label: 'Rigging' },
  { key: 'competenzaStagehand', label: 'Stagehand' },
  { key: 'competenzaDJTech', label: 'DJ Tech' },
  { key: 'competenzaDriver', label: 'Driver' },
]

export default function NuovoStaffPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form data
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    codiceFiscale: '',
    email: '',
    telefono: '',
    telefonoSecondario: '',
    indirizzo: '',
    cap: '',
    citta: '',
    provincia: '',
    dataNascita: '',
    comuneNascita: '',
    provinciaNascita: '',
    tipoCollaboratore: 'ESTERNO',
    competenzaAudio: 0,
    competenzaLuci: 0,
    competenzaVideo: 0,
    competenzaLED: 0,
    competenzaRigging: 0,
    competenzaStagehand: 0,
    competenzaDJTech: 0,
    competenzaDriver: 0,
    tipologiaDJ: '',
    costoGettone: '',
    costoOrario: '',
    patente: false,
    tipologiaPatente: '',
    automunito: false,
    preferenzeOperative: '',
    disponibilitaMacro: '',
    iban: '',
    note: '',
    noteInterne: '',
  })
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }
  
  const handleCompetenzaChange = (key: string, value: number) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nella creazione')
      }
      
      const staff = await res.json()
      router.push(`/staff/${staff.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Render selettore livello competenza
  const renderCompetenzaSelector = (key: string, label: string) => {
    const value = (formData as any)[key]
    
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(level => (
            <button
              key={level}
              type="button"
              onClick={() => handleCompetenzaChange(key, level)}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                level <= value && level > 0
                  ? 'bg-yellow-400 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              {level === 0 ? '-' : <Star size={14} className={level <= value ? 'fill-current' : ''} />}
            </button>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/staff"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuovo Staff</h1>
          <p className="text-gray-500">Aggiungi un nuovo collaboratore tecnico</p>
        </div>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonna principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dati anagrafici */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} />
                Dati Anagrafici
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cognome *
                  </label>
                  <input
                    type="text"
                    name="cognome"
                    value={formData.cognome}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Codice Fiscale
                  </label>
                  <input
                    type="text"
                    name="codiceFiscale"
                    value={formData.codiceFiscale}
                    onChange={handleChange}
                    maxLength={16}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Nascita
                  </label>
                  <input
                    type="date"
                    name="dataNascita"
                    value={formData.dataNascita}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Contatti */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone size={20} />
                Contatti
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indirizzo
                  </label>
                  <input
                    type="text"
                    name="indirizzo"
                    value={formData.indirizzo}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Città
                  </label>
                  <input
                    type="text"
                    name="citta"
                    value={formData.citta}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CAP
                    </label>
                    <input
                      type="text"
                      name="cap"
                      value={formData.cap}
                      onChange={handleChange}
                      maxLength={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prov.
                    </label>
                    <input
                      type="text"
                      name="provincia"
                      value={formData.provincia}
                      onChange={handleChange}
                      maxLength={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Competenze */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star size={20} />
                Competenze Tecniche (1-4)
              </h2>
              
              <div className="divide-y">
                {COMPETENZE.map(c => renderCompetenzaSelector(c.key, c.label))}
              </div>
            </div>
            
            {/* Note */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Note</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note generali
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferenze operative
                  </label>
                  <textarea
                    name="preferenzeOperative"
                    value={formData.preferenzeOperative}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Es: No notturni, no eventi fuori provincia..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Colonna laterale */}
          <div className="space-y-6">
            {/* Tipo collaboratore */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tipo Collaboratore
              </h2>
              
              <select
                name="tipoCollaboratore"
                value={formData.tipoCollaboratore}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {TIPI_COLLABORATORE.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            
            {/* Costi */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Euro size={20} />
                Costi
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo Gettone (€)
                  </label>
                  <input
                    type="number"
                    name="costoGettone"
                    value={formData.costoGettone}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Es: 150.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo Orario (€)
                  </label>
                  <input
                    type="number"
                    name="costoOrario"
                    value={formData.costoOrario}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Es: 15.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IBAN
                  </label>
                  <input
                    type="text"
                    name="iban"
                    value={formData.iban}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="IT..."
                  />
                </div>
              </div>
            </div>
            
            {/* Automezzo */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Car size={20} />
                Patente e Automezzo
              </h2>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="patente"
                    checked={formData.patente}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Ha patente</span>
                </label>
                
                {formData.patente && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipologia Patente
                    </label>
                    <input
                      type="text"
                      name="tipologiaPatente"
                      value={formData.tipologiaPatente}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Es: B, C, D..."
                    />
                  </div>
                )}
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="automunito"
                    checked={formData.automunito}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Automunito</span>
                </label>
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
                disabled={loading || !formData.nome || !formData.cognome}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                Salva Staff
              </button>
              
              <Link
                href="/staff"
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
