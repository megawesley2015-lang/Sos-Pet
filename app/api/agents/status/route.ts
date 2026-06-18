import { NextResponse } from 'next/server'
import { createServiceClient, createSupabaseServerClient } from '@/lib/supabase/server'
import { ok, fail } from '@/lib/api-response'

export const revalidate = 0

export async function GET() {
  try {
    // Auth: apenas admin pode ver os logs internos dos agentes (pet_id,
    // input/output summaries). Antes este endpoint era público.
    const authed = await createSupabaseServerClient()
    const { data: { user } } = await authed.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    const { data: profile } = await authed
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }

    const supabase = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const [recentLogs, stats] = await Promise.all([
      db
        .from('agent_logs')
        .select('id, agent_name, pet_id, status, input_summary, output_summary, latency_ms, created_at')
        .gte('created_at', since24h)
        .order('created_at', { ascending: false })
        .limit(50),

      db
        .from('agent_logs')
        .select('agent_name, status, latency_ms')
        .gte('created_at', since24h),
    ])

    type LogRow = { agent_name: string; status: string; latency_ms: number }
    const rows: LogRow[] = stats.data ?? []

    const byAgent: Record<string, { total: number; success: number; error: number; avg_latency: number }> = {}

    for (const row of rows) {
      if (!byAgent[row.agent_name]) {
        byAgent[row.agent_name] = { total: 0, success: 0, error: 0, avg_latency: 0 }
      }
      byAgent[row.agent_name].total++
      if (row.status === 'success') byAgent[row.agent_name].success++
      if (row.status === 'error') byAgent[row.agent_name].error++
      byAgent[row.agent_name].avg_latency += row.latency_ms ?? 0
    }

    for (const name of Object.keys(byAgent)) {
      if (byAgent[name].total > 0) {
        byAgent[name].avg_latency = Math.round(byAgent[name].avg_latency / byAgent[name].total)
      }
    }

    return ok({
      agents: byAgent,
      recent_logs: recentLogs.data ?? [],
      anthropic_configured: !!process.env.ANTHROPIC_API_KEY,
    })
  } catch (err) {
    return fail(err)
  }
}
