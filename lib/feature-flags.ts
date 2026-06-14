// lib/feature-flags.ts — acesso type-safe a feature flags no perfil do usuário
//
// Flags são armazenadas como JSONB em profiles.feature_flags.
// Ativadas manualmente pelo admin ou automaticamente ao assinar plano premium.

export type FeatureFlag =
  | 'priority_listing'     // aparecer no topo das buscas de prestadores
  | 'verified_badge'       // exibir badge de verificado no perfil
  | 'analytics_dashboard'  // acesso ao painel de métricas
  | 'bulk_notifications'   // notificações em massa para contatos salvos
  | 'api_access'           // acesso à API pública do Pet Aumigo

export type FeatureFlags = Partial<Record<FeatureFlag, boolean>>

/** Verifica se uma flag está ativa */
export function hasFlag(
  flags: FeatureFlags | Record<string, unknown> | null | undefined,
  flag:  FeatureFlag,
): boolean {
  return (flags as FeatureFlags)?.[flag] === true
}

/** Retorna todas as flags ativas */
export function activeFlags(
  flags: FeatureFlags | Record<string, unknown> | null | undefined,
): FeatureFlag[] {
  if (!flags) return []
  return (Object.keys(flags) as FeatureFlag[]).filter(
    (k) => (flags as FeatureFlags)[k] === true
  )
}

/** Flags padrão para usuários do plano premium */
export const PREMIUM_FLAGS: FeatureFlags = {
  priority_listing:    true,
  verified_badge:      true,
  analytics_dashboard: true,
  bulk_notifications:  true,
}

/** Flags padrão para usuários do plano free */
export const FREE_FLAGS: FeatureFlags = {}
