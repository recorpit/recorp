// src/app/(dashboard)/produzione/eventi/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  Package,
  FileText,
  Settings,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Plus,
  ChevronRight,
  Euro
} from 'lucide-react'

// Costanti
const STATO_EVENTO_LABELS: Record<string, { label: string; color: string }> = {
  'PREVENTIVO': { label: 'Preventivo', color: 'bg-gray-100 text-gray-700' },
  'PREVENTIVO_INVIATO': { label: 'Prev. Inviato', color: 'bg-yellow-100 text-yellow-700' },
  'CONFERMATO': { label: 'Confermato', color: 'bg-blue-100 text-blue-700' },
  'IN_PRODUZIONE': { label: 'In Produzione', color: 'bg-purple-100 text-purple-700' },
  'PRONTO': { label: 'Pronto', color: 'bg-green-100 text-green-700' },
  'IN_CORSO': { label: 'In Corso', color: 'bg-green-500 text-white' },
  'COMPLETATO': { label: 'Completato', color: 'bg-emerald-100 text-emerald-700' },
  'CHIUSO': { label: 'Chiuso', color: 'bg-gray-500 text-white' },
  'ANNULLATO': { label: 'Annullato', color: 'bg-red-100 text-red-700' },
  'SOSPESO': { label: 'Sospeso', color: 'bg-orange-100 text-orange-700' },
}

const TIPO_EVENTO_LABELS: Record<string, string> = {
  'CONCERTO': 'Concerto',
  'FESTIVAL': 'Festival',
  'CLUB': 'Club',
  'APERITIVO': 'Aperitivo',
  'MATRIMONIO': 'Matrimonio',
  'CORPORATE': 'Corporate',
  'PIAZZA': 'Piazza',
  'PRIVATO': 'Privato',
  'FORMAT': 'Format',
  'ALTRO': 'Altro',
}

const TABS = [
  { id: 'dossier', label: 'Dossier', icon: FileText },
  { id: 'artisti', label: 'Artisti', icon: Users },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'materiali', label: 'Materiali', icon: Package },
  { id: 'economico', label: 'Economico', icon: Euro },
  { id: 'documenti', label: 'Documenti', icon: FileText },
]

