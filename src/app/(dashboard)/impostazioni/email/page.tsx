// src/app/(dashboard)/impostazioni/email/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Mail, Save, AlertTriangle, CheckCircle, Send, Bell, UserPlus, FileText, CreditCard } from 'lucide-react'

interface EmailSettings {
  emailAbilitata: boolean
  invioEmailCommittente: boolean
  invioEmailArtista: boolean
  invioEmailFirma: boolean
  invioEmailSollecito: boolean
  invioEmailPagamento: boolean
  invioEmailInvitoArtista: boolean
  giorniSollecito: number
}

function Toggle({ 
  enabled, 
  onChange, 
  disabled = false 
}: { 
  enabled: boolean
  onChange: (value: boolean) => void
  disabled?: boolean 
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function ImpostazioniEmailPage() {
  const [settings, setSettings] = useState<EmailSettings>({
    emailAbilitata: false,
    invioEmailCommittente: false,
    invioEmailArtista: false,
    invioEmailFirma: false,
    invioEmailSollecito: false,
    invioEmailPagamento: false,
    invioEmailInvitoArtista: false,
    giorniSollecito: 3,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/impostazioni/email')
      .then(r => r.json())
      .then(data => {
        setSettings(data)
      })
      .catch(err => console.error('Errore caricamento:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    
    try {
      const res = await fetch('/api/impostazioni/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Errore salvataggio:', err)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof EmailSettings, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }))
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Impostazioni Email</h1>
          <p className="text-gray-500">Configura l&apos;invio automatico delle notifiche</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saved ? <CheckCircle size={20} /> : <Save size={20} />}
          {saving ? 'Salvataggio...' : saved ? 'Salvato!' : 'Salva'}
        </button>
      </div>

      {/* Warning se email disabilitata */}
      {!settings.emailAbilitata && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="text-yellow-600" size={24} />
          <div>
            <p className="font-medium text-yellow-800">Sistema email disabilitato</p>
            <p className="text-sm text-yellow-600">Abilita il toggle principale per attivare l&apos;invio delle email</p>
          </div>
        </div>
      )}

      {/* Toggle principale */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              settings.emailAbilitata ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Mail className={settings.emailAbilitata ? 'text-green-600' : 'text-gray-400'} size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sistema Email</h2>
              <p className="text-sm text-gray-500">
                {settings.emailAbilitata 
                  ? 'Le email verranno inviate secondo le impostazioni sottostanti'
                  : 'Nessuna email verrà inviata finché non abiliti questo toggle'
                }
              </p>
            </div>
          </div>
          <Toggle 
            enabled={settings.emailAbilitata} 
            onChange={(v) => updateSetting('emailAbilitata', v)} 
          />
        </div>
      </div>

      {/* Sezioni email */}
      <div className="space-y-6">
        
        {/* Notifiche Agibilità */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b">
            <FileText className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold">Notifiche Agibilità</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Email inviate quando viene caricato lo ZIP di conferma INPS
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Email al Committente</p>
                <p className="text-sm text-gray-500">Invia certificato PDF agibilità al committente</p>
              </div>
              <Toggle 
                enabled={settings.invioEmailCommittente} 
                onChange={(v) => updateSetting('invioEmailCommittente', v)}
                disabled={!settings.emailAbilitata}
              />
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Email all&apos;Artista</p>
                <p className="text-sm text-gray-500">Invia notifica con compenso netto (PDF solo se artista singolo)</p>
              </div>
              <Toggle 
                enabled={settings.invioEmailArtista} 
                onChange={(v) => updateSetting('invioEmailArtista', v)}
                disabled={!settings.emailAbilitata}
              />
            </div>
          </div>
        </div>
        
        {/* Notifiche Pagamenti */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b">
            <CreditCard className="text-green-600" size={20} />
            <h3 className="text-lg font-semibold">Notifiche Pagamenti</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Email relative al processo di firma e pagamento ricevute
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Email Richiesta Firma</p>
                <p className="text-sm text-gray-500">Invia link per firmare la ricevuta prestazione</p>
              </div>
              <Toggle 
                enabled={settings.invioEmailFirma} 
                onChange={(v) => updateSetting('invioEmailFirma', v)}
                disabled={!settings.emailAbilitata}
              />
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Email Sollecito Firma</p>
                <p className="text-sm text-gray-500">Sollecito automatico se non firma entro X giorni</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.giorniSollecito}
                    onChange={(e) => updateSetting('giorniSollecito', parseInt(e.target.value) || 3)}
                    min={1}
                    max={30}
                    disabled={!settings.emailAbilitata || !settings.invioEmailSollecito}
                    className="w-16 px-2 py-1 border rounded text-center disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-500">giorni</span>
                </div>
                <Toggle 
                  enabled={settings.invioEmailSollecito} 
                  onChange={(v) => updateSetting('invioEmailSollecito', v)}
                  disabled={!settings.emailAbilitata}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Email Conferma Pagamento</p>
                <p className="text-sm text-gray-500">Notifica all&apos;artista quando il pagamento è effettuato</p>
              </div>
              <Toggle 
                enabled={settings.invioEmailPagamento} 
                onChange={(v) => updateSetting('invioEmailPagamento', v)}
                disabled={!settings.emailAbilitata}
              />
            </div>
          </div>
        </div>
        
        {/* Notifiche Artisti */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b">
            <UserPlus className="text-purple-600" size={20} />
            <h3 className="text-lg font-semibold">Notifiche Artisti</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Email di onboarding per nuovi artisti
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Email Invito Iscrizione</p>
                <p className="text-sm text-gray-500">Invia invito a completare i dati quando si crea un nuovo artista</p>
              </div>
              <Toggle 
                enabled={settings.invioEmailInvitoArtista} 
                onChange={(v) => updateSetting('invioEmailInvitoArtista', v)}
                disabled={!settings.emailAbilitata}
              />
            </div>
          </div>
        </div>

        {/* Note configurazione SMTP */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Bell className="text-gray-400 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-gray-700">Configurazione SMTP</p>
              <p className="text-sm text-gray-500 mt-1">
                Assicurati di aver configurato i parametri SMTP nella sezione 
                <a href="/impostazioni/azienda" className="text-blue-600 hover:underline mx-1">Azienda</a>
                (host, porta, utente, password) prima di abilitare l&apos;invio email.
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
