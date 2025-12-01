// src/app/(dashboard)/pagamenti/contratti/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, Users, Building2, Clock, CheckCircle, 
  AlertTriangle, Euro, Search, Filter, RefreshCw,
  Upload, Check, X, Calendar, Download
} from 'lucide-react'

type TipoVista = 'P_IVA' | 'A_CHIAMATA' | 'FULL_TIME'

const TIPI_CONTRATTO = {
  P_IVA: { label: 'P.IVA', color: 'bg-purple-100 text-purple-700', icon: FileText },
  A_CHIAMATA: { label: 'A Chiamata', color: 'bg-blue-100 text-blue-700', icon: Clock },
  FULL_TIME: { label: 'Full Time', color: 'bg-green-100 text-green-700', icon: Users },
}

const STATI_FATTURA = {
  ATTESA_FATTURA: { label: 'Attesa Fattura', color: 'bg-yellow-100 text-yellow-700' },
  FATTURA_RICEVUTA: { label: 'Fattura Ricevuta', color: 'bg-blue-100 text-blue-700' },
  IN_DISTINTA: { label: 'In Distinta', color: 'bg-purple-100 text-purple-700' },
  PAGATA: { label: 'Pagata', color: 'bg-green-100 text-green-700' },
}

export default function ContrattiPagamentiPage() {
  const [loading, setLoading] = useState(true)
  const [vistaAttiva, setVistaAttiva] = useState<TipoVista>('P_IVA')
  const [artistiPIVA, setArtistiPIVA] = useState<any[]>([])
  const [artistiAChiamata, setArtistiAChiamata] = useState<any[]>([])
  const [artistiFullTime, setArtistiFullTime] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Per P.IVA
  const [fattureInAttesa, setFattureInAttesa] = useState<any[]>([])
  const [modalFattura, setModalFattura] = useState<any>(null)
  const [formFattura, setFormFattura] = useState({
    numeroFattura: '',
    dataFattura: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Carica artisti per tipo contratto
      const res = await fetch('/api/artisti')
      const data = await res.json()
      
      const artisti = data.artisti || []
      setArtistiPIVA(artisti.filter((a: any) => a.tipoContratto === 'P_IVA'))
      setArtistiAChiamata(artisti.filter((a: any) => a.tipoContratto === 'A_CHIAMATA'))
      setArtistiFullTime(artisti.filter((a: any) => a.tipoContratto === 'FULL_TIME'))
      
      // Carica fatture in attesa (mock per ora, poi API)
      // TODO: API /api/pagamenti/fatture-piva
      
    } catch (error) {
      console.error('Errore caricamento:', error)
    } finally {
      setLoading(false)
    }
  }

  async function confermaFatturaRicevuta(artistaId: string) {
    // TODO: implementare API
    alert('Funzionalità in arrivo! Salva la fattura ricevuta.')
    setModalFattura(null)
  }

  // Mese corrente per calcoli
  const oggi = new Date()
  const meseCorrente = oggi.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratti / P.IVA</h1>
          <p className="text-gray-500">Gestione pagamenti per P.IVA, a chiamata e full time</p>
        </div>
        <button
          onClick={loadData}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Tab Vista */}
      <div className="bg-white rounded-xl shadow-sm p-2 mb-6 inline-flex gap-2">
        {(Object.entries(TIPI_CONTRATTO) as [TipoVista, any][]).map(([tipo, config]) => {
          const Icon = config.icon
          const count = tipo === 'P_IVA' ? artistiPIVA.length 
                      : tipo === 'A_CHIAMATA' ? artistiAChiamata.length 
                      : artistiFullTime.length
          
          return (
            <button
              key={tipo}
              onClick={() => setVistaAttiva(tipo)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                vistaAttiva === tipo 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={18} />
              {config.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                vistaAttiva === tipo ? 'bg-blue-500' : 'bg-gray-200'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Contenuto P.IVA */}
      {vistaAttiva === 'P_IVA' && (
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-purple-800">
              <strong>Artisti P.IVA:</strong> Ricevono il compenso dopo aver inviato la loro fattura. 
              Segna quando ricevi la fattura per sbloccare il pagamento.
            </p>
          </div>

          {/* Ricerca */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca artista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Lista Artisti P.IVA */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={20} />
                Artisti P.IVA - {meseCorrente}
              </h2>
            </div>
            
            {artistiPIVA.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nessun artista con P.IVA
              </div>
            ) : (
              <div className="divide-y">
                {artistiPIVA
                  .filter(a => {
                    if (!searchTerm) return true
                    const nome = `${a.cognome} ${a.nome}`.toLowerCase()
                    return nome.includes(searchTerm.toLowerCase())
                  })
                  .map((artista) => (
                    <div key={artista.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="font-semibold text-purple-600 text-lg">
                              {artista.cognome?.[0]}{artista.nome?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {artista.cognome} {artista.nome}
                            </p>
                            <p className="text-sm text-gray-500">
                              P.IVA: {artista.partitaIva || 'Non specificata'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {/* Qui mostreremo le agibilità del mese da fatturare */}
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Prestazioni mese</p>
                            <p className="font-medium">0 da fatturare</p>
                          </div>
                          
                          <button
                            onClick={() => setModalFattura(artista)}
                            className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                          >
                            <Upload size={16} />
                            Segna Fattura
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenuto A CHIAMATA */}
      {vistaAttiva === 'A_CHIAMATA' && (
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              <strong>Artisti a Chiamata:</strong> Conteggio giorni/ore lavorati nel mese. 
              A fine mese conferma le presenze per generare la busta paga.
            </p>
          </div>

          {/* Lista */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={20} />
                Artisti a Chiamata - {meseCorrente}
              </h2>
            </div>
            
            {artistiAChiamata.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nessun artista a chiamata
              </div>
            ) : (
              <div className="divide-y">
                {artistiAChiamata.map((artista) => (
                  <div key={artista.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="font-semibold text-blue-600 text-lg">
                            {artista.cognome?.[0]}{artista.nome?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {artista.cognome} {artista.nome}
                          </p>
                          <p className="text-sm text-gray-500">
                            Tariffa: €{artista.cachetBase || '0'}/giorno
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Giorni lavorati</p>
                          <p className="font-medium">0 giorni</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Totale mese</p>
                          <p className="font-semibold text-green-600">€0.00</p>
                        </div>
                        <button className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                          Dettaglio
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenuto FULL TIME */}
      {vistaAttiva === 'FULL_TIME' && (
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              <strong>Full Time:</strong> Stipendio mensile fisso. 
              Traccia presenze ed eventuali assenze per la busta paga.
            </p>
          </div>

          {/* Lista */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users size={20} />
                Full Time - {meseCorrente}
              </h2>
            </div>
            
            {artistiFullTime.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nessun artista full time
              </div>
            ) : (
              <div className="divide-y">
                {artistiFullTime.map((artista) => (
                  <div key={artista.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="font-semibold text-green-600 text-lg">
                            {artista.cognome?.[0]}{artista.nome?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {artista.cognome} {artista.nome}
                          </p>
                          <p className="text-sm text-gray-500">
                            Stipendio: €{artista.cachetBase || '0'}/mese
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Presenze</p>
                          <p className="font-medium">0/22 giorni</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          Attivo
                        </span>
                        <button className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                          Presenze
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Segna Fattura */}
      {modalFattura && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              📄 Segna Fattura Ricevuta
            </h2>
            <p className="text-gray-600 mb-4">
              Artista: <strong>{modalFattura.cognome} {modalFattura.nome}</strong>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero Fattura *
                </label>
                <input
                  type="text"
                  value={formFattura.numeroFattura}
                  onChange={(e) => setFormFattura({...formFattura, numeroFattura: e.target.value})}
                  placeholder="Es: FT-2024-001"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fattura *
                </label>
                <input
                  type="date"
                  value={formFattura.dataFattura}
                  onChange={(e) => setFormFattura({...formFattura, dataFattura: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carica Fattura (opzionale)
                </label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center text-gray-500">
                  <Upload size={24} className="mx-auto mb-2" />
                  <p className="text-sm">Trascina o clicca per caricare PDF</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalFattura(null)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={() => confermaFatturaRicevuta(modalFattura.id)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Conferma Ricezione
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
