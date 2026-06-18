import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const MAX_PHOTOS = 5
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Confere os magic bytes do arquivo contra o MIME declarado.
 * Impede upload de conteúdo arbitrário com Content-Type forjado.
 */
function matchesMagicBytes(buffer: ArrayBuffer, mime: string): boolean {
  const bytes = new Uint8Array(buffer)
  if (bytes.length < 12) return false

  switch (mime) {
    case 'image/jpeg':
      // FF D8 FF
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    case 'image/png':
      // 89 50 4E 47 0D 0A 1A 0A
      return (
        bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e &&
        bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a &&
        bytes[6] === 0x1a && bytes[7] === 0x0a
      )
    case 'image/webp':
      // "RIFF" (52 49 46 46) .... "WEBP" (57 45 42 50)
      return (
        bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 &&
        bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 &&
        bytes[10] === 0x42 && bytes[11] === 0x50
      )
    default:
      return false
  }
}

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

  // Defesa contra spoof de MIME: valida os magic bytes reais do arquivo,
  // já que file.type vem do header enviado pelo cliente (manipulável).
  if (!matchesMagicBytes(buffer, file.type)) {
    return NextResponse.json({ success: false, error: 'O conteúdo do arquivo não corresponde a uma imagem JPEG, PNG ou WebP' }, { status: 422 })
  }

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
