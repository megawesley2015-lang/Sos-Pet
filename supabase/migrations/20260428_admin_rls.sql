-- ============================================================
-- Migration: Admin RLS policies
-- Data: 2026-04-28
-- Garante que apenas role='admin' consegue:
--   - ler/atualizar status de parceiros
--   - ler/atualizar status de prestadores
--   - atualizar status de pets (remover/reativar)
-- ============================================================

-- RLS: parceiros — admin pode ver e atualizar qualquer linha
drop policy if exists "parceiros_admin_select" on public.parceiros;
create policy "parceiros_admin_select"
  on public.parceiros
  for select
  using (
    auth.uid() in (
      select id from public.profiles where role = 'admin'
    )
  );

drop policy if exists "parceiros_admin_update" on public.parceiros;
create policy "parceiros_admin_update"
  on public.parceiros
  for update
  using (
    auth.uid() in (
      select id from public.profiles where role = 'admin'
    )
  );

-- RLS: prestadores — admin pode ver todos e atualizar status
drop policy if exists "prestadores_admin_select" on public.prestadores;
create policy "prestadores_admin_select"
  on public.prestadores
  for select
  using (
    status = 'ativo'
    or owner_id = auth.uid()
    or auth.uid() in (
      select id from public.profiles where role = 'admin'
    )
  );

drop policy if exists "prestadores_admin_update_status" on public.prestadores;
create policy "prestadores_admin_update_status"
  on public.prestadores
  for update
  using (
    auth.uid() in (
      select id from public.profiles where role = 'admin'
    )
  );

-- RLS: pets — admin pode atualizar status (remover/reativar)
drop policy if exists "pets_admin_update_status" on public.pets;
create policy "pets_admin_update_status"
  on public.pets
  for update
  using (
    auth.uid() in (
      select id from public.profiles where role = 'admin'
    )
  );

-- RLS: pets — admin pode ver todos (inclusive removed)
drop policy if exists "pets_admin_select_all" on public.pets;
create policy "pets_admin_select_all"
  on public.pets
  for select
  using (
    status = 'active'
    or owner_id = auth.uid()
    or auth.uid() in (
      select id from public.profiles where role = 'admin'
    )
  );

-- ============================================================
-- Para tornar um usuário admin, rode no SQL Editor:
--   update public.profiles set role = 'admin' where id = '<user_uuid>';
-- ============================================================
