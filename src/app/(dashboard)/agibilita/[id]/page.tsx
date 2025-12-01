// src/app/(dashboard)/agibilita/[id]/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Users, MapPin, Building2, Calendar, Euro, AlertTriangle, Download, Trash2, Upload, CheckCircle, XCircle, Edit, Copy, Loader2 } from 'lucide-react'
import { STATI_AGIBILITA } from '@/lib/constants'

export default function GestisciAgibilitaPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [agibilita, setAgibilita] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [uploadingRisposta, setUploadingRisposta] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [duplicando, setDuplicando] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (id) {
      fetch(`/api/agibilita/${id}`)
        .then(r => r.json())
        .then(data => {
          if (data.error) {
            setError(data.error)
          } else {
            setAgibilita(data)
          }
        })
        .catch(err => setError('Errore nel caricamento'))
        .finally(() => setLoadingData(false))
    }
  }, [id])

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/agibilita/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nell\'eliminazione')
      }
      router.push('/agibilita')
    } catch (err: any) {
      setError(err.message)
      setShowDeleteConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDuplica = async () => {
    if (!confirm(`Vuoi duplicare l'agibilità ${agibilita.codice}?`)) return
    
    setDuplicando(true)
    setError('')
    
    try {
      const res = await fetch(`/api/agibilita/${id}/duplica`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Errore nella duplicazione')
      }
      
      // Vai alla nuova agibilità
      router.push(`/agibilita/${data.agibilita.id}`)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDuplicando(false)
    }
  }

  const handleDownloadXML = async () => {
    setError('')
    try {
      const res = await fetch(`/api/agibilita/${id}/xml`)
      if (!res.ok) {
        const data = await res.json()
        // Mostra errori dettagliati
        if (data.dettagli && Array.isArray(data.dettagli)) {
          setError(data.error + ':\n' + data.dettagli.map((d: string) => '• ' + d).join('\n'))
        } else {
          setError(data.error || 'Errore nella generazione XML')
        }
        return
      }
      
      // Scarica file
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${agibilita.codice}.xml`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setError('Errore nel download XML: ' + err.message)
    }
  }

  // Verifica dati incompleti (senza bloccare)
  const getDatiIncompleti = () => {
    const errori: string[] = []
    
    agibilita.artisti?.forEach((aa: any, index: number) => {
      const artista = aa.artista
      if (!artista.codiceFiscale) {
        errori.push(`Artista ${artista.cognome} ${artista.nome}: Codice fiscale mancante`)
      }
    })
    
    if (!agibilita.locale?.codiceBelfiore) {
      errori.push(`Locale ${agibilita.locale?.nome}: Codice Belfiore mancante`)
    }
    
    return errori
  }

  const handleUploadRisposta = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingRisposta(true)
    setError('')
    setUploadSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/agibilita/${id}/carica-zip-inps`, {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Errore nel caricamento')
      }

      setUploadSuccess(
        `ZIP elaborato con successo!\n` +
        `Esito: ${data.esito}\n` +
        `PDF salvato in: ${data.pdfSalvatoIn.locale}` +
        (data.pdfSalvatoIn.committente ? ` + ${data.pdfSalvatoIn.committente}` : '')
      )
      
      // Ricarica agibilità
      const resAgibilita = await fetch(`/api/agibilita/${id}`)
      const dataAgibilita = await resAgibilita.json()
      setAgibilita(dataAgibilita)

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadingRisposta(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !agibilita) {
    return (
      <div className="p-6 bg-red-50 rounded-lg text-red-700">
        <p>{error}</p>
        <Link href="/agibilita" className="text-blue-600 hover:underline mt-2 inline-block">
          Torna alla lista
        </Link>
      </div>
    )
  }

  if (!agibilita) return null

  const stato = STATI_AGIBILITA[agibilita.stato as keyof typeof STATI_AGIBILITA]
  const datiIncompleti = getDatiIncompleti()

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/agibilita" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{agibilita.codice}</h1>
            <p className="text-gray-500">Dettaglio agibilità</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1 ${
            agibilita.stato === 'BOZZA' ? 'bg-gray-100 text-gray-700' :
            agibilita.stato === 'DATI_INCOMPLETI' ? 'bg-yellow-100 text-yellow-700' :
            agibilita.stato === 'PRONTA' ? 'bg-blue-100 text-blue-700' :
            agibilita.stato === 'INVIATA_INPS' ? 'bg-purple-100 text-purple-700' :
            agibilita.stato === 'COMPLETATA' ? 'bg-green-100 text-green-700' :
            agibilita.stato === 'ERRORE' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {stato?.icon} {stato?.label || agibilita.stato}
          </span>
          <button
            onClick={handleDuplica}
            disabled={duplicando}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {duplicando ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Copy size={18} />
            )}
            Duplica
          </button>
          <Link
            href={`/agibilita/${id}/modifica`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit size={18} />
            Modifica
          </Link>
        </div>
      </div>

      {/* Warning Dati Incompleti */}
      {datiIncompleti.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 flex-shrink-0" size={20} />
            <div>
              <p className="font-medium text-yellow-800 mb-1">Attenzione: Dati incompleti per XML INPS</p>
              <ul className="text-sm text-yellow-700 space-y-1">
                {datiIncompleti.map((errore, i) => (
                  <li key={i}>• {errore}</li>
                ))}
              </ul>
              <p className="text-xs text-yellow-600 mt-2">L'XML può comunque essere generato ma potrebbe essere rifiutato da INPS</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 whitespace-pre-line">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Date Prestazione
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Data Inizio</p>
                <p className="font-medium">{new Date(agibilita.data).toLocaleDateString('it-IT')}</p>
              </div>
              {agibilita.dataFine && (
                <div>
                  <p className="text-sm text-gray-500">Data Fine</p>
                  <p className="font-medium">{new Date(agibilita.dataFine).toLocaleDateString('it-IT')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Artisti */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} />
              Artisti ({agibilita.artisti?.length || 0})
            </h2>
            <div className="space-y-3">
              {agibilita.artisti?.map((aa: any) => (
                <div key={aa.id} className={`flex items-center justify-between p-4 rounded-lg border ${!aa.artista.iscritto ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div>
                    <p className="font-medium">
                      {aa.artista.cognome} {aa.artista.nome}
                      {aa.artista.nomeDarte && <span className="text-gray-500"> &quot;{aa.artista.nomeDarte}&quot;</span>}
                    </p>
                    <p className="text-sm text-gray-500">
                      {aa.qualifica || 'Qualifica N/D'}
                      {!aa.artista.iscritto && <span className="ml-2 text-yellow-600">• Dati incompleti</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">€{parseFloat(aa.compensoNetto).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Netto</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Locale */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={20} />
              Locale
            </h2>
            <p className="font-medium">{agibilita.locale?.nome}</p>
            <p className="text-gray-500">{agibilita.locale?.citta}</p>
          </div>

          {/* Committente */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 size={20} />
              Committente
            </h2>
            <div className="flex items-center gap-2">
              <p className="font-medium">{agibilita.committente?.ragioneSociale}</p>
              {agibilita.committente?.aRischio && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                  <AlertTriangle size={12} />
                  A rischio
                </span>
              )}
            </div>
          </div>

          {/* Note */}
          {agibilita.note && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Note</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{agibilita.note}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Riepilogo economico */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Euro size={20} />
              Riepilogo
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Totale Netto</span>
                <span className="font-medium">€{parseFloat(agibilita.totaleCompensiNetti || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Totale Lordo</span>
                <span className="font-medium">€{parseFloat(agibilita.totaleCompensiLordi || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ritenute</span>
                <span className="font-medium text-red-600">€{parseFloat(agibilita.totaleRitenute || 0).toFixed(2)}</span>
              </div>
              {parseFloat(agibilita.quotaAgenzia || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Quota Agenzia</span>
                  <span className="font-medium">€{parseFloat(agibilita.quotaAgenzia).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t">
                <span className="font-medium">Importo Fattura</span>
                <span className="font-bold text-lg text-blue-600">€{parseFloat(agibilita.importoFattura || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Azioni */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Azioni INPS</h2>
            
            {uploadSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                <CheckCircle size={16} />
                {uploadSuccess}
              </div>
            )}

            <div className="space-y-2">
              {/* Scarica XML INPS */}
              <button
                onClick={handleDownloadXML}
                className="flex items-center gap-2 w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Download size={18} />
                Scarica XML INPS
              </button>

              {/* Upload ZIP INPS */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleUploadRisposta}
                  className="hidden"
                  id="upload-risposta"
                />
                <label
                  htmlFor="upload-risposta"
                  className="flex items-center gap-2 w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
                >
                  <Upload size={18} />
                  {uploadingRisposta ? 'Caricamento...' : 'Carica ZIP INPS'}
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Carica lo ZIP con XML risposta + PDF certificato
                </p>
              </div>

              {/* Info INPS se presente */}
              {agibilita.identificativoINPS && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">Dati INPS</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">ID Agibilità:</span>
                      <span className="font-mono">{agibilita.identificativoINPS}</span>
                    </div>
                    {agibilita.esitoINPS && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Esito:</span>
                        <span className={`font-medium flex items-center gap-1 ${
                          agibilita.esitoINPS === 'OK' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {agibilita.esitoINPS === 'OK' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {agibilita.esitoINPS}
                        </span>
                      </div>
                    )}
                    {agibilita.hashINPS && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Hash:</span>
                        <span className="font-mono text-xs">{agibilita.hashINPS.substring(0, 12)}...</span>
                      </div>
                    )}
                    {agibilita.rispostaINPSAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Risposta del:</span>
                        <span>{new Date(agibilita.rispostaINPSAt).toLocaleDateString('it-IT')}</span>
                      </div>
                    )}
                    {agibilita.ricevutaINPSPath && (
                      <div className="pt-2 border-t mt-2">
                        <a
                          href={agibilita.ricevutaINPSPath}
                          download={`${new Date(agibilita.data).toISOString().split('T')[0]} - ${agibilita.locale?.nome || 'certificato'}.pdf`}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <FileText size={14} />
                          Scarica Certificato PDF
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Altre Azioni */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Altre Azioni</h2>
            <div className="space-y-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 w-full px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
              >
                <Trash2 size={18} />
                Elimina Agibilità
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Conferma eliminazione</h3>
            <p className="text-gray-600 mb-4">
              Sei sicuro di voler eliminare l&apos;agibilità {agibilita.codice}? Questa azione non può essere annullata.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}