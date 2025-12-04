// src/app/(dashboard)/magazzino/movimenti/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Package,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  Wrench,
  AlertTriangle,
  Calendar,
  Filter
} from 'lucide-react'

const TIPO_MOVIMENTO_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  'CARICO': { label: 'Carico', icon: ArrowUpCircle, color: 'text-green-600' },
  'SCARICO': { label: 'Scarico', icon: ArrowDownCircle, color: 'text-red-600' },
  'RESO': { label: 'Reso', icon: RotateCcw, color: 'text-blue-600' },
  'MANUTENZIONE': { label: 'Manutenzione', icon: Wrench, color: 'text-orange-600' },
  'PERDITA': { label: 'Perdita', icon: AlertTriangle, color: 'text-red-600' },
  'TRASFERIMENTO': { label: 'Trasferimento', icon: Package, color: 'text-purple-600' },
  'USCITA_EVENTO': { label: 'Uscita Evento', icon: ArrowDownCircle, color: 'text-blue-600' },
  'RIENTRO_EVENTO': { label: 'Rientro Evento', icon: ArrowUpCircle, color: 'text-green-600' },
}

export default function MovimentiPage() {
  const [movimenti, setMovimenti] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroData, setFiltroData] = useState('')
  
  useEffect(() => {
    loadMovimenti()
  }, [])
  
  const loadMovimenti = async () => {
    try {
      setLoading(true)
      // TODO: Implementare API movimenti
      // Per ora mostriamo una lista vuota
      setMovimenti([])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimenti Magazzino</h1>
          <p className="text-gray-500">Storico di tutti i movimenti</p>
        </div>
      </div>
      
      {/* Filtri */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cerca per materiale, riferimento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <select 
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti i tipi</option>
            {Object.entries(TIPO_MOVIMENTO_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Tabella movimenti */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {movimenti.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="mx-auto mb-2 text-gray-300" size={48} />
            <p>Nessun movimento registrato</p>
            <p className="text-sm mt-2">I movimenti verranno registrati automaticamente quando i materiali vengono assegnati agli eventi</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Materiale</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantità</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Riferimento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {movimenti.map((mov: any) => {
                const tipoInfo = TIPO_MOVIMENTO_LABELS[mov.tipo] || { 
                  label: mov.tipo, 
                  icon: Package, 
                  color: 'text-gray-600' 
                }
                const Icon = tipoInfo.icon
                
                return (
                  <tr key={mov.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(mov.data)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 ${tipoInfo.color}`}>
                        <Icon size={16} />
                        {tipoInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{mov.materiale?.nome}</p>
                      <p className="text-sm text-gray-500">{mov.materiale?.codice}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-medium ${
                        mov.tipo.includes('CARICO') || mov.tipo.includes('RESO') || mov.tipo.includes('RIENTRO')
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {mov.tipo.includes('CARICO') || mov.tipo.includes('RESO') || mov.tipo.includes('RIENTRO') ? '+' : '-'}
                        {mov.quantita}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {mov.evento ? (
                        <Link 
                          href={`/produzione/eventi/${mov.evento.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {mov.evento.codice}
                        </Link>
                      ) : (
                        mov.riferimento || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {mov.note || '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
