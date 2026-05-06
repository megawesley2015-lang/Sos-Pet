-- ============================================================
-- Módulo: Painel de ONGs e Protetores
-- Migration idempotente: pode ser executada múltiplas vezes.
-- ============================================================

-- ── 1. Perfis de ONG ────────────────────────────────────────

create table if not exists ong_details (
  profile_id  uuid primary key references profiles(id) on delete cascade,
  nome_ong    text not null,
  cnpj        text,
  telefone    text,
  cidade      text,
  descricao   text,
  logo_url    text,
  aprovado    boolean default false,
  created_at  timestamptz default now()
);

alter table ong_details enable row level security;

drop policy if exists "ong_details_owner_select" on ong_details;
create policy "ong_details_owner_select"
  on ong_details for select
  using (profile_id = auth.uid() or exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

drop policy if exists "ong_details_owner_all" on ong_details;
create policy "ong_details_owner_all"
  on ong_details for all
  using (profile_id = auth.uid());

-- ── 2. Prontuário médico ─────────────────────────────────────

create table if not exists prontuarios (
  id               uuid primary key default gen_random_uuid(),
  pet_id           uuid not null references pets(id) on delete cascade,
  ong_id           uuid not null references profiles(id),
  data_resgate     date not null,
  situacao_saude   text default 'boa'
                     check (situacao_saude in ('critica','regular','boa','excelente')),
  peso_kg          numeric(5,2),
  castrado         boolean default false,
  microchip        text,
  observacoes      text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists prontuarios_pet_idx on prontuarios(pet_id);
create index if not exists prontuarios_ong_idx on prontuarios(ong_id);
create index if not exists prontuarios_resgate_idx on prontuarios(data_resgate desc);

alter table prontuarios enable row level security;

drop policy if exists "prontuarios_ong_all" on prontuarios;
create policy "prontuarios_ong_all"
  on prontuarios for all
  using (ong_id = auth.uid() or exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

-- ── 3. Vacinas ───────────────────────────────────────────────

create table if not exists vacinas (
  id               uuid primary key default gen_random_uuid(),
  prontuario_id    uuid not null references prontuarios(id) on delete cascade,
  nome             text not null,
  data_aplicacao   date not null,
  proxima_dose     date,
  veterinario      text,
  lote             text,
  observacao       text,
  created_at       timestamptz default now()
);

create index if not exists vacinas_prontuario_idx on vacinas(prontuario_id);

alter table vacinas enable row level security;

drop policy if exists "vacinas_via_prontuario" on vacinas;
create policy "vacinas_via_prontuario"
  on vacinas for all
  using (exists (
    select 1 from prontuarios p
    where p.id = vacinas.prontuario_id
      and (p.ong_id = auth.uid() or exists (
        select 1 from profiles where id = auth.uid() and role = 'admin'
      ))
  ));

-- ── 4. Medicações em curso ───────────────────────────────────

create table if not exists medicacoes (
  id               uuid primary key default gen_random_uuid(),
  prontuario_id    uuid not null references prontuarios(id) on delete cascade,
  nome             text not null,
  dosagem          text,
  frequencia       text,
  data_inicio      date not null,
  data_fim         date,
  ativa            boolean default true,
  observacao       text,
  created_at       timestamptz default now()
);

create index if not exists medicacoes_prontuario_idx on medicacoes(prontuario_id);
create index if not exists medicacoes_ativa_idx on medicacoes(ativa) where ativa = true;

alter table medicacoes enable row level security;

drop policy if exists "medicacoes_via_prontuario" on medicacoes;
create policy "medicacoes_via_prontuario"
  on medicacoes for all
  using (exists (
    select 1 from prontuarios p
    where p.id = medicacoes.prontuario_id
      and (p.ong_id = auth.uid() or exists (
        select 1 from profiles where id = auth.uid() and role = 'admin'
      ))
  ));

-- ── 5. Controle de adoções ───────────────────────────────────

create table if not exists adocoes (
  id                    uuid primary key default gen_random_uuid(),
  pet_id                uuid not null references pets(id),
  ong_id                uuid not null references profiles(id),
  adotante_nome         text not null,
  adotante_email        text,
  adotante_telefone     text not null,
  adotante_cpf          text,
  data_adocao           date not null,
  status                text default 'ativo'
                          check (status in ('ativo','devolvido','falecido','transferido')),
  acompanhamento_30d    boolean default false,
  acompanhamento_30d_em timestamptz,
  acompanhamento_90d    boolean default false,
  acompanhamento_90d_em timestamptz,
  observacoes           text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index if not exists adocoes_ong_idx on adocoes(ong_id);
create index if not exists adocoes_data_idx on adocoes(data_adocao desc);
create index if not exists adocoes_status_idx on adocoes(status);

alter table adocoes enable row level security;

drop policy if exists "adocoes_ong_all" on adocoes;
create policy "adocoes_ong_all"
  on adocoes for all
  using (ong_id = auth.uid() or exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));
