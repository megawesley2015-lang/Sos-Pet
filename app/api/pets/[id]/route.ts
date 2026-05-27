// src/app/api/pets/[id]/route.ts
// GET    /api/pets/[id]  — detalhe completo (inclui contato)
// PATCH  /api/pets/[id]  — atualização parcial (apenas dono autenticado)
// DELETE /api/pets/[id]  — exclusão (apenas dono autenticado)

import { NextResponse }              from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PetUpdateSchema }           from '@/lib/schemas/pet'

type RouteContext = { params: Promise<{ id: string }> }

// ─── GET — Detalhe do pet (contato incluído aqui) ────────────────────────────

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'ID não informado.' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('achados_perdidos')
    // Aqui inclui "contato" — somente na página de detalhe
    .select('id, tipo, nome, especie, raca, cor, porte, sexo, idade_aprox, descricao, comportamento, bairro, cidade, data_ocorrencia, foto_url, contato, status, created_at')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 })
    }
    console.error('[GET /api/pets/[id]]', error.message)
    return NextResponse.json({ error: 'Erro ao buscar registro.' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// ─── PATCH — Atualização parcial ─────────────────────────────────────────────

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = PetUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('achados_perdidos')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)   // double-check além do RLS
    .select('id')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Registro não encontrado ou sem permissão.' },
        { status: 403 }
      )
    }
    console.error('[PATCH /api/pets/[id]]', error.message)
    return NextResponse.json({ error: 'Erro ao atualizar.' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  // Busca a foto antes de deletar o registro
  const { data: registro } = await supabase
    .from('achados_perdidos')
    .select('foto_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('achados_perdidos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[DELETE /api/pets/[id]]', error.message)
    return NextResponse.json({ error: 'Erro ao excluir.' }, { status: 500 })
  }

  // Remove imagem do storage
  if (registro?.foto_url) {
    const path = registro.foto_url.split('/pet-images/')[1]
    if (path) {
      await supabase.storage.from('pet-images').remove([path])
    }
  }

  return new NextResponse(null, { status: 204 })
}
