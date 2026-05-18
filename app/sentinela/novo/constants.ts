/**
 * Constantes do módulo Sentinela.
 * Arquivo sem "use server" — pode ser importado tanto por Server Actions
 * quanto por Client Components.
 */
export const SENTINEL_TYPES = [
  "pet_shop",
  "vet",
  "condo",
  "market",
  "pharmacy",
  "gas_station",
  "school",
  "park",
  "other",
] as const;

export type SentinelType = (typeof SENTINEL_TYPES)[number];