export default function EventoDettaglioPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [evento, setEvento] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('dossier')
  const [editMode, setEditMode] = useState(false)
  
  // Carica evento
  useEffect(() => {
    if (id) loadEvento()
  }, [id])
  
  const loadEvento = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/produzione/eventi/${id}`)
      if (!res.ok) {
        if (res.status === 404) throw new Error('Evento non trovato')
        throw new Error('Errore caricamento')
      }
      const data = await res.json()
      setEvento(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const updateStato = async (nuovoStato: string) => {
    try {
      setSaving(true)
      const res = await fetch(`/api/produzione/eventi/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...evento, stato: nuovoStato })
      })
      
      if (!res.ok) throw new Error('Errore aggiornamento')
      
      const updated = await res.json()
      setEvento({ ...evento, ...updated })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  const deleteEvento = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo evento?')) return
    
    try {
      const res = await fetch(`/api/produzione/eventi/${id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore eliminazione')
      }
      
      router.push('/produzione/eventi')
    } catch (err: any) {
      setError(err.message)
    }
  }
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }
  
  const formatCurrency = (value: number | null) => {
    if (!value) return '€ 0'
    return new Intl.NumberFormat('it-IT', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(value)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
  
  if (error || !evento) {
    return (
      <div className="p-6 bg-red-50 rounded-lg text-red-700">
        <p>{error || 'Evento non trovato'}</p>
        <Link href="/produzione/eventi" className="mt-2 text-red-600 underline">
          Torna alla lista
        </Link>
      </div>
    )
  }
  
  // Flusso stati possibili
  const getNextStates = () => {
    const transitions: Record<string, string[]> = {
      'PREVENTIVO': ['PREVENTIVO_INVIATO', 'CONFERMATO', 'ANNULLATO'],
      'PREVENTIVO_INVIATO': ['CONFERMATO', 'PREVENTIVO', 'ANNULLATO'],
      'CONFERMATO': ['IN_PRODUZIONE', 'ANNULLATO', 'SOSPESO'],
      'IN_PRODUZIONE': ['PRONTO', 'SOSPESO'],
      'PRONTO': ['IN_CORSO'],
      'IN_CORSO': ['COMPLETATO'],
      'COMPLETATO': ['CHIUSO'],
      'SOSPESO': ['CONFERMATO', 'ANNULLATO'],
    }
    return transitions[evento.stato] || []
  }
  
  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Link
              href="/produzione/eventi"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-gray-500">{evento.codice}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  STATO_EVENTO_LABELS[evento.stato]?.color || 'bg-gray-100'
                }`}>
                  {STATO_EVENTO_LABELS[evento.stato]?.label || evento.stato}
                </span>
                <span className="text-sm text-gray-400">
                  {TIPO_EVENTO_LABELS[evento.tipo] || evento.tipo}
                </span>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {evento.nome}
              </h1>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <Calendar size={16} />
                  {formatDate(evento.dataInizio)}
                  {evento.oraInizioEvento && ` - ${evento.oraInizioEvento}`}
                </span>
                
                {evento.locale && (
                  <span className="flex items-center gap-2">
                    <MapPin size={16} />
                    {evento.locale.nome}
                    {evento.locale.citta && `, ${evento.locale.citta}`}
                  </span>
                )}
                
                {evento.committente && (
                  <span className="flex items-center gap-2">
                    <Building2 size={16} />
                    {evento.committente.ragioneSociale}
                    {evento.committente.aRischio && (
                      <AlertTriangle size={14} className="text-red-500" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Cambio stato */}
            {getNextStates().length > 0 && (
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Cambia Stato
                  <ChevronRight size={16} />
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block min-w-48 z-10">
                  {getNextStates().map(stato => (
                    <button
                      key={stato}
                      onClick={() => updateStato(stato)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className={`w-3 h-3 rounded-full ${
                        STATO_EVENTO_LABELS[stato]?.color.replace('text-', 'bg-').split(' ')[0]
                      }`} />
                      {STATO_EVENTO_LABELS[stato]?.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={() => setEditMode(!editMode)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Modifica"
            >
              <Edit size={20} />
            </button>
            
            {['PREVENTIVO', 'ANNULLATO', 'SOSPESO'].includes(evento.stato) && (
              <button
                onClick={deleteEvento}
                className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                title="Elimina"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-500">Artisti</p>
            <p className="text-xl font-semibold">{evento.assegnazioniArtisti?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Staff</p>
            <p className="text-xl font-semibold">{evento.assegnazioniStaff?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Materiali</p>
            <p className="text-xl font-semibold">{evento.materialiEvento?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Ricavo</p>
            <p className="text-xl font-semibold text-green-600">
              {formatCurrency(evento._calcolati?.ricavoEffettivo || evento.ricavoPrevisto)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Margine</p>
            <p className={`text-xl font-semibold ${
              (evento._calcolati?.margineCalcolato || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(evento._calcolati?.margineCalcolato)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex border-b overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === 'dossier' && <TabDossier evento={evento} onUpdate={loadEvento} />}
        {activeTab === 'artisti' && <TabArtisti evento={evento} onUpdate={loadEvento} />}
        {activeTab === 'staff' && <TabStaff evento={evento} onUpdate={loadEvento} />}
        {activeTab === 'materiali' && <TabMateriali evento={evento} onUpdate={loadEvento} />}
        {activeTab === 'economico' && <TabEconomico evento={evento} onUpdate={loadEvento} />}
        {activeTab === 'documenti' && <TabDocumenti evento={evento} onUpdate={loadEvento} />}
      </div>
    </div>
  )
}

// ==========================================
// TAB COMPONENTS
// ==========================================

function TabDossier({ evento, onUpdate }: { evento: any; onUpdate: () => void }) {
  const dossier = evento.dossier || {}
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dossier Evento</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
          <Edit size={16} />
          Modifica
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Briefing */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Briefing</h4>
          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg min-h-20">
            {dossier.briefing || 'Nessun briefing inserito'}
          </p>
        </div>
        
        {/* Obiettivi */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Obiettivi</h4>
          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg min-h-20">
            {dossier.obiettivi || 'Nessun obiettivo inserito'}
          </p>
        </div>
        
        {/* Logistica */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Accesso e Carico</h4>
          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg min-h-20">
            {dossier.accessoCarico || 'Non specificato'}
          </p>
        </div>
        
        {/* Note tecniche */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Note Tecniche</h4>
          <div className="space-y-2">
            {dossier.noteAudio && (
              <p className="text-sm"><strong>Audio:</strong> {dossier.noteAudio}</p>
            )}
            {dossier.noteLuci && (
              <p className="text-sm"><strong>Luci:</strong> {dossier.noteLuci}</p>
            )}
            {dossier.noteVideo && (
              <p className="text-sm"><strong>Video:</strong> {dossier.noteVideo}</p>
            )}
            {!dossier.noteAudio && !dossier.noteLuci && !dossier.noteVideo && (
              <p className="text-gray-400 text-sm">Nessuna nota tecnica</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Timeline */}
      <div>
        <h4 className="font-medium text-gray-700 mb-2">Timeline</h4>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Carico</p>
              <p className="font-medium">{evento.oraCarico || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">Inizio Evento</p>
              <p className="font-medium">{evento.oraInizioEvento || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">Fine Evento</p>
              <p className="font-medium">{evento.oraFineEvento || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">Scarico</p>
              <p className="font-medium">{evento.oraScarico || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabArtisti({ evento, onUpdate }: { evento: any; onUpdate: () => void }) {
  const artisti = evento.assegnazioniArtisti || []
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Artisti ({artisti.length})</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={16} />
          Aggiungi Artista
        </button>
      </div>
      
      {artisti.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users className="mx-auto mb-2 text-gray-300" size={48} />
          <p>Nessun artista assegnato</p>
        </div>
      ) : (
        <div className="space-y-3">
          {artisti.map((ass: any) => (
            <div key={ass.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {ass.artista.nome?.charAt(0)}{ass.artista.cognome?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">
                    {ass.artista.cognome} {ass.artista.nome}
                    {ass.artista.nomeDarte && (
                      <span className="text-gray-500 ml-2">&quot;{ass.artista.nomeDarte}&quot;</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    {ass.oraInizio && `${ass.oraInizio} - ${ass.oraFine || '?'}`}
                    {ass.durataMinuti && ` (${ass.durataMinuti} min)`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  {ass.compensoLordo && (
                    <p className="font-medium text-green-600">€ {ass.compensoLordo}</p>
                  )}
                  {ass.agibilita && (
                    <p className="text-xs text-gray-400">{ass.agibilita.codice}</p>
                  )}
                </div>
                {ass.confermato ? (
                  <CheckCircle className="text-green-500" size={20} />
                ) : (
                  <Clock className="text-yellow-500" size={20} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabStaff({ evento, onUpdate }: { evento: any; onUpdate: () => void }) {
  const staff = evento.assegnazioniStaff || []
  
  const RUOLO_LABELS: Record<string, string> = {
    'FONICO': 'Fonico',
    'TECNICO_LUCI': 'Tecnico Luci',
    'TECNICO_VIDEO': 'Tecnico Video',
    'TECNICO_LED': 'Tecnico LED',
    'RIGGER': 'Rigger',
    'STAGEHAND': 'Stagehand',
    'DJ_TECH': 'DJ Tech',
    'DRIVER': 'Driver',
    'RUNNER': 'Runner',
    'RESPONSABILE_TECNICO': 'Responsabile Tecnico',
  }
  
  const STATO_LABELS: Record<string, { label: string; color: string }> = {
    'PROPOSTO': { label: 'Proposto', color: 'bg-gray-100 text-gray-700' },
    'CONFERMATO': { label: 'Confermato', color: 'bg-blue-100 text-blue-700' },
    'NOTIFICATO': { label: 'Notificato', color: 'bg-yellow-100 text-yellow-700' },
    'ACCETTATO': { label: 'Accettato', color: 'bg-green-100 text-green-700' },
    'RIFIUTATO': { label: 'Rifiutato', color: 'bg-red-100 text-red-700' },
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Staff Tecnico ({staff.length})</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={16} />
          Aggiungi Staff
        </button>
      </div>
      
      {staff.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users className="mx-auto mb-2 text-gray-300" size={48} />
          <p>Nessun tecnico assegnato</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruolo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compenso</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {staff.map((ass: any) => (
                <tr key={ass.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{ass.staff.cognome} {ass.staff.nome}</p>
                    <p className="text-sm text-gray-500">{ass.staff.telefono}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{RUOLO_LABELS[ass.ruolo] || ass.ruolo}</p>
                    {ass.ruoloDettaglio && (
                      <p className="text-sm text-gray-400">{ass.ruoloDettaglio}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {ass.oraChiamata || '-'}
                    {ass.oraFine && ` - ${ass.oraFine}`}
                  </td>
                  <td className="px-4 py-3">
                    {ass.compenso ? `€ ${ass.compenso}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      STATO_LABELS[ass.stato]?.color || 'bg-gray-100'
                    }`}>
                      {STATO_LABELS[ass.stato]?.label || ass.stato}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-gray-400 hover:text-gray-600">
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TabMateriali({ evento, onUpdate }: { evento: any; onUpdate: () => void }) {
  const materiali = evento.materialiEvento || []
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Materiali ({materiali.length})</h3>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <Package size={16} />
            Aggiungi Pacchetto
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={16} />
            Aggiungi Materiale
          </button>
        </div>
      </div>
      
      {materiali.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="mx-auto mb-2 text-gray-300" size={48} />
          <p>Nessun materiale assegnato</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Materiale</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qta</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {materiali.map((mat: any) => (
                <tr key={mat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{mat.descrizione}</p>
                    {mat.materiale && (
                      <p className="text-sm text-gray-400">{mat.materiale.codice}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{mat.categoria || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {mat.quantitaAssegnata}/{mat.quantitaRichiesta}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      mat.stato === 'USCITO' ? 'bg-blue-100 text-blue-700' :
                      mat.stato === 'RIENTRATO' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {mat.stato}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-gray-400 hover:text-gray-600">
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TabEconomico({ evento, onUpdate }: { evento: any; onUpdate: () => void }) {
  const voci = evento.vociEconomiche || []
  const ricavi = voci.filter((v: any) => v.tipo === 'RICAVO')
  const costi = voci.filter((v: any) => v.tipo === 'COSTO')
  
  const totRicavi = ricavi.reduce((sum: number, v: any) => 
    sum + (Number(v.importoEffettivo) || Number(v.importoPrevisto) || 0), 0)
  const totCosti = costi.reduce((sum: number, v: any) => 
    sum + (Number(v.importoEffettivo) || Number(v.importoPrevisto) || 0), 0)
  const margine = totRicavi - totCosti
  
  return (
    <div className="space-y-6">
      {/* Riepilogo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600">Totale Ricavi</p>
          <p className="text-2xl font-bold text-green-700">€ {totRicavi.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-600">Totale Costi</p>
          <p className="text-2xl font-bold text-red-700">€ {totCosti.toFixed(2)}</p>
        </div>
        <div className={`p-4 rounded-lg ${margine >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <p className={`text-sm ${margine >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Margine</p>
          <p className={`text-2xl font-bold ${margine >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            € {margine.toFixed(2)}
          </p>
        </div>
      </div>
      
      {/* Ricavi */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-green-700">Ricavi</h4>
          <button className="flex items-center gap-1 text-sm text-green-600 hover:underline">
            <Plus size={14} />
            Aggiungi
          </button>
        </div>
        {ricavi.length === 0 ? (
          <p className="text-gray-400 text-sm">Nessun ricavo inserito</p>
        ) : (
          <div className="space-y-2">
            {ricavi.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{v.descrizione}</p>
                  {v.categoria && <p className="text-sm text-gray-400">{v.categoria}</p>}
                </div>
                <p className="font-semibold text-green-600">
                  € {(Number(v.importoEffettivo) || Number(v.importoPrevisto) || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Costi */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-red-700">Costi</h4>
          <button className="flex items-center gap-1 text-sm text-red-600 hover:underline">
            <Plus size={14} />
            Aggiungi
          </button>
        </div>
        {costi.length === 0 ? (
          <p className="text-gray-400 text-sm">Nessun costo inserito</p>
        ) : (
          <div className="space-y-2">
            {costi.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{v.descrizione}</p>
                  {v.fornitore && <p className="text-sm text-gray-400">{v.fornitore}</p>}
                </div>
                <p className="font-semibold text-red-600">
                  € {(Number(v.importoEffettivo) || Number(v.importoPrevisto) || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TabDocumenti({ evento, onUpdate }: { evento: any; onUpdate: () => void }) {
  const documenti = evento.documentiEvento || []
  
  const TIPO_DOC_LABELS: Record<string, string> = {
    'PERMESSO_SUOLO_PUBBLICO': 'Permesso Suolo Pubblico',
    'NULLA_OSTA_PREFETTURA': 'Nulla Osta Prefettura',
    'PIANO_EMERGENZA': 'Piano Emergenza',
    'CONFORMITA_IMPIANTI': 'Conformità Impianti',
    'CONFORMITA_PALCO': 'Conformità Palco',
    'SIAE': 'SIAE',
    'ASSICURAZIONE': 'Assicurazione',
    'ALTRO': 'Altro',
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documenti Sicurezza</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={16} />
          Aggiungi Documento
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(TIPO_DOC_LABELS).map(([tipo, label]) => {
          const doc = documenti.find((d: any) => d.tipo === tipo)
          
          return (
            <div key={tipo} className={`p-4 rounded-lg border ${
              doc?.stato === 'CARICATO' || doc?.stato === 'APPROVATO'
                ? 'border-green-200 bg-green-50'
                : doc?.richiesto
                  ? 'border-red-200 bg-red-50'
                  : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-gray-500">
                    {doc?.stato === 'CARICATO' || doc?.stato === 'APPROVATO' ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle size={14} />
                        Caricato
                      </span>
                    ) : doc?.richiesto ? (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertTriangle size={14} />
                        Richiesto - Mancante
                      </span>
                    ) : (
                      'Non richiesto'
                    )}
                  </p>
                </div>
                <button className="p-2 hover:bg-white rounded-lg">
                  <FileText size={18} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
