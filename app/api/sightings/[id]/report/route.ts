import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const HIDE_THRESHOLD = 3

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

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
