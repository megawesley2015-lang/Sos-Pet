import { createServiceClient } from '@/lib/supabase/server'
import { Bot, CheckCircle, XCircle, Clock, Zap, Shield, Search, Bell } from 'lucide-react'

export const revalidate = 30

export const metadata = { title: 'Admin — Agentes IA' }

const AGENT_META: Record<string, { label: string; icon: typeof Bot; desc: string }> = {
  triagem: {
    label: 'Agente de Triagem',
    icon: Search,
    desc: 'Enriquece descrições e extrai características para melhorar o matching',
  },
  moderacao: {
    label: 'Agente de Moderação',
    icon: Shield,
    desc: 'Detecta spam, conteúdo comercial e publicações suspeitas',
  },
  matching: {
    label: 'Agente de Matching',
    icon: Zap,
    desc: 'Cruza pets perdidos × encontrados e calcula compatibilidade',
  },
  notificacao: {
    label: 'Agente de Notificação',
    icon: Bell,
    desc: 'Dispara alertas via WhatsApp e e-mail para tutores e voluntários',
  },
}

type LogRow = {
  id: string
  agent_name: string
  pet_id: string
  status: string
  input_summary: string | null
  output_summary: string | null
  latency_ms: number | null
  created_at: string
}

type AgentStat = {
  total: number
  success: number
  error: number
  avg_latency: number
}

export default async function AgentesPage() {
  const supabase = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [logsRes, statsRes, gatesRes] = await Promise.all([
    db
      .from('agent_logs')
      .select('id, agent_name, pet_id, status, input_summary, output_summary, latency_ms, created_at')
      .gte('created_at', since24h)
      .order('created_at', { ascending: false })
      .limit(40),
    db
      .from('agent_logs')
      .select('agent_name, status, latency_ms')
      .gte('created_at', since24h),
    db
      .from('agent_logs')
      .select('id, pet_id, output_summary, created_at')
      .eq('agent_name', 'moderacao')
      .eq('status', 'skipped')
      .ilike('input_summary', 'GATE%')
      .gte('created_at', since24h)
      .order('created_at', { ascending: false }),
  ])

  const logs: LogRow[] = logsRes.data ?? []
  const statRows: { agent_name: string; status: string; latency_ms: number }[] = statsRes.data ?? []
  const gates: { id: string; pet_id: string; output_summary: string | null; created_at: string }[] = gatesRes.data ?? []

  const byAgent: Record<string, AgentStat> = {}
  for (const row of statRows) {
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

  const anthropicOk = !!process.env.ANTHROPIC_API_KEY

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Time de IA</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Agentes autônomos operando o SOS Pet Aumigo — AI-First OS
        </p>
      </div>

      {/* Gates — revisão humana necessária */}
      {gates.length > 0 && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-sm font-semibold text-red-300">
              {gates.length} pet(s) aguardando revisão humana (alto risco)
            </span>
          </div>
          <div className="space-y-2">
            {gates.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg bg-red-500/10 px-3 py-2 text-xs">
                <span className="font-mono text-red-300">{g.pet_id.slice(0, 8)}…</span>
                <span className="text-fg-muted">{g.output_summary ?? '—'}</span>
                <a
                  href={`/admin/pets?id=${g.pet_id}`}
                  className="ml-4 rounded bg-red-500/20 px-2 py-0.5 text-red-300 hover:bg-red-500/30 transition-colors"
                >
                  Revisar
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status da chave de API */}
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        anthropicOk
          ? 'border-emerald-500/30 bg-emerald-500/10'
          : 'border-red-500/30 bg-red-500/10'
      }`}>
        <Bot className={`h-4 w-4 shrink-0 ${anthropicOk ? 'text-emerald-400' : 'text-red-400'}`} />
        <p className="text-sm text-fg">
          {anthropicOk
            ? 'ANTHROPIC_API_KEY configurada — agentes ativos'
            : 'ANTHROPIC_API_KEY não configurada — adicione nas variáveis de ambiente para ativar os agentes'}
        </p>
      </div>

      {/* Cards dos agentes */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries(AGENT_META).map(([name, meta]) => {
          const stat = byAgent[name]
          const Icon = meta.icon
          const successRate = stat && stat.total > 0
            ? Math.round((stat.success / stat.total) * 100)
            : null

          return (
            <div key={name} className="rounded-xl border border-white/10 bg-ink-700/50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15">
                  <Icon className="h-4 w-4 text-brand-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-fg">{meta.label}</p>
                  <p className="mt-0.5 text-xs text-fg-muted">{meta.desc}</p>
                </div>
              </div>

              {stat ? (
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-ink-600/60 px-2 py-2">
                    <p className="font-display text-xl font-bold text-fg">{stat.total}</p>
                    <p className="text-xs text-fg-muted">execuções</p>
                  </div>
                  <div className="rounded-lg bg-emerald-500/10 px-2 py-2">
                    <p className="font-display text-xl font-bold text-emerald-400">
                      {successRate ?? '—'}%
                    </p>
                    <p className="text-xs text-fg-muted">sucesso</p>
                  </div>
                  <div className="rounded-lg bg-ink-600/60 px-2 py-2">
                    <p className="font-display text-xl font-bold text-fg">{stat.avg_latency}ms</p>
                    <p className="text-xs text-fg-muted">latência</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-center text-xs text-fg-subtle">Sem execuções nas últimas 24h</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Log recente */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-fg">Últimas 40 execuções (24h)</h2>

        {logs.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-ink-700/30 px-4 py-8 text-center">
            <p className="text-sm text-fg-muted">Nenhuma execução registrada nas últimas 24h.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-ink-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-4 py-2.5 text-fg-muted font-medium">Hora</th>
                  <th className="px-4 py-2.5 text-fg-muted font-medium">Agente</th>
                  <th className="px-4 py-2.5 text-fg-muted font-medium">Status</th>
                  <th className="px-4 py-2.5 text-fg-muted font-medium hidden md:table-cell">Input</th>
                  <th className="px-4 py-2.5 text-fg-muted font-medium hidden lg:table-cell">Output</th>
                  <th className="px-4 py-2.5 text-fg-muted font-medium text-right">ms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => {
                  const hora = new Date(log.created_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                  return (
                    <tr key={log.id} className="hover:bg-ink-700/30 transition-colors">
                      <td className="px-4 py-2 text-fg-muted tabular-nums">{hora}</td>
                      <td className="px-4 py-2">
                        <span className="rounded bg-brand-500/15 px-1.5 py-0.5 text-brand-400 font-mono">
                          {log.agent_name}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {log.status === 'success' ? (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        ) : log.status === 'error' ? (
                          <XCircle className="h-3.5 w-3.5 text-red-400" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-fg-muted" />
                        )}
                      </td>
                      <td className="px-4 py-2 text-fg-muted hidden md:table-cell max-w-[180px] truncate">
                        {log.input_summary ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-fg-muted hidden lg:table-cell max-w-[240px] truncate">
                        {log.output_summary ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-fg-muted tabular-nums text-right">
                        {log.latency_ms ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
