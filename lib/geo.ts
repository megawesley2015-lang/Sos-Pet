// lib/geo.ts — Haversine distance e wrapper para RPC get_pets_by_radius

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Calcula distância em km entre dois pontos geográficos (fórmula Haversine).
 * Precisão: ~0.5% — suficiente para raios de 1–50 km em contexto urbano.
 */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R    = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

// ── Tipos do resultado da RPC ────────────────────────────────────────────────

export interface PetByRadius {
  id:           string
  kind:         string
  name:         string | null
  species:      string
  color:        string | null
  photo_url:    string | null
  neighborhood: string | null
  city:         string | null
  status:       string
  created_at:   string
  distance_km:  number
}

export interface PrestadorByRadius {
  id:               string
  slug:             string
  nome:             string
  categoria:        string
  plan:             string
  cidade:           string | null
  bairro:           string | null
  logo_url:         string | null
  emergencia24h:    boolean
  media_avaliacoes: number | null
  distance_km:      number
}

// ── Parâmetros das queries ───────────────────────────────────────────────────

export interface GetPetsByRadiusParams {
  lat:       number
  lng:       number
  radiusKm?: number
  kind?:     'lost' | 'found'
  species?:  string
  limit?:    number
}

export interface GetPrestadoresByRadiusParams {
  lat:       number
  lng:       number
  radiusKm?: number
  categoria?: string
  plan?:     'free' | 'premium'
  limit?:    number
}

// ── Wrappers de RPC ──────────────────────────────────────────────────────────

export async function getPetsByRadius(
  supabase: SupabaseClient,
  params: GetPetsByRadiusParams,
): Promise<PetByRadius[]> {
  const { data, error } = await supabase.rpc('get_pets_by_radius', {
    p_lat:       params.lat,
    p_lng:       params.lng,
    p_radius_km: params.radiusKm ?? 10,
    p_kind:      params.kind    ?? null,
    p_species:   params.species ?? null,
    p_limit:     params.limit   ?? 20,
  })
  if (error) throw error
  return (data ?? []) as PetByRadius[]
}

export async function getPrestadoresByRadius(
  supabase: SupabaseClient,
  params: GetPrestadoresByRadiusParams,
): Promise<PrestadorByRadius[]> {
  const { data, error } = await supabase.rpc('get_prestadores_by_radius', {
    p_lat:       params.lat,
    p_lng:       params.lng,
    p_radius_km: params.radiusKm ?? 10,
    p_categoria: params.categoria ?? null,
    p_plan:      params.plan      ?? null,
    p_limit:     params.limit     ?? 20,
  })
  if (error) throw error
  return (data ?? []) as PrestadorByRadius[]
}
