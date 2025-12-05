// scripts/migrate-documents-to-supabase.ts
// Esegui con: npx ts-node scripts/migrate-documents-to-supabase.ts

import { createClient } from '@supabase/supabase-js'
import { readdir, readFile, stat } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Configura Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Mancano le variabili NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Aggiungile al file .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const BUCKET = 'documenti'
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

// MIME types
function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv',
    'txt': 'text/plain',
    'zip': 'application/zip',
  }
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream'
}

// Scansiona ricorsivamente
async function scanDirectory(dirPath: string, categoria: string, sottoCartella: string | null = null): Promise<{
  localPath: string
  storagePath: string
  categoria: string
  sottoCartella: string | null
  fileName: string
}[]> {
  const files: any[] = []
  
  if (!existsSync(dirPath)) return files
  
  const entries = await readdir(dirPath, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    
    if (entry.isDirectory()) {
      // Sottocartella
      const subFiles = await scanDirectory(fullPath, categoria, entry.name)
      files.push(...subFiles)
    } else if (entry.isFile() && !entry.name.startsWith('.')) {
      // File
      const storagePath = sottoCartella 
        ? `${categoria}/${sottoCartella}/${entry.name}`
        : `${categoria}/${entry.name}`
      
      files.push({
        localPath: fullPath,
        storagePath,
        categoria: categoria.toUpperCase(),
        sottoCartella,
        fileName: entry.name,
      })
    }
  }
  
  return files
}

async function migrate() {
  console.log('🚀 Inizio migrazione documenti a Supabase Storage...\n')
  
  // Trova tutte le cartelle categoria
  const categorie = await readdir(UPLOADS_DIR, { withFileTypes: true })
  const categorieDir = categorie.filter(e => e.isDirectory()).map(e => e.name)
  
  console.log(`📁 Categorie trovate: ${categorieDir.join(', ')}\n`)
  
  let totalFiles = 0
  let uploadedFiles = 0
  let errorFiles = 0
  
  for (const categoria of categorieDir) {
    const catPath = path.join(UPLOADS_DIR, categoria)
    const files = await scanDirectory(catPath, categoria)
    
    console.log(`\n📂 ${categoria.toUpperCase()} - ${files.length} file`)
    
    for (const file of files) {
      totalFiles++
      
      try {
        // Leggi file
        const fileBuffer = await readFile(file.localPath)
        const fileStat = await stat(file.localPath)
        const ext = path.extname(file.fileName).replace('.', '').toLowerCase()
        
        // Upload su Supabase
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .upload(file.storagePath, fileBuffer, {
            contentType: getMimeType(ext),
            upsert: true, // Sovrascrivi se esiste
          })
        
        if (error) {
          console.error(`   ❌ ${file.fileName}: ${error.message}`)
          errorFiles++
          continue
        }
        
        // Salva nel database
        await prisma.documento.upsert({
          where: { 
            // Cerca per path esistente o crea nuovo
            id: Buffer.from(file.storagePath).toString('base64url').substring(0, 25)
          },
          update: {
            path: file.storagePath,
            dimensione: fileStat.size,
            updatedAt: new Date(),
          },
          create: {
            nome: file.fileName,
            nomeVisualizzato: file.fileName.replace(/\.[^/.]+$/, ''),
            path: file.storagePath,
            categoria: file.categoria as any,
            dimensione: fileStat.size,
            estensione: ext,
            mimeType: getMimeType(ext),
          }
        })
        
        console.log(`   ✅ ${file.fileName}`)
        uploadedFiles++
        
      } catch (err: any) {
        console.error(`   ❌ ${file.fileName}: ${err.message}`)
        errorFiles++
      }
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log(`📊 RISULTATO MIGRAZIONE`)
  console.log('='.repeat(50))
  console.log(`   Totale file:    ${totalFiles}`)
  console.log(`   ✅ Caricati:    ${uploadedFiles}`)
  console.log(`   ❌ Errori:      ${errorFiles}`)
  console.log('='.repeat(50))
  
  await prisma.$disconnect()
}

migrate().catch(console.error)
