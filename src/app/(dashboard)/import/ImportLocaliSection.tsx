'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, MapPin, Building2, CheckCircle2, AlertCircle, ArrowRight, Download } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'

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

  const fetchPreview = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const res = await fetch('/api/import/locali')
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
      const res = await fetch('/api/import/locali', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inserisciNuovi }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante import')
      }
      
      setResult(data)
      // Ricarica anteprima per vedere stato aggiornato
      await fetchPreview()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle>Import Locali con Codice Belfiore</CardTitle>
              <CardDescription>
                Aggiorna i dati dei locali (indirizzo, città, CAP) e aggiungi il codice Belfiore per le agibilità INPS
              </CardDescription>
            </div>
          </div>
          <Button onClick={fetchPreview} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Caricamento...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Anteprima Import
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}
        
        {result && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            result.success 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
          }`}>
            <CheckCircle2 className="h-5 w-5" />
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
            
            {/* Accordion con dettagli */}
            <Accordion type="multiple" className="w-full">
              {/* Da Aggiornare */}
              {report.daAggiornare.length > 0 && (
                <AccordionItem value="aggiornare">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {report.daAggiornare.length}
                      </Badge>
                      Locali da aggiornare
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-[300px]">
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
                              <TableCell className="text-center">
                                <ArrowRight className="h-4 w-4 text-amber-500 mx-auto" />
                              </TableCell>
                              <TableCell className="text-green-700">
                                {locale.nuoviDati?.indirizzo}
                                {locale.nuoviDati?.citta && `, ${locale.nuoviDati.citta}`}
                                {locale.nuoviDati?.provincia && ` (${locale.nuoviDati.provincia})`}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="font-mono">
                                  {locale.nuoviDati?.codiceBelfiore}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {/* Già Completi */}
              {report.giaCompleti.length > 0 && (
                <AccordionItem value="completi">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {report.giaCompleti.length}
                      </Badge>
                      Locali già completi (nessuna modifica)
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2 p-2">
                      {report.giaCompleti.map((nome, i) => (
                        <Badge key={i} variant="secondary" className="bg-green-50">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {nome}
                        </Badge>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {/* Nuovi */}
              {report.nuovi.length > 0 && (
                <AccordionItem value="nuovi">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {report.nuovi.length}
                      </Badge>
                      Locali nuovi (non presenti nel DB)
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-[200px]">
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
                                <Badge variant="secondary" className="font-mono">
                                  {locale.codiceBelfiore}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {/* Non Trovati */}
              {report.nonTrovati.length > 0 && (
                <AccordionItem value="nontrovati">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                        {report.nonTrovati.length}
                      </Badge>
                      Locali nel DB senza match (non modificati)
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2 p-2">
                      {report.nonTrovati.slice(0, 50).map((nome, i) => (
                        <Badge key={i} variant="outline" className="text-slate-500">
                          {nome}
                        </Badge>
                      ))}
                      {report.nonTrovati.length > 50 && (
                        <Badge variant="outline">
                          +{report.nonTrovati.length - 50} altri
                        </Badge>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
            
            {/* Azioni */}
            {(report.daAggiornare.length > 0 || report.nuovi.length > 0) && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="inserisciNuovi" 
                    checked={inserisciNuovi}
                    onCheckedChange={(checked) => setInserisciNuovi(checked === true)}
                  />
                  <label 
                    htmlFor="inserisciNuovi" 
                    className="text-sm text-slate-600 cursor-pointer"
                  >
                    Inserisci anche i {report.nuovi.length} locali nuovi
                  </label>
                </div>
                
                <Button 
                  onClick={executeImport} 
                  disabled={importing || report.daAggiornare.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importazione...
                    </>
                  ) : (
                    <>
                      <Building2 className="mr-2 h-4 w-4" />
                      Importa {report.daAggiornare.length} Locali
                      {inserisciNuovi && report.nuovi.length > 0 && ` + ${report.nuovi.length} nuovi`}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
        
        {!report && !loading && (
          <div className="text-center py-8 text-slate-500">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
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
