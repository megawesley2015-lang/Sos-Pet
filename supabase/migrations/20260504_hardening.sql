-- ============================================================
-- Migration: Hardening de segurança (B-04)
-- Data: 2026-05-04
-- ============================================================
--
-- Fecha vetores de abuso direto na REST do Supabase:
--   B-04 ✅ Bucket pet-photos só aceita upload via service role
--          (Server Action que validou Turnstile + mime/size).
--
-- Não aplicado nesta migration (planejado em fase 2 — ver final do arquivo):
--   B-05 ⏸  Gate em contact_phone (view + RPC)
--   B-08 ⏸  Bloquear INSERT anônimo direto em pets
--
-- Ordem segura: aplicar primeiro em STAGING, validar fluxo de cadastro
-- anônimo (Turnstile + foto). Depois aplicar em PROD.
-- ============================================================

-- ============================================================
-- B-04 — Bucket pet-photos: upload só via service role
-- ============================================================
-- Estado anterior: qualquer cliente (anon/auth) podia POSTAR direto na
-- /storage/v1/object/pet-photos. Sem mime check, sem size limit, sem owner.
-- Vetor: bot enche o bucket com arquivos lixo, queima quota.
--
-- Estado novo: Server Action é o único caminho. Ele:
--   1. Valida Turnstile (anônimos)
--   2. Roda validatePhoto (mime/size em lib/validation/pet.ts)
--   3. Chama uploadPetPhoto (que agora usa service role)
--
-- Leitura continua pública (bucket é public).
-- ============================================================

drop policy if exists "pet_photos_public_upload" on storage.objects;

-- Policy nova: só service role consegue inserir.
-- (Service role bypassa RLS por padrão — essa policy serve como
--  documentação explícita. authenticated/anon ficam bloqueados.)
drop policy if exists "pet_photos_service_role_upload" on storage.objects;
create policy "pet_photos_service_role_upload"
  on storage.objects
  for insert
  to service_role
  with check (bucket_id = 'pet-photos');

-- DELETE / UPDATE também só via service role (housekeeping vem do Server Action)
drop policy if exists "pet_photos_service_role_delete" on storage.objects;
create policy "pet_photos_service_role_delete"
  on storage.objects
  for delete
  to service_role
  using (bucket_id = 'pet-photos');

drop policy if exists "pet_photos_service_role_update" on storage.objects;
create policy "pet_photos_service_role_update"
  on storage.objects
  for update
  to service_role
  using (bucket_id = 'pet-photos');

-- ============================================================
-- B-05 — pets_public view (sem contato) + RPC get_pet_contact
-- ============================================================
-- Antes: anônimo podia `select contact_phone from pets` via REST e coletar
-- todos os telefones. Vetor de scraping óbvio.
--
-- Depois:
--   - View `pets_public` expõe apenas campos não-sensíveis (sem contact_*).
--   - RPC `get_pet_contact(pet_id)` retorna contato APENAS na chamada por pet.
--     Em fase futura, adicionar rate-limit por IP nessa RPC.
--   - Tabela `pets` fica fechada para SELECT direto de anônimo — só owner ou admin.
--
-- Compatibilidade do app:
--   - lib/services/pets.ts foi refatorado: listPets/getPetById usam pets_public.
--   - app/pets/[id]/page.tsx busca contato via RPC quando user não é owner.
-- ============================================================

-- View pública sem contact_*
create or replace view public.pets_public as
  select id, created_at, updated_at, owner_id,
         kind, name, species, breed, color, size, sex, age_approx,
         description, behavior,
         neighborhood, city, state, event_date, photo_url, status
    from public.pets
   where status = 'active';

grant select on public.pets_public to anon, authenticated;

-- RPC pra detalhe revelar contato. Anônimo chama uma vez por pet.
-- TODO produção: rate-limit por IP (pg_rate_limit ou contador com TTL).
create or replace function public.get_pet_contact(pet_id uuid)
returns table (
  contact_name text,
  contact_phone text,
  contact_whatsapp boolean
)
language plpgsql security definer set search_path = public as $func$
begin
  return query
  select p.contact_name, p.contact_phone, p.contact_whatsapp
    from public.pets p
   where p.id = pet_id and p.status = 'active';
end;
$func$;

grant execute on function public.get_pet_contact(uuid) to anon, authenticated;

-- Restringe SELECT direto da tabela `pets`: só owner ou admin.
-- Listagem/detalhe pública migra pra view `pets_public`.
drop policy if exists "pets_select_active" on public.pets;
drop policy if exists "pets_admin_select_all" on public.pets;
create policy "pets_select_owner_or_admin"
  on public.pets for select
  using (
    owner_id = auth.uid()
    or auth.uid() in (select id from public.profiles where role = 'admin')
  );

-- ============================================================
-- B-08 — Bloquear INSERT direto anônimo em pets (REST)
-- ============================================================
-- Antes: anônimo podia POST direto em /rest/v1/pets com owner_id=null.
-- Bypassava o Server Action e seu Turnstile.
--
-- Depois: anônimo só insere via RPC security definer `create_pet_anon`.
-- O Server Action (que validou Turnstile + Zod) chama essa RPC com service role.
--
-- Compatibilidade: usuários logados continuam inserindo direto na tabela —
-- a policy `pets_insert_authed` valida `auth.uid() = owner_id`.
-- ============================================================

drop policy if exists "pets_insert_any" on public.pets;
create policy "pets_insert_authed"
  on public.pets for insert
  with check (auth.uid() is not null and owner_id = auth.uid());

create or replace function public.create_pet_anon(
  p_kind text, p_species text, p_color text,
  p_neighborhood text, p_city text, p_state text,
  p_event_date date, p_contact_name text, p_contact_phone text,
  p_contact_whatsapp boolean,
  p_name text default null, p_breed text default null,
  p_size text default null, p_sex text default null,
  p_age_approx text default null, p_description text default null,
  p_behavior text default null, p_photo_url text default null
)
returns uuid
language plpgsql security definer set search_path = public as $func$
declare new_id uuid;
begin
  insert into public.pets (
    kind, species, color, neighborhood, city, state, event_date,
    contact_name, contact_phone, contact_whatsapp,
    name, breed, size, sex, age_approx, description, behavior, photo_url,
    owner_id
  ) values (
    p_kind, p_species, p_color, p_neighborhood, p_city, p_state, p_event_date,
    p_contact_name, p_contact_phone, p_contact_whatsapp,
    p_name, p_breed, p_size, p_sex, p_age_approx, p_description, p_behavior, p_photo_url,
    null
  ) returning id into new_id;
  return new_id;
end;
$func$;

grant execute on function public.create_pet_anon(
  text,text,text,text,text,text,date,text,text,boolean,
  text,text,text,text,text,text,text,text
) to anon, authenticated;

-- ============================================================
-- Como aplicar — checklist sequencial
-- ============================================================
--
-- ORDEM IMPORTA: aplique o código (deploy do Next) ANTES da migration —
-- senão a listagem `/pets` quebra por uns segundos enquanto a tabela
-- `pets` muda de policy e o app ainda lê dela direto.
--
-- 1. Pull do código atualizado (lib/services/pets.ts + app/pets/[id]/page.tsx
--    + app/pets/novo/actions.ts já consomem pets_public/RPCs).
-- 2. `npm run build` local ou em CI — confirmar que compila.
-- 3. Subir deploy (Vercel) e validar listagem pública carregando.
-- 4. Supabase Dashboard → SQL Editor → cole este arquivo → Run.
-- 5. Conferir:
--    - Storage → pet-photos → Policies: 4 policies (public_read + 3 service_role)
--    - Database → Tables → pets → Policies: pets_select_owner_or_admin,
--      pets_insert_authed, pets_update_owner, pets_delete_owner.
--    - Database → Functions: get_pet_contact, create_pet_anon (security definer)
--    - Database → Views: pets_public
-- 6. Smoke test:
--    a) Cadastrar pet anônimo no /pets/novo — deve criar
--    b) Cadastrar pet logado — deve criar
--    c) Listagem /pets carrega
--    d) Detalhe /pets/[id] mostra contato corretamente
-- 7. Teste de abuso (curl ou Postman com anon key):
--    a) POST /storage/v1/object/pet-photos/x.jpg — deve dar 403
--    b) POST /rest/v1/pets com owner_id=null — deve dar RLS error
--    c) GET /rest/v1/pets?select=contact_phone — deve retornar lista vazia
--       (RLS bloqueia SELECT direto de anônimo)
--    d) GET /rest/v1/pets_public?select=* — deve retornar pets sem contato
--    e) POST /rest/v1/rpc/get_pet_contact com pet_id válido — retorna contato
