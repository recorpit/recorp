// src/app/(auth)/registrazione/page.tsx
'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Music, Building2, ArrowRight } from 'lucide-react'

export default function SceltaRegistrazionePage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') // Token invito se presente
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Logo e titolo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6">
            <span className="text-4xl">🎭</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Benvenuto in RECORP</h1>
          <p className="text-gray-400 text-lg">Scegli come vuoi registrarti</p>
        </div>
        
        {/* Scelta */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Artista */}
          <Link 
            href={`/registrazione/artista${token ? `?token=${token}` : ''}`}
            className="group bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8 hover:border-blue-500 hover:bg-gray-800 transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600/30 transition-colors">
                <Music className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Sono un Artista</h2>
              <p className="text-gray-400 mb-6">
                DJ, vocalist, musicista, ballerino o altro performer. 
                Registrati per gestire le tue prestazioni e documenti.
              </p>
              <div className="flex items-center gap-2 text-blue-400 group-hover:text-blue-300 transition-colors">
                <span className="font-medium">Registrati come artista</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
          
          {/* Locale/Committente */}
          <Link 
            href={`/registrazione/locale${token ? `?token=${token}` : ''}`}
            className="group bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8 hover:border-purple-500 hover:bg-gray-800 transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600/30 transition-colors">
                <Building2 className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Gestisco un Locale</h2>
              <p className="text-gray-400 mb-6">
                Proprietario o gestore di club, discoteca, locale o organizzatore eventi.
                Registrati per visualizzare le agibilità.
              </p>
              <div className="flex items-center gap-2 text-purple-400 group-hover:text-purple-300 transition-colors">
                <span className="font-medium">Registrati come locale</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
        
        {/* Link login */}
        <div className="text-center mt-10">
          <p className="text-gray-500">
            Hai già un account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Accedi
            </Link>
          </p>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-12 text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} RECORP - Rapid Events Corporation</p>
        </div>
      </div>
    </div>
  )
}
