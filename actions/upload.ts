'use server'

import { randomUUID } from 'crypto'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { validatePhoto } from '@/lib/validation/pet'

type UploadResult =
  | { success: true; url: string }
  | { success: false; error: string }

export async function uploadFotoPet(formData: FormData): Promise<UploadResult> {
  const file = formData.get('foto')

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Nenhum arquivo recebido.' }
  }

  const validation = validatePhoto(file)
  if (!validation.ok) {
    return { success: false, error: validation.error }
  }
  if (!validation.file) {
    return { success: false, error: 'Arquivo vazio.' }
  }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
  const path = `achados-perdidos/${randomUUID()}.${ext}`

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.storage
    .from('pet-images')
    .upload(path, validation.file, { contentType: file.type, upsert: false })

  if (error) {
    console.error('[uploadFotoPet]', error.message)
    return { success: false, error: 'Erro no upload. Tente novamente.' }
  }

  const { data } = supabase.storage.from('pet-images').getPublicUrl(path)

  return { success: true, url: data.publicUrl }
}
