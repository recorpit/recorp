// src/components/PermessiModal.tsx
// Modal per gestione permessi utente

'use client'

import { useState, useEffect } from 'react'
import { 
  X, Check, Loader2, Shield, RotateCcw,
  LayoutDashboard, Users, MapPin, Building2, FileText,
  Receipt, CreditCard, FileCheck, UserCog, Settings,
  BarChart3, Sparkles, ChevronDown, ChevronRight, Info
} from 'lucide-react'

interface Permesso {
  id: string
  codice: string
  nome: string
  modulo: string
  azione: string
  attivo: boolean
  daRuolo: boolean
  fonte: 'ruolo' | 'custom_aggiunto' | 'custom_revocato' | 'nessuno'
}

interface UserInfo {
  id: string
  nome: string
  cognome: string
  ruolo: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
}

// Icone per moduli
const MODULO_ICONS: Record<string, any> = {
  dashboard: LayoutDashboard,
  artisti: Users,
  locali: MapPin,
  committenti: Building2,
  agibilita: FileText,
  fatture: Receipt,
  pagamenti: CreditCard,
  prestazioni: FileCheck,
  utenti: UserCog,
  impostazioni: Settings,
  report: BarChart3,
  formats: Sparkles,
}

const MODULO_NOMI: Record<string, string> = {
  dashboard: 'Dashboard',
  artisti: 'Artisti',
  locali: 'Locali',
  committenti: 'Committenti',
  agibilita: 'Agibilità',
  fatture: 'Fatture',
  pagamenti: 'Pagamenti',
  prestazioni: 'Prestazioni',
  utenti: 'Utenti',
  impostazioni: 'Impostazioni',
  report: 'Report',
  formats: 'Format',
}

