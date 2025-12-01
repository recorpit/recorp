// src/app/(dashboard)/report/classifiche/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trophy, Users, Building2, MapPin, TrendingUp, Download } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const COLORS = ['#fbbf24', '#9ca3af', '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4']

type ClassificheData = {
  topArtisti: { id: string; nome: string; prestazioni: number; fatturato: number }[]
  topCommittenti: { id: string; nome: string; eventi: number; fatturato: number }[]
  topLocali: { id: string; nome: string; citta: string; eventi: number }[]
}

export default function ClassifichePage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ClassificheData | null>(null)
  const [tab, setTab] = useState<'artisti' | 'committenti' | 'locali'>('artisti')
  const [anno, setAnno] = useState(new Date().getFullYear())
  
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const da = new Date(anno, 0, 1).toISOString().split('T')[0]
        const a = new Date(anno, 11, 31).toISOString().split('T')[0]
        const res = await fetch(`/api/report/kpi?da=${da}&a=${a}`)
        if (res.ok) {
          const kpi = await res.json()
          setData(kpi.classifiche)
        }
      } catch (error) {
        console.error('Errore:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [anno])
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)
  }
  
  const exportCSV = () => {
    if (!data) return
    
    let csv = ''
    let filename = ''
    
    if (tab === 'artisti') {
      csv = 'Posizione,Nome,Prestazioni,Fatturato\n'
      data.topArtisti.forEach((a, i) => {
        csv += `${i + 1},"${a.nome}",${a.prestazioni},${a.fatturato}\n`
      })
      filename = `classifica_artisti_${anno}.csv`
    } else if (tab === 'committenti') {
      csv = 'Posizione,Ragione Sociale,Eventi,Fatturato\n'
      data.topCommittenti.forEach((c, i) => {
        csv += `${i + 1},"${c.nome}",${c.eventi},${c.fatturato}\n`
      })
      filename = `classifica_committenti_${anno}.csv`
    } else {
      csv = 'Posizione,Nome,Città,Eventi\n'
      data.topLocali.forEach((l, i) => {
        csv += `${i + 1},"${l.nome}","${l.citta}",${l.eventi}\n`
      })
      filename = `classifica_locali_${anno}.csv`
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/report" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Classifiche</h1>
            <p className="text-gray-500">Top performer del periodo</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAnno(anno - 1)}
              className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              ◀
            </button>
            <span className="text-sm font-medium">{anno}</span>
            <button
              onClick={() => setAnno(anno + 1)}
              className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
              disabled={anno >= new Date().getFullYear()}
            >
              ▶
            </button>
          </div>
          
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={18} />
            Esporta CSV
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('artisti')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            tab === 'artisti' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={20} />
          Artisti
        </button>
        <button
          onClick={() => setTab('committenti')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            tab === 'committenti' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 size={20} />
          Committenti
        </button>
        <button
          onClick={() => setTab('locali')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            tab === 'locali' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapPin size={20} />
          Locali
        </button>
      </div>
      
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grafico */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              {tab === 'artisti' ? 'Top 10 Artisti per Fatturato' :
               tab === 'committenti' ? 'Top 10 Committenti per Fatturato' :
               'Top 10 Locali per Eventi'}
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={
                  tab === 'artisti' ? data.topArtisti.map(a => ({ name: a.nome.substring(0, 15), value: a.fatturato })) :
                  tab === 'committenti' ? data.topCommittenti.map(c => ({ name: c.nome.substring(0, 15), value: c.fatturato })) :
                  data.topLocali.map(l => ({ name: l.nome.substring(0, 15), value: l.eventi }))
                }
                layout="vertical"
                margin={{ left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={v => tab === 'locali' ? v : `€${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip 
                  formatter={(value: number) => tab === 'locali' ? `${value} eventi` : formatCurrency(value)}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {(tab === 'artisti' ? data.topArtisti : tab === 'committenti' ? data.topCommittenti : data.topLocali)
                    .map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Tabella */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Classifica Completa</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">#</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Nome</th>
                    {tab === 'artisti' && (
                      <>
                        <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600">Prestazioni</th>
                        <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600">Fatturato</th>
                      </>
                    )}
                    {tab === 'committenti' && (
                      <>
                        <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600">Eventi</th>
                        <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600">Fatturato</th>
                      </>
                    )}
                    {tab === 'locali' && (
                      <>
                        <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Città</th>
                        <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600">Eventi</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tab === 'artisti' && data.topArtisti.map((artista, idx) => (
                    <tr key={artista.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                          idx === 1 ? 'bg-gray-300 text-gray-700' :
                          idx === 2 ? 'bg-orange-400 text-orange-900' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Link href={`/artisti/${artista.id}`} className="text-blue-600 hover:underline">
                          {artista.nome}
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-right font-medium">{artista.prestazioni}</td>
                      <td className="py-3 px-2 text-right font-semibold text-green-600">{formatCurrency(artista.fatturato)}</td>
                    </tr>
                  ))}
                  
                  {tab === 'committenti' && data.topCommittenti.map((committente, idx) => (
                    <tr key={committente.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                          idx === 1 ? 'bg-gray-300 text-gray-700' :
                          idx === 2 ? 'bg-orange-400 text-orange-900' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Link href={`/committenti/${committente.id}`} className="text-blue-600 hover:underline">
                          {committente.nome}
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-right font-medium">{committente.eventi}</td>
                      <td className="py-3 px-2 text-right font-semibold text-green-600">{formatCurrency(committente.fatturato)}</td>
                    </tr>
                  ))}
                  
                  {tab === 'locali' && data.topLocali.map((locale, idx) => (
                    <tr key={locale.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                          idx === 1 ? 'bg-gray-300 text-gray-700' :
                          idx === 2 ? 'bg-orange-400 text-orange-900' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Link href={`/locali/${locale.id}`} className="text-blue-600 hover:underline">
                          {locale.nome}
                        </Link>
                      </td>
                      <td className="py-3 px-2">{locale.citta}</td>
                      <td className="py-3 px-2 text-right font-semibold">{locale.eventi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
