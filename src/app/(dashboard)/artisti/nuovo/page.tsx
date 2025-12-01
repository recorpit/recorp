// src/app/(dashboard)/artisti/nuovo/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Users, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { TIPO_CONTRATTO_OPTIONS, TIPO_PAGAMENTO_OPTIONS, QUALIFICA_OPTIONS, TIPO_DOCUMENTO_OPTIONS } from '@/lib/constants'
import { validaCodiceFiscale, validaIBAN, verificaCompletezzaArtista } from '@/lib/validazioni'

export default function NuovoArtistaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Stato validazioni
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
    codiceCommercialista: '',
    tipoDocumento: '',
    numeroDocumento: '',
    scadenzaDocumento: '',
    iban: '',
    bic: '',
    tipoPagamento: 'STANDARD_15GG',
    note: '',
    noteInterne: '',
  })
  
  // Valida CF quando cambia
  useEffect(() => {
    if (form.codiceFiscale && form.codiceFiscale.length === 16) {
      const result = validaCodiceFiscale(form.codiceFiscale)
      setCfValidazione(result)
      
      // Precompila dati se valido
      if (result.valido && result.dati) {
        setForm(prev => ({
          ...prev,
          dataNascita: result.dati.dataNascita.toISOString().split('T')[0],
          sesso: result.dati.sesso,
        }))
      }
    } else if (form.codiceFiscale.length > 0 && form.codiceFiscale.length < 16) {
      setCfValidazione({ valido: false, errore: `${form.codiceFiscale.length}/16 caratteri` })
    } else {
      setCfValidazione(null)
    }
  }, [form.codiceFiscale])
  
  // Valida IBAN quando cambia
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Verifica maggiore età se CF valido
    if (cfValidazione?.valido && cfValidazione.dati && !cfValidazione.dati.maggiorenne) {
      setError('L\'artista deve essere maggiorenne per essere iscritto')
      setLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    try {
      const res = await fetch('/api/artisti', {
        method: 'POST',
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
        throw new Error(data.error || 'Errore nella creazione')
      }
      
      router.push('/artisti')
    } catch (err: any) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }
  
  const mostraPIva = form.tipoContratto === 'P_IVA'
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/artisti"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuovo Artista</h1>
            <p className="text-gray-500">Inserisci i dati dell&apos;artista</p>
          </div>
        </div>
        
        {/* Indicatore completezza */}
        {completezza && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-500">Completezza</div>
              <div className={`text-lg font-bold ${completezza.completo ? 'text-green-600' : 'text-yellow-600'}`}>
                {completezza.percentuale}%
              </div>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32" cy="32" r="28"
                  stroke="#e5e7eb" strokeWidth="8" fill="none"
                />
                <circle
                  cx="32" cy="32" r="28"
                  stroke={completezza.completo ? '#16a34a' : '#ca8a04'}
                  strokeWidth="8" fill="none"
                  strokeDasharray={`${completezza.percentuale * 1.76} 176`}
                />
              </svg>
            </div>
          </div>
        )}
      </div>
      
      {/* Warning campi mancanti */}
      {completezza && completezza.campiMancanti.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-yellow-800">Campi mancanti per iscrizione completa:</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cognome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cognome"
                value={form.cognome}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome d&apos;Arte
              </label>
              <input
                type="text"
                name="nomeDarte"
                value={form.nomeDarte}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Codice Fiscale con validazione */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Codice Fiscale <span className="text-red-500">*</span>
                  </label>
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
                      {cfValidazione.dati.sesso === 'M' ? 'Maschio' : 'Femmina'}, 
                      {' '}{cfValidazione.dati.eta} anni
                      {!cfValidazione.dati.maggiorenne && (
                        <span className="text-red-600 font-bold ml-2">⚠️ MINORENNE</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazionalita</label>
                  <input
                    type="text"
                    name="nazionalita"
                    value={form.nazionalita}
                    onChange={handleChange}
                    maxLength={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Codice Fiscale Estero / ID
                  </label>
                  <input
                    type="text"
                    name="codiceFiscaleEstero"
                    value={form.codiceFiscaleEstero}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazionalita <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nazionalita"
                    value={form.nazionalita}
                    onChange={handleChange}
                    maxLength={2}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Dati Nascita */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data di Nascita
              </label>
              <input
                type="date"
                name="dataNascita"
                value={form.dataNascita}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sesso</label>
              <select
                name="sesso"
                value={form.sesso}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-</option>
                <option value="M">Maschio</option>
                <option value="F">Femmina</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comune Nascita</label>
              <input
                type="text"
                name="comuneNascita"
                value={form.comuneNascita}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prov. Nascita</label>
              <input
                type="text"
                name="provinciaNascita"
                value={form.provinciaNascita}
                onChange={handleChange}
                maxLength={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
          </div>
        </div>
        
        {/* Contatti e Indirizzo */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contatti e Indirizzo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input
                type="tel"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
              <input
                type="text"
                name="indirizzo"
                value={form.indirizzo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Citta</label>
              <input
                type="text"
                name="citta"
                value={form.citta}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
                <input
                  type="text"
                  name="cap"
                  value={form.cap}
                  onChange={handleChange}
                  maxLength={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prov.</label>
                <input
                  type="text"
                  name="provincia"
                  value={form.provincia}
                  onChange={handleChange}
                  maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                />
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
              <select
                name="qualifica"
                value={form.qualifica}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {QUALIFICA_OPTIONS.map(q => (
                  <option key={q.value} value={q.value}>{q.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Contratto</label>
              <select
                name="tipoContratto"
                value={form.tipoContratto}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {TIPO_CONTRATTO_OPTIONS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            
            {mostraPIva && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  P.IVA <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="partitaIva"
                  value={form.partitaIva}
                  onChange={handleChange}
                  maxLength={11}
                  required={mostraPIva}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cachet Base (EUR)</label>
              <input
                type="number"
                name="cachetBase"
                value={form.cachetBase}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {!mostraPIva && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codice Commercialista</label>
                <input
                  type="text"
                  name="codiceCommercialista"
                  value={form.codiceCommercialista}
                  onChange={handleChange}
                  placeholder="Lascia vuoto per generazione automatica"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">Se l&apos;artista ha già un codice, inseriscilo qui</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Documenti */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documento d&apos;Identita</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento</label>
              <select
                name="tipoDocumento"
                value={form.tipoDocumento}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleziona...</option>
                {TIPO_DOCUMENTO_OPTIONS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numero Documento</label>
              <input
                type="text"
                name="numeroDocumento"
                value={form.numeroDocumento}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scadenza</label>
              <input
                type="date"
                name="scadenzaDocumento"
                value={form.scadenzaDocumento}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 flex items-start gap-2">
            <Info size={16} className="mt-0.5 flex-shrink-0" />
            <span>I documenti allegati potranno essere caricati dopo aver salvato l&apos;artista.</span>
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Pagamento</label>
              <select
                name="tipoPagamento"
                value={form.tipoPagamento}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {TIPO_PAGAMENTO_OPTIONS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
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
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note Interne</label>
              <textarea
                name="noteInterne"
                value={form.noteInterne}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {completezza?.completo ? (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle size={16} />
                Dati completi - l&apos;artista sara iscritto
              </span>
            ) : (
              <span className="text-yellow-600 flex items-center gap-1">
                <AlertTriangle size={16} />
                Dati incompleti - l&apos;artista sara salvato ma non iscritto
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              href="/artisti"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annulla
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? 'Salvataggio...' : 'Salva Artista'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
