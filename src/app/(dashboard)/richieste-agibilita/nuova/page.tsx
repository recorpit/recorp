// src/app/(dashboard)/richieste-agibilita/nuova/page.tsx
// Nuova Richiesta Agibilità
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Save, Calendar, MapPin, Users, Plus, 
  Trash2, Search, X, Euro, AlertCircle
} from 'lucide-react'

interface LocaleOption {
  id: string
  nome: string
  citta: string | null
  indirizzo: string | null
}

interface ArtistaOption {
  id: string
  nome: string
  cognome: string
  nomeDarte: string | null
  cachetBase: number | null
}

interface ArtistaRichiesta {
  id: string | null
  nomeDarte: string
  nome: string
  cognome: string
  compensoNetto: number
  qualifica: string
  isNuovo: boolean
}

export default function NuovaRichiestaPage() {
  const router = useRouter()
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Form data
  const [dataEvento, setDataEvento] = useState('')
  const [dataFine, setDataFine] = useState('')
  
  // Locale
  const [localeSearch, setLocaleSearch] = useState('')
  const [localeResults, setLocaleResults] = useState<LocaleOption[]>([])
  const [localeSelezionato, setLocaleSelezionato] = useState<LocaleOption | null>(null)
  const [nuovoLocale, setNuovoLocale] = useState({ nome: '', citta: '', indirizzo: '' })
  const [isNuovoLocale, setIsNuovoLocale] = useState(false)
  const [showLocaleDropdown, setShowLocaleDropdown] = useState(false)
  
  // Artisti
  const [artisti, setArtisti] = useState<ArtistaRichiesta[]>([])
  const [artistaSearch, setArtistaSearch] = useState('')
  const [artistaResults, setArtistaResults] = useState<ArtistaOption[]>([])
  const [showArtistaDropdown, setShowArtistaDropdown] = useState(false)
  const [artistaManuale, setArtistaManuale] = useState({ nomeDarte: '', nome: '', cognome: '', compensoNetto: '', qualifica: 'Artista' })
  const [showArtistaManuale, setShowArtistaManuale] = useState(false)
  
  // Note
  const [note, setNote] = useState('')
  
  // Cerca locali
  useEffect(() => {
    if (localeSearch.length < 2) {
      setLocaleResults([])
      return
    }
    
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/locali?search=${encodeURIComponent(localeSearch)}&limit=10`)
        if (res.ok) {
          const data = await res.json()
          setLocaleResults(data.locali || data || [])
        }
      } catch (err) {
        console.error('Errore ricerca locali:', err)
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [localeSearch])
  
  // Cerca artisti per nome d'arte
  useEffect(() => {
    if (artistaSearch.length < 2) {
      setArtistaResults([])
      return
    }
    
    const timer = setTimeout(async () => {
      try {
        // Cerca solo per nome d'arte (privacy)
        const res = await fetch(`/api/artisti?searchNomeDarte=${encodeURIComponent(artistaSearch)}&limit=10`)
        if (res.ok) {
          const data = await res.json()
          setArtistaResults(data.artisti || data || [])
        }
      } catch (err) {
        console.error('Errore ricerca artisti:', err)
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [artistaSearch])
  
  // Seleziona locale
  const handleSelectLocale = (locale: LocaleOption) => {
    setLocaleSelezionato(locale)
    setLocaleSearch(locale.nome)
    setShowLocaleDropdown(false)
    setIsNuovoLocale(false)
  }
  
  // Nuovo locale
  const handleNuovoLocale = () => {
    setIsNuovoLocale(true)
    setLocaleSelezionato(null)
    setNuovoLocale({ nome: localeSearch, citta: '', indirizzo: '' })
    setShowLocaleDropdown(false)
  }
  
  // Aggiungi artista da ricerca
  const handleAddArtista = (artista: ArtistaOption) => {
    // Verifica non già aggiunto
    if (artisti.some(a => a.id === artista.id)) {
      setError('Artista già aggiunto')
      setTimeout(() => setError(''), 3000)
      return
    }
    
    setArtisti([...artisti, {
      id: artista.id,
      nomeDarte: artista.nomeDarte || '',
      nome: artista.nome,
      cognome: artista.cognome,
      compensoNetto: artista.cachetBase || 100,
      qualifica: 'Artista',
      isNuovo: false,
    }])
    
    setArtistaSearch('')
    setArtistaResults([])
    setShowArtistaDropdown(false)
  }
  
  // Aggiungi artista manuale
  const handleAddArtistaManuale = () => {
    if (!artistaManuale.nome && !artistaManuale.nomeDarte) {
      setError('Inserisci almeno nome d\'arte o nome/cognome')
      return
    }
    
    setArtisti([...artisti, {
      id: null,
      nomeDarte: artistaManuale.nomeDarte,
      nome: artistaManuale.nome,
      cognome: artistaManuale.cognome,
      compensoNetto: parseFloat(artistaManuale.compensoNetto) || 100,
      qualifica: artistaManuale.qualifica,
      isNuovo: true,
    }])
    
    setArtistaManuale({ nomeDarte: '', nome: '', cognome: '', compensoNetto: '', qualifica: 'Artista' })
    setShowArtistaManuale(false)
  }
  
  // Rimuovi artista
  const handleRemoveArtista = (index: number) => {
    setArtisti(artisti.filter((_, i) => i !== index))
  }
  
  // Aggiorna compenso artista
  const handleCompensoChange = (index: number, value: string) => {
    setArtisti(artisti.map((a, i) => 
      i === index ? { ...a, compensoNetto: parseFloat(value) || 0 } : a
    ))
  }
  
  // Salva richiesta
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!dataEvento) {
      setError('Data evento obbligatoria')
      return
    }
    
    if (!localeSelezionato && !isNuovoLocale) {
      setError('Seleziona o inserisci un locale')
      return
    }
    
    if (isNuovoLocale && !nuovoLocale.nome) {
      setError('Inserisci il nome del locale')
      return
    }
    
    if (artisti.length === 0) {
      setError('Aggiungi almeno un artista')
      return
    }
    
    setSaving(true)
    setError('')
    
    try {
      const body = {
        dataEvento,
        dataFine: dataFine || null,
        locale: isNuovoLocale 
          ? { id: null, nome: nuovoLocale.nome, citta: nuovoLocale.citta, indirizzo: nuovoLocale.indirizzo }
          : { id: localeSelezionato!.id, nome: localeSelezionato!.nome, citta: localeSelezionato!.citta },
        artisti: artisti.map(a => ({
          id: a.id,
          nomeDarte: a.nomeDarte,
          nome: a.nome,
          cognome: a.cognome,
          compensoNetto: a.compensoNetto,
          qualifica: a.qualifica,
        })),
        note,
      }
      
      const res = await fetch('/api/richieste-agibilita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nella creazione')
      }
      
      const richiesta = await res.json()
      router.push(`/richieste-agibilita/${richiesta.id}`)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  // Calcola totale
  const totaleCompensi = artisti.reduce((sum, a) => sum + a.compensoNetto, 0)
  
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/richieste-agibilita"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuova Richiesta Agibilità</h1>
          <p className="text-gray-500">Compila i dati per la richiesta</p>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data Evento */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            Data Evento
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inizio *
              </label>
              <input
                type="date"
                value={dataEvento}
                onChange={(e) => setDataEvento(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fine (opzionale)
              </label>
              <input
                type="date"
                value={dataFine}
                onChange={(e) => setDataFine(e.target.value)}
                min={dataEvento}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Locale */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-green-600" />
            Locale
          </h2>
          
          {!isNuovoLocale ? (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Cerca locale esistente..."
                  value={localeSearch}
                  onChange={(e) => {
                    setLocaleSearch(e.target.value)
                    setShowLocaleDropdown(true)
                    if (!e.target.value) setLocaleSelezionato(null)
                  }}
                  onFocus={() => setShowLocaleDropdown(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {localeSelezionato && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocaleSelezionato(null)
                      setLocaleSearch('')
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              
              {/* Dropdown risultati */}
              {showLocaleDropdown && localeSearch.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {localeResults.length > 0 ? (
                    <>
                      {localeResults.map((locale) => (
                        <button
                          key={locale.id}
                          type="button"
                          onClick={() => handleSelectLocale(locale)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">{locale.nome}</p>
                            {locale.citta && (
                              <p className="text-sm text-gray-500">{locale.citta}</p>
                            )}
                          </div>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleNuovoLocale}
                        className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 border-t flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Aggiungi "{localeSearch}" come nuovo locale
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNuovoLocale}
                      className="w-full px-4 py-3 text-left text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Nessun risultato - Aggiungi "{localeSearch}" come nuovo locale
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-600">Nuovo locale</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsNuovoLocale(false)
                    setNuovoLocale({ nome: '', citta: '', indirizzo: '' })
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Annulla
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Locale *
                  </label>
                  <input
                    type="text"
                    value={nuovoLocale.nome}
                    onChange={(e) => setNuovoLocale({ ...nuovoLocale, nome: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Città
                  </label>
                  <input
                    type="text"
                    value={nuovoLocale.citta}
                    onChange={(e) => setNuovoLocale({ ...nuovoLocale, citta: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indirizzo
                  </label>
                  <input
                    type="text"
                    value={nuovoLocale.indirizzo}
                    onChange={(e) => setNuovoLocale({ ...nuovoLocale, indirizzo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
          
          {localeSelezionato && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-800">{localeSelezionato.nome}</p>
              {localeSelezionato.citta && (
                <p className="text-sm text-green-600">{localeSelezionato.citta}</p>
              )}
            </div>
          )}
        </div>
        
        {/* Artisti */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={20} className="text-purple-600" />
            Artisti
          </h2>
          
          {/* Ricerca artista */}
          <div className="relative mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cerca per nome d'arte..."
                value={artistaSearch}
                onChange={(e) => {
                  setArtistaSearch(e.target.value)
                  setShowArtistaDropdown(true)
                }}
                onFocus={() => setShowArtistaDropdown(true)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Dropdown risultati artisti */}
            {showArtistaDropdown && artistaSearch.length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {artistaResults.length > 0 ? (
                  artistaResults.map((artista) => (
                    <button
                      key={artista.id}
                      type="button"
                      onClick={() => handleAddArtista(artista)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50"
                    >
                      <p className="font-medium">
                        {artista.nomeDarte || `${artista.nome} ${artista.cognome}`}
                      </p>
                      {artista.cachetBase && (
                        <p className="text-sm text-gray-500">
                          Cachet base: €{artista.cachetBase}
                        </p>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-sm">
                    Nessun artista trovato con questo nome d'arte
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowArtistaManuale(true)
                    setShowArtistaDropdown(false)
                    setArtistaManuale({ ...artistaManuale, nomeDarte: artistaSearch })
                  }}
                  className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 border-t flex items-center gap-2"
                >
                  <Plus size={16} />
                  Inserisci manualmente
                </button>
              </div>
            )}
          </div>
          
          {/* Form artista manuale */}
          {showArtistaManuale && (
            <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-blue-800">Inserimento manuale</span>
                <button
                  type="button"
                  onClick={() => setShowArtistaManuale(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome d'arte
                  </label>
                  <input
                    type="text"
                    value={artistaManuale.nomeDarte}
                    onChange={(e) => setArtistaManuale({ ...artistaManuale, nomeDarte: e.target.value })}
                    placeholder="Es: DJ Marco"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualifica
                  </label>
                  <select
                    value={artistaManuale.qualifica}
                    onChange={(e) => setArtistaManuale({ ...artistaManuale, qualifica: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DJ">DJ</option>
                    <option value="Vocalist">Vocalist</option>
                    <option value="Musicista">Musicista</option>
                    <option value="Ballerino">Ballerino</option>
                    <option value="Artista">Artista</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={artistaManuale.nome}
                    onChange={(e) => setArtistaManuale({ ...artistaManuale, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cognome
                  </label>
                  <input
                    type="text"
                    value={artistaManuale.cognome}
                    onChange={(e) => setArtistaManuale({ ...artistaManuale, cognome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compenso Netto (€)
                  </label>
                  <input
                    type="number"
                    value={artistaManuale.compensoNetto}
                    onChange={(e) => setArtistaManuale({ ...artistaManuale, compensoNetto: e.target.value })}
                    placeholder="100"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddArtistaManuale}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Aggiungi
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Lista artisti aggiunti */}
          {artisti.length > 0 ? (
            <div className="space-y-2">
              {artisti.map((artista, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {artista.nomeDarte || `${artista.nome} ${artista.cognome}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {artista.qualifica}
                      {artista.isNuovo && (
                        <span className="ml-2 text-xs text-blue-600">(nuovo)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">€</span>
                    <input
                      type="number"
                      value={artista.compensoNetto}
                      onChange={(e) => handleCompensoChange(index, e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveArtista(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              
              {/* Totale */}
              <div className="flex justify-end pt-2 border-t">
                <div className="text-right">
                  <span className="text-gray-500">Totale compensi: </span>
                  <span className="font-semibold text-lg">€{totaleCompensi.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Users size={40} className="mx-auto mb-2 opacity-50" />
              <p>Nessun artista aggiunto</p>
              <p className="text-sm">Cerca per nome d'arte o inserisci manualmente</p>
            </div>
          )}
        </div>
        
        {/* Note */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Note</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note aggiuntive per la richiesta..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Bottoni */}
        <div className="flex justify-end gap-3">
          <Link
            href="/richieste-agibilita"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annulla
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Save size={20} />
            )}
            Crea Richiesta
          </button>
        </div>
      </form>
    </div>
  )
}
