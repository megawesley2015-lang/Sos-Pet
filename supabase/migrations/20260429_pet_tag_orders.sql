-- ============================================================
-- Módulo: Plaquinhas de Identificação
-- Tabela: pet_tag_orders
--
-- Fluxo:
--   1. Usuário preenche checkout → pet criado (status=draft)
--      + order criado (payment_status=pending_payment)
--   2. MP confirma pagamento → webhook atualiza status:
--      - pet → active
--      - order → payment_status=paid, supplier_status=queued
--   3. Sistema envia email ao fornecedor com QR code + dados
--
-- RLS:
--   - Dono vê/cria seus próprios pedidos
--   - Updates só via service_role (webhook)
--   - Admin vê tudo (via service_role)
-- ============================================================

create table if not exists pet_tag_orders (
  id                uuid primary key default gen_random_uuid(),
  pet_id            uuid references pets(id) on delete restrict not null,
  user_id           uuid references auth.users(id) on delete set null,

  -- Pagamento
  payment_provider  text    not null default 'mercadopago',
  payment_id        text    unique,               -- ID do pagamento no MP (preenchido pelo webhook)
  preference_id     text,                         -- ID da preferência MP (preenchido na criação)
  payment_status    text    not null default 'pending_payment',
  -- pending_payment | paid | failed | refunded | cancelled

  amount_cents      int     not null,             -- valor em centavos (ex: 3990 = R$ 39,90)

  -- Produto
  tag_type          text    not null default 'standard',
  -- standard | premium (extensível no futuro)

  -- Endereço de entrega (flexível via JSONB)
  shipping_name     text    not null,
  shipping_address  jsonb   not null,
  -- {
  --   cep, logradouro, numero, complemento,
  --   bairro, cidade, estado
  -- }

  -- Dados do contato na plaquinha (pode diferir do user)
  tag_contact_phone text    not null,             -- número que vai gravado na plaquinha

  -- Status de produção / envio ao fornecedor
  supplier_status   text    not null default 'awaiting_payment',
  -- awaiting_payment | queued | sent_to_supplier | in_production | shipped | delivered

  supplier_notified_at timestamptz,               -- quando o email ao fornecedor foi enviado
  tracking_code     text,
  shipped_at        timestamptz,
  delivered_at      timestamptz,

  -- Metadados
  notes             text,                         -- observações internas do admin
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ── Índices ───────────────────────────────────────────────────
create index if not exists pet_tag_orders_user_id_idx        on pet_tag_orders(user_id);
create index if not exists pet_tag_orders_pet_id_idx         on pet_tag_orders(pet_id);
create index if not exists pet_tag_orders_payment_status_idx on pet_tag_orders(payment_status);
create index if not exists pet_tag_orders_supplier_status_idx on pet_tag_orders(supplier_status);
create index if not exists pet_tag_orders_payment_id_idx     on pet_tag_orders(payment_id);

-- ── updated_at automático ────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pet_tag_orders_updated_at
  before update on pet_tag_orders
  for each row execute procedure set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
alter table pet_tag_orders enable row level security;

-- Dono vê seus pedidos
create policy "owner_select"
  on pet_tag_orders for select
  using (auth.uid() = user_id);

-- Dono cria seus pedidos
create policy "owner_insert"
  on pet_tag_orders for insert
  with check (auth.uid() = user_id);

-- Pedidos anônimos (sem login) — user_id null
create policy "anon_insert"
  on pet_tag_orders for insert
  with check (user_id is null);

-- Service role gerencia tudo (webhook, admin)
-- (service_role bypassa RLS automaticamente)

-- ── QR Code URL (view de conveniência) ───────────────────────
-- URL canônica gravada na plaquinha:
--   https://sospet.app/pet/{pet_id}
-- O QR Code é gerado dinamicamente via:
--   https://api.qrserver.com/v1/create-qr-code/?size=400x400&data={qr_url}
-- Não armazenamos o QR em storage — é gerado on-the-fly.
