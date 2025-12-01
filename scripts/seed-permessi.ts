// scripts/seed-permessi.ts
// Esegui con: npx ts-node scripts/seed-permessi.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Definizione moduli e azioni
const MODULI = {
  dashboard: { nome: 'Dashboard', azioni: ['visualizza'] },
  artisti: { nome: 'Artisti', azioni: ['visualizza', 'crea', 'modifica', 'elimina'] },
  locali: { nome: 'Locali', azioni: ['visualizza', 'crea', 'modifica', 'elimina'] },
  committenti: { nome: 'Committenti', azioni: ['visualizza', 'crea', 'modifica', 'elimina'] },
  agibilita: { nome: 'Agibilità', azioni: ['visualizza', 'crea', 'modifica', 'elimina', 'invia_inps'] },
  fatture: { nome: 'Fatture', azioni: ['visualizza', 'crea', 'modifica', 'elimina', 'esporta'] },
  pagamenti: { nome: 'Pagamenti', azioni: ['visualizza', 'crea', 'modifica', 'approva'] },
  prestazioni: { nome: 'Prestazioni', azioni: ['visualizza', 'crea', 'modifica', 'genera', 'paga'] },
  utenti: { nome: 'Utenti', azioni: ['visualizza', 'crea', 'modifica', 'elimina'] },
  impostazioni: { nome: 'Impostazioni', azioni: ['visualizza', 'modifica'] },
  report: { nome: 'Report', azioni: ['visualizza', 'esporta'] },
  formats: { nome: 'Format', azioni: ['visualizza', 'crea', 'modifica', 'elimina'] },
}

const AZIONI_LABEL: Record<string, string> = {
  visualizza: 'Visualizza',
  crea: 'Crea',
  modifica: 'Modifica',
  elimina: 'Elimina',
  invia_inps: 'Invia INPS',
  esporta: 'Esporta',
  approva: 'Approva',
  genera: 'Genera',
  paga: 'Paga',
}

// Permessi di default per ogni ruolo
const PERMESSI_RUOLO: Record<string, string[]> = {
  ADMIN: ['*'], // Tutti i permessi
  OPERATORE: [
    'dashboard.visualizza',
    'artisti.*',
    'locali.*',
    'committenti.*',
    'agibilita.*',
    'fatture.visualizza', 'fatture.crea', 'fatture.modifica',
    'pagamenti.visualizza', 'pagamenti.crea',
    'prestazioni.*',
    'report.visualizza',
    'formats.visualizza',
  ],
  PRODUZIONE: [
    'dashboard.visualizza',
    'artisti.visualizza',
    'locali.visualizza',
    'committenti.visualizza',
    'agibilita.visualizza', 'agibilita.crea', 'agibilita.modifica',
    'formats.visualizza',
  ],
  FORMAT_MANAGER: [
    'dashboard.visualizza',
    'artisti.visualizza',
    'locali.visualizza',
    'committenti.visualizza',
    'agibilita.visualizza', 'agibilita.crea', 'agibilita.modifica',
    'fatture.visualizza',
    'formats.visualizza', 'formats.modifica',
    'report.visualizza',
  ],
  ARTISTICO: [
    'dashboard.visualizza',
    // Solo le proprie info
  ],
}

async function main() {
  console.log('🔄 Creazione permessi...')
  
  // 1. Crea tutti i permessi
  const permessiCreati: string[] = []
  
  for (const [modulo, config] of Object.entries(MODULI)) {
    for (const azione of config.azioni) {
      const codice = `${modulo}.${azione}`
      const nome = `${AZIONI_LABEL[azione]} ${config.nome}`
      
      await prisma.permesso.upsert({
        where: { codice },
        update: { nome, modulo, azione },
        create: {
          codice,
          nome,
          modulo,
          azione,
          attivo: true,
        }
      })
      
      permessiCreati.push(codice)
      console.log(`  ✓ ${codice}`)
    }
  }
  
  console.log(`\n✅ Creati ${permessiCreati.length} permessi`)
  
  // 2. Assegna permessi ai ruoli
  console.log('\n🔄 Assegnazione permessi ai ruoli...')
  
  // Prima elimina le assegnazioni esistenti
  await prisma.permessoRuolo.deleteMany()
  
  for (const [ruolo, permessi] of Object.entries(PERMESSI_RUOLO)) {
    let count = 0
    
    // Se ha '*' assegna tutti i permessi
    if (permessi.includes('*')) {
      const tuttiPermessi = await prisma.permesso.findMany()
      for (const p of tuttiPermessi) {
        await prisma.permessoRuolo.create({
          data: {
            ruolo: ruolo as any,
            permessoId: p.id,
          }
        })
        count++
      }
    } else {
      for (const pattern of permessi) {
        if (pattern.endsWith('.*')) {
          // Wildcard per modulo (es. "artisti.*")
          const modulo = pattern.replace('.*', '')
          const permessiModulo = await prisma.permesso.findMany({
            where: { modulo }
          })
          for (const p of permessiModulo) {
            await prisma.permessoRuolo.create({
              data: {
                ruolo: ruolo as any,
                permessoId: p.id,
              }
            })
            count++
          }
        } else {
          // Permesso singolo
          const permesso = await prisma.permesso.findUnique({
            where: { codice: pattern }
          })
          if (permesso) {
            await prisma.permessoRuolo.create({
              data: {
                ruolo: ruolo as any,
                permessoId: permesso.id,
              }
            })
            count++
          }
        }
      }
    }
    
    console.log(`  ✓ ${ruolo}: ${count} permessi`)
  }
  
  console.log('\n✅ Seed completato!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
