// src/app/(dashboard)/impostazioni/anagrafiche/artisti/page.tsx
'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Upload, Download, FileSpreadsheet, 
  CheckCircle, XCircle, AlertTriangle, Loader2,
  Users, Trash2
} from 'lucide-react'

interface PreviewRow {
  row: number
  data: Record<string, string>
  errors: string[]
  warnings: string[]
  valid: boolean
}

interface ImportResult {
  success: boolean
  imported: number
  updated: number
  errors: { row: number; message: string }[]
}

const REQUIRED_COLUMNS = ['cognome', 'nome', 'codiceFiscale']
const OPTIONAL_COLUMNS = [
  'nomeDarte', 'dataNascita', 'luogoNascita', 'provinciaNascita',
  'sesso', 'cittadinanza', 'indirizzo', 'cap', 'citta', 'provincia',
  'telefono', 'email', 'iban', 'qualifica', 'cachetBase',
  'tipoContratto', 'tipoDocumento', 'numeroDocumento', 'scadenzaDocumento'
]

export default function ImportArtistiPage() {
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [mode, setMode] = useState<'create' | 'update'>('create')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    setFile(selectedFile)
    setResult(null)
    setParsing(true)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const res = await fetch('/api/import/artisti/preview', {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore parsing file')
      }
      
      const data = await res.json()
      setColumns(data.columns)
      setPreview(data.rows)
    } catch (err: any) {
      alert(`Errore: ${err.message}`)
      setFile(null)
    } finally {
      setParsing(false)
    }
  }

  const handleImport = async () => {
    if (!file) return
    
    setImporting(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', mode)
      
      const res = await fetch('/api/import/artisti', {
        method: 'POST',
        body: formData,
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Errore import')
      }
      
      setResult(data)
    } catch (err: any) {
      alert(`Errore: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  const handleExportTemplate = async () => {
    const res = await fetch('/api/import/artisti/template')
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_artisti.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportAll = async () => {
    const res = await fetch('/api/export/artisti')
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `artisti_export_${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setFile(null)
    setPreview([])
    setColumns([])
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validRows = preview.filter(r => r.valid).length
  const invalidRows = preview.filter(r => !r.valid).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/impostazioni/anagrafiche" 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import Artisti</h1>
            <p className="text-gray-500">Carica file Excel o CSV con i dati degli artisti</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportTemplate}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download size={18} />
            Scarica Template
          </button>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FileSpreadsheet size={18} />
            Esporta Tutti
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`mb-6 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
            ) : (
              <XCircle className="text-red-600 flex-shrink-0" size={24} />
            )}
            <div className="flex-1">
              <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Import completato!' : 'Import completato con errori'}
              </p>
              <div className="mt-2 text-sm">
                <p className="text-gray-700">
                  ✓ {result.imported} nuovi artisti importati
                  {result.updated > 0 && ` • ${result.updated} aggiornati`}
                </p>
                {result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-red-700 font-medium">Errori:</p>
                    <ul className="mt-1 space-y-1">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i} className="text-red-600">
                          Riga {err.row}: {err.message}
                        </li>
                      ))}
                      {result.errors.length > 5 && (
                        <li className="text-red-600">...e altri {result.errors.length - 5} errori</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={handleReset}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Carica un altro file
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!file && !result && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-lg font-medium text-gray-700">
              Trascina qui il file o clicca per selezionare
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Formati supportati: .xlsx, .xls, .csv
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          
          {/* Colonne Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-700 mb-2">Colonne richieste:</p>
            <div className="flex flex-wrap gap-2">
              {REQUIRED_COLUMNS.map(col => (
                <span key={col} className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-mono">
                  {col}
                </span>
              ))}
            </div>
            <p className="font-medium text-gray-700 mt-4 mb-2">Colonne opzionali:</p>
            <div className="flex flex-wrap gap-2">
              {OPTIONAL_COLUMNS.slice(0, 10).map(col => (
                <span key={col} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm font-mono">
                  {col}
                </span>
              ))}
              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm">
                +{OPTIONAL_COLUMNS.length - 10} altre
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Parsing */}
      {parsing && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Loader2 className="mx-auto text-blue-500 animate-spin mb-4" size={48} />
          <p className="text-gray-600">Analisi file in corso...</p>
        </div>
      )}

      {/* Preview */}
      {file && preview.length > 0 && !result && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="text-gray-500" size={20} />
                  <span className="font-medium">{file.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle size={16} />
                    {validRows} valide
                  </span>
                  {invalidRows > 0 && (
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle size={16} />
                      {invalidRows} con errori
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleReset}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="font-medium text-gray-700 mb-3">Modalità import:</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="create"
                  checked={mode === 'create'}
                  onChange={() => setMode('create')}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Solo nuovi (salta duplicati CF)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="update"
                  checked={mode === 'update'}
                  onChange={() => setMode('update')}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Aggiorna esistenti (match per CF)</span>
              </label>
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-medium text-gray-700">Anteprima dati (prime 20 righe)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 w-12">#</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 w-16">Stato</th>
                    {columns.slice(0, 8).map(col => (
                      <th key={col} className="px-3 py-2 text-left font-medium text-gray-600">
                        {col}
                      </th>
                    ))}
                    {columns.length > 8 && (
                      <th className="px-3 py-2 text-left font-medium text-gray-600">
                        +{columns.length - 8}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 20).map((row) => (
                    <tr 
                      key={row.row} 
                      className={`border-t ${!row.valid ? 'bg-red-50' : row.warnings.length > 0 ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="px-3 py-2 text-gray-500">{row.row}</td>
                      <td className="px-3 py-2">
                        {row.valid ? (
                          row.warnings.length > 0 ? (
                            <AlertTriangle className="text-yellow-500" size={16} />
                          ) : (
                            <CheckCircle className="text-green-500" size={16} />
                          )
                        ) : (
                          <XCircle className="text-red-500" size={16} />
                        )}
                      </td>
                      {columns.slice(0, 8).map(col => (
                        <td key={col} className="px-3 py-2 truncate max-w-[150px]">
                          {row.data[col] || '-'}
                        </td>
                      ))}
                      {columns.length > 8 && (
                        <td className="px-3 py-2 text-gray-400">...</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.length > 20 && (
              <div className="p-3 bg-gray-50 text-center text-sm text-gray-500 border-t">
                ...e altre {preview.length - 20} righe
              </div>
            )}
          </div>

          {/* Errors Detail */}
          {invalidRows > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-800 mb-2">Righe con errori:</p>
              <ul className="space-y-1 text-sm text-red-700">
                {preview.filter(r => !r.valid).slice(0, 10).map(row => (
                  <li key={row.row}>
                    Riga {row.row}: {row.errors.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Import Button */}
          <div className="flex justify-end gap-4">
            <button
              onClick={handleReset}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleImport}
              disabled={importing || validRows === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {importing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Importazione...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Importa {validRows} artisti
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
