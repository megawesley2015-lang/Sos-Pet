-- ============================================================
-- Migration: Sistema de Avistamentos
-- Data: 2026-04-28
-- Permite que qualquer pessoa registre onde viu um pet perdido,
-- com foto, coordenadas GPS e descrição livre.
-- ============================================================

-- Tabela de avistamentos
create table if not exists public.sightings (
  id            uuid        default gen_random_uuid() primary key,
  created_at    timestamptz default now() not null,
  pet_id        uuid        references public.pets(id) on delete cascade not null,
  lat           float8      not null,
  lng           float8      not null,
  address       text,
  photo_url     text,
  description   text,
  reporter_name text
);

-- Índice para busca por pet
create index if not exists sightings_pet_id_idx on public.sightings(pet_id);
create index if not exists sightings_created_at_idx on public.sightings(created_at desc);

-- RLS
alter table public.sightings enable row level security;

-- Qualquer pessoa pode registrar um avistamento (anônimo)
drop policy if exists "sightings_insert_public" on public.sightings;
create policy "sightings_insert_public"
  on public.sightings
  for insert
  with check (true);

-- Qualquer pessoa pode ver avistamentos (info pública para ajudar no resgate)
drop policy if exists "sightings_select_public" on public.sightings;
create policy "sightings_select_public"
  on public.sightings
  for select
  using (true);

-- Admin pode deletar avistamentos (moderação)
drop policy if exists "sightings_delete_admin" on public.sightings;
create policy "sightings_delete_admin"
  on public.sightings
  for delete
  using (
    auth.uid() in (
      select id from public.profiles where role = 'admin'
    )
  );

-- ============================================================
-- Storage bucket para fotos de avistamentos (público)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sightings',
  'sightings',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Política de leitura pública do bucket
drop policy if exists "sightings_bucket_public_read" on storage.objects;
create policy "sightings_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'sightings');

-- Qualquer pessoa pode fazer upload (anônimo)
drop policy if exists "sightings_bucket_insert" on storage.objects;
create policy "sightings_bucket_insert"
  on storage.objects for insert
  with check (bucket_id = 'sightings');
