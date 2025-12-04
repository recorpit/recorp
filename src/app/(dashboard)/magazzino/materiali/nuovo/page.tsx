// src/app/(dashboard)/magazzino/materiali/nuovo/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Package,
  Euro,
  MapPin,
  Calendar
} from 'lucide-react'

// Costanti
const CATEGORIE = [
  { value: 'AUDIO', label: 'Audio' },
  { value: 'LUCI', label: 'Luci' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'LED', label: 'LED' },
  { value: 'STRUTTURE', label: 'Strutture' },
  { value: 'BACKLINE', label: 'Backline' },
  { value: 'ELETTRICO', label: 'Elettrico' },
  { value: 'TRASPORTO', label: 'Trasporto' },
  { value: 'CONSUMABILE', label: 'Consumabile' },
  { value: 'ALTRO', label: 'Altro' },
]

const STATI = [
  { value: 'DISPONIBILE', label: 'Disponibile' },
  { value: 'IN_USO', label: 'In Uso' },
  { value: 'MANUTENZIONE', label: 'In Manutenzione' },
  { value: 'DANNEGGIATO', label: 'Danneggiato' },
  { value: 'DISMESSO', label: 'Dismesso' },
]

export default function NuovoMaterialePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form data
  const [formData, setFormData] = useState({
    codice: '',
    nome: '',
    descrizione: '',
    categoria: 'ALTRO',
    quantitaTotale: '1',
    prezzoAcquisto: '',
    prezzoNoleggio: '',
    prezzoVendita: '',
    marca: '',
    modello: '',
    numeroSerie: '',
    ubicazione: '',
    stato: 'DISPONIBILE',
    dataAcquisto: '',
    dataScadenza: '',
    ultimaManutenzione: '',
    prossimaManutenzione: '',
    note: '',
    consumabile: false,
  })
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }
  
  // Genera codice automatico
  const generateCode = () => {
    const prefix = formData.categoria.substring(0, 3).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    setFormData(prev => ({ ...prev, codice: `${prefix}-${random}` }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/magazzino/materiali', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nella creazione')
      }
      
      const materiale = await res.json()
      router.push(`/magazzino/materiali/${materiale.id}`)
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
          href="/magazzino/materiali"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuovo Materiale</h1>
          <p className="text-gray-500">Aggiungi un nuovo articolo al magazzino</p>
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
                <Package size={20} />
                Informazioni Base
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Codice *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="codice"
                      value={formData.codice}
                      onChange={handleChange}
                      required
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                      placeholder="Es: AUD-001"
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Auto
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIE.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
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
                    placeholder="Es: Cassa JBL PRX 815"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    name="marca"
                    value={formData.marca}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Es: JBL"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modello
                  </label>
                  <input
                    type="text"
                    name="modello"
                    value={formData.modello}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Es: PRX 815"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numero di Serie
                  </label>
                  <input
                    type="text"
                    name="numeroSerie"
                    value={formData.numeroSerie}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantità Totale
                  </label>
                  <input
                    type="number"
                    name="quantitaTotale"
                    value={formData.quantitaTotale}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
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
                    placeholder="Descrizione dettagliata del materiale..."
                  />
                </div>
              </div>
            </div>
            
            {/* Prezzi */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Euro size={20} />
                Prezzi
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prezzo Acquisto (€)
                  </label>
                  <input
                    type="number"
                    name="prezzoAcquisto"
                    value={formData.prezzoAcquisto}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prezzo Noleggio (€)
                  </label>
                  <input
                    type="number"
                    name="prezzoNoleggio"
                    value={formData.prezzoNoleggio}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prezzo Vendita (€)
                  </label>
                  <input
                    type="number"
                    name="prezzoVendita"
                    value={formData.prezzoVendita}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            
            {/* Date */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Date
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Acquisto
                  </label>
                  <input
                    type="date"
                    name="dataAcquisto"
                    value={formData.dataAcquisto}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Scadenza / Garanzia
                  </label>
                  <input
                    type="date"
                    name="dataScadenza"
                    value={formData.dataScadenza}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ultima Manutenzione
                  </label>
                  <input
                    type="date"
                    name="ultimaManutenzione"
                    value={formData.ultimaManutenzione}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prossima Manutenzione
                  </label>
                  <input
                    type="date"
                    name="prossimaManutenzione"
                    value={formData.prossimaManutenzione}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Note */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Note</h2>
              
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Note aggiuntive..."
              />
            </div>
          </div>
          
          {/* Colonna laterale */}
          <div className="space-y-6">
            {/* Stato */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Stato</h2>
              
              <select
                name="stato"
                value={formData.stato}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {STATI.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              
              <label className="flex items-center gap-3 mt-4">
                <input
                  type="checkbox"
                  name="consumabile"
                  checked={formData.consumabile}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">Materiale consumabile</span>
              </label>
              <p className="text-xs text-gray-400 mt-1">
                I consumabili vengono scalati automaticamente
              </p>
            </div>
            
            {/* Ubicazione */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Ubicazione
              </h2>
              
              <input
                type="text"
                name="ubicazione"
                value={formData.ubicazione}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Es: Scaffale A3, Magazzino 1"
              />
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
                disabled={loading || !formData.codice || !formData.nome}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                Salva Materiale
              </button>
              
              <Link
                href="/magazzino/materiali"
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
