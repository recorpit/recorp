// src/app/(dashboard)/format/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit2, Trash2, Building2, Users, Check, X, ChevronDown, ChevronUp, UserPlus } from 'lucide-react'
import Modal from '@/components/Modal'

interface Committente {
  id: string
  ragioneSociale: string
  partitaIva: string
}

interface User {
  id: string
  nome: string
  cognome: string
  email: string
}

interface UserFormat {
  id: string
  user: User
}

interface Format {
  id: string
  nome: string
  descrizione: string | null
  tipoFatturazione: 'COMMITTENTE' | 'EVERYONE'
  attivo: boolean
  committenti?: { committente: Committente }[]
  utentiAbilitati?: UserFormat[]
  _count?: {
    agibilita: number
  }
}

export default function FormatPage() {
  const [formats, setFormats] = useState<Format[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editingFormat, setEditingFormat] = useState<Format | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Modal aggiungi utente
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<Format | null>(null)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  
  // Ricerca committenti nel modal
  const [searchCommittente, setSearchCommittente] = useState('')
  
  // Form
  const [form, setForm] = useState({
    nome: '',
    descrizione: '',
    tipoFatturazione: 'COMMITTENTE' as 'COMMITTENTE' | 'EVERYONE',
    attivo: true,
    committentiIds: [] as string[],
  })
  
  // Committenti disponibili per selezione
  const [committentiDisponibili, setCommittentiDisponibili] = useState<Committente[]>([])
  
  // Carica dati
  useEffect(() => {
    loadFormats()
    loadCommittenti()
  }, [])
  
  const loadFormats = async () => {
    try {
      const res = await fetch('/api/formats')
      const data = await res.json()
      setFormats(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Errore caricamento format:', err)
      setFormats([])
    } finally {
      setLoading(false)
    }
  }
  
  const loadCommittenti = async () => {
    try {
      const res = await fetch('/api/committenti')
      const data = await res.json()
      setCommittentiDisponibili(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Errore caricamento committenti:', err)
      setCommittentiDisponibili([])
    }
  }
  
  const loadAvailableUsers = async (formatId: string) => {
    try {
      // Carica utenti che possono essere format manager
      const res = await fetch('/api/utenti?ruolo=FORMAT_MANAGER')
      if (res.ok) {
        const data = await res.json()
        setAvailableUsers(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Errore caricamento utenti:', err)
      setAvailableUsers([])
    }
  }
  
  const openModal = (format?: Format) => {
    setSearchCommittente('') // Reset ricerca committenti
    if (format) {
      setEditingFormat(format)
      setForm({
        nome: format.nome,
        descrizione: format.descrizione || '',
        tipoFatturazione: format.tipoFatturazione,
        attivo: format.attivo,
        committentiIds: (format.committenti || []).map(c => c.committente.id),
      })
    } else {
      setEditingFormat(null)
      setForm({
        nome: '',
        descrizione: '',
        tipoFatturazione: 'COMMITTENTE',
        attivo: true,
        committentiIds: [],
      })
    }
    setError('')
    setShowModal(true)
  }
  
  const openUserModal = (format: Format) => {
    setSelectedFormat(format)
    setSelectedUserId('')
    loadAvailableUsers(format.id)
    setShowUserModal(true)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    
    try {
      const url = editingFormat ? `/api/formats/${editingFormat.id}` : '/api/formats'
      const method = editingFormat ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Errore nel salvataggio')
      }
      
      setShowModal(false)
      loadFormats()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleAddUser = async () => {
    if (!selectedFormat || !selectedUserId) return
    setSaving(true)
    
    try {
      // Aggiungi il nuovo
      const res = await fetch(`/api/utenti/${selectedUserId}/format`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          formatIds: [selectedFormat.id] 
        })
      })
      
      if (res.ok) {
        setShowUserModal(false)
        loadFormats()
      }
    } catch (err) {
      alert('Errore nell\'aggiunta')
    } finally {
      setSaving(false)
    }
  }
  
  const handleRemoveUser = async (formatId: string, userId: string) => {
    if (!confirm('Rimuovere questo utente dal format?')) return
    
    try {
      // Ottieni i format attuali dell'utente
      const userRes = await fetch(`/api/utenti/${userId}/format`)
      const userFormats = await userRes.json()
      
      // Rimuovi questo format
      const newFormatIds = userFormats
        .filter((f: any) => f.id !== formatId)
        .map((f: any) => f.id)
      
      const res = await fetch(`/api/utenti/${userId}/format`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formatIds: newFormatIds })
      })
      
      if (res.ok) {
        loadFormats()
      }
    } catch (err) {
      alert('Errore nella rimozione')
    }
  }
  
  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo format?')) return
    
    try {
      const res = await fetch(`/api/formats/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Errore eliminazione')
      loadFormats()
    } catch (err) {
      alert('Errore nell\'eliminazione')
    }
  }
  
  const toggleCommittente = (id: string) => {
    setForm(prev => ({
      ...prev,
      committentiIds: prev.committentiIds.includes(id)
        ? prev.committentiIds.filter(c => c !== id)
        : [...prev.committentiIds, id]
    }))
  }
  
  // Filtro ricerca format
  const filtered = (formats || []).filter(f => 
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    f.descrizione?.toLowerCase().includes(search.toLowerCase())
  )
  
  // Filtro committenti nel modal
  const committentiFiltrati = (committentiDisponibili || []).filter(c => 
    !searchCommittente || 
    c.ragioneSociale.toLowerCase().includes(searchCommittente.toLowerCase()) ||
    c.partitaIva?.toLowerCase().includes(searchCommittente.toLowerCase())
  )
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Format</h1>
          <p className="text-gray-500">Gestione format eventi (es. 2000 Wonderland, 90 Wonderland)</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuovo Format
        </button>
      </div>
      
      {/* Ricerca */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca format..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Building2 size={48} className="mx-auto" />
          </div>
          <p className="text-gray-500">
            {search ? 'Nessun format trovato' : 'Nessun format creato'}
          </p>
          {!search && (
            <button 
              onClick={() => openModal()}
              className="mt-4 text-blue-600 hover:underline"
            >
              Crea il primo format
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(format => {
            const committentiCount = format.committenti?.length || 0
            const utentiCount = format.utentiAbilitati?.length || 0
            const agibilitaCount = format._count?.agibilita || 0
            
            return (
              <div key={format.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === format.id ? null : format.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${format.attivo ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Building2 className={format.attivo ? 'text-blue-600' : 'text-gray-400'} size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{format.nome}</h3>
                        {!format.attivo && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Disattivo</span>
                        )}
                        {format.tipoFatturazione === 'EVERYONE' && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Everyone</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {committentiCount} committent{committentiCount === 1 ? 'e' : 'i'} • 
                        {utentiCount} utent{utentiCount === 1 ? 'e' : 'i'} • 
                        {agibilitaCount} agibilità
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal(format) }}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(format.id) }}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    {expandedId === format.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
                
                {/* Dettagli espansi */}
                {expandedId === format.id && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      {/* Committenti */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Building2 size={16} />
                          Committenti Collegati
                        </h4>
                        {committentiCount === 0 ? (
                          <p className="text-sm text-gray-400">Nessun committente</p>
                        ) : (
                          <ul className="space-y-1">
                            {(format.committenti || []).map(fc => (
                              <li key={fc.committente.id} className="text-sm text-gray-600">
                                {fc.committente.ragioneSociale}
                                <span className="text-gray-400 ml-2">({fc.committente.partitaIva})</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      
                      {/* Utenti abilitati */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Users size={16} />
                            Utenti Abilitati
                          </h4>
                          <button
                            onClick={(e) => { e.stopPropagation(); openUserModal(format) }}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <UserPlus size={14} />
                            Aggiungi
                          </button>
                        </div>
                        {utentiCount === 0 ? (
                          <p className="text-sm text-gray-400">Nessun utente</p>
                        ) : (
                          <ul className="space-y-1">
                            {(format.utentiAbilitati || []).map(uf => (
                              <li key={uf.id} className="text-sm text-gray-600 flex items-center justify-between group">
                                <span>
                                  {uf.user.nome} {uf.user.cognome}
                                  <span className="text-gray-400 ml-2">({uf.user.email})</span>
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRemoveUser(format.id, uf.user.id) }}
                                  className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Rimuovi"
                                >
                                  <X size={14} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    
                    {format.descrizione && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600">{format.descrizione}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      
      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingFormat ? 'Modifica Format' : 'Nuovo Format'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
              required
              placeholder="Es. 2000 Wonderland"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
            <textarea
              value={form.descrizione}
              onChange={(e) => setForm(prev => ({ ...prev, descrizione: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Fatturazione</label>
            <select
              value={form.tipoFatturazione}
              onChange={(e) => setForm(prev => ({ ...prev, tipoFatturazione: e.target.value as 'COMMITTENTE' | 'EVERYONE' }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="COMMITTENTE">Fattura al Committente del Format</option>
              <option value="EVERYONE">Everyone (RECORP fattura al locale)</option>
            </select>
            {form.tipoFatturazione === 'EVERYONE' && (
              <p className="text-xs text-gray-500 mt-1">
                Con Everyone, di default si fattura al locale ma può essere modificato in fase di creazione agibilità.
              </p>
            )}
          </div>
          
          {/* Committenti Collegati con ricerca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Committenti Collegati</label>
            
            {/* Campo ricerca committenti */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchCommittente}
                onChange={(e) => setSearchCommittente(e.target.value)}
                placeholder="Cerca committente per nome o P.IVA..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {searchCommittente && (
                <button
                  type="button"
                  onClick={() => setSearchCommittente('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
              {committentiDisponibili.length === 0 ? (
                <p className="p-3 text-sm text-gray-500">Nessun committente disponibile</p>
              ) : committentiFiltrati.length === 0 ? (
                <p className="p-3 text-sm text-gray-500">Nessun committente trovato per &quot;{searchCommittente}&quot;</p>
              ) : (
                committentiFiltrati.map(c => (
                  <label 
                    key={c.id} 
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={form.committentiIds.includes(c.id)}
                      onChange={() => toggleCommittente(c.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{c.ragioneSociale}</div>
                      <div className="text-xs text-gray-500">{c.partitaIva}</div>
                    </div>
                    {form.committentiIds.includes(c.id) && (
                      <Check size={16} className="text-blue-600 flex-shrink-0" />
                    )}
                  </label>
                ))
              )}
            </div>
            
            {form.committentiIds.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {form.committentiIds.length} committent{form.committentiIds.length === 1 ? 'e' : 'i'} selezionat{form.committentiIds.length === 1 ? 'o' : 'i'}
              </p>
            )}
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.attivo}
              onChange={(e) => setForm(prev => ({ ...prev, attivo: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Format attivo</span>
          </label>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Modal Aggiungi Utente */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={`Aggiungi utente a "${selectedFormat?.nome}"`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seleziona Format Manager</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Seleziona --</option>
              {availableUsers
                .filter(u => !(selectedFormat?.utentiAbilitati || []).some(uf => uf.user.id === u.id))
                .map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nome} {u.cognome} ({u.email})
                  </option>
                ))
              }
            </select>
          </div>
          
          <p className="text-sm text-gray-500">
            Puoi creare nuovi Format Manager dalla pagina <Link href="/utenti" className="text-blue-600 hover:underline">Utenti</Link>.
          </p>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              onClick={handleAddUser}
              disabled={saving || !selectedUserId}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Aggiunta...' : 'Aggiungi'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}