-- ============================================================
-- Migration: LGPD — Semana 2
-- Data: 2026-06-04
-- ============================================================
-- Adiciona:
--   - deleted_at em pets   → rastreia quando dados pessoais foram apagados
--   - consent_at em profiles → rastreia aceite dos termos (LGPD consentimento)
--   - RPC erase_pet_personal_data() → direito ao esquecimento por pet
--   - RPC export_user_data()        → portabilidade de dados (art. 18 LGPD)
-- ============================================================

-- ── pets: timestamp de erasure ──────────────────────────────────────────────
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index para queries de retenção e auditoria LGPD
CREATE INDEX IF NOT EXISTS idx_pets_deleted_at
  ON public.pets (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- ── profiles: timestamp de consentimento ────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;

-- ── RPC: apagar dados pessoais de um pet específico ─────────────────────────
-- Preserva: kind, species, city (dados estatísticos anônimos)
-- Remove: contact_name, contact_phone, name, description, photo_url
-- Requer: usuário autenticado e dono do pet
CREATE OR REPLACE FUNCTION public.erase_pet_personal_data(p_pet_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $func$
BEGIN
  UPDATE public.pets
  SET
    contact_name     = NULL,
    contact_phone    = NULL,
    contact_whatsapp = FALSE,
    name             = NULL,
    description      = NULL,
    photo_url        = NULL,
    status           = 'removed',
    deleted_at       = NOW()
  WHERE id        = p_pet_id
    AND owner_id  = auth.uid()
    AND deleted_at IS NULL;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.erase_pet_personal_data(UUID) TO authenticated;

-- ── RPC: exportar todos os dados do usuário (portabilidade LGPD) ─────────────
-- Retorna JSONB com profile + todos os pets do usuário
-- Requer: usuário autenticado
CREATE OR REPLACE FUNCTION public.export_user_data()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $func$
DECLARE
  v_profile JSONB;
  v_pets    JSONB;
BEGIN
  SELECT to_jsonb(p) INTO v_profile
    FROM public.profiles p
   WHERE p.id = auth.uid();

  SELECT jsonb_agg(to_jsonb(pet)) INTO v_pets
    FROM public.pets pet
   WHERE pet.owner_id = auth.uid();

  RETURN jsonb_build_object(
    'exported_at', NOW(),
    'profile',     v_profile,
    'pets',        COALESCE(v_pets, '[]'::JSONB)
  );
END;
$func$;

GRANT EXECUTE ON FUNCTION public.export_user_data() TO authenticated;

-- ============================================================
-- Como aplicar
-- ============================================================
-- 1. Supabase Dashboard → SQL Editor → cole este arquivo → Run
-- 2. Rode: npx supabase gen types typescript --project-id enpgqgqinbdbvkqtnria > lib/types/database.ts
-- 3. Confirme no Dashboard:
--    - Database → Tables → pets: coluna deleted_at presente
--    - Database → Tables → profiles: coluna consent_at presente
--    - Database → Functions: erase_pet_personal_data, export_user_data
-- ============================================================
