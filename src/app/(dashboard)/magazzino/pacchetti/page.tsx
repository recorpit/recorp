// src/app/(dashboard)/magazzino/pacchetti/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Package,
  Loader2,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface Pacchetto {
  id: string
  codice: string
  nome: string
  descrizione: string | null
  categoria: string | null
  prezzoNoleggio: number | null
  attivo: boolean
  materiali: {
    quantita: number
    materiale: {
      id: string
      codice: string
      nome: string
      categoria: string
      quantitaDisponibile: number
    }
  }[]
  _count: {
    materiali: number
    eventiPacchetto: number
  }
}

export default function PacchettiPage() {
  const [pacchetti, setPacchetti] = useState<Pacchetto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // Modal nuovo pacchetto
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    codice: '',
    nome: '',
    descrizione: '',
    categoria: '',
    prezzoNoleggio: '',
  })
  
  useEffect(() => {
    loadPacchetti()
  }, [])
  
  const loadPacchetti = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/magazzino/pacchetti')
      if (!res.ok) throw new Error('Errore caricamento')
      const data = await res.json()
      setPacchetti(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const pacchettiFiltrati = useMemo(() => {
    if (!searchQuery) return pacchetti
    
    const query = searchQuery.toLowerCase()
    return pacchetti.filter(p => 
      p.codice?.toLowerCase().includes(query) ||
      p.nome?.toLowerCase().includes(query) ||
      p.descrizione?.toLowerCase().includes(query)
    )
  }, [pacchetti, searchQuery])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    
    try {
      const res = await fetch('/api/magazzino/pacchetti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nella creazione')
      }
      
      setShowModal(false)
      setFormData({ codice: '', nome: '', descrizione: '', categoria: '', prezzoNoleggio: '' })
      loadPacchetti()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  const generateCode = () => {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    setFormData(prev => ({ ...prev, codice: `PKG-${random}` }))
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacchetti</h1>
          <p className="text-gray-500">Kit preconfigurati di materiali</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuovo Pacchetto
        </button>
      </div>
      
      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cerca pacchetti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">Chiudi</button>
        </div>
      )}
      
      {/* Lista Pacchetti */}
      <div className="space-y-4">
        {pacchettiFiltrati.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
            <Package className="mx-auto mb-2 text-gray-300" size={48} />
            {pacchetti.length === 0 ? (
              <>
                <p>Nessun pacchetto creato</p>
                <button 
                  onClick={() => setShowModal(true)}
                  className="text-blue-600 hover:underline mt-2"
                >
                  Crea il primo pacchetto
                </button>
              </>
            ) : (
              <p>Nessun risultato per "{searchQuery}"</p>
            )}
          </div>
        ) : (
          pacchettiFiltrati.map(p => {
            const isExpanded = expandedId === p.id
            
            return (
              <div key={p.id} className={`bg-white rounded-lg shadow-sm ${!p.attivo ? 'opacity-50' : ''}`}>
                {/* Header pacchetto */}
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="text-purple-600" size={24} />
                    </div>
                    <div>
                      <p className="font-mono text-sm text-gray-500">{p.codice}</p>
                      <h3 className="font-semibold text-gray-900">{p.nome}</h3>
                      {p.descrizione && (
                        <p className="text-sm text-gray-500 line-clamp-1">{p.descrizione}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{p._count.materiali}</p>
                      <p className="text-xs text-gray-500">materiali</p>
                    </div>
                    
                    {p.prezzoNoleggio && (
                      <div className="text-right">
                        <p className="font-semibold text-green-600">€ {p.prezzoNoleggio}</p>
                        <p className="text-xs text-gray-500">noleggio</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/magazzino/pacchetti/${p.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit size={18} className="text-gray-500" />
                      </Link>
                      {isExpanded ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Contenuto espanso */}
                {isExpanded && p.materiali.length > 0 && (
                  <div className="border-t px-4 py-3 bg-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-2">Contenuto pacchetto:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {p.materiali.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border">
                          <div>
                            <p className="text-sm font-medium">{m.materiale.nome}</p>
                            <p className="text-xs text-gray-500">{m.materiale.codice}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">x{m.quantita}</span>
                            <p className={`text-xs ${
                              m.materiale.quantitaDisponibile >= m.quantita 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              Disp: {m.materiale.quantitaDisponibile}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      
      {/* Modal Nuovo Pacchetto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Nuovo Pacchetto</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Codice *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.codice}
                    onChange={(e) => setFormData(prev => ({ ...prev, codice: e.target.value }))}
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                    placeholder="PKG-001"
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
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Es: Kit Audio Base"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione
                </label>
                <textarea
                  value={formData.descrizione}
                  onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Es: Audio, Luci, Video..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prezzo Noleggio (€)
                </label>
                <input
                  type="number"
                  value={formData.prezzoNoleggio}
                  onChange={(e) => setFormData(prev => ({ ...prev, prezzoNoleggio: e.target.value }))}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.codice || !formData.nome}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="animate-spin" size={18} />}
                  Crea Pacchetto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
