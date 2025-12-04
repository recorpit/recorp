// src/app/(auth)/reset-password/conferma/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

export default function ConfermaResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [form, setForm] = useState({
    password: '',
    confermaPassword: '',
  })
  
  const passwordValidation = validatePassword(form.password)
  const passwordsMatch = form.password === form.confermaPassword
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!passwordValidation.valid) {
      setError('La password non soddisfa i requisiti')
      return
    }
    
    if (!passwordsMatch) {
      setError('Le password non corrispondono')
      return
    }
    
    setLoading(true)
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: form.password
      })
      
      if (updateError) {
        throw new Error(updateError.message)
      }
      
      setSuccess(true)
      
      // Redirect dopo 3 secondi
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      
    } catch (err: any) {
      setError(err.message || 'Errore durante il reset della password')
    } finally {
      setLoading(false)
    }
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Password Aggiornata!</h1>
            <p className="text-gray-400 mb-6">
              La tua password è stata reimpostata con successo. Verrai reindirizzato alla pagina di login.
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6">
            <KeyRound className="w-10 h-10 text-white" />
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
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Nuova Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
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
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Conferma Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confermaPassword"
                  value={form.confermaPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
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
            
            <button
              type="submit"
              disabled={loading || !passwordValidation.valid || !passwordsMatch}
              className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Aggiornamento...
                </>
              ) : (
                'Imposta Nuova Password'
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
