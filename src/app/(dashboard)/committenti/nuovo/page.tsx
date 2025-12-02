// src/app/(dashboard)/committenti/nuovo/page.tsx
// Creazione nuovo committente
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Save, Building2, AlertTriangle,
  Users, Euro, FileText, Receipt
} from 'lucide-react'

interface ScadenzaPagamento {
  id: string
  nome: string
  codice: string
  giorni: number
  fineMese: boolean
}

export default function NuovoCommittentePage() {
  const router = useRouter()
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [scadenze, setScadenze] = useState<ScadenzaPagamento[]>([])
  
  const [form, setForm] = useState({
    ragioneSociale: '',
    partitaIva: '',
    codiceFiscale: '',
    email: '',
    pec: '',
    telefono: '',
    codiceSDI: '0000000',
    indirizzoFatturazione: '',
    capFatturazione: '',
    cittaFatturazione: '',
    provinciaFatturazione: '',
    quotaAgenzia: '20',
    giorniPagamento: '30',
    iban: '',
    aRischio: false,
    note: '',
    noteInterne: '',
    // Campi fatturazione
    modalitaFatturazione: 'DETTAGLIO_SPESE_INCLUSE',
    timingFatturazione: 'SETTIMANALE',
    tipoPagamento: 'BONIFICO_VISTA',
    scadenzaPagamentoId: '',
    isPubblicaAmministrazione: false,
    splitPayment: false,
  })
  
  // Carica scadenze disponibili
  useEffect(() => {
    async function loadScadenze() {
      try {
        const res = await fetch('/api/impostazioni/scadenze?attive=true')
        if (res.ok) {
          setScadenze(await res.json())
        }
      } catch (err) {
        console.error('Errore caricamento scadenze:', err)
      }
    }
    loadScadenze()
  }, [])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }
  
  // Gestione cambio PA - attiva automaticamente Split Payment
  const handlePAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isPa = e.target.checked
    setForm(prev => ({
      ...prev,
      isPubblicaAmministrazione: isPa,
      splitPayment: isPa ? true : prev.splitPayment,
      // Reset codice SDI per PA (deve essere 6 caratteri)
      codiceSDI: isPa && prev.codiceSDI === '0000000' ? '' : prev.codiceSDI,
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    
    // Validazioni
    if (!form.ragioneSociale.trim()) {
      setError('Ragione sociale obbligatoria')
      setSaving(false)
      return
    }
    
    if (form.isPubblicaAmministrazione && (!form.codiceSDI || form.codiceSDI.length < 6)) {
      setError('Codice Univoco IPA obbligatorio per PA (6 caratteri)')
      setSaving(false)
      return
    }
    
    try {
      const res = await fetch('/api/committenti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          quotaAgenzia: parseFloat(form.quotaAgenzia) || 0,
          giorniPagamento: parseInt(form.giorniPagamento) || 30,
          scadenzaPagamentoId: form.scadenzaPagamentoId || null,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nel salvataggio')
      }
      
      const committente = await res.json()
      router.push(`/committenti/${committente.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/committenti"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuovo Committente</h1>
            <p className="text-gray-500">Inserisci i dati del nuovo committente</p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Dati Anagrafici */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dati Anagrafici</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ragione Sociale *</label>
              <input
                type="text"
                name="ragioneSociale"
                value={form.ragioneSociale}
                onChange={handleChange}
                required
                placeholder="Es: AZIENDA ESEMPIO SRL"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partita IVA</label>
              <input
                type="text"
                name="partitaIva"
                value={form.partitaIva}
                onChange={handleChange}
                maxLength={11}
                placeholder="12345678901"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale</label>
              <input
                type="text"
                name="codiceFiscale"
                value={form.codiceFiscale}
                onChange={handleChange}
                maxLength={16}
                placeholder="12345678901 o RSSMRA80A01H501Z"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="info@azienda.it"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PEC</label>
              <input
                type="email"
                name="pec"
                value={form.pec}
                onChange={handleChange}
                placeholder="azienda@pec.it"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input
                type="tel"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="+39 02 12345678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.isPubblicaAmministrazione ? 'Codice Univoco IPA *' : 'Codice SDI'}
              </label>
              <input
                type="text"
                name="codiceSDI"
                value={form.codiceSDI}
                onChange={handleChange}
                maxLength={7}
                placeholder={form.isPubblicaAmministrazione ? 'XXXXXX' : '0000000'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
              />
              <p className="text-xs text-gray-500 mt-1">
                {form.isPubblicaAmministrazione 
                  ? '6 caratteri - Codice Univoco Ufficio da IndicePA'
                  : '7 caratteri - Usa 0000000 se il cliente riceve via PEC'
                }
              </p>
            </div>
          </div>
        </div>
        
        {/* Indirizzo Fatturazione */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Indirizzo Fatturazione</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
              <input
                type="text"
                name="indirizzoFatturazione"
                value={form.indirizzoFatturazione}
                onChange={handleChange}
                placeholder="Via Roma, 1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
              <input
                type="text"
                name="cittaFatturazione"
                value={form.cittaFatturazione}
                onChange={handleChange}
                placeholder="Milano"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
                <input
                  type="text"
                  name="capFatturazione"
                  value={form.capFatturazione}
                  onChange={handleChange}
                  maxLength={5}
                  placeholder="20100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <input
                  type="text"
                  name="provinciaFatturazione"
                  value={form.provinciaFatturazione}
                  onChange={handleChange}
                  maxLength={2}
                  placeholder="MI"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Impostazioni Fatturazione */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Impostazioni Fatturazione</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Modalità Fatturazione */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Modalità Righe Fattura (default)
              </label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="modalitaFatturazione"
                    value="DETTAGLIO_SPESE_INCLUSE"
                    checked={form.modalitaFatturazione === 'DETTAGLIO_SPESE_INCLUSE'}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Dettaglio artisti con spese incluse</span>
                    <p className="text-sm text-gray-500">
                      Una riga per artista con compenso + quota gestione
                    </p>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="modalitaFatturazione"
                    value="DETTAGLIO_SPESE_SEPARATE"
                    checked={form.modalitaFatturazione === 'DETTAGLIO_SPESE_SEPARATE'}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Dettaglio artisti + spese separate</span>
                    <p className="text-sm text-gray-500">
                      Una riga per artista + riga spese gestione
                    </p>
                  </div>
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                ℹ️ La "Voce unica generica" è sempre disponibile in fase di creazione fattura
              </p>
            </div>
            
            {/* Scadenza e PA */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scadenza Pagamento Default
                </label>
                <select
                  name="scadenzaPagamentoId"
                  value={form.scadenzaPagamentoId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Seleziona --</option>
                  {scadenze.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nome} ({s.giorni}gg{s.fineMese ? ' FM' : ''})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metodo di Pagamento Default
                </label>
                <select
                  name="tipoPagamento"
                  value={form.tipoPagamento}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="BONIFICO_VISTA">Bonifico vista fattura</option>
                  <option value="BONIFICO_30GG">Bonifico 30gg</option>
                  <option value="BONIFICO_60GG">Bonifico 60gg</option>
                  <option value="RIBA_30GG">RiBa 30gg</option>
                  <option value="RIBA_60GG">RiBa 60gg</option>
                  <option value="CARTA_CREDITO">Carta di credito</option>
                  <option value="CONTANTI">Contanti</option>
                  <option value="ASSEGNO">Assegno</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timing Fatturazione
                </label>
                <select
                  name="timingFatturazione"
                  value={form.timingFatturazione}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="GIORNALIERA">Giornaliera (1 fattura per agibilità)</option>
                  <option value="SETTIMANALE">Settimanale (default)</option>
                  <option value="MENSILE">Mensile (ultimo giorno del mese)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quota Agenzia per Artista (€)
                </label>
                <input
                  type="number"
                  name="quotaAgenzia"
                  value={form.quotaAgenzia}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Flag PA e Split Payment */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPubblicaAmministrazione"
                    checked={form.isPubblicaAmministrazione}
                    onChange={handlePAChange}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Pubblica Amministrazione</span>
                    <p className="text-sm text-gray-500">Usa formato FPA12 per XML</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="splitPayment"
                    checked={form.splitPayment}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Split Payment</span>
                    <p className="text-sm text-gray-500">IVA versata direttamente all'erario</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Altre Condizioni */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Altre Condizioni</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
              <input
                type="text"
                name="iban"
                value={form.iban}
                onChange={handleChange}
                placeholder="IT60X0542811101000000123456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giorni Pagamento</label>
              <input
                type="number"
                name="giorniPagamento"
                value={form.giorniPagamento}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Usato se non è impostata una scadenza predefinita
              </p>
            </div>
          </div>
          
          {/* Flag Rischio */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="aRischio"
                checked={form.aRischio}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <div>
                <span className="font-medium text-yellow-800">Committente a rischio</span>
                <p className="text-sm text-yellow-700">
                  Se attivato, i pagamenti artista saranno impostati su "Dopo Incasso"
                </p>
              </div>
            </label>
          </div>
        </div>
        
        {/* Note */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Note</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                rows={3}
                placeholder="Note visibili in fattura..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note Interne</label>
              <textarea
                name="noteInterne"
                value={form.noteInterne}
                onChange={handleChange}
                rows={3}
                placeholder="Note riservate ad uso interno..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/committenti"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annulla
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Salvataggio...' : 'Crea Committente'}
          </button>
        </div>
      </form>
    </div>
  )
}