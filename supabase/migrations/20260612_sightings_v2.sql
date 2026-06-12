-- ============================================================
-- Migration: Avistamentos V2 — adiciona campos novos ao schema existente
-- Data: 2026-06-12
-- ============================================================

-- Adiciona colunas novas (idempotente com IF NOT EXISTS)
ALTER TABLE public.sightings
  ADD COLUMN IF NOT EXISTS latitude    FLOAT8,
  ADD COLUMN IF NOT EXISTS longitude   FLOAT8,
  ADD COLUMN IF NOT EXISTS city        TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS reporter_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sighted_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status       TEXT CHECK (status IN ('active','hidden')) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- Preenche latitude/longitude a partir das colunas lat/lng existentes
UPDATE public.sightings
  SET latitude = lat, longitude = lng
  WHERE latitude IS NULL AND lat IS NOT NULL;

-- Atualiza sighted_at com created_at para registros sem sighted_at
UPDATE public.sightings
  SET sighted_at = created_at
  WHERE sighted_at IS NULL;

-- Índices novos
CREATE INDEX IF NOT EXISTS idx_sightings_city_sighted
  ON public.sightings (city, sighted_at DESC);

CREATE INDEX IF NOT EXISTS idx_sightings_geo
  ON public.sightings (latitude, longitude)
  WHERE latitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sightings_status_created
  ON public.sightings (status, created_at DESC);

-- Atualiza política SELECT para respeitar status
DROP POLICY IF EXISTS "sightings_select_public" ON public.sightings;
CREATE POLICY "sightings_select_public"
  ON public.sightings FOR SELECT
  USING (status = 'active' OR status IS NULL);

-- Política UPDATE para reporter
DROP POLICY IF EXISTS "sightings_update_reporter" ON public.sightings;
CREATE POLICY "sightings_update_reporter"
  ON public.sightings FOR UPDATE
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Política DELETE para reporter
DROP POLICY IF EXISTS "sightings_delete_reporter" ON public.sightings;
CREATE POLICY "sightings_delete_reporter"
  ON public.sightings FOR DELETE
  TO authenticated
  USING (auth.uid() = reporter_id);
