// src/app/(dashboard)/staff/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Users,
  Loader2,
  CheckCircle,
  XCircle,
  Star,
  Filter
} from 'lucide-react'

// Costanti
const TIPO_COLLABORATORE_LABELS: Record<string, string> = {
  'INTERNO': 'Interno',
  'ESTERNO': 'Esterno',
  'OCCASIONALE': 'Occasionale',
  'PARTITA_IVA': 'P.IVA',
}

const COMPETENZE = [
  { key: 'competenzaAudio', label: 'Audio', color: 'bg-blue-500' },
  { key: 'competenzaLuci', label: 'Luci', color: 'bg-yellow-500' },
  { key: 'competenzaVideo', label: 'Video', color: 'bg-purple-500' },
  { key: 'competenzaLED', label: 'LED', color: 'bg-pink-500' },
  { key: 'competenzaRigging', label: 'Rigging', color: 'bg-red-500' },
  { key: 'competenzaStagehand', label: 'Stagehand', color: 'bg-gray-500' },
  { key: 'competenzaDJTech', label: 'DJ Tech', color: 'bg-green-500' },
  { key: 'competenzaDriver', label: 'Driver', color: 'bg-orange-500' },
]

interface Staff {
  id: string
  nome: string
  cognome: string
  email: string | null
  telefono: string | null
  tipoCollaboratore: string
  competenzaAudio: number
  competenzaLuci: number
  competenzaVideo: number
  competenzaLED: number
  competenzaRigging: number
  competenzaStagehand: number
  competenzaDJTech: number
  competenzaDriver: number
  costoGettone: number | null
  attivo: boolean
  patente: boolean
  automunito: boolean
  _count: {
    assegnazioni: number
  }
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filtri
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [filtroCompetenza, setFiltroCompetenza] = useState<string>('')
  const [filtroAttivo, setFiltroAttivo] = useState<'tutti' | 'attivi' | 'inattivi'>('attivi')
  
  // Carica staff
  useEffect(() => {
    loadStaff()
  }, [])
  
  const loadStaff = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/staff')
      if (!res.ok) throw new Error('Errore caricamento')
      const data = await res.json()
      setStaff(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Filtra staff
  const staffFiltrati = useMemo(() => {
    return staff.filter(s => {
      // Filtro ricerca
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchNome = s.nome?.toLowerCase().includes(query)
        const matchCognome = s.cognome?.toLowerCase().includes(query)
        const matchEmail = s.email?.toLowerCase().includes(query)
        const matchTel = s.telefono?.includes(query)
        
        if (!matchNome && !matchCognome && !matchEmail && !matchTel) {
          return false
        }
      }
      
      // Filtro tipo collaboratore
      if (filtroTipo && s.tipoCollaboratore !== filtroTipo) return false
      
      // Filtro competenza
      if (filtroCompetenza) {
        const comp = COMPETENZE.find(c => c.key === filtroCompetenza)
        if (comp && (s as any)[comp.key] < 1) return false
      }
      
      // Filtro attivo
      if (filtroAttivo === 'attivi' && !s.attivo) return false
      if (filtroAttivo === 'inattivi' && s.attivo) return false
      
      return true
    })
  }, [staff, searchQuery, filtroTipo, filtroCompetenza, filtroAttivo])
  
  // Statistiche
  const stats = useMemo(() => ({
    totali: staff.length,
    attivi: staff.filter(s => s.attivo).length,
    interni: staff.filter(s => s.tipoCollaboratore === 'INTERNO').length,
    esterni: staff.filter(s => s.tipoCollaboratore === 'ESTERNO').length,
  }), [staff])
  
  // Render competenza badge
  const renderCompetenzaBadge = (s: Staff) => {
    const comps = COMPETENZE.filter(c => (s as any)[c.key] >= 1)
    if (comps.length === 0) return <span className="text-gray-400 text-sm">Nessuna</span>
    
    return (
      <div className="flex flex-wrap gap-1">
        {comps.slice(0, 4).map(c => (
          <span 
            key={c.key}
            className={`px-2 py-0.5 rounded text-xs text-white ${c.color}`}
            title={`${c.label}: ${(s as any)[c.key]}/4`}
          >
            {c.label}
          </span>
        ))}
        {comps.length > 4 && (
          <span className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-600">
            +{comps.length - 4}
          </span>
        )}
      </div>
    )
  }
  
