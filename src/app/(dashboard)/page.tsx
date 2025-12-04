// src/app/(dashboard)/page.tsx
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { 
  Users, 
  FileText, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Euro,
  TrendingUp,
  Calendar,
  FileCheck,
  Receipt,
  ArrowRight,
  UserCheck,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getStats() {
  const oggi = new Date()
  oggi.setHours(0, 0, 0, 0)
  
  const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1)
  const fineMese = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0, 23, 59, 59)
  
  const inizioAnno = new Date(oggi.getFullYear(), 0, 1)
  const fineAnno = new Date(oggi.getFullYear(), 11, 31, 23, 59, 59)
  
  const [
    // Task aperti
    agibilitaDaFatturare,
    agibilitaBozza,
    agibilitaDatiIncompleti,
    pagamentiDaPagare,
    bozzeAttive,
    
    // Statistiche generali
    totaleAgibilita,
    agibilitaCompletate,
    agibilitaCompletateMese,
    agibilitaCompletateAnno,
    
    // Artisti in regola
    presenzeArtistitotali,
    presenzeArtistiMese,
    presenzeArtistiAnno,
    artistiSingoliAnno,
    
    // Fatturato
    fatturatoMese,
    fatturatoAnno,
    
    // Anagrafiche
    totaleArtisti,
    totaleLocali,
    totaleCommittenti,
  ] = await Promise.all([
    // Task aperti
    prisma.agibilita.count({ 
      where: { 
        stato: 'COMPLETATA',
        statoFattura: 'DA_FATTURARE'
      } 
    }),
    prisma.agibilita.count({ where: { stato: 'BOZZA' } }),
    prisma.agibilita.count({ where: { stato: 'DATI_INCOMPLETI' } }),
    prisma.artistaAgibilita.count({ 
      where: { statoPagamento: 'DA_PAGARE' } 
    }),
    prisma.bozzaAgibilita.count({ where: { stato: 'IN_LAVORAZIONE' } }),
    
    // Statistiche generali
    prisma.agibilita.count(),
    prisma.agibilita.count({ where: { stato: 'COMPLETATA' } }),
    prisma.agibilita.count({ 
      where: { 
        stato: 'COMPLETATA',
        data: { gte: inizioMese, lte: fineMese }
      } 
    }),
    prisma.agibilita.count({ 
      where: { 
        stato: 'COMPLETATA',
        data: { gte: inizioAnno, lte: fineAnno }
      } 
    }),
    
    // Artisti in regola (presenze)
    prisma.artistaAgibilita.count({
      where: { agibilita: { stato: 'COMPLETATA' } }
    }),
    prisma.artistaAgibilita.count({
      where: {
        agibilita: {
          stato: 'COMPLETATA',
          data: { gte: inizioMese, lte: fineMese }
        }
      }
    }),
    prisma.artistaAgibilita.count({
      where: {
        agibilita: {
          stato: 'COMPLETATA',
          data: { gte: inizioAnno, lte: fineAnno }
        }
      }
    }),
    prisma.artistaAgibilita.groupBy({
      by: ['artistaId'],
      where: {
        agibilita: {
          stato: 'COMPLETATA',
          data: { gte: inizioAnno, lte: fineAnno }
        }
      }
    }),
    
    // Fatturato
    prisma.agibilita.aggregate({
      where: {
        data: { gte: inizioMese, lte: fineMese },
        statoFattura: 'FATTURATA'
      },
      _sum: { importoFattura: true }
    }),
    prisma.agibilita.aggregate({
      where: {
        data: { gte: inizioAnno, lte: fineAnno },
        statoFattura: 'FATTURATA'
      },
      _sum: { importoFattura: true }
    }),
    
    // Anagrafiche
    prisma.artista.count(),
    prisma.locale.count(),
    prisma.committente.count(),
  ])
  
  return {
    task: {
      daFatturare: agibilitaDaFatturare,
      bozze: agibilitaBozza,
      datiIncompleti: agibilitaDatiIncompleti,
      pagamentiDaPagare,
      bozzeAttive,
    },
    agibilita: {
      totale: totaleAgibilita,
      completate: agibilitaCompletate,
      completateMese: agibilitaCompletateMese,
      completateAnno: agibilitaCompletateAnno,
    },
    artistiInRegola: {
      presenzeTotali: presenzeArtistitotali,
      presenzeMese: presenzeArtistiMese,
      presenzeAnno: presenzeArtistiAnno,
      artistiSingoli: artistiSingoliAnno.length,
      mediaPerDocumento: agibilitaCompletateAnno > 0 
        ? Math.round((presenzeArtistiAnno / agibilitaCompletateAnno) * 100) / 100 
        : 0,
    },
    fatturato: {
      mese: parseFloat(fatturatoMese._sum.importoFattura?.toString() || '0'),
      anno: parseFloat(fatturatoAnno._sum.importoFattura?.toString() || '0'),
    },
    anagrafiche: {
      artisti: totaleArtisti,
      locali: totaleLocali,
      committenti: totaleCommittenti,
    },
  }
}

