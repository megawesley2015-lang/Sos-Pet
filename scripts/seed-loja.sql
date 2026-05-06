-- ============================================================
-- SOS Pet — Setup completo da Loja
--
-- Cole e execute este arquivo no Supabase SQL Editor:
-- https://app.supabase.com → seu projeto → SQL Editor → New query
--
-- Passo único: cria a tabela (se não existir) + insere os produtos.
-- ============================================================

-- ── 1. Cria tabela store_products (idempotente) ──────────────

create table if not exists store_products (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  description           text,
  price_cents           integer not null,
  original_price_cents  integer,
  photo_url             text,
  supplier_name         text,
  category              text default 'geral',
  checkout_type         text default 'external'
                          check (checkout_type in ('external', 'internal')),
  external_url          text,
  active                boolean default true,
  featured              boolean default false,
  sort_order            integer default 0,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index if not exists store_products_active_idx
  on store_products (active, featured, sort_order);

create index if not exists store_products_category_idx
  on store_products (category) where active = true;

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

alter table store_products enable row level security;

drop policy if exists "store_products_public_select" on store_products;
create policy "store_products_public_select"
  on store_products for select
  using (active = true);

drop policy if exists "store_products_admin_all" on store_products;
create policy "store_products_admin_all"
  on store_products for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── 2. Insere produtos (só se a tabela estiver vazia) ────────

do $$
begin
  if (select count(*) from store_products) = 0 then

    insert into store_products
      (name, description, price_cents, original_price_cents, supplier_name,
       category, checkout_type, external_url, featured, active, sort_order)
    values

    -- ── DESTAQUES ──────────────────────────────────────────────────────────

    (
      'Plaquinha QR Code SOS Pet',
      'Plaquinha de alumínio personalizada com QR Code, nome e telefone gravados a laser. Qualquer pessoa que encontrar seu pet escaneie e vê seu contato imediatamente — sem precisar de app. Perfil digital ativo no SOS Pet incluso.',
      3990, null, 'SOS Pet',
      'plaquinha', 'internal', null,
      true, true, 1
    ),
    (
      'Coleira Refletiva com Identificação',
      'Coleira com faixa 360° reflexiva para máxima visibilidade à noite. Nylon reforçado, ajustável, com argola inox para plaquinha. Tamanhos P, M, G e GG.',
      4590, 6990, 'Petz',
      'coleira', 'external', 'https://www.petz.com.br/cachorro/coleiras-guias-e-peitorais/coleiras',
      true, true, 2
    ),
    (
      'Peitoral Refletivo Safety Walk',
      'Distribuição de força no peito — não no pescoço. Faixas refletivas 360°, dois pontos de fixação, fácil de vestir. Ideal para passeios noturnos e cães agitados.',
      6490, 8990, 'Petz',
      'acessorio', 'external', 'https://www.petz.com.br/cachorro/coleiras-guias-e-peitorais/peitorais',
      true, true, 3
    ),
    (
      'Rastreador GPS para Pets',
      'Localize seu pet em tempo real pelo celular. Resistente à água (IPX5), bateria de até 7 dias, cobertura 4G em todo o Brasil. Compatível com cães e gatos acima de 3 kg.',
      12990, 18990, 'Shopee',
      'acessorio', 'external', 'https://shopee.com.br/search?keyword=rastreador+gps+pet+4g',
      true, true, 4
    ),

    -- ── SEGURANÇA ──────────────────────────────────────────────────────────

    (
      'Coleira Antipuxão com Alça de Controle',
      'Coleira com alça integrada para controle imediato em situações de risco. Dois pontos de fixação e fechamento rápido. Recomendada para médio e grande porte.',
      5290, null, 'Petz',
      'coleira', 'external', 'https://www.petz.com.br/cachorro/coleiras-guias-e-peitorais/coleiras',
      false, true, 5
    ),
    (
      'Tag Metálica de Identificação Personalizada',
      'Plaquinha de metal com gravação a laser — nome + telefone. Durável, não enferruja, não desbota. Ótima opção para complementar a coleira antes da plaquinha QR Code.',
      1890, null, 'Shopee',
      'plaquinha', 'external', 'https://shopee.com.br/search?keyword=tag+identificacao+pet+metal+gravada',
      false, true, 6
    ),

    -- ── HIGIENE (recorrência mensal) ───────────────────────────────────────

    (
      'Shampoo Hipoalergênico para Cães',
      'Sem fragrância, sem corantes, sem sulfatos. pH neutro, indicado por veterinários, seguro para filhotes acima de 8 semanas. 500 ml.',
      3290, null, 'Petz',
      'higiene', 'external', 'https://www.petz.com.br/cachorro/banho-e-tosa/shampoos',
      false, true, 7
    ),
    (
      'Kit Primeiros Socorros Veterinário',
      'Ataduras, esparadrapo, antisséptico, pinça, luvas e manual de primeiros socorros para pets. Essencial em casa e na mochila de passeio.',
      8990, null, 'Petz',
      'higiene', 'external', 'https://www.petz.com.br/cachorro/saude',
      false, true, 8
    ),

    -- ── ACESSÓRIOS ─────────────────────────────────────────────────────────

    (
      'Bebedouro Portátil para Passeios',
      'Garrafa com bebedouro retrátil embutido. 350 ml, sem BPA, encaixa em qualquer bolsa. Basta apertar — a água vai direto para a boca do pet.',
      2990, null, 'Shopee',
      'acessorio', 'external', 'https://shopee.com.br/search?keyword=bebedouro+portatil+cachorro+garrafa',
      false, true, 9
    ),

    -- ── ALIMENTAÇÃO (alta recorrência) ─────────────────────────────────────

    (
      'Petisco Natural Palito de Frango',
      '100% frango desidratado. Sem conservantes, corantes ou glúten. Rico em proteína, baixo em gordura. Ideal para recompensas no treinamento. 100 g.',
      2490, null, 'Petz',
      'alimentacao', 'external', 'https://www.petz.com.br/cachorro/petiscos-e-ossos/petiscos-naturais',
      false, true, 10
    );

    raise notice '✅ 10 produtos inseridos com sucesso!';
  else
    raise notice '⚠️  Tabela já tem produtos — seed ignorado. DELETE FROM store_products; para reiniciar.';
  end if;
end $$;

-- ── Confirmar ────────────────────────────────────────────────
select id, name, category, price_cents, featured, active
from store_products
order by sort_order;
