// src/app/(dashboard)/impostazioni/pagamenti/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Save, RefreshCw, Mail, Euro, Clock, 
  Users, Settings, AlertCircle, CheckCircle,
  Loader2, Plus, Trash2, Edit2
} from 'lucide-react'

export default function ImpostazioniPagamentiPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Impostazioni generali
  const [impostazioni, setImpostazioni] = useState({
    pivaGiorniTrigger: 30,
    pivaImportoMinimo: 100,
    pivaApplicaRitenuta4: true,
    trasfertaItaliaDefault: 0,
    emailConsulente: '',
    emailConsulenteCC: '',
  })
  
  // Config gettoni full time
  const [configGettoni, setConfigGettoni] = useState<any[]>([])
  const [artistiFullTime, setArtistiFullTime] = useState<any[]>([])
  const [modalGettone, setModalGettone] = useState<any>(null)
  const [formGettone, setFormGettone] = useState({
    artistaId: '',
    gettoneBase: 50,
    stipendioFissoMensile: 0,
    gettoniPerTipoEvento: {} as Record<string, number>,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Carica impostazioni
      const resImp = await fetch('/api/impostazioni/pagamenti')
      if (resImp.ok) {
        const data = await resImp.json()
        setImpostazioni({
          pivaGiorniTrigger: data.pivaGiorniTrigger || 30,
          pivaImportoMinimo: Number(data.pivaImportoMinimo) || 100,
          pivaApplicaRitenuta4: data.pivaApplicaRitenuta4 ?? true,
          trasfertaItaliaDefault: Number(data.trasfertaItaliaDefault) || 0,
          emailConsulente: data.emailConsulente || '',
          emailConsulenteCC: data.emailConsulenteCC || '',
        })
      }
      
      // Carica config gettoni
      const resGett = await fetch('/api/pagamenti/config-gettoni')
      if (resGett.ok) {
        const data = await resGett.json()
        setConfigGettoni(data)
      }
      
      // Carica artisti full time per select
      const resArt = await fetch('/api/artisti?tipoContratto=FULL_TIME')
      if (resArt.ok) {
        const data = await resArt.json()
        setArtistiFullTime(data.artisti || [])
      }
    } catch (error) {
      console.error('Errore caricamento:', error)
    } finally {
      setLoading(false)
    }
  }

  async function salvaImpostazioni() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/impostazioni/pagamenti', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(impostazioni)
      })
      
      if (!res.ok) throw new Error('Errore salvataggio')
      
      setMessage({ type: 'success', text: 'Impostazioni salvate!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Errore nel salvataggio' })
    } finally {
      setSaving(false)
    }
  }

  async function salvaConfigGettone() {
    if (!formGettone.artistaId) {
      alert('Seleziona un dipendente')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/pagamenti/config-gettoni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formGettone)
      })
      
      if (!res.ok) throw new Error('Errore salvataggio')
      
      setModalGettone(null)
      setFormGettone({
        artistaId: '',
        gettoneBase: 50,
        stipendioFissoMensile: 0,
        gettoniPerTipoEvento: {},
      })
      loadData()
    } catch (error) {
      alert('Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }

  function apriModificaGettone(config: any) {
    setFormGettone({
      artistaId: config.artistaId,
      gettoneBase: Number(config.gettoneBase),
      stipendioFissoMensile: Number(config.stipendioFissoMensile),
      gettoniPerTipoEvento: config.gettoniPerTipoEvento || {},
    })
    setModalGettone(config)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Impostazioni Pagamenti</h1>
          <p className="text-gray-500">Configura P.IVA, Full Time e parametri generali</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Sezione P.IVA */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Euro size={20} className="text-purple-600" />
          Impostazioni P.IVA
        </h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giorni per Trigger Automatico
            </label>
            <input
              type="number"
              value={impostazioni.pivaGiorniTrigger}
              onChange={(e) => setImpostazioni({...impostazioni, pivaGiorniTrigger: parseInt(e.target.value) || 30})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Dopo quanti giorni richiedere automaticamente la fattura
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Importo Minimo Trigger (€)
            </label>
            <input
              type="number"
              value={impostazioni.pivaImportoMinimo}
              onChange={(e) => setImpostazioni({...impostazioni, pivaImportoMinimo: parseFloat(e.target.value) || 100})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Richiedi fattura al raggiungimento di questo importo
            </p>
          </div>
          
          <div className="col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={impostazioni.pivaApplicaRitenuta4}
                onChange={(e) => setImpostazioni({...impostazioni, pivaApplicaRitenuta4: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">
                Applica ritenuta d'acconto 4% di default
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Sezione Trasferte */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={20} className="text-blue-600" />
          Rimborsi e Trasferte
        </h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trasferta Italia Default (€)
          </label>
          <input
            type="number"
            value={impostazioni.trasfertaItaliaDefault}
            onChange={(e) => setImpostazioni({...impostazioni, trasfertaItaliaDefault: parseFloat(e.target.value) || 0})}
            className="w-full max-w-xs px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Importo forfettario default per trasferta Italia
          </p>
        </div>
      </div>

      {/* Sezione Email Consulente */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail size={20} className="text-green-600" />
          Email Consulente del Lavoro
        </h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Consulente *
            </label>
            <input
              type="email"
              value={impostazioni.emailConsulente}
              onChange={(e) => setImpostazioni({...impostazioni, emailConsulente: e.target.value})}
              placeholder="consulente@studio.it"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email CC (opzionale)
            </label>
            <input
              type="email"
              value={impostazioni.emailConsulenteCC}
              onChange={(e) => setImpostazioni({...impostazioni, emailConsulenteCC: e.target.value})}
              placeholder="copia@azienda.it"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Pulsante Salva */}
      <div className="flex justify-end mb-8">
        <button
          onClick={salvaImpostazioni}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Salva Impostazioni
        </button>
      </div>

      {/* Sezione Gettoni Full Time */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-green-600" />
            Configurazione Gettoni Full Time
          </h2>
          <button
            onClick={() => {
              setFormGettone({
                artistaId: '',
                gettoneBase: 50,
                stipendioFissoMensile: 0,
                gettoniPerTipoEvento: {},
              })
              setModalGettone({})
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus size={18} />
            Aggiungi
          </button>
        </div>
        
        {configGettoni.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Nessuna configurazione. Aggiungi i gettoni per i dipendenti full time.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-700">Dipendente</th>
                <th className="p-3 text-right text-sm font-medium text-gray-700">Stipendio Fisso</th>
                <th className="p-3 text-right text-sm font-medium text-gray-700">Gettone Base</th>
                <th className="p-3 text-center text-sm font-medium text-gray-700">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {configGettoni.map((config) => (
                <tr key={config.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <p className="font-medium">{config.artista.cognome} {config.artista.nome}</p>
                  </td>
                  <td className="p-3 text-right">
                    €{Number(config.stipendioFissoMensile).toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    €{Number(config.gettoneBase).toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => apriModificaGettone(config)}
                      className="p-2 hover:bg-gray-100 rounded text-blue-600"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Config Gettone */}
      {modalGettone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {modalGettone.id ? 'Modifica' : 'Nuova'} Configurazione Gettone
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dipendente *
                </label>
                <select
                  value={formGettone.artistaId}
                  onChange={(e) => setFormGettone({...formGettone, artistaId: e.target.value})}
                  disabled={!!modalGettone.id}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                >
                  <option value="">Seleziona...</option>
                  {artistiFullTime
                    .filter(a => !configGettoni.some(c => c.artistaId === a.id) || formGettone.artistaId === a.id)
                    .map((artista) => (
                      <option key={artista.id} value={artista.id}>
                        {artista.cognome} {artista.nome}
                      </option>
                    ))
                  }
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stipendio Fisso Mensile (€)
                  </label>
                  <input
                    type="number"
                    value={formGettone.stipendioFissoMensile}
                    onChange={(e) => setFormGettone({...formGettone, stipendioFissoMensile: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gettone Base (€)
                  </label>
                  <input
                    type="number"
                    value={formGettone.gettoneBase}
                    onChange={(e) => setFormGettone({...formGettone, gettoneBase: parseFloat(e.target.value) || 50})}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Gettone agenzia per ogni presenza
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Esempio:</strong> Se il compenso netto agibilità è €300 e il gettone è €50, 
                  verranno calcolati €250 per la busta paga (300 - 50).
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalGettone(null)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={salvaConfigGettone}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
