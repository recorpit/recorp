// src/app/firma/[token]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, AlertTriangle, FileText, Euro, Calendar, Upload, X } from 'lucide-react'

export default function FirmaPrestazionePublicPage() {
  const params = useParams()
  const token = params.token as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [data, setData] = useState<any>(null)
  const [giaFirmata, setGiaFirmata] = useState(false)
  
  const [form, setForm] = useState({
    numeroRicevuta: '',
    tipoPagamento: 'STANDARD',
    rimborsoSpese: '',
    firmaNome: '',
    firmaCognome: '',
    accettazione: false,
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [rimborsoFile, setRimborsoFile] = useState<File | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/firma/${token}`)
        const result = await res.json()
        
        if (!res.ok) {
          throw new Error(result.error)
        }
        
        if (result.giaFirmata) {
          setGiaFirmata(true)
          setData(result)
        } else {
          setData(result)
          // Inizializza numero ricevuta proposto
          if (result.numeroProposto) {
            setForm(f => ({ ...f, numeroRicevuta: String(result.numeroProposto) }))
          }
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.accettazione) {
      setError('Devi accettare le condizioni')
      return
    }
    
    if (!form.firmaNome || !form.firmaCognome) {
      setError('Inserisci nome e cognome')
      return
    }
    
    // Verifica rimborso spese con allegato
    const rimborso = parseFloat(form.rimborsoSpese) || 0
    if (rimborso > 0 && !rimborsoFile) {
      setError('Allegare documentazione per rimborso spese')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      // TODO: upload file rimborso se presente
      
      const res = await fetch(`/api/firma/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroRicevuta: parseInt(form.numeroRicevuta) || null,
          tipoPagamento: form.tipoPagamento,
          rimborsoSpese: parseFloat(form.rimborsoSpese) || 0,
          firmaNome: form.firmaNome,
          firmaCognome: form.firmaCognome,
          accettazione: form.accettazione,
        })
      })
      
      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result.error)
      }
      
      setSuccess(true)
      setData(result)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Calcola preview importi
  const calcolaPreview = () => {
    if (!data?.prestazione) return null
    
    const nettoOriginale = parseFloat(data.prestazione.compensoNetto)
    const rimborso = Math.min(
      parseFloat(form.rimborsoSpese) || 0,
      data.opzioni.maxRimborsoSpese
    )
    const sconto = form.tipoPagamento === 'ANTICIPATO' && data.opzioni.puoAnticipare ? 5 : 0
    
    const nettoDopoRimborso = nettoOriginale - rimborso
    const lordoDopoRimborso = nettoDopoRimborso / 0.8
    const ritenutaDopoRimborso = lordoDopoRimborso * 0.2
    
    const totalePagato = nettoDopoRimborso + rimborso - sconto
    
    return {
      compensoLordo: lordoDopoRimborso.toFixed(2),
      compensoNetto: nettoDopoRimborso.toFixed(2),
      ritenuta: ritenutaDopoRimborso.toFixed(2),
      rimborsoSpese: rimborso.toFixed(2),
      scontoAnticipo: sconto.toFixed(2),
      totalePagato: totalePagato.toFixed(2),
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Errore</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (giaFirmata) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Già Firmata</h1>
          <p className="text-gray-600 mb-4">
            Questa prestazione è già stata firmata il{' '}
            {new Date(data.dataFirma).toLocaleDateString('it-IT')}
          </p>
          <p className="text-sm text-gray-500">
            Codice: {data.prestazione?.codice}
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Firma Completata!</h1>
          <p className="text-gray-600 mb-4">
            La tua prestazione è stata firmata con successo.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Totale da ricevere:</span>
              <span className="font-bold text-green-600">€{data.dettagli?.totalePagato}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pagamento entro:</span>
              <span className="font-medium">
                {data.dettagli?.tipoPagamento === 'ANTICIPATO' 
                  ? 'Immediato' 
                  : new Date(data.dettagli?.dataScadenzaPagamento).toLocaleDateString('it-IT')
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const preview = calcolaPreview()
  const agibilita = data.prestazione.agibilitaIncluse as any[]

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white rounded-t-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={32} />
            <div>
              <h1 className="text-xl font-bold">Ricevuta Prestazione Occasionale</h1>
              <p className="text-blue-100">OKL SRL - {data.prestazione.codice}</p>
            </div>
          </div>
        </div>

        {/* Contenuto */}
        <div className="bg-white rounded-b-xl shadow-lg">
          {/* Dati Artista */}
          <div className="p-6 border-b">
            <h2 className="font-semibold text-gray-900 mb-3">I tuoi dati</h2>
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p className="font-medium">{data.artista.cognome} {data.artista.nome}</p>
              <p className="text-gray-600">{data.artista.indirizzo}</p>
              <p className="text-gray-600">{data.artista.cap} - {data.artista.citta} ({data.artista.provincia})</p>
              <p className="text-gray-600 font-mono mt-1">{data.artista.codiceFiscale}</p>
            </div>
          </div>

          {/* Prestazioni incluse */}
          <div className="p-6 border-b">
            <h2 className="font-semibold text-gray-900 mb-3">Prestazioni</h2>
            <div className="space-y-2">
              {agibilita.map((ag: any, i: number) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-gray-900">{ag.locale}</p>
                    <p className="text-sm text-gray-500">
                      <Calendar size={14} className="inline mr-1" />
                      {new Date(ag.data).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <p className="font-medium">€{parseFloat(ag.compensoNetto).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Numero Ricevuta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numero Ricevuta
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  min="1"
                  value={form.numeroRicevuta}
                  onChange={(e) => setForm({...form, numeroRicevuta: e.target.value})}
                  className="w-24 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-center font-mono text-lg"
                  required
                />
                <span className="text-gray-500">/ {data.prestazione.anno}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Se fai ricevute anche per altri committenti, inserisci il tuo numero progressivo corretto
              </p>
            </div>

            {/* Rimborso Spese */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rimborso Spese (opzionale, max €{data.opzioni.maxRimborsoSpese.toFixed(2)})
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Euro size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    max={data.opzioni.maxRimborsoSpese}
                    value={form.rimborsoSpese}
                    onChange={(e) => setForm({...form, rimborsoSpese: e.target.value})}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                  <Upload size={18} />
                  <span className="text-sm">{rimborsoFile ? rimborsoFile.name : 'Allega'}</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setRimborsoFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
              {rimborsoFile && (
                <button
                  type="button"
                  onClick={() => setRimborsoFile(null)}
                  className="mt-2 text-sm text-red-600 hover:underline flex items-center gap-1"
                >
                  <X size={14} /> Rimuovi allegato
                </button>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Allegare scontrini/ricevute (benzina, pedaggi, ecc.)
              </p>
            </div>

            {/* Tipo Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modalità Pagamento
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  form.tipoPagamento === 'STANDARD' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="tipoPagamento"
                    value="STANDARD"
                    checked={form.tipoPagamento === 'STANDARD'}
                    onChange={(e) => setForm({...form, tipoPagamento: e.target.value})}
                    className="sr-only"
                  />
                  <span className="font-medium text-gray-900">Standard</span>
                  <span className="text-sm text-gray-500">Pagamento entro 15 giorni</span>
                  <span className="text-sm font-medium text-green-600 mt-1">Importo pieno</span>
                </label>
                
                <label className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  !data.opzioni.puoAnticipare ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  form.tipoPagamento === 'ANTICIPATO' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="tipoPagamento"
                    value="ANTICIPATO"
                    checked={form.tipoPagamento === 'ANTICIPATO'}
                    onChange={(e) => setForm({...form, tipoPagamento: e.target.value})}
                    disabled={!data.opzioni.puoAnticipare}
                    className="sr-only"
                  />
                  <span className="font-medium text-gray-900">Anticipato</span>
                  <span className="text-sm text-gray-500">Pagamento immediato</span>
                  <span className="text-sm font-medium text-orange-600 mt-1">-€5.00 spese gestione</span>
                </label>
              </div>
              {!data.opzioni.puoAnticipare && (
                <p className="mt-2 text-xs text-gray-500">
                  Pagamento anticipato disponibile solo per importi ≤ €200
                </p>
              )}
            </div>

            {/* Preview Importi */}
            {preview && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Compenso Lordo</span>
                  <span>€{preview.compensoLordo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ritenuta 20%</span>
                  <span className="text-red-600">-€{preview.ritenuta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Compenso Netto</span>
                  <span>€{preview.compensoNetto}</span>
                </div>
                {parseFloat(preview.rimborsoSpese) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rimborso Spese</span>
                    <span className="text-green-600">+€{preview.rimborsoSpese}</span>
                  </div>
                )}
                {parseFloat(preview.scontoAnticipo) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Spese gestione anticipata</span>
                    <span className="text-orange-600">-€{preview.scontoAnticipo}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-semibold text-base">
                  <span className="text-gray-900">Totale da Ricevere</span>
                  <span className="text-green-600">€{preview.totalePagato}</span>
                </div>
              </div>
            )}

            {/* Dichiarazione */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700">
              <p className="italic">
                Il sottoscritto dichiara che, nell'anno solare in corso, alla data odierna,
                non ha conseguito redditi derivanti dall'esercizio di attività di lavoro autonomo 
                occasionale pari o eccedenti i 10.000 euro e si obbliga a comunicare l'eventuale 
                superamento del limite annuo.
              </p>
            </div>

            {/* Firma */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Firma Digitale
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nome"
                  value={form.firmaNome}
                  onChange={(e) => setForm({...form, firmaNome: e.target.value})}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Cognome"
                  value={form.firmaCognome}
                  onChange={(e) => setForm({...form, firmaCognome: e.target.value})}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Inserisci nome e cognome esattamente come registrati
              </p>
            </div>

            {/* Accettazione */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.accettazione}
                onChange={(e) => setForm({...form, accettazione: e.target.checked})}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <span className="text-sm text-gray-700">
                Confermo la correttezza dei dati inseriti e accetto le condizioni di pagamento.
                Dichiaro che i dati forniti sono veritieri e acconsento al trattamento degli stessi
                ai sensi del GDPR.
              </span>
            </label>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !form.accettazione}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Elaborazione...' : '✍️ Firma e Conferma'}
            </button>

            <p className="text-xs text-center text-gray-500">
              Link valido fino al {new Date(data.scadenzaLink).toLocaleDateString('it-IT')}
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>OKL SRL - Via Monte Pasubio, 36010 Zanè (VI)</p>
          <p>P.IVA 04433920248</p>
        </div>
      </div>
    </div>
  )
}
