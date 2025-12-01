// src/app/(dashboard)/agibilita/import-massivo/page.tsx
'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, FileArchive, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'

interface ImportResult {
  success: boolean
  codice?: string
  agibilitaId?: string
  error?: string
  fileName: string
}

export default function ImportMassivoPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ImportResult[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith('.zip')) {
        setFile(droppedFile)
        setResults([])
      } else {
        alert('Seleziona un file ZIP')
      }
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResults([])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setResults([])

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/agibilita/import-zip', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Errore durante l\'import')
      }

      setResults(data.results || [])
    } catch (err: any) {
      setResults([{
        success: false,
        error: err.message,
        fileName: file.name
      }])
    } finally {
      setLoading(false)
    }
  }

  const successCount = results.filter(r => r.success).length
  const errorCount = results.filter(r => !r.success).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/agibilita" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import ZIP INPS</h1>
          <p className="text-gray-500">Importa le ricevute INPS da file ZIP</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">Come funziona</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Carica il file ZIP scaricato dal portale INPS</li>
          <li>• Il sistema estrae automaticamente le ricevute PDF</li>
          <li>• Ogni ricevuta viene associata all&apos;agibilità corrispondente tramite il codice</li>
          <li>• Le agibilità vengono aggiornate allo stato &quot;COMPLETATA&quot;</li>
        </ul>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : file 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex flex-col items-center gap-3">
              <FileArchive size={48} className="text-green-500" />
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Rimuovi
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload size={48} className="text-gray-400" />
              <p className="font-medium text-gray-700">
                Trascina qui il file ZIP o clicca per selezionarlo
              </p>
              <p className="text-sm text-gray-500">Solo file .zip</p>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Seleziona File
              </label>
            </div>
          )}
        </div>

        {file && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Importazione in corso...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Avvia Import
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Risultati Import</h2>
            <div className="flex items-center gap-4 text-sm">
              {successCount > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle size={16} />
                  {successCount} importati
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle size={16} />
                  {errorCount} errori
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  result.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle size={20} className="text-green-500" />
                  ) : (
                    <XCircle size={20} className="text-red-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{result.fileName}</p>
                    {result.success ? (
                      <p className="text-sm text-green-600">
                        Importato → {result.codice}
                      </p>
                    ) : (
                      <p className="text-sm text-red-600">{result.error}</p>
                    )}
                  </div>
                </div>
                {result.success && result.agibilitaId && (
                  <Link
                    href={`/agibilita/${result.agibilitaId}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Visualizza
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}