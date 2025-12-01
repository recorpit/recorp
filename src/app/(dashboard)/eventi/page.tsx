import Link from 'next/link'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export default async function EventiPage() {
  const eventi = await prisma.evento.findMany({
    include: {
      locale: true,
      artista: true,
      agibilita: true
    },
    orderBy: { data: 'desc' }
  })

  const statoVariant = (stato: string) => {
    switch (stato) {
      case 'BOZZA': return 'default'
      case 'CONFERMATO': return 'info'
      case 'IN_CORSO': return 'warning'
      case 'COMPLETATO': return 'success'
      case 'ANNULLATO': return 'danger'
      default: return 'default'
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Eventi</h1>
        <Link
          href="/eventi/nuovo"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuovo Evento
        </Link>
      </div>

      {eventi.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center text-slate-500">
          Nessun evento registrato. Clicca su "Nuovo Evento" per iniziare.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Data</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Evento</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Locale</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Artista</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Compenso</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Stato</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Agibilità</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {eventi.map((evento) => (
                <tr key={evento.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">
                    {formatDate(new Date(evento.data))}
                  </td>
                  <td className="px-6 py-4">
                    {evento.nome || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">{evento.locale.nome}</span>
                    {evento.locale.cittaEvento && (
                      <span className="block text-sm text-slate-500">{evento.locale.cittaEvento}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {evento.artista ? `${evento.artista.cognome} ${evento.artista.nome}` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {evento.compensoLordo ? `€ ${Number(evento.compensoLordo).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statoVariant(evento.stato)}>
                      {evento.stato}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {evento.agibilita.length > 0 ? (
                      <Badge variant="success">Creata</Badge>
                    ) : (
                      <Badge variant="default">Da creare</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/eventi/${evento.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Modifica
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}