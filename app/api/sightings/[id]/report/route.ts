import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

const HIDE_THRESHOLD = 3
const REPORT_RATE = { limit: 10, windowMs: 3_600_000 } // 10 denúncias/hora por usuário

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const rl = await checkRateLimit(`sighting-report:${user.id}`, REPORT_RATE)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Muitas denúncias em pouco tempo. Tente novamente mais tarde.', code: 'RATE_LIMITED' },
      { status: 429 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { error: insertError } = await db.from('sighting_reports').insert({
    sighting_id: id,
    reporter_id: user.id,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ success: false, error: 'Você já reportou este avistamento' }, { status: 409 })
    }
    if (insertError.code === '42P01') {
      // sighting_reports table doesn't exist yet — increment report_count directly
    } else {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
    }
  }

  // Incremento atômico via RPC (evita a race do read-then-write).
  const { data: rpcCount, error: rpcError } = await db.rpc(
    'increment_sighting_report_count',
    { p_id: id }
  )

  if (!rpcError && typeof rpcCount === 'number') {
    return NextResponse.json({ success: true, data: { report_count: rpcCount } })
  }

  // Fallback: RPC ainda não aplicada no banco → read-then-write (não-atômico).
  const { data: updated } = await supabase
    .from('sightings')
    .select('report_count')
    .eq('id', id)
    .single()

  const newCount = ((updated as any)?.report_count ?? 0) + 1

  await supabase
    .from('sightings')
    .update({ report_count: newCount } as never)
    .eq('id', id)

  if (newCount >= HIDE_THRESHOLD) {
    await supabase
      .from('sightings')
      .update({ status: 'hidden' } as never)
      .eq('id', id)
  }

  return NextResponse.json({ success: true, data: { report_count: newCount } })
}
