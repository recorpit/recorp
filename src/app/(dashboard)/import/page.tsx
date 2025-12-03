// src/app/(dashboard)/import/page.tsx
// Pagina Import Storico Dati
'use client'

import { useState, useEffect } from 'react'
import { 
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, 
  Loader2, Users, MapPin, FileText, Layers,
  Play, Eye, RefreshCw
} from 'lucide-react'

interface FormatResult {
  totale: number
  creati: number
  esistenti: number
  errori: string[]
  dettagli: Array<{
    nome: string
    stato: string
    id?: string
    tipo?: string
  }>
}

export default function ImportPage() {
  const [loadingFormats, setLoadingFormats] = useState(false)
  const [formatResult, setFormatResult] = useState<FormatResult | null>(null)
  const [isDryRun, setIsDryRun] = useState(true)
  const [existingFormats, setExistingFormats] = useState<any[]>([])
  const [stats, setStats] = useState<{ artisti: number, locali: number, agibilita: number, formats: number } | null>(null)

  // Carica statistiche e format esistenti
  useEffect(() => {
    loadStats()
    loadExistingFormats()
  }, [])

  const loadStats = async () => {
    try {
      const [resAgib, resFormats] = await Promise.all([
        fetch('/api/import/agibilita'),
        fetch('/api/import/formats')
      ])
      
      if (resAgib.ok) {
        const dataAgib = await resAgib.json()
        const dataFormats = resFormats.ok ? await resFormats.json() : { totale: 0 }
        setStats({ ...dataAgib, formats: dataFormats.totale })
      }
    } catch (err) {
      console.error('Errore caricamento stats:', err)
    }
  }

  const loadExistingFormats = async () => {
    try {
      const res = await fetch('/api/import/formats')
      if (res.ok) {
        const data = await res.json()
        setExistingFormats(data.formats || [])
      }
    } catch (err) {
      console.error('Errore caricamento formats:', err)
    }
  }

  const handleImportFormats = async (dryRun: boolean) => {
    setLoadingFormats(true)
    setIsDryRun(dryRun)
    setFormatResult(null)
    
    try {
      const res = await fetch('/api/import/formats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      })
      
      const data = await res.json()
      
      if (data.error) {
        setFormatResult({
          totale: 0,
          creati: 0,
          esistenti: 0,
          errori: [data.error],
          dettagli: []
        })
      } else {
        setFormatResult(data.result)
        if (!dryRun) {
          loadStats()
          loadExistingFormats()
        }
      }
      
    } catch (err: any) {
      setFormatResult({
        totale: 0,
        creati: 0,
        esistenti: 0,
        errori: [`Errore: ${err.message}`],
        dettagli: []
      })
    } finally {
      setLoadingFormats(false)
    }
  }

  const formatNumber = (n?: number) => n?.toLocaleString('it-IT') || '0'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Upload className="text-blue-600" size={28} />
          Import Storico
        </h1>
        <p className="text-gray-500">Importa dati storici da DATABASE_RECORP_2025.xlsx</p>
      </div>

      {/* Stats attuali */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Artisti</p>
                <p className="text-xl font-bold">{formatNumber(stats.artisti)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Locali</p>
                <p className="text-xl font-bold">{formatNumber(stats.locali)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Layers size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Format</p>
                <p className="text-xl font-bold">{formatNumber(stats.formats)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Agibilità</p>
                <p className="text-xl font-bold">{formatNumber(stats.agibilita)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Format */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="text-purple-600" size={20} />
              1. Import Format
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Importa i 12 format identificati nel file Excel
            </p>
          </div>
          <button
            onClick={() => loadExistingFormats()}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Ricarica"
          >
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Format esistenti */}
        {existingFormats.length > 0 && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Format già presenti ({existingFormats.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {existingFormats.map(f => (
                <span 
                  key={f.id}
                  className={`px-2 py-1 rounded text-sm ${
                    f.attivo ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {f.nome}
                  {f._count?.agibilita > 0 && (
                    <span className="ml-1 text-xs opacity-70">({f._count.agibilita})</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Lista format da importare */}
        <div className="mb-4 p-4 bg-purple-50 rounded-lg">
          <p className="text-sm font-medium text-purple-700 mb-2">
            Format da importare (12):
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            <div className="space-y-1">
              <p>• BESAME (714)</p>
              <p>• 90 WONDERLAND (432)</p>
              <p>• TWISH (288)</p>
              <p>• SUAVEMENTE (115)</p>
            </div>
            <div className="space-y-1">
              <p>• ASBRONZATISSIMI (109)</p>
              <p>• CUORE MATTO (79)</p>
              <p>• SWING (36)</p>
              <p>• CRASH (27)</p>
            </div>
            <div className="space-y-1">
              <p>• 2000 CHE STORIES (26)</p>
              <p>• BEAT (23)</p>
              <p>• 90 TIME (7)</p>
              <p>• BAILAMOS (6)</p>
            </div>
          </div>
          <p className="text-xs text-purple-600 mt-2">
            Esclusi: Piterpan (partner), Berti (partner), interni (LMDT, MDT)
          </p>
        </div>

        {/* Azioni */}
        <div className="flex gap-3">
          <button
            onClick={() => handleImportFormats(true)}
            disabled={loadingFormats}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50 font-medium"
          >
            {loadingFormats && isDryRun ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Eye size={18} />
            )}
            Anteprima
          </button>
          <button
            onClick={() => handleImportFormats(false)}
            disabled={loadingFormats}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
          >
            {loadingFormats && !isDryRun ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Play size={18} />
            )}
            Importa Format
          </button>
        </div>

        {/* Risultato */}
        {formatResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              {formatResult.errori.length === 0 ? (
                <CheckCircle className="text-green-600" size={20} />
              ) : (
                <AlertCircle className="text-red-600" size={20} />
              )}
              <span className="font-medium">
                {isDryRun ? 'Anteprima' : 'Import completato'}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center p-2 bg-white rounded">
                <p className="text-2xl font-bold text-green-600">{formatResult.creati}</p>
                <p className="text-xs text-gray-500">{isDryRun ? 'Da creare' : 'Creati'}</p>
              </div>
              <div className="text-center p-2 bg-white rounded">
                <p className="text-2xl font-bold text-blue-600">{formatResult.esistenti}</p>
                <p className="text-xs text-gray-500">Già esistenti</p>
              </div>
              <div className="text-center p-2 bg-white rounded">
                <p className="text-2xl font-bold text-red-600">{formatResult.errori.length}</p>
                <p className="text-xs text-gray-500">Errori</p>
              </div>
            </div>

            {formatResult.dettagli.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-auto">
                {formatResult.dettagli.map((d, i) => (
                  <div 
                    key={i}
                    className={`flex items-center justify-between px-2 py-1 rounded text-sm ${
                      d.stato === 'CREATO' || d.stato === 'DA_CREARE' 
                        ? 'bg-green-100' 
                        : 'bg-gray-100'
                    }`}
                  >
                    <span>{d.nome}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      d.stato === 'CREATO' ? 'bg-green-500 text-white' :
                      d.stato === 'DA_CREARE' ? 'bg-yellow-500 text-white' :
                      'bg-gray-400 text-white'
                    }`}>
                      {d.stato}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {formatResult.errori.length > 0 && (
              <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-600">
                {formatResult.errori.map((e, i) => (
                  <p key={i}>• {e}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prossimi step */}
      <div className="bg-white rounded-xl shadow-sm border p-6 opacity-60">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
          <FileText className="text-orange-600" size={20} />
          2. Import Agibilità (prossimo step)
        </h2>
        <p className="text-sm text-gray-500">
          Dopo aver importato i format, procederemo con l'import delle agibilità
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 opacity-60">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
          <FileSpreadsheet className="text-blue-600" size={20} />
          3. Import Fatture da Danea (futuro)
        </h2>
        <p className="text-sm text-gray-500">
          Import fatture da export Danea
        </p>
      </div>
    </div>
  )
}