async function getAgibilitaDaCompletare() {
  return prisma.agibilita.findMany({
    where: {
      stato: { in: ['BOZZA', 'DATI_INCOMPLETI'] }
    },
    take: 5,
    orderBy: { data: 'asc' },
    include: {
      artisti: { 
        include: {
          artista: { select: { nome: true, cognome: true, nomeDarte: true } }
        },
        take: 1
      },
      locale: { select: { nome: true } },
    }
  })
}

async function getAgibilitaDaFatturare() {
  return prisma.agibilita.findMany({
    where: {
      stato: 'COMPLETATA',
      statoFattura: 'DA_FATTURARE'
    },
    take: 5,
    orderBy: { data: 'asc' },
    include: {
      locale: { select: { nome: true } },
      committente: { select: { ragioneSociale: true } },
      _count: { select: { artisti: true } }
    }
  })
}

async function getBozzeAttive() {
  return prisma.bozzaAgibilita.findMany({
    where: { stato: 'IN_LAVORAZIONE' },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: {
      User_BozzaAgibilita_creatoDaIdToUser: { select: { nome: true, cognome: true } },
    }
  })
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('it-IT').format(value)
}

export default async function DashboardPage() {
  const stats = await getStats()
  const agibilitaDaCompletare = await getAgibilitaDaCompletare()
  const agibilitaDaFatturare = await getAgibilitaDaFatturare()
  const bozzeAttive = await getBozzeAttive()
  
  const taskTotali = stats.task.daFatturare + stats.task.bozze + stats.task.datiIncompleti
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Panoramica RECORP</p>
      </div>
      
      {/* SEZIONE 1: Task Aperti - Alert Box */}
      {taskTotali > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="text-amber-600" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Attività in sospeso</h2>
              <p className="text-sm text-gray-600">{taskTotali} elementi richiedono attenzione</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Da Fatturare */}
            {stats.task.daFatturare > 0 && (
              <Link 
                href="/agibilita?statoFattura=DA_FATTURARE"
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-amber-100 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Receipt className="text-amber-600" size={20} />
                  <div>
                    <p className="font-semibold text-gray-900">{stats.task.daFatturare}</p>
                    <p className="text-sm text-gray-500">Da fatturare</p>
                  </div>
                </div>
                <ArrowRight className="text-gray-400" size={16} />
              </Link>
            )}
            
            {/* Bozze + Dati Incompleti */}
            {(stats.task.bozze + stats.task.datiIncompleti) > 0 && (
              <Link 
                href="/agibilita?stato=BOZZA,DATI_INCOMPLETI"
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-amber-100 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-600" size={20} />
                  <div>
                    <p className="font-semibold text-gray-900">{stats.task.bozze + stats.task.datiIncompleti}</p>
                    <p className="text-sm text-gray-500">Da completare</p>
                  </div>
                </div>
                <ArrowRight className="text-gray-400" size={16} />
              </Link>
            )}
            
            {/* Pagamenti */}
            {stats.task.pagamentiDaPagare > 0 && (
              <Link 
                href="/tesoreria?stato=DA_PAGARE"
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-amber-100 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Euro className="text-green-600" size={20} />
                  <div>
                    <p className="font-semibold text-gray-900">{stats.task.pagamentiDaPagare}</p>
                    <p className="text-sm text-gray-500">Pagamenti artisti</p>
                  </div>
                </div>
                <ArrowRight className="text-gray-400" size={16} />
              </Link>
            )}
          </div>
        </div>
      )}
      
      {/* SEZIONE 2: Liste Task */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agibilità da completare */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="text-blue-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Agibilità da completare</h2>
            </div>
            <Link 
              href="/agibilita?stato=BOZZA,DATI_INCOMPLETI"
              className="text-sm text-blue-600 hover:underline"
            >
              Vedi tutte
            </Link>
          </div>
          
          {agibilitaDaCompletare.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
              <p>Tutto completato!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {agibilitaDaCompletare.map((ag: any) => {
                const primoArtista = ag.artisti[0]?.artista
                return (
                  <Link 
                    key={ag.id}
                    href={`/agibilita/${ag.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {ag.codice}
                      </p>
                      <p className="text-sm text-gray-500">
                        {ag.locale?.nome} • {new Date(ag.data).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <span className={`
                      px-2 py-1 rounded text-xs font-medium
                      ${ag.stato === 'BOZZA' ? 'bg-gray-100 text-gray-700' : ''}
                      ${ag.stato === 'DATI_INCOMPLETI' ? 'bg-yellow-100 text-yellow-700' : ''}
                    `}>
                      {ag.stato === 'BOZZA' ? 'Bozza' : 'Incompleta'}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Da Fatturare */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="text-amber-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Da fatturare</h2>
            </div>
            <Link 
              href="/agibilita?statoFattura=DA_FATTURARE"
              className="text-sm text-blue-600 hover:underline"
            >
              Vedi tutte
            </Link>
          </div>
          
          {agibilitaDaFatturare.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
              <p>Tutto fatturato!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {agibilitaDaFatturare.map((ag: any) => (
                <Link 
                  key={ag.id}
                  href={`/agibilita/${ag.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {ag.codice}
                    </p>
                    <p className="text-sm text-gray-500">
                      {ag.committente?.ragioneSociale || ag.locale?.nome} • {ag._count.artisti} artisti
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(ag.data).toLocaleDateString('it-IT')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* SEZIONE 3: KPI Principali */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Artisti in regola (anno) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="text-green-600" size={20} />
            <p className="text-sm text-gray-500">Artisti in regola</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatNumber(stats.artistiInRegola.presenzeAnno)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.artistiInRegola.artistiSingoli} artisti unici
          </p>
        </div>
        
        {/* Documenti (anno) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="text-blue-600" size={20} />
            <p className="text-sm text-gray-500">Documenti</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatNumber(stats.agibilita.completateAnno)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Media {stats.artistiInRegola.mediaPerDocumento} artisti/doc
          </p>
        </div>
        
        {/* Fatturato mese */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <Euro className="text-emerald-600" size={20} />
            <p className="text-sm text-gray-500">Fatturato mese</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.fatturato.mese)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.agibilita.completateMese} agibilità
          </p>
        </div>
        
        {/* Fatturato anno */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-purple-600" size={20} />
            <p className="text-sm text-gray-500">Fatturato anno</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.fatturato.anno)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.agibilita.completateAnno} agibilità
          </p>
        </div>
      </div>
      
      {/* SEZIONE 4: Bozze in lavorazione */}
      {bozzeAttive.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="text-gray-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Bozze in lavorazione</h2>
            </div>
            <Link 
              href="/agibilita/nuova"
              className="text-sm text-blue-600 hover:underline"
            >
              Nuova agibilità
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bozzeAttive.map((bozza: any) => {
              const creatoDa = bozza.User_BozzaAgibilita_creatoDaIdToUser
              return (
                <Link
                  key={bozza.id}
                  href={`/agibilita/nuova?bozza=${bozza.id}`}
                  className="p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">
                      {bozza.codicePrenotato || 'Senza numero'}
                    </p>
                    <span className="text-xs text-gray-500">
                      {bozza.percentualeCompletamento}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded">
                    <div 
                      className="h-full bg-blue-500 rounded transition-all"
                      style={{ width: `${bozza.percentualeCompletamento}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {creatoDa?.nome} {creatoDa?.cognome} • {new Date(bozza.updatedAt).toLocaleDateString('it-IT')}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      )}
      
      {/* SEZIONE 5: Quick Stats Anagrafiche */}
      <div className="grid grid-cols-3 gap-4">
        <Link 
          href="/artisti"
          className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow"
        >
          <Users className="mx-auto mb-2 text-blue-600" size={24} />
          <p className="text-2xl font-bold text-gray-900">{stats.anagrafiche.artisti}</p>
          <p className="text-sm text-gray-500">Artisti</p>
        </Link>
        <Link 
          href="/locali"
          className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow"
        >
          <Calendar className="mx-auto mb-2 text-green-600" size={24} />
          <p className="text-2xl font-bold text-gray-900">{stats.anagrafiche.locali}</p>
          <p className="text-sm text-gray-500">Locali</p>
        </Link>
        <Link 
          href="/committenti"
          className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow"
        >
          <TrendingUp className="mx-auto mb-2 text-purple-600" size={24} />
          <p className="text-2xl font-bold text-gray-900">{stats.anagrafiche.committenti}</p>
          <p className="text-sm text-gray-500">Committenti</p>
        </Link>
      </div>
    </div>
  )
}