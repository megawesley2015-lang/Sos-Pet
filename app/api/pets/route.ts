// src/app/api/pets/route.ts
// GET  /api/pets  — listagem pública com filtros e paginação
// POST /api/pets  — cadastro (anônimo ou autenticado)

import { NextResponse }    from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PetSchema, PetFiltrosSchema } from '@/lib/schemas/pet'

// ─── GET — Listagem pública ──────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  // Valida filtros — valores inválidos resultam em 400, não em 500
  const parsed = PetFiltrosSchema.safeParse({
    tipo:    searchParams.get('tipo'),
    especie: searchParams.get('especie'),
    cidade:  searchParams.get('cidade'),
    bairro:  searchParams.get('bairro'),
    page:    searchParams.get('page'),
    limit:   searchParams.get('limit'),
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parâmetros de filtro inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { tipo, especie, cidade, bairro, page, limit } = parsed.data
  const offset = (page - 1) * limit

  const supabase = await createSupabaseServerClient()

  // Seleção explícita de colunas — SEM o campo "contato" (só aparece no detalhe)
  let query = supabase
    .from('achados_perdidos')
    .select('id, tipo, nome, especie, raca, cor, porte, sexo, idade_aprox, descricao, comportamento, bairro, cidade, data_ocorrencia, foto_url, status, created_at', { count: 'exact' })
    .eq('status', 'ativo')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (tipo)    query = query.eq('tipo', tipo as 'perdido' | 'encontrado')
  if (especie) query = query.eq('especie', especie as 'cao' | 'gato' | 'outro')
  if (cidade)  query = query.ilike('cidade', `%${cidade}%`)
  if (bairro)  query = query.ilike('bairro', `%${bairro}%`)

  const { data, error, count } = await query

  if (error) {
    console.error('[GET /api/pets]', error.message)
    return NextResponse.json(
      { error: 'Erro ao buscar registros.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    data:  data ?? [],
    total: count ?? 0,
    page,
    limit,
  })
}

// ─── POST — Cadastro ─────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()

  // Auth opcional — anônimo é permitido
  const { data: { user } } = await supabase.auth.getUser()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = PetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('achados_perdidos')
    .insert({
      ...parsed.data,
      user_id: user?.id ?? null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[POST /api/pets]', error.message)
    return NextResponse.json(
      { error: 'Erro ao salvar. Tente novamente.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
