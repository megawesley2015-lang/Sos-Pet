-- ============================================================
-- Migration: Pet Health Tables (para tutores — não ONG)
-- Data: 2026-06-12
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pet_vaccinations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id        UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vaccine_name  TEXT NOT NULL,
  applied_at    DATE NOT NULL,
  next_due_at   DATE,
  veterinarian  TEXT,
  clinic        TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pet_medications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id          UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage          TEXT NOT NULL,
  frequency       TEXT NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pet_health_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id        UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visit_date    DATE NOT NULL,
  reason        TEXT NOT NULL,
  diagnosis     TEXT,
  treatment     TEXT,
  veterinarian  TEXT,
  clinic        TEXT,
  weight_kg     DECIMAL(5,2),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pet_vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_health_records ENABLE ROW LEVEL SECURITY;

-- pet_vaccinations: SELECT público, write only owner
DROP POLICY IF EXISTS "pv_select_public" ON public.pet_vaccinations;
CREATE POLICY "pv_select_public" ON public.pet_vaccinations FOR SELECT USING (true);

DROP POLICY IF EXISTS "pv_write_owner" ON public.pet_vaccinations;
CREATE POLICY "pv_write_owner" ON public.pet_vaccinations
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- pet_medications: privado ao owner
DROP POLICY IF EXISTS "pm_owner" ON public.pet_medications;
CREATE POLICY "pm_owner" ON public.pet_medications
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- pet_health_records: privado ao owner
DROP POLICY IF EXISTS "phr_owner" ON public.pet_health_records;
CREATE POLICY "phr_owner" ON public.pet_health_records
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_pv_pet ON public.pet_vaccinations (pet_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_pv_owner ON public.pet_vaccinations (owner_id);
CREATE INDEX IF NOT EXISTS idx_pm_pet_status ON public.pet_medications (pet_id, status);
CREATE INDEX IF NOT EXISTS idx_phr_pet ON public.pet_health_records (pet_id, visit_date DESC);
