// src/app/api/sistema/cleanup/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    let deleted = 0
    
    // 1. Elimina token firma scaduti (più vecchi di 30 giorni)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // Nota: questo è un esempio, adatta in base al tuo schema
    // Se hai una tabella tokens separata, usa quella
    
    // 2. Pulisci prestazioni in stato BOZZA più vecchie di 60 giorni
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
    
    const deletedPrestazioni = await prisma.prestazioneOccasionale.deleteMany({
      where: {
        stato: 'GENERATA',
        createdAt: { lt: sixtyDaysAgo },
        dataFirma: null, // Non firmate
      }
    })
    deleted += deletedPrestazioni.count
    
    // 3. Pulisci agibilità in stato BOZZA più vecchie di 90 giorni
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    
    const deletedAgibilita = await prisma.agibilita.deleteMany({
      where: {
        stato: 'BOZZA',
        createdAt: { lt: ninetyDaysAgo },
      }
    })
    deleted += deletedAgibilita.count
    
    // 4. Elimina partecipazioni orfane
    // (partecipazioni senza agibilità associata - possono esistere per bug precedenti)
    const orphanedPartecipazioni = await prisma.$executeRaw`
      DELETE FROM "Partecipazione" 
      WHERE "agibilitaId" NOT IN (SELECT id FROM "Agibilita")
    `
    deleted += Number(orphanedPartecipazioni) || 0
    
    // Log cleanup
    await prisma.impostazioni.upsert({
      where: { chiave: 'lastCleanup' },
      update: { 
        valore: JSON.stringify({ date: new Date().toISOString(), deleted }), 
        updatedAt: new Date() 
      },
      create: { 
        chiave: 'lastCleanup', 
        valore: JSON.stringify({ date: new Date().toISOString(), deleted }) 
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      deleted,
      details: {
        prestazioni: deletedPrestazioni.count,
        agibilita: deletedAgibilita.count,
      }
    })
  } catch (error) {
    console.error('Errore cleanup:', error)
    return NextResponse.json({ error: 'Errore durante la pulizia' }, { status: 500 })
  }
}
