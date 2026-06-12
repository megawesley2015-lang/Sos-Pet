import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const BodySchema = z.object({
  action: z.enum(['approve', 'dismiss']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'moderator'].includes(profile.role ?? '')) {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Body inválido' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // reports/admin_actions not yet in generated types — run `npx supabase gen types` after migration
  const { data: report } = await db
    .from('reports')
    .select('target_type, target_id')
    .eq('id', id)
    .single()

  if (!report) {
    return NextResponse.json({ success: false, error: 'Denúncia não encontrada' }, { status: 404 })
  }

  await db
    .from('reports')
    .update({ status: parsed.data.action === 'approve' ? 'reviewed' : 'dismissed' })
    .eq('target_type', report.target_type)
    .eq('target_id', report.target_id)

  await db.from('admin_actions').insert({
    admin_id: user.id,
    action_type: 'dismiss_report',
    target_id: report.target_id,
  })

  return NextResponse.json({ success: true, data: { action: parsed.data.action } })
}
