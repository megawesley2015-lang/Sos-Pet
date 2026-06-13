import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prestadorUpdateSchema } from '@/lib/validation/prestador'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('prestadores')
    .select('id, nome, categoria, descricao, telefone, endereco, cidade, emergencia_24h, avaliacao, slug, status, created_at')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ success: false, error: 'Prestador não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const { data: prestador } = await supabase
    .from('prestadores')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!prestador || prestador.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = prestadorUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 422 })
  }

  const { error } = await supabase
    .from('prestadores')
    .update(parsed.data as never)
    .eq('id', id)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
