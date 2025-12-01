// src/app/(dashboard)/note-credito/[id]/page.tsx
// Pagina Dettaglio Nota di Credito
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Download, Send, Check, X, AlertCircle,
  Building2, FileText, ReceiptText, Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface Riga {
  numeroLinea: number
  descrizione: string
  quantita: number
  prezzoUnitario: number
  prezzoTotale: number
  aliquotaIva: number
}

interface NotaDiCredito {
  id: string
  numero: string
  anno: number
  progressivo: number
  dataEmissione: string
  tipo: string
  motivo: string
  imponibile: number
  iva: number
  totale: number
  aliquotaIva: number
  splitPayment: boolean
  righe: Riga[]
  stato: string
  note: string | null
  fatturaRiferimento: {
    id: string
    numero: string
    dataEmissione: string
    totale: number
    committente: {
      id: string
      ragioneSociale: string
      partitaIva: string
      codiceFiscale: string
    }
  }
}

const STATI_COLORI: Record<string, { bg: string; text: string; label: string }> = {
  'EMESSA': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Emessa' },
  'INVIATA': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Inviata' },
  'ANNULLATA': { bg: 'bg-red-100', text: 'text-red-700', label: 'Annullata' },
}

export default function DettaglioNotaCreditoPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [nota, setNota] = useState<NotaDiCredito | null>(null)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  useEffect(() => {
    async function loadNota() {
      try {
        const res = await fetch(`/api/note-credito/${id}`)
        if (!res.ok) throw new Error('Nota di credito non trovata')
        setNota(await res.json())
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadNota()
  }, [id])
  
  // Cambia stato
  const handleCambiaStato = async (nuovoStato: string) => {
    try {
      setActionLoading(nuovoStato)
      
      const res = await fetch(`/api/note-credito/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato: nuovoStato }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore aggiornamento')
      }
      
      const resNota = await fetch(`/api/note-credito/${id}`)
      if (resNota.ok) {
        setNota(await resNota.json())
      }
      
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading('')
    }
  }
  
  // Elimina
  const handleDelete = async () => {
    try {
      setActionLoading('delete')
      
      const res = await fetch(`/api/note-credito/${id}`, { method: 'DELETE' })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore eliminazione')
      }
      
      router.push('/fatture')
      
    } catch (err: any) {
      alert(err.message)
      setShowDeleteConfirm(false)
    } finally {
      setActionLoading('')
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }
  
  if (error || !nota) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="mb-4 text-red-500" size={48} />
        <p className="text-gray-600 mb-4">{error || 'Nota di credito non trovata'}</p>
        <Link href="/note-credito" className="text-blue-600 hover:text-blue-700">
          Torna alla lista
        </Link>
      </div>
    )
  }
  
  const statoInfo = STATI_COLORI[nota.stato] || STATI_COLORI['EMESSA']
  const righe = nota.righe || []
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/fatture" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{nota.numero}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statoInfo.bg} ${statoInfo.text}`}>
                {statoInfo.label}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                nota.tipo === 'TOTALE' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {nota.tipo === 'TOTALE' ? 'Storno Totale' : 'Storno Parziale'}
              </span>
            </div>
            <p className="text-gray-500">
              Emessa il {format(new Date(nota.dataEmissione), 'd MMMM yyyy', { locale: it })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {nota.stato === 'EMESSA' && (
            <>
              <button
                onClick={() => handleCambiaStato('INVIATA')}
                disabled={actionLoading === 'INVIATA'}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Send size={18} />
                Segna Inviata
              </button>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                <X size={18} />
                Elimina
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Contenuto */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonna principale */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Fattura di riferimento */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-gray-400" />
              Fattura di Riferimento
            </h2>
            
            <Link
              href={`/fatture/${nota.fatturaRiferimento.id}`}
              className="block p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-600">{nota.fatturaRiferimento.numero}</span>
                <span className="font-medium text-gray-900">
                  €{Number(nota.fatturaRiferimento.totale).toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Emessa il {format(new Date(nota.fatturaRiferimento.dataEmissione), 'd MMMM yyyy', { locale: it })}
              </p>
            </Link>
          </div>
          
          {/* Committente */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-gray-400" />
              Committente
            </h2>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-bold text-xl">
                {nota.fatturaRiferimento.committente.ragioneSociale.charAt(0)}
              </div>
              <div>
                <Link 
                  href={`/committenti/${nota.fatturaRiferimento.committente.id}`}
                  className="text-lg font-medium text-blue-600 hover:text-blue-700"
                >
                  {nota.fatturaRiferimento.committente.ragioneSociale}
                </Link>
                <p className="text-gray-500">P.IVA: {nota.fatturaRiferimento.committente.partitaIva}</p>
              </div>
            </div>
          </div>
          
          {/* Motivo */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Motivo</h2>
            <p className="text-gray-700">{nota.motivo}</p>
          </div>
          
          {/* Righe */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dettaglio Righe</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 text-sm font-medium text-gray-500">#</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">Descrizione</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 text-right">Importo</th>
                  </tr>
                </thead>
                <tbody>
                  {righe.map((riga) => (
                    <tr key={riga.numeroLinea} className="border-b last:border-0">
                      <td className="py-3 text-gray-500">{riga.numeroLinea}</td>
                      <td className="py-3">{riga.descrizione}</td>
                      <td className="py-3 text-right font-medium text-red-600">
                        -€{Number(riga.prezzoTotale).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Colonna laterale */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Totali */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Totali</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Imponibile:</span>
                <span className="font-medium text-red-600">-€{Number(nota.imponibile).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IVA {nota.aliquotaIva}%:</span>
                <span className="font-medium text-red-600">-€{Number(nota.iva).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-3 border-t">
                <span>Totale:</span>
                <span className="text-red-600">-€{Number(nota.totale).toFixed(2)}</span>
              </div>
              
              {nota.splitPayment && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Split Payment</strong>
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Rimborso: €{Number(nota.imponibile).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Info</h2>
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Tipo</p>
                <p className="font-medium">
                  {nota.tipo === 'TOTALE' ? 'Storno Totale' : 'Storno Parziale'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Data Emissione</p>
                <p className="font-medium">
                  {format(new Date(nota.dataEmissione), 'd MMMM yyyy', { locale: it })}
                </p>
              </div>
              {nota.note && (
                <div>
                  <p className="text-gray-500">Note</p>
                  <p className="font-medium">{nota.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal Elimina */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Eliminare la nota di credito?
            </h3>
            <p className="text-gray-600 mb-4">
              La nota di credito {nota.numero} sarà eliminata definitivamente.
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
                disabled={actionLoading === 'delete'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === 'delete' ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}