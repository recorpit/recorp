// src/lib/supabase/storage.ts
// Client Supabase per Storage (server-side)

import { createClient } from '@supabase/supabase-js'

// Client con service role per operazioni server-side
export function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
}

// Bucket per i documenti
export const STORAGE_BUCKET = 'documenti'

// Helper per costruire il path del file
export function buildStoragePath(
  categoria: string,
  fileName: string,
  sottoCartella?: string | null
): string {
  const parts = [categoria.toLowerCase()]
  if (sottoCartella) {
    parts.push(sottoCartella)
  }
  parts.push(fileName)
  return parts.join('/')
}

// Helper per ottenere URL firmato (download temporaneo)
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600 // 1 ora default
): Promise<string | null> {
  try {
    const supabase = getStorageClient()
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Errore creazione signed URL:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Errore getSignedUrl:', error)
    return null
  }
}

// Upload file
export async function uploadFile(
  file: Buffer,
  path: string,
  contentType: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const supabase = getStorageClient()
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        contentType,
        upsert: false, // Non sovrascrivere
      })

    if (error) {
      // Se il file esiste già, prova con un nome diverso
      if (error.message.includes('already exists')) {
        const timestamp = Date.now()
        const ext = path.split('.').pop()
        const basePath = path.replace(`.${ext}`, '')
        const newPath = `${basePath}_${timestamp}.${ext}`
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(newPath, file, {
            contentType,
            upsert: false,
          })

        if (retryError) {
          return { success: false, error: retryError.message }
        }

        return { success: true, path: retryData.path }
      }

      return { success: false, error: error.message }
    }

    return { success: true, path: data.path }
  } catch (error) {
    console.error('Errore upload:', error)
    return { success: false, error: 'Errore durante upload' }
  }
}

// Elimina file
export async function deleteFile(path: string): Promise<boolean> {
  try {
    const supabase = getStorageClient()
    
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path])

    if (error) {
      console.error('Errore eliminazione file:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Errore deleteFile:', error)
    return false
  }
}

// Lista file in una cartella
export async function listFiles(
  folder: string
): Promise<{ name: string; path: string; size: number; createdAt: string }[]> {
  try {
    const supabase = getStorageClient()
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folder, {
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('Errore lista file:', error)
      return []
    }

    return data
      .filter(item => item.name !== '.emptyFolderPlaceholder')
      .map(item => ({
        name: item.name,
        path: `${folder}/${item.name}`,
        size: item.metadata?.size || 0,
        createdAt: item.created_at || new Date().toISOString(),
      }))
  } catch (error) {
    console.error('Errore listFiles:', error)
    return []
  }
}

// Download file come Buffer
export async function downloadFile(path: string): Promise<Buffer | null> {
  try {
    const supabase = getStorageClient()
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(path)

    if (error) {
      console.error('Errore download file:', error)
      return null
    }

    const arrayBuffer = await data.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('Errore downloadFile:', error)
    return null
  }
}
