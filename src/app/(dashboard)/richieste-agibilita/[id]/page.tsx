// src/app/(dashboard)/richieste-agibilita/[id]/page.tsx
// Dettaglio Richiesta Agibilità
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Clock, CheckCircle, XCircle, Loader2, 
  Calendar, MapPin, Users, Euro, Edit3, Trash2,
  PlayCircle, FileText, AlertCircle, User
} from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface Richiesta {
  id: string
  codice: string
  stato: string
  richiedente: string
  emailRichiedente: string | null
  datiRichiesta: {
    dataEvento: string
    dataFine?: string
    locale: { id?: string; nome: string; citta?: string; indirizzo?: string; isNuovo?: boolean }
    artisti: { id?: string; nomeDarte?: string; nome?: string; cognome?: string; compensoNetto: number; qualifica?: string; isNuovo?: boolean }[]
    committente?: any
  }
  note: string | null
  noteInterne: string | null
  agibilitaId: string | null
  assegnatoA: string | null
  createdAt: string
  updatedAt: string
  Agibilita: { id: string; codice: string; data: string; stato: string } | null
  User: { id: string; nome: string; cognome: string; email: string } | null
}

const STATI = {
  NUOVA: { label: 'Nuova', bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
  IN_LAVORAZIONE: { label: 'In lavorazione', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Loader2 },
  EVASA: { label: 'Evasa', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  RIFIUTATA: { label: 'Rifiutata', bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  ANNULLATA: { label: 'Annullata', bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircle },
}

export default function DettaglioRichiestaPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [richiesta, setRichiesta] = useState<Richiesta | null>(null)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Note interne editabili
  const [noteInterne, setNoteInterne] = useState('')
  const [editingNote, setEditingNote] = useState(false)
  
  useEffect(() => {
    loadRichiesta()
  }, [id])
  
  async function loadRichiesta() {
    try {
      const res = await fetch(`/api/richieste-agibilita/${id}`)
      if (!res.ok) throw new Error('Richiesta non trovata')
      const data = await res.json()
      setRichiesta(data)
      setNoteInterne(data.noteInterne || '')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Cambia stato
  const handleCambiaStato = async (nuovoStato: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/richieste-agibilita/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato: nuovoStato }),
      })
      if (res.ok) {
        const data = await res.json()
        setRichiesta(data)
      }
    } catch (err) {
      console.error('Errore cambio stato:', err)
    } finally {
      setSaving(false)
    }
  }
  
  // Salva note interne
  const handleSaveNote = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/richieste-agibilita/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteInterne }),
      })
      if (res.ok) {
        const data = await res.json()
        setRichiesta(data)
        setEditingNote(false)
      }
    } catch (err) {
      console.error('Errore salvataggio note:', err)
    } finally {
      setSaving(false)
    }
  }
  
  // Elimina richiesta
  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/richieste-agibilita/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/richieste-agibilita')
      } else {
        const data = await res.json()
        setError(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
      setShowDeleteConfirm(false)
    }
  }
  
  // Crea agibilità da richiesta
  const handleCreaAgibilita = () => {
    if (!richiesta) return
    
    const dati = richiesta.datiRichiesta
    
    // Salva i dati completi in sessionStorage per recuperarli nella pagina nuova agibilità
    const datiAgibilita = {
      fromRichiestaId: richiesta.id,
      fromRichiestaCodice: richiesta.codice,
      dataEvento: dati.dataEvento,
      dataFine: dati.dataFine,
      locale: dati.locale,
      artisti: dati.artisti,
      committente: dati.committente,
    }
    
    sessionStorage.setItem('datiNuovaAgibilita', JSON.stringify(datiAgibilita))
    
    router.push('/agibilita/nuova?fromRichiesta=' + richiesta.id)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!richiesta) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-medium text-gray-900">Richiesta non trovata</h2>
        <Link href="/richieste-agibilita" className="text-blue-600 hover:underline mt-2 inline-block">
          Torna alla lista
        </Link>
      </div>
    )
  }
  
  const stato = STATI[richiesta.stato as keyof typeof STATI] || STATI.NUOVA
  const StatoIcon = stato.icon
  const dati = richiesta.datiRichiesta
  const totaleCompensi = dati.artisti?.reduce((sum, a) => sum + (a.compensoNetto || 0), 0) || 0
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/richieste-agibilita"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{richiesta.codice}</h1>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${stato.bg} ${stato.text}`}>
                <StatoIcon size={16} />
                {stato.label}
              </span>
            </div>
            <p className="text-gray-500">
              Creata il {format(new Date(richiesta.createdAt), 'd MMMM yyyy HH:mm', { locale: it })}
              {' • '}da {richiesta.richiedente}
            </p>
          </div>
        </div>
        
        {/* Azioni */}
        <div className="flex items-center gap-2">
          {richiesta.stato === 'NUOVA' && (
            <button
              onClick={() => handleCambiaStato('IN_LAVORAZIONE')}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
            >
              <PlayCircle size={18} />
              Prendi in carico
            </button>
          )}
          
          {(richiesta.stato === 'NUOVA' || richiesta.stato === 'IN_LAVORAZIONE') && (
            <button
              onClick={handleCreaAgibilita}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FileText size={18} />
              Crea Agibilità
            </button>
          )}
          
          {richiesta.stato !== 'EVASA' && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              title="Elimina richiesta"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      
      {/* Agibilità collegata */}
      {richiesta.Agibilita && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <p className="font-medium text-green-800">Agibilità creata</p>
                <p className="text-sm text-green-600">
                  Codice: {richiesta.Agibilita.codice}
                </p>
              </div>
            </div>
            <Link
              href={`/agibilita/${richiesta.Agibilita.id}`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Vai all'agibilità
            </Link>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info evento */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dettagli Evento</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="text-blue-500 mt-0.5" size={20} />
                <div>
                  <p className="font-medium">Data</p>
                  <p className="text-gray-600">
                    {format(new Date(dati.dataEvento), 'EEEE d MMMM yyyy', { locale: it })}
                    {dati.dataFine && dati.dataFine !== dati.dataEvento && (
                      <span> → {format(new Date(dati.dataFine), 'd MMMM yyyy', { locale: it })}</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="text-green-500 mt-0.5" size={20} />
                <div>
                  <p className="font-medium">Locale</p>
                  <p className="text-gray-600">
                    {dati.locale.nome}
                    {dati.locale.citta && ` - ${dati.locale.citta}`}
                  </p>
                  {dati.locale.indirizzo && (
                    <p className="text-sm text-gray-500">{dati.locale.indirizzo}</p>
                  )}
                  {dati.locale.isNuovo && (
                    <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Nuovo locale
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Artisti */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-purple-500" />
              Artisti ({dati.artisti?.length || 0})
            </h2>
            
            {dati.artisti && dati.artisti.length > 0 ? (
              <div className="space-y-3">
                {dati.artisti.map((artista, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {artista.nomeDarte || `${artista.nome} ${artista.cognome}`}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {artista.qualifica && <span>{artista.qualifica}</span>}
                        {artista.isNuovo && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            non in anagrafica
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        €{(artista.compensoNetto || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">netto</p>
                    </div>
                  </div>
                ))}
                
                {/* Totale */}
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="font-medium text-gray-700">Totale compensi</span>
                  <span className="font-bold text-lg">€{totaleCompensi.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Nessun artista specificato</p>
            )}
          </div>
          
          {/* Note richiesta */}
          {richiesta.note && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Note</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{richiesta.note}</p>
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stato e azioni rapide */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Stato</h3>
            
            <div className="space-y-2">
              {Object.entries(STATI).map(([key, { label, bg, text }]) => (
                <button
                  key={key}
                  onClick={() => handleCambiaStato(key)}
                  disabled={saving || richiesta.stato === key || (richiesta.stato === 'EVASA' && key !== 'EVASA')}
                  className={`w-full px-4 py-2 rounded-lg text-left transition-colors ${
                    richiesta.stato === key
                      ? `${bg} ${text} font-medium`
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Assegnazione */}
          {richiesta.User && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={18} />
                Assegnata a
              </h3>
              <p className="text-gray-700">
                {richiesta.User.nome} {richiesta.User.cognome}
              </p>
              <p className="text-sm text-gray-500">{richiesta.User.email}</p>
            </div>
          )}
          
          {/* Note interne */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Note Interne</h3>
              {!editingNote && (
                <button
                  onClick={() => setEditingNote(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>
            
            {editingNote ? (
              <div className="space-y-2">
                <textarea
                  value={noteInterne}
                  onChange={(e) => setNoteInterne(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Note visibili solo internamente..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNote}
                    disabled={saving}
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Salva
                  </button>
                  <button
                    onClick={() => {
                      setEditingNote(false)
                      setNoteInterne(richiesta.noteInterne || '')
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm whitespace-pre-wrap">
                {noteInterne || 'Nessuna nota interna'}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal conferma eliminazione */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Eliminare questa richiesta?
            </h3>
            <p className="text-gray-600 mb-6">
              L'azione non può essere annullata.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
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
