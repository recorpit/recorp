// src/app/(dashboard)/magazzino/materiali/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Package,
  Euro,
  MapPin,
  Calendar,
  Trash2,
  History,
  AlertTriangle
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

export default function MaterialeDettaglioPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    codice: '',
    nome: '',
    descrizione: '',
    categoria: 'ALTRO',
    quantitaTotale: '1',
    quantitaDisponibile: '1',
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
    attivo: true,
  })
  
  const [movimenti, setMovimenti] = useState<any[]>([])
  const [eventiMateriale, setEventiMateriale] = useState<any[]>([])
  
  useEffect(() => {
    if (id) loadMateriale()
  }, [id])
  
  const loadMateriale = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/magazzino/materiali/${id}`)
      if (!res.ok) {
        if (res.status === 404) throw new Error('Materiale non trovato')
        throw new Error('Errore caricamento')
      }
      const data = await res.json()
      
      setFormData({
        codice: data.codice || '',
        nome: data.nome || '',
        descrizione: data.descrizione || '',
        categoria: data.categoria || 'ALTRO',
        quantitaTotale: data.quantitaTotale?.toString() || '1',
        quantitaDisponibile: data.quantitaDisponibile?.toString() || '1',
        prezzoAcquisto: data.prezzoAcquisto?.toString() || '',
        prezzoNoleggio: data.prezzoNoleggio?.toString() || '',
        prezzoVendita: data.prezzoVendita?.toString() || '',
        marca: data.marca || '',
        modello: data.modello || '',
        numeroSerie: data.numeroSerie || '',
        ubicazione: data.ubicazione || '',
        stato: data.stato || 'DISPONIBILE',
        dataAcquisto: data.dataAcquisto ? data.dataAcquisto.split('T')[0] : '',
        dataScadenza: data.dataScadenza ? data.dataScadenza.split('T')[0] : '',
        ultimaManutenzione: data.ultimaManutenzione ? data.ultimaManutenzione.split('T')[0] : '',
        prossimaManutenzione: data.prossimaManutenzione ? data.prossimaManutenzione.split('T')[0] : '',
        note: data.note || '',
        consumabile: data.consumabile || false,
        attivo: data.attivo !== false,
      })
      
      setMovimenti(data.movimenti || [])
      setEventiMateriale(data.eventiMateriale || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      const res = await fetch(`/api/magazzino/materiali/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nel salvataggio')
      }
      
      setSuccess('Salvato con successo!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo materiale?')) return
    
    try {
      const res = await fetch(`/api/magazzino/materiali/${id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore eliminazione')
      }
      
      router.push('/magazzino/materiali')
    } catch (err: any) {
      setError(err.message)
    }
  }
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
  
  if (error && !formData.codice) {
    return (
      <div className="p-6 bg-red-50 rounded-lg text-red-700">
        <p>{error}</p>
        <Link href="/magazzino/materiali" className="mt-2 text-red-600 underline">
          Torna alla lista
        </Link>
      </div>
    )
  }
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/magazzino/materiali"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-sm font-mono text-gray-500">{formData.codice}</p>
            <h1 className="text-2xl font-bold text-gray-900">{formData.nome}</h1>
          </div>
        </div>
        
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={18} />
          Elimina
        </button>
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
                  <input
                    type="text"
                    name="codice"
                    value={formData.codice}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                  />
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qta Totale
                    </label>
                    <input
                      type="number"
                      name="quantitaTotale"
                      value={formData.quantitaTotale}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qta Disponibile
                    </label>
                    <input
                      type="number"
                      name="quantitaDisponibile"
                      value={formData.quantitaDisponibile}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
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
            
            {/* Storico movimenti */}
            {movimenti.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <History size={20} />
                  Ultimi Movimenti ({movimenti.length})
                </h2>
                
                <div className="space-y-2">
                  {movimenti.slice(0, 10).map((mov: any) => (
                    <div key={mov.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{mov.tipo}</p>
                        <p className="text-sm text-gray-500">{formatDate(mov.data)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${
                          mov.tipo.includes('CARICO') || mov.tipo.includes('RESO') 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {mov.tipo.includes('CARICO') || mov.tipo.includes('RESO') ? '+' : '-'}
                          {mov.quantita}
                        </span>
                        {mov.riferimento && (
                          <p className="text-xs text-gray-400">{mov.riferimento}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Eventi associati */}
            {eventiMateriale.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Eventi Associati ({eventiMateriale.length})
                </h2>
                
                <div className="space-y-2">
                  {eventiMateriale.slice(0, 10).map((em: any) => (
                    <Link
                      key={em.id}
                      href={`/produzione/eventi/${em.evento?.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div>
                        <p className="font-medium">{em.evento?.nome}</p>
                        <p className="text-sm text-gray-500">
                          {em.evento?.dataInizio && formatDate(em.evento.dataInizio)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        em.stato === 'RIENTRATO' ? 'bg-green-100 text-green-700' :
                        em.stato === 'USCITO' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {em.stato}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              >
                {STATI.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              
              <label className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  name="attivo"
                  checked={formData.attivo}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium">Materiale attivo</span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="consumabile"
                  checked={formData.consumabile}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">Consumabile</span>
              </label>
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
                placeholder="Es: Scaffale A3"
              />
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
              />
            </div>
            
            {/* Messaggi */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                {success}
              </div>
            )}
            
            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                type="submit"
                disabled={saving || !formData.codice || !formData.nome}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                Salva Modifiche
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
