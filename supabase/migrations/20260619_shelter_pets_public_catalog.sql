-- Migration: catálogo público de adoção
-- Permite SELECT anônimo de shelter_pets com status='available'
-- e expõe apenas o nome do shelter para o card público.

-- 1. Policy SELECT pública para pets disponíveis
DROP POLICY IF EXISTS "shelter_pets_select_available_public" ON public.shelter_pets;
CREATE POLICY "shelter_pets_select_available_public"
  ON public.shelter_pets FOR SELECT
  USING (status = 'available');

-- 2. Policy SELECT pública para shelters (nome + cidade + logo)
--    Shelters já têm RLS ativado; a policy owner-only pode ter sido criada antes.
DROP POLICY IF EXISTS "shelters_select_public" ON public.shelters;
CREATE POLICY "shelters_select_public"
  ON public.shelters FOR SELECT
  USING (true);
