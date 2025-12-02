// src/app/(dashboard)/richieste-agibilita/page.tsx
// Lista Richieste Agibilità
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, Search, Filter, Clock, CheckCircle, XCircle, 
  Loader2, Calendar, MapPin, Users, ChevronRight,
  AlertCircle, User
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
    locale: { nome: string; citta?: string }
    artisti: { nomeDarte?: string; nome?: string; cognome?: string; compensoNetto: number }[]
  }
  note: string | null
  createdAt: string
  Agibilita: { id: string; codice: string } | null
  User: { nome: string; cognome: string } | null
}

const STATI = {
  NUOVA: { label: 'Nuova', bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
  IN_LAVORAZIONE: { label: 'In lavorazione', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Loader2 },
  EVASA: { label: 'Evasa', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  RIFIUTATA: { label: 'Rifiutata', bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  ANNULLATA: { label: 'Annullata', bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircle },
}

export default function RichiesteAgibilitaPage() {
  const [loading, setLoading] = useState(true)
  const [richieste, setRichieste] = useState<Richiesta[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [filtroStato, setFiltroStato] = useState('tutti')
  const [search, setSearch] = useState('')
  
  useEffect(() => {
    loadRichieste()
  }, [filtroStato])
  
  async function loadRichieste() {
    setLoading(true)
    try {
      const url = filtroStato === 'tutti' 
        ? '/api/richieste-agibilita'
        : `/api/richieste-agibilita?stato=${filtroStato}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setRichieste(data.richieste || [])
        setCounts(data.counts || {})
      }
    } catch (err) {
      console.error('Errore caricamento:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Filtra per ricerca
  const richiesteFiltrate = richieste.filter(r => {
    if (!search) return true
    const term = search.toLowerCase()
    const dati = r.datiRichiesta
    return (
      r.codice.toLowerCase().includes(term) ||
      r.richiedente.toLowerCase().includes(term) ||
      dati.locale?.nome?.toLowerCase().includes(term) ||
      dati.artisti?.some(a => 
        a.nomeDarte?.toLowerCase().includes(term) ||
        a.nome?.toLowerCase().includes(term) ||
        a.cognome?.toLowerCase().includes(term)
      )
    )
  })
  
  const totaleCount = Object.values(counts).reduce((a, b) => a + b, 0)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Richieste Agibilità</h1>
          <p className="text-gray-500">{totaleCount} richieste totali</p>
        </div>
        
        <Link
          href="/richieste-agibilita/nuova"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuova Richiesta
        </Link>
      </div>
      
      {/* Filtri stato */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltroStato('tutti')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtroStato === 'tutti'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tutte ({totaleCount})
        </button>
        {Object.entries(STATI).map(([key, { label, bg, text }]) => (
          <button
            key={key}
            onClick={() => setFiltroStato(key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroStato === key
                ? `${bg} ${text}`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label} ({counts[key] || 0})
          </button>
        ))}
      </div>
      
      {/* Barra ricerca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Cerca per codice, richiedente, locale, artista..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      {/* Lista richieste */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : richiesteFiltrate.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna richiesta</h3>
          <p className="text-gray-500 mb-4">
            {filtroStato !== 'tutti' 
              ? `Non ci sono richieste con stato "${STATI[filtroStato as keyof typeof STATI]?.label}"`
              : 'Non ci sono ancora richieste di agibilità'}
          </p>
          <Link
            href="/richieste-agibilita/nuova"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Crea la prima richiesta
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {richiesteFiltrate.map((richiesta) => {
              const stato = STATI[richiesta.stato as keyof typeof STATI] || STATI.NUOVA
              const StatoIcon = stato.icon
              const dati = richiesta.datiRichiesta
              
              return (
                <Link
                  key={richiesta.id}
                  href={`/richieste-agibilita/${richiesta.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header riga */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-medium text-gray-900">
                          {richiesta.codice}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${stato.bg} ${stato.text}`}>
                          <StatoIcon size={12} />
                          {stato.label}
                        </span>
                        {richiesta.Agibilita && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            → {richiesta.Agibilita.codice}
                          </span>
                        )}
                      </div>
                      
                      {/* Info richiesta */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {dati.dataEvento ? format(new Date(dati.dataEvento), 'd MMM yyyy', { locale: it }) : '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {dati.locale?.nome || '-'}
                          {dati.locale?.citta && ` (${dati.locale.citta})`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {dati.artisti?.length || 0} artisti
                        </span>
                      </div>
                      
                      {/* Artisti preview */}
                      {dati.artisti && dati.artisti.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {dati.artisti.slice(0, 3).map((a, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                              {a.nomeDarte || `${a.nome} ${a.cognome}`}
                            </span>
                          ))}
                          {dati.artisti.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{dati.artisti.length - 3} altri
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Footer */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                        <span>
                          Richiesta da {richiesta.richiedente}
                        </span>
                        <span>
                          {format(new Date(richiesta.createdAt), 'd MMM yyyy HH:mm', { locale: it })}
                        </span>
                        {richiesta.User && (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            Assegnata a {richiesta.User.nome} {richiesta.User.cognome}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
