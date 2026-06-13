import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const MAX_PHOTOS = 5
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  // photos/view_count not yet in generated types
  const { data: prestador } = await db
    .from('prestadores')
    .select('user_id, photos')
    .eq('id', id)
    .single()

  if (!prestador || prestador.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  const photos = ((prestador as any).photos ?? []) as string[]
  if (photos.length >= MAX_PHOTOS) {
    return NextResponse.json({ success: false, error: 'Máximo de 5 fotos atingido' }, { status: 422 })
  }

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file') as File | null
  if (!file) return NextResponse.json({ success: false, error: 'Arquivo não encontrado' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ success: false, error: 'Tipo de arquivo não permitido (use JPEG, PNG ou WebP)' }, { status: 422 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ success: false, error: 'Arquivo muito grande (máximo 5MB)' }, { status: 422 })
  }

  const ext = file.type.split('/')[1]
  const filename = `${id}/${crypto.randomUUID()}.${ext}`
  const buffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('establishment-images')
    .upload(filename, buffer, { contentType: file.type })

  if (uploadError) return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from('establishment-images').getPublicUrl(filename)
  const photoUrl = urlData.publicUrl

  await db
    .from('prestadores')
    .update({ photos: [...photos, photoUrl] })
    .eq('id', id)

  return NextResponse.json({ success: true, data: { photo_url: photoUrl } })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db2 = supabase as any
  const { data: prestador } = await db2
    .from('prestadores')
    .select('user_id, photos')
    .eq('id', id)
    .single()

  if (!prestador || prestador.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const photoUrl = body?.photo_url as string | undefined
  if (!photoUrl) return NextResponse.json({ success: false, error: 'photo_url obrigatório' }, { status: 400 })

  const photos = ((prestador as any).photos ?? []) as string[]
  const updated = photos.filter((p: string) => p !== photoUrl)

  await db2
    .from('prestadores')
    .update({ photos: updated })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
