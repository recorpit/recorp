// src/app/(auth)/reset-password/conferma/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, XCircle } from 'lucide-react'

export default function ConfermaResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState({
    password: '',
    confermaPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  // Verifica token all'avvio
  useEffect(() => {
    if (!token) {
      setTokenError('Token mancante')
      setLoading(false)
      return
    }
    
    async function verifyToken() {
      try {
        const res = await fetch(`/api/auth/reset-password/conferma?token=${token}`)
        const data = await res.json()
        
        if (data.valid) {
          setTokenValid(true)
        } else {
          setTokenError(data.error || 'Token non valido')
        }
      } catch (err) {
        setTokenError('Errore verifica token')
      } finally {
        setLoading(false)
      }
    }
    
    verifyToken()
  }, [token])
  
  // Validazione password
  const validatePassword = (password: string) => {
    const errors: string[] = []
    if (password.length < 8) errors.push('Almeno 8 caratteri')
    if (!/[A-Z]/.test(password)) errors.push('Una maiuscola')
    if (!/[a-z]/.test(password)) errors.push('Una minuscola')
    if (!/[0-9]/.test(password)) errors.push('Un numero')
    return { valid: errors.length === 0, errors }
  }
  
  const passwordValidation = validatePassword(form.password)
  const passwordsMatch = form.password === form.confermaPassword
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passwordValidation.valid) {
      setError('La password non soddisfa i requisiti')
      return
    }
    
    if (!passwordsMatch) {
      setError('Le password non corrispondono')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      const res = await fetch('/api/auth/reset-password/conferma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: form.password,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante il reset')
      }
      
      setSuccess(true)
      
      // Redirect al login dopo 3 secondi
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }
  
  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifica token in corso...</p>
        </div>
      </div>
    )
  }
  
  // Token non valido
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Link Non Valido</h1>
            <p className="text-gray-400 mb-6">
              {tokenError || 'Il link di reset password non è valido o è scaduto.'}
            </p>
            <p className="text-gray-500 text-sm mb-6">
              I link di reset scadono dopo 1 ora per motivi di sicurezza.
            </p>
            <Link 
              href="/reset-password"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Richiedi Nuovo Link
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  // Successo
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Password Reimpostata!</h1>
            <p className="text-gray-400 mb-6">
              La tua password è stata cambiata con successo. 
              Verrai reindirizzato al login tra pochi secondi...
            </p>
            <Link 
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Vai al Login
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  // Form nuova password
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Nuova Password</h1>
          <p className="text-gray-400">Inserisci la tua nuova password</p>
        </div>
        
        {/* Form */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nuova Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Nuova Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {passwordValidation.errors.map(err => (
                    <span key={err} className="text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded">
                      {err}
                    </span>
                  ))}
                  {passwordValidation.valid && (
                    <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">
                      ✓ Password valida
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Conferma Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Conferma Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confermaPassword}
                  onChange={(e) => setForm(prev => ({ ...prev, confermaPassword: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {form.confermaPassword && (
                <p className={`text-xs mt-1 ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                  {passwordsMatch ? '✓ Le password corrispondono' : '✗ Le password non corrispondono'}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={submitting || !passwordValidation.valid || !passwordsMatch}
              className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Reimpostazione...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Reimposta Password
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} RECORP - OKL SRL</p>
        </div>
      </div>
    </div>
  )
}
