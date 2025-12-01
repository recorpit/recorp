// src/app/api/sistema/backup/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    // Esporta tutti i dati in formato JSON
    const [
      artisti,
      committenti,
      locali,
      agibilita,
      prestazioni,
      impostazioni
    ] = await Promise.all([
      prisma.artista.findMany(),
      prisma.committente.findMany(),
      prisma.locale.findMany(),
      prisma.agibilita.findMany({
        include: {
          partecipazioni: true
        }
      }),
      prisma.prestazioneOccasionale.findMany(),
      prisma.impostazioni.findMany(),
    ])
    
    const backup = {
      version: '3.6.0',
      exportDate: new Date().toISOString(),
      data: {
        artisti,
        committenti,
        locali,
        agibilita,
        prestazioni,
        impostazioni,
      },
      counts: {
        artisti: artisti.length,
        committenti: committenti.length,
        locali: locali.length,
        agibilita: agibilita.length,
        prestazioni: prestazioni.length,
      }
    }
    
    const jsonString = JSON.stringify(backup, null, 2)
    const buffer = Buffer.from(jsonString, 'utf-8')
    
    // Log backup
    await prisma.impostazioni.upsert({
      where: { chiave: 'lastBackup' },
      update: { valore: new Date().toISOString(), updatedAt: new Date() },
      create: { chiave: 'lastBackup', valore: new Date().toISOString() }
    })
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="recorp_backup_${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Errore backup:', error)
    return NextResponse.json({ error: 'Errore durante il backup' }, { status: 500 })
  }
}
