'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const statiEvento = [
  { value: 'BOZZA', label: 'Bozza' },
  { value: 'CONFERMATO', label: 'Confermato' },
  { value: 'IN_CORSO', label: 'In corso' },
  { value: 'COMPLETATO', label: 'Completato' },
  { value: 'ANNULLATO', label: 'Annullato' },
]

export default function NuovoEventoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locali, setLocali] = useState<any[]>([])
  const [artisti, setArtisti] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    localeId: '',
    artistaId: '',
    nome: '',
    data: '',
    oraInizio: '',
    oraFine: '',
    compensoLordo: '',
    compensoNetto: '',
    speseViaggio: '',
    speseAlloggio: '',
    stato: 'BOZZA',
    note: '',
    noteInterne: '',
  })

  useEffect(() => {
    fetchLocali()
    fetchArtisti()
  }, [])

  const fetchLocali = async () => {
    const response = await fetch('/api/locali')
    const data = await response.json()
    setLocali(data)
  }

  const fetchArtisti = async () => {
    const response = await fetch('/api/artisti')
    const data = await response.json()
    setArtisti(data)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/eventi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          artistaId: formData.artistaId || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Errore nella creazione')
      }

      router.push('/eventi')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/eventi" className="p-2 hover:bg-slate-200 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Nuovo Evento</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dettagli Evento */}
          <Card>
            <CardHeader>
              <CardTitle>Dettagli Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Locale *"
                name="localeId"
                value={formData.localeId}
                onChange={handleChange}
                required
                options={[
                  { value: '', label: 'Seleziona locale...' },
                  ...locali.map(l => ({ value: l.id, label: l.nome }))
                ]}
              />
              <Select
                label="Artista"
                name="artistaId"
                value={formData.artistaId}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Nessun artista' },
                  ...artisti.map(a => ({ value: a.id, label: `${a.cognome} ${a.nome}${a.nomeDarte ? ` (${a.nomeDarte})` : ''}` }))
                ]}
              />
              <Input
                label="Nome evento"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Es. Serata Latino, Aperitivo Live..."
              />
              <Input
                label="Data *"
                name="data"
                type="date"
                value={formData.data}
                onChange={handleChange}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Ora inizio"
                  name="oraInizio"
                  type="time"
                  value={formData.oraInizio}
                  onChange={handleChange}
                />
                <Input
                  label="Ora fine"
                  name="oraFine"
                  type="time"
                  value={formData.oraFine}
                  onChange={handleChange}
                />
              </div>
              <Select
                label="Stato"
                name="stato"
                value={formData.stato}
                onChange={handleChange}
                options={statiEvento}
              />
            </CardContent>
          </Card>

          {/* Economica */}
          <Card>
            <CardHeader>
              <CardTitle>Dati Economici</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Compenso lordo (€)"
                name="compensoLordo"
                type="number"
                step="0.01"
                value={formData.compensoLordo}
                onChange={handleChange}
              />
              <Input
                label="Compenso netto (€)"
                name="compensoNetto"
                type="number"
                step="0.01"
                value={formData.compensoNetto}
                onChange={handleChange}
              />
              <Input
                label="Spese viaggio (€)"
                name="speseViaggio"
                type="number"
                step="0.01"
                value={formData.speseViaggio}
                onChange={handleChange}
              />
              <Input
                label="Spese alloggio (€)"
                name="speseAlloggio"
                type="number"
                step="0.01"
                value={formData.speseAlloggio}
                onChange={handleChange}
              />
            </CardContent>
          </Card>

          {/* Note */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Note interne</label>
                <textarea
                  name="noteInterne"
                  value={formData.noteInterne}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/eventi">
            <Button type="button" variant="secondary">Annulla</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save size={20} className="mr-2" />
            {loading ? 'Salvataggio...' : 'Salva Evento'}
          </Button>
        </div>
      </form>
    </div>
  )
}