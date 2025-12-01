// src/app/(dashboard)/artisti/[id]/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2, Users, AlertTriangle, CheckCircle, Upload, FileText, X } from 'lucide-react'
import { QUALIFICA_OPTIONS, TIPO_CONTRATTO_OPTIONS, TIPO_PAGAMENTO_OPTIONS, TIPO_DOCUMENTO_OPTIONS } from '@/lib/constants'
import { validaCodiceFiscale, validaIBAN, verificaCompletezzaArtista } from '@/lib/validazioni'

export default function ModificaArtistaPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Upload documenti
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [tipoDocUpload, setTipoDocUpload] = useState('')
  
  // Validazioni
  const [cfValidazione, setCfValidazione] = useState<{ valido: boolean; errore?: string; dati?: any } | null>(null)
  const [ibanValidazione, setIbanValidazione] = useState<{ valido: boolean; errore?: string; paese?: string } | null>(null)
  const [completezza, setCompletezza] = useState<{ completo: boolean; campiMancanti: any[]; percentuale: number } | null>(null)
  
  const [form, setForm] = useState({
    nome: '',
    cognome: '',
    nomeDarte: '',
    codiceFiscale: '',
    extraUE: false,
    codiceFiscaleEstero: '',
    partitaIva: '',
    nazionalita: 'IT',
    email: '',
    telefono: '',
    indirizzo: '',
    cap: '',
    citta: '',
    provincia: '',
    dataNascita: '',
    sesso: '',
    comuneNascita: '',
    provinciaNascita: '',
    qualifica: 'DJ',
    tipoContratto: 'PRESTAZIONE_OCCASIONALE',
    cachetBase: '',
    tipoDocumento: '',
    numeroDocumento: '',
    scadenzaDocumento: '',
    iban: '',
    bic: '',
    codiceCommercialista: '',
    tipoPagamento: 'STANDARD_15GG',
    note: '',
    noteInterne: '',
  })
  
  const [stats, setStats] = useState({ agibilita: 0, iscritto: false })
  const [documenti, setDocumenti] = useState<any[]>([])
  
  // Carica dati
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/artisti/${id}`)
        if (!res.ok) throw new Error('Artista non trovato')
        
        const data = await res.json()
        setForm({
          nome: data.nome || '',
          cognome: data.cognome || '',
          nomeDarte: data.nomeDarte || '',
          codiceFiscale: data.codiceFiscale || '',
          extraUE: data.extraUE || false,
          codiceFiscaleEstero: data.codiceFiscaleEstero || '',
          partitaIva: data.partitaIva || '',
          nazionalita: data.nazionalita || 'IT',
          email: data.email || '',
          telefono: data.telefono || '',
          indirizzo: data.indirizzo || '',
          cap: data.cap || '',
          citta: data.citta || '',
          provincia: data.provincia || '',
          dataNascita: data.dataNascita ? data.dataNascita.split('T')[0] : '',
          sesso: data.sesso || '',
          comuneNascita: data.comuneNascita || '',
          provinciaNascita: data.provinciaNascita || '',
          qualifica: data.qualifica || 'ALTRO',
          tipoContratto: data.tipoContratto || 'PRESTAZIONE_OCCASIONALE',
          cachetBase: data.cachetBase?.toString() || '',
          tipoDocumento: data.tipoDocumento || '',
          numeroDocumento: data.numeroDocumento || '',
          scadenzaDocumento: data.scadenzaDocumento ? data.scadenzaDocumento.split('T')[0] : '',
          iban: data.iban || '',
          bic: data.bic || '',
          codiceCommercialista: data.codiceCommercialista || '',
          tipoPagamento: data.tipoPagamento || 'STANDARD_15GG',
          note: data.note || '',
          noteInterne: data.noteInterne || '',
        })
        
        setStats({
          agibilita: data.agibilita?.length || 0,
          iscritto: data.iscritto || false,
        })
        
        setDocumenti(data.documenti || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [id])
  
  // Valida CF
  useEffect(() => {
    if (form.codiceFiscale && form.codiceFiscale.length === 16) {
      const result = validaCodiceFiscale(form.codiceFiscale)
      setCfValidazione(result)
    } else if (form.codiceFiscale.length > 0 && form.codiceFiscale.length < 16) {
      setCfValidazione({ valido: false, errore: `${form.codiceFiscale.length}/16 caratteri` })
    } else {
      setCfValidazione(null)
    }
  }, [form.codiceFiscale])
  
  // Valida IBAN
  useEffect(() => {
    if (form.iban && form.iban.length >= 15) {
      const result = validaIBAN(form.iban)
      setIbanValidazione(result)
    } else if (form.iban.length > 0) {
      setIbanValidazione({ valido: false, errore: 'IBAN troppo corto' })
    } else {
      setIbanValidazione(null)
    }
  }, [form.iban])
  
  // Verifica completezza
  useEffect(() => {
    const result = verificaCompletezzaArtista({
      nome: form.nome,
      cognome: form.cognome,
      codiceFiscale: form.codiceFiscale,
      extraUE: form.extraUE,
      dataNascita: form.dataNascita,
      comuneNascita: form.comuneNascita,
      provinciaNascita: form.provinciaNascita,
      indirizzo: form.indirizzo,
      cap: form.cap,
      citta: form.citta,
      provincia: form.provincia,
      email: form.email,
      telefono: form.telefono,
      iban: form.iban,
      tipoDocumento: form.tipoDocumento,
      numeroDocumento: form.numeroDocumento,
    })
    setCompletezza(result)
  }, [form])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }
  
  // Upload documento
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tipoDocUpload) return
    
    setUploading(true)
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tipo', tipoDocUpload)
      
      const res = await fetch(`/api/artisti/${id}/documenti`, {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nel caricamento')
      }
      
      const nuovoDoc = await res.json()
      setDocumenti(prev => [nuovoDoc, ...prev])
      setTipoDocUpload('')
      
      // Reset input file
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setUploading(false)
    }
  }
  
  // Elimina documento
  const handleDeleteDoc = async (documentoId: string) => {
    if (!confirm('Eliminare questo documento?')) return
    
    try {
      const res = await fetch(`/api/artisti/${id}/documenti?documentoId=${documentoId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nell\'eliminazione')
      }
      
      setDocumenti(prev => prev.filter(d => d.id !== documentoId))
    } catch (err: any) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    
    // Verifica maggiore età
    if (cfValidazione?.valido && cfValidazione.dati && !cfValidazione.dati.maggiorenne) {
      setError('L\'artista deve essere maggiorenne per essere iscritto')
      setSaving(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    try {
      const res = await fetch(`/api/artisti/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          cachetBase: form.cachetBase ? parseFloat(form.cachetBase) : null,
          dataNascita: form.dataNascita || null,
          scadenzaDocumento: form.scadenzaDocumento || null,
          maggiorenne: cfValidazione?.dati?.maggiorenne ?? true,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nel salvataggio')
      }
      
      router.push('/artisti')
    } catch (err: any) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }
  
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/artisti/${id}`, { method: 'DELETE' })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nell\'eliminazione')
      }
      
      router.push('/artisti')
    } catch (err: any) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setShowDeleteConfirm(false)
    }
  }
  
  const mostraPIva = form.tipoContratto === 'P_IVA'
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/artisti" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Modifica Artista</h1>
            <p className="text-gray-500">{form.cognome} {form.nome}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Indicatore completezza */}
          {completezza && (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs text-gray-500">Completezza</div>
                <div className={`text-sm font-bold ${completezza.completo ? 'text-green-600' : 'text-yellow-600'}`}>
                  {completezza.percentuale}%
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={20} />
            Elimina
          </button>
        </div>
      </div>
      
      {/* Stats e Iscrizione */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Agibilita</p>
          <p className="text-2xl font-bold text-gray-900">{stats.agibilita}</p>
        </div>
        <div className={`rounded-lg p-4 shadow-sm ${completezza?.completo ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <p className="text-sm text-gray-500">Stato Iscrizione</p>
          <div className="flex items-center gap-2">
            {completezza?.completo ? (
              <>
                <CheckCircle className="text-green-600" size={24} />
                <span className="text-lg font-bold text-green-700">Iscritto</span>
              </>
            ) : (
              <>
                <AlertTriangle className="text-yellow-600" size={24} />
                <span className="text-lg font-bold text-yellow-700">Incompleto</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Warning campi mancanti */}
      {completezza && completezza.campiMancanti.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-yellow-800">Campi mancanti:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {completezza.campiMancanti.map(c => (
                  <span 
                    key={c.campo} 
                    className={`px-2 py-1 rounded text-xs ${c.obbligatorio ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}
                  >
                    {c.label} {c.obbligatorio && '*'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dati Anagrafici */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={20} />
            Dati Anagrafici
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input type="text" name="nome" value={form.nome} onChange={handleChange} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
              <input type="text" name="cognome" value={form.cognome} onChange={handleChange} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome d&apos;Arte</label>
              <input type="text" name="nomeDarte" value={form.nomeDarte} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          
          {/* Codice Fiscale */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="extraUE"
                  checked={form.extraUE}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Artista Extra UE (senza CF italiano)</span>
              </label>
            </div>
            
            {!form.extraUE ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale *</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="codiceFiscale"
                      value={form.codiceFiscale}
                      onChange={handleChange}
                      maxLength={16}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase font-mono pr-10
                        ${cfValidazione === null ? 'border-gray-300' : ''}
                        ${cfValidazione?.valido ? 'border-green-500 bg-green-50' : ''}
                        ${cfValidazione && !cfValidazione.valido ? 'border-red-500 bg-red-50' : ''}
                      `}
                    />
                    {cfValidazione && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {cfValidazione.valido ? (
                          <CheckCircle className="text-green-500" size={20} />
                        ) : (
                          <AlertTriangle className="text-red-500" size={20} />
                        )}
                      </div>
                    )}
                  </div>
                  {cfValidazione && !cfValidazione.valido && (
                    <p className="text-sm text-red-600 mt-1">{cfValidazione.errore}</p>
                  )}
                  {cfValidazione?.valido && cfValidazione.dati && (
                    <div className="text-sm text-green-600 mt-1">
                      {cfValidazione.dati.sesso === 'M' ? 'Maschio' : 'Femmina'}, {cfValidazione.dati.eta} anni
                      {!cfValidazione.dati.maggiorenne && (
                        <span className="text-red-600 font-bold ml-2">⚠️ MINORENNE</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazionalita</label>
                  <input type="text" name="nazionalita" value={form.nazionalita} onChange={handleChange} maxLength={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CF Estero / ID</label>
                  <input type="text" name="codiceFiscaleEstero" value={form.codiceFiscaleEstero} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazionalita *</label>
                  <input type="text" name="nazionalita" value={form.nazionalita} onChange={handleChange} maxLength={2} required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" />
                </div>
              </div>
            )}
          </div>
          
          {/* Dati Nascita */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Nascita</label>
              <input type="date" name="dataNascita" value={form.dataNascita} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sesso</label>
              <select name="sesso" value={form.sesso} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">-</option>
                <option value="M">Maschio</option>
                <option value="F">Femmina</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comune Nascita</label>
              <input type="text" name="comuneNascita" value={form.comuneNascita} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prov.</label>
              <input type="text" name="provinciaNascita" value={form.provinciaNascita} onChange={handleChange} maxLength={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" />
            </div>
          </div>
        </div>
        
        {/* Contatti */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contatti e Residenza</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input type="tel" name="telefono" value={form.telefono} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
              <input type="text" name="indirizzo" value={form.indirizzo} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Citta</label>
              <input type="text" name="citta" value={form.citta} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
                <input type="text" name="cap" value={form.cap} onChange={handleChange} maxLength={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prov.</label>
                <input type="text" name="provincia" value={form.provincia} onChange={handleChange} maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Dati Professionali */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dati Professionali</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualifica</label>
              <select name="qualifica" value={form.qualifica} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                {QUALIFICA_OPTIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Contratto</label>
              <select name="tipoContratto" value={form.tipoContratto} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                {TIPO_CONTRATTO_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            
            {mostraPIva && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">P.IVA *</label>
                <input type="text" name="partitaIva" value={form.partitaIva} onChange={handleChange} maxLength={11} required={mostraPIva}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cachet Base (EUR)</label>
              <input type="number" name="cachetBase" value={form.cachetBase} onChange={handleChange} min="0" step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
        
        {/* Documenti */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documento d&apos;Identita</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento</label>
              <select name="tipoDocumento" value={form.tipoDocumento} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Seleziona...</option>
                {TIPO_DOCUMENTO_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numero Documento</label>
              <input type="text" name="numeroDocumento" value={form.numeroDocumento} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scadenza</label>
              <input type="date" name="scadenzaDocumento" value={form.scadenzaDocumento} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          
          {/* Sezione Upload Allegati */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Allegati</h3>
            
            {documenti.length > 0 ? (
              <div className="space-y-2 mb-4">
                {documenti.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="text-gray-400" size={20} />
                      <div>
                        <a 
                          href={doc.path} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {doc.nome}
                        </a>
                        <p className="text-xs text-gray-500">
                          {TIPO_DOCUMENTO_OPTIONS.find(t => t.value === doc.tipo)?.label || doc.tipo}
                          {doc.dimensione && ` • ${(doc.dimensione / 1024).toFixed(0)} KB`}
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">Nessun allegato caricato</p>
            )}
            
            {/* Upload Form */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Allegato</label>
                <select
                  value={tipoDocUpload}
                  onChange={(e) => setTipoDocUpload(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleziona tipo...</option>
                  {TIPO_DOCUMENTO_OPTIONS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!tipoDocUpload || uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={18} />
                  {uploading ? 'Caricamento...' : 'Carica File'}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">PDF, JPG, PNG fino a 10MB</p>
          </div>
        </div>
        
        {/* Dati Pagamento */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dati Pagamento</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
              <div className="relative">
                <input
                  type="text"
                  name="iban"
                  value={form.iban}
                  onChange={handleChange}
                  placeholder="IT60X0542811101000000123456"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase font-mono pr-10
                    ${ibanValidazione === null ? 'border-gray-300' : ''}
                    ${ibanValidazione?.valido ? 'border-green-500 bg-green-50' : ''}
                    ${ibanValidazione && !ibanValidazione.valido ? 'border-red-500 bg-red-50' : ''}
                  `}
                />
                {ibanValidazione && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {ibanValidazione.valido ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <AlertTriangle className="text-red-500" size={20} />
                    )}
                  </div>
                )}
              </div>
              {ibanValidazione && !ibanValidazione.valido && (
                <p className="text-sm text-red-600 mt-1">{ibanValidazione.errore}</p>
              )}
              {ibanValidazione?.valido && ibanValidazione.paese && (
                <p className="text-sm text-green-600 mt-1">IBAN {ibanValidazione.paese} valido</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BIC/SWIFT</label>
              <input
                type="text"
                name="bic"
                value={form.bic}
                onChange={handleChange}
                placeholder="UNCRITM1XXX"
                maxLength={11}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">Codice BIC/SWIFT della banca (8-11 caratteri)</p>
            </div>
            
            {!mostraPIva && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codice Commercialista</label>
                <input
                  type="text"
                  name="codiceCommercialista"
                  value={form.codiceCommercialista}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">Codice univoco per export gestionale</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Pagamento</label>
              <select name="tipoPagamento" value={form.tipoPagamento} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                {TIPO_PAGAMENTO_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
        </div>
        
        {/* Note */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Note</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (visibili)</label>
              <textarea name="note" value={form.note} onChange={handleChange} rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note Interne</label>
              <textarea name="noteInterne" value={form.noteInterne} onChange={handleChange} rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {completezza?.completo ? (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle size={16} />
                Dati completi
              </span>
            ) : (
              <span className="text-yellow-600 flex items-center gap-1">
                <AlertTriangle size={16} />
                Dati incompleti
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/artisti" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Annulla
            </Link>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save size={20} />
              {saving ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </div>
      </form>
      
      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Conferma eliminazione</h3>
            <p className="text-gray-600 mb-4">
              Eliminare <strong>{form.cognome} {form.nome}</strong>?
              {stats.agibilita > 0 && (
                <span className="block text-red-600 mt-2">
                  <AlertTriangle className="inline mr-1" size={16} />
                  {stats.agibilita} agibilita collegate!
                </span>
              )}
            </p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Annulla
              </button>
              <button onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
