// src/app/(dashboard)/richieste-agibilita/chat/page.tsx
// Chat AI per Richieste Agibilità - Mobile Responsive
'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Send, Bot, User, Loader2, CheckCircle, AlertCircle,
  Calendar, MapPin, Users, Euro, FileText, Sparkles,
  ArrowRight, X, Building2, Music, Edit2, Trash2, 
  ChevronDown, ChevronUp, Menu, RotateCcw
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

export default function ChatRichiestaPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Ciao! 👋 Sono l'assistente per le richieste di agibilità.

Descrivimi l'evento e cercherò di estrarre automaticamente tutte le informazioni.

**Esempio:**
_"DJ Marco Rossi il 15 dicembre al Molo 5, compenso 300€"_`,
      timestamp: new Date(),
    }
  ])
  
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData>({})
  const [showSidebar, setShowSidebar] = useState(false)
  
  // Modifica dati
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  
  // Modifica artista
  const [editingArtista, setEditingArtista] = useState<number | null>(null)
  const [editArtistaData, setEditArtistaData] = useState({ nomeDarte: '', compensoNetto: '' })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Processa il messaggio con AI
  const processMessage = async (userMessage: string) => {
    setIsProcessing(true)
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    
    const thinkingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      status: 'thinking',
    }
    setMessages(prev => [...prev, thinkingMsg])
    
    try {
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
      
      if (data.extractedData) {
        setExtractedData(prev => ({
          ...prev,
          ...data.extractedData,
          artisti: data.extractedData.artisti || prev.artisti,
          locale: data.extractedData.locale || prev.locale,
        }))
      }
      
      setMessages(prev => prev.map(m => 
        m.id === thinkingMsg.id 
          ? { ...m, content: data.response, status: 'complete', data: data.extractedData }
          : m
      ))
      
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
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ **Richiesta creata con successo!**

Codice: **${data.codice}**

Puoi seguire lo stato dalla lista richieste.`,
        timestamp: new Date(),
      }])
      
      setShowSidebar(false)
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

  // Funzioni modifica dati
  const handleEditData = (field: string) => {
    setEditingField(field)
    if (field === 'dataEvento') setEditValue(extractedData.dataEvento || '')
    else if (field === 'locale') setEditValue(extractedData.locale?.nome || '')
  }

  const saveEditData = () => {
    if (!editingField) return
    
    if (editingField === 'dataEvento') {
      setExtractedData(prev => ({ ...prev, dataEvento: editValue }))
    } else if (editingField === 'locale') {
      setExtractedData(prev => ({ 
        ...prev, 
        locale: { ...prev.locale, nome: editValue, isNuovo: true } as any
      }))
    }
    setEditingField(null)
    setEditValue('')
    recalculateMissing()
  }

  const handleEditArtista = (index: number) => {
    const artista = extractedData.artisti?.[index]
    if (artista) {
      setEditingArtista(index)
      setEditArtistaData({
        nomeDarte: artista.nomeDarte || '',
        compensoNetto: artista.compensoNetto?.toString() || ''
      })
    }
  }

  const saveEditArtista = () => {
    if (editingArtista === null) return
    
    setExtractedData(prev => {
      const artisti = [...(prev.artisti || [])]
      artisti[editingArtista] = {
        ...artisti[editingArtista],
        nomeDarte: editArtistaData.nomeDarte,
        compensoNetto: parseFloat(editArtistaData.compensoNetto) || 0
      }
      return { ...prev, artisti }
    })
    setEditingArtista(null)
    recalculateMissing()
  }

  const handleDeleteArtista = (index: number) => {
    setExtractedData(prev => {
      const artisti = [...(prev.artisti || [])]
      artisti.splice(index, 1)
      return { ...prev, artisti }
    })
    recalculateMissing()
  }

  const recalculateMissing = () => {
    setTimeout(() => {
      setExtractedData(prev => {
        const missingFields: string[] = []
        if (!prev.dataEvento) missingFields.push('Data evento')
        if (!prev.locale?.nome) missingFields.push('Nome locale')
        if (!prev.artisti || prev.artisti.length === 0) missingFields.push('Almeno un artista')
        else {
          const senzaCompenso = prev.artisti.filter(a => !a.compensoNetto)
          if (senzaCompenso.length > 0) {
            missingFields.push(`Compenso per: ${senzaCompenso.map(a => a.nomeDarte).join(', ')}`)
          }
        }
        return { ...prev, isComplete: missingFields.length === 0, missingFields }
      })
    }, 100)
  }

  const resetChat = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Ciao! 👋 Ricominciamo da capo.

