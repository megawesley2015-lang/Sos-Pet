-- ============================================================
-- Migration: Pet Matches — Matching Automatizado por IA
-- Data: 2026-06-12
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pet_matches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_pet_id      UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  found_pet_id     UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','dismissed')),
  matched_by       TEXT NOT NULL DEFAULT 'system' CHECK (matched_by IN ('system','user')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lost_pet_id, found_pet_id)
);

ALTER TABLE public.pet_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pm_select_owner" ON public.pet_matches;
CREATE POLICY "pm_select_owner"
  ON public.pet_matches FOR SELECT
  TO authenticated
  USING (
    lost_pet_id IN (SELECT id FROM public.pets WHERE owner_id = auth.uid())
    OR found_pet_id IN (SELECT id FROM public.pets WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "pm_update_lost_owner" ON public.pet_matches;
CREATE POLICY "pm_update_lost_owner"
  ON public.pet_matches FOR UPDATE
  TO authenticated
  USING (lost_pet_id IN (SELECT id FROM public.pets WHERE owner_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_pm_lost ON public.pet_matches (lost_pet_id);
CREATE INDEX IF NOT EXISTS idx_pm_found ON public.pet_matches (found_pet_id);
CREATE INDEX IF NOT EXISTS idx_pm_status_score ON public.pet_matches (status, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_pm_created ON public.pet_matches (created_at DESC);

CREATE OR REPLACE FUNCTION update_pet_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pm_updated_at ON public.pet_matches;
CREATE TRIGGER trg_pm_updated_at
  BEFORE UPDATE ON public.pet_matches
  FOR EACH ROW EXECUTE FUNCTION update_pet_matches_updated_at();
