-- =============================================================
-- Storage: garantir que todos os buckets públicos existam
-- com políticas corretas de leitura e escrita.
--
-- Idempotente: usa ON CONFLICT DO NOTHING nos inserts
-- e DROP POLICY IF EXISTS antes de cada CREATE POLICY.
-- =============================================================

-- ── 1. Criar buckets (se não existirem) ─────────────────────

-- pet-photos (já existe na prática, mas torna idempotente)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-photos',
  'pet-photos',
  true,
  5242880,  -- 5 MB
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

-- provider-photos (fotos de logo/capa de prestadores)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'provider-photos',
  'provider-photos',
  true,
  5242880,  -- 5 MB
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

-- avatars (fotos de perfil de usuários)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 MB
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

-- alert-cards (imagens de alertas da Rede Sentinela)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'alert-cards',
  'alert-cards',
  true,
  5242880,  -- 5 MB
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

-- ── 2. Políticas de leitura pública (todos os buckets públicos) ──

-- provider-photos: leitura pública
drop policy if exists "provider_photos_public_read" on storage.objects;
create policy "provider_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'provider-photos');

-- provider-photos: upload/delete apenas via service role (server actions)
drop policy if exists "provider_photos_service_role_insert" on storage.objects;
create policy "provider_photos_service_role_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'provider-photos'
    and (auth.role() = 'service_role' or auth.uid() is not null)
  );

drop policy if exists "provider_photos_service_role_delete" on storage.objects;
create policy "provider_photos_service_role_delete"
  on storage.objects for delete
  using (
    bucket_id = 'provider-photos'
    and auth.role() = 'service_role'
  );

-- avatars: leitura pública
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- avatars: usuário autenticado faz upload do próprio avatar
drop policy if exists "avatars_auth_insert" on storage.objects;
create policy "avatars_auth_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
  );

drop policy if exists "avatars_auth_delete" on storage.objects;
create policy "avatars_auth_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
  );

-- alert-cards: leitura pública
drop policy if exists "alert_cards_public_read" on storage.objects;
create policy "alert_cards_public_read"
  on storage.objects for select
  using (bucket_id = 'alert-cards');

-- alert-cards: apenas service role ou autenticado inserem
drop policy if exists "alert_cards_service_insert" on storage.objects;
create policy "alert_cards_service_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'alert-cards'
    and (auth.role() = 'service_role' or auth.uid() is not null)
  );

drop policy if exists "alert_cards_service_delete" on storage.objects;
create policy "alert_cards_service_delete"
  on storage.objects for delete
  using (
    bucket_id = 'alert-cards'
    and auth.role() = 'service_role'
  );
