# Spec — Loja Printful + Mercado Pago
# SDD Fase 1: ESPECIFICAR (O QUÊ — sem tecnologia)
# Notação: EARS (Easy Approach to Requirements Syntax)
# Status: ⬜ Pendente
# Slug: loja-printful
# Responsável: Wes
# Data: 2026-06-10

---

## Contexto de Negócio

A loja do Pet Aumigo vende plaquinhas de identificação para pets e outros produtos personalizados
via Printful (print-on-demand). O modelo de negócio B2C complementa a monetização principal.
As rotas `/loja` e `/loja/[id]` já existem, a variável `PRINTFUL_API_KEY` está nas env vars,
e a tabela `store_products` já existe. O gap é o fluxo completo: catálogo sincronizado com
Printful → carrinho local → checkout com Mercado Pago → webhook de confirmação → pedido
criado na Printful. Sem isso, a loja é só uma vitrine sem venda.

## Estado Atual

| Item | Status |
|---|---|
| Rotas `/loja` e `/loja/[id]` | Existem (sem dados reais) |
| Tabela `store_products` | Existe |
| `PRINTFUL_API_KEY` | Configurada |
| `MP_ACCESS_TOKEN`, `NEXT_PUBLIC_MP_PUBLIC_KEY` | Configuradas |
| `MP_WEBHOOK_SECRET`, `NEXT_PUBLIC_TAG_PRICE_BRL` | Configuradas |
| `/api/sync/printful` | Existe mas sem implementação completa |
| Carrinho | Não existe |
| Checkout Mercado Pago | Não existe |
| Tabela de pedidos (`store_orders`) | Não existe |

## Requisitos — Notação EARS

### 2.1 Sincronização do Catálogo Printful

WHEN a rota `POST /api/sync/printful` é chamada com `Authorization: Bearer {SYNC_TOKEN}`
THE SYSTEM SHALL buscar produtos ativos da Printful API e fazer UPSERT em `store_products`.

WHEN o UPSERT é executado
THE SYSTEM SHALL salvar: `printful_product_id`, `name`, `description`, `price_brl`,
`image_url`, `variants` (JSON), `in_stock` (boolean), `updated_at`.

IF um produto existente no Supabase não aparecer mais na Printful
THE SYSTEM SHALL marcar `in_stock = false` (não deletar).

### 2.2 Exibição da Loja

WHEN um visitante acessa `/loja`
THE SYSTEM SHALL exibir produtos com `in_stock = true`, ordenados por `created_at ASC`.

WHEN um visitante acessa `/loja/[id]`
THE SYSTEM SHALL exibir detalhes do produto: nome, descrição, preço, imagem, variantes
disponíveis (cor, tamanho).

IF o produto não existir ou `in_stock = false`
THEN THE SYSTEM SHALL retornar página 404 adequada.

### 2.3 Carrinho de Compras

WHEN um visitante clica em "Adicionar ao carrinho"
THE SYSTEM SHALL adicionar o item ao carrinho persistido em `localStorage` com:
`{ product_id, variant_id, quantity, price_brl, name, image_url }`.

WHEN o visitante altera a quantidade de um item
THE SYSTEM SHALL atualizar o carrinho em `localStorage` sem reload de página.

WHEN o visitante remove um item
THE SYSTEM SHALL removê-lo do carrinho imediatamente.

THE SYSTEM SHALL exibir badge de contagem de itens no ícone do carrinho no header.

### 2.4 Checkout com Mercado Pago

WHEN o visitante clica em "Finalizar compra" com carrinho não-vazio
THE SYSTEM SHALL requerer autenticação (redirecionar para `/login?next=/loja/checkout` se não logado).

WHEN o usuário autenticado submete o checkout com dados de endereço
THE SYSTEM SHALL chamar `POST /api/store/checkout` que:
1. Valida itens do carrinho contra `store_products` (preço e estoque)
2. Cria preferência de pagamento no Mercado Pago via `MP_ACCESS_TOKEN`
3. Cria registro em `store_orders` com `status = 'pending'`
4. Retorna `{ preference_id, init_point }` para redirecionar ao MP

WHEN o Mercado Pago retorna para `/loja/sucesso?payment_id=...`
THE SYSTEM SHALL exibir página de confirmação com número do pedido.

### 2.5 Webhook de Confirmação de Pagamento

WHEN Mercado Pago envia webhook `POST /api/webhooks/mercadopago`
THE SYSTEM SHALL verificar a assinatura HMAC com `MP_WEBHOOK_SECRET`.

WHEN o pagamento tem `status = 'approved'`
THE SYSTEM SHALL atualizar `store_orders` para `status = 'paid'` e disparar pedido na Printful API.

WHEN o pedido é criado na Printful com sucesso
THE SYSTEM SHALL salvar `printful_order_id` em `store_orders` e enviar email de confirmação via Resend.

IF a verificação de assinatura HMAC falhar
THEN THE SYSTEM SHALL retornar 401 e não processar o pagamento.

IF a Printful retornar erro ao criar o pedido
THEN THE SYSTEM SHALL manter `store_orders.status = 'paid'` e registrar `printful_error` para retry manual.

---

## Critérios de Aceitação

- [ ] `POST /api/sync/printful` com token correto sincroniza produtos no Supabase
- [ ] `/loja` exibe apenas produtos `in_stock = true`
- [ ] Carrinho persiste em localStorage e exibe badge de contagem no header
- [ ] Checkout requer autenticação
- [ ] `/api/store/checkout` cria preferência no MP e registro `pending` em `store_orders`
- [ ] Webhook MP com assinatura inválida retorna 401
- [ ] Webhook MP com `status = 'approved'` cria pedido na Printful
- [ ] Email de confirmação enviado após pagamento aprovado
- [ ] `npm run typecheck` sem erros
