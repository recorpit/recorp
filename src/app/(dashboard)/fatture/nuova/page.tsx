// src/app/(dashboard)/fatture/nuova/page.tsx
// Pagina Creazione Nuova Fattura con 3 modalità righe esplicite
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, FileText, Users, Euro, Calendar, MapPin,
  Check, AlertCircle, Download, Eye
} from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface Committente {
  id: string
  ragioneSociale: string
  partitaIva: string
  modalitaFatturazione: string
  tipoPagamento: string
  quotaAgenzia: number
  splitPayment: boolean
  scadenzaPagamentoId: string | null
}

interface Artista {
  id: string
  nome: string
  cognome: string
  nomeDarte: string | null
}

interface ArtistaAgibilita {
  id: string
  artista: Artista
  compensoLordo: number
}

interface Agibilita {
  id: string
  codice: string
  data: string
  locale: { id: string; nome: string }
  artisti: ArtistaAgibilita[]
  totaleCompensiLordi: number
}

interface ScadenzaPagamento {
  id: string
  nome: string
  giorni: number
  fineMese: boolean
}

interface RigaPreview {
  numeroLinea: number
  descrizione: string
  quantita?: number
  prezzoUnitario: number
  prezzoTotale: number
}

type ModalitaRighe = 'DETTAGLIO_SPESE_SEPARATE' | 'DETTAGLIO_SPESE_INCLUSE' | 'VOCE_UNICA'

const TIPI_PAGAMENTO: Record<string, string> = {
  'BONIFICO_VISTA': 'Bonifico vista fattura',
  'BONIFICO_30GG': 'Bonifico 30 gg F.M.',
  'CARTA_CREDITO': 'Carta di credito',
  'CONTANTI': 'Contanti',
  'RIBA_30GG': 'RIBA 30 gg F.M.',
}

export default function NuovaFatturaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const committenteIdParam = searchParams.get('committente')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Dati
  const [committenti, setCommittenti] = useState<Committente[]>([])
  const [agibilitaDisponibili, setAgibilitaDisponibili] = useState<Agibilita[]>([])
  const [scadenze, setScadenze] = useState<ScadenzaPagamento[]>([])
  
  // Form
  const [committenteId, setCommittenteId] = useState(committenteIdParam || '')
  const [agibilitaSelezionate, setAgibilitaSelezionate] = useState<string[]>([])
  const [modalitaRighe, setModalitaRighe] = useState<ModalitaRighe>('DETTAGLIO_SPESE_INCLUSE')
  const [descrizioneGenerica, setDescrizioneGenerica] = useState('Servizi di produzione artistica')
  const [aliquotaIva, setAliquotaIva] = useState(22)
  const [scadenzaPagamentoId, setScadenzaPagamentoId] = useState('')
  const [tipoPagamento, setTipoPagamento] = useState('BONIFICO_VISTA')
  const [numeroManuale, setNumeroManuale] = useState('')
  
  // Carica dati iniziali
  useEffect(() => {
    async function loadData() {
      try {
        // Carica committenti
        const resCommittenti = await fetch('/api/committenti')
        if (resCommittenti.ok) {
          const data = await resCommittenti.json()
          setCommittenti(data.data || data)
        }
        
        // Carica scadenze
        const resScadenze = await fetch('/api/impostazioni/scadenze?attive=true')
        if (resScadenze.ok) {
          setScadenze(await resScadenze.json())
        }
        
      } catch (err) {
        console.error('Errore caricamento dati:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  // Carica agibilità e imposta defaults quando cambia committente
  useEffect(() => {
    if (!committenteId) {
      setAgibilitaDisponibili([])
      return
    }
    
    // Aspetta che i committenti siano caricati
    if (committenti.length === 0) {
      return
    }
    
    async function loadAgibilita() {
      try {
        const res = await fetch(`/api/agibilita?committenteId=${committenteId}&statoFattura=DA_FATTURARE`)
        if (res.ok) {
          const data = await res.json()
          setAgibilitaDisponibili(data.data || data)
        }
      } catch (err) {
        console.error('Errore caricamento agibilità:', err)
      }
    }
    
    loadAgibilita()
    
    // Imposta defaults dal committente selezionato
    const committente = committenti.find(c => c.id === committenteId)
    console.log('Committente trovato:', committente?.ragioneSociale, 'modalitaFatturazione:', committente?.modalitaFatturazione)
    
    if (committente) {
      // Modalità fatturazione - FORZA il valore dal committente
      const nuovaModalita = (committente.modalitaFatturazione || 'DETTAGLIO_SPESE_INCLUSE') as ModalitaRighe
      console.log('Imposto modalità:', nuovaModalita)
      setModalitaRighe(nuovaModalita)
      
      // Tipo pagamento
      const nuovoTipoPagamento = committente.tipoPagamento || 'BONIFICO_VISTA'
      console.log('Imposto tipo pagamento:', nuovoTipoPagamento)
      setTipoPagamento(nuovoTipoPagamento)
      
      // Scadenza pagamento
      if (committente.scadenzaPagamentoId) {
        setScadenzaPagamentoId(committente.scadenzaPagamentoId)
      }
    }
    
    // Reset selezione
    setAgibilitaSelezionate([])
    
  }, [committenteId, committenti])
  
  // Calcola totali e preview righe
  const { totali, righePreview } = useMemo(() => {
    const committente = committenti.find(c => c.id === committenteId)
    const quotaPerArtista = Number(committente?.quotaAgenzia || 0)
    
    const agibilitaSel = agibilitaDisponibili.filter(a => agibilitaSelezionate.includes(a.id))
    
    let righe: RigaPreview[] = []
    let imponibile = 0
    
    if (modalitaRighe === 'VOCE_UNICA') {
      // Una sola riga
      let totale = 0
      agibilitaSel.forEach(agi => {
        agi.artisti.forEach(aa => {
          totale += Number(aa.compensoLordo) + quotaPerArtista
        })
      })
      
      righe = [{
        numeroLinea: 1,
        descrizione: descrizioneGenerica || 'Servizi di produzione artistica',
        prezzoUnitario: totale,
        prezzoTotale: totale,
      }]
      imponibile = totale
      
    } else if (modalitaRighe === 'DETTAGLIO_SPESE_INCLUSE') {
      // Una riga per artista con spese incluse
      let lineNum = 1
      agibilitaSel.forEach(agi => {
        agi.artisti.forEach(aa => {
          const importo = Number(aa.compensoLordo) + quotaPerArtista
          const nome = aa.artista.nomeDarte 
            ? `${aa.artista.nome} ${aa.artista.cognome} - "${aa.artista.nomeDarte}"`
            : `${aa.artista.nome} ${aa.artista.cognome}`
          
          righe.push({
            numeroLinea: lineNum++,
            descrizione: `${nome} - Compenso e gestione`,
            prezzoUnitario: importo,
            prezzoTotale: importo,
          })
          imponibile += importo
        })
      })
      
    } else {
      // DETTAGLIO_SPESE_SEPARATE
      let lineNum = 1
      let totaleSpese = 0
      
      agibilitaSel.forEach(agi => {
        agi.artisti.forEach(aa => {
          const compenso = Number(aa.compensoLordo)
          const nome = aa.artista.nomeDarte 
            ? `${aa.artista.nome} ${aa.artista.cognome} - "${aa.artista.nomeDarte}"`
            : `${aa.artista.nome} ${aa.artista.cognome}`
          
          righe.push({
            numeroLinea: lineNum++,
            descrizione: `${nome} - Compenso lordo`,
            prezzoUnitario: compenso,
            prezzoTotale: compenso,
          })
          imponibile += compenso
          totaleSpese += quotaPerArtista
        })
      })
      
      // Riga spese
      if (totaleSpese > 0) {
        const numArtisti = agibilitaSel.reduce((sum, a) => sum + a.artisti.length, 0)
        console.log('Aggiungo riga spese:', { numArtisti, quotaPerArtista, totaleSpese })
        righe.push({
          numeroLinea: lineNum,
          descrizione: `Spese di gestione`,
          quantita: numArtisti,
          prezzoUnitario: quotaPerArtista,
          prezzoTotale: totaleSpese,
        })
        imponibile += totaleSpese
      } else {
        console.log('Riga spese NON aggiunta:', { totaleSpese, quotaPerArtista })
      }
    }
    
    const iva = imponibile * (aliquotaIva / 100)
    const totale = imponibile + iva
    
    return {
      totali: {
        imponibile: Math.round(imponibile * 100) / 100,
        iva: Math.round(iva * 100) / 100,
        totale: Math.round(totale * 100) / 100,
        numArtisti: agibilitaSel.reduce((sum, a) => sum + a.artisti.length, 0),
        numAgibilita: agibilitaSel.length,
      },
      righePreview: righe,
    }
  }, [committenteId, committenti, agibilitaDisponibili, agibilitaSelezionate, modalitaRighe, descrizioneGenerica, aliquotaIva])
  
  // Toggle selezione agibilità
  const toggleAgibilita = (id: string) => {
    setAgibilitaSelezionate(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id]
    )
  }
  
  // Seleziona/deseleziona tutte
  const toggleTutte = () => {
    if (agibilitaSelezionate.length === agibilitaDisponibili.length) {
      setAgibilitaSelezionate([])
    } else {
      setAgibilitaSelezionate(agibilitaDisponibili.map(a => a.id))
    }
  }
  
  // Crea fattura
  const handleSubmit = async () => {
    if (!committenteId || agibilitaSelezionate.length === 0) {
      setError('Seleziona un committente e almeno una agibilità')
      return
    }
    
    setSaving(true)
    setError('')
    
    try {
      const res = await fetch('/api/fatture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          committenteId,
          agibilitaIds: agibilitaSelezionate,
          modalitaRighe,
          descrizioneGenerica: modalitaRighe === 'VOCE_UNICA' ? descrizioneGenerica : undefined,
          aliquotaIva,
          scadenzaPagamentoId: scadenzaPagamentoId || undefined,
          tipoPagamento,
          numero: numeroManuale || undefined,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nella creazione')
      }
      
      const fattura = await res.json()
      router.push(`/fatture/${fattura.id}`)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  // Formatta giorno settimana in italiano
  const formatGiorno = (dateStr: string) => {
    const date = new Date(dateStr)
    return format(date, 'EEEE d MMMM yyyy', { locale: it })
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  const committente = committenti.find(c => c.id === committenteId)
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/fatture"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuova Fattura</h1>
          <p className="text-gray-500">Seleziona committente e agibilità da fatturare</p>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna sinistra - Selezione */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Selezione Committente */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Seleziona Committente</h2>
            
            <select
              value={committenteId}
              onChange={(e) => setCommittenteId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            >
              <option value="">-- Seleziona committente --</option>
              {committenti.map(c => (
                <option key={c.id} value={c.id}>
                  {c.ragioneSociale} {c.partitaIva && `(${c.partitaIva})`}
                </option>
              ))}
            </select>
          </div>
          
          {/* Selezione Agibilità */}
          {committenteId && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">2. Seleziona Agibilità</h2>
                
                {agibilitaDisponibili.length > 0 && (
                  <button
                    onClick={toggleTutte}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {agibilitaSelezionate.length === agibilitaDisponibili.length 
                      ? 'Deseleziona tutte' 
                      : 'Seleziona tutte'}
                  </button>
                )}
              </div>
              
              {agibilitaDisponibili.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto mb-2 opacity-50" size={40} />
                  <p>Nessuna agibilità da fatturare per questo committente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {agibilitaDisponibili.map(agi => (
                    <label
                      key={agi.id}
                      className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                        agibilitaSelezionate.includes(agi.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={agibilitaSelezionate.includes(agi.id)}
                        onChange={() => toggleAgibilita(agi.id)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{agi.codice}</span>
                          <span className="text-lg font-semibold text-gray-900">
                            €{Number(agi.totaleCompensiLordi).toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatGiorno(agi.data)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {agi.locale.nome}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                          <Users size={14} />
                          {agi.artisti.map(aa => 
                            aa.artista.nomeDarte || `${aa.artista.nome} ${aa.artista.cognome}`
                          ).join(', ')}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Modalità Righe */}
          {agibilitaSelezionate.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Modalità Righe Fattura</h2>
              
              <div className="space-y-3">
                {/* Opzione 1: Dettaglio spese incluse */}
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  modalitaRighe === 'DETTAGLIO_SPESE_INCLUSE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="modalitaRighe"
                    checked={modalitaRighe === 'DETTAGLIO_SPESE_INCLUSE'}
                    onChange={() => setModalitaRighe('DETTAGLIO_SPESE_INCLUSE')}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Dettaglio con spese incluse</span>
                    <p className="text-sm text-gray-500 mt-1">
                      Una riga per ogni artista con compenso + spese di gestione incluse
                    </p>
                  </div>
                </label>
                
                {/* Opzione 2: Dettaglio spese separate */}
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  modalitaRighe === 'DETTAGLIO_SPESE_SEPARATE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="modalitaRighe"
                    checked={modalitaRighe === 'DETTAGLIO_SPESE_SEPARATE'}
                    onChange={() => setModalitaRighe('DETTAGLIO_SPESE_SEPARATE')}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Dettaglio + spese separate</span>
                    <p className="text-sm text-gray-500 mt-1">
                      Una riga per ogni artista (solo compenso) + riga finale con spese di gestione
                    </p>
                  </div>
                </label>
                
                {/* Opzione 3: Voce unica */}
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  modalitaRighe === 'VOCE_UNICA' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="modalitaRighe"
                    checked={modalitaRighe === 'VOCE_UNICA'}
                    onChange={() => setModalitaRighe('VOCE_UNICA')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">Voce unica generica</span>
                    <p className="text-sm text-gray-500 mt-1">
                      Una sola riga con descrizione personalizzata e totale complessivo
                    </p>
                    
                    {modalitaRighe === 'VOCE_UNICA' && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={descrizioneGenerica}
                          onChange={(e) => setDescrizioneGenerica(e.target.value)}
                          placeholder="Descrizione..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          )}
          
          {/* Opzioni aggiuntive */}
          {agibilitaSelezionate.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">4. Opzioni Fattura</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Numero manuale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numero Fattura (opzionale)
                  </label>
                  <input
                    type="text"
                    value={numeroManuale}
                    onChange={(e) => setNumeroManuale(e.target.value)}
                    placeholder="Es: 15/2025 (lascia vuoto per automatico)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Tipo pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo Pagamento
                  </label>
                  <select
                    value={tipoPagamento}
                    onChange={(e) => setTipoPagamento(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(TIPI_PAGAMENTO).map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Aliquota IVA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aliquota IVA
                  </label>
                  <select
                    value={aliquotaIva}
                    onChange={(e) => setAliquotaIva(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={22}>22%</option>
                    <option value={10}>10%</option>
                    <option value={4}>4%</option>
                    <option value={0}>Esente (0%)</option>
                  </select>
                </div>
                
                {/* Scadenza */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scadenza Pagamento
                  </label>
                  <select
                    value={scadenzaPagamentoId}
                    onChange={(e) => setScadenzaPagamentoId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Usa default committente --</option>
                    {scadenze.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nome} ({s.giorni}gg{s.fineMese ? ' FM' : ''})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Colonna destra - Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Anteprima Fattura</h2>
            
            {agibilitaSelezionate.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Eye className="mx-auto mb-2" size={40} />
                <p>Seleziona agibilità per vedere l&apos;anteprima</p>
              </div>
            ) : (
              <>
                {/* Info committente */}
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm text-gray-500">Committente</p>
                  <p className="font-medium">{committente?.ragioneSociale}</p>
                  {committente?.splitPayment && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                      Split Payment
                    </span>
                  )}
                </div>
                
                {/* Riepilogo */}
                <div className="mb-4 pb-4 border-b">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Agibilità:</span>
                    <span>{totali.numAgibilita}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Artisti totali:</span>
                    <span>{totali.numArtisti}</span>
                  </div>
                </div>
                
                {/* Righe preview */}
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm text-gray-500 mb-2">Righe fattura ({righePreview.length})</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {righePreview.map(riga => (
                      <div key={riga.numeroLinea} className="flex justify-between text-sm">
                        <span className="text-gray-700 truncate flex-1 mr-2" title={riga.descrizione}>
                          {riga.numeroLinea}. {riga.descrizione.length > 30 
                            ? riga.descrizione.substring(0, 30) + '...' 
                            : riga.descrizione}
                          {riga.quantita && riga.quantita > 1 && (
                            <span className="text-gray-400 ml-1">
                              ({riga.quantita} × €{Number(riga.prezzoUnitario || 0).toFixed(2)})
                            </span>
                          )}
                        </span>
                        <span className="font-medium whitespace-nowrap">
                          €{Number(riga.prezzoTotale || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Totali */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Imponibile:</span>
                    <span className="font-medium">€{totali.imponibile.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA {aliquotaIva}%:</span>
                    <span className="font-medium">€{totali.iva.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Totale:</span>
                    <span className="text-blue-600">€{totali.totale.toFixed(2)}</span>
                  </div>
                  {committente?.splitPayment && (
                    <p className="text-xs text-yellow-600 mt-1">
                      * Con Split Payment il committente pagherà solo €{totali.imponibile.toFixed(2)}
                    </p>
                  )}
                </div>
                
                {/* Azioni */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleSubmit}
                    disabled={saving || agibilitaSelezionate.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Creazione...
                      </>
                    ) : (
                      <>
                        <Check size={20} />
                        Crea Fattura
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
