import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { sightingSchema } from '@/lib/validation/sightings'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const SIGHTING_RATE = { limit: 5, windowMs: 3_600_000 }

const getQuerySchema = z.object({
  pet_id: z.string().uuid().optional(),
  city: z.string().max(100).optional(),
  cursor_sighted_at: z.string().optional(),
  cursor_id: z.string().uuid().optional(),
  limit: z.preprocess(Number, z.number().int().min(1).max(50)).default(20),
})

const SAFE_COLUMNS = [
  'id', 'pet_id', 'sighted_at', 'created_at',
  'latitude', 'longitude', 'lat', 'lng',
  'city', 'neighborhood', 'address',
  'description', 'photo_url', 'status', 'report_count',
].join(', ')

export async function GET(request: NextRequest) {
  const raw = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = getQuerySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Parâmetros inválidos' }, { status: 400 })
  }

  const { pet_id, city, cursor_sighted_at, cursor_id, limit } = parsed.data
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  // sightings v2 columns (status, sighted_at, city…) not yet in generated types

  let query = db
    .from('sightings')
    .select(SAFE_COLUMNS)
    .eq('status', 'active')
    .order('sighted_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (pet_id) query = query.eq('pet_id', pet_id)
  if (city) query = query.ilike('city', `%${city}%`)
  if (cursor_sighted_at && cursor_id) {
    query = query.or(
      `sighted_at.lt.${cursor_sighted_at},and(sighted_at.eq.${cursor_sighted_at},id.lt.${cursor_id})`
    )
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  const rows = (data ?? []) as any[]
  const hasMore = rows.length > limit
  const sightings = hasMore ? rows.slice(0, limit) : rows
  const last = sightings[sightings.length - 1] as any
  const next_cursor = hasMore && last
    ? { sighted_at: last.sighted_at ?? last.created_at, id: last.id }
    : null

  return NextResponse.json({ success: true, data: { sightings, next_cursor } })
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Autenticação necessária' }, { status: 401 })
  }

  const rl = await checkRateLimit(`sightings:${user.id}`, SIGHTING_RATE)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Limite de avistamentos excedido. Tente novamente em 1 hora.', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = sightingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
      { status: 422 }
    )
  }

  const { data } = parsed
  const { error, data: sighting } = await supabase
    .from('sightings')
    .insert({
      pet_id: data.pet_id,
      reporter_id: user.id,
      sighted_at: data.sighted_at,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      lat: data.latitude ?? null,
      lng: data.longitude ?? null,
      city: data.city ?? null,
      neighborhood: data.neighborhood ?? null,
      description: data.description ?? null,
      photo_url: data.photo_url ?? null,
      status: 'active',
    } as never)
    .select('id')
    .single()

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, data: { id: sighting.id } }, { status: 201 })
}
