// src/app/(auth)/reset-password/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante la richiesta')
      }
      
      setSuccess(true)
      
    } catch (err: any) {
      setError(err.message)
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
            <h1 className="text-2xl font-bold text-white mb-3">Controlla la tua Email!</h1>
            <p className="text-gray-400 mb-6">
              Se l'indirizzo <strong className="text-white">{email}</strong> è registrato nel sistema, 
              riceverai un'email con le istruzioni per reimpostare la password.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Non hai ricevuto l'email? Controlla la cartella spam o riprova tra qualche minuto.
            </p>
            <Link 
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={18} />
              Torna al Login
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
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Password Dimenticata?</h1>
          <p className="text-gray-400">Inserisci la tua email per reimpostare la password</p>
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
                Indirizzo Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="la-tua@email.com"
                  className="w-full pl-11 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Invio in corso...
                </>
              ) : (
                <>
                  <Mail size={18} />
                  Invia Link di Reset
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Link login */}
        <p className="text-center mt-6 text-gray-400">
          Ricordi la password?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Torna al Login
          </Link>
        </p>
        
        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} RECORP - OKL SRL</p>
        </div>
      </div>
    </div>
  )
}
