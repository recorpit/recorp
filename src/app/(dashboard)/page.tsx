// src/app/(dashboard)/page.tsx
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { 
  Users, 
  MapPin, 
  Building2, 
  FileText, 
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// ... resto del codice
async function getStats() {
  const [
    totaleArtisti,
    artistiNonIscritti,
    totaleLocali,
    totaleCommittenti,
    committentiRischio,
    totaleAgibilita,
    agibilitaBozza,
    agibilitaDaCompletare,
    agibilitaCompletate,
    pagamentiPendenti,
  ] = await Promise.all([
    prisma.artista.count(),
    prisma.artista.count({ where: { iscritto: false } }),
    prisma.locale.count(),
    prisma.committente.count(),
    prisma.committente.count({ where: { aRischio: true } }), // CORRETTO: aRischio
    prisma.agibilita.count(),
    prisma.agibilita.count({ where: { stato: 'BOZZA' } }),
    prisma.agibilita.count({ 
      where: { 
        stato: { in: ['DATI_INCOMPLETI', 'PRONTA', 'INVIATA_INPS'] } 
      } 
    }),
    prisma.agibilita.count({ where: { stato: 'COMPLETATA' } }),
    prisma.agibilita.count({ 
      where: { 
        artisti: { 
          some: { statoPagamento: 'DA_PAGARE' } 
        } 
      } 
    }),
  ])
  
  return {
    totaleArtisti,
    artistiNonIscritti,
    totaleLocali,
    totaleCommittenti,
    committentiRischio,
    totaleAgibilita,
    agibilitaBozza,
    agibilitaDaCompletare,
    agibilitaCompletate,
    pagamentiPendenti,
  }
}

async function getAgibilitaRecenti() {
  return prisma.agibilita.findMany({
    where: {
      stato: { not: 'COMPLETATA' }
    },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: {
      artisti: { 
        include: {
          artista: { select: { nome: true, cognome: true, nomeDarte: true } }
        }
      },
      locale: { select: { nome: true, citta: true } },
      committente: { select: { ragioneSociale: true, aRischio: true } }, // CORRETTO: aRischio
    }
  })
}

async function getBozzeAttive() {
  // Usa BozzaAgibilita (il modello reale nel DB)
  return prisma.bozzaAgibilita.findMany({
    where: { stato: 'IN_LAVORAZIONE' },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: {
      User_BozzaAgibilita_creatoDaIdToUser: { select: { nome: true, cognome: true } },
      User_BozzaAgibilita_lockedByIdToUser: { select: { nome: true, cognome: true } },
    }
  })
}

export default async function DashboardPage() {
  const stats = await getStats()
  const agibilitaRecenti = await getAgibilitaRecenti()
  const bozzeAttive = await getBozzeAttive()
  
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Panoramica del sistema RECORP</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Artisti */}
        <Link href="/artisti" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Artisti</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totaleArtisti}</p>
              {stats.artistiNonIscritti > 0 && (
                <p className="text-sm text-yellow-600 mt-1">
                  {stats.artistiNonIscritti} non iscritti
                </p>
              )}
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </Link>
        
        {/* Locali */}
        <Link href="/locali" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Locali</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totaleLocali}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <MapPin className="text-green-600" size={24} />
            </div>
          </div>
        </Link>
        
        {/* Committenti */}
        <Link href="/committenti" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Committenti</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totaleCommittenti}</p>
              {stats.committentiRischio > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  {stats.committentiRischio} a rischio
                </p>
              )}
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Building2 className="text-purple-600" size={24} />
            </div>
          </div>
        </Link>
        
        {/* Agibilita */}
        <Link href="/agibilita" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Agibilità</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totaleAgibilita}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.agibilitaDaCompletare} da completare
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <FileText className="text-orange-600" size={24} />
            </div>
          </div>
        </Link>
      </div>
      
      {/* Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agibilità da completare */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Agibilità da completare
            </h2>
            <Link 
              href="/agibilita?stato=DATI_INCOMPLETI"
              className="text-sm text-blue-600 hover:underline"
            >
              Vedi tutte
            </Link>
          </div>
          
          {agibilitaRecenti.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
              <p>Nessuna agibilità in sospeso</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agibilitaRecenti.map((ag: any) => {
                const primoArtista = ag.artisti[0]?.artista
                const numArtisti = ag.artisti.length
                
                return (
                  <Link 
                    key={ag.id}
                    href={`/agibilita/${ag.id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {primoArtista?.nomeDarte || `${primoArtista?.nome} ${primoArtista?.cognome}`}
                          {numArtisti > 1 && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              +{numArtisti - 1}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {ag.locale.nome} - {ag.locale.citta}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(ag.data).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {ag.committente?.aRischio && (
                          <span className="text-red-500" title="Committente a rischio">
                            <AlertTriangle size={16} />
                          </span>
                        )}
                        <span className={`
                          px-2 py-1 rounded text-xs font-medium
                          ${ag.stato === 'BOZZA' ? 'bg-gray-100 text-gray-700' : ''}
                          ${ag.stato === 'DATI_INCOMPLETI' ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${ag.stato === 'PRONTA' ? 'bg-blue-100 text-blue-700' : ''}
                          ${ag.stato === 'INVIATA_INPS' ? 'bg-purple-100 text-purple-700' : ''}
                          ${ag.stato === 'ERRORE' ? 'bg-red-100 text-red-700' : ''}
                        `}>
                          {ag.stato.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Bozze attive */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Bozze in lavorazione
            </h2>
            <Link 
              href="/agibilita/nuova"
              className="text-sm text-blue-600 hover:underline"
            >
              Nuova agibilità
            </Link>
          </div>
          
          {bozzeAttive.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="mx-auto mb-2 text-gray-400" size={32} />
              <p>Nessuna bozza attiva</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bozzeAttive.map((bozza: any) => {
                const isLocked = bozza.lockedById && bozza.lockScadeAt && new Date() < bozza.lockScadeAt
                const creatoDa = bozza.User_BozzaAgibilita_creatoDaIdToUser
                const lockedBy = bozza.User_BozzaAgibilita_lockedByIdToUser
                
                return (
                  <div 
                    key={bozza.id}
                    className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {bozza.codicePrenotato || 'Bozza senza numero'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Completamento: {bozza.percentualeCompletamento}%
                        </p>
                        <div className="w-32 h-2 bg-gray-200 rounded mt-1">
                          <div 
                            className="h-full bg-blue-500 rounded"
                            style={{ width: `${bozza.percentualeCompletamento}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        {isLocked ? (
                          <span className="text-xs text-yellow-600">
                            🔒 {lockedBy?.nome || bozza.lockedByName}
                          </span>
                        ) : (
                          <Link
                            href={`/agibilita/nuova?bozza=${bozza.id}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Riprendi
                          </Link>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(bozza.updatedAt).toLocaleString('it-IT')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Stats Footer */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.agibilitaCompletate}</p>
          <p className="text-sm text-gray-500">Completate</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.agibilitaBozza}</p>
          <p className="text-sm text-gray-500">Bozze</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.pagamentiPendenti}</p>
          <p className="text-sm text-gray-500">Pagamenti pendenti</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.committentiRischio}</p>
          <p className="text-sm text-gray-500">Committenti a rischio</p>
        </div>
      </div>
    </div>
  )
}