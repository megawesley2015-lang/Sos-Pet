import { createServiceClient } from '@/lib/supabase/server'
import { runTriagemAgent } from './triage'
import { runModeracaoAgent } from './moderation'
import type { AgentLog, AgentName, AgentStatus, PetInputForAgents } from './types'

async function logAgent(log: Omit<AgentLog, 'id' | 'created_at'>): Promise<void> {
  try {
    const supabase = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('agent_logs').insert(log)
  } catch {
    // best-effort — log não bloqueia o fluxo principal
  }
}

async function saveAiData(petId: string, result: Awaited<ReturnType<typeof runTriagemAgent>>): Promise<void> {
  try {
    const supabase = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('pet_ai_data').upsert({
      pet_id: petId,
      tags: result.tags,
      descricao_enriquecida: result.descricao_enriquecida,
      caracteristicas: result.caracteristicas,
      palavras_chave: result.palavras_chave,
      confianca: result.confianca,
    })
  } catch {
    // best-effort
  }
}

export async function runAgentsForPet(
  petId: string,
  pet: PetInputForAgents
): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('[Agentes] ANTHROPIC_API_KEY não configurada — pulando agentes')
    return
  }

  const t0 = Date.now()

  const [modResult, triagemResult] = await Promise.allSettled([
    runModeracaoAgent(pet),
    runTriagemAgent(pet),
  ])

  const latency = Date.now() - t0

  // ── Moderação ──────────────────────────────────────────────────────────────
  const modStatus: AgentStatus = modResult.status === 'fulfilled' ? 'success' : 'error'
  const modSummary = modResult.status === 'fulfilled'
    ? `aprovado=${modResult.value.aprovado} risco=${modResult.value.nivel_risco}${modResult.value.motivo ? ` motivo=${modResult.value.motivo}` : ''}`
    : String((modResult as PromiseRejectedResult).reason?.message ?? 'erro')

  await logAgent({
    agent_name: 'moderacao' as AgentName,
    pet_id: petId,
    status: modStatus,
    input_summary: `${pet.species} em ${pet.city}`,
    output_summary: modSummary,
    latency_ms: latency,
  })

  // Alto risco → log extra como gate de revisão humana (sem auto-remover)
  // Admin verifica em /admin/agentes e decide manualmente
  if (modResult.status === 'fulfilled' && modResult.value.nivel_risco === 'alto') {
    await logAgent({
      agent_name: 'moderacao' as AgentName,
      pet_id: petId,
      status: 'skipped',
      input_summary: `GATE: alto risco detectado`,
      output_summary: modResult.value.motivo ?? 'revisão humana necessária',
      latency_ms: 0,
    })
    console.log(`[Agentes] GATE: pet ${petId} aguarda revisão humana — ${modResult.value.motivo}`)
  }

  // ── Triagem ────────────────────────────────────────────────────────────────
  const triagemStatus: AgentStatus = triagemResult.status === 'fulfilled' ? 'success' : 'error'
  const triagemSummary = triagemResult.status === 'fulfilled'
    ? `tags=${triagemResult.value.tags.slice(0, 3).join(',')} confiança=${triagemResult.value.confianca.toFixed(2)}`
    : String((triagemResult as PromiseRejectedResult).reason?.message ?? 'erro')

  await logAgent({
    agent_name: 'triagem' as AgentName,
    pet_id: petId,
    status: triagemStatus,
    input_summary: `${pet.species} ${pet.breed ?? ''} em ${pet.city}`.trim(),
    output_summary: triagemSummary,
    latency_ms: latency,
  })

  if (triagemResult.status === 'fulfilled') {
    await saveAiData(petId, triagemResult.value)
  }

  console.log(`[Agentes] pet=${petId} mod=${modStatus} triagem=${triagemStatus} latency=${latency}ms`)
}
