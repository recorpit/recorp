// src/app/(dashboard)/committenti/[id]/page.tsx
// Pagina Dettaglio Committente con Statistiche e Modalità Fatturazione
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Save, Trash2, Building2, AlertTriangle, Bell,
  Users, Euro, FileText, TrendingUp, TrendingDown, Minus,
  Receipt
} from 'lucide-react'

interface Statistiche {
  annoCorrente: number
  annoPrecedente: number
  statistiche: {
    artisti: { corrente: number; precedente: number; variazione: number | null }
    fatturato: { corrente: number; precedente: number; variazione: number | null }
    quoteFisse: { corrente: number; precedente: number; variazione: number | null }
    agibilita: { corrente: number; precedente: number; variazione: number | null }
  }
  inSospeso: { fatture: number; importo: number }
}

interface ScadenzaPagamento {
  id: string
  nome: string
  codice: string
  giorni: number
  fineMese: boolean
}

export default function DettaglioCommittentePage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const [statistiche, setStatistiche] = useState<Statistiche | null>(null)
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
    quotaAgenzia: '0',
    giorniPagamento: '30',
    iban: '',
    aRischio: false,
    note: '',
    noteInterne: '',
    // Nuovi campi fatturazione
    modalitaFatturazione: 'DETTAGLIO_SPESE_INCLUSE',
    scadenzaPagamentoId: '',
    isPubblicaAmministrazione: false,
    splitPayment: false,
  })
  
  // Carica dati
  useEffect(() => {
    async function loadData() {
      try {
        // Carica committente
        const resCommittente = await fetch(`/api/committenti/${id}`)
        if (!resCommittente.ok) throw new Error('Committente non trovato')
        const data = await resCommittente.json()
        
        setForm({
          ragioneSociale: data.ragioneSociale || '',
          partitaIva: data.partitaIva || '',
          codiceFiscale: data.codiceFiscale || '',
          email: data.email || '',
          pec: data.pec || '',
          telefono: data.telefono || '',
          codiceSDI: data.codiceSDI || '0000000',
          indirizzoFatturazione: data.indirizzoFatturazione || '',
          capFatturazione: data.capFatturazione || '',
          cittaFatturazione: data.cittaFatturazione || '',
          provinciaFatturazione: data.provinciaFatturazione || '',
          quotaAgenzia: data.quotaAgenzia?.toString() || '0',
          giorniPagamento: data.giorniPagamento?.toString() || '30',
          iban: data.iban || '',
          aRischio: data.aRischio || false,
          note: data.note || '',
          noteInterne: data.noteInterne || '',
          modalitaFatturazione: data.modalitaFatturazione || 'DETTAGLIO_SPESE_INCLUSE',
          scadenzaPagamentoId: data.scadenzaPagamentoId || '',
          isPubblicaAmministrazione: data.isPubblicaAmministrazione || false,
          splitPayment: data.splitPayment || false,
        })
        
        // Carica statistiche
        const resStats = await fetch(`/api/committenti/${id}/statistiche`)
        if (resStats.ok) {
          setStatistiche(await resStats.json())
        }
        
        // Carica scadenze disponibili
        const resScadenze = await fetch('/api/impostazioni/scadenze?attive=true')
        if (resScadenze.ok) {
          setScadenze(await resScadenze.json())
        }
        
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [id])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    
    try {
      const res = await fetch(`/api/committenti/${id}`, {
        method: 'PUT',
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
      
      router.push('/committenti')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/committenti/${id}`, { method: 'DELETE' })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nell\'eliminazione')
      }
      
      router.push('/committenti')
    } catch (err: any) {
      setError(err.message)
      setShowDeleteConfirm(false)
    }
  }
  
  // Componente variazione percentuale
  const VariazionePercentuale = ({ variazione }: { variazione: number | null }) => {
    if (variazione === null) return <span className="text-gray-400 text-sm">N/A</span>
    
    if (variazione > 0) {
      return (
        <span className="flex items-center gap-1 text-green-600 text-sm">
          <TrendingUp size={14} />
          +{variazione}%
        </span>
      )
    } else if (variazione < 0) {
      return (
        <span className="flex items-center gap-1 text-red-600 text-sm">
          <TrendingDown size={14} />
          {variazione}%
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1 text-gray-500 text-sm">
        <Minus size={14} />
        0%
      </span>
    )
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
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
            <h1 className="text-2xl font-bold text-gray-900">Modifica Committente</h1>
            <p className="text-gray-500">{form.ragioneSociale}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {form.aRischio && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">
              <AlertTriangle size={16} />
              A Rischio
            </span>
          )}
          {form.isPubblicaAmministrazione && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              PA
            </span>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={20} />
            Elimina
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Statistiche Anno */}
      {statistiche && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Statistiche {statistiche.annoCorrente}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Artisti */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="text-purple-600" size={20} />
                </div>
                <VariazionePercentuale variazione={statistiche.statistiche.artisti.variazione} />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {statistiche.statistiche.artisti.corrente}
              </p>
              <p className="text-sm text-gray-500">Artisti in agibilità</p>
              <p className="text-xs text-gray-400 mt-1">
                vs {statistiche.annoPrecedente}: {statistiche.statistiche.artisti.precedente}
              </p>
            </div>
            
            {/* Fatturato */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Euro className="text-green-600" size={20} />
                </div>
                <VariazionePercentuale variazione={statistiche.statistiche.fatturato.variazione} />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                €{statistiche.statistiche.fatturato.corrente.toLocaleString('it-IT')}
              </p>
              <p className="text-sm text-gray-500">Fatturato incassato</p>
              <p className="text-xs text-gray-400 mt-1">
                vs {statistiche.annoPrecedente}: €{statistiche.statistiche.fatturato.precedente.toLocaleString('it-IT')}
              </p>
            </div>
            
            {/* Quote Fisse */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Receipt className="text-blue-600" size={20} />
                </div>
                <VariazionePercentuale variazione={statistiche.statistiche.quoteFisse.variazione} />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                €{statistiche.statistiche.quoteFisse.corrente.toLocaleString('it-IT')}
              </p>
              <p className="text-sm text-gray-500">Quote fisse totali</p>
              <p className="text-xs text-gray-400 mt-1">
                vs {statistiche.annoPrecedente}: €{statistiche.statistiche.quoteFisse.precedente.toLocaleString('it-IT')}
              </p>
            </div>
            
            {/* In Sospeso */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FileText className="text-yellow-600" size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                €{statistiche.inSospeso.importo.toLocaleString('it-IT')}
              </p>
              <p className="text-sm text-gray-500">Da incassare</p>
              <p className="text-xs text-gray-400 mt-1">
                {statistiche.inSospeso.fatture} fatture in sospeso
              </p>
            </div>
          </div>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Codice SDI</label>
              <input
                type="text"
                name="codiceSDI"
                value={form.codiceSDI}
                onChange={handleChange}
                maxLength={7}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
              />
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
                    onChange={handleChange}
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
        
        {/* Condizioni Economiche */}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
              />
            </div>
          </div>
          
          {/* Flag Rischio */}
          <div className={`mt-6 p-4 rounded-lg border ${form.aRischio ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="aRischio"
                checked={form.aRischio}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <div>
                <span className={`font-medium ${form.aRischio ? 'text-red-800' : 'text-yellow-800'}`}>
                  {form.aRischio ? '⚠️ Committente a rischio' : 'Committente a rischio'}
                </span>
                <p className={`text-sm ${form.aRischio ? 'text-red-700' : 'text-yellow-700'}`}>
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
            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </div>
      </form>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Conferma eliminazione
            </h3>
            <p className="text-gray-600 mb-4">
              Sei sicuro di voler eliminare <strong>{form.ragioneSociale}</strong>?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
