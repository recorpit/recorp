// src/app/(dashboard)/agibilita/nuova/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Clock, MapPin, Building2, Calculator, Plus, Trash2, AlertTriangle, X, Globe, Calendar, Layers } from 'lucide-react'
import { calcolaCompensi } from '@/lib/constants'
import AutocompleteCommittente from '@/components/AutocompleteCommittente'
import AutocompleteArtista from '@/components/AutocompleteArtista'
import AutocompleteLocale from '@/components/AutocompleteLocale'

const getOggi = () => new Date().toISOString().split('T')[0]

const getGiornoDopo = (data: string) => {
  const d = new Date(data)
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

// Lista qualifiche disponibili (valori allineati al database)
const QUALIFICHE = [
  { value: 'DJ', label: 'DJ' },
  { value: 'Vocalist', label: 'Vocalist' },
  { value: 'Corista', label: 'Corista' },
  { value: 'Musicista', label: 'Musicista' },
  { value: 'Ballerino', label: 'Ballerino/a' },
  { value: 'Lucista', label: 'Lucista' },
  { value: 'Fotografo', label: 'Fotografo' },
  { value: 'Truccatore', label: 'Truccatore' },
  { value: 'Altro', label: 'Altro (da specificare)' },
]

// Paesi europei comuni per agibilità estera
const PAESI_ESTERI = [
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgio' },
  { code: 'CH', name: 'Svizzera' },
  { code: 'DE', name: 'Germania' },
  { code: 'ES', name: 'Spagna' },
  { code: 'FR', name: 'Francia' },
  { code: 'GB', name: 'Regno Unito' },
  { code: 'HR', name: 'Croazia' },
  { code: 'NL', name: 'Paesi Bassi' },
  { code: 'PL', name: 'Polonia' },
  { code: 'PT', name: 'Portogallo' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'OTHER', name: 'Altro...' },
]

interface ArtistaInPeriodo {
  id: string
  nome: string
  cognome: string
  nomeDarte?: string | null
  qualifica?: string | null
  tipoContratto?: string | null
  partitaIva?: string | null
  iscritto: boolean
  cachetBase?: number | null
  compensoNetto: string
}

interface Periodo {
  id: string
  dataInizio: string
  dataFine: string
  artisti: ArtistaInPeriodo[]
}

interface Format {
  id: string
  nome: string
  descrizione?: string
  tipoFatturazione: string
  attivo?: boolean
  committenti?: { 
    committente: { 
      id: string
      ragioneSociale: string
      quotaAgenzia?: number | string
    } 
  }[]
}

// Validazione CF italiano
function isValidCF(cf: string): boolean {
  if (!cf || cf.length !== 16) return false
  const pattern = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/
  return pattern.test(cf.toUpperCase())
}

// Validazione P.IVA italiana
function isValidPIVA(piva: string): boolean {
  if (!piva) return true
  if (piva.length !== 11) return false
  return /^[0-9]{11}$/.test(piva)
}

// Validazione CAP
function isValidCAP(cap: string): boolean {
  if (!cap) return true
  return /^[0-9]{5}$/.test(cap)
}

// Validazione email
function isValidEmail(email: string): boolean {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Genera ID univoco
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Controlla se qualifica è valida (non è ALTRO/Altro/altro o vuota)
function isQualificaValida(qualifica: string | null | undefined): boolean {
  if (!qualifica) return false
  const q = qualifica.trim().toUpperCase()
  return q !== 'ALTRO' && q !== ''
}

// Modal generico
function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function NuovaAgibilitaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reloadMessage, setReloadMessage] = useState('')
  
  const [locali, setLocali] = useState<any[]>([])
  const [committenti, setCommittenti] = useState<any[]>([])
  const [formats, setFormats] = useState<Format[]>([])
  
  const [prenotazione, setPrenotazione] = useState<{id: string, codice: string, scadeAt: Date, minutiRimanenti: number} | null>(null)
  const [prenotando, setPrenotando] = useState(false)
  
  // Sistema a PERIODI
  const [periodi, setPeriodi] = useState<Periodo[]>([
    { id: generateId(), dataInizio: getOggi(), dataFine: getGiornoDopo(getOggi()), artisti: [] }
  ])
  
  // Modal states
  const [showModalLocale, setShowModalLocale] = useState(false)
  const [showModalCommittente, setShowModalCommittente] = useState(false)
  const [showModalArtista, setShowModalArtista] = useState(false)
  const [modalArtistaPeriodoId, setModalArtistaPeriodoId] = useState<string | null>(null)
  
  // Errori validazione modal
  const [erroriLocale, setErroriLocale] = useState<Record<string, string>>({})
  const [erroriCommittente, setErroriCommittente] = useState<Record<string, string>>({})
  const [erroriArtista, setErroriArtista] = useState<Record<string, string>>({})
  
  // Form nuovo locale
  const [nuovoLocale, setNuovoLocale] = useState({
    nome: '', indirizzo: '', citta: '', provincia: '', cap: '', codiceBelfiore: '', referenteEmail: ''
  })
  const [savingLocale, setSavingLocale] = useState(false)
  
  // Form nuovo committente
  const [nuovoCommittente, setNuovoCommittente] = useState({
    ragioneSociale: '', partitaIva: '', codiceFiscale: '', indirizzo: '', citta: '', provincia: '', cap: '', email: ''
  })
  const [savingCommittente, setSavingCommittente] = useState(false)
  
  // Form nuovo artista
  const [nuovoArtista, setNuovoArtista] = useState({
    nome: '', cognome: '', codiceFiscale: '', nomeDarte: '', qualifica: 'DJ', email: ''
  })
  const [savingArtista, setSavingArtista] = useState(false)
  
  // Form principale
  const [usaFormat, setUsaFormat] = useState(false)
  const [form, setForm] = useState({
    localeId: '',
    committenteId: '',
    formatId: '',
    note: '',
    estera: false,
    paeseEstero: '',
  })
  
  // Totali calcolati
  const [totali, setTotali] = useState({
    netto: 0,
    lordo: 0,
    ritenuta: 0,
    quotaAgenzia: 0,
    quotaUnitaria: 0,
    numArtisti: 0,
    importoFattura: 0,
  })
  
  // Ref per evitare doppie chiamate
  const prenotazioneInCorso = useRef(false)
  
  // Carica dati iniziali
  // State per tracciare se arriva da una richiesta
  const [fromRichiestaId, setFromRichiestaId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/locali').then(r => r.json()),
      fetch('/api/committenti').then(r => r.json()),
      fetch('/api/formats').then(r => r.json()).catch(() => []),
    ]).then(async ([l, c, f]) => {
      setLocali(l)
      setCommittenti(c)
      setFormats(Array.isArray(f) ? f.filter((fmt: Format) => fmt.attivo !== false) : [])
      
      // Dopo aver caricato i dati, controlla se ci sono dati da richiesta
      const datiSalvati = sessionStorage.getItem('datiNuovaAgibilita')
      if (datiSalvati) {
        try {
          const dati = JSON.parse(datiSalvati)
          console.log('Dati da richiesta:', dati)
          
          setFromRichiestaId(dati.fromRichiestaId)
          
          // Precompila locale
          if (dati.locale?.id) {
            setForm(prev => ({ ...prev, localeId: dati.locale.id }))
          }
          
          // Precompila committente
          if (dati.committente?.id) {
            setForm(prev => ({ ...prev, committenteId: dati.committente.id }))
          }
          
          // Precompila periodi con artisti
          if (dati.dataEvento) {
            const dataInizio = dati.dataEvento
            const dataFine = dati.dataFine || getGiornoDopo(dati.dataEvento)
            
            // Prepara artisti per il periodo - semplice mapping senza fetch aggiuntivi
            const artistiPeriodo: ArtistaInPeriodo[] = (dati.artisti || []).map((a: any) => ({
              id: a.id || generateId(),
              nome: a.nome || '',
              cognome: a.cognome || '',
              nomeDarte: a.nomeDarte || null,
              qualifica: a.qualifica || 'DJ',
              tipoContratto: null,
              partitaIva: null,
              iscritto: !!a.id && !a.isNuovo,
              cachetBase: a.compensoNetto || null,
              compensoNetto: (a.compensoNetto || '')?.toString() || '',
            }))
            
            setPeriodi([{
              id: generateId(),
              dataInizio,
              dataFine,
              artisti: artistiPeriodo,
            }])
          }
          
          // Pulisci sessionStorage dopo aver usato i dati
          sessionStorage.removeItem('datiNuovaAgibilita')
          
        } catch (e) {
          console.error('Errore parsing dati richiesta:', e)
        }
      }
    })
    
    if (!prenotazioneInCorso.current) {
      prenotaNumero()
    }
  }, [])
  
  // Quando si seleziona un format, precompila committente se disponibile
  useEffect(() => {
    if (usaFormat && form.formatId) {
      const format = formats.find(f => f.id === form.formatId)
      if (format?.committenti && format.committenti.length > 0) {
        // Prendi il primo committente associato al format
        setForm(prev => ({ ...prev, committenteId: format.committenti![0].committente.id }))
      } else {
        // Format senza committenti, resetta
        setForm(prev => ({ ...prev, committenteId: '' }))
      }
    }
  }, [form.formatId, formats, usaFormat])
  
  // Precompila committente quando si seleziona locale (solo se non usa format)
  useEffect(() => {
    if (form.localeId && !usaFormat) {
      const locale = locali.find(l => l.id === form.localeId)
      if (locale?.committenteDefaultId && !form.committenteId) {
        setForm(prev => ({ ...prev, committenteId: locale.committenteDefaultId }))
      }
    }
  }, [form.localeId, locali, form.committenteId, usaFormat])
  
  // Ricalcola totali
  useEffect(() => {
    const committente = committenti.find(c => c.id === form.committenteId)
    const quotaUnitaria = parseFloat(committente?.quotaAgenzia?.toString() || '0')
    
    let numPrestazioni = 0
    periodi.forEach(p => {
      numPrestazioni += p.artisti.length
    })
    
    const quotaTotale = quotaUnitaria * numPrestazioni
    
    let totNetto = 0
    let totLordo = 0
    let totRitenuta = 0
    
    periodi.forEach(periodo => {
      periodo.artisti.forEach(a => {
        const netto = parseFloat(a.compensoNetto || '0')
        
        if (a.tipoContratto === 'P_IVA' || a.partitaIva) {
          totNetto += netto
          totLordo += netto
        } else {
          const compensi = calcolaCompensi({ netto }, 0)
          totNetto += compensi.netto
          totLordo += compensi.lordo
          totRitenuta += compensi.ritenuta
        }
      })
    })
    
    setTotali({
      netto: totNetto,
      lordo: totLordo,
      ritenuta: totRitenuta,
      quotaAgenzia: quotaTotale,
      quotaUnitaria,
      numArtisti: numPrestazioni,
      importoFattura: totLordo + quotaTotale,
    })
  }, [periodi, form.committenteId, committenti])
  
  const prenotaNumero = async () => {
    if (prenotazioneInCorso.current) return
    prenotazioneInCorso.current = true
    setPrenotando(true)
    
    try {
      const res = await fetch('/api/agibilita/prenota-numero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      
      if (res.ok) {
        const data = await res.json()
        setPrenotazione({
          ...data,
          scadeAt: new Date(data.scadeAt),
          minutiRimanenti: Math.ceil((new Date(data.scadeAt).getTime() - Date.now()) / 60000)
        })
      } else {
        const data = await res.json()
        setError(data.error || 'Errore prenotazione numero')
      }
    } catch (err) {
      console.error('Errore prenotazione numero:', err)
      setError('Errore di connessione')
    } finally {
      setPrenotando(false)
      prenotazioneInCorso.current = false
    }
  }
  
  // Timer countdown
  useEffect(() => {
    if (!prenotazione) return
    
    const interval = setInterval(() => {
      const remaining = Math.ceil((prenotazione.scadeAt.getTime() - Date.now()) / 60000)
      if (remaining <= 0) {
        setPrenotazione(null)
        clearInterval(interval)
      } else {
        setPrenotazione(prev => prev ? { ...prev, minutiRimanenti: remaining } : null)
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [prenotazione])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setForm(prev => ({ ...prev, [name]: checked }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }
  
  const handleLocaleChange = (id: string | null, locale: any) => {
    setForm(prev => ({ ...prev, localeId: id || '' }))
    if (locale?.committenteDefaultId && !form.committenteId && !usaFormat) {
      setForm(prev => ({ ...prev, committenteId: locale.committenteDefaultId }))
    }
  }
  
  const handleCommittenteChange = (id: string | null) => {
    setForm(prev => ({ ...prev, committenteId: id || '' }))
  }
  
  // === GESTIONE PERIODI ===
  
  const addPeriodo = () => {
    const ultimoPeriodo = periodi[periodi.length - 1]
    const dataDefault = ultimoPeriodo?.dataFine || ultimoPeriodo?.dataInizio || getOggi()
    
    setPeriodi(prev => [...prev, {
      id: generateId(),
      dataInizio: dataDefault,
      dataFine: getGiornoDopo(dataDefault),
      artisti: []
    }])
  }
  
  const removePeriodo = (periodoId: string) => {
    if (periodi.length <= 1) return
    setPeriodi(prev => prev.filter(p => p.id !== periodoId))
  }
  
  const updatePeriodo = (periodoId: string, field: 'dataInizio' | 'dataFine', value: string) => {
    setPeriodi(prev => prev.map(p => {
      if (p.id !== periodoId) return p
      
      // Se cambio dataInizio, aggiorno anche dataFine al giorno dopo (se dataFine era <= dataInizio)
      if (field === 'dataInizio' && value) {
        const nuovaDataFine = p.dataFine && p.dataFine > value ? p.dataFine : getGiornoDopo(value)
        return { ...p, dataInizio: value, dataFine: nuovaDataFine }
      }
      
      return { ...p, [field]: value }
    }))
  }
  
  // === GESTIONE ARTISTI IN PERIODO ===
  
  const handleAddArtistaToPeriodo = (periodoId: string, artistaId: string | null, artista: any) => {
    if (!artista) return
    
    setPeriodi(prev => prev.map(p => {
      if (p.id !== periodoId) return p
      if (p.artisti.some(a => a.id === artista.id)) return p
      
      return {
        ...p,
        artisti: [...p.artisti, {
          id: artista.id,
          nome: artista.nome,
          cognome: artista.cognome,
          nomeDarte: artista.nomeDarte,
          qualifica: artista.qualifica,
          tipoContratto: artista.tipoContratto,
          partitaIva: artista.partitaIva,
          iscritto: artista.iscritto,
          cachetBase: artista.cachetBase,
          compensoNetto: artista.cachetBase?.toString() || '',
        }]
      }
    }))
  }
  
  const handleRemoveArtistaFromPeriodo = (periodoId: string, artistaId: string) => {
    setPeriodi(prev => prev.map(p => 
      p.id === periodoId 
        ? { ...p, artisti: p.artisti.filter(a => a.id !== artistaId) }
        : p
    ))
  }
  
  const handleArtistaCompensoChange = (periodoId: string, artistaId: string, value: string) => {
    setPeriodi(prev => prev.map(p => 
      p.id === periodoId 
        ? { ...p, artisti: p.artisti.map(a => a.id === artistaId ? { ...a, compensoNetto: value } : a) }
        : p
    ))
  }
  
  // Modifica qualifica artista inline + aggiornamento DB
  const handleArtistaQualificaChange = async (periodoId: string, artistaId: string, nuovaQualifica: string) => {
    setPeriodi(prev => prev.map(p => {
      if (p.id !== periodoId) return p
      return {
        ...p,
        artisti: p.artisti.map(a => 
          a.id === artistaId ? { ...a, qualifica: nuovaQualifica } : a
        )
      }
    }))
    
    try {
      const res = await fetch(`/api/artisti/${artistaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qualifica: nuovaQualifica })
      })
      
      if (res.ok) {
        setReloadMessage('✓ Qualifica aggiornata')
        setTimeout(() => setReloadMessage(''), 2000)
      }
    } catch (err) {
      console.error('Errore aggiornamento qualifica:', err)
    }
  }
  
  // Validazione e salvataggio nuovo locale
  const validateLocale = () => {
    const errori: Record<string, string> = {}
    if (!nuovoLocale.nome.trim()) errori.nome = 'Nome obbligatorio'
    if (!nuovoLocale.citta.trim()) errori.citta = 'Città obbligatoria'
    if (!nuovoLocale.codiceBelfiore.trim()) errori.codiceBelfiore = 'Codice Belfiore obbligatorio'
    if (nuovoLocale.codiceBelfiore && nuovoLocale.codiceBelfiore.length !== 4) errori.codiceBelfiore = 'Deve essere 4 caratteri'
    if (nuovoLocale.cap && !isValidCAP(nuovoLocale.cap)) errori.cap = 'CAP non valido (5 cifre)'
    if (nuovoLocale.provincia && nuovoLocale.provincia.length !== 2) errori.provincia = 'Provincia 2 caratteri'
    if (nuovoLocale.referenteEmail && !isValidEmail(nuovoLocale.referenteEmail)) errori.referenteEmail = 'Email non valida'
    setErroriLocale(errori)
    return Object.keys(errori).length === 0
  }
  
  const handleSaveLocale = async () => {
    if (!validateLocale()) return
    setSavingLocale(true)
    try {
      const res = await fetch('/api/locali', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuovoLocale),
      })
      if (res.ok) {
        const locale = await res.json()
        setLocali(prev => [...prev, locale])
        setForm(prev => ({ ...prev, localeId: locale.id }))
        setShowModalLocale(false)
        setNuovoLocale({ nome: '', indirizzo: '', citta: '', provincia: '', cap: '', codiceBelfiore: '', referenteEmail: '' })
        setErroriLocale({})
      }
    } catch (err) {
      console.error('Errore creazione locale:', err)
    } finally {
      setSavingLocale(false)
    }
  }
  
  // Validazione e salvataggio nuovo committente
  const validateCommittente = () => {
    const errori: Record<string, string> = {}
    if (!nuovoCommittente.ragioneSociale.trim()) errori.ragioneSociale = 'Ragione sociale obbligatoria'
    if (nuovoCommittente.partitaIva && !isValidPIVA(nuovoCommittente.partitaIva)) errori.partitaIva = 'P.IVA non valida (11 cifre)'
    if (nuovoCommittente.cap && !isValidCAP(nuovoCommittente.cap)) errori.cap = 'CAP non valido (5 cifre)'
    if (nuovoCommittente.provincia && nuovoCommittente.provincia.length !== 2) errori.provincia = 'Provincia 2 caratteri'
    if (nuovoCommittente.email && !isValidEmail(nuovoCommittente.email)) errori.email = 'Email non valida'
    setErroriCommittente(errori)
    return Object.keys(errori).length === 0
  }
  
  const handleSaveCommittente = async () => {
    if (!validateCommittente()) return
    setSavingCommittente(true)
    try {
      const res = await fetch('/api/committenti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuovoCommittente),
      })
      if (res.ok) {
        const committente = await res.json()
        setCommittenti(prev => [...prev, committente])
        setForm(prev => ({ ...prev, committenteId: committente.id }))
        setShowModalCommittente(false)
        setNuovoCommittente({ ragioneSociale: '', partitaIva: '', codiceFiscale: '', indirizzo: '', citta: '', provincia: '', cap: '', email: '' })
        setErroriCommittente({})
      }
    } catch (err) {
      console.error('Errore creazione committente:', err)
    } finally {
      setSavingCommittente(false)
    }
  }
  
  // Validazione e salvataggio nuovo artista
  const validateArtista = () => {
    const errori: Record<string, string> = {}
    if (!nuovoArtista.nome.trim()) errori.nome = 'Nome obbligatorio'
    if (!nuovoArtista.cognome.trim()) errori.cognome = 'Cognome obbligatorio'
    if (!nuovoArtista.codiceFiscale.trim()) errori.codiceFiscale = 'Codice fiscale obbligatorio'
    if (nuovoArtista.codiceFiscale && !isValidCF(nuovoArtista.codiceFiscale)) errori.codiceFiscale = 'CF non valido (16 caratteri)'
    if (nuovoArtista.email && !isValidEmail(nuovoArtista.email)) errori.email = 'Email non valida'
    setErroriArtista(errori)
    return Object.keys(errori).length === 0
  }
  
  const handleSaveArtista = async () => {
    if (!validateArtista()) return
    setSavingArtista(true)
    try {
      const res = await fetch('/api/artisti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuovoArtista,
          inviaEmailInvito: !!nuovoArtista.email
        }),
      })
      if (res.ok) {
        const artista = await res.json()
        if (modalArtistaPeriodoId) {
          handleAddArtistaToPeriodo(modalArtistaPeriodoId, artista.id, artista)
        }
        setShowModalArtista(false)
        setModalArtistaPeriodoId(null)
        setNuovoArtista({ nome: '', cognome: '', codiceFiscale: '', nomeDarte: '', qualifica: 'DJ', email: '' })
        setErroriArtista({})
      }
    } catch (err) {
      console.error('Errore creazione artista:', err)
    } finally {
      setSavingArtista(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const tuttiArtisti = periodi.flatMap(p => p.artisti)
    if (tuttiArtisti.length === 0) {
      setError('Seleziona almeno un artista')
      setLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    // Verifica duplicati: stesso artista nello stesso giorno (dataInizio)
    const artistiPerData = new Map<string, string[]>()
    periodi.forEach(p => {
      p.artisti.forEach(a => {
        const chiave = `${a.id}-${p.dataInizio}`
        if (!artistiPerData.has(chiave)) {
          artistiPerData.set(chiave, [])
        }
        artistiPerData.get(chiave)!.push(`${a.cognome} ${a.nome}`)
      })
    })
    
    const duplicati: string[] = []
    artistiPerData.forEach((nomi, chiave) => {
      if (nomi.length > 1) {
        const [artistaId, data] = chiave.split('-')
        const artista = tuttiArtisti.find(a => a.id === artistaId)
        duplicati.push(`${artista?.cognome} ${artista?.nome} il ${new Date(data).toLocaleDateString('it-IT')}`)
      }
    })
    
    if (duplicati.length > 0) {
      setError(`Lo stesso artista non può essere inserito due volte nello stesso giorno: ${duplicati.join(', ')}`)
      setLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    // Calcola data minima e massima
    const tutteLeDateInizio = periodi.map(p => p.dataInizio).filter(Boolean)
    const tutteLeDateFine = periodi.map(p => p.dataFine || p.dataInizio).filter(Boolean)
    const dataMinima = tutteLeDateInizio.sort()[0]
    const dataMassima = tutteLeDateFine.sort().reverse()[0]
    
    // DEBUG - rimuovere dopo
    console.log('Artisti da inviare:', tuttiArtisti.map(a => {
      const periodo = periodi.find(p => p.artisti.some(art => art.id === a.id))
      return { artistaId: a.id, nome: `${a.cognome} ${a.nome}`, dataInizio: periodo?.dataInizio }
    }))
    
    try {
      const res = await fetch('/api/agibilita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localeId: form.localeId,
          committenteId: form.committenteId || null, // Può essere null
          formatId: usaFormat && form.formatId ? form.formatId : null, // Format solo se checkbox attivo
          estera: form.estera,
          paeseEstero: form.paeseEstero,
          note: form.note,
          prenotazioneId: prenotazione?.id,
          codice: prenotazione?.codice,
          data: dataMinima,
          dataFine: dataMassima !== dataMinima ? dataMassima : null,
          periodi: periodi.map(p => ({
            dataInizio: p.dataInizio,
            dataFine: p.dataFine || p.dataInizio,
            artisti: p.artisti.map(a => ({
              artistaId: a.id,
              compensoNetto: parseFloat(a.compensoNetto || '0'),
            }))
          })),
          artisti: tuttiArtisti.map(a => {
            const periodo = periodi.find(p => p.artisti.some(art => art.id === a.id))
            return {
              artistaId: a.id,
              compensoNetto: parseFloat(a.compensoNetto || '0'),
              dataInizio: periodo?.dataInizio || null,
              dataFine: periodo?.dataFine || periodo?.dataInizio || null,
            }
          }),
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nella creazione')
      }
      
      const agibilita = await res.json()
      router.push(`/agibilita/${agibilita.id}`)
    } catch (err: any) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }
  
  const committenteSelezionato = committenti.find(c => c.id === form.committenteId)
  const formatSelezionato = formats.find(f => f.id === form.formatId)
  const tuttiArtisti = periodi.flatMap(p => p.artisti)
  const hasCompensoZero = tuttiArtisti.some(a => parseFloat(a.compensoNetto || '0') === 0)
  const hasQualificaAltro = tuttiArtisti.some(a => !isQualificaValida(a.qualifica))
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/agibilita" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuova Agibilità</h1>
            <p className="text-gray-500">Compila i dati della pratica</p>
          </div>
        </div>
        
        {/* Numero Prenotato */}
        {prenotazione ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <p className="text-sm text-blue-600">Numero prenotato</p>
            <p className="text-xl font-bold text-blue-800 font-mono">{prenotazione.codice}</p>
            <p className="text-xs text-blue-500 flex items-center gap-1">
              <Clock size={12} />
              Scade tra {prenotazione.minutiRimanenti} min
            </p>
          </div>
        ) : prenotando ? (
          <div className="bg-gray-50 rounded-lg px-4 py-2">
            <p className="text-sm text-gray-500">Prenotazione numero...</p>
          </div>
        ) : (
          <button onClick={() => prenotaNumero()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Prenota Numero
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}
      
      {reloadMessage && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm animate-pulse">
          {reloadMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Format (opzionale con checkbox) */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={usaFormat}
                onChange={(e) => {
                  setUsaFormat(e.target.checked)
                  if (!e.target.checked) {
                    setForm(prev => ({ ...prev, formatId: '' }))
                  }
                }}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <Layers size={18} className={usaFormat ? 'text-purple-600' : 'text-gray-400'} />
              <span className="font-medium">Associa a un Format</span>
            </label>
          </div>
          
          {usaFormat && (
            <div className="mt-2">
              <select
                name="formatId"
                value={form.formatId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-purple-50"
              >
                <option value="">Seleziona format...</option>
                {formats.map(f => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
              {formatSelezionato && (
                <div className="mt-2 p-2 bg-purple-50 rounded text-sm text-purple-700">
                  <strong>{formatSelezionato.nome}</strong>
                  {formatSelezionato.descrizione && <span> - {formatSelezionato.descrizione}</span>}
                  <br />
                  <span className="text-xs">Fatturazione: {formatSelezionato.tipoFatturazione === 'EVERYONE' ? 'Everyone Entertainment' : 'Committente'}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Locale e Committente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={20} />
              Locale (Dove) <span className="text-red-500">*</span>
            </h2>
            <AutocompleteLocale
              value={form.localeId || null}
              onChange={handleLocaleChange}
              placeholder="Cerca locale per nome, città..."
              onAddNew={() => setShowModalLocale(true)}
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 size={20} />
              Committente (Chi paga)
            </h2>
            
            {/* Se usa format con committenti associati, mostra solo quelli */}
            {usaFormat && formatSelezionato?.committenti && formatSelezionato.committenti.length > 0 ? (
              <div>
                <select
                  value={form.committenteId}
                  onChange={(e) => setForm(prev => ({ ...prev, committenteId: e.target.value }))}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-purple-50"
                >
                  <option value="">Seleziona committente del format...</option>
                  {formatSelezionato.committenti.map(fc => (
                    <option key={fc.committente.id} value={fc.committente.id}>
                      {fc.committente.ragioneSociale}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-purple-600 mt-1">
                  Committenti associati al format &quot;{formatSelezionato.nome}&quot;
                </p>
              </div>
            ) : (
              <AutocompleteCommittente
                value={form.committenteId || null}
                onChange={handleCommittenteChange}
                placeholder="Cerca committente per nome, P.IVA..."
                onAddNew={() => setShowModalCommittente(true)}
              />
            )}
            
            {!form.committenteId && (
              <div className="mt-2 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700 flex items-center gap-2">
                <AlertTriangle size={16} />
                Committente non selezionato - da inserire prima della fatturazione
              </div>
            )}
            {committenteSelezionato?.aRischio && (
              <div className="mt-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                ⚠️ Committente a rischio
              </div>
            )}
            {committenteSelezionato && (
              <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                💰 Quota committente: €{parseFloat(committenteSelezionato.quotaAgenzia || '0').toFixed(2)} per prestazione
              </div>
            )}
          </div>
        </div>
        
        {/* Flag Estera */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="estera"
                checked={form.estera}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Globe size={18} className={form.estera ? 'text-blue-600' : 'text-gray-400'} />
              <span className="font-medium">Agibilità Estera</span>
            </label>
            
            {form.estera && (
              <select
                name="paeseEstero"
                value={form.paeseEstero}
                onChange={handleChange}
                required={form.estera}
                className="px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleziona paese...</option>
                {PAESI_ESTERI.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        {/* PERIODI / OCCUPAZIONI */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={20} />
              Periodi e Artisti
            </h2>
            <button
              type="button"
              onClick={addPeriodo}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus size={18} />
              Aggiungi Periodo
            </button>
          </div>
          
          {periodi.map((periodo, index) => (
            <div key={periodo.id} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar size={18} className="text-blue-500" />
                  Periodo {index + 1}
                </h3>
                {periodi.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePeriodo(periodo.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Rimuovi periodo"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              
              {/* Date periodo */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inizio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={periodo.dataInizio}
                    onChange={(e) => updatePeriodo(periodo.id, 'dataInizio', e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Fine <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={periodo.dataFine}
                    onChange={(e) => updatePeriodo(periodo.id, 'dataFine', e.target.value)}
                    min={periodo.dataInizio}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Ricerca artisti */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Aggiungi artista</label>
                <AutocompleteArtista
                  key={`search-${periodo.id}-${periodo.artisti.length}`}
                  value={null}
                  onChange={(id, artista) => handleAddArtistaToPeriodo(periodo.id, id, artista)}
                  placeholder="Cerca per nome, cognome, nome d'arte..."
                  excludeIds={periodo.artisti.map(a => a.id)}
                  onAddNew={() => {
                    setModalArtistaPeriodoId(periodo.id)
                    setShowModalArtista(true)
                  }}
                />
              </div>
              
              {/* Lista artisti del periodo */}
              {periodo.artisti.length > 0 ? (
                <div className="space-y-2">
                  {periodo.artisti.map((artista) => {
                    const qualificaNonValida = !isQualificaValida(artista.qualifica)
                    
                    return (
                      <div 
                        key={artista.id} 
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          qualificaNonValida 
                            ? 'bg-amber-50 border border-amber-200' 
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {artista.cognome} {artista.nome}
                            {artista.nomeDarte && <span className="text-gray-500"> &quot;{artista.nomeDarte}&quot;</span>}
                            {(artista.tipoContratto === 'P_IVA' || artista.partitaIva) && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">P.IVA</span>
                            )}
                          </p>
                          {/* Mostra qualifica: se valida solo testo, se non valida dropdown */}
                          <div className="flex items-center gap-2 mt-1">
                            {qualificaNonValida ? (
                              <>
                                <select
                                  value={artista.qualifica || 'Altro'}
                                  onChange={(e) => handleArtistaQualificaChange(periodo.id, artista.id, e.target.value)}
                                  className="text-sm px-2 py-1 border border-amber-300 bg-amber-100 text-amber-800 rounded"
                                >
                                  {QUALIFICHE.map(q => (
                                    <option key={q.value} value={q.value}>{q.label}</option>
                                  ))}
                                </select>
                                <span className="text-xs text-amber-600 flex items-center gap-1">
                                  <AlertTriangle size={12} />
                                  Seleziona qualifica
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-500">
                                {artista.qualifica}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-32">
                            <input
                              type="number"
                              value={artista.compensoNetto}
                              onChange={(e) => handleArtistaCompensoChange(periodo.id, artista.id, e.target.value)}
                              min="0"
                              step="0.01"
                              placeholder="Netto €"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveArtistaFromPeriodo(periodo.id, artista.id)}
                            className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 border border-dashed border-gray-300 rounded-lg">
                  Nessun artista in questo periodo
                </div>
              )}
            </div>
          ))}
        </div>
        
        {hasCompensoZero && tuttiArtisti.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-700">
            <AlertTriangle size={18} />
            <span className="text-sm">Uno o più artisti hanno compenso a €0.</span>
          </div>
        )}
        
        {hasQualificaAltro && tuttiArtisti.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
            <AlertTriangle size={18} />
            <span className="text-sm">
              <strong>Attenzione:</strong> Uno o più artisti hanno qualifica &quot;Altro&quot;. Seleziona una qualifica valida prima di salvare.
            </span>
          </div>
        )}
        
        {/* Riepilogo Economico */}
        {tuttiArtisti.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator size={20} />
              Riepilogo Economico
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Totale Netto</p>
                <p className="text-xl font-bold">€{totali.netto.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Totale Lordo</p>
                <p className="text-xl font-bold">€{totali.lordo.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Ritenute (20%)</p>
                <p className="text-xl font-bold text-red-600">€{totali.ritenuta.toFixed(2)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Quota Committente</p>
                <p className="text-xl font-bold text-green-700">€{totali.quotaAgenzia.toFixed(2)}</p>
                <p className="text-xs text-green-500">
                  €{totali.quotaUnitaria.toFixed(2)} × {totali.numArtisti} prestazioni
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Importo Fattura</p>
                <p className="text-2xl font-bold text-blue-700">€{totali.importoFattura.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Note */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Note</h2>
          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/agibilita" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Annulla
          </Link>
          <button
            type="submit"
            disabled={loading || !prenotazione || tuttiArtisti.length === 0 || hasQualificaAltro}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'Creazione...' : 'Crea Agibilità'}
          </button>
        </div>
      </form>
      
      {/* Modal Nuovo Locale */}
      <Modal isOpen={showModalLocale} onClose={() => setShowModalLocale(false)} title="Aggiungi Nuovo Locale">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Locale *</label>
            <input
              type="text"
              value={nuovoLocale.nome}
              onChange={(e) => setNuovoLocale(prev => ({ ...prev, nome: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${erroriLocale.nome ? 'border-red-500' : 'border-gray-300'}`}
            />
            {erroriLocale.nome && <p className="text-xs text-red-500 mt-1">{erroriLocale.nome}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
            <input
              type="text"
              value={nuovoLocale.indirizzo}
              onChange={(e) => setNuovoLocale(prev => ({ ...prev, indirizzo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Città *</label>
              <input
                type="text"
                value={nuovoLocale.citta}
                onChange={(e) => setNuovoLocale(prev => ({ ...prev, citta: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg ${erroriLocale.citta ? 'border-red-500' : 'border-gray-300'}`}
              />
              {erroriLocale.citta && <p className="text-xs text-red-500 mt-1">{erroriLocale.citta}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
              <input
                type="text"
                value={nuovoLocale.provincia}
                onChange={(e) => setNuovoLocale(prev => ({ ...prev, provincia: e.target.value.toUpperCase().slice(0, 2) }))}
                className={`w-full px-3 py-2 border rounded-lg ${erroriLocale.provincia ? 'border-red-500' : 'border-gray-300'}`}
                maxLength={2}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
              <input
                type="text"
                value={nuovoLocale.cap}
                onChange={(e) => setNuovoLocale(prev => ({ ...prev, cap: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg ${erroriLocale.cap ? 'border-red-500' : 'border-gray-300'}`}
                maxLength={5}
              />
              {erroriLocale.cap && <p className="text-xs text-red-500 mt-1">{erroriLocale.cap}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Codice Belfiore *</label>
              <input
                type="text"
                value={nuovoLocale.codiceBelfiore}
                onChange={(e) => setNuovoLocale(prev => ({ ...prev, codiceBelfiore: e.target.value.toUpperCase() }))}
                className={`w-full px-3 py-2 border rounded-lg uppercase ${erroriLocale.codiceBelfiore ? 'border-red-500' : 'border-gray-300'}`}
                maxLength={4}
                placeholder="es. F205"
              />
              {erroriLocale.codiceBelfiore && <p className="text-xs text-red-500 mt-1">{erroriLocale.codiceBelfiore}</p>}
              <p className="text-xs text-gray-400 mt-1">Codice catastale comune (4 caratteri)</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Referente</label>
            <input
              type="email"
              value={nuovoLocale.referenteEmail}
              onChange={(e) => setNuovoLocale(prev => ({ ...prev, referenteEmail: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${erroriLocale.referenteEmail ? 'border-red-500' : 'border-gray-300'}`}
            />
            {erroriLocale.referenteEmail && <p className="text-xs text-red-500 mt-1">{erroriLocale.referenteEmail}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModalLocale(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annulla</button>
            <button type="button" onClick={handleSaveLocale} disabled={savingLocale} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {savingLocale ? 'Salvataggio...' : 'Salva e Seleziona'}
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Modal Nuovo Committente */}
      <Modal isOpen={showModalCommittente} onClose={() => setShowModalCommittente(false)} title="Aggiungi Nuovo Committente">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ragione Sociale *</label>
            <input
              type="text"
              value={nuovoCommittente.ragioneSociale}
              onChange={(e) => setNuovoCommittente(prev => ({ ...prev, ragioneSociale: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${erroriCommittente.ragioneSociale ? 'border-red-500' : 'border-gray-300'}`}
            />
            {erroriCommittente.ragioneSociale && <p className="text-xs text-red-500 mt-1">{erroriCommittente.ragioneSociale}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partita IVA</label>
              <input
                type="text"
                value={nuovoCommittente.partitaIva}
                onChange={(e) => setNuovoCommittente(prev => ({ ...prev, partitaIva: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg ${erroriCommittente.partitaIva ? 'border-red-500' : 'border-gray-300'}`}
                maxLength={11}
              />
              {erroriCommittente.partitaIva && <p className="text-xs text-red-500 mt-1">{erroriCommittente.partitaIva}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale</label>
              <input
                type="text"
                value={nuovoCommittente.codiceFiscale}
                onChange={(e) => setNuovoCommittente(prev => ({ ...prev, codiceFiscale: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                maxLength={16}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={nuovoCommittente.email}
              onChange={(e) => setNuovoCommittente(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${erroriCommittente.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {erroriCommittente.email && <p className="text-xs text-red-500 mt-1">{erroriCommittente.email}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModalCommittente(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annulla</button>
            <button type="button" onClick={handleSaveCommittente} disabled={savingCommittente} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {savingCommittente ? 'Salvataggio...' : 'Salva e Seleziona'}
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Modal Nuovo Artista */}
      <Modal isOpen={showModalArtista} onClose={() => { setShowModalArtista(false); setModalArtistaPeriodoId(null) }} title="Aggiungi Nuovo Artista">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                value={nuovoArtista.nome}
                onChange={(e) => setNuovoArtista(prev => ({ ...prev, nome: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg ${erroriArtista.nome ? 'border-red-500' : 'border-gray-300'}`}
              />
              {erroriArtista.nome && <p className="text-xs text-red-500 mt-1">{erroriArtista.nome}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
              <input
                type="text"
                value={nuovoArtista.cognome}
                onChange={(e) => setNuovoArtista(prev => ({ ...prev, cognome: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg ${erroriArtista.cognome ? 'border-red-500' : 'border-gray-300'}`}
              />
              {erroriArtista.cognome && <p className="text-xs text-red-500 mt-1">{erroriArtista.cognome}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale *</label>
            <input
              type="text"
              value={nuovoArtista.codiceFiscale}
              onChange={(e) => setNuovoArtista(prev => ({ ...prev, codiceFiscale: e.target.value.toUpperCase() }))}
              className={`w-full px-3 py-2 border rounded-lg ${erroriArtista.codiceFiscale ? 'border-red-500' : 'border-gray-300'}`}
              maxLength={16}
            />
            {erroriArtista.codiceFiscale && <p className="text-xs text-red-500 mt-1">{erroriArtista.codiceFiscale}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome d&apos;arte</label>
              <input
                type="text"
                value={nuovoArtista.nomeDarte}
                onChange={(e) => setNuovoArtista(prev => ({ ...prev, nomeDarte: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualifica</label>
              <select
                value={nuovoArtista.qualifica}
                onChange={(e) => setNuovoArtista(prev => ({ ...prev, qualifica: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {QUALIFICHE.map(q => (
                  <option key={q.value} value={q.value}>{q.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={nuovoArtista.email}
              onChange={(e) => setNuovoArtista(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${erroriArtista.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {erroriArtista.email && <p className="text-xs text-red-500 mt-1">{erroriArtista.email}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => { setShowModalArtista(false); setModalArtistaPeriodoId(null) }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annulla</button>
            <button type="button" onClick={handleSaveArtista} disabled={savingArtista} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {savingArtista ? 'Salvataggio...' : 'Salva e Aggiungi'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}