import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const BodySchema = z.object({
  action: z.enum(['remove', 'restore']),
  reason: z.string().optional(),
})

async function assertAdminOrModerator(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!data || !['admin', 'moderator'].includes(data.role ?? '')) return null
  return user
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const admin = await assertAdminOrModerator(supabase)
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Body inválido' }, { status: 400 })
  }

  const { action, reason } = parsed.data
  const newStatus = action === 'remove' ? 'removed' : 'active'

  const { error } = await supabase
    .from('pets')
    .update({ status: newStatus })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  // admin_actions not yet in generated types — run `npx supabase gen types` after migration
  await db.from('admin_actions').insert({
    admin_id: admin.id,
    action_type: action === 'remove' ? 'remove_pet' : 'restore_pet',
    target_id: id,
    reason: reason ?? null,
  })

  return NextResponse.json({ success: true, data: { status: newStatus } })
}