export default function PermessiModal({ isOpen, onClose, userId }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [permessi, setPermessi] = useState<Permesso[]>([])
  const [perModulo, setPerModulo] = useState<Record<string, Permesso[]>>({})
  const [expandedModuli, setExpandedModuli] = useState<Set<string>>(new Set())
  const [modifiche, setModifiche] = useState<Map<string, boolean>>(new Map())
  
  useEffect(() => {
    if (isOpen && userId) {
      loadPermessi()
    }
  }, [isOpen, userId])
  
  const loadPermessi = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/utenti/${userId}/permessi`)
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setPermessi(data.permessi)
        setPerModulo(data.perModulo)
        setModifiche(new Map())
        // Espandi tutti i moduli di default
        setExpandedModuli(new Set(Object.keys(data.perModulo)))
      }
    } catch (err) {
      console.error('Errore caricamento permessi:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const toggleModulo = (modulo: string) => {
    setExpandedModuli(prev => {
      const next = new Set(prev)
      if (next.has(modulo)) {
        next.delete(modulo)
      } else {
        next.add(modulo)
      }
      return next
    })
  }
  
  const togglePermesso = (permesso: Permesso) => {
    const nuovoStato = !getStatoEffettivo(permesso)
    setModifiche(prev => {
      const next = new Map(prev)
      next.set(permesso.id, nuovoStato)
      return next
    })
  }
  
  const getStatoEffettivo = (permesso: Permesso): boolean => {
    if (modifiche.has(permesso.id)) {
      return modifiche.get(permesso.id)!
    }
    return permesso.attivo
  }
  
  const getStatoVisivo = (permesso: Permesso): { colore: string, label: string } => {
    const modificato = modifiche.has(permesso.id)
    const attivo = getStatoEffettivo(permesso)
    
    if (modificato) {
      return attivo 
        ? { colore: 'bg-green-500', label: 'Verrà aggiunto' }
        : { colore: 'bg-red-500', label: 'Verrà revocato' }
    }
    
    switch (permesso.fonte) {
      case 'ruolo':
        return { colore: 'bg-blue-500', label: 'Dal ruolo' }
      case 'custom_aggiunto':
        return { colore: 'bg-green-500', label: 'Aggiunto custom' }
      case 'custom_revocato':
        return { colore: 'bg-red-500', label: 'Revocato custom' }
      default:
        return { colore: 'bg-gray-300', label: 'Non attivo' }
    }
  }
  
  const toggleTuttoModulo = (modulo: string, attiva: boolean) => {
    const permessiModulo = perModulo[modulo] || []
    setModifiche(prev => {
      const next = new Map(prev)
      for (const p of permessiModulo) {
        next.set(p.id, attiva)
      }
      return next
    })
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      // Costruisci array permessi con stato finale
      const permessiFinali = permessi.map(p => ({
        permessoId: p.id,
        concesso: getStatoEffettivo(p)
      }))
      
      const res = await fetch(`/api/utenti/${userId}/permessi`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permessi: permessiFinali })
      })
      
      if (res.ok) {
        onClose()
      } else {
        alert('Errore nel salvataggio')
      }
    } catch (err) {
      console.error('Errore salvataggio:', err)
      alert('Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }
  
  const handleReset = async () => {
    if (!confirm('Ripristinare i permessi di default del ruolo?')) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/utenti/${userId}/permessi`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        loadPermessi()
      }
    } catch (err) {
      console.error('Errore reset:', err)
    } finally {
      setSaving(false)
    }
  }
  
  if (!isOpen) return null
  
  const hasModifiche = modifiche.size > 0
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-600" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Gestione Permessi
              </h3>
              {user && (
                <p className="text-sm text-gray-500">
                  {user.nome} {user.cognome} - Ruolo: {user.ruolo}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Legenda */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Dal ruolo</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Aggiunto</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Revocato</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span>Non attivo</span>
                </div>
              </div>
              
              {Object.entries(perModulo).map(([modulo, permessiModulo]) => {
                const Icon = MODULO_ICONS[modulo] || FileText
                const expanded = expandedModuli.has(modulo)
                const tuttiAttivi = permessiModulo.every(p => getStatoEffettivo(p))
                const nessunoAttivo = permessiModulo.every(p => !getStatoEffettivo(p))
                
                return (
                  <div key={modulo} className="border rounded-lg overflow-hidden">
                    {/* Header modulo */}
                    <div 
                      className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleModulo(modulo)}
                    >
                      <div className="flex items-center gap-3">
                        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <Icon size={18} className="text-gray-600" />
                        <span className="font-medium text-gray-900">
                          {MODULO_NOMI[modulo] || modulo}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({permessiModulo.filter(p => getStatoEffettivo(p)).length}/{permessiModulo.length})
                        </span>
                      </div>
                      
                      {/* Toggle tutto */}
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => toggleTuttoModulo(modulo, true)}
                          className={`px-2 py-1 text-xs rounded ${tuttiAttivi ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-green-50'}`}
                        >
                          Tutti
                        </button>
                        <button
                          onClick={() => toggleTuttoModulo(modulo, false)}
                          className={`px-2 py-1 text-xs rounded ${nessunoAttivo ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
                        >
                          Nessuno
                        </button>
                      </div>
                    </div>
                    
                    {/* Permessi modulo */}
                    {expanded && (
                      <div className="divide-y">
                        {permessiModulo.map(permesso => {
                          const stato = getStatoVisivo(permesso)
                          const attivo = getStatoEffettivo(permesso)
                          const modificato = modifiche.has(permesso.id)
                          
                          return (
                            <label 
                              key={permesso.id}
                              className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 ${modificato ? 'bg-yellow-50' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={attivo}
                                  onChange={() => togglePermesso(permesso)}
                                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                  <span className="text-gray-900">{permesso.nome}</span>
                                  <span className="ml-2 text-xs text-gray-400">
                                    {permesso.codice}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {modificato && (
                                  <span className="text-xs text-yellow-600 font-medium">
                                    Modificato
                                  </span>
                                )}
                                <div 
                                  className={`w-2.5 h-2.5 rounded-full ${stato.colore}`}
                                  title={stato.label}
                                />
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <RotateCcw size={16} />
            Ripristina Default
          </button>
          
          <div className="flex items-center gap-3">
            {hasModifiche && (
              <span className="text-sm text-yellow-600">
                {modifiche.size} modifiche non salvate
              </span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasModifiche}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              Salva Permessi
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
