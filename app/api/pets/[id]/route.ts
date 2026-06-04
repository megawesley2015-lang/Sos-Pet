// app/api/pets/[id]/route.ts
// GET    /api/pets/[id] — detalhe com contato (apenas aqui)
// PATCH  /api/pets/[id] — editar (apenas o dono logado)
// DELETE /api/pets/[id] — soft delete via status='resolved' (apenas o dono)

import { NextRequest, NextResponse }  from 'next/server'
import { createSupabaseServerClient as createClient } from '@/lib/supabase/server'
import { ok, fail }                 from '@/lib/api-response'
import { Errors }                   from '@/lib/errors'
import { petUpdateSchema }          from '@/lib/schemas/pet'
import { PET_DETAIL_COLUMNS, type PetDetail } from '@/types/pets'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

type RouteContext = { params: Promise<{ id: string }> }

// 20 req/min por IP — impede scraping em massa de contatos
const GET_DETAIL_LIMIT = { limit: 20, windowMs: 60_000 }

// ── GET /api/pets/[id] ────────────────────────────────────────────────────────
// Único endpoint que expõe dados de contato
export async function GET(req: NextRequest, { params }: RouteContext) {
  const rl = await checkRateLimit(`pets-detail:${getClientIp(req)}`, GET_DETAIL_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Muitas requisições. Tente novamente em alguns instantes.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('pets')
      .select(PET_DETAIL_COLUMNS)
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (error) return fail(error)
    if (!data)  return fail(Errors.PET_NOT_FOUND)

    return ok(data as unknown as PetDetail)

  } catch (err) {
    return fail(err)
  }
}

// ── PATCH /api/pets/[id] ──────────────────────────────────────────────────────
// Edição — apenas o dono autenticado
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return fail(Errors.NOT_AUTHENTICATED)

    const { data: existing, error: fetchErr } = await supabase
      .from('pets')
      .select('id, owner_id')
      .eq('id', id)
      .single()

    if (fetchErr || !existing) return fail(Errors.PET_NOT_FOUND)
    if (existing.owner_id !== user.id) return fail(Errors.FORBIDDEN)

    let body: unknown
    try { body = await req.json() } catch { return fail(Errors.INVALID_PAYLOAD) }

    const parsed = petUpdateSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return fail(Object.assign(
        Object.create(Errors.INVALID_PAYLOAD),
        { message: firstError?.message ?? 'Dados inválidos' }
      ))
    }

    const updateData = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== undefined)
    )

    const { data: updated, error: updateErr } = await supabase
      .from('pets')
      .update(updateData as Record<string, unknown>)
      .eq('id', id)
      .select('id, kind, status, name, city, updated_at')
      .single()

    if (updateErr) return fail(updateErr)

    return ok(updated)

  } catch (err) {
    return fail(err)
  }
}

// ── DELETE /api/pets/[id] ─────────────────────────────────────────────────────
// Soft delete via status='resolved' — histórico preservado
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return fail(Errors.NOT_AUTHENTICATED)

    const { data: existing, error: fetchErr } = await supabase
      .from('pets')
      .select('id, owner_id')
      .eq('id', id)
      .single()

    if (fetchErr || !existing) return fail(Errors.PET_NOT_FOUND)
    if (existing.owner_id !== user.id) return fail(Errors.FORBIDDEN)

    const { error: deleteErr } = await supabase
      .from('pets')
      .update({ status: 'resolved' })
      .eq('id', id)

    if (deleteErr) return fail(deleteErr)

    return ok({ id, deleted: true })

  } catch (err) {
    return fail(err)
  }
}
