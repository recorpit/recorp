// src/app/(dashboard)/utenti/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Users, Search, Plus, Trash2,
  Shield, UserCog, Music, Building2, Sparkles,
  Mail, Key, CheckCircle, XCircle, AlertCircle,
  RefreshCw, MoreVertical, Loader2, Eye, EyeOff
} from 'lucide-react'
import Modal from '@/components/Modal'
import PermessiModal from '@/components/PermessiModal'

// Tipi
interface Format {
  id: string
  nome: string
}

interface User {
  id: string
  email: string
  nome: string
  cognome: string
  telefono: string | null
  ruolo: 'ADMIN' | 'OPERATORE' | 'ARTISTICO' | 'PRODUZIONE' | 'FORMAT_MANAGER'
  stato: 'PENDING' | 'EMAIL_VERIFICATA' | 'CONTRATTO_INVIATO' | 'IN_APPROVAZIONE' | 'ATTIVO' | 'SOSPESO'
  emailVerificata: boolean
  attivo: boolean
  createdAt: string
  lastLoginAt: string | null
  formatGestiti?: {
    format: Format
  }[]
}

// Badge stato
const StatoBadge = ({ stato }: { stato: string }) => {
  const config: Record<string, { bg: string, text: string, label: string }> = {
    PENDING: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'In attesa verifica' },
    EMAIL_VERIFICATA: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Email verificata' },
    CONTRATTO_INVIATO: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Contratto inviato' },
    IN_APPROVAZIONE: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'In approvazione' },
    ATTIVO: { bg: 'bg-green-100', text: 'text-green-700', label: 'Attivo' },
    SOSPESO: { bg: 'bg-red-100', text: 'text-red-700', label: 'Sospeso' },
  }
  const c = config[stato] || config.PENDING
  return <span className={`text-xs px-2 py-1 rounded-full ${c.bg} ${c.text}`}>{c.label}</span>
}

