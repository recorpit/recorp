// src/app/api/import/formats/route.ts
// API per import format da Excel DATABASE_RECORP

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Lista format da importare con normalizzazione
// Esclusi: Piterpan (partner), Berti (partner), interni (LMDT, MDT, Macchina del Tempo)
const FORMATS_CONFIG = [
  { nome: '90 WONDERLAND', aliases: ['WONDERLAND', '2000 WONDERLAND', '90WONDERLAND'], tipo: 'PUBBLICO' },
  { nome: 'BESAME', aliases: [], tipo: 'PUBBLICO' },
  { nome: 'TWISH', aliases: [], tipo: 'PUBBLICO' },
  { nome: 'SUAVEMENTE', aliases: [], tipo: 'PUBBLICO' },
  { nome: 'ASBRONZATISSIMI', aliases: [], tipo: 'PUBBLICO' },
  { nome: 'CUORE MATTO', aliases: [], tipo: 'PUBBLICO' },
  { nome: 'SWING', aliases: [], tipo: 'PUBBLICO' },
  { nome: 'CRASH', aliases: [], tipo: 'PUBBLICO' },
  { nome: '2000 CHE STORIES', aliases: [], tipo: 'PUBBLICO' },
  { nome: 'BEAT', aliases: [], tipo: 'PUBBLICO' },
  { nome: '90 TIME', aliases: [], tipo: 'PUBBLICO' },
  { nome: 'BAILAMOS', aliases: [], tipo: 'PUBBLICO' },
]

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const body = await request.json()
    const dryRun = body.dryRun === true
    
    const result = {
      totale: FORMATS_CONFIG.length,
      creati: 0,
      esistenti: 0,
      errori: [] as string[],
      dettagli: [] as any[]
    }
    
    for (const formatConfig of FORMATS_CONFIG) {
      try {
        // Controlla se esiste già
        const esistente = await prisma.format.findFirst({
          where: {
            OR: [
              { nome: formatConfig.nome },
              { nome: { in: formatConfig.aliases } }
            ]
          }
        })
        
        if (esistente) {
          result.esistenti++
          result.dettagli.push({
            nome: formatConfig.nome,
            stato: 'ESISTENTE',
            id: esistente.id
          })
          continue
        }
        
        if (!dryRun) {
          // Crea il format
          const nuovo = await prisma.format.create({
            data: {
              nome: formatConfig.nome,
              descrizione: formatConfig.tipo === 'INTERNO' 
                ? 'Format interno - servizi DJ senza agibilità pubblica'
                : `Format ${formatConfig.nome}`,
              tipoFatturazione: 'COMMITTENTE',
              attivo: true,
            }
          })
          
          result.creati++
          result.dettagli.push({
            nome: formatConfig.nome,
            stato: 'CREATO',
            id: nuovo.id,
            tipo: formatConfig.tipo
          })
        } else {
          result.creati++
          result.dettagli.push({
            nome: formatConfig.nome,
            stato: 'DA_CREARE',
            tipo: formatConfig.tipo
          })
        }
        
      } catch (err: any) {
        result.errori.push(`Errore ${formatConfig.nome}: ${err.message}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      dryRun,
      result
    })
    
  } catch (error: any) {
    console.error('Errore import formats:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'import', dettaglio: error.message },
      { status: 500 }
    )
  }
}

// GET - Lista format esistenti
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const formats = await prisma.format.findMany({
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        descrizione: true,
        attivo: true,
        _count: {
          select: { agibilita: true }
        }
      }
    })
    
    return NextResponse.json({
      totale: formats.length,
      formats,
      daImportare: FORMATS_CONFIG.map(f => f.nome)
    })
    
  } catch (error) {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