Descrivimi l'evento per cui ti serve l'agibilità.`,
      timestamp: new Date(),
    }])
    setExtractedData({})
  }

  const formatImporto = (n?: number) => n?.toLocaleString('it-IT', { minimumFractionDigits: 2 }) || '-'

  const hasData = extractedData.dataEvento || extractedData.locale || (extractedData.artisti && extractedData.artisti.length > 0)

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4">
      {/* Chat principale */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="text-white" size={20} />
              </div>
              <div>
                <h1 className="font-semibold text-white text-sm sm:text-base">Assistente Richieste</h1>
                <p className="text-xs text-blue-100 hidden sm:block">Descrivi l'evento, penso io al resto</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetChat}
                className="p-2 hover:bg-white/20 rounded-lg text-white"
                title="Ricomincia"
              >
                <RotateCcw size={18} />
              </button>
              {/* Toggle sidebar mobile */}
              {hasData && (
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="lg:hidden p-2 bg-white/20 rounded-lg text-white relative"
                >
                  <Menu size={18} />
                  {extractedData.isComplete && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
              }`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              
              {/* Content */}
              <div className={`max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.status === 'thinking' ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm">Elaboro...</span>
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
                
                <p className="text-xs text-gray-400 mt-1">
                  {format(msg.timestamp, 'HH:mm')}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="p-3 sm:p-4 border-t bg-gray-50">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descrivi l'evento..."
              rows={1}
              className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
          
          {/* Quick actions */}
          <div className="flex gap-2 mt-2 sm:mt-3 overflow-x-auto pb-1">
            <button
              onClick={() => setInput('Serata con DJ ')}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs bg-white border rounded-full hover:bg-gray-50 whitespace-nowrap"
            >
              🎧 DJ Set
            </button>
            <button
              onClick={() => setInput('Concerto live con ')}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs bg-white border rounded-full hover:bg-gray-50 whitespace-nowrap"
            >
              🎸 Concerto
            </button>
            <button
              onClick={() => setInput('Spettacolo cabaret ')}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs bg-white border rounded-full hover:bg-gray-50 whitespace-nowrap"
            >
              🎭 Cabaret
            </button>
          </div>
        </div>
      </div>
      
      {/* Sidebar - Preview richiesta */}
      <div className={`
        ${showSidebar ? 'fixed inset-0 z-50 lg:relative lg:inset-auto' : 'hidden lg:flex'}
        lg:w-80 lg:flex-col
      `}>
        {/* Overlay mobile */}
        {showSidebar && (
          <div 
            className="absolute inset-0 bg-black/50 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
        
        <div className={`
          ${showSidebar ? 'absolute right-0 top-0 h-full w-80 sm:w-96' : 'w-full h-full'}
          bg-white rounded-l-xl lg:rounded-xl shadow-sm border overflow-hidden flex flex-col
        `}>
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText size={18} />
              Riepilogo
            </h2>
            <button 
              onClick={() => setShowSidebar(false)}
              className="lg:hidden p-1 hover:bg-gray-200 rounded"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {/* Data evento */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 uppercase">Data Evento</label>
              {editingField === 'dataEvento' ? (
                <div className="flex gap-2 mt-1">
                  <input
                    type="date"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                  />
                  <button onClick={saveEditData} className="p-1 bg-green-100 text-green-600 rounded">
                    <CheckCircle size={16} />
                  </button>
                  <button onClick={() => setEditingField(null)} className="p-1 bg-gray-100 text-gray-600 rounded">
                    <X size={16} />
                  </button>
                </div>
              ) : extractedData.dataEvento ? (
                <div className="flex items-center gap-2 mt-1 p-2 bg-green-50 border border-green-200 rounded-lg group">
                  <Calendar size={16} className="text-green-600" />
                  <span className="text-sm font-medium flex-1">
                    {format(new Date(extractedData.dataEvento), 'd MMMM yyyy', { locale: it })}
                  </span>
                  <button 
                    onClick={() => handleEditData('dataEvento')}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-green-100 rounded"
                  >
                    <Edit2 size={14} className="text-green-600" />
                  </button>
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
              {editingField === 'locale' ? (
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                    placeholder="Nome locale"
                  />
                  <button onClick={saveEditData} className="p-1 bg-green-100 text-green-600 rounded">
                    <CheckCircle size={16} />
                  </button>
                  <button onClick={() => setEditingField(null)} className="p-1 bg-gray-100 text-gray-600 rounded">
                    <X size={16} />
                  </button>
                </div>
              ) : extractedData.locale?.nome ? (
                <div className="flex items-center gap-2 mt-1 p-2 bg-green-50 border border-green-200 rounded-lg group">
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
                  <button 
                    onClick={() => handleEditData('locale')}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-green-100 rounded"
                  >
                    <Edit2 size={14} className="text-green-600" />
                  </button>
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
                    <div key={i}>
                      {editingArtista === i ? (
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                          <input
                            type="text"
                            value={editArtistaData.nomeDarte}
                            onChange={(e) => setEditArtistaData(prev => ({ ...prev, nomeDarte: e.target.value }))}
                            className="w-full px-2 py-1 border rounded text-sm"
                            placeholder="Nome d'arte"
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={editArtistaData.compensoNetto}
                              onChange={(e) => setEditArtistaData(prev => ({ ...prev, compensoNetto: e.target.value }))}
                              className="flex-1 px-2 py-1 border rounded text-sm"
                              placeholder="Compenso €"
                            />
                            <button onClick={saveEditArtista} className="p-1 bg-green-100 text-green-600 rounded">
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={() => setEditingArtista(null)} className="p-1 bg-gray-100 text-gray-600 rounded">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg group">
                          <Music size={16} className="text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{artista.nomeDarte}</p>
                            {artista.qualifica && (
                              <p className="text-xs text-gray-500">{artista.qualifica}</p>
                            )}
                          </div>
                          {artista.compensoNetto ? (
                            <span className="text-sm font-semibold text-green-600">
                              €{formatImporto(artista.compensoNetto)}
                            </span>
                          ) : (
                            <span className="text-xs text-orange-500">Manca €</span>
                          )}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                            <button 
                              onClick={() => handleEditArtista(i)}
                              className="p-1 hover:bg-green-100 rounded"
                            >
                              <Edit2 size={14} className="text-green-600" />
                            </button>
                            <button 
                              onClick={() => handleDeleteArtista(i)}
                              className="p-1 hover:bg-red-100 rounded"
                            >
                              <Trash2 size={14} className="text-red-500" />
                            </button>
                          </div>
                        </div>
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
                  Mancano:
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
                Completa le informazioni per creare la richiesta
              </div>
            )}
            
            <Link
              href="/richieste-agibilita/nuova"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              Form classico <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
