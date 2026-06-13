import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { vaccinationSchema } from '@/lib/validation/pet-saude'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/api-response'

const HEALTH_RATE = { limit: 20, windowMs: 60_000 }

async function assertPetOwner(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, petId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('pets').select('owner_id').eq('id', petId).single()
  if (!data || data.owner_id !== user.id) return null
  return user
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data, error } = await db
    .from('pet_vaccinations')
    .select('id, vaccine_name, applied_at, next_due_at, veterinarian, clinic, notes, created_at')
    .eq('pet_id', id)
    .order('applied_at', { ascending: false })

  if (error) return fail(error)
  return ok({ vaccinations: data ?? [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const user = await assertPetOwner(supabase, id)
  if (!user) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const rl = await checkRateLimit(`pet-health:${getClientIp(request)}`, HEALTH_RATE)
  if (!rl.allowed) return NextResponse.json({ success: false, error: 'Muitas requisições' }, { status: 429 })

  const body = await request.json().catch(() => null)
  const parsed = vaccinationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 422 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data, error } = await db
    .from('pet_vaccinations')
    .insert({ pet_id: id, owner_id: user.id, ...parsed.data })
    .select()
    .single()

  if (error) return fail(error)
  return ok({ vaccination: data }, 201)
}
