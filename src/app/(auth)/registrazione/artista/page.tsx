// src/app/(auth)/registrazione/artista/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

// Qualifiche disponibili
const QUALIFICHE = [
  { value: 'DJ', label: 'DJ' },
  { value: 'VOCALIST', label: 'Vocalist' },
  { value: 'CORISTA', label: 'Corista' },
  { value: 'MUSICISTA', label: 'Musicista' },
  { value: 'BALLERINO', label: 'Ballerino/a' },
  { value: 'LUCISTA', label: 'Tecnico Luci' },
  { value: 'FOTOGRAFO', label: 'Fotografo/a' },
  { value: 'TRUCCATORE', label: 'Truccatore/trice' },
  { value: 'ALTRO', label: 'Altro' },
]

// Tipi documento
const TIPI_DOCUMENTO = [
  { value: 'CARTA_IDENTITA', label: 'Carta d\'Identità' },
  { value: 'PASSAPORTO', label: 'Passaporto' },
  { value: 'PATENTE', label: 'Patente di Guida' },
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

// Validazione CF
function validateCF(cf: string) {
  if (!cf || cf.length !== 16) return false
  return /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i.test(cf)
}

export default function RegistrazioneArtistaPage() {
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
    // Dati personali
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    codiceFiscale: '',
    dataNascita: '',
    luogoNascita: '',
    provinciaNascita: '',
    
    // Residenza
    indirizzoResidenza: '',
    cittaResidenza: '',
    provinciaResidenza: '',
    capResidenza: '',
    
    // Professionale
    qualifica: 'DJ',
    nomeDarte: '',
    
    // Documento
    tipoDocumento: 'CARTA_IDENTITA',
    numeroDocumento: '',
    scadenzaDocumento: '',
    
    // Bancario
    iban: '',
    
    // Password
    password: '',
    confermaPassword: '',
    
    // Privacy
    privacyAccettata: false,
    marketingAccettato: false,
  })
  
  // Carica dati da invito se presente
  useEffect(() => {
    if (token) {
      fetch(`/api/auth/invito?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error)
          } else if (data.tipo !== 'ARTISTA') {
            setError('Questo invito non è per la registrazione artista')
          } else {
            setForm(prev => ({
              ...prev,
              nome: data.nome || '',
              cognome: data.cognome || '',
              email: data.email || '',
              telefono: data.telefono || '',
              codiceFiscale: data.codiceFiscale || '',
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
  
  const passwordValidation = validatePassword(form.password)
  const cfValid = form.codiceFiscale ? validateCF(form.codiceFiscale) : true
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
    
    if (!cfValid) {
      setError('Codice fiscale non valido')
      return
    }
    
    if (!form.privacyAccettata) {
      setError('Devi accettare l\'informativa privacy')
      return
    }
    
    setLoading(true)
    
    try {
      const res = await fetch('/api/auth/registrazione/artista', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          token, // Includi token invito se presente
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
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
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
          <p className="text-gray-400 mb-6">
            Ti abbiamo inviato un'email di verifica all'indirizzo <strong className="text-white">{form.email}</strong>.
            Clicca sul link nell'email per verificare il tuo account.
          </p>
          <Link 
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎤</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Registrazione Artista</h1>
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
          {/* Dati Personali */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Dati Personali</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome *</label>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Cognome *</label>
                <input
                  type="text"
                  name="cognome"
                  value={form.cognome}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Telefono *</label>
                <input
                  type="tel"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  required
                  placeholder="+39..."
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Codice Fiscale *
                  {form.codiceFiscale && (
                    cfValid 
                      ? <CheckCircle className="w-4 h-4 text-green-400 inline ml-2" />
                      : <XCircle className="w-4 h-4 text-red-400 inline ml-2" />
                  )}
                </label>
                <input
                  type="text"
                  name="codiceFiscale"
                  value={form.codiceFiscale}
                  onChange={handleChange}
                  required
                  maxLength={16}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Data di Nascita *</label>
                <input
                  type="date"
                  name="dataNascita"
                  value={form.dataNascita}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Luogo di Nascita *</label>
                <input
                  type="text"
                  name="luogoNascita"
                  value={form.luogoNascita}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Provincia Nascita *</label>
                <input
                  type="text"
                  name="provinciaNascita"
                  value={form.provinciaNascita}
                  onChange={handleChange}
                  required
                  maxLength={2}
                  placeholder="MI"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
              </div>
            </div>
          </div>
          
          {/* Residenza */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Residenza</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Indirizzo *</label>
                <input
                  type="text"
                  name="indirizzoResidenza"
                  value={form.indirizzoResidenza}
                  onChange={handleChange}
                  required
                  placeholder="Via/Piazza..."
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Città *</label>
                <input
                  type="text"
                  name="cittaResidenza"
                  value={form.cittaResidenza}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Provincia *</label>
                  <input
                    type="text"
                    name="provinciaResidenza"
                    value={form.provinciaResidenza}
                    onChange={handleChange}
                    required
                    maxLength={2}
                    placeholder="MI"
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">CAP *</label>
                  <input
                    type="text"
                    name="capResidenza"
                    value={form.capResidenza}
                    onChange={handleChange}
                    required
                    maxLength={5}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Dati Professionali */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Dati Professionali</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Qualifica *</label>
                <select
                  name="qualifica"
                  value={form.qualifica}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {QUALIFICHE.map(q => (
                    <option key={q.value} value={q.value}>{q.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome d'Arte</label>
                <input
                  type="text"
                  name="nomeDarte"
                  value={form.nomeDarte}
                  onChange={handleChange}
                  placeholder="Opzionale"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Documento */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Documento d'Identità</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tipo *</label>
                <select
                  name="tipoDocumento"
                  value={form.tipoDocumento}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TIPI_DOCUMENTO.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Numero *</label>
                <input
                  type="text"
                  name="numeroDocumento"
                  value={form.numeroDocumento}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Scadenza *</label>
                <input
                  type="date"
                  name="scadenzaDocumento"
                  value={form.scadenzaDocumento}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Dati Bancari */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Dati Bancari</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">IBAN *</label>
              <input
                type="text"
                name="iban"
                value={form.iban}
                onChange={handleChange}
                required
                maxLength={27}
                placeholder="IT..."
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase font-mono"
              />
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
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {/* Indicatore forza */}
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
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
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
                  className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-300 text-sm">
                  Ho letto e accetto l'<a href="/privacy" target="_blank" className="text-blue-400 hover:underline">Informativa sulla Privacy</a> e il trattamento dei miei dati personali ai sensi del GDPR. <span className="text-red-400">*</span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="marketingAccettato"
                  checked={form.marketingAccettato}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-300 text-sm">
                  Acconsento a ricevere comunicazioni commerciali e promozionali.
                </span>
              </label>
            </div>
          </div>
          
          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading || !passwordValidation.valid || !passwordsMatch || !form.privacyAccettata}
              className="flex-1 py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <Link href="/login" className="text-blue-400 hover:underline">
              Accedi
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
