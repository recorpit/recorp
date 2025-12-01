// src/app/(dashboard)/impostazioni/inps/page.tsx
'use client'

import { useState } from 'react'
import { Save, FileText, Building2, Key, CheckCircle, AlertTriangle, Info } from 'lucide-react'

export default function ImpostazioniINPSPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const [form, setForm] = useState({
    // Dati Azienda per XML
    matricolaINPS: '',
    codiceFiscaleAzienda: '',
    ragioneSocialeAzienda: '',
    
    // Sede Legale
    comuneSede: '',
    provinciaSede: '',
    capSede: '',
    indirizzoSede: '',
    
    // Rappresentante Legale
    cfRappresentante: '',
    cognomeRappresentante: '',
    nomeRappresentante: '',
    
    // Credenziali INPS (opzionali)
    usernameINPS: '',
    passwordINPS: '',
    pinINPS: '',
    
    // Opzioni XML
    tipoInvioDefault: 'I', // I = Inserimento, V = Variazione, C = Cancellazione
    categoriaDefault: 'L', // L = Lavoratori Spettacolo
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const res = await fetch('/api/impostazioni/inps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      
      if (!res.ok) throw new Error('Errore salvataggio')
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert('Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurazione INPS</h1>
          <p className="text-gray-500">Parametri per generazione XML agibilità</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saved ? <CheckCircle size={20} /> : <Save size={20} />}
          {saving ? 'Salvataggio...' : saved ? 'Salvato!' : 'Salva'}
        </button>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-blue-800">Configurazione XML INPS</p>
            <p className="text-sm text-blue-700 mt-1">
              Questi dati vengono utilizzati per generare i file XML da caricare sul portale INPS 
              per le comunicazioni di agibilità. Assicurati che i dati corrispondano a quelli 
              registrati presso l&apos;INPS.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Dati Azienda */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 size={20} />
            Dati Azienda
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matricola INPS *
              </label>
              <input
                type="text"
                name="matricolaINPS"
                value={form.matricolaINPS}
                onChange={handleChange}
                placeholder="0000000000"
                maxLength={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">10 cifre - Matricola aziendale INPS</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Codice Fiscale Azienda *
              </label>
              <input
                type="text"
                name="codiceFiscaleAzienda"
                value={form.codiceFiscaleAzienda}
                onChange={handleChange}
                placeholder="04433920248"
                maxLength={16}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono uppercase"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ragione Sociale *
              </label>
              <input
                type="text"
                name="ragioneSocialeAzienda"
                value={form.ragioneSocialeAzienda}
                onChange={handleChange}
                placeholder="OKL SRL"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg uppercase"
              />
            </div>
          </div>
        </div>

        {/* Sede Legale */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sede Legale</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
              <input
                type="text"
                name="indirizzoSede"
                value={form.indirizzoSede}
                onChange={handleChange}
                placeholder="Via Monte Pasubio"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
              <input
                type="text"
                name="capSede"
                value={form.capSede}
                onChange={handleChange}
                placeholder="36010"
                maxLength={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
              <input
                type="text"
                name="provinciaSede"
                value={form.provinciaSede}
                onChange={handleChange}
                placeholder="VI"
                maxLength={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg uppercase"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Comune</label>
              <input
                type="text"
                name="comuneSede"
                value={form.comuneSede}
                onChange={handleChange}
                placeholder="ZANE'"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg uppercase"
              />
            </div>
          </div>
        </div>

        {/* Rappresentante Legale */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rappresentante Legale</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cognome</label>
              <input
                type="text"
                name="cognomeRappresentante"
                value={form.cognomeRappresentante}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                name="nomeRappresentante"
                value={form.nomeRappresentante}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale</label>
              <input
                type="text"
                name="cfRappresentante"
                value={form.cfRappresentante}
                onChange={handleChange}
                maxLength={16}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Credenziali INPS */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Key size={20} />
              Credenziali INPS (Opzionali)
            </h2>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              Per uso futuro
            </span>
          </div>
          
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-yellow-700">
                Le credenziali INPS sono opzionali e servono per funzionalità future di invio automatico.
                Al momento l&apos;XML va caricato manualmente sul portale INPS.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                name="usernameINPS"
                value={form.usernameINPS}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="passwordINPS"
                value={form.passwordINPS}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
              <input
                type="password"
                name="pinINPS"
                value={form.pinINPS}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Opzioni XML */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} />
            Opzioni XML Default
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Invio Default
              </label>
              <select
                name="tipoInvioDefault"
                value={form.tipoInvioDefault}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="I">I - Inserimento (nuovo)</option>
                <option value="V">V - Variazione</option>
                <option value="C">C - Cancellazione</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria Lavoratori
              </label>
              <select
                name="categoriaDefault"
                value={form.categoriaDefault}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="L">L - Lavoratori dello Spettacolo</option>
                <option value="S">S - Sportivi Professionisti</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
