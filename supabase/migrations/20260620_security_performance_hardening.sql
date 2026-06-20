-- =============================================================
-- MIGRATION: 20260620_security_performance_hardening.sql
-- Corrige todos os problemas detectados pelo advisor Supabase:
--   [CRÍTICO] SECURITY DEFINER view + funções perigosas expostas a anon
--   [ALTO]    43 policies com auth_rls_initplan (re-avalia auth.uid() por linha)
--   [ALTO]    search_path mutável em funções SECURITY DEFINER
--   [ALTO]    Policies duplicadas em pets (PT-BR + EN fazendo a mesma coisa)
--   [MÉDIO]   Índices duplicados na tabela pets
--   [MÉDIO]   Foreign keys sem índice
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- BLOCO 1 — CRÍTICO: Revogar anon de funções perigosas
-- erase_pet_personal_data e export_user_data não devem ser
-- chamadas por usuários não autenticados via REST API
-- ─────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.erase_pet_personal_data(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.export_user_data() FROM anon;

-- Funções internas de trigger não devem ser expostas via REST
REVOKE EXECUTE ON FUNCTION public.handle_new_prestador() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.atualizar_media_prestador() FROM anon;

-- ─────────────────────────────────────────────────────────────
-- BLOCO 2 — CRÍTICO: Corrigir pets_public (SECURITY DEFINER → INVOKER)
-- A view usava as permissões do criador, não do usuário que consulta,
-- o que potencialmente bypassa o RLS do usuário logado.
-- ─────────────────────────────────────────────────────────────
ALTER VIEW public.pets_public SET (security_invoker = on);

-- ─────────────────────────────────────────────────────────────
-- BLOCO 3 — ALTO: Fixar search_path nas funções (mutable search_path)
-- Sem search_path fixo, funções podem ser exploradas via schema hijacking.
-- ALTER FUNCTION ... SET search_path fixa sem reescrever o corpo.
-- ─────────────────────────────────────────────────────────────
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.set_store_products_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_pet_ai_data_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_new_prestador() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.is_shelter_owner(uuid) SET search_path = public;
ALTER FUNCTION public.is_pet_owner(uuid) SET search_path = public;
ALTER FUNCTION public.atualizar_media_prestador() SET search_path = public;

-- ─────────────────────────────────────────────────────────────
-- BLOCO 4 — ALTO: Corrigir policies com auth_rls_initplan
-- auth.uid() reavalia a função por linha — lento em tabelas grandes.
-- Padrão correto: (select auth.uid()) — avalia uma vez, caches o plano.
-- Estratégia: DROP + CREATE OR REPLACE para cada policy afetada.
-- ─────────────────────────────────────────────────────────────

-- ── pets: remover policies duplicadas PT-BR (substituídas pelas EN abaixo) ──
DROP POLICY IF EXISTS "pets: atualização pelo dono" ON public.pets;
DROP POLICY IF EXISTS "pets: exclusão pelo dono" ON public.pets;
DROP POLICY IF EXISTS "pets: inserção autenticada" ON public.pets;
-- Nota: "pets: leitura pública" e "pets: inserção anônima" não usam auth.uid(), mantidas.

-- ── pets: recriar policies EN com (select auth.uid()) ──
DROP POLICY IF EXISTS pets_insert_authed ON public.pets;
CREATE POLICY pets_insert_authed ON public.pets
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL AND owner_id = (select auth.uid()));