  // Render livello competenza
  const renderLivello = (livello: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map(i => (
          <Star 
            key={i} 
            size={12} 
            className={i <= livello ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} 
          />
        ))}
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg text-red-700">
        <p>{error}</p>
        <button onClick={loadStaff} className="mt-2 text-red-600 underline">
          Riprova
        </button>
      </div>
    )
  }
  
  const hasFilters = searchQuery || filtroTipo || filtroCompetenza || filtroAttivo !== 'attivi'
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Tecnico</h1>
          <p className="text-gray-500">Gestione tecnici e collaboratori</p>
        </div>
        <Link
          href="/staff/nuovo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuovo Staff
        </Link>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Totali</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totali}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Attivi</p>
          <p className="text-2xl font-bold text-green-600">{stats.attivi}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Interni</p>
          <p className="text-2xl font-bold text-blue-600">{stats.interni}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Esterni</p>
          <p className="text-2xl font-bold text-purple-600">{stats.esterni}</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cerca per nome, email, telefono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select 
            value={filtroAttivo}
            onChange={(e) => setFiltroAttivo(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="tutti">Tutti</option>
            <option value="attivi">Solo attivi</option>
            <option value="inattivi">Solo inattivi</option>
          </select>
          
          <select 
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti i tipi</option>
            {Object.entries(TIPO_COLLABORATORE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <select 
            value={filtroCompetenza}
            onChange={(e) => setFiltroCompetenza(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutte le competenze</option>
            {COMPETENZE.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        
        {/* Contatore risultati */}
        {hasFilters && (
          <div className="mt-3 text-sm text-gray-500">
            {staffFiltrati.length} risultat{staffFiltrati.length === 1 ? 'o' : 'i'}
            <button 
              onClick={() => { 
                setSearchQuery(''); 
                setFiltroTipo(''); 
                setFiltroCompetenza(''); 
                setFiltroAttivo('attivi'); 
              }}
              className="ml-2 text-blue-600 hover:underline"
            >
              Rimuovi filtri
            </button>
          </div>
        )}
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Competenze
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Costo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assegnazioni
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {staffFiltrati.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <Users className="mx-auto mb-2 text-gray-300" size={48} />
                  {staff.length === 0 ? (
                    <>
                      <p>Nessun staff registrato</p>
                      <Link 
                        href="/staff/nuovo"
                        className="text-blue-600 hover:underline mt-2 inline-block"
                      >
                        Aggiungi il primo
                      </Link>
                    </>
                  ) : (
                    <>
                      <p>Nessun risultato per i filtri selezionati</p>
                      <button 
                        onClick={() => { 
                          setSearchQuery(''); 
                          setFiltroTipo(''); 
                          setFiltroCompetenza(''); 
                          setFiltroAttivo('attivi'); 
                        }}
                        className="text-blue-600 hover:underline mt-2 inline-block"
                      >
                        Rimuovi filtri
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              staffFiltrati.map((s) => (
                <tr key={s.id} className={`hover:bg-gray-50 ${!s.attivo ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                        ${s.attivo ? 'bg-purple-500' : 'bg-gray-400'}
                      `}>
                        {s.nome.charAt(0)}{s.cognome.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {s.cognome} {s.nome}
                        </p>
                        {s.telefono && (
                          <p className="text-sm text-gray-500">{s.telefono}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      s.tipoCollaboratore === 'INTERNO' ? 'bg-blue-100 text-blue-700' :
                      s.tipoCollaboratore === 'PARTITA_IVA' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {TIPO_COLLABORATORE_LABELS[s.tipoCollaboratore] || s.tipoCollaboratore}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {renderCompetenzaBadge(s)}
                  </td>
                  <td className="px-6 py-4">
                    {s.costoGettone ? (
                      <span className="font-medium">€ {s.costoGettone}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900">{s._count.assegnazioni}</span>
                  </td>
                  <td className="px-6 py-4">
                    {s.attivo ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircle size={16} />
                        <span className="text-sm">Attivo</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <XCircle size={16} />
                        <span className="text-sm">Inattivo</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/staff/${s.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Modifica
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