// Badge ruolo
const RuoloBadge = ({ ruolo }: { ruolo: string }) => {
  const config: Record<string, { icon: any, bg: string, text: string, label: string }> = {
    ADMIN: { icon: Shield, bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin' },
    OPERATORE: { icon: UserCog, bg: 'bg-blue-100', text: 'text-blue-700', label: 'Operatore' },
    ARTISTICO: { icon: Music, bg: 'bg-pink-100', text: 'text-pink-700', label: 'Artista' },
    PRODUZIONE: { icon: Building2, bg: 'bg-teal-100', text: 'text-teal-700', label: 'Produzione' },
    FORMAT_MANAGER: { icon: Sparkles, bg: 'bg-amber-100', text: 'text-amber-700', label: 'Format Manager' },
  }
  const c = config[ruolo] || config.OPERATORE
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${c.bg} ${c.text}`}>
      <Icon size={12} />
      {c.label}
    </span>
  )
}

export default function UtentiPage() {
  const [users, setUsers] = useState<User[]>([])
  const [formats, setFormats] = useState<Format[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroRuolo, setFiltroRuolo] = useState<string>('')
  const [filtroStato, setFiltroStato] = useState<string>('')
  
  // Stati azioni
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null)
  
  // Modal nuovo utente
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Modal assegna format
  const [showFormatModal, setShowFormatModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedFormats, setSelectedFormats] = useState<string[]>([])
  
  // Modal permessi
  const [showPermessiModal, setShowPermessiModal] = useState(false)
  const [permessiUserId, setPermessiUserId] = useState<string>('')
  
  // Dropdown azioni aperto
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  
  // Form nuovo utente
  const [form, setForm] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    ruolo: 'OPERATORE' as 'ADMIN' | 'OPERATORE' | 'FORMAT_MANAGER',
    formatIds: [] as string[],
    inviaEmail: true,
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  
  useEffect(() => {
    loadUsers()
    loadFormats()
  }, [])
  
  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])
  
  const loadUsers = async () => {
    try {
      const res = await fetch('/api/utenti')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (err) {
      console.error('Errore caricamento utenti:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const loadFormats = async () => {
    try {
      const res = await fetch('/api/formats?attivo=true')
      if (res.ok) {
        const data = await res.json()
        setFormats(data)
      }
    } catch (err) {
      console.error('Errore caricamento format:', err)
    }
  }
  
  // Reset form
  const resetForm = () => {
    setForm({
      nome: '',
      cognome: '',
      email: '',
      telefono: '',
      ruolo: 'OPERATORE',
      formatIds: [],
      inviaEmail: true,
      password: '',
    })
    setError('')
  }
  
  // Crea nuovo utente
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    
    try {
      const res = await fetch('/api/utenti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Errore nella creazione')
      }
      
      setShowModal(false)
      resetForm()
      loadUsers()
      
      // Mostra notifica appropriata
      if (data.warning) {
        setNotification({ type: 'warning', message: data.warning })
      } else {
        setNotification({ type: 'success', message: data.message || 'Utente creato!' })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  // Reinvia email verifica
  const handleReinviaVerifica = async (user: User) => {
    setActionLoading(user.id)
    setOpenDropdown(null)
    
    try {
      const res = await fetch(`/api/utenti/${user.id}/reinvia-verifica`, { method: 'POST' })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setNotification({ type: 'success', message: `Email di verifica inviata a ${user.email}` })
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message })
    } finally {
      setActionLoading(null)
    }
  }
  
  // Reset password
  const handleResetPassword = async (user: User) => {
    if (!confirm(`Inviare email di reset password a ${user.email}?`)) return
    
    setActionLoading(user.id)
    setOpenDropdown(null)
    
    try {
      const res = await fetch(`/api/utenti/${user.id}/reset-password`, { method: 'POST' })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setNotification({ type: 'success', message: `Email di reset password inviata a ${user.email}` })
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message })
    } finally {
      setActionLoading(null)
    }
  }
  
  // Approva utente
  const handleApprova = async (user: User) => {
    if (!confirm(`Approvare ${user.nome} ${user.cognome}?`)) return
    
    setActionLoading(user.id)
    
    try {
      const res = await fetch(`/api/utenti/${user.id}/approva`, { method: 'POST' })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      loadUsers()
      setNotification({ type: 'success', message: 'Utente approvato!' })
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message })
    } finally {
      setActionLoading(null)
    }
  }
  
  // Sospendi/Riattiva
  const handleToggleSospensione = async (user: User) => {
    const azione = user.stato === 'SOSPESO' ? 'riattivare' : 'sospendere'
    if (!confirm(`Vuoi ${azione} ${user.nome} ${user.cognome}?`)) return
    
    setActionLoading(user.id)
    setOpenDropdown(null)
    
    try {
      const res = await fetch(`/api/utenti/${user.id}/sospendi`, { method: 'POST' })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      loadUsers()
      setNotification({ type: 'success', message: data.message })
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message })
    } finally {
      setActionLoading(null)
    }
  }
  
  // Elimina utente
  const handleDelete = async (user: User) => {
    if (!confirm(`Eliminare ${user.nome} ${user.cognome}? L'azione è irreversibile.`)) return
    
    setActionLoading(user.id)
    setOpenDropdown(null)
    
    try {
      const res = await fetch(`/api/utenti/${user.id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      loadUsers()
      setNotification({ type: 'success', message: 'Utente eliminato' })
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message })
    } finally {
      setActionLoading(null)
    }
  }
  
  // Apri modal assegna format
  const openFormatModal = (user: User) => {
    setSelectedUser(user)
    setSelectedFormats(user.formatGestiti?.map(f => f.format.id) || [])
    setShowFormatModal(true)
    setOpenDropdown(null)
  }
  
  // Apri modal permessi
  const openPermessiModal = (user: User) => {
    setPermessiUserId(user.id)
    setShowPermessiModal(true)
    setOpenDropdown(null)
  }
  
  // Salva format
  const handleSaveFormats = async () => {
    if (!selectedUser) return
    setSaving(true)
    
    try {
      const res = await fetch(`/api/utenti/${selectedUser.id}/format`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formatIds: selectedFormats })
      })
      
      if (!res.ok) throw new Error('Errore nel salvataggio')
      
      setShowFormatModal(false)
      loadUsers()
      setNotification({ type: 'success', message: 'Format aggiornati' })
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }
  
  // Filtro utenti
  const filtered = users.filter(u => {
    const matchSearch = 
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.cognome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    
    const matchRuolo = !filtroRuolo || u.ruolo === filtroRuolo
    const matchStato = !filtroStato || u.stato === filtroStato
    
    return matchSearch && matchRuolo && matchStato
  })
  
  return (
    <div>
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200' : 
          notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
          ) : notification.type === 'warning' ? (
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
          ) : (
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          )}
          <span className={
            notification.type === 'success' ? 'text-green-700' : 
            notification.type === 'warning' ? 'text-yellow-700' :
            'text-red-700'
          }>
            {notification.message}
          </span>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Utenti</h1>
          <p className="text-gray-500">Amministra utenti, approvazioni e permessi</p>
        </div>
        <button 
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuovo Utente
        </button>
      </div>
      
      {/* Filtri */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca utente..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={filtroRuolo}
            onChange={(e) => setFiltroRuolo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti i ruoli</option>
            <option value="ADMIN">Admin</option>
            <option value="OPERATORE">Operatore</option>
            <option value="FORMAT_MANAGER">Format Manager</option>
            <option value="ARTISTICO">Artista</option>
            <option value="PRODUZIONE">Produzione</option>
          </select>
          <select
            value={filtroStato}
            onChange={(e) => setFiltroStato(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti gli stati</option>
            <option value="PENDING">In attesa verifica</option>
            <option value="EMAIL_VERIFICATA">Email verificata</option>
            <option value="IN_APPROVAZIONE">In approvazione</option>
            <option value="ATTIVO">Attivo</option>
            <option value="SOSPESO">Sospeso</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contatti</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruolo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ultimo accesso</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {user.nome[0]}{user.cognome[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.nome} {user.cognome}</p>
                        {user.formatGestiti && user.formatGestiti.length > 0 && (
                          <p className="text-xs text-amber-600">
                            {user.formatGestiti.map(f => f.format.nome).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-gray-900">{user.email}</p>
                      {user.telefono && <p className="text-gray-500">{user.telefono}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RuoloBadge ruolo={user.ruolo} />
                  </td>
                  <td className="px-6 py-4">
                    <StatoBadge stato={user.stato} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.lastLoginAt 
                      ? new Date(user.lastLoginAt).toLocaleString('it-IT')
                      : 'Mai'
                    }
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* Azioni rapide */}
                      {user.stato === 'IN_APPROVAZIONE' && (
                        <button
                          onClick={() => handleApprova(user)}
                          disabled={actionLoading === user.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Approva"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <CheckCircle size={18} />
                          )}
                        </button>
                      )}
                      
                      {/* Menu dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {openDropdown === user.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenDropdown(null)}
                            />
                            <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border z-50 py-1">
                              {/* Reinvia verifica email */}
                              {!user.emailVerificata && (
                                <button
                                  onClick={() => handleReinviaVerifica(user)}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                                >
                                  <Mail size={16} />
                                  Reinvia email verifica
                                </button>
                              )}
                              
                              {/* Reset password */}
                              <button
                                onClick={() => handleResetPassword(user)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                              >
                                <Key size={16} />
                                Reset password
                              </button>
                              
                              {/* Gestisci Permessi */}
                              <button
                                onClick={() => openPermessiModal(user)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                              >
                                <Shield size={16} />
                                Gestisci Permessi
                              </button>
                              
                              {/* Gestisci format (solo FORMAT_MANAGER) */}
                              {user.ruolo === 'FORMAT_MANAGER' && (
                                <button
                                  onClick={() => openFormatModal(user)}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                                >
                                  <Sparkles size={16} />
                                  Gestisci Format
                                </button>
                              )}
                              
                              <div className="border-t my-1" />
                              
                              {/* Sospendi/Riattiva */}
                              <button
                                onClick={() => handleToggleSospensione(user)}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-left ${
                                  user.stato === 'SOSPESO' 
                                    ? 'text-green-600 hover:bg-green-50' 
                                    : 'text-orange-600 hover:bg-orange-50'
                                }`}
                              >
                                {user.stato === 'SOSPESO' ? (
                                  <>
                                    <RefreshCw size={16} />
                                    Riattiva utente
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={16} />
                                    Sospendi utente
                                  </>
                                )}
                              </button>
                              
                              {/* Elimina */}
                              <button
                                onClick={() => handleDelete(user)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                                Elimina utente
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Users className="mx-auto mb-2" size={32} />
                    <p>Nessun utente trovato</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal Nuovo Utente */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nuovo Utente"
        size="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
              <input
                type="text"
                value={form.cognome}
                onChange={(e) => setForm(prev => ({ ...prev, cognome: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm(prev => ({ ...prev, telefono: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo *</label>
            <select
              value={form.ruolo}
              onChange={(e) => setForm(prev => ({ ...prev, ruolo: e.target.value as any }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="OPERATORE">Operatore</option>
              <option value="ADMIN">Admin</option>
              <option value="FORMAT_MANAGER">Format Manager</option>
              <option value="PRODUZIONE">Produzione</option>
            </select>
          </div>
          
          {form.ruolo === 'FORMAT_MANAGER' && formats.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format da gestire</label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg">
                {formats.map(f => (
                  <label key={f.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0">
                    <input
                      type="checkbox"
                      checked={form.formatIds.includes(f.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm(prev => ({ ...prev, formatIds: [...prev.formatIds, f.id] }))
                        } else {
                          setForm(prev => ({ ...prev, formatIds: prev.formatIds.filter(id => id !== f.id) }))
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span>{f.nome}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {/* Opzione invio email */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="inviaEmail"
                checked={form.inviaEmail}
                onChange={(e) => setForm(prev => ({ ...prev, inviaEmail: e.target.checked, password: '' }))}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="inviaEmail" className="text-sm font-medium text-gray-700">
                Invia email di invito per impostare la password
              </label>
            </div>
            
            {!form.inviaEmail && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                    required={!form.inviaEmail}
                    minLength={8}
                    placeholder="Minimo 8 caratteri"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  L'utente potrà accedere immediatamente con questa password
                </p>
              </div>
            )}
            
            {form.inviaEmail && (
              <p className="text-xs text-gray-500">
                L'utente riceverà un'email con un link per completare la registrazione e impostare la password.
              </p>
            )}
          </div>
          
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Creazione...' : form.inviaEmail ? 'Crea e Invia Invito' : 'Crea Utente'}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Modal Assegna Format */}
      <Modal
        isOpen={showFormatModal}
        onClose={() => setShowFormatModal(false)}
        title={`Assegna Format a ${selectedUser?.nome} ${selectedUser?.cognome}`}
      >
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
            {formats.map(f => (
              <label key={f.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0">
                <input
                  type="checkbox"
                  checked={selectedFormats.includes(f.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedFormats(prev => [...prev, f.id])
                    } else {
                      setSelectedFormats(prev => prev.filter(id => id !== f.id))
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span>{f.nome}</span>
              </label>
            ))}
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowFormatModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              onClick={handleSaveFormats}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Modal Permessi */}
      <PermessiModal
        isOpen={showPermessiModal}
        onClose={() => setShowPermessiModal(false)}
        userId={permessiUserId}
      />
    </div>
  )
}
