// app/api/pets/route.ts
// GET  /api/pets — listagem pública com filtros
// POST /api/pets — cadastro (anônimo ou autenticado)

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient as createClient } from '@/lib/supabase/server'
import { ok, fail } from '@/lib/api-response'
import { Errors } from '@/lib/errors'
import { petSchema } from '@/lib/schemas/pet'
import { type PetPublic, type InsertPet } from '@/types/pets'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const POST_LIMIT = { limit: 5, windowMs: 60_000 } // 5 POSTs/min por IP
const GET_LIMIT  = { limit: 30, windowMs: 60_000 } // 30 GETs/min por IP — impede scraping da listagem

// Colunas seguras — existem em ambos os schemas (antigo e novo)
// Evita erro 500 quando colunas novas ainda não existem na tabela
const SAFE_SELECT = [
  'id', 'kind', 'status', 'name', 'species', 'breed',
  'color', 'size', 'sex', 'age_approx', 'behavior',
  'photo_url', 'neighborhood', 'city', 'state',
  'latitude', 'longitude', 'event_date', 'created_at',
].join(',')

// ── GET /api/pets ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(`pets-get:${getClientIp(req)}`, GET_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Muitas requisições. Tente novamente em alguns instantes.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  try {
    const { searchParams } = req.nextUrl

    const kind         = searchParams.get('kind')
    const species      = searchParams.get('species')
    const city         = searchParams.get('city')
    const neighborhood = searchParams.get('neighborhood')
    const page         = Math.max(1, Number(searchParams.get('page')  ?? '1'))
    const limit        = Math.min(48, Number(searchParams.get('limit') ?? '20'))
    const offset       = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase
      .from('pets')
      .select(SAFE_SELECT, { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (kind)         query = query.eq('kind', kind as 'lost' | 'found')
    if (species)      query = query.eq('species', species as 'dog' | 'cat' | 'other')
    if (city)         query = query.ilike('city', `%${city}%`)
    if (neighborhood) query = query.ilike('neighborhood', `%${neighborhood}%`)

    const { data, error, count } = await query

    if (error) {
      console.error('[GET /api/pets]', error)
      return fail(error)
    }

    return ok({
      pets:  (data ?? []) as unknown as PetPublic[],
      total: count ?? 0,
      page,
      limit,
    })

  } catch (err) {
    return fail(err)
  }
}

// ── POST /api/pets ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(`pets-post:${getClientIp(req)}`, POST_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Muitas requisições. Tente novamente em alguns instantes.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return fail(Errors.INVALID_PAYLOAD)
    }

    const parsed = petSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return fail(
        Object.assign(
          Object.create(Errors.INVALID_PAYLOAD),
          { message: firstError?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' }
        )
      )
    }

    const data     = parsed.data
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const payload: InsertPet = {
      owner_id:         user?.id ?? null,
      kind:             data.kind,
      status:           'active',
      name:             data.name             || null,
      species:          data.species,
      breed:            data.breed            || null,
      color:            data.color,
      size:             data.size,
      sex:              data.sex,
      age_approx:       data.age_approx       || null,
      description:      data.description      || null,
      behavior:         data.behavior         || null,
      photo_url:        data.photo_url        || null,
      neighborhood:     data.neighborhood,
      city:             data.city,
      state:            data.state            || null,
      latitude:         data.latitude  ?? null,
      longitude:        data.longitude ?? null,
      contact_name:     data.contact_name     ?? '',
      contact_phone:    data.contact_phone    ?? '',
      contact_whatsapp: data.contact_whatsapp,
      event_date:       data.event_date       || null,
    }

    const { data: pet, error } = await supabase
      .from('pets')
      .insert(payload as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .select('id, kind, name, city, created_at')
      .single()

    if (error) {
      console.error('[POST /api/pets]', error)
      return fail(error)
    }

    return ok({ id: pet.id, kind: pet.kind, name: pet.name, city: pet.city }, 201)

  } catch (err) {
    return fail(err)
  }
}
