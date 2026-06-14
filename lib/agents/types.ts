export type AgentName = 'triagem' | 'moderacao' | 'matching' | 'notificacao'

export type AgentStatus = 'success' | 'error' | 'skipped'

export interface AgentLog {
  id?: string
  agent_name: AgentName
  pet_id: string
  status: AgentStatus
  input_summary: string
  output_summary: string | null
  latency_ms: number
  created_at?: string
}

export interface TriagemResult {
  tags: string[]
  descricao_enriquecida: string | null
  caracteristicas: {
    cor_principal: string | null
    porte: string | null
    raca_provavel: string | null
    caracteristicas_distintivas: string[]
    temperamento: string | null
  }
  palavras_chave: string[]
  confianca: number
}

export interface ModeracaoResult {
  aprovado: boolean
  motivo: string | null
  nivel_risco: 'baixo' | 'medio' | 'alto'
}

export interface PetInputForAgents {
  name: string | null
  species: string
  breed: string | null
  color: string | null
  size: string | null
  sex: string | null
  description: string | null
  behavior: string | null
  neighborhood: string | null
  city: string
}
