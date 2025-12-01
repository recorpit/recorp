// src/app/(dashboard)/impostazioni/anagrafiche/locali/page.tsx
'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Upload, Download, FileSpreadsheet, 
  CheckCircle, XCircle, Loader2, MapPin, Trash2
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

const REQUIRED_COLUMNS = ['nome', 'indirizzo', 'citta']
const OPTIONAL_COLUMNS = [
  'cap', 'provincia', 'codiceINPS', 'telefono', 'email',
  'committenteDefaultRagioneSociale', 'note'
]

export default function ImportLocaliPage() {
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
      
      const res = await fetch('/api/import/locali/preview', {
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
      
      const res = await fetch('/api/import/locali', {
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
    const res = await fetch('/api/import/locali/template')
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_locali.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportAll = async () => {
    const res = await fetch('/api/export/locali')
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `locali_export_${new Date().toISOString().split('T')[0]}.xlsx`
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
            <h1 className="text-2xl font-bold text-gray-900">Import Locali</h1>
            <p className="text-gray-500">Carica file Excel o CSV con i dati dei locali</p>
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
              <p className="mt-1 text-sm text-gray-700">
                ✓ {result.imported} nuovi locali importati
                {result.updated > 0 && ` • ${result.updated} aggiornati`}
              </p>
              <button onClick={handleReset} className="mt-3 text-sm text-blue-600 hover:underline">
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
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-purple-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <MapPin className="mx-auto text-gray-400 mb-4" size={48} />
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
              {OPTIONAL_COLUMNS.map(col => (
                <span key={col} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm font-mono">
                  {col}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Nota: Per associare un committente, usa la colonna &quot;committenteDefaultRagioneSociale&quot; 
              con il nome esatto del committente già presente nel sistema.
            </p>
          </div>
        </div>
      )}

      {/* Parsing */}
      {parsing && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Loader2 className="mx-auto text-purple-500 animate-spin mb-4" size={48} />
          <p className="text-gray-600">Analisi file in corso...</p>
        </div>
      )}

      {/* Preview */}
      {file && preview.length > 0 && !result && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="font-medium">{file.name}</span>
                <span className="text-green-600">{validRows} valide</span>
                {invalidRows > 0 && <span className="text-red-600">{invalidRows} errori</span>}
              </div>
              <button onClick={handleReset} className="p-2 hover:bg-gray-100 rounded-lg">
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={mode === 'create'} onChange={() => setMode('create')} />
                <span>Solo nuovi (salta duplicati nome+città)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={mode === 'update'} onChange={() => setMode('update')} />
                <span>Aggiorna esistenti</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Stato</th>
                    {columns.slice(0, 6).map(col => (
                      <th key={col} className="px-3 py-2 text-left">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 15).map((row) => (
                    <tr key={row.row} className={`border-t ${!row.valid ? 'bg-red-50' : ''}`}>
                      <td className="px-3 py-2">{row.row}</td>
                      <td className="px-3 py-2">
                        {row.valid ? <CheckCircle className="text-green-500" size={16} /> : <XCircle className="text-red-500" size={16} />}
                      </td>
                      {columns.slice(0, 6).map(col => (
                        <td key={col} className="px-3 py-2 truncate max-w-[150px]">{row.data[col] || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button onClick={handleReset} className="px-6 py-2.5 border rounded-lg hover:bg-gray-50">
              Annulla
            </button>
            <button
              onClick={handleImport}
              disabled={importing || validRows === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              Importa {validRows} locali
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
