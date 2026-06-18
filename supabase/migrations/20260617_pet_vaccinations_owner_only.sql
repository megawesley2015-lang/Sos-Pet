-- ============================================================
-- Segurança: restringe leitura de pet_vaccinations ao dono
-- ============================================================
-- Antes: a policy "pv_select_public" permitia SELECT USING (true),
-- expondo veterinário, clínica e notas (PII) de QUALQUER pet via
-- GET /api/pets/[id]/health/vaccinations.
--
-- A policy "pv_write_owner" (FOR ALL TO authenticated, owner-only)
-- já cobre o SELECT do próprio dono — basta remover a pública.
-- A página pública do pet já só renderiza a timeline de saúde
-- quando isOwner, então nenhuma UX de visitante depende disso.
-- Isso alinha pet_vaccinations com pet_medications e
-- pet_health_records (ambas já owner-only).
--
-- Idempotente: DROP POLICY IF EXISTS.

DROP POLICY IF EXISTS "pv_select_public" ON public.pet_vaccinations;
