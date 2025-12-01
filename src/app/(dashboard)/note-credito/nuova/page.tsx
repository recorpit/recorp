// src/app/(dashboard)/note-credito/nuova/page.tsx
// Pagina Creazione Nuova Nota di Credito
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, ReceiptText, AlertCircle, Check, Euro,
  FileText, Building2, Calendar, Info
} from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface Fattura {
  id: string
  numero: string
  dataEmissione: string
  imponibile: number
  iva: number
  totale: number
  aliquotaIva: number
  splitPayment: boolean
  committente: {
    id: string
    ragioneSociale: string
    partitaIva: string
  }
}

function NuovaNotaCreditoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fatturaIdParam = searchParams.get('fatturaId')
  
  const [loading, setLoading] = useState(false)
  const [loadingFattura, setLoadingFattura] = useState(false)
  const [error, setError] = useState('')
  
  // Dati form
  const [fatturaId, setFatturaId] = useState(fatturaIdParam || '')
  const [fattura, setFattura] = useState<Fattura | null>(null)
  const [tipo, setTipo] = useState<'TOTALE' | 'PARZIALE'>('TOTALE')
  const [motivo, setMotivo] = useState('')
  const [importoParziale, setImportoParziale] = useState('')
  
  // Righe per storno parziale dettagliato
  const [righe, setRighe] = useState<Array<{
    descrizione: string
    quantita: number
    prezzoUnitario: number
  }>>([])
  const [usaRigheDettagliate, setUsaRigheDettagliate] = useState(false)
  
  // Carica fattura di riferimento
  useEffect(() => {
    if (!fatturaId) {
      setFattura(null)
      return
    }
    
    async function loadFattura() {
      setLoadingFattura(true)
      try {
        const res = await fetch(`/api/fatture/${fatturaId}`)
        if (!res.ok) {
          throw new Error('Fattura non trovata')
        }
        const data = await res.json()
        
        if (data.stato === 'BOZZA' || data.stato === 'ANNULLATA') {
          throw new Error('Non è possibile creare una nota di credito per questa fattura')
        }
        
        setFattura(data)
        setError('')
      } catch (err: any) {
        setError(err.message)
        setFattura(null)
      } finally {
        setLoadingFattura(false)
      }
    }
    
    loadFattura()
  }, [fatturaId])
  
  // Calcola importi
  const imponibileCalcolato = tipo === 'TOTALE' 
    ? (fattura ? Number(fattura.imponibile) : 0)
    : usaRigheDettagliate
      ? righe.reduce((sum, r) => sum + (r.quantita * r.prezzoUnitario), 0)
      : parseFloat(importoParziale) || 0
  
  const ivaCalcolata = fattura 
    ? imponibileCalcolato * (fattura.aliquotaIva / 100)
    : 0
  
  const totaleCalcolato = fattura?.splitPayment 
    ? imponibileCalcolato 
    : imponibileCalcolato + ivaCalcolata
  
  // Aggiungi riga
  const addRiga = () => {
    setRighe([...righe, { descrizione: '', quantita: 1, prezzoUnitario: 0 }])
  }
  
  // Rimuovi riga
  const removeRiga = (index: number) => {
    setRighe(righe.filter((_, i) => i !== index))
  }
  
  // Aggiorna riga
  const updateRiga = (index: number, field: string, value: any) => {
    const newRighe = [...righe]
    newRighe[index] = { ...newRighe[index], [field]: value }
    setRighe(newRighe)
  }
  
  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fattura) {
      setError('Seleziona una fattura di riferimento')
      return
    }
    
    if (!motivo.trim()) {
      setError('Inserisci il motivo della nota di credito')
      return
    }
    
    if (tipo === 'PARZIALE') {
      if (usaRigheDettagliate) {
        if (righe.length === 0) {
          setError('Aggiungi almeno una riga')
          return
        }
      } else {
        if (!importoParziale || parseFloat(importoParziale) <= 0) {
          setError('Inserisci un importo valido')
          return
        }
      }
      
      // Verifica non superi fattura
      if (imponibileCalcolato > Number(fattura.imponibile)) {
        setError(`L'importo non può superare l'imponibile della fattura (€${Number(fattura.imponibile).toFixed(2)})`)
        return
      }
    }
    
    setLoading(true)
    setError('')
    
    try {
      const payload: any = {
        fatturaRiferimentoId: fattura.id,
        tipo,
        motivo,
      }
      
      if (tipo === 'PARZIALE') {
        if (usaRigheDettagliate) {
          payload.righe = righe.map(r => ({
            ...r,
            aliquotaIva: fattura.aliquotaIva,
          }))
        } else {
          payload.importoParziale = parseFloat(importoParziale)
        }
      }
      
      const res = await fetch('/api/note-credito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nella creazione')
      }
      
      const notaCredito = await res.json()
      router.push(`/note-credito/${notaCredito.id}`)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href={fatturaIdParam ? `/fatture/${fatturaIdParam}` : '/note-credito'} 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuova Nota di Credito</h1>
          <p className="text-gray-500">Crea una nota di credito per stornare una fattura</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Fattura di riferimento */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-gray-400" />
            Fattura di Riferimento
          </h2>
          
          {!fatturaIdParam && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID o Numero Fattura
              </label>
              <input
                type="text"
                value={fatturaId}
                onChange={(e) => setFatturaId(e.target.value)}
                placeholder="Inserisci l'ID della fattura..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          {loadingFattura ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : fattura ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="text-blue-600" size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-blue-900">Fattura {fattura.numero}</h3>
                    <span className="text-lg font-bold text-blue-600">
                      €{Number(fattura.totale).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {fattura.committente.ragioneSociale} • P.IVA {fattura.committente.partitaIva}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Emessa il {format(new Date(fattura.dataEmissione), 'd MMMM yyyy', { locale: it })}
                  </p>
                  <div className="mt-2 text-sm text-blue-700">
                    Imponibile: €{Number(fattura.imponibile).toFixed(2)} • 
                    IVA {fattura.aliquotaIva}%: €{Number(fattura.iva).toFixed(2)}
                    {fattura.splitPayment && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                        Split Payment
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : fatturaId ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-red-700">Fattura non trovata o non valida</p>
            </div>
          ) : null}
        </div>
        
        {/* Tipo storno */}
        {fattura && (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipo di Storno</h2>
              
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                  <input
                    type="radio"
                    name="tipo"
                    value="TOTALE"
                    checked={tipo === 'TOTALE'}
                    onChange={() => setTipo('TOTALE')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Storno Totale</p>
                    <p className="text-sm text-gray-500">
                      Annulla completamente la fattura (€{Number(fattura.imponibile).toFixed(2)} + IVA)
                    </p>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                  <input
                    type="radio"
                    name="tipo"
                    value="PARZIALE"
                    checked={tipo === 'PARZIALE'}
                    onChange={() => setTipo('PARZIALE')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Storno Parziale</p>
                    <p className="text-sm text-gray-500">
                      Storna solo una parte dell&apos;importo
                    </p>
                  </div>
                </label>
              </div>
            </div>
            
            {/* Importo parziale */}
            {tipo === 'PARZIALE' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Importo da Stornare</h2>
                
                <div className="mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={usaRigheDettagliate}
                      onChange={(e) => {
                        setUsaRigheDettagliate(e.target.checked)
                        if (e.target.checked && righe.length === 0) {
                          addRiga()
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Usa righe dettagliate</span>
                  </label>
                </div>
                
                {usaRigheDettagliate ? (
                  <div className="space-y-4">
                    {righe.map((riga, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start gap-4">
                          <span className="text-gray-400 font-medium">{index + 1}.</span>
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={riga.descrizione}
                              onChange={(e) => updateRiga(index, 'descrizione', e.target.value)}
                              placeholder="Descrizione..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Quantità</label>
                                <input
                                  type="number"
                                  value={riga.quantita}
                                  onChange={(e) => updateRiga(index, 'quantita', parseInt(e.target.value) || 1)}
                                  min="1"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Prezzo Unitario</label>
                                <input
                                  type="number"
                                  value={riga.prezzoUnitario}
                                  onChange={(e) => updateRiga(index, 'prezzoUnitario', parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.01"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeRiga(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addRiga}
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-500"
                    >
                      + Aggiungi Riga
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Importo Imponibile da Stornare
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                      <input
                        type="number"
                        value={importoParziale}
                        onChange={(e) => setImportoParziale(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        max={Number(fattura.imponibile)}
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Massimo stornabile: €{Number(fattura.imponibile).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Motivo */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Motivo</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo della nota di credito *
                  </label>
                  <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    rows={3}
                    placeholder="Es: Errore di fatturazione, reso merce, sconto accordato..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                {/* Suggerimenti rapidi */}
                <div className="flex flex-wrap gap-2">
                  {['Errore di fatturazione', 'Reso merce', 'Sconto accordato', 'Annullamento servizio'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setMotivo(sug)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:border-blue-300 hover:text-blue-600"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Riepilogo */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Riepilogo</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Imponibile:</span>
                  <span className="font-medium">€{imponibileCalcolato.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA {fattura.aliquotaIva}%:</span>
                  <span className="font-medium">€{ivaCalcolata.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-3 border-t">
                  <span>Totale Nota di Credito:</span>
                  <span className="text-red-600">-€{totaleCalcolato.toFixed(2)}</span>
                </div>
                
                {fattura.splitPayment && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Split Payment:</strong> Il rimborso sarà di €{imponibileCalcolato.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        
        {/* Errore */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {/* Bottoni */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href={fatturaIdParam ? `/fatture/${fatturaIdParam}` : '/note-credito'}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annulla
          </Link>
          <button
            type="submit"
            disabled={loading || !fattura}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <ReceiptText size={20} />
            )}
            Crea Nota di Credito
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NuovaNotaCreditoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <NuovaNotaCreditoContent />
    </Suspense>
  )
}