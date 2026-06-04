-- ============================================================
-- Migration: Semana 3 — base de negócio
-- Data: 2026-06-04
-- ============================================================
-- 1. prestadores.plan          → tier de monetização (free / premium)
-- 2. profiles.feature_flags    → flags de funcionalidade por usuário
-- 3. get_pets_by_radius()      → query espacial por raio (Haversine)
-- ============================================================

-- ── 1. prestadores: coluna de plano ─────────────────────────

ALTER TABLE public.prestadores
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
  CONSTRAINT prestadores_plan_check CHECK (plan IN ('free', 'premium'));

-- Index composto para listar prestadores premium ativos
CREATE INDEX IF NOT EXISTS idx_prestadores_plan_status
  ON public.prestadores (plan, status)
  WHERE status = 'ativo';

-- ── 2. profiles: feature flags ───────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS feature_flags JSONB NOT NULL DEFAULT '{}';

-- GIN index para queries em flags específicas
-- Ex: WHERE feature_flags @> '{"priority_listing": true}'
CREATE INDEX IF NOT EXISTS idx_profiles_feature_flags
  ON public.profiles USING GIN (feature_flags);

-- ── 3. RPC: pets por raio (Haversine, sem extensão PostGIS) ──
--
-- Usa bounding box para aproveitar pets_location_idx e filtra
-- com a fórmula exata de Haversine em seguida.
-- Precisão: ~0.5% de erro — suficiente para raios de 1–50 km.

CREATE OR REPLACE FUNCTION public.get_pets_by_radius(
  p_lat        NUMERIC,
  p_lng        NUMERIC,
  p_radius_km  NUMERIC  DEFAULT 10,
  p_kind       TEXT     DEFAULT NULL,
  p_species    TEXT     DEFAULT NULL,
  p_limit      INTEGER  DEFAULT 20
)
RETURNS TABLE (
  id           UUID,
  kind         TEXT,
  name         TEXT,
  species      TEXT,
  color        TEXT,
  photo_url    TEXT,
  neighborhood TEXT,
  city         TEXT,
  status       TEXT,
  created_at   TIMESTAMPTZ,
  distance_km  NUMERIC
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH candidates AS (
    SELECT
      p.id, p.kind, p.name, p.species, p.color, p.photo_url,
      p.neighborhood, p.city, p.status, p.created_at,
      ROUND((
        6371.0 * 2.0 * ASIN(SQRT(
          POWER(SIN(RADIANS((p.latitude  - p_lat) / 2.0)), 2) +
          COS(RADIANS(p_lat)) * COS(RADIANS(p.latitude)) *
          POWER(SIN(RADIANS((p.longitude - p_lng) / 2.0)), 2)
        ))
      )::NUMERIC, 2) AS distance_km
    FROM public.pets p
    WHERE
      p.status    = 'active'
      AND p.latitude  IS NOT NULL
      AND p.longitude IS NOT NULL
      AND (p_kind    IS NULL OR p.kind    = p_kind)
      AND (p_species IS NULL OR p.species = p_species)
      -- Bounding box pré-filtra usando pets_location_idx (B-tree)
      AND p.latitude  BETWEEN p_lat - (p_radius_km / 111.0)
                          AND p_lat + (p_radius_km / 111.0)
      AND p.longitude BETWEEN p_lng - (p_radius_km / (111.0 * COS(RADIANS(p_lat))))
                          AND p_lng + (p_radius_km / (111.0 * COS(RADIANS(p_lat))))
  )
  SELECT * FROM candidates
  WHERE  distance_km <= p_radius_km
  ORDER BY distance_km
  LIMIT  p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_pets_by_radius(NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, INTEGER)
  TO anon, authenticated;

-- ── 4. RPC: prestadores por raio (mesmo padrão Haversine) ───

CREATE OR REPLACE FUNCTION public.get_prestadores_by_radius(
  p_lat        NUMERIC,
  p_lng        NUMERIC,
  p_radius_km  NUMERIC DEFAULT 10,
  p_categoria  TEXT    DEFAULT NULL,
  p_plan       TEXT    DEFAULT NULL,
  p_limit      INTEGER DEFAULT 20
)
RETURNS TABLE (
  id           UUID,
  slug         TEXT,
  nome         TEXT,
  categoria    TEXT,
  plan         TEXT,
  cidade       TEXT,
  bairro       TEXT,
  logo_url     TEXT,
  emergencia24h BOOLEAN,
  media_avaliacoes NUMERIC,
  distance_km  NUMERIC
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH candidates AS (
    SELECT
      pr.id, pr.slug, pr.nome, pr.categoria, pr.plan,
      pr.cidade, pr.bairro, pr.logo_url, pr.emergencia24h, pr.media_avaliacoes,
      ROUND((
        6371.0 * 2.0 * ASIN(SQRT(
          POWER(SIN(RADIANS((sp.latitude  - p_lat) / 2.0)), 2) +
          COS(RADIANS(p_lat)) * COS(RADIANS(sp.latitude)) *
          POWER(SIN(RADIANS((sp.longitude - p_lng) / 2.0)), 2)
        ))
      )::NUMERIC, 2) AS distance_km
    FROM public.prestadores pr
    JOIN public.sentinel_partners sp ON sp.nome = pr.nome -- join por localização registrada
    WHERE
      pr.status = 'ativo'
      AND (p_categoria IS NULL OR pr.categoria = p_categoria)
      AND (p_plan      IS NULL OR pr.plan      = p_plan)
      AND sp.latitude  IS NOT NULL
      AND sp.latitude  BETWEEN p_lat - (p_radius_km / 111.0)
                           AND p_lat + (p_radius_km / 111.0)
      AND sp.longitude BETWEEN p_lng - (p_radius_km / (111.0 * COS(RADIANS(p_lat))))
                           AND p_lng + (p_radius_km / (111.0 * COS(RADIANS(p_lat))))
  )
  SELECT * FROM candidates
  WHERE  distance_km <= p_radius_km
  ORDER BY distance_km
  LIMIT  p_limit;
$$;

-- TODO: quando prestadores tiver próprias colunas lat/lng, remover o JOIN
GRANT EXECUTE ON FUNCTION public.get_prestadores_by_radius(NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, INTEGER)
  TO anon, authenticated;

-- ============================================================
-- Como aplicar
-- ============================================================
-- 1. Supabase Dashboard → SQL Editor → cole este arquivo → Run
-- 2. Regenerar tipos:
--    npx supabase gen types typescript --project-id odrybnjjpdxqjofgewam > lib/types/database.ts
-- 3. Confirmar:
--    - Database → Tables → prestadores: coluna plan presente (default 'free')
--    - Database → Tables → profiles: coluna feature_flags presente (default '{}')
--    - Database → Functions: get_pets_by_radius, get_prestadores_by_radius
-- ============================================================
