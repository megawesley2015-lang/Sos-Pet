-- =============================================================
-- MIGRATION: 20260620_security_hardening_part2.sql
-- Corrige o que restou da auditoria:
--   1. Funções perigosas acessíveis via PUBLIC grant
--   2. Storage buckets com SELECT policy que permite listing irrestrito
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- BLOCO 1: Funções que não devem ser chamadas por anon
-- O REVOKE anterior removeu o grant direto de anon, mas o grant
-- PUBLIC (=X) ainda dava acesso implícito. Revogar PUBLIC e
-- conceder só a authenticated + service_role.
-- ─────────────────────────────────────────────────────────────

-- erase_pet_personal_data: apaga dados de pet — só o dono autenticado deve chamar
REVOKE EXECUTE ON FUNCTION public.erase_pet_personal_data(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.erase_pet_personal_data(uuid) TO authenticated, service_role;

-- export_user_data: exporta dados do usuário (LGPD) — só o próprio usuário autenticado
REVOKE EXECUTE ON FUNCTION public.export_user_data() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.export_user_data() TO authenticated, service_role;

-- handle_new_user / handle_new_prestador: triggers internos, não devem ser chamados via REST
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_prestador() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.handle_new_prestador() TO service_role;

-- atualizar_media_prestador: função administrativa
REVOKE EXECUTE ON FUNCTION public.atualizar_media_prestador() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.atualizar_media_prestador() TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────
-- BLOCO 2: Storage buckets — remover SELECT policies de listing irrestrito
--
-- Em buckets PÚBLICOS do Supabase, o acesso via URL direta
-- (/storage/v1/object/public/bucket/path) NÃO passa pelo RLS.
-- A política SELECT controla apenas o listing via API.
-- Removendo a política ampla e adicionando uma restrita ao
-- próprio folder do usuário, mantemos URLs públicas funcionando
-- mas impedimos que qualquer pessoa liste todos os arquivos.
-- ─────────────────────────────────────────────────────────────

-- ── alert-cards ──
DROP POLICY IF EXISTS alert_cards_public_read ON storage.objects;
CREATE POLICY alert_cards_owner_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'alert-cards'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ── avatars ──
DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
CREATE POLICY avatars_owner_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ── pet-photos ──
-- Upload é só via service_role, portanto listing é só para service_role
DROP POLICY IF EXISTS pet_photos_public_read ON storage.objects;
CREATE POLICY pet_photos_service_read ON storage.objects
  FOR SELECT TO service_role
  USING (bucket_id = 'pet-photos');

-- ── provider-photos ──
DROP POLICY IF EXISTS provider_photos_public_read ON storage.objects;
CREATE POLICY provider_photos_owner_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'provider-photos'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ── sightings ──
-- Remover duplicata e manter uma só policy restrita a authenticated
DROP POLICY IF EXISTS sightings_bucket_public_read ON storage.objects;
DROP POLICY IF EXISTS sightings_bucket_read ON storage.objects;
CREATE POLICY sightings_public_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'sightings');
