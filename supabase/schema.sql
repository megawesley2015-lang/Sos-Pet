-- ============================================================
-- SOS Pet - Schema inicial (MVP Achados e Perdidos)
-- ============================================================
-- Execute este arquivo no SQL Editor do Supabase (Dashboard)
-- OU via CLI:  supabase db push
--
-- Decisões técnicas (MVP first):
-- 1. owner_id nullable → permite cadastro sem login (regra de negócio)
-- 2. RLS ativo em todas as tabelas (segurança mínima obrigatória)
-- 3. contact_* separado do owner → encontrante anônimo também tem contato
-- 4. enums em text com CHECK → mais simples que enum types, fácil de migrar
-- 5. photo_url única no MVP (não múltiplas fotos) → simplicidade
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: profiles  (1:1 com auth.users)
-- ============================================================
-- Espelha auth.users com campos de domínio (nome, telefone, role).
-- Criada automaticamente via trigger handle_new_user no signup.
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  full_name    text,
  phone        text,
  avatar_url   text,
  role         text not null default 'tutor' check (role in ('tutor', 'provider', 'admin'))
);

create index if not exists profiles_role_idx on public.profiles (role);

-- Trigger: criar profile automaticamente ao criar auth.users
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger reusado mais abaixo (set_updated_at)
-- mas pra profiles a gente precisa atachar separadamente:
-- (criamos a função abaixo no bloco de pets; aqui só placeholder do drop/create)

-- RLS profiles
alter table public.profiles enable row level security;

-- SELECT público: qualquer pessoa pode ver perfil (nome/avatar usados em PetCard futuro)
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles
  for select
  using (true);

-- UPDATE: só o dono pode editar seu próprio profile
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- INSERT: bloqueado por default — só o trigger handle_new_user (security definer) cria
-- DELETE: bloqueado — cascade do auth.users.delete cuida disso

-- ============================================================
-- STORAGE BUCKET: avatars (foto de perfil dos users)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_authed_upload" on storage.objects;
create policy "avatars_authed_upload" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- TABLE: pets
-- ============================================================
create table if not exists public.pets (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Proprietário do REGISTRO (pode ser null = cadastro anônimo)
  owner_id        uuid references auth.users(id) on delete set null,

  -- Tipo de registro
  kind            text not null check (kind in ('lost', 'found')),

  -- Identificação do pet
  name            text,
  species         text not null check (species in ('dog', 'cat', 'other')),
  breed           text,
  color           text not null,
  size            text check (size in ('small', 'medium', 'large')),
  sex             text check (sex in ('male', 'female', 'unknown')),
  age_approx      text, -- "filhote", "adulto", "idoso" ou descritivo livre

  -- Contexto
  description     text,
  behavior        text, -- "arisco", "dócil", "machucado" etc

  -- Localização (MVP: texto livre; v2: lat/lng + PostGIS)
  neighborhood    text not null,
  city            text not null,
  state           text,

  -- Datas
  event_date      date not null, -- quando perdeu ou encontrou

  -- Mídia
  photo_url       text,

  -- Contato (separado do owner_id: encontrante anônimo precisa de contato)
  contact_name    text not null,
  contact_phone   text not null,
  contact_whatsapp boolean not null default true,

  -- Status de moderação (futuro)
  status          text not null default 'active' check (status in ('active', 'resolved', 'removed'))
);

-- Índices para listagem e filtros
create index if not exists pets_created_at_idx    on public.pets (created_at desc);
create index if not exists pets_kind_idx          on public.pets (kind);
create index if not exists pets_species_idx       on public.pets (species);
create index if not exists pets_city_idx          on public.pets (city);
create index if not exists pets_status_idx        on public.pets (status);

-- Trigger: atualizar updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_pets_updated_at on public.pets;
create trigger set_pets_updated_at
  before update on public.pets
  for each row execute function public.set_updated_at();

-- Aplica updated_at também em profiles (função criada acima)
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.pets enable row level security;

-- SELECT: qualquer pessoa (anon + auth) pode ver pets com status = 'active'
drop policy if exists "pets_select_active" on public.pets;
create policy "pets_select_active"
  on public.pets
  for select
  using (status = 'active');

-- INSERT: qualquer pessoa pode criar (owner_id é null para anônimos)
-- Validação: se está autenticado, owner_id precisa bater com auth.uid()
drop policy if exists "pets_insert_any" on public.pets;
create policy "pets_insert_any"
  on public.pets
  for insert
  with check (
    owner_id is null
    or owner_id = auth.uid()
  );

-- UPDATE: só o dono do registro pode atualizar
drop policy if exists "pets_update_owner" on public.pets;
create policy "pets_update_owner"
  on public.pets
  for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- DELETE: só o dono pode deletar
drop policy if exists "pets_delete_owner" on public.pets;
create policy "pets_delete_owner"
  on public.pets
  for delete
  using (owner_id = auth.uid());

-- ============================================================
-- TABLE: avisos  (banner ticker no topo da landing)
-- ============================================================
create table if not exists public.avisos (
  id           uuid primary key default uuid_generate_v4(),
  created_at   timestamptz not null default now(),

  mensagem     text not null,
  emoji        text,
  link         text,
  prioridade   int not null default 0,    -- maior aparece primeiro
  ativo        boolean not null default true,
  expires_at   timestamptz                 -- null = nunca expira
);

create index if not exists avisos_ativo_idx
  on public.avisos (ativo, prioridade desc, created_at desc);

alter table public.avisos enable row level security;

-- SELECT público — ticker é visível pra qualquer pessoa
drop policy if exists "avisos_select_public" on public.avisos;
create policy "avisos_select_public" on public.avisos
  for select using (true);

-- INSERT/UPDATE/DELETE: só admin (via service role ou Studio).
-- (sem policies de escrita = bloqueado por default em RLS)

-- Seeds iniciais — só insere se a tabela estiver vazia
insert into public.avisos (mensagem, emoji, link, prioridade)
select * from (values
  ('Bem-vindo ao SOS Pet — registre, busque, reencontre.',
   '👋', '/pets', 100),
  ('Novidade: Central de Resgate dispara cartaz pronto pra compartilhar.',
   '🚨', '/resgate', 90),
  ('Você é prestador? Apareça pra rede com sua loja, pet shop ou clínica.',
   '🏥', '/prestadores/novo', 80)
) as s(mensagem, emoji, link, prioridade)
where not exists (select 1 from public.avisos);

-- ============================================================
-- TABLE: parceiros  (lead form de empresas interessadas)
-- ============================================================
create table if not exists public.parceiros (
  id           uuid primary key default uuid_generate_v4(),
  created_at   timestamptz not null default now(),

  nome         text not null,
  email        text not null,
  empresa      text,
  mensagem     text,

  status       text not null default 'pendente' check (
    status in ('pendente','aprovado','rejeitado')
  )
);

create index if not exists parceiros_status_idx on public.parceiros (status);

alter table public.parceiros enable row level security;

-- INSERT público — qualquer pessoa pode submeter (form na /parcerias)
drop policy if exists "parceiros_insert_any" on public.parceiros;
create policy "parceiros_insert_any" on public.parceiros
  for insert with check (true);

-- SELECT/UPDATE/DELETE só admin (via service role).
-- Sem policy = bloqueado por default. Forms de admin viriam em F7.

-- ============================================================
-- TABLE: prestadores  (Veterinários, pet shops, adestradores, etc)
-- ============================================================
create table if not exists public.prestadores (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  user_id         uuid references auth.users(id) on delete set null,

  -- Identidade
  slug            text not null unique,
  nome            text not null,
  descricao       text,

  categoria       text not null check (categoria in (
    'veterinario','petshop','adestrador','hospedagem','banho_tosa','outro'
  )),

  -- Contato
  telefone        text,
  whatsapp        text,
  email           text,
  instagram       text,
  site            text,

  -- Localização
  cidade          text not null,
  bairro          text,
  estado          text,
  endereco        text,

  -- Mídia
  logo_url        text,
  capa_url        text,

  -- Badges / flags
  emergencia24h        boolean not null default false,
  delivery             boolean not null default false,
  agendamento_online   boolean not null default false,
  verificado           boolean not null default false,
  destaque             boolean not null default false,

  -- Métricas denormalizadas (atualizadas por trigger atualizar_media_prestador)
  media_avaliacoes     numeric(3,2) not null default 0,
  total_avaliacoes     int not null default 0,

  status          text not null default 'ativo' check (
    status in ('ativo','pausado','pendente_aprovacao')
  )
);

create index if not exists prestadores_categoria_idx on public.prestadores (categoria);
create index if not exists prestadores_cidade_idx    on public.prestadores (cidade);
create index if not exists prestadores_status_idx    on public.prestadores (status);
create index if not exists prestadores_destaque_idx  on public.prestadores (destaque) where destaque = true;
create index if not exists prestadores_user_id_idx   on public.prestadores (user_id);

drop trigger if exists set_prestadores_updated_at on public.prestadores;
create trigger set_prestadores_updated_at
  before update on public.prestadores
  for each row execute function public.set_updated_at();

alter table public.prestadores enable row level security;

drop policy if exists "prestadores_select_active" on public.prestadores;
create policy "prestadores_select_active" on public.prestadores
  for select using (status = 'ativo' or user_id = auth.uid());

drop policy if exists "prestadores_insert_authed" on public.prestadores;
create policy "prestadores_insert_authed" on public.prestadores
  for insert with check (user_id = auth.uid());

drop policy if exists "prestadores_update_owner" on public.prestadores;
create policy "prestadores_update_owner" on public.prestadores
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "prestadores_delete_owner" on public.prestadores;
create policy "prestadores_delete_owner" on public.prestadores
  for delete using (user_id = auth.uid());

-- ============================================================
-- TABLE: avaliacoes
-- ============================================================
create table if not exists public.avaliacoes (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz not null default now(),

  prestador_id  uuid not null references public.prestadores(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,

  nota          int not null check (nota between 1 and 5),
  comentario    text check (char_length(comentario) <= 500),

  -- Garante 1 avaliação por user por prestador (UPDATE pra mudar)
  unique (prestador_id, user_id)
);

create index if not exists avaliacoes_prestador_id_idx on public.avaliacoes (prestador_id);
create index if not exists avaliacoes_user_id_idx      on public.avaliacoes (user_id);

alter table public.avaliacoes enable row level security;

drop policy if exists "avaliacoes_select_public" on public.avaliacoes;
create policy "avaliacoes_select_public" on public.avaliacoes
  for select using (true);

drop policy if exists "avaliacoes_insert_authed" on public.avaliacoes;
create policy "avaliacoes_insert_authed" on public.avaliacoes
  for insert with check (user_id = auth.uid());

drop policy if exists "avaliacoes_update_own" on public.avaliacoes;
create policy "avaliacoes_update_own" on public.avaliacoes
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "avaliacoes_delete_own" on public.avaliacoes;
create policy "avaliacoes_delete_own" on public.avaliacoes
  for delete using (user_id = auth.uid());

-- ============================================================
-- TABLE: prestador_stats  (visualizações, cliques)
-- ============================================================
create table if not exists public.prestador_stats (
  prestador_id      uuid primary key references public.prestadores(id) on delete cascade,
  visualizacoes     int not null default 0,
  cliques_whatsapp  int not null default 0,
  cliques_telefone  int not null default 0,
  updated_at        timestamptz not null default now()
);

alter table public.prestador_stats enable row level security;

-- Stats são públicos pra leitura (mostramos "1.2k views" no card)
drop policy if exists "prestador_stats_select_public" on public.prestador_stats;
create policy "prestador_stats_select_public" on public.prestador_stats
  for select using (true);

-- INSERT/UPDATE: só via RPC (security definer abaixo). Bloqueia escrita direta.
-- (sem policy de insert/update/delete = bloqueado por default em RLS ativa)

-- Trigger: criar prestador_stats automaticamente ao criar prestador
create or replace function public.handle_new_prestador()
returns trigger language plpgsql security definer as $$
begin
  insert into public.prestador_stats (prestador_id) values (new.id)
  on conflict (prestador_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_prestador_created on public.prestadores;
create trigger on_prestador_created
  after insert on public.prestadores
  for each row execute function public.handle_new_prestador();

-- ============================================================
-- RPCs — incrementadores (security definer pra bypassa RLS de stats)
-- ============================================================
create or replace function public.incrementar_visualizacao_prestador(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.prestador_stats
    set visualizacoes = visualizacoes + 1, updated_at = now()
    where prestador_id = p_id;
end;
$$;

create or replace function public.incrementar_clique_whatsapp(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.prestador_stats
    set cliques_whatsapp = cliques_whatsapp + 1, updated_at = now()
    where prestador_id = p_id;
end;
$$;

create or replace function public.incrementar_clique_telefone(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.prestador_stats
    set cliques_telefone = cliques_telefone + 1, updated_at = now()
    where prestador_id = p_id;
end;
$$;

-- Permitir chamada anônima/autenticada
grant execute on function public.incrementar_visualizacao_prestador(uuid) to anon, authenticated;
grant execute on function public.incrementar_clique_whatsapp(uuid)        to anon, authenticated;
grant execute on function public.incrementar_clique_telefone(uuid)        to anon, authenticated;

-- ============================================================
-- Trigger: atualizar média de avaliações em prestadores
-- ============================================================
create or replace function public.atualizar_media_prestador()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  alvo uuid;
begin
  -- pode ser INSERT, UPDATE ou DELETE — pega o prestador_id correto
  if (tg_op = 'DELETE') then
    alvo := old.prestador_id;
  else
    alvo := new.prestador_id;
  end if;

  update public.prestadores
    set
      total_avaliacoes = (
        select count(*) from public.avaliacoes where prestador_id = alvo
      ),
      media_avaliacoes = coalesce((
        select round(avg(nota)::numeric, 2)
        from public.avaliacoes where prestador_id = alvo
      ), 0)
    where id = alvo;

  return null;
end;
$$;

drop trigger if exists trg_atualizar_media_prestador on public.avaliacoes;
create trigger trg_atualizar_media_prestador
  after insert or update or delete on public.avaliacoes
  for each row execute function public.atualizar_media_prestador();

-- ============================================================
-- STORAGE BUCKET: provider-photos (logos e capas)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('provider-photos', 'provider-photos', true)
on conflict (id) do nothing;

drop policy if exists "provider_photos_public_read" on storage.objects;
create policy "provider_photos_public_read" on storage.objects
  for select using (bucket_id = 'provider-photos');

drop policy if exists "provider_photos_authed_upload" on storage.objects;
create policy "provider_photos_authed_upload" on storage.objects
  for insert with check (
    bucket_id = 'provider-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "provider_photos_owner_update" on storage.objects;
create policy "provider_photos_owner_update" on storage.objects
  for update using (
    bucket_id = 'provider-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "provider_photos_owner_delete" on storage.objects;
create policy "provider_photos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'provider-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- TABLE: alertas_sos  (Central de Resgate)
-- ============================================================
-- Cada vez que o tutor dispara um SOS pra um pet perdido,
-- registramos aqui. Permite histórico, contagem, e (futuro)
-- notificar usuários no raio_km informado.
-- ============================================================
create table if not exists public.alertas_sos (
  id           uuid primary key default uuid_generate_v4(),
  created_at   timestamptz not null default now(),

  -- Qual pet foi alertado (sempre kind='lost' — validamos no app)
  pet_id       uuid not null references public.pets(id) on delete cascade,

  -- Quem disparou (sempre user logado — RLS garante = auth.uid())
  user_id      uuid not null references auth.users(id) on delete cascade,

  -- Raio de alerta em km (placeholder pra geolocalização futura)
  raio_km      int not null default 5 check (raio_km between 1 and 50),

  -- URL do card PNG gerado (Supabase Storage bucket alert-cards)
  imagem_url   text,

  -- Mensagem opcional adicional
  mensagem     text,

  status       text not null default 'ativo' check (
    status in ('ativo', 'resolvido', 'cancelado')
  )
);

create index if not exists alertas_sos_pet_id_idx     on public.alertas_sos (pet_id);
create index if not exists alertas_sos_user_id_idx    on public.alertas_sos (user_id);
create index if not exists alertas_sos_created_at_idx on public.alertas_sos (created_at desc);

alter table public.alertas_sos enable row level security;

-- SELECT público — qualquer um pode ver alertas ativos (transparência)
drop policy if exists "alertas_select_active" on public.alertas_sos;
create policy "alertas_select_active"
  on public.alertas_sos
  for select
  using (status = 'ativo' or user_id = auth.uid());

-- INSERT: só user logado, e user_id precisa bater com auth.uid()
drop policy if exists "alertas_insert_authed" on public.alertas_sos;
create policy "alertas_insert_authed"
  on public.alertas_sos
  for insert
  with check (user_id = auth.uid());

-- UPDATE/DELETE: só dono do alerta
drop policy if exists "alertas_update_owner" on public.alertas_sos;
create policy "alertas_update_owner"
  on public.alertas_sos
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "alertas_delete_owner" on public.alertas_sos;
create policy "alertas_delete_owner"
  on public.alertas_sos
  for delete
  using (user_id = auth.uid());

-- ============================================================
-- STORAGE BUCKET: alert-cards (cards PNG dos SOS)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('alert-cards', 'alert-cards', true)
on conflict (id) do nothing;

drop policy if exists "alert_cards_public_read" on storage.objects;
create policy "alert_cards_public_read"
  on storage.objects
  for select
  using (bucket_id = 'alert-cards');

-- Upload só por user autenticado (path tem que começar com auth.uid())
drop policy if exists "alert_cards_authed_upload" on storage.objects;
create policy "alert_cards_authed_upload"
  on storage.objects
  for insert
  with check (
    bucket_id = 'alert-cards'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- STORAGE BUCKET: pet-photos
-- ============================================================
-- Criar bucket (se já existir, ignora)
insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', true)
on conflict (id) do nothing;

-- Policies de Storage: upload público (MVP), leitura pública
drop policy if exists "pet_photos_public_read" on storage.objects;
create policy "pet_photos_public_read"
  on storage.objects
  for select
  using (bucket_id = 'pet-photos');

drop policy if exists "pet_photos_public_upload" on storage.objects;
create policy "pet_photos_public_upload"
  on storage.objects
  for insert
  with check (bucket_id = 'pet-photos');

-- DEBT: no futuro, restringir upload por auth e limitar tamanho/tipo
-- com Edge Function ou trigger de validação.

-- ============================================================
-- SEED opcional (descomente para popular dados de teste)
-- ============================================================
-- insert into public.pets (kind, species, color, neighborhood, city, event_date, contact_name, contact_phone)
-- values
--   ('lost', 'dog', 'caramelo', 'Vila Madalena', 'São Paulo', current_date, 'Wesley', '11999999999'),
--   ('found', 'cat', 'preto e branco', 'Pinheiros', 'São Paulo', current_date, 'Ana', '11988888888');
