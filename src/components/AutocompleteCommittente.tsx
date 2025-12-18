// src/components/AutocompleteCommittente.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, AlertTriangle, Building2, Plus } from 'lucide-react'

interface Committente {
  id: string
  ragioneSociale: string
  partitaIva?: string
  codiceFiscale?: string
  aRischio?: boolean
  quotaAgenzia?: string | number
}

interface AutocompleteCommittenteProps {
  value: string | null
  onChange: (id: string | null, committente: Committente | null) => void
  placeholder?: string
  disabled?: boolean
  onAddNew?: () => void
}

export default function AutocompleteCommittente({
  value,
  onChange,
  placeholder = 'Cerca committente...',
  disabled = false,
  onAddNew,
}: AutocompleteCommittenteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Committente[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Committente | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Carica committente selezionato inizialmente
  useEffect(() => {
    if (value && !selected) {
      fetch(`/api/committenti/${value}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setSelected(data)
            setQuery(data.ragioneSociale)
          }
        })
        .catch(console.error)
    }
  }, [value, selected])

  // Cerca committenti
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/committenti?search=${encodeURIComponent(query)}`)
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
        // Se non c'è selezione, ripristina il testo
        if (!selected && query) {
          setQuery('')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selected, query])

  const handleSelect = (committente: Committente) => {
    setSelected(committente)
    setQuery(committente.ragioneSociale)
    setIsOpen(false)
    onChange(committente.id, committente)
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
    
    // Se l'utente modifica il testo dopo una selezione, deseleziona
    if (selected && newQuery !== selected.ragioneSociale) {
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
                      Aggiungi nuovo committente
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {results.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-b last:border-b-0
                    ${c.id === selected?.id ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className={`p-2 rounded-full ${c.aRischio ? 'bg-red-100' : 'bg-gray-100'}`}>
                    <Building2 size={16} className={c.aRischio ? 'text-red-600' : 'text-gray-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {c.ragioneSociale}
                      {c.aRischio && (
                        <AlertTriangle size={14} className="text-red-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {c.partitaIva && `P.IVA: ${c.partitaIva}`}
                      {c.partitaIva && c.codiceFiscale && ' • '}
                      {c.codiceFiscale && `CF: ${c.codiceFiscale}`}
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
                  <div className="font-medium text-green-700">Aggiungi nuovo committente</div>
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Mostra info committente selezionato */}
      {selected && selected.aRischio && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={16} />
          Committente a rischio - pagamento artista su DOPO_INCASSO
        </div>
      )}
    </div>
  )
}
