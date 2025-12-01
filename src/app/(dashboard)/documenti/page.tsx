// src/app/(dashboard)/documenti/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import {
  FileText, Upload, Search, Download, Trash2, Eye,
  Folder, FolderOpen, Image, FileSpreadsheet, File, FileVideo,
  FileAudio, X, RefreshCw, Building2, MapPin,
  Grid, List as ListIcon, ChevronRight, Home
} from 'lucide-react'

const CATEGORIE = [
  { value: 'ARCHIVIO', label: 'Archivio', icon: Folder, color: 'bg-gray-100 text-gray-600' },
  { value: 'COMMITTENTI', label: 'Committenti', icon: Building2, color: 'bg-green-100 text-green-600' },
  { value: 'DOCUMENTI', label: 'Documenti', icon: FileText, color: 'bg-blue-100 text-blue-600' },
  { value: 'LOCALI', label: 'Locali', icon: MapPin, color: 'bg-purple-100 text-purple-600' },
  { value: 'RICEVUTE', label: 'Ricevute', icon: File, color: 'bg-orange-100 text-orange-600' },
]

const getFileIcon = (mimeType: string | null, estensione: string | null) => {
  const type = mimeType?.toLowerCase() || ''
  const ext = estensione?.toLowerCase() || ''
  
  if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return Image
  if (type.includes('pdf') || ext === 'pdf') return FileText
  if (type.includes('spreadsheet') || ['xlsx', 'xls', 'csv'].includes(ext)) return FileSpreadsheet
  if (type.includes('video') || ['mp4', 'avi', 'mov'].includes(ext)) return FileVideo
  if (type.includes('audio') || ['mp3', 'wav', 'ogg'].includes(ext)) return FileAudio
  
  return File
}

const formatBytes = (bytes: number | null) => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type Documento = {
  id: string
  nome: string
  nomeVisualizzato: string
  path: string
  categoria: string
  sottoCartella: string | null
  dimensione: number
  estensione: string
  mimeType: string
  createdAt: string
  modifiedAt: string
}

