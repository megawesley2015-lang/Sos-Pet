-- ============================================================
-- SOS Pet — Módulo: Gestão para ONGs e Protetores
-- Migration: 001_ong_module
-- Idempotente: usa IF NOT EXISTS / OR REPLACE em todos os objetos
-- ============================================================

-- ── 1. SHELTERS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shelters (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  type          TEXT        NOT NULL CHECK (type IN ('ong', 'protetor')),
  cnpj          TEXT,
  phone         TEXT        NOT NULL,
  email         TEXT,
  city          TEXT        NOT NULL,
  neighborhood  TEXT,
  description   TEXT,
  logo_url      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. SHELTER_PETS ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shelter_pets (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shelter_id      UUID        NOT NULL REFERENCES public.shelters(id) ON DELETE CASCADE,
  name            TEXT,
  species         TEXT        NOT NULL CHECK (species IN ('dog', 'cat', 'other')),
  breed           TEXT,
  color           TEXT        NOT NULL,
  size            TEXT        NOT NULL CHECK (size IN ('small', 'medium', 'large')),
  sex             TEXT        NOT NULL CHECK (sex IN ('male', 'female', 'unknown')),
  estimated_age   TEXT,
  rescue_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  rescue_location TEXT,
  health_status   TEXT        NOT NULL DEFAULT 'healthy'
                              CHECK (health_status IN ('healthy', 'recovering', 'critical', 'treated')),
  behavior        TEXT,
  description     TEXT,
  photo_url       TEXT,
  status          TEXT        NOT NULL DEFAULT 'available'
                              CHECK (status IN ('available', 'fostered', 'adopted', 'deceased')),
  -- Prontuário — dados fixos do pet
  weight_kg       NUMERIC(5,2),
  microchip       TEXT,
  is_castrated    BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adiciona colunas de prontuário se a tabela já existia sem elas
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shelter_pets' AND column_name='weight_kg') THEN
    ALTER TABLE public.shelter_pets ADD COLUMN weight_kg NUMERIC(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shelter_pets' AND column_name='microchip') THEN
    ALTER TABLE public.shelter_pets ADD COLUMN microchip TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shelter_pets' AND column_name='is_castrated') THEN
    ALTER TABLE public.shelter_pets ADD COLUMN is_castrated BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- ── 3. MEDICAL_RECORDS ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.medical_records (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id      UUID        NOT NULL REFERENCES public.shelter_pets(id) ON DELETE CASCADE,
  record_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  type        TEXT        NOT NULL CHECK (type IN ('consultation', 'surgery', 'exam', 'treatment', 'observation')),
  description TEXT        NOT NULL,
  vet_name    TEXT,
  weight_kg   NUMERIC(5,2),
  notes       TEXT,
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. VACCINATIONS ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vaccinations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id         UUID        NOT NULL REFERENCES public.shelter_pets(id) ON DELETE CASCADE,
  vaccine_name   TEXT        NOT NULL,
  applied_date   DATE        NOT NULL,
  next_dose_date DATE,
  vet_name       TEXT,
  batch          TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. MEDICATIONS ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.medications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id          UUID        NOT NULL REFERENCES public.shelter_pets(id) ON DELETE CASCADE,
  medication_name TEXT        NOT NULL,
  dosage          TEXT        NOT NULL,
  frequency       TEXT        NOT NULL,
  start_date      DATE        NOT NULL,
  end_date        DATE,
  is_ongoing      BOOLEAN     NOT NULL DEFAULT false,
  reason          TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 6. ADOPTIONS ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.adoptions (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id               UUID        NOT NULL REFERENCES public.shelter_pets(id) ON DELETE CASCADE,
  shelter_id           UUID        NOT NULL REFERENCES public.shelters(id) ON DELETE CASCADE,
  adopter_name         TEXT        NOT NULL,
  adopter_phone        TEXT        NOT NULL,
  adopter_email        TEXT,
  adopter_city         TEXT        NOT NULL,
  adopter_neighborhood TEXT,
  adoption_date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  -- Acompanhamento pós-adoção em dois checkpoints
  follow_up_30_date    DATE,
  follow_up_30_notes   TEXT,
  follow_up_90_date    DATE,
  follow_up_90_notes   TEXT,
  -- Status: active=em andamento, returned=devolvido, deceased=falecido, transferred=transferido
  status               TEXT        NOT NULL DEFAULT 'active'
                                   CHECK (status IN ('active', 'returned', 'deceased', 'transferred')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adiciona colunas de follow-up se a tabela já existia com schema antigo
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='adoptions' AND column_name='follow_up_30_date') THEN
    ALTER TABLE public.adoptions ADD COLUMN follow_up_30_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='adoptions' AND column_name='follow_up_30_notes') THEN
    ALTER TABLE public.adoptions ADD COLUMN follow_up_30_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='adoptions' AND column_name='follow_up_90_date') THEN
    ALTER TABLE public.adoptions ADD COLUMN follow_up_90_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='adoptions' AND column_name='follow_up_90_notes') THEN
    ALTER TABLE public.adoptions ADD COLUMN follow_up_90_notes TEXT;
  END IF;
END $$;

-- Corrige constraint de status se veio do schema antigo (pending/completed/returned)
DO $$ BEGIN
  ALTER TABLE public.adoptions DROP CONSTRAINT IF EXISTS adoptions_status_check;
  ALTER TABLE public.adoptions ADD CONSTRAINT adoptions_status_check
    CHECK (status IN ('active', 'returned', 'deceased', 'transferred'));
EXCEPTION WHEN others THEN NULL;
END $$;

-- ── ÍNDICES ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_shelters_user_id     ON public.shelters(user_id);
CREATE INDEX IF NOT EXISTS idx_shelter_pets_shelter  ON public.shelter_pets(shelter_id);
CREATE INDEX IF NOT EXISTS idx_shelter_pets_status   ON public.shelter_pets(status);
CREATE INDEX IF NOT EXISTS idx_shelter_pets_health   ON public.shelter_pets(health_status);
CREATE INDEX IF NOT EXISTS idx_shelter_pets_rescue   ON public.shelter_pets(rescue_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_pet   ON public.medical_records(pet_id, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_vaccinations_pet      ON public.vaccinations(pet_id, applied_date DESC);
CREATE INDEX IF NOT EXISTS idx_medications_pet       ON public.medications(pet_id);
CREATE INDEX IF NOT EXISTS idx_medications_ongoing   ON public.medications(pet_id) WHERE is_ongoing = true;
CREATE INDEX IF NOT EXISTS idx_adoptions_shelter     ON public.adoptions(shelter_id, adoption_date DESC);
CREATE INDEX IF NOT EXISTS idx_adoptions_pet         ON public.adoptions(pet_id);

-- ── UPDATED_AT TRIGGER ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers — cria apenas se não existirem
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_shelters') THEN
    CREATE TRIGGER set_updated_at_shelters
      BEFORE UPDATE ON public.shelters
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_shelter_pets') THEN
    CREATE TRIGGER set_updated_at_shelter_pets
      BEFORE UPDATE ON public.shelter_pets
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_adoptions') THEN
    CREATE TRIGGER set_updated_at_adoptions
      BEFORE UPDATE ON public.adoptions
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- ── ROW LEVEL SECURITY ────────────────────────────────────

ALTER TABLE public.shelters        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelter_pets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoptions       ENABLE ROW LEVEL SECURITY;

-- Policies — DROP + CREATE para garantir estado correto
DO $$ BEGIN
  DROP POLICY IF EXISTS "shelters_select_own" ON public.shelters;
  DROP POLICY IF EXISTS "shelters_insert_auth" ON public.shelters;
  DROP POLICY IF EXISTS "shelters_update_own"  ON public.shelters;
  DROP POLICY IF EXISTS "shelters_delete_own"  ON public.shelters;
END $$;

CREATE POLICY "shelters_select_own" ON public.shelters
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shelters_insert_auth" ON public.shelters
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shelters_update_own" ON public.shelters
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "shelters_delete_own" ON public.shelters
  FOR DELETE USING (auth.uid() = user_id);

-- Helper: dono do shelter
CREATE OR REPLACE FUNCTION public.is_shelter_owner(p_shelter_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shelters
    WHERE id = p_shelter_id AND user_id = auth.uid()
  );
$$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "shelter_pets_select_own" ON public.shelter_pets;
  DROP POLICY IF EXISTS "shelter_pets_insert_own" ON public.shelter_pets;
  DROP POLICY IF EXISTS "shelter_pets_update_own" ON public.shelter_pets;
  DROP POLICY IF EXISTS "shelter_pets_delete_own" ON public.shelter_pets;
END $$;

CREATE POLICY "shelter_pets_select_own" ON public.shelter_pets
  FOR SELECT USING (public.is_shelter_owner(shelter_id));
CREATE POLICY "shelter_pets_insert_own" ON public.shelter_pets
  FOR INSERT WITH CHECK (public.is_shelter_owner(shelter_id));
CREATE POLICY "shelter_pets_update_own" ON public.shelter_pets
  FOR UPDATE USING (public.is_shelter_owner(shelter_id));
CREATE POLICY "shelter_pets_delete_own" ON public.shelter_pets
  FOR DELETE USING (public.is_shelter_owner(shelter_id));

-- Helper: dono via pet_id
CREATE OR REPLACE FUNCTION public.is_pet_owner(p_pet_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shelter_pets sp
    JOIN public.shelters s ON s.id = sp.shelter_id
    WHERE sp.id = p_pet_id AND s.user_id = auth.uid()
  );
$$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "medical_records_select_own" ON public.medical_records;
  DROP POLICY IF EXISTS "medical_records_insert_own" ON public.medical_records;
  DROP POLICY IF EXISTS "medical_records_delete_own" ON public.medical_records;
END $$;

CREATE POLICY "medical_records_select_own" ON public.medical_records
  FOR SELECT USING (public.is_pet_owner(pet_id));
CREATE POLICY "medical_records_insert_own" ON public.medical_records
  FOR INSERT WITH CHECK (public.is_pet_owner(pet_id));
CREATE POLICY "medical_records_delete_own" ON public.medical_records
  FOR DELETE USING (public.is_pet_owner(pet_id));

DO $$ BEGIN
  DROP POLICY IF EXISTS "vaccinations_select_own" ON public.vaccinations;
  DROP POLICY IF EXISTS "vaccinations_insert_own" ON public.vaccinations;
  DROP POLICY IF EXISTS "vaccinations_delete_own" ON public.vaccinations;
END $$;

CREATE POLICY "vaccinations_select_own" ON public.vaccinations
  FOR SELECT USING (public.is_pet_owner(pet_id));
CREATE POLICY "vaccinations_insert_own" ON public.vaccinations
  FOR INSERT WITH CHECK (public.is_pet_owner(pet_id));
CREATE POLICY "vaccinations_delete_own" ON public.vaccinations
  FOR DELETE USING (public.is_pet_owner(pet_id));

DO $$ BEGIN
  DROP POLICY IF EXISTS "medications_select_own" ON public.medications;
  DROP POLICY IF EXISTS "medications_insert_own" ON public.medications;
  DROP POLICY IF EXISTS "medications_update_own" ON public.medications;
  DROP POLICY IF EXISTS "medications_delete_own" ON public.medications;
END $$;

CREATE POLICY "medications_select_own" ON public.medications
  FOR SELECT USING (public.is_pet_owner(pet_id));
CREATE POLICY "medications_insert_own" ON public.medications
  FOR INSERT WITH CHECK (public.is_pet_owner(pet_id));
CREATE POLICY "medications_update_own" ON public.medications
  FOR UPDATE USING (public.is_pet_owner(pet_id));
CREATE POLICY "medications_delete_own" ON public.medications
  FOR DELETE USING (public.is_pet_owner(pet_id));

DO $$ BEGIN
  DROP POLICY IF EXISTS "adoptions_select_own" ON public.adoptions;
  DROP POLICY IF EXISTS "adoptions_insert_own" ON public.adoptions;
  DROP POLICY IF EXISTS "adoptions_update_own" ON public.adoptions;
END $$;

CREATE POLICY "adoptions_select_own" ON public.adoptions
  FOR SELECT USING (public.is_shelter_owner(shelter_id));
CREATE POLICY "adoptions_insert_own" ON public.adoptions
  FOR INSERT WITH CHECK (public.is_shelter_owner(shelter_id));
CREATE POLICY "adoptions_update_own" ON public.adoptions
  FOR UPDATE USING (public.is_shelter_owner(shelter_id));
