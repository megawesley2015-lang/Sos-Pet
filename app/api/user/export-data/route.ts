// app/api/user/export-data/route.ts
// GET /api/user/export-data — LGPD art. 18: portabilidade de dados pessoais

import { NextRequest } from 'next/server'
import { createSupabaseServerClient as createClient } from '@/lib/supabase/server'
import { ok, fail } from '@/lib/api-response'
import { Errors } from '@/lib/errors'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return fail(Errors.NOT_AUTHENTICATED)

    const [profileResult, petsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url, role, consent_at, created_at, updated_at')
        .eq('id', user.id)
        .single(),
      supabase
        .from('pets')
        .select(
          'id, kind, status, name, species, breed, color, size, sex, age_approx,' +
          'description, behavior, photo_url, neighborhood, city, state,' +
          'latitude, longitude, event_date,' +
          'contact_name, contact_phone, contact_whatsapp,' +
          'created_at, updated_at, deleted_at'
        )
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    return ok({
      exported_at: new Date().toISOString(),
      email:       user.email ?? null,
      profile:     profileResult.data ?? null,
      pets:        petsResult.data ?? [],
    })

  } catch (err) {
    return fail(err)
  }
}
