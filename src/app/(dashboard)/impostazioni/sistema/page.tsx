// src/app/(dashboard)/impostazioni/sistema/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Database, Download, Trash2, RefreshCw, AlertTriangle, 
  CheckCircle, Clock, HardDrive, Activity, FileText
} from 'lucide-react'

interface SystemInfo {
  version: string
  database: {
    size: string
    tables: number
    status: 'ok' | 'warning' | 'error'
  }
  lastBackup: string | null
  uptime: string
}

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error'
  message: string
  details?: string
}

export default function ImpostazioniSistemaPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [backing, setBacking] = useState(false)
  const [cleaning, setCleaning] = useState(false)

  useEffect(() => {
    loadSystemInfo()
  }, [])

  const loadSystemInfo = async () => {
    try {
      // Simulated - in produzione chiamerebbe API reali
      setSystemInfo({
        version: '3.6.0',
        database: {
          size: '45.2 MB',
          tables: 18,
          status: 'ok'
        },
        lastBackup: new Date(Date.now() - 86400000).toISOString(),
        uptime: '5d 12h 34m'
      })
      
      setLogs([
        { id: '1', timestamp: new Date().toISOString(), level: 'info', message: 'Sistema avviato correttamente' },
        { id: '2', timestamp: new Date(Date.now() - 3600000).toISOString(), level: 'info', message: 'Backup automatico completato' },
        { id: '3', timestamp: new Date(Date.now() - 7200000).toISOString(), level: 'warning', message: '3 email non inviate - retry in corso' },
        { id: '4', timestamp: new Date(Date.now() - 86400000).toISOString(), level: 'info', message: 'Pulizia prenotazioni scadute: 12 record' },
      ])
    } catch (err) {
      console.error('Errore caricamento info sistema:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBackup = async () => {
    setBacking(true)
    try {
      const res = await fetch('/api/sistema/backup', { method: 'POST' })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `recorp_backup_${new Date().toISOString().split('T')[0]}.sql`
        a.click()
        window.URL.revokeObjectURL(url)
        alert('✅ Backup completato e scaricato!')
      } else {
        alert('❌ Errore durante il backup')
      }
    } catch (err) {
      alert('❌ Errore durante il backup')
    } finally {
      setBacking(false)
    }
  }

  const handleCleanup = async () => {
    if (!confirm('Vuoi procedere con la pulizia del database?\n\nVerranno eliminati:\n- Prenotazioni scadute\n- Log vecchi di 30 giorni\n- Token scaduti')) {
      return
    }
    
    setCleaning(true)
    try {
      const res = await fetch('/api/sistema/cleanup', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        alert(`✅ Pulizia completata!\n\nRecord eliminati: ${data.deleted}`)
        loadSystemInfo()
      } else {
        alert('❌ Errore durante la pulizia')
      }
    } catch (err) {
      alert('❌ Errore durante la pulizia')
    } finally {
      setCleaning(false)
    }
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const levelColors = {
    info: 'text-blue-600 bg-blue-50',
    warning: 'text-yellow-600 bg-yellow-50',
    error: 'text-red-600 bg-red-50',
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sistema</h1>
        <p className="text-gray-500">Backup, manutenzione e monitoraggio</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Activity className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Versione</p>
              <p className="font-semibold">v{systemInfo?.version}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              systemInfo?.database.status === 'ok' ? 'bg-green-50' : 'bg-yellow-50'
            }`}>
              <Database className={
                systemInfo?.database.status === 'ok' ? 'text-green-600' : 'text-yellow-600'
              } size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Database</p>
              <p className="font-semibold">{systemInfo?.database.size}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Clock className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Uptime</p>
              <p className="font-semibold">{systemInfo?.uptime}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
              <HardDrive className="text-gray-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tabelle</p>
              <p className="font-semibold">{systemInfo?.database.tables}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Azioni */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Azioni</h2>
          
          <div className="space-y-3">
            <button
              onClick={handleBackup}
              disabled={backing}
              className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                {backing ? (
                  <RefreshCw className="text-blue-600 animate-spin" size={20} />
                ) : (
                  <Download className="text-blue-600" size={20} />
                )}
              </div>
              <div className="text-left">
                <p className="font-medium">Backup Database</p>
                <p className="text-sm text-gray-500">Scarica una copia completa del database</p>
              </div>
            </button>
            
            <button
              onClick={handleCleanup}
              disabled={cleaning}
              className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                {cleaning ? (
                  <RefreshCw className="text-yellow-600 animate-spin" size={20} />
                ) : (
                  <Trash2 className="text-yellow-600" size={20} />
                )}
              </div>
              <div className="text-left">
                <p className="font-medium">Pulizia Database</p>
                <p className="text-sm text-gray-500">Rimuovi dati obsoleti e prenotazioni scadute</p>
              </div>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <RefreshCw className="text-green-600" size={20} />
              </div>
              <div className="text-left">
                <p className="font-medium">Ricarica Sistema</p>
                <p className="text-sm text-gray-500">Aggiorna cache e ricarica l&apos;applicazione</p>
              </div>
            </button>
          </div>
          
          {systemInfo?.lastBackup && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                Ultimo backup: {formatDate(systemInfo.lastBackup)}
              </p>
            </div>
          )}
        </div>

        {/* Log Attività */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText size={20} />
              Log Attività
            </h2>
            <button 
              onClick={loadSystemInfo}
              className="text-sm text-blue-600 hover:underline"
            >
              Aggiorna
            </button>
          </div>
          
          <div className="space-y-2">
            {logs.map((log) => (
              <div 
                key={log.id}
                className={`p-3 rounded-lg ${levelColors[log.level]}`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium">{log.message}</p>
                  <span className="text-xs opacity-75 ml-2 whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </span>
                </div>
                {log.details && (
                  <p className="text-xs mt-1 opacity-75">{log.details}</p>
                )}
              </div>
            ))}
          </div>
          
          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto mb-2 opacity-50" size={32} />
              <p>Nessun log recente</p>
            </div>
          )}
        </div>
      </div>

      {/* Warning */}
      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-red-800">Zona Pericolosa</p>
            <p className="text-sm text-red-700 mt-1">
              Le operazioni di pulizia e reset sono irreversibili. Assicurati di avere un backup 
              recente prima di procedere con qualsiasi operazione di manutenzione.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
