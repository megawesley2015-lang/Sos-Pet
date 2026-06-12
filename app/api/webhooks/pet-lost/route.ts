import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const MAX_PETS_PER_DAY = 3

export async function POST(request: NextRequest) {
  const auth = request.headers.get('Authorization')
  const secret = process.env.SUPABASE_WEBHOOK_SECRET

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ success: true })

  const record = body.record ?? body
  if (record.kind !== 'lost' || record.status !== 'active') {
    return NextResponse.json({ success: true })
  }

  const supabase = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await db
    .from('notification_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', record.owner_id)
    .neq('status', 'rate_limited')
    .gte('sent_at', since24h)

  if ((count ?? 0) >= MAX_PETS_PER_DAY) {
    await db.from('notification_logs').insert({
      pet_id: record.id,
      user_id: record.owner_id,
      channel: 'system',
      status: 'rate_limited',
    })
    return NextResponse.json({ success: true })
  }

  const n8nUrl = process.env.N8N_PET_LOST_WEBHOOK_URL
  let status: 'sent' | 'failed' = 'failed'
  let errorMessage: string | null = null

  if (n8nUrl) {
    try {
      const res = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: record.id,
          name: record.name,
          species: record.species,
          city: record.city,
          neighborhood: record.neighborhood,
          photo_url: record.photo_url,
          owner_id: record.owner_id,
        }),
      })
      status = res.ok ? 'sent' : 'failed'
      if (!res.ok) errorMessage = `n8n returned ${res.status}`
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err)
    }
  } else {
    status = 'failed'
    errorMessage = 'N8N_PET_LOST_WEBHOOK_URL not configured'
  }

  await db.from('notification_logs').insert({
    pet_id: record.id,
    user_id: record.owner_id,
    channel: 'system',
    status,
    error_message: errorMessage,
  })

  return NextResponse.json({ success: true })
}
