// src/app/(dashboard)/richieste-agibilita/chat/page.tsx
// Chat AI per Richieste Agibilità
'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Send, Bot, User, Loader2, CheckCircle, AlertCircle,
  Calendar, MapPin, Users, Euro, FileText, Sparkles,
  ArrowRight, X, Building2, Music
} from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  data?: ExtractedData
  status?: 'thinking' | 'complete' | 'error'
}

interface ExtractedData {
  dataEvento?: string
  dataFine?: string
  locale?: {
    id?: string
    nome: string
    citta?: string
    indirizzo?: string
    isNuovo?: boolean
  }
  artisti?: Array<{
    id?: string
    nomeDarte: string
    nome?: string
    cognome?: string
    compensoNetto?: number
    qualifica?: string
    isNuovo?: boolean
  }>
  committente?: {
    id?: string
    ragioneSociale?: string
  }
  note?: string
  isComplete?: boolean
  missingFields?: string[]
}

interface SearchResult {
  type: 'locale' | 'artista' | 'committente'
  id: string
  label: string
  sublabel?: string
}

export default function ChatRichiestaPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Ciao! 👋 Sono l'assistente per le richieste di agibilità.

Descrivimi l'evento per cui ti serve l'agibilità e cercherò di estrarre automaticamente tutte le informazioni necessarie.

**Esempio:**
_"Serata con DJ Marco Rossi il 15 dicembre al Molo 5 di Vicenza, compenso 300 euro"_

