import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const SUB_RATE = { limit: 10, windowMs: 60_000 }

const CIDADES_BAIXADA = [
  'Santos', 'Guarujá', 'São Vicente', 'Cubatão', 'Bertioga',
  'Praia Grande', 'Mongaguá', 'Itanhaém', 'Peruíbe',
]

const PostSchema = z.object({
  city: z.string().min(1).max(100),
  channel: z.enum(['whatsapp', 'email']),
})

const DeleteSchema = z.object({
  id: z.string().uuid(),
})

export async function GET(_request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data, error } = await db
    .from('notification_subscriptions')
    .select('id, city, channel, active, created_at')
    .eq('user_id', user.id)
    .eq('active', true)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: { subscriptions: data ?? [] } })
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const rl = await checkRateLimit(`notif-sub:${getClientIp(request)}`, SUB_RATE)
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: 'Muitas requisições' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })
  }

  const { city, channel } = parsed.data

  if (channel === 'whatsapp') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single()
    if (!profile?.phone) {
      return NextResponse.json(
        { success: false, error: 'Adicione um número de telefone ao perfil para receber alertas via WhatsApp' },
        { status: 422 }
      )
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { error } = await db
    .from('notification_subscriptions')
    .upsert({ user_id: user.id, city, channel, active: true }, { onConflict: 'user_id,city,channel' })

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: { cities: CIDADES_BAIXADA } }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = DeleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { error } = await db
    .from('notification_subscriptions')
    .update({ active: false })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
