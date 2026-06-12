import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetId } = await params
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
  }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Acesso negado — apenas admin pode banir' }, { status: 403 })
  }

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', targetId)
    .single()

  if (targetProfile?.role === 'admin') {
    return NextResponse.json(
      { success: false, error: 'Não é possível banir um administrador' },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'banned' })
    .eq('id', targetId)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  // admin_actions not yet in generated types — run `npx supabase gen types` after migration
  await db.from('admin_actions').insert({
    admin_id: user.id,
    action_type: 'ban_user',
    target_id: targetId,
  })

  return NextResponse.json({ success: true, data: { banned: true } })
}
