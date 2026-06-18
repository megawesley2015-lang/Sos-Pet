import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

const BodySchema = z.object({
  target_type: z.enum(['pet', 'sighting']),
  target_id: z.string().uuid(),
  reason: z.enum(['spam', 'inappropriate_photo', 'wrong_info', 'other']),
})

const AUTO_HIDE_THRESHOLD = 3
const REPORT_RATE = { limit: 10, windowMs: 3_600_000 } // 10 denúncias/hora por usuário

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
  }

  const rl = await checkRateLimit(`report:${user.id}`, REPORT_RATE)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Muitas denúncias em pouco tempo. Tente novamente mais tarde.', code: 'RATE_LIMITED' },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Body inválido' }, { status: 400 })
  }

  const { target_type, target_id, reason } = parsed.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // reports/admin_actions not yet in generated types — run `npx supabase gen types` after migration
  const { error } = await db.from('reports').insert({
    reporter_id: user.id,
    target_type,
    target_id,
    reason,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Você já denunciou este item' },
        { status: 409 }
      )
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  const { count } = await db
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .eq('status', 'pending')

  if ((count ?? 0) >= AUTO_HIDE_THRESHOLD) {
    const table = target_type === 'pet' ? 'pets' : 'sightings'
    await db.from(table).update({ status: 'removed' }).eq('id', target_id)
  }

  return NextResponse.json({ success: true, data: { reported: true } }, { status: 201 })
}
