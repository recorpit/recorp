// src/app/(dashboard)/profilo/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { User, Mail, Shield, Calendar, Save, Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ProfiloPage() {
  const { data: session, update: updateSession } = useSession()
  const user = session?.user
  
  const [loading, setLoading] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  // Form dati profilo
  const [form, setForm] = useState({
    nome: '',
    cognome: '',
    email: '',
  })
  
  // Form cambio password
  const [passwordForm, setPasswordForm] = useState({
    passwordAttuale: '',
    nuovaPassword: '',
    confermaPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    attuale: false,
    nuova: false,
    conferma: false,
  })
  
  // Carica dati utente
  useEffect(() => {
    if (user) {
      setForm({
        nome: user.nome || '',
        cognome: user.cognome || '',
        email: user.email || '',
      })
    }
  }, [user])
  
  // Validazione password
  const validatePassword = (password: string) => {
    const errors: string[] = []
    if (password.length < 8) errors.push('Almeno 8 caratteri')
    if (!/[A-Z]/.test(password)) errors.push('Una maiuscola')
    if (!/[a-z]/.test(password)) errors.push('Una minuscola')
    if (!/[0-9]/.test(password)) errors.push('Un numero')
    return { valid: errors.length === 0, errors }
  }
  
  const passwordValidation = validatePassword(passwordForm.nuovaPassword)
  const passwordsMatch = passwordForm.nuovaPassword === passwordForm.confermaPassword
  
  // Aggiorna profilo
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const res = await fetch('/api/auth/profilo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          cognome: form.cognome,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Errore aggiornamento profilo')
      }
      
      // Aggiorna sessione
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          nome: form.nome,
          cognome: form.cognome,
        }
      })
      
      setSuccess('Profilo aggiornato con successo!')
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Cambia password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passwordValidation.valid) {
      setError('La nuova password non soddisfa i requisiti')
      return
    }
    
    if (!passwordsMatch) {
      setError('Le password non corrispondono')
      return
    }
    
    setLoadingPassword(true)
    setError('')
    setSuccess('')
    
    try {
      const res = await fetch('/api/auth/cambio-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordAttuale: passwordForm.passwordAttuale,
          nuovaPassword: passwordForm.nuovaPassword,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Errore cambio password')
      }
      
      setSuccess('Password cambiata con successo!')
      setPasswordForm({
        passwordAttuale: '',
        nuovaPassword: '',
        confermaPassword: '',
      })
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingPassword(false)
    }
  }
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Il mio Profilo</h1>
        <p className="text-gray-500 mt-1">Gestisci i tuoi dati personali e la sicurezza</p>
      </div>
      
      {/* Messaggi */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="text-green-600" size={20} />
          <p className="text-green-700">{success}</p>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Info Utente */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                {user.nome?.[0]}{user.cognome?.[0]}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user.nome} {user.cognome}
              </h2>
              <p className="text-gray-500">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                {user.ruolo}
              </span>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail size={18} />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Shield size={18} />
                <span className="text-sm">Ruolo: {user.ruolo}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar size={18} />
                <span className="text-sm">Membro dal {new Date().toLocaleDateString('it-IT')}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form Dati Profilo */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} />
              Dati Personali
            </h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cognome
                  </label>
                  <input
                    type="text"
                    value={form.cognome}
                    onChange={(e) => setForm(prev => ({ ...prev, cognome: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">L'email non può essere modificata</p>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
          
          {/* Form Cambio Password */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Lock size={20} />
              Cambio Password
            </h3>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password Attuale
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.attuale ? 'text' : 'password'}
                    value={passwordForm.passwordAttuale}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, passwordAttuale: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, attuale: !prev.attuale }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.attuale ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nuova Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.nuova ? 'text' : 'password'}
                      value={passwordForm.nuovaPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, nuovaPassword: e.target.value }))}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, nuova: !prev.nuova }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.nuova ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordForm.nuovaPassword && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {passwordValidation.errors.map(err => (
                        <span key={err} className="text-xs text-red-500">{err}</span>
                      ))}
                      {passwordValidation.valid && (
                        <span className="text-xs text-green-500">✓ Password valida</span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conferma Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.conferma ? 'text' : 'password'}
                      value={passwordForm.confermaPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confermaPassword: e.target.value }))}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, conferma: !prev.conferma }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.conferma ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordForm.confermaPassword && (
                    <p className={`text-xs mt-1 ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                      {passwordsMatch ? '✓ Le password corrispondono' : '✗ Le password non corrispondono'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loadingPassword || !passwordValidation.valid || !passwordsMatch || !passwordForm.passwordAttuale}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingPassword ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Lock size={18} />
                  )}
                  Cambia Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
