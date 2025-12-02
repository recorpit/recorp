// src/lib/permessi.ts
// Utility per gestione permessi

import { prisma } from '@/lib/db'
import type { RuoloUtente } from '@prisma/client'

// Cache permessi (per evitare query ripetute)
const permessiCache = new Map<string, Set<string>>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minuti
const cacheTimestamps = new Map<string, number>()

// Ottieni permessi di un utente (ruolo + custom)
export async function getPermessiUtente(userId: string, ruolo: RuoloUtente): Promise<Set<string>> {
  const cacheKey = `${userId}-${ruolo}`
  const now = Date.now()
  
  // Controlla cache
  if (permessiCache.has(cacheKey)) {
    const timestamp = cacheTimestamps.get(cacheKey) || 0
    if (now - timestamp < CACHE_TTL) {
      return permessiCache.get(cacheKey)!
    }
  }
  
  // Ottieni permessi del ruolo
  const permessiRuolo = await prisma.permessoRuolo.findMany({
    where: { ruolo },
    include: { permesso: true }
  })
  
  const permessi = new Set<string>(
    permessiRuolo.map(pr => pr.permesso.codice)
  )
  
  // Applica override utente
  const permessiUtente = await prisma.permessoUtente.findMany({
    where: { userId },
    include: { permesso: true }
  })
  
  for (const pu of permessiUtente) {
    if (pu.concesso) {
      permessi.add(pu.permesso.codice)
    } else {
      permessi.delete(pu.permesso.codice)
    }
  }
  
  // Salva in cache
  permessiCache.set(cacheKey, permessi)
  cacheTimestamps.set(cacheKey, now)
  
  return permessi
}

// Verifica se utente ha un permesso
export async function haPermesso(
  userId: string, 
  ruolo: RuoloUtente, 
  permesso: string
): Promise<boolean> {
  const permessi = await getPermessiUtente(userId, ruolo)
  return permessi.has(permesso)
}

// Verifica multipli permessi (AND)
export async function haPermessi(
  userId: string, 
  ruolo: RuoloUtente, 
  permessiRichiesti: string[]
): Promise<boolean> {
  const permessi = await getPermessiUtente(userId, ruolo)
  return permessiRichiesti.every(p => permessi.has(p))
}

// Verifica almeno uno dei permessi (OR)
export async function haAlmenoUnPermesso(
  userId: string, 
  ruolo: RuoloUtente, 
  permessiRichiesti: string[]
): Promise<boolean> {
  const permessi = await getPermessiUtente(userId, ruolo)
  return permessiRichiesti.some(p => permessi.has(p))
}

// Invalida cache per un utente
export function invalidaCachePermessi(userId?: string) {
  if (userId) {
    // Invalida solo per questo utente
    for (const key of Array.from(permessiCache.keys())) {
      if (key.startsWith(userId)) {
        permessiCache.delete(key)
        cacheTimestamps.delete(key)
      }
    }
  } else {
    // Invalida tutta la cache
    permessiCache.clear()
    cacheTimestamps.clear()
  }
}

// Lista moduli disponibili
export const MODULI = {
  dashboard: { nome: 'Dashboard', icona: 'LayoutDashboard' },
  artisti: { nome: 'Artisti', icona: 'Users' },
  locali: { nome: 'Locali', icona: 'MapPin' },
  committenti: { nome: 'Committenti', icona: 'Building2' },
  agibilita: { nome: 'Agibilità', icona: 'FileText' },
  fatture: { nome: 'Fatture', icona: 'Receipt' },
  pagamenti: { nome: 'Pagamenti', icona: 'CreditCard' },
  prestazioni: { nome: 'Prestazioni', icona: 'FileCheck' },
  utenti: { nome: 'Utenti', icona: 'UserCog' },
  impostazioni: { nome: 'Impostazioni', icona: 'Settings' },
  report: { nome: 'Report', icona: 'BarChart3' },
  formats: { nome: 'Format', icona: 'Sparkles' },
}

// Lista azioni disponibili
export const AZIONI = {
  visualizza: { nome: 'Visualizza', descrizione: 'Può vedere i dati' },
  crea: { nome: 'Crea', descrizione: 'Può creare nuovi record' },
  modifica: { nome: 'Modifica', descrizione: 'Può modificare record esistenti' },
  elimina: { nome: 'Elimina', descrizione: 'Può eliminare record' },
  invia_inps: { nome: 'Invia INPS', descrizione: 'Può inviare comunicazioni INPS' },
  esporta: { nome: 'Esporta', descrizione: 'Può esportare dati' },
  approva: { nome: 'Approva', descrizione: 'Può approvare operazioni' },
  genera: { nome: 'Genera', descrizione: 'Può generare documenti' },
  paga: { nome: 'Paga', descrizione: 'Può effettuare pagamenti' },
}