Oppure puoi darmi le informazioni poco alla volta, ti chiederò io quello che manca!`,
      timestamp: new Date(),
    }
  ])
  
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData>({})
  const [showPreview, setShowPreview] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Processa il messaggio con AI
  const processMessage = async (userMessage: string) => {
    setIsProcessing(true)
    
    // Aggiungi messaggio utente
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    
    // Messaggio "thinking"
    const thinkingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      status: 'thinking',
    }
    setMessages(prev => [...prev, thinkingMsg])
    
    try {
      // Chiama API per processare con AI
      const res = await fetch('/api/richieste-agibilita/ai-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          currentData: extractedData,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      })
      
      if (!res.ok) throw new Error('Errore elaborazione')
      
      const data = await res.json()
      
      // Aggiorna dati estratti
      if (data.extractedData) {
        setExtractedData(prev => ({
          ...prev,
          ...data.extractedData,
          artisti: data.extractedData.artisti || prev.artisti,
          locale: data.extractedData.locale || prev.locale,
        }))
      }
      
      // Aggiorna messaggio assistente
      setMessages(prev => prev.map(m => 
        m.id === thinkingMsg.id 
          ? { ...m, content: data.response, status: 'complete', data: data.extractedData }
          : m
      ))
      
      // Se completo, mostra preview
      if (data.extractedData?.isComplete) {
        setShowPreview(true)
      }
      
    } catch (error) {
      console.error('Errore:', error)
      setMessages(prev => prev.map(m => 
        m.id === thinkingMsg.id 
          ? { ...m, content: 'Mi dispiace, si è verificato un errore. Riprova.', status: 'error' }
          : m
      ))
    } finally {
      setIsProcessing(false)
    }
  }

  // Cerca locale/artista nel database
  const searchEntity = async (query: string, type: 'locale' | 'artista' | 'committente') => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    
    setIsSearching(true)
    try {
      let url = ''
      if (type === 'locale') {
        url = `/api/locali?search=${encodeURIComponent(query)}&limit=5`
      } else if (type === 'artista') {
        url = `/api/artisti?searchNomeDarte=${encodeURIComponent(query)}&limit=5`
      } else {
        url = `/api/committenti?search=${encodeURIComponent(query)}&limit=5`
      }
      
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        const items = data.locali || data.artisti || data.committenti || []
        setSearchResults(items.map((item: any) => ({
          type,
          id: item.id,
          label: item.nome || item.nomeDarte || item.ragioneSociale,
          sublabel: item.citta || item.qualifica || item.email,
        })))
      }
    } catch (err) {
      console.error('Errore ricerca:', err)
    } finally {
      setIsSearching(false)
    }
  }

  // Invia richiesta
  const submitRequest = async () => {
    if (!extractedData.isComplete) return
    
    setIsProcessing(true)
    try {
      const res = await fetch('/api/richieste-agibilita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataEvento: extractedData.dataEvento,
          dataFine: extractedData.dataFine,
          locale: extractedData.locale,
          artisti: extractedData.artisti,
          note: extractedData.note,
        }),
      })
      
      if (!res.ok) throw new Error('Errore creazione richiesta')
      
      const data = await res.json()
      
      // Messaggio di conferma
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ **Richiesta creata con successo!**

Codice: **${data.codice}**

Puoi seguire lo stato della richiesta dalla lista richieste.`,
        timestamp: new Date(),
      }])
      
      setShowPreview(false)
      setExtractedData({})
      
    } catch (error) {
      console.error('Errore:', error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ Errore nella creazione della richiesta. Riprova.',
        timestamp: new Date(),
        status: 'error',
      }])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return
    processMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Formatta importo
  const formatImporto = (n?: number) => n?.toLocaleString('it-IT', { minimumFractionDigits: 2 }) || '-'

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Chat principale */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-semibold text-white">Assistente Richieste Agibilità</h1>
              <p className="text-xs text-blue-100">Descrivi l'evento, penso io al resto</p>
            </div>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              {/* Content */}
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.status === 'thinking' ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sto elaborando...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{ 
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/_(.*?)_/g, '<em>$1</em>')
                        .replace(/\n/g, '<br/>')
                    }} />
                  )}
                </div>
                
                {/* Dati estratti inline */}
                {msg.data && Object.keys(msg.data).length > 0 && !msg.data.isComplete && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg text-left">
                    <p className="text-xs font-medium text-blue-600 mb-2">Dati riconosciuti:</p>
                    <div className="space-y-1 text-xs text-blue-800">
                      {msg.data.dataEvento && (
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{format(new Date(msg.data.dataEvento), 'd MMMM yyyy', { locale: it })}</span>
                        </div>
                      )}
                      {msg.data.locale?.nome && (
                        <div className="flex items-center gap-1">
                          <MapPin size={12} />
                          <span>{msg.data.locale.nome} {msg.data.locale.citta && `- ${msg.data.locale.citta}`}</span>
                        </div>
                      )}
                      {msg.data.artisti && msg.data.artisti.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Music size={12} />
                          <span>{msg.data.artisti.map(a => a.nomeDarte).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-400 mt-1">
                  {format(msg.timestamp, 'HH:mm')}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="p-4 border-t bg-gray-50">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descrivi l'evento... (Invio per inviare)"
              rows={1}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
          
          {/* Quick actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setInput('Serata con DJ ')}
              className="px-3 py-1.5 text-xs bg-white border rounded-full hover:bg-gray-50"
            >
              🎧 DJ Set
            </button>
            <button
              onClick={() => setInput('Concerto live con ')}
              className="px-3 py-1.5 text-xs bg-white border rounded-full hover:bg-gray-50"
            >
              🎸 Concerto
            </button>
            <button
              onClick={() => setInput('Spettacolo di cabaret con ')}
              className="px-3 py-1.5 text-xs bg-white border rounded-full hover:bg-gray-50"
            >
              🎭 Cabaret
            </button>
          </div>
        </div>
      </div>
      
      {/* Sidebar - Preview richiesta */}
      <div className="w-80 bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={18} />
            Riepilogo Richiesta
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {/* Data evento */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 uppercase">Data Evento</label>
            {extractedData.dataEvento ? (
              <div className="flex items-center gap-2 mt-1 p-2 bg-green-50 border border-green-200 rounded-lg">
                <Calendar size={16} className="text-green-600" />
                <span className="text-sm font-medium">
                  {format(new Date(extractedData.dataEvento), 'd MMMM yyyy', { locale: it })}
                </span>
                <CheckCircle size={14} className="text-green-500 ml-auto" />
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-sm text-gray-400">Da specificare</span>
              </div>
            )}
          </div>
          
          {/* Locale */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 uppercase">Locale</label>
            {extractedData.locale?.nome ? (
              <div className="flex items-center gap-2 mt-1 p-2 bg-green-50 border border-green-200 rounded-lg">
                <MapPin size={16} className="text-green-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{extractedData.locale.nome}</p>
                  {extractedData.locale.citta && (
                    <p className="text-xs text-gray-500">{extractedData.locale.citta}</p>
                  )}
                </div>
                {extractedData.locale.isNuovo && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Nuovo</span>
                )}
                <CheckCircle size={14} className="text-green-500" />
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-sm text-gray-400">Da specificare</span>
              </div>
            )}
          </div>
          
          {/* Artisti */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Artisti ({extractedData.artisti?.length || 0})
            </label>
            {extractedData.artisti && extractedData.artisti.length > 0 ? (
              <div className="mt-1 space-y-2">
                {extractedData.artisti.map((artista, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <Music size={16} className="text-green-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{artista.nomeDarte}</p>
                      {artista.qualifica && (
                        <p className="text-xs text-gray-500">{artista.qualifica}</p>
                      )}
                    </div>
                    {artista.compensoNetto && (
                      <span className="text-sm font-semibold text-green-600">
                        €{formatImporto(artista.compensoNetto)}
                      </span>
                    )}
                    {artista.isNuovo && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Nuovo</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                <Users size={16} className="text-gray-400" />
                <span className="text-sm text-gray-400">Nessun artista</span>
              </div>
            )}
          </div>
          
          {/* Totale compensi */}
          {extractedData.artisti && extractedData.artisti.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Totale compensi</span>
                <span className="font-bold text-blue-700">
                  €{formatImporto(extractedData.artisti.reduce((s, a) => s + (a.compensoNetto || 0), 0))}
                </span>
              </div>
            </div>
          )}
          
          {/* Campi mancanti */}
          {extractedData.missingFields && extractedData.missingFields.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs font-medium text-yellow-700 mb-2 flex items-center gap-1">
                <AlertCircle size={14} />
                Informazioni mancanti:
              </p>
              <ul className="text-xs text-yellow-600 space-y-1">
                {extractedData.missingFields.map((field, i) => (
                  <li key={i}>• {field}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Footer con azione */}
        <div className="p-4 border-t bg-gray-50">
          {extractedData.isComplete ? (
            <button
              onClick={submitRequest}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {isProcessing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle size={18} />
                  Crea Richiesta
                </>
              )}
            </button>
          ) : (
            <div className="text-center text-sm text-gray-500">
              Completa le informazioni nella chat per creare la richiesta
            </div>
          )}
          
          <Link
            href="/richieste-agibilita/nuova"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            Preferisci il form classico? <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
