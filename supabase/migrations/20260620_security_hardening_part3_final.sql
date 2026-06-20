-- =============================================================
-- MIGRATION: 20260620_security_hardening_part3_final.sql
-- Fecha os últimos itens acionáveis da auditoria:
--   1. sightings bucket: remover SELECT policy ampla
--   2. is_pet_owner / is_shelter_owner: revoke de anon e authenticated
--   3. handle_new_user / handle_new_prestador: revoke de authenticated
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- BLOCO 1: sightings bucket
-- Bucket é público — URL /storage/v1/object/public/sightings/...
-- não passa pelo RLS, então a policy SELECT não é necessária.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS sightings_public_read ON storage.objects;

-- ─────────────────────────────────────────────────────────────
-- BLOCO 2: is_pet_owner e is_shelter_owner
-- Helpers de RLS chamados pelo postgres ao avaliar policies.
-- Não precisam ser expostas via REST API.
-- ─────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.is_pet_owner(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_pet_owner(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.is_shelter_owner(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_shelter_owner(uuid) TO service_role;

-- ─────────────────────────────────────────────────────────────
-- BLOCO 3: handle_new_user e handle_new_prestador
-- Funções de trigger — só o sistema (postgres/service_role) deve chamar.
-- ─────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_prestador() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.handle_new_prestador() TO service_role;
