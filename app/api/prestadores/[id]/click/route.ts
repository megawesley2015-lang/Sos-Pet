import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const CLICK_RATE = { limit: 10, windowMs: 60_000 }

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ip = getClientIp(request)

  const rl = await checkRateLimit(`prestador-click:${ip}:${id}`, CLICK_RATE)
  if (!rl.allowed) {
    return NextResponse.json({ success: true })
  }

  const supabase = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // prestador_events not yet in generated types
  // prestador_events not yet in generated types; incrementar_visualizacao_prestador is the existing RPC
  await Promise.all([
    supabase.rpc('incrementar_visualizacao_prestador', { p_id: id }),
    db.from('prestador_events').insert({ prestador_id: id, event_type: 'whatsapp_click' }),
  ]).catch(() => {})

  return NextResponse.json({ success: true })
}
