// lib/storage.ts — upload de fotos de pets → bucket "pet-images" (público)
// Anônimo → pasta temp/ | Autenticado → pasta {userId}/

import { createClient } from '@/lib/supabase/client'

const BUCKET        = 'pet-images'
const MAX_SIZE_MB   = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export interface UploadResult {
  url:  string
  path: string
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageError'
  }
}

function validateFile(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
    throw new StorageError(`Tipo inválido: ${file.type}. Use JPEG, PNG ou WebP.`)
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new StorageError(`Arquivo muito grande. Máximo: ${MAX_SIZE_MB}MB.`)
  }
}

function generateFileName(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  return `${crypto.randomUUID()}.${ext}`
}

export async function uploadPetPhoto(file: File, userId: string): Promise<UploadResult> {
  validateFile(file)

  const supabase = createClient()
  const path     = `${userId}/${generateFileName(file)}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw new StorageError(`Upload falhou: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

export async function uploadPetPhotoAnon(file: File): Promise<UploadResult> {
  validateFile(file)

  const supabase = createClient()
  const path     = `temp/${generateFileName(file)}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw new StorageError(`Upload falhou: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

export async function deletePetPhoto(path: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new StorageError(`Delete falhou: ${error.message}`)
}
