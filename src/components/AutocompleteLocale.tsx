// src/components/AutocompleteLocale.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, MapPin, Plus } from 'lucide-react'

interface Locale {
  id: string
  nome: string
  citta: string
  indirizzo?: string | null
  provincia?: string | null
  committenteDefaultId?: string | null
}

interface AutocompleteLocaleProps {
  value: string | null
  onChange: (id: string | null, locale: Locale | null) => void
  placeholder?: string
  disabled?: boolean
  onAddNew?: () => void
}

export default function AutocompleteLocale({
  value,
  onChange,
  placeholder = 'Cerca locale...',
  disabled = false,
  onAddNew,
}: AutocompleteLocaleProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Locale[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Locale | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Carica locale selezionato inizialmente
  useEffect(() => {
    if (value && !selected) {
      fetch(`/api/locali/${value}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setSelected(data)
            setQuery(`${data.nome} - ${data.citta}`)
          }
        })
        .catch(console.error)
    }
  }, [value, selected])

  // Cerca locali
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/locali?search=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Click outside per chiudere
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        if (!selected && query) {
          setQuery('')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selected, query])

  const handleSelect = (locale: Locale) => {
    setSelected(locale)
    setQuery(`${locale.nome} - ${locale.citta}`)
    setIsOpen(false)
    onChange(locale.id, locale)
  }

  const handleClear = () => {
    setSelected(null)
    setQuery('')
    setResults([])
    onChange(null, null)
    inputRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    setIsOpen(true)
    
    if (selected && newQuery !== `${selected.nome} - ${selected.citta}`) {
      setSelected(null)
      onChange(null, null)
    }
  }

  const handleFocus = () => {
    if (query.length >= 2) {
      setIsOpen(true)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${selected ? 'border-green-500 bg-green-50' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          `}
        />
        {(selected || query) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Risultati dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full mr-2"></div>
              Ricerca...
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-center text-gray-500">
              {query.length < 2 ? 'Digita almeno 2 caratteri' : (
                <div className="space-y-2">
                  <p>Nessun risultato</p>
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
                      Aggiungi nuovo locale
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {results.map(l => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleSelect(l)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-b last:border-b-0
                    ${l.id === selected?.id ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className="p-2 rounded-full bg-gray-100">
                    <MapPin size={16} className="text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{l.nome}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {l.indirizzo && `${l.indirizzo} - `}
                      {l.citta}
                      {l.provincia && ` (${l.provincia})`}
                    </div>
                  </div>
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
                  <div className="p-2 rounded-full bg-green-100">
                    <Plus size={16} className="text-green-600" />
                  </div>
                  <div className="font-medium text-green-700">Aggiungi nuovo locale</div>
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Info locale selezionato */}
      {selected && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <MapPin size={16} />
          {selected.nome} - {selected.indirizzo}, {selected.citta}
        </div>
      )}
    </div>
  )
}
