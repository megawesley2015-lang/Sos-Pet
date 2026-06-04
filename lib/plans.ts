// lib/plans.ts — tiers de monetização para prestadores

export type PlanTier = 'free' | 'premium'

export const PLAN_LABELS: Record<PlanTier, string> = {
  free:    'Gratuito',
  premium: 'Premium',
}

export const PLAN_FEATURES: Record<PlanTier, string[]> = {
  free: [
    'Perfil básico na listagem',
    'Contato via telefone',
  ],
  premium: [
    'Destaque nas buscas',
    'Badge verificado',
    'Agendamento online',
    'Painel de analytics',
    'Notificações de pets próximos',
  ],
}

export function isPremium(plan: PlanTier | string | null | undefined): boolean {
  return plan === 'premium'
}