DROP POLICY IF EXISTS pets_select_owner_or_admin ON public.pets;
CREATE POLICY pets_select_owner_or_admin ON public.pets
  FOR SELECT
  USING (
    owner_id = (select auth.uid())
    OR (select auth.uid()) IN (
      SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS pets_update_owner ON public.pets;
CREATE POLICY pets_update_owner ON public.pets
  FOR UPDATE TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS pets_delete_owner ON public.pets;
CREATE POLICY pets_delete_owner ON public.pets
  FOR DELETE TO authenticated
  USING (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS pets_admin_update_status ON public.pets;
CREATE POLICY pets_admin_update_status ON public.pets
  FOR UPDATE
  USING (
    (select auth.uid()) IN (
      SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'
    )
  );

-- ── prestadores ──
DROP POLICY IF EXISTS prestadores_select_active ON public.prestadores;
CREATE POLICY prestadores_select_active ON public.prestadores
  FOR SELECT
  USING (status = 'ativo' OR user_id = (select auth.uid()));

DROP POLICY IF EXISTS prestadores_admin_select ON public.prestadores;
CREATE POLICY prestadores_admin_select ON public.prestadores
  FOR SELECT
  USING (
    status = 'ativo'
    OR user_id = (select auth.uid())
    OR (select auth.uid()) IN (
      SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS prestadores_insert_authed ON public.prestadores;
CREATE POLICY prestadores_insert_authed ON public.prestadores
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS prestadores_update_owner ON public.prestadores;
CREATE POLICY prestadores_update_owner ON public.prestadores
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS prestadores_delete_owner ON public.prestadores;
CREATE POLICY prestadores_delete_owner ON public.prestadores
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS prestadores_admin_update_status ON public.prestadores;
CREATE POLICY prestadores_admin_update_status ON public.prestadores
  FOR UPDATE
  USING (
    (select auth.uid()) IN (
      SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'
    )
  );

-- ── avaliacoes ──
DROP POLICY IF EXISTS avaliacoes_insert_authed ON public.avaliacoes;
CREATE POLICY avaliacoes_insert_authed ON public.avaliacoes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS avaliacoes_update_own ON public.avaliacoes;
CREATE POLICY avaliacoes_update_own ON public.avaliacoes
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS avaliacoes_delete_own ON public.avaliacoes;
CREATE POLICY avaliacoes_delete_own ON public.avaliacoes
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- ── alertas_sos ──
DROP POLICY IF EXISTS alertas_select_active ON public.alertas_sos;
CREATE POLICY alertas_select_active ON public.alertas_sos
  FOR SELECT
  USING (status = 'ativo' OR user_id = (select auth.uid()));

DROP POLICY IF EXISTS alertas_insert_authed ON public.alertas_sos;
CREATE POLICY alertas_insert_authed ON public.alertas_sos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS alertas_update_owner ON public.alertas_sos;
CREATE POLICY alertas_update_owner ON public.alertas_sos
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS alertas_delete_owner ON public.alertas_sos;
CREATE POLICY alertas_delete_owner ON public.alertas_sos
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- ── shelters ──
DROP POLICY IF EXISTS shelters_select_own ON public.shelters;
CREATE POLICY shelters_select_own ON public.shelters
  FOR SELECT
  USING (auth.uid() = user_id OR (select auth.uid()) = user_id);
-- simplificado:
DROP POLICY IF EXISTS shelters_select_own ON public.shelters;
CREATE POLICY shelters_select_own ON public.shelters
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS shelters_insert_auth ON public.shelters;
CREATE POLICY shelters_insert_auth ON public.shelters
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS shelters_update_own ON public.shelters;
CREATE POLICY shelters_update_own ON public.shelters
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS shelters_delete_own ON public.shelters;
CREATE POLICY shelters_delete_own ON public.shelters
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- ── ong_details ──
DROP POLICY IF EXISTS ong_details_owner_all ON public.ong_details;
CREATE POLICY ong_details_owner_all ON public.ong_details
  FOR ALL TO authenticated
  USING (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS ong_details_owner_select ON public.ong_details;
CREATE POLICY ong_details_owner_select ON public.ong_details
  FOR SELECT
  USING (
    profile_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ── prontuarios ──
DROP POLICY IF EXISTS prontuarios_ong_all ON public.prontuarios;
CREATE POLICY prontuarios_ong_all ON public.prontuarios
  FOR ALL TO authenticated
  USING (
    ong_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ── vacinas ──
DROP POLICY IF EXISTS vacinas_via_prontuario ON public.vacinas;
CREATE POLICY vacinas_via_prontuario ON public.vacinas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prontuarios p
      WHERE p.id = vacinas.prontuario_id
        AND (
          p.ong_id = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
          )
        )
    )
  );

-- ── medicacoes ──
DROP POLICY IF EXISTS medicacoes_via_prontuario ON public.medicacoes;
CREATE POLICY medicacoes_via_prontuario ON public.medicacoes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prontuarios p
      WHERE p.id = medicacoes.prontuario_id
        AND (
          p.ong_id = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
          )
        )
    )
  );

-- ── adocoes ──
DROP POLICY IF EXISTS adocoes_ong_all ON public.adocoes;
CREATE POLICY adocoes_ong_all ON public.adocoes
  FOR ALL TO authenticated
  USING (
    ong_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ── achados_perdidos ──
DROP POLICY IF EXISTS ap_insert_publico ON public.achados_perdidos;
CREATE POLICY ap_insert_publico ON public.achados_perdidos
  FOR INSERT
  WITH CHECK (
    ((select auth.uid()) IS NULL AND user_id IS NULL)
    OR ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS ap_update_dono ON public.achados_perdidos;
CREATE POLICY ap_update_dono ON public.achados_perdidos
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id AND user_id IS NOT NULL)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS ap_delete_dono ON public.achados_perdidos;
CREATE POLICY ap_delete_dono ON public.achados_perdidos
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id AND user_id IS NOT NULL);

-- ── profiles ──
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ── sentinel_partners ──
DROP POLICY IF EXISTS sentinel_insert_auth ON public.sentinel_partners;
CREATE POLICY sentinel_insert_auth ON public.sentinel_partners
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ── agent_logs ──
DROP POLICY IF EXISTS agent_logs_admin_select ON public.agent_logs;
CREATE POLICY agent_logs_admin_select ON public.agent_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ── sightings ──
DROP POLICY IF EXISTS sightings_delete_admin ON public.sightings;
CREATE POLICY sightings_delete_admin ON public.sightings
  FOR DELETE
  USING (
    (select auth.uid()) IN (
      SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'
    )
  );

-- ── parceiros ──
DROP POLICY IF EXISTS parceiros_admin_select ON public.parceiros;
CREATE POLICY parceiros_admin_select ON public.parceiros
  FOR SELECT
  USING (
    (select auth.uid()) IN (
      SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS parceiros_admin_update ON public.parceiros;
CREATE POLICY parceiros_admin_update ON public.parceiros
  FOR UPDATE
  USING (
    (select auth.uid()) IN (
      SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'
    )
  );

-- ── pet_tag_orders ──
DROP POLICY IF EXISTS owner_select ON public.pet_tag_orders;
CREATE POLICY owner_select ON public.pet_tag_orders
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS owner_insert ON public.pet_tag_orders;
CREATE POLICY owner_insert ON public.pet_tag_orders
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- ── store_products ──
DROP POLICY IF EXISTS store_products_admin_all ON public.store_products;
CREATE POLICY store_products_admin_all ON public.store_products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────
-- BLOCO 5 — MÉDIO: Remover índices duplicados em pets
-- Cada par faz exatamente a mesma coisa — manter apenas 1 de cada.
-- Removendo os "idx_*" e mantendo os "pets_*_idx" (mais antigos, estáveis).
-- ─────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_pets_city;        -- duplicata de pets_city_idx
DROP INDEX IF EXISTS public.idx_pets_created_at;  -- duplicata de pets_created_at_idx
DROP INDEX IF EXISTS public.idx_pets_kind;        -- duplicata de pets_kind_idx
DROP INDEX IF EXISTS public.idx_pets_species;     -- duplicata de pets_species_idx
DROP INDEX IF EXISTS public.idx_pets_status;      -- duplicata de pets_status_idx

-- ─────────────────────────────────────────────────────────────
-- BLOCO 6 — MÉDIO: Índices de foreign keys faltando
-- FK sem índice causa seq scan na tabela referenciada em JOINs e DELETEs.
-- ─────────────────────────────────────────────────────────────

-- adocoes.pet_id (foreign key sem índice)
CREATE INDEX IF NOT EXISTS idx_adocoes_pet_id
  ON public.adocoes (pet_id);

-- medical_records.created_by (foreign key sem índice)
CREATE INDEX IF NOT EXISTS idx_medical_records_created_by
  ON public.medical_records (created_by);
