// src/app/(dashboard)/impostazioni/qualifiche/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X, AlertTriangle, GripVertical, Info } from 'lucide-react'

interface Qualifica {
  id: string
  nome: string
  codiceInps: string
  sinonimi: string | null
  attivo: boolean
  ordine: number
}

export default function QualifichePage() {
  const [qualifiche, setQualifiche] = useState<Qualifica[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form nuova qualifica
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    codiceInps: '',
    sinonimi: '',
  })
  
  // Edit mode
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({
    nome: '',
    codiceInps: '',
    sinonimi: '',
  })
  
  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    loadQualifiche()
  }, [])
  
  const loadQualifiche = async () => {
    try {
      // Prima prova a fare il seed se non ci sono qualifiche
      await fetch('/api/qualifiche?seed=true')
      
      const res = await fetch('/api/qualifiche?attive=false')
      const data = await res.json()
      setQualifiche(data)
    } catch (err) {
      setError('Errore nel caricamento delle qualifiche')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreate = async () => {
    if (!formData.nome.trim() || !formData.codiceInps.trim()) {
      setError('Nome e Codice INPS sono obbligatori')
      return
    }
    
    setSaving(true)
    setError('')
    
    try {
      const res = await fetch('/api/qualifiche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error)
      }
      
      setQualifiche([...qualifiche, data])
      setFormData({ nome: '', codiceInps: '', sinonimi: '' })
      setShowForm(false)
      setSuccess('Qualifica creata con successo')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleUpdate = async (id: string) => {
    setSaving(true)
    setError('')
    
    try {
      const res = await fetch(`/api/qualifiche/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error)
      }
      
      setQualifiche(qualifiche.map(q => q.id === id ? data : q))
      setEditingId(null)
      setSuccess('Qualifica aggiornata')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleToggleAttivo = async (qualifica: Qualifica) => {
    try {
      const res = await fetch(`/api/qualifiche/${qualifica.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attivo: !qualifica.attivo })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      
      setQualifiche(qualifiche.map(q => 
        q.id === qualifica.id ? { ...q, attivo: !q.attivo } : q
      ))
    } catch (err: any) {
      setError(err.message)
    }
  }
  
  const handleDelete = async (id: string) => {
    setSaving(true)
    setError('')
    
    try {
      const res = await fetch(`/api/qualifiche/${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error)
      }
      
      if (data.disattivata) {
        // È stata disattivata invece che eliminata
        setQualifiche(qualifiche.map(q => 
          q.id === id ? { ...q, attivo: false } : q
        ))
        setSuccess('Qualifica disattivata (usata da artisti esistenti)')
      } else {
        setQualifiche(qualifiche.filter(q => q.id !== id))
        setSuccess('Qualifica eliminata')
      }
      
      setDeleteId(null)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  const startEdit = (qualifica: Qualifica) => {
    setEditingId(qualifica.id)
    setEditData({
      nome: qualifica.nome,
      codiceInps: qualifica.codiceInps,
      sinonimi: qualifica.sinonimi || '',
    })
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Qualifiche Artisti</h1>
          <p className="text-gray-500">Gestisci le qualifiche e i codici INPS</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Nuova Qualifica
        </button>
      </div>
      
      {/* Messaggi */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertTriangle size={20} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
          <Check size={20} />
          {success}
        </div>
      )}
      
      {/* Info box */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
        <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Come funziona:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Nome:</strong> come appare nell&apos;interfaccia</li>
            <li><strong>Codice INPS:</strong> codice a 3 cifre per le agibilità</li>
            <li><strong>Sinonimi:</strong> varianti accettate nell&apos;import Excel (separati da virgola)</li>
          </ul>
        </div>
      </div>
      
      {/* Form nuova qualifica */}
      {showForm && (
        <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Nuova Qualifica</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="es. Fonico"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Codice INPS *
              </label>
              <input
                type="text"
                value={formData.codiceInps}
                onChange={(e) => setFormData({ ...formData, codiceInps: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                placeholder="es. 118"
                maxLength={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sinonimi (per import)
              </label>
              <input
                type="text"
                value={formData.sinonimi}
                onChange={(e) => setFormData({ ...formData, sinonimi: e.target.value })}
                placeholder="es. fonico,sound engineer,tecnico audio"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setShowForm(false)
                setFormData({ nome: '', codiceInps: '', sinonimi: '' })
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </div>
      )}
      
      {/* Lista qualifiche */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Codice INPS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sinonimi (import)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Attiva</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {qualifiche.map((qualifica) => (
                <tr key={qualifica.id} className={`hover:bg-gray-50 ${!qualifica.attivo ? 'opacity-50' : ''}`}>
                  {editingId === qualifica.id ? (
                    // Edit mode
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editData.nome}
                          onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editData.codiceInps}
                          onChange={(e) => setEditData({ ...editData, codiceInps: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                          maxLength={3}
                          className="w-24 px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editData.sinonimi}
                          onChange={(e) => setEditData({ ...editData, sinonimi: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdate(qualifica.id)}
                            disabled={saving}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // View mode
                    <>
                      <td className="px-6 py-4 font-medium text-gray-900">{qualifica.nome}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                          {qualifica.codiceInps}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {qualifica.sinonimi || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleAttivo(qualifica)}
                          className={`w-10 h-5 rounded-full transition-colors ${
                            qualifica.attivo ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            qualifica.attivo ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(qualifica)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Modifica"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteId(qualifica.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Elimina"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Confirm delete modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Conferma eliminazione</h3>
            <p className="text-gray-600 mb-4">
              Sei sicuro di voler eliminare questa qualifica?
              Se è usata da artisti esistenti, verrà disattivata invece che eliminata.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
