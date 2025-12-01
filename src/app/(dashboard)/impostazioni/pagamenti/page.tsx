// src/app/(dashboard)/impostazioni/pagamenti/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Save, CreditCard, Building, Clock, CheckCircle, Plus, Trash2 } from 'lucide-react'

interface ContoBancario {
  id: string
  nome: string
  iban: string
  banca: string
  principale: boolean
}

export default function ImpostazioniPagamentiPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const [conti, setConti] = useState<ContoBancario[]>([
    { id: '1', nome: 'Conto Principale', iban: '', banca: '', principale: true }
  ])
  
  const [impostazioni, setImpostazioni] = useState({
    giorniPagamentoDefault: '30',
    giorniPagamentoAnticipato: '7',
    scontoAnticipo: '5.00',
    causaleBoificoDefault: 'Compenso prestazione artistica - {codice}',
  })

  const handleAddConto = () => {
    setConti([...conti, {
      id: Date.now().toString(),
      nome: '',
      iban: '',
      banca: '',
      principale: false
    }])
  }

  const handleRemoveConto = (id: string) => {
    if (conti.length === 1) return
    setConti(conti.filter(c => c.id !== id))
  }

  const handleContoChange = (id: string, field: keyof ContoBancario, value: string | boolean) => {
    setConti(conti.map(c => {
      if (c.id === id) {
        return { ...c, [field]: value }
      }
      // Se stiamo impostando principale, rimuoviamolo dagli altri
      if (field === 'principale' && value === true) {
        return { ...c, principale: false }
      }
      return c
    }))
    setSaved(false)
  }

  const handleImpostazioneChange = (field: string, value: string) => {
    setImpostazioni(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const res = await fetch('/api/impostazioni/pagamenti', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conti, impostazioni }),
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
          <h1 className="text-2xl font-bold text-gray-900">Pagamenti</h1>
          <p className="text-gray-500">Configura conti bancari e modalità di pagamento</p>
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

      <div className="space-y-6">
        {/* Conti Bancari */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building size={20} />
              Conti Bancari
            </h2>
            <button
              onClick={handleAddConto}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Plus size={16} />
              Aggiungi Conto
            </button>
          </div>
          
          <div className="space-y-4">
            {conti.map((conto, index) => (
              <div key={conto.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={conto.nome}
                      onChange={(e) => handleContoChange(conto.id, 'nome', e.target.value)}
                      placeholder="Nome conto"
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium"
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={conto.principale}
                        onChange={(e) => handleContoChange(conto.id, 'principale', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      Principale
                    </label>
                  </div>
                  {conti.length > 1 && (
                    <button
                      onClick={() => handleRemoveConto(conto.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">IBAN</label>
                    <input
                      type="text"
                      value={conto.iban}
                      onChange={(e) => handleContoChange(conto.id, 'iban', e.target.value.toUpperCase())}
                      placeholder="IT00X0000000000000000000000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Banca</label>
                    <input
                      type="text"
                      value={conto.banca}
                      onChange={(e) => handleContoChange(conto.id, 'banca', e.target.value)}
                      placeholder="Nome banca"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Termini Pagamento */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={20} />
            Termini di Pagamento
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giorni pagamento standard
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={impostazioni.giorniPagamentoDefault}
                  onChange={(e) => handleImpostazioneChange('giorniPagamentoDefault', e.target.value)}
                  min="1"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span className="text-gray-500">giorni dalla firma</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giorni pagamento anticipato
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={impostazioni.giorniPagamentoAnticipato}
                  onChange={(e) => handleImpostazioneChange('giorniPagamentoAnticipato', e.target.value)}
                  min="1"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span className="text-gray-500">giorni dalla firma</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sconto per pagamento anticipato
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">€</span>
                <input
                  type="number"
                  step="0.01"
                  value={impostazioni.scontoAnticipo}
                  onChange={(e) => handleImpostazioneChange('scontoAnticipo', e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Importo sottratto se l&apos;artista sceglie pagamento anticipato</p>
            </div>
          </div>
        </div>

        {/* Causale Bonifico */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard size={20} />
            Causale Bonifico
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template causale
            </label>
            <input
              type="text"
              value={impostazioni.causaleBoificoDefault}
              onChange={(e) => handleImpostazioneChange('causaleBoificoDefault', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Variabili: {'{codice}'} = codice ricevuta, {'{artista}'} = nome artista, {'{mese}'} = mese prestazioni
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
