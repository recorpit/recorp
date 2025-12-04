'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface LocaleImport {
  id?: string
  nomeDb?: string
  nomeImport: string
  nome?: string
  indirizzo: string
  citta: string
  provincia: string
  cap: string
  telefono: string
  codiceBelfiore: string
  vecchiDati?: {
    indirizzo: string
    citta: string
    codiceBelfiore: string
  }
  nuoviDati?: {
    indirizzo: string
    citta: string
    provincia: string
    cap: string
    telefono: string
    codiceBelfiore: string
  }
}

interface ImportReport {
  totaleLocaliDb: number
  totaleLocaliImport: number
  daAggiornare: LocaleImport[]
  nuovi: LocaleImport[]
  nonTrovati: string[]
  giaCompleti: string[]
}

interface ImportResult {
  success: boolean
  risultati: {
    aggiornati: number
    inseriti: number
    errori: string[]
    dettagli: any[]
  }
  message: string
}

export function ImportLocaliSection() {
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [report, setReport] = useState<ImportReport | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inserisciNuovi, setInserisciNuovi] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('aggiornare')

  const fetchPreview = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const res = await fetch('/api/import/locali/belfiore')
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Errore nel caricamento')
      }
      
      setReport(data.report)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  const executeImport = async () => {
    setImporting(true)
    setError(null)
    
    try {
      const res = await fetch('/api/import/locali/belfiore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inserisciNuovi }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante import')
      }
      
      setResult(data)
      await fetchPreview()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setImporting(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <CardTitle>Import Locali con Codice Belfiore</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Aggiorna i dati dei locali (indirizzo, città, CAP) e aggiungi il codice Belfiore per le agibilità INPS
              </p>
            </div>
          </div>
          <Button onClick={fetchPreview} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Caricamento...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Anteprima Import
              </span>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        
        {result && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            result.success 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
          }`}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">{result.message}</p>
              {result.risultati.errori.length > 0 && (
                <ul className="mt-2 text-sm">
                  {result.risultati.errori.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        
        {report && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-slate-700">{report.totaleLocaliDb}</div>
                <div className="text-sm text-slate-500">Locali nel DB</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-700">{report.totaleLocaliImport}</div>
                <div className="text-sm text-blue-500">Locali da importare</div>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-amber-700">{report.daAggiornare.length}</div>
                <div className="text-sm text-amber-500">Da aggiornare</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-700">{report.giaCompleti.length}</div>
                <div className="text-sm text-green-500">Già completi</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-700">{report.nuovi.length}</div>
                <div className="text-sm text-purple-500">Nuovi</div>
              </div>
            </div>
            
            {/* Sezioni espandibili */}
            <div className="space-y-2">
              {/* Da Aggiornare */}
              {report.daAggiornare.length > 0 && (
                <div className="border rounded-lg">
                  <button
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50"
                    onClick={() => toggleSection('aggiornare')}
                  >
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        {report.daAggiornare.length}
                      </Badge>
                      <span className="font-medium">Locali da aggiornare</span>
                    </div>
                    <svg className={`h-5 w-5 transition-transform ${expandedSection === 'aggiornare' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSection === 'aggiornare' && (
                    <div className="border-t max-h-[300px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome DB</TableHead>
                            <TableHead>Vecchio Indirizzo</TableHead>
                            <TableHead className="text-center">→</TableHead>
                            <TableHead>Nuovo Indirizzo</TableHead>
                            <TableHead>Belfiore</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.daAggiornare.map((locale, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{locale.nomeDb}</TableCell>
                              <TableCell className="text-slate-500">
                                {locale.vecchiDati?.indirizzo || '-'}
                                {locale.vecchiDati?.citta && `, ${locale.vecchiDati.citta}`}
                              </TableCell>
                              <TableCell className="text-center text-amber-500">→</TableCell>
                              <TableCell className="text-green-700">
                                {locale.nuoviDati?.indirizzo}
                                {locale.nuoviDati?.citta && `, ${locale.nuoviDati.citta}`}
                                {locale.nuoviDati?.provincia && ` (${locale.nuoviDati.provincia})`}
                              </TableCell>
                              <TableCell>
                                <Badge variant="default" className="font-mono">
                                  {locale.nuoviDati?.codiceBelfiore}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
              
              {/* Già Completi */}
              {report.giaCompleti.length > 0 && (
                <div className="border rounded-lg">
                  <button
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50"
                    onClick={() => toggleSection('completi')}
                  >
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        {report.giaCompleti.length}
                      </Badge>
                      <span className="font-medium">Locali già completi (nessuna modifica)</span>
                    </div>
                    <svg className={`h-5 w-5 transition-transform ${expandedSection === 'completi' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSection === 'completi' && (
                    <div className="border-t p-4">
                      <div className="flex flex-wrap gap-2">
                        {report.giaCompleti.map((nome, i) => (
                          <Badge key={i} variant="default" className="bg-green-50">
                            ✓ {nome}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Nuovi */}
              {report.nuovi.length > 0 && (
                <div className="border rounded-lg">
                  <button
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50"
                    onClick={() => toggleSection('nuovi')}
                  >
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        {report.nuovi.length}
                      </Badge>
                      <span className="font-medium">Locali nuovi (non presenti nel DB)</span>
                    </div>
                    <svg className={`h-5 w-5 transition-transform ${expandedSection === 'nuovi' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSection === 'nuovi' && (
                    <div className="border-t max-h-[200px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Indirizzo</TableHead>
                            <TableHead>Città</TableHead>
                            <TableHead>Belfiore</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.nuovi.map((locale, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{locale.nome || locale.nomeImport}</TableCell>
                              <TableCell>{locale.indirizzo}</TableCell>
                              <TableCell>{locale.citta} ({locale.provincia})</TableCell>
                              <TableCell>
                                <Badge variant="default" className="font-mono">
                                  {locale.codiceBelfiore}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
              
              {/* Non Trovati */}
              {report.nonTrovati.length > 0 && (
                <div className="border rounded-lg">
                  <button
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50"
                    onClick={() => toggleSection('nontrovati')}
                  >
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                        {report.nonTrovati.length}
                      </Badge>
                      <span className="font-medium">Locali nel DB senza match (non modificati)</span>
                    </div>
                    <svg className={`h-5 w-5 transition-transform ${expandedSection === 'nontrovati' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSection === 'nontrovati' && (
                    <div className="border-t p-4">
                      <div className="flex flex-wrap gap-2 max-h-[150px] overflow-auto">
                        {report.nonTrovati.slice(0, 50).map((nome, i) => (
                          <Badge key={i} variant="default" className="text-slate-500">
                            {nome}
                          </Badge>
                        ))}
                        {report.nonTrovati.length > 50 && (
                          <Badge variant="default">
                            +{report.nonTrovati.length - 50} altri
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Azioni */}
            {(report.daAggiornare.length > 0 || report.nuovi.length > 0) && (
              <div className="flex items-center justify-between pt-4 border-t">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={inserisciNuovi}
                    onChange={(e) => setInserisciNuovi(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-slate-600">
                    Inserisci anche i {report.nuovi.length} locali nuovi
                  </span>
                </label>
                
                <Button 
                  onClick={executeImport} 
                  disabled={importing || report.daAggiornare.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {importing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Importazione...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Importa {report.daAggiornare.length} Locali
                      {inserisciNuovi && report.nuovi.length > 0 && ` + ${report.nuovi.length} nuovi`}
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
        
        {!report && !loading && (
          <div className="text-center py-8 text-slate-500">
            <svg className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>Clicca "Anteprima Import" per vedere i locali da aggiornare</p>
            <p className="text-sm mt-1">
              Verranno aggiornati indirizzo, città, CAP, telefono e codice Belfiore
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
