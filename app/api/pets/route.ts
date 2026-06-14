// app/api/pets/route.ts
// GET  /api/pets — listagem pública com filtros
// POST /api/pets — cadastro (anônimo ou autenticado)

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient as createClient } from '@/lib/supabase/server'
import { ok, fail } from '@/lib/api-response'
import { Errors } from '@/lib/errors'
import { petSchema } from '@/lib/schemas/pet'
import { type PetPublic, type InsertPet } from '@/types/pets'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { haversineKm } from '@/lib/geo'
import { sendEmail } from '@/lib/email/send'
import { petConfirmationTemplate } from '@/lib/email/templates'
import { runAgentsForPet } from '@/lib/agents'

const POST_LIMIT = { limit: 5, windowMs: 60_000 } // 5 POSTs/min por IP
const GET_LIMIT  = { limit: 30, windowMs: 60_000 } // 30 GETs/min por IP — impede scraping da listagem

const SAFE_SELECT = [
  'id', 'kind', 'status', 'name', 'species', 'breed',
  'color', 'size', 'sex', 'age_approx', 'behavior',
  'photo_url', 'neighborhood', 'city', 'state',
  'latitude', 'longitude', 'event_date', 'created_at',
].join(',')

// 1 grau de latitude ≈ 111.32 km (longitude varia com cos(lat) — ver applyFilters)
const KM_PER_DEGREE = 111.32

const getQuerySchema = z.object({
  kind:             z.enum(['lost', 'found']).optional(),
  species:          z.enum(['dog', 'cat', 'bird', 'other']).optional(),
  city:             z.string().max(80).optional(),
  neighborhood:     z.string().max(80).optional(),
  color:            z.string().max(60).optional(),
  size:             z.enum(['small', 'medium', 'large']).optional(),
  lat:              z.preprocess(Number, z.number().min(-90).max(90)).optional(),
  lng:              z.preprocess(Number, z.number().min(-180).max(180)).optional(),
  radius_km:        z.preprocess(Number, z.number().min(1).max(100)).optional(),
  cursor_created_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/).optional(),
  cursor_id:        z.string().uuid().optional(),
  limit:            z.preprocess(Number, z.number().int().min(1).max(100)).default(24),
})

// ── GET /api/pets ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(`pets-get:${getClientIp(req)}`, GET_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Muitas requisições. Tente novamente em alguns instantes.', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  try {
    const raw = Object.fromEntries(req.nextUrl.searchParams.entries())
    const parsed = getQuerySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? 'Parâmetros inválidos' },
        { status: 400 }
      )
    }

    const {
      kind, species, city, neighborhood, color, size,
      lat, lng, radius_km,
      cursor_created_at: cursorCreatedAt,
      cursor_id: cursorId,
      limit,
    } = parsed.data

    // radius_km exige lat e lng
    if (radius_km !== undefined && (lat === undefined || lng === undefined)) {
      return NextResponse.json(
        { success: false, error: 'radius_km exige lat e lng' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const geoActive = radius_km !== undefined && lat !== undefined && lng !== undefined

    // ── Função auxiliar: aplicar filtros comuns em qualquer query ──────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function applyFilters(q: any) {
      q = q.eq('status', 'active')
      if (kind)         q = q.eq('kind', kind)
      if (species)      q = q.eq('species', species)
      if (city)         q = q.ilike('city', `%${city}%`)
      if (neighborhood) q = q.ilike('neighborhood', `%${neighborhood}%`)
      if (color)        q = q.ilike('color', `%${color}%`)
      if (size)         q = q.eq('size', size)
      if (geoActive) {
        const latDelta = radius_km! / KM_PER_DEGREE
        const lngDelta = radius_km! / (KM_PER_DEGREE * Math.cos(lat! * Math.PI / 180))
        q = q
          .not('latitude', 'is', null)
          .gte('latitude',  lat! - latDelta)
          .lte('latitude',  lat! + latDelta)
          .gte('longitude', lng! - lngDelta)
          .lte('longitude', lng! + lngDelta)
      }
      return q
    }

    // ── Geo mode: busca bbox, filtra por raio real, ordena por distância ─────
    if (geoActive) {
      const { data: geoData, error: geoError } = await applyFilters(
        supabase.from('pets_public').select(SAFE_SELECT)
      ).limit(200)

      if (geoError) {
        console.error('[GET /api/pets geo]', geoError)
        return fail(geoError)
      }

      type PetWithDist = PetPublic & { distance_km: number }
      const withDist: PetWithDist[] = ((geoData ?? []) as unknown as PetPublic[])
        .filter(p => p.latitude != null && p.longitude != null)
        .map(p => ({
          ...p,
          distance_km: haversineKm(lat!, lng!, p.latitude!, p.longitude!),
        }))
        .filter(p => p.distance_km <= radius_km!)   // haversine exata, não só bbox
        .sort((a, b) => a.distance_km - b.distance_km)

      // cursor por id na lista ordenada → suporta paginação real em geo mode
      let offset = 0
      if (cursorId) {
        const idx = withDist.findIndex(p => p.id === cursorId)
        if (idx >= 0) offset = idx + 1
      }

      const page       = withDist.slice(offset, offset + limit)
      const hasMore    = withDist.length > offset + limit
      const next_cursor = hasMore && page.length > 0
        ? { created_at: page[page.length - 1]!.created_at, id: page[page.length - 1]!.id }
        : null

      return ok({ pets: page, next_cursor, total_count: withDist.length })
    }

    // ── Normal mode: count + keyset pagination ────────────────────────────────
    const { count: total_count, error: countError } = await applyFilters(
      supabase.from('pets_public').select('id', { count: 'exact', head: true })
    )
    if (countError) {
      console.error('[GET /api/pets count]', countError)
      return fail(countError)
    }

    let query = applyFilters(
      supabase.from('pets_public').select(SAFE_SELECT)
    )
      .order('created_at', { ascending: false })
      .order('id',         { ascending: false })
      .limit(limit + 1)

    if (cursorCreatedAt && cursorId) {
      query = query.or(
        `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`
      )
    }

    const { data, error } = await query
    if (error) {
      console.error('[GET /api/pets]', error)
      return fail(error)
    }

    const rows    = data ?? []
    const hasMore = rows.length > limit
    const pets    = (hasMore ? rows.slice(0, limit) : rows) as unknown as PetPublic[]
    const last    = pets[pets.length - 1]
    const next_cursor = hasMore && last
      ? { created_at: last.created_at, id: last.id }
      : null

    return ok({ pets, next_cursor, total_count: total_count ?? 0 })

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

    if (user?.email && pet.kind === 'lost') {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aumigo.com.br'
      void sendEmail({
        to: user.email,
        subject: `${pet.name ?? 'Seu pet'} foi cadastrado — Pet Aumigo`,
        html: petConfirmationTemplate({
          petName: pet.name ?? 'Seu pet',
          petId: pet.id,
          species: 'pet',
          siteUrl,
        }),
        templateName: 'pet_confirmation',
      })
    }

    // Dispara agentes em background (best-effort — não bloqueia resposta)
    void runAgentsForPet(pet.id, {
      name:         data.name             || null,
      species:      data.species,
      breed:        data.breed            || null,
      color:        data.color            ?? null,
      size:         data.size             ?? null,
      sex:          data.sex              ?? null,
      description:  data.description      || null,
      behavior:     data.behavior         || null,
      neighborhood: data.neighborhood     ?? null,
      city:         data.city,
    })

    return ok({ id: pet.id, kind: pet.kind, name: pet.name, city: pet.city }, 201)

  } catch (err) {
    return fail(err)
  }
}