export default function DocumentiPage() {
  const [documenti, setDocumenti] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [sottoCartellaFiltro, setSottoCartellaFiltro] = useState('')
  const [sottoCartelle, setSottoCartelle] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [totale, setTotale] = useState(0)
  const [statistiche, setStatistiche] = useState<Record<string, number>>({})
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form upload
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    categoria: 'archivio',
    sottoCartella: '',
    nuovaSottoCartella: '',
  })
  
  const loadDocumenti = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoriaFiltro) params.set('categoria', categoriaFiltro.toLowerCase())
      if (sottoCartellaFiltro) params.set('sottoCartella', sottoCartellaFiltro)
      
      const res = await fetch(`/api/documenti?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDocumenti(data.documenti || [])
        setTotale(data.totale || 0)
        setStatistiche(data.statistiche || {})
        setSottoCartelle(data.sottoCartelle || [])
      }
    } catch (error) {
      console.error('Errore caricamento documenti:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadDocumenti()
  }, [search, categoriaFiltro, sottoCartellaFiltro])
  
  // Reset sottocartella quando cambia categoria
  useEffect(() => {
    setSottoCartellaFiltro('')
  }, [categoriaFiltro])
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadForm(prev => ({
        ...prev,
        file,
        categoria: categoriaFiltro?.toLowerCase() || 'altro',
        sottoCartella: sottoCartellaFiltro || '',
      }))
      setShowUploadModal(true)
    }
  }
  
  const handleUpload = async () => {
    if (!uploadForm.file) return
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadForm.file)
      formData.append('categoria', uploadForm.categoria)
      
      // Usa nuova sottocartella se specificata, altrimenti quella esistente
      const sottoCartella = uploadForm.nuovaSottoCartella.trim() || uploadForm.sottoCartella
      if (sottoCartella) {
        formData.append('sottoCartella', sottoCartella)
      }
      
      const res = await fetch('/api/documenti', {
        method: 'POST',
        body: formData,
      })
      
      if (res.ok) {
        setShowUploadModal(false)
        setUploadForm({
          file: null,
          categoria: 'archivio',
          sottoCartella: '',
          nuovaSottoCartella: '',
        })
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        loadDocumenti()
      } else {
        const err = await res.json()
        alert(err.error || 'Errore upload')
      }
    } catch (error) {
      console.error('Errore upload:', error)
      alert('Errore durante il caricamento')
    } finally {
      setUploading(false)
    }
  }
  
  const handleDelete = async (doc: Documento) => {
    if (!confirm(`Sei sicuro di voler eliminare "${doc.nome}"?`)) return
    
    try {
      const res = await fetch(`/api/documenti/${doc.id}`, { method: 'DELETE' })
      if (res.ok) {
        loadDocumenti()
        if (selectedDoc?.id === doc.id) {
          setSelectedDoc(null)
        }
      } else {
        const err = await res.json()
        alert(err.error || 'Errore eliminazione')
      }
    } catch (error) {
      console.error('Errore eliminazione:', error)
    }
  }
  
  const getCategoriaInfo = (cat: string) => {
    return CATEGORIE.find(c => c.value === cat.toUpperCase()) || CATEGORIE[CATEGORIE.length - 1]
  }
  
  // Raggruppa documenti per sottocartella se siamo in una categoria
  const documentiRaggruppati = categoriaFiltro && !sottoCartellaFiltro
    ? documenti.reduce((acc, doc) => {
        const key = doc.sottoCartella || '__root__'
        if (!acc[key]) acc[key] = []
        acc[key].push(doc)
        return acc
      }, {} as Record<string, Documento[]>)
    : null
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documenti & Archivio</h1>
          <p className="text-gray-500">{totale} documenti trovati</p>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload size={20} />
            Carica Documento
          </button>
        </div>
      </div>
      
      {/* Breadcrumb */}
      {(categoriaFiltro || sottoCartellaFiltro) && (
        <div className="flex items-center gap-2 text-sm">
          <button 
            onClick={() => { setCategoriaFiltro(''); setSottoCartellaFiltro('') }}
            className="flex items-center gap-1 text-gray-600 hover:text-blue-600"
          >
            <Home size={16} />
            Archivio
          </button>
          
          {categoriaFiltro && (
            <>
              <ChevronRight size={16} className="text-gray-400" />
              <button 
                onClick={() => setSottoCartellaFiltro('')}
                className={`flex items-center gap-1 ${sottoCartellaFiltro ? 'text-gray-600 hover:text-blue-600' : 'text-blue-600 font-medium'}`}
              >
                {getCategoriaInfo(categoriaFiltro).label}
              </button>
            </>
          )}
          
          {sottoCartellaFiltro && (
            <>
              <ChevronRight size={16} className="text-gray-400" />
              <span className="text-blue-600 font-medium">{sottoCartellaFiltro}</span>
            </>
          )}
        </div>
      )}
      
      {/* Categorie (solo se non siamo in una categoria) */}
      {!categoriaFiltro && (
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
          {CATEGORIE.map(cat => {
            const Icon = cat.icon
            const count = statistiche[cat.value] || 0
            
            return (
              <button
                key={cat.value}
                onClick={() => setCategoriaFiltro(cat.value)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all text-center group"
              >
                <div className={`w-12 h-12 mx-auto rounded-lg ${cat.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <Icon size={24} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 truncate">{cat.label}</p>
              </button>
            )
          })}
        </div>
      )}
      
      {/* Sottocartelle (se siamo in una categoria ma non in una sottocartella) */}
      {categoriaFiltro && !sottoCartellaFiltro && sottoCartelle.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Cartelle</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {sottoCartelle.map(folder => {
              const docsInFolder = documenti.filter(d => d.sottoCartella === folder).length
              return (
                <button
                  key={folder}
                  onClick={() => setSottoCartellaFiltro(folder)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all text-left"
                >
                  <FolderOpen className="text-yellow-500" size={24} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{folder}</p>
                    <p className="text-xs text-gray-500">{docsInFolder} file</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Filtri e Ricerca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cerca documenti..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <ListIcon size={20} />
          </button>
          
          <button
            onClick={loadDocumenti}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Ricarica"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      {/* Lista Documenti */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : documenti.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Folder className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun documento</h3>
          <p className="text-gray-500 mb-4">
            {search 
              ? 'Nessun documento corrisponde alla ricerca'
              : categoriaFiltro 
                ? 'Questa cartella è vuota'
                : 'Inizia caricando il tuo primo documento'
            }
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Upload size={20} />
            Carica Documento
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {documenti.map(doc => {
            const FileIcon = getFileIcon(doc.mimeType, doc.estensione)
            const catInfo = getCategoriaInfo(doc.categoria)
            
            return (
              <div
                key={doc.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow group"
              >
                <div className="relative mb-3">
                  <div className={`w-full aspect-square rounded-lg ${catInfo.color.split(' ')[0]} flex items-center justify-center`}>
                    <FileIcon className={catInfo.color.split(' ')[1]} size={48} />
                  </div>
                  
                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all rounded-lg">
                    <a
                      href={`/api/documenti/${doc.id}/download`}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                      title="Scarica"
                    >
                      <Download size={18} />
                    </a>
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                      title="Dettagli"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-2 bg-white rounded-full hover:bg-red-100 text-red-600"
                      title="Elimina"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-medium text-gray-900 text-sm truncate" title={doc.nome}>
                  {doc.nomeVisualizzato}
                </h3>
                <p className="text-xs text-gray-500">{formatBytes(doc.dimensione)}</p>
                
                {/* Sottocartella */}
                {doc.sottoCartella && !sottoCartellaFiltro && (
                  <button
                    onClick={() => setSottoCartellaFiltro(doc.sottoCartella!)}
                    className="mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded truncate block w-full text-left hover:bg-gray-200"
                  >
                    📁 {doc.sottoCartella}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Nome</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Cartella</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Dimensione</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Modificato</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documenti.map(doc => {
                const FileIcon = getFileIcon(doc.mimeType, doc.estensione)
                const catInfo = getCategoriaInfo(doc.categoria)
                
                return (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${catInfo.color}`}>
                          <FileIcon size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doc.nomeVisualizzato}</p>
                          <p className="text-xs text-gray-500">{doc.estensione?.toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {doc.sottoCartella ? (
                        <button
                          onClick={() => setSottoCartellaFiltro(doc.sottoCartella!)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {doc.sottoCartella}
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatBytes(doc.dimensione)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(doc.modifiedAt).toLocaleDateString('it-IT')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/api/documenti/${doc.id}/download`}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Scarica"
                        >
                          <Download size={18} />
                        </a>
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Dettagli"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Elimina"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Carica Documento</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* File Info */}
              {uploadForm.file && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="text-blue-600" size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{uploadForm.file.name}</p>
                    <p className="text-sm text-gray-500">{formatBytes(uploadForm.file.size)}</p>
                  </div>
                </div>
              )}
              
              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={uploadForm.categoria}
                  onChange={e => setUploadForm(prev => ({ ...prev, categoria: e.target.value, sottoCartella: '' }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIE.map(cat => (
                    <option key={cat.value} value={cat.value.toLowerCase()}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Sottocartella esistente */}
              {sottoCartelle.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cartella Cliente
                  </label>
                  <select
                    value={uploadForm.sottoCartella}
                    onChange={e => setUploadForm(prev => ({ ...prev, sottoCartella: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Nessuna (root) --</option>
                    {sottoCartelle.map(folder => (
                      <option key={folder} value={folder}>{folder}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Nuova sottocartella */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Oppure crea nuova cartella
                </label>
                <input
                  type="text"
                  value={uploadForm.nuovaSottoCartella}
                  onChange={e => setUploadForm(prev => ({ ...prev, nuovaSottoCartella: e.target.value }))}
                  placeholder="Nome nuova cartella..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    Caricamento...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Carica
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Dettagli */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Dettagli Documento</h3>
              <button onClick={() => setSelectedDoc(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                {(() => {
                  const FileIcon = getFileIcon(selectedDoc.mimeType, selectedDoc.estensione)
                  const catInfo = getCategoriaInfo(selectedDoc.categoria)
                  return (
                    <div className={`p-4 rounded-lg ${catInfo.color}`}>
                      <FileIcon size={40} />
                    </div>
                  )
                })()}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{selectedDoc.nomeVisualizzato}</h4>
                  <p className="text-sm text-gray-500 truncate">{selectedDoc.nome}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Categoria</p>
                  <p className="font-medium">{getCategoriaInfo(selectedDoc.categoria).label}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cartella</p>
                  <p className="font-medium">{selectedDoc.sottoCartella || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Dimensione</p>
                  <p className="font-medium">{formatBytes(selectedDoc.dimensione)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tipo File</p>
                  <p className="font-medium">{selectedDoc.estensione?.toUpperCase() || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Creato</p>
                  <p className="font-medium">{new Date(selectedDoc.createdAt).toLocaleString('it-IT')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Modificato</p>
                  <p className="font-medium">{new Date(selectedDoc.modifiedAt).toLocaleString('it-IT')}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Percorso</p>
                <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">{selectedDoc.path}</p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => {
                  handleDelete(selectedDoc)
                }}
                className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={18} />
                Elimina
              </button>
              <a
                href={`/api/documenti/${selectedDoc.id}/download`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download size={18} />
                Scarica
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}