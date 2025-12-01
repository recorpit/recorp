// src/app/(auth)/registrazione/locale/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react'

// Tipi locale
const TIPI_LOCALE = [
  { value: 'CLUB', label: 'Club / Discoteca' },
  { value: 'BAR', label: 'Bar' },
  { value: 'RISTORANTE', label: 'Ristorante' },
  { value: 'TEATRO', label: 'Teatro' },
  { value: 'ARENA', label: 'Arena / Stadio' },
  { value: 'STABILIMENTO', label: 'Stabilimento Balneare' },
  { value: 'PIAZZA', label: 'Piazza / Spazio Pubblico' },
  { value: 'PRIVATO', label: 'Location Privata' },
  { value: 'ALTRO', label: 'Altro' },
]

// Validazione password
function validatePassword(password: string) {
  const errors: string[] = []
  if (password.length < 8) errors.push('Almeno 8 caratteri')
  if (!/[A-Z]/.test(password)) errors.push('Una maiuscola')
  if (!/[a-z]/.test(password)) errors.push('Una minuscola')
  if (!/[0-9]/.test(password)) errors.push('Un numero')
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Un carattere speciale')
  
  return {
    valid: errors.length === 0,
    errors,
    strength: errors.length === 0 ? (password.length >= 12 ? 'forte' : 'media') : 'debole'
  }
}

// Validazione P.IVA
function validatePIVA(piva: string) {
  if (!piva || piva.length !== 11) return false
  if (!/^\d{11}$/.test(piva)) return false
  
  let sum = 0
  for (let i = 0; i < 10; i++) {
    const digit = parseInt(piva[i])
    if (i % 2 === 0) {
      sum += digit
    } else {
      const doubled = digit * 2
      sum += doubled > 9 ? doubled - 9 : doubled
    }
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === parseInt(piva[10])
}

interface Locale {
  id: string
  nome: string
  tipo: string
  indirizzo: string
  citta: string
  provincia: string
  cap: string
}

export default function RegistrazioneLocalePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(false)
  const [loadingInvito, setLoadingInvito] = useState(!!token)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [form, setForm] = useState({
    // Dati aziendali
    ragioneSociale: '',
    partitaIva: '',
    codiceFiscaleAzienda: '', // Può essere diverso dalla P.IVA
    
    // Sede legale
    indirizzoSede: '',
    cittaSede: '',
    provinciaSede: '',
    capSede: '',
    
    // Referente
    nomeReferente: '',
    cognomeReferente: '',
    emailReferente: '',
    telefonoReferente: '',
    
    // Password
    password: '',
    confermaPassword: '',
    
    // Privacy
    privacyAccettata: false,
    marketingAccettato: false,
  })
  
  // Locali gestiti (può essere 1 o più)
  const [locali, setLocali] = useState<Locale[]>([{
    id: '1',
    nome: '',
    tipo: 'CLUB',
    indirizzo: '',
    citta: '',
    provincia: '',
    cap: '',
  }])
  
  // Carica dati da invito se presente
  useEffect(() => {
    if (token) {
      fetch(`/api/auth/invito?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error)
          } else if (data.tipo !== 'COMMITTENTE' && data.tipo !== 'FORMAT_MANAGER') {
            setError('Questo invito non è per la registrazione locale')
          } else {
            setForm(prev => ({
              ...prev,
              ragioneSociale: data.ragioneSociale || '',
              partitaIva: data.partitaIva || '',
              emailReferente: data.email || '',
              nomeReferente: data.nome || '',
              cognomeReferente: data.cognome || '',
              telefonoReferente: data.telefono || '',
            }))
          }
        })
        .catch(() => setError('Errore nel caricamento dell\'invito'))
        .finally(() => setLoadingInvito(false))
    }
  }, [token])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }
  
  const handleLocaleChange = (id: string, field: string, value: string) => {
    setLocali(prev => prev.map(loc => 
      loc.id === id ? { ...loc, [field]: value } : loc
    ))
  }
  
  const addLocale = () => {
    setLocali(prev => [...prev, {
      id: Date.now().toString(),
      nome: '',
      tipo: 'CLUB',
      indirizzo: '',
      citta: '',
      provincia: '',
      cap: '',
    }])
  }
  
  const removeLocale = (id: string) => {
    if (locali.length > 1) {
      setLocali(prev => prev.filter(loc => loc.id !== id))
    }
  }
  
  const passwordValidation = validatePassword(form.password)
  const pivaValid = form.partitaIva ? validatePIVA(form.partitaIva) : true
  const passwordsMatch = form.password === form.confermaPassword
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validazioni
    if (!passwordValidation.valid) {
      setError('La password non soddisfa i requisiti')
      return
    }
    
    if (!passwordsMatch) {
      setError('Le password non corrispondono')
      return
    }
    
    if (form.partitaIva && !pivaValid) {
      setError('Partita IVA non valida')
      return
    }
    
    if (!form.privacyAccettata) {
      setError('Devi accettare l\'informativa privacy')
      return
    }
    
    // Verifica locali compilati
    const localiValidi = locali.filter(loc => loc.nome && loc.citta)
    if (localiValidi.length === 0) {
      setError('Inserisci almeno un locale')
      return
    }
    
    setLoading(true)
    
    try {
      const res = await fetch('/api/auth/registrazione/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          locali: localiValidi,
          token,
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Errore nella registrazione')
      }
      
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  if (loadingInvito) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Registrazione Completata!</h1>
          <p className="text-gray-400 mb-4">
            Ti abbiamo inviato un'email di verifica all'indirizzo <strong className="text-white">{form.emailReferente}</strong>.
          </p>
          <p className="text-gray-400 mb-6">
            Dopo la verifica email, il tuo account sarà <strong className="text-yellow-400">in attesa di approvazione</strong> da parte del nostro team.
          </p>
          <Link 
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Vai al Login
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/registrazione"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla scelta
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Registrazione Locale</h1>
              <p className="text-gray-400">Compila tutti i campi per registrarti</p>
            </div>
          </div>
        </div>
        
        {/* Errore */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dati Aziendali */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Dati Aziendali</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Ragione Sociale *</label>
                <input
                  type="text"
                  name="ragioneSociale"
                  value={form.ragioneSociale}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Partita IVA
                  {form.partitaIva && (
                    pivaValid 
                      ? <CheckCircle className="w-4 h-4 text-green-400 inline ml-2" />
                      : <XCircle className="w-4 h-4 text-red-400 inline ml-2" />
                  )}
                </label>
                <input
                  type="text"
                  name="partitaIva"
                  value={form.partitaIva}
                  onChange={handleChange}
                  maxLength={11}
                  placeholder="Se applicabile"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Codice Fiscale Azienda</label>
                <input
                  type="text"
                  name="codiceFiscaleAzienda"
                  value={form.codiceFiscaleAzienda}
                  onChange={handleChange}
                  maxLength={16}
                  placeholder="Se diverso dalla P.IVA"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                />
              </div>
            </div>
          </div>
          
          {/* Sede Legale */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Sede Legale</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Indirizzo *</label>
                <input
                  type="text"
                  name="indirizzoSede"
                  value={form.indirizzoSede}
                  onChange={handleChange}
                  required
                  placeholder="Via/Piazza..."
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Città *</label>
                <input
                  type="text"
                  name="cittaSede"
                  value={form.cittaSede}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Provincia *</label>
                  <input
                    type="text"
                    name="provinciaSede"
                    value={form.provinciaSede}
                    onChange={handleChange}
                    required
                    maxLength={2}
                    placeholder="MI"
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">CAP *</label>
                  <input
                    type="text"
                    name="capSede"
                    value={form.capSede}
                    onChange={handleChange}
                    required
                    maxLength={5}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Locali Gestiti */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Locali Gestiti</h2>
              <button
                type="button"
                onClick={addLocale}
                className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Aggiungi locale
              </button>
            </div>
            
            <div className="space-y-6">
              {locali.map((locale, index) => (
                <div key={locale.id} className="p-4 bg-gray-700/30 rounded-lg relative">
                  {locali.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLocale(locale.id)}
                      className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="text-sm text-gray-400 mb-3">Locale {index + 1}</div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Nome Locale *</label>
                      <input
                        type="text"
                        value={locale.nome}
                        onChange={(e) => handleLocaleChange(locale.id, 'nome', e.target.value)}
                        required
                        placeholder="Es. Club Paradise"
                        className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Tipo *</label>
                      <select
                        value={locale.tipo}
                        onChange={(e) => handleLocaleChange(locale.id, 'tipo', e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {TIPI_LOCALE.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">Indirizzo</label>
                      <input
                        type="text"
                        value={locale.indirizzo}
                        onChange={(e) => handleLocaleChange(locale.id, 'indirizzo', e.target.value)}
                        placeholder="Via/Piazza..."
                        className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Città *</label>
                      <input
                        type="text"
                        value={locale.citta}
                        onChange={(e) => handleLocaleChange(locale.id, 'citta', e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Provincia</label>
                        <input
                          type="text"
                          value={locale.provincia}
                          onChange={(e) => handleLocaleChange(locale.id, 'provincia', e.target.value)}
                          maxLength={2}
                          placeholder="MI"
                          className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">CAP</label>
                        <input
                          type="text"
                          value={locale.cap}
                          onChange={(e) => handleLocaleChange(locale.id, 'cap', e.target.value)}
                          maxLength={5}
                          className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Referente */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Referente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome *</label>
                <input
                  type="text"
                  name="nomeReferente"
                  value={form.nomeReferente}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Cognome *</label>
                <input
                  type="text"
                  name="cognomeReferente"
                  value={form.cognomeReferente}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  name="emailReferente"
                  value={form.emailReferente}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Telefono *</label>
                <input
                  type="tel"
                  name="telefonoReferente"
                  value={form.telefonoReferente}
                  onChange={handleChange}
                  required
                  placeholder="+39..."
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Password */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Password</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      <div className={`h-1 flex-1 rounded ${passwordValidation.strength === 'debole' ? 'bg-red-500' : passwordValidation.strength === 'media' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      <div className={`h-1 flex-1 rounded ${passwordValidation.strength === 'media' || passwordValidation.strength === 'forte' ? (passwordValidation.strength === 'media' ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-600'}`} />
                      <div className={`h-1 flex-1 rounded ${passwordValidation.strength === 'forte' ? 'bg-green-500' : 'bg-gray-600'}`} />
                    </div>
                    <div className="flex flex-wrap gap-1 text-xs">
                      {passwordValidation.errors.map(err => (
                        <span key={err} className="text-red-400">{err}</span>
                      ))}
                      {passwordValidation.valid && (
                        <span className="text-green-400">Password valida!</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Conferma Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confermaPassword"
                    value={form.confermaPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {form.confermaPassword && (
                  <p className={`mt-1 text-xs ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                    {passwordsMatch ? '✓ Le password corrispondono' : '✗ Le password non corrispondono'}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Privacy */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Privacy e Consensi</h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="privacyAccettata"
                  checked={form.privacyAccettata}
                  onChange={handleChange}
                  required
                  className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-300 text-sm">
                  Ho letto e accetto l'<a href="/privacy" target="_blank" className="text-purple-400 hover:underline">Informativa sulla Privacy</a> e il trattamento dei dati personali ai sensi del GDPR. <span className="text-red-400">*</span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="marketingAccettato"
                  checked={form.marketingAccettato}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-300 text-sm">
                  Acconsento a ricevere comunicazioni commerciali e promozionali.
                </span>
              </label>
            </div>
          </div>
          
          {/* Info approvazione */}
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-300 text-sm">
                Dopo la registrazione, il tuo account sarà <strong>in attesa di approvazione</strong>. 
                Riceverai un'email quando sarà attivato.
              </p>
            </div>
          </div>
          
          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading || !passwordValidation.valid || !passwordsMatch || !form.privacyAccettata}
              className="flex-1 py-3 px-6 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registrazione in corso...
                </>
              ) : (
                'Completa Registrazione'
              )}
            </button>
          </div>
          
          {/* Link login */}
          <p className="text-center text-gray-500 text-sm">
            Hai già un account?{' '}
            <Link href="/login" className="text-purple-400 hover:underline">
              Accedi
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
