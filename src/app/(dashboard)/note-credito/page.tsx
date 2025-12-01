// src/app/(dashboard)/note-credito/page.tsx
// Lista Note di Credito
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, ReceiptText, Search, Filter, FileText,
  Calendar, Euro, Building2
} from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface NotaDiCredito {
  id: string
  numero: string
  anno: number
  progressivo: number
  dataEmissione: string
  tipo: string
  motivo: string
  totale: number
  stato: string
  fatturaRiferimento: {
    id: string
    numero: string
    committente: {
      id: string
      ragioneSociale: string
      partitaIva: string
    }
  }
}

const STATI_COLORI: Record<string, { bg: string; text: string; label: string }> = {
  'EMESSA': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Emessa' },
  'INVIATA': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Inviata' },
  'ANNULLATA': { bg: 'bg-red-100', text: 'text-red-700', label: 'Annullata' },
}

export default function NoteCreditoPage() {
  const [loading, setLoading] = useState(true)
  const [noteCredito, setNoteCredito] = useState<NotaDiCredito[]>([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  
  // Filtri
  const [filtroStato, setFiltroStato] = useState('')
  const [filtroAnno, setFiltroAnno] = useState(new Date().getFullYear().toString())
  const [ricerca, setRicerca] = useState('')
  
  // Carica note di credito
  useEffect(() => {
    async function loadNoteCredito() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (filtroStato) params.set('stato', filtroStato)
        if (filtroAnno) params.set('anno', filtroAnno)
        params.set('limit', '50')
        
        const res = await fetch(`/api/note-credito?${params}`)
        if (res.ok) {
          const data = await res.json()
          setNoteCredito(data.data || [])
          setPagination(data.pagination || { page: 1, pages: 1, total: 0 })
        }
      } catch (err) {
        console.error('Errore caricamento note di credito:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadNoteCredito()
  }, [filtroStato, filtroAnno])
  
  // Filtra per ricerca
  const noteFiltrate = noteCredito.filter(nc => {
    if (!ricerca) return true
    const search = ricerca.toLowerCase()
    return (
      nc.numero.toLowerCase().includes(search) ||
      nc.fatturaRiferimento.numero.toLowerCase().includes(search) ||
      nc.fatturaRiferimento.committente.ragioneSociale.toLowerCase().includes(search)
    )
  })
  
  // Calcola totale
  const totaleNote = noteFiltrate.reduce((sum, nc) => sum + Number(nc.totale), 0)
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Note di Credito</h1>
          <p className="text-gray-500">{pagination.total} note di credito</p>
        </div>
        
        <Link
          href="/note-credito/nuova"
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus size={20} />
          Nuova Nota di Credito
        </Link>
      </div>
      
      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ReceiptText className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Totale {filtroAnno}</p>
              <p className="text-xl font-bold text-red-600">-€{totaleNote.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Note Emesse</p>
              <p className="text-xl font-bold text-gray-900">
                {noteCredito.filter(nc => nc.stato === 'EMESSA').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Note Inviate</p>
              <p className="text-xl font-bold text-gray-900">
                {noteCredito.filter(nc => nc.stato === 'INVIATA').length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filtri */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Ricerca */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={ricerca}
              onChange={(e) => setRicerca(e.target.value)}
              placeholder="Cerca per numero o committente..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Filtro Stato */}
          <select
            value={filtroStato}
            onChange={(e) => setFiltroStato(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti gli stati</option>
            <option value="EMESSA">Emessa</option>
            <option value="INVIATA">Inviata</option>
            <option value="ANNULLATA">Annullata</option>
          </select>
          
          {/* Filtro Anno */}
          <select
            value={filtroAnno}
            onChange={(e) => setFiltroAnno(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti gli anni</option>
            {[...Array(5)].map((_, i) => {
              const anno = new Date().getFullYear() - i
              return <option key={anno} value={anno}>{anno}</option>
            })}
          </select>
        </div>
      </div>
      
      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : noteFiltrate.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <ReceiptText className="mx-auto mb-4 text-gray-300" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna nota di credito</h3>
          <p className="text-gray-500 mb-4">Non ci sono note di credito che corrispondono ai filtri</p>
          <Link
            href="/note-credito/nuova"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Plus size={20} />
            Crea Nota di Credito
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Numero</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Data</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Committente</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Rif. Fattura</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tipo</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Importo</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {noteFiltrate.map(nc => {
                const statoInfo = STATI_COLORI[nc.stato] || STATI_COLORI['EMESSA']
                
                return (
                  <tr key={nc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link 
                        href={`/note-credito/${nc.id}`}
                        className="font-medium text-red-600 hover:text-red-700"
                      >
                        {nc.numero}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {format(new Date(nc.dataEmissione), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {nc.fatturaRiferimento.committente.ragioneSociale}
                        </p>
                        <p className="text-sm text-gray-500">
                          {nc.fatturaRiferimento.committente.partitaIva}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/fatture/${nc.fatturaRiferimento.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        {nc.fatturaRiferimento.numero}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        nc.tipo === 'TOTALE' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {nc.tipo === 'TOTALE' ? 'Totale' : 'Parziale'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-red-600">
                        -€{Number(nc.totale).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statoInfo.bg} ${statoInfo.text}`}>
                        {statoInfo.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}