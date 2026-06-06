-- ============================================================
-- Módulo: Loja / Catálogo de Produtos
-- Tabela: store_products
-- ============================================================

create table if not exists store_products (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  description           text,
  price_cents           integer not null,
  original_price_cents  integer,                      -- preço riscado (desconto)
  photo_url             text,
  supplier_name         text,                         -- ex: "Pet Print", "My Family Brasil"
  category              text default 'geral',         -- plaquinha | coleira | acessorio | geral
  checkout_type         text default 'external'
                          check (checkout_type in ('external', 'internal')),
  external_url          text,                         -- se checkout_type = external
  active                boolean default true,
  featured              boolean default false,        -- destaque na vitrine
  sort_order            integer default 0,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ── Indexes ────────────────────────────────────────────────
create index if not exists store_products_active_idx
  on store_products (active, featured, sort_order);

create index if not exists store_products_category_idx
  on store_products (category) where active = true;

-- ── Updated_at trigger ────────────────────────────────────
create or replace function set_store_products_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists store_products_updated_at on store_products;
create trigger store_products_updated_at
  before update on store_products
  for each row execute function set_store_products_updated_at();

-- ── RLS ───────────────────────────────────────────────────
alter table store_products enable row level security;

-- Leitura pública: apenas produtos ativos
create policy "store_products_public_select"
  on store_products for select
  using (active = true);

-- Admin: acesso total
create policy "store_products_admin_all"
  on store_products for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );
