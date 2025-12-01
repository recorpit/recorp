// src/components/AutocompleteArtista.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, User, X, AlertTriangle, Plus } from 'lucide-react'

interface Artista {
  id: string
  nome: string
  cognome: string
  nomeDarte?: string | null
  codiceFiscale?: string | null
  qualifica?: string | null
  iscritto: boolean
  cachetBase?: number | null
}

interface AutocompleteArtistaProps {
  // Modalità selezione singola (controllato)
  value?: string | null
  onChange?: (id: string | null, artista: Artista | null) => void
  // Modalità aggiungi multipli
  onSelect?: (artista: Artista) => void
  placeholder?: string
  disabled?: boolean
  excludeIds?: string[] // ID da escludere (già selezionati)
  onAddNew?: () => void
}

export default function AutocompleteArtista({
  value,
  onChange,
  onSelect,
  placeholder = 'Cerca artista...',
  disabled = false,
  excludeIds = [],
  onAddNew,
}: AutocompleteArtistaProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Artista[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<Artista | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Modalità: singolo (con value/onChange) o multiplo (con onSelect)
  const isSingleMode = onChange !== undefined && onSelect === undefined

  // Carica artista selezionato (solo in modalità singola)
  useEffect(() => {
    if (!isSingleMode) return
    
    if (value && !selected) {
      fetch(`/api/artisti/${value}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) setSelected(data)
        })
        .catch(() => {})
    } else if (!value && selected) {
      setSelected(null)
    }
  }, [value, isSingleMode]) // Rimosso 'selected' dalle dipendenze per evitare loop

  // Ricerca con debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.length < 2) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/artisti?search=${encodeURIComponent(query)}`)
        if (res.ok) {
          let data = await res.json()
          // Filtra gli ID esclusi
          if (excludeIds.length > 0) {
            data = data.filter((a: Artista) => !excludeIds.includes(a.id))
          }
          setResults(data.slice(0, 10))
        }
      } catch (err) {
        console.error('Errore ricerca artisti:', err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, excludeIds.join(',')]) // Usa join per stabilizzare la dipendenza

  // Click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (artista: Artista) => {
    if (onSelect) {
      // Modalità multipla: chiama onSelect e pulisci
      onSelect(artista)
      setQuery('')
      setResults([])
    } else if (onChange) {
      // Modalità singola: seleziona e notifica
      setSelected(artista)
      onChange(artista.id, artista)
    }
    setIsOpen(false)
  }

  const handleClear = () => {
    setSelected(null)
    if (onChange) {
      onChange(null, null)
    }
    setQuery('')
  }

  const formatNome = (a: Artista) => {
    let nome = `${a.cognome} ${a.nome}`
    if (a.nomeDarte) nome += ` "${a.nomeDarte}"`
    return nome
  }

  // Mostra artista selezionato (solo in modalità singola)
  if (isSingleMode && selected) {
    return (
      <div className={`flex items-center justify-between p-3 border rounded-lg ${!selected.iscritto ? 'border-yellow-400 bg-yellow-50' : 'border-green-500 bg-green-50'}`}>
        <div className="flex items-center gap-3">
          <User className={selected.iscritto ? 'text-green-600' : 'text-yellow-600'} size={20} />
          <div>
            <p className="font-medium">{formatNome(selected)}</p>
            <p className="text-xs text-gray-500">
              {selected.qualifica || 'Qualifica N/D'}
              {selected.codiceFiscale && ` • ${selected.codiceFiscale}`}
            </p>
          </div>
          {!selected.iscritto && (
            <span className="ml-2 px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded">
              Dati incompleti
            </span>
          )}
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <X size={18} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
          {results.map((artista) => (
            <button
              key={artista.id}
              type="button"
              onClick={() => handleSelect(artista)}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-b last:border-b-0"
            >
              <User className={artista.iscritto ? 'text-green-500' : 'text-yellow-500'} size={18} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {formatNome(artista)}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {artista.qualifica || 'Qualifica N/D'}
                  {artista.cachetBase && ` • Cachet base: €${artista.cachetBase}`}
                </div>
              </div>
              {!artista.iscritto && (
                <AlertTriangle className="text-yellow-500 flex-shrink-0" size={16} />
              )}
            </button>
          ))}
          {onAddNew && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onAddNew()
              }}
              className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-center gap-3 border-t bg-gray-50"
            >
              <div className="p-1 rounded-full bg-green-100">
                <Plus size={16} className="text-green-600" />
              </div>
              <div className="font-medium text-green-700">Aggiungi nuovo artista</div>
            </button>
          )}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          <p className="mb-2">Nessun artista trovato</p>
          {onAddNew && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onAddNew()
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
            >
              <Plus size={16} />
              Aggiungi nuovo artista
            </button>
          )}
        </div>
      )}
    </div>
  )
}
