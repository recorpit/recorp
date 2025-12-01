// src/app/(dashboard)/impostazioni/azienda/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Save, Building2, Mail, Phone, MapPin, CreditCard, CheckCircle, FileText } from 'lucide-react'

interface DatiAzienda {
  nome: string
  ragioneSociale: string
  partitaIva: string
  codiceFiscale: string
  indirizzo: string
  cap: string
  citta: string
  provincia: string
  telefono: string
  email: string
  pec: string
  codiceSDI: string
  iban: string
  banca: string
  // REA
  reaUfficio: string
  reaNumero: string
  reaCapitaleSociale: string
  reaSocioUnico: string
  reaStatoLiquidazione: string
  // Intermediario (opzionale)
  intermediarioPiva: string
  intermediarioCf: string
  intermediarioDenominazione: string
  // SMTP
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPass: string
  smtpFromName: string
  smtpFromEmail: string
}

export default function ImpostazioniAziendaPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState<DatiAzienda>({
    nome: '',
    ragioneSociale: '',
    partitaIva: '',
    codiceFiscale: '',
    indirizzo: '',
    cap: '',
    citta: '',
    provincia: '',
    telefono: '',
    email: '',
    pec: '',
    codiceSDI: '0000000',
    iban: '',
    banca: '',
    // REA
    reaUfficio: '',
    reaNumero: '',
    reaCapitaleSociale: '10000.00',
    reaSocioUnico: 'SM',
    reaStatoLiquidazione: 'LN',
    // Intermediario
    intermediarioPiva: '',
    intermediarioCf: '',
    intermediarioDenominazione: '',
    // SMTP
    smtpHost: '',
    smtpPort: '465',
    smtpUser: '',
    smtpPass: '',
    smtpFromName: '',
    smtpFromEmail: '',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/impostazioni/azienda')
      if (res.ok) {
        const data = await res.json()
        setForm(prev => ({ ...prev, ...data }))
      }
    } catch (err) {
      console.error('Errore caricamento:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    
    try {
      const res = await fetch('/api/impostazioni/azienda', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nel salvataggio')
      }
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const testEmail = async () => {
    try {
      const res = await fetch('/api/impostazioni/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: form.email || form.smtpFromEmail,
        }),
      })
      
      const data = await res.json()
      if (res.ok) {
        alert('✅ Email di test inviata con successo!')
      } else {
        alert(`❌ Errore: ${data.error}`)
      }
    } catch (err) {
      alert('❌ Errore invio email di test')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dati Azienda</h1>
          <p className="text-gray-500">Configura i dati della tua azienda per la fatturazione elettronica</p>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saved ? <CheckCircle size={20} /> : <Save size={20} />}
          {saving ? 'Salvataggio...' : saved ? 'Salvato!' : 'Salva'}
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dati Anagrafici */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 size={20} />
            Dati Anagrafici
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Breve
              </label>
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="OKL"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ragione Sociale *
              </label>
              <input
                type="text"
                name="ragioneSociale"
                value={form.ragioneSociale}
                onChange={handleChange}
                required
                placeholder="OKL SRL"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partita IVA *
              </label>
              <input
                type="text"
                name="partitaIva"
                value={form.partitaIva}
                onChange={handleChange}
                required
                placeholder="04433920248"
                maxLength={11}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Codice Fiscale *
              </label>
              <input
                type="text"
                name="codiceFiscale"
                value={form.codiceFiscale}
                onChange={handleChange}
                required
                placeholder="04433920248"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Indirizzo */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={20} />
            Indirizzo Sede Legale
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Indirizzo *
              </label>
              <input
                type="text"
                name="indirizzo"
                value={form.indirizzo}
                onChange={handleChange}
                required
                placeholder="Via Monte Pasubio, 10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CAP *
              </label>
              <input
                type="text"
                name="cap"
                value={form.cap}
                onChange={handleChange}
                required
                placeholder="36010"
                maxLength={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Città *
              </label>
              <input
                type="text"
                name="citta"
                value={form.citta}
                onChange={handleChange}
                required
                placeholder="Zanè"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provincia *
              </label>
              <input
                type="text"
                name="provincia"
                value={form.provincia}
                onChange={handleChange}
                required
                placeholder="VI"
                maxLength={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
          </div>
        </div>
        
        {/* Contatti */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone size={20} />
            Contatti
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefono
              </label>
              <input
                type="tel"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="+39 0445 xxxxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="info@okl.it"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PEC
              </label>
              <input
                type="email"
                name="pec"
                value={form.pec}
                onChange={handleChange}
                placeholder="okl@pec.it"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Codice SDI
              </label>
              <input
                type="text"
                name="codiceSDI"
                value={form.codiceSDI}
                onChange={handleChange}
                placeholder="0000000"
                maxLength={7}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
          </div>
        </div>
        
        {/* Dati Bancari */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard size={20} />
            Dati Bancari
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IBAN *
              </label>
              <input
                type="text"
                name="iban"
                value={form.iban}
                onChange={handleChange}
                required
                placeholder="IT00X0000000000000000000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banca
              </label>
              <input
                type="text"
                name="banca"
                value={form.banca}
                onChange={handleChange}
                placeholder="Nome Banca"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Iscrizione REA */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} />
            Iscrizione REA (per Fattura Elettronica)
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Dati obbligatori per la generazione dell'XML FatturaPA
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ufficio REA (Provincia) *
              </label>
              <input
                type="text"
                name="reaUfficio"
                value={form.reaUfficio}
                onChange={handleChange}
                placeholder="VI"
                maxLength={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
              />
              <p className="text-xs text-gray-400 mt-1">Sigla provincia della Camera di Commercio</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numero REA *
              </label>
              <input
                type="text"
                name="reaNumero"
                value={form.reaNumero}
                onChange={handleChange}
                placeholder="123456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Numero iscrizione al Registro Imprese</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capitale Sociale (€)
              </label>
              <input
                type="text"
                name="reaCapitaleSociale"
                value={form.reaCapitaleSociale}
                onChange={handleChange}
                placeholder="10000.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Socio Unico
              </label>
              <select
                name="reaSocioUnico"
                value={form.reaSocioUnico}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="SM">SM - Più soci</option>
                <option value="SU">SU - Socio unico</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stato Liquidazione
              </label>
              <select
                name="reaStatoLiquidazione"
                value={form.reaStatoLiquidazione}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="LN">LN - Non in liquidazione</option>
                <option value="LS">LS - In liquidazione</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Intermediario (Opzionale) */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 size={20} />
            Intermediario / Commercialista (Opzionale)
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Compila solo se la fattura viene trasmessa tramite un intermediario
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                P.IVA Intermediario
              </label>
              <input
                type="text"
                name="intermediarioPiva"
                value={form.intermediarioPiva}
                onChange={handleChange}
                placeholder="12345678901"
                maxLength={11}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                C.F. Intermediario
              </label>
              <input
                type="text"
                name="intermediarioCf"
                value={form.intermediarioCf}
                onChange={handleChange}
                placeholder="12345678901"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Denominazione
              </label>
              <input
                type="text"
                name="intermediarioDenominazione"
                value={form.intermediarioDenominazione}
                onChange={handleChange}
                placeholder="Studio Rossi"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Configurazione Email SMTP */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail size={20} />
            Configurazione Email SMTP
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Host SMTP
              </label>
              <input
                type="text"
                name="smtpHost"
                value={form.smtpHost}
                onChange={handleChange}
                placeholder="authsmtp.securemail.pro"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Porta
              </label>
              <input
                type="text"
                name="smtpPort"
                value={form.smtpPort}
                onChange={handleChange}
                placeholder="465"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username SMTP
              </label>
              <input
                type="text"
                name="smtpUser"
                value={form.smtpUser}
                onChange={handleChange}
                placeholder="commerciale@recorp.it"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password SMTP
              </label>
              <input
                type="password"
                name="smtpPass"
                value={form.smtpPass}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Mittente
              </label>
              <input
                type="text"
                name="smtpFromName"
                value={form.smtpFromName}
                onChange={handleChange}
                placeholder="OKL SRL"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Mittente
              </label>
              <input
                type="email"
                name="smtpFromEmail"
                value={form.smtpFromEmail}
                onChange={handleChange}
                placeholder="commerciale@recorp.it"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <button
              type="button"
              onClick={testEmail}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              📧 Invia Email di Test
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}