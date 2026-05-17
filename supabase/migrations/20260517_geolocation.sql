-- ============================================================
-- Migration: Geolocalização e Rede Sentinela (Watch_Dogs layer)
-- Data: 2026-05-17
-- ============================================================
-- 1. Adiciona lat/lng na tabela pets (e atualiza pets_public view)
-- 2. Atualiza create_pet_anon RPC para aceitar coordenadas opcionais
-- 3. Cria sentinel_partners (rede de câmeras parceiras)
-- ============================================================

-- ── 1. LAT/LNG EM PETS ──────────────────────────────────────

ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS latitude  NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);

-- Índice para queries de mapa (filtro por bbox)
CREATE INDEX IF NOT EXISTS pets_location_idx
  ON public.pets(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ── 2. ATUALIZA VIEW pets_public (inclui lat/lng) ───────────

CREATE OR REPLACE VIEW public.pets_public AS
  SELECT
    id, created_at, updated_at, owner_id,
    kind, name, species, breed, color, size, sex, age_approx,
    description, behavior,
    neighborhood, city, state, event_date, photo_url, status,
    latitude, longitude
  FROM public.pets
  WHERE status = 'active';

GRANT SELECT ON public.pets_public TO anon, authenticated;

-- ── 3. ATUALIZA create_pet_anon RPC (suporte a lat/lng) ─────

CREATE OR REPLACE FUNCTION public.create_pet_anon(
  p_kind text, p_species text, p_color text,
  p_neighborhood text, p_city text, p_state text,
  p_event_date date, p_contact_name text, p_contact_phone text,
  p_contact_whatsapp boolean,
  p_name         text    DEFAULT NULL,
  p_breed        text    DEFAULT NULL,
  p_size         text    DEFAULT NULL,
  p_sex          text    DEFAULT NULL,
  p_age_approx   text    DEFAULT NULL,
  p_description  text    DEFAULT NULL,
  p_behavior     text    DEFAULT NULL,
  p_photo_url    text    DEFAULT NULL,
  p_latitude     NUMERIC DEFAULT NULL,
  p_longitude    NUMERIC DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $func$
DECLARE new_id uuid;
BEGIN
  INSERT INTO public.pets (
    kind, species, color, neighborhood, city, state, event_date,
    contact_name, contact_phone, contact_whatsapp,
    name, breed, size, sex, age_approx, description, behavior, photo_url,
    latitude, longitude,
    owner_id
  ) VALUES (
    p_kind, p_species, p_color, p_neighborhood, p_city, p_state, p_event_date,
    p_contact_name, p_contact_phone, p_contact_whatsapp,
    p_name, p_breed, p_size, p_sex, p_age_approx, p_description, p_behavior, p_photo_url,
    p_latitude, p_longitude,
    NULL
  ) RETURNING id INTO new_id;
  RETURN new_id;
END;
$func$;

-- Revoga grant antigo e re-concede com a nova assinatura
REVOKE ALL ON FUNCTION public.create_pet_anon(
  text,text,text,text,text,text,date,text,text,boolean,
  text,text,text,text,text,text,text,text
) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_pet_anon(
  text,text,text,text,text,text,date,text,text,boolean,
  text,text,text,text,text,text,text,text,NUMERIC,NUMERIC
) TO anon, authenticated;

-- ── 4. TABELA sentinel_partners (Rede de Câmeras Parceiras) ─

CREATE TABLE IF NOT EXISTS public.sentinel_partners (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  type          TEXT        NOT NULL CHECK (type IN (
    'pet_shop', 'vet', 'condo', 'market', 'pharmacy',
    'gas_station', 'school', 'park', 'other'
  )),
  has_cameras   BOOLEAN     NOT NULL DEFAULT true,
  latitude      NUMERIC(10,7) NOT NULL,
  longitude     NUMERIC(10,7) NOT NULL,
  address       TEXT,
  city          TEXT        NOT NULL,
  neighborhood  TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  verified      BOOLEAN     NOT NULL DEFAULT false, -- admin validou presença física
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sentinel_city_active
  ON public.sentinel_partners(city, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_sentinel_location
  ON public.sentinel_partners(latitude, longitude)
  WHERE is_active = true;

ALTER TABLE public.sentinel_partners ENABLE ROW LEVEL SECURITY;

-- SELECT público: qualquer pessoa vê os parceiros ativos no mapa
DROP POLICY IF EXISTS "sentinel_select_public" ON public.sentinel_partners;
CREATE POLICY "sentinel_select_public"
  ON public.sentinel_partners FOR SELECT
  USING (is_active = true);

-- INSERT: apenas usuários autenticados podem se cadastrar como sentinela
DROP POLICY IF EXISTS "sentinel_insert_auth" ON public.sentinel_partners;
CREATE POLICY "sentinel_insert_auth"
  ON public.sentinel_partners FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE/DELETE: apenas admin (via service role) pode alterar
-- (sem policy = bloqueado por padrão)

-- ── 5. GRANT views/funções para o mapa público ──────────────

-- Função pública para buscar pets geo-próximos (futuro PostGIS)
-- Por ora: o app faz bounding box no client. Esta função é placeholder.
CREATE OR REPLACE FUNCTION public.get_pets_for_map()
RETURNS TABLE (
  id         UUID,
  kind       TEXT,
  name       TEXT,
  species    TEXT,
  color      TEXT,
  photo_url  TEXT,
  latitude   NUMERIC,
  longitude  NUMERIC,
  city       TEXT,
  neighborhood TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, kind, name, species, color, photo_url,
         latitude, longitude, city, neighborhood, created_at
  FROM public.pets
  WHERE status = 'active'
    AND latitude  IS NOT NULL
    AND longitude IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_pets_for_map() TO anon, authenticated;

-- ============================================================
-- Como aplicar:
-- 1. Supabase Dashboard → SQL Editor → cole e execute
-- 2. Sem risco de downtime: ADD COLUMN nullable + CREATE OR REPLACE
-- ============================================================
