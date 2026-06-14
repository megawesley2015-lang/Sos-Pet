# Tasks — Loja Printful + Mercado Pago
# SDD Fase 3: DECOMPOR
# Status geral: ✅ Concluído — 2026-06-12
# Referências: spec.md

---

## T1 — Migration SQL: tabela `store_orders`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `supabase/migrations/20260610_store_orders.sql` (novo)

### O que fazer
1. Criar `store_orders`:
   - `id UUID PK DEFAULT gen_random_uuid()`
   - `user_id UUID → auth.users(id) ON DELETE SET NULL`
   - `items JSONB NOT NULL` — array de `{ product_id, variant_id, quantity, price_brl, name }`
   - `subtotal_brl DECIMAL(10,2) NOT NULL`
   - `status TEXT CHECK IN ('pending','paid','shipped','delivered','cancelled','refunded') DEFAULT 'pending'`
   - `mp_preference_id TEXT`
   - `mp_payment_id TEXT`
   - `printful_order_id TEXT`
   - `printful_error TEXT`
   - `shipping_address JSONB`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ DEFAULT NOW()`
2. ENABLE ROW LEVEL SECURITY
3. Políticas:
   - SELECT: `auth.uid() = user_id` (usuário vê apenas seus pedidos)
   - INSERT: autenticado
   - UPDATE: service_role apenas (webhooks atualizam via service_role)
4. Trigger `update_updated_at_column`
5. Índices: `(user_id, created_at DESC)`, `(mp_payment_id)`, `(status)`
6. Verificar se `store_products` precisa de campos adicionais (adicionar `variants JSONB` e `in_stock BOOLEAN DEFAULT true` se não existirem via ALTER TABLE)

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] `store_orders` criada com todos os campos
- [ ] RLS: usuário A não vê pedidos do usuário B
- [ ] UPDATE bloqueado para usuários (apenas service_role)
- [ ] `store_products` tem `variants` e `in_stock`

---

## T2 — Completar `/api/sync/printful`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/api/sync/printful/route.ts`

### O que fazer
1. Verificar `Authorization: Bearer {SYNC_TOKEN}` — retornar 401 se inválido
2. Buscar `GET https://api.printful.com/store/products` com `Authorization: Bearer {PRINTFUL_API_KEY}`
3. Para cada produto: buscar detalhes `GET /store/products/{id}` para obter variantes e preço
4. Montar objeto com `printful_product_id`, `name`, `description`, `price_brl` (converter de USD se necessário), `image_url`, `variants` (JSON), `in_stock: true`
5. UPSERT em `store_products` com `onConflict: 'printful_product_id'`
6. Produtos no Supabase não presentes na resposta da Printful: UPDATE `in_stock = false`
7. Retornar `{ success: true, data: { synced, deactivated } }`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Request sem token retorna 401
- [ ] Produtos novos são inseridos
- [ ] Produtos existentes são atualizados (sem duplicatas)
- [ ] Produtos removidos da Printful são marcados `in_stock = false`
- [ ] `npm run typecheck` sem erros

---

## T3 — Hook `useCart` com persistência em localStorage

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `hooks/useCart.ts` (novo)

### Especificação EARS
WHEN visitante clica "Adicionar ao carrinho"
THE SYSTEM SHALL adicionar ao localStorage sem reload.

### O que fazer
1. Estado: `items: CartItem[]` onde `CartItem = { product_id, variant_id, quantity, price_brl, name, image_url }`
2. Inicializar do `localStorage.getItem('sos-pet-cart')` (com try/catch para SSR)
3. Funções: `addItem(item: CartItem)`, `removeItem(product_id, variant_id)`, `updateQuantity(...)`, `clearCart()`
4. Sempre persistir em localStorage após mutações
5. Computed: `totalItems: number`, `totalPrice: number`
6. Exportar `CartContext` e `CartProvider` para envolver o app
7. Hook `useCart()` para consumir o contexto

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] Carrinho persiste após reload da página
- [ ] `addItem` com item já existente incrementa quantidade
- [ ] `totalItems` reflete a soma das quantidades
- [ ] Sem erros de SSR (localStorage acessado apenas no client)
- [ ] `npm run typecheck` sem erros

---

## T4 — API de checkout `/api/store/checkout`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/api/store/checkout/route.ts` (novo)

### Especificação EARS
WHEN `POST /api/store/checkout` com items válidos
THE SYSTEM SHALL criar preferência MP e pedido `pending` em `store_orders`.

### O que fazer
1. Verificar autenticação — 401 se não logado
2. Body: `{ items: CartItem[], shipping_address: ShippingAddress }`
3. Validar com Zod: cada item tem `product_id` UUID válido e `quantity` positivo
4. Para cada item: buscar preço em `store_products` (nunca confiar no preço vindo do cliente)
5. Se qualquer produto `in_stock = false`: retornar 422 com mensagem
6. Calcular `subtotal_brl` com preços do Supabase
7. Criar preferência MP: `POST https://api.mercadopago.com/checkout/preferences` com `MP_ACCESS_TOKEN`; incluir `back_urls` (success: `/loja/sucesso`, failure: `/loja/checkout`, pending: `/loja/checkout`)
8. Inserir em `store_orders` com `status = 'pending'`, `mp_preference_id`, items, total
9. Retornar `{ success: true, data: { order_id, preference_id, init_point } }`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Sem autenticação retorna 401
- [ ] Preço vindo do cliente é ignorado (sempre usa `store_products.price_brl`)
- [ ] Produto `in_stock = false` retorna 422
- [ ] Pedido criado com `status = 'pending'` no Supabase
- [ ] `init_point` retornado para redirect
- [ ] `npm run typecheck` sem erros

---

## T5 — Webhook Mercado Pago + criação na Printful

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/api/webhooks/mercadopago/route.ts` (novo)

### Especificação EARS
WHEN webhook com `status = 'approved'` chega
THE SYSTEM SHALL confirmar pedido e criar na Printful.

### O que fazer
1. Verificar assinatura HMAC-SHA256: header `x-signature` com `MP_WEBHOOK_SECRET`
2. Parsear `{ action, data: { id: payment_id } }` — processar apenas `action = 'payment.created'` ou `action = 'payment.updated'`
3. Buscar detalhes do pagamento na MP API com `MP_ACCESS_TOKEN`
4. Se `status !== 'approved'`: retornar 200 silenciosamente
5. Buscar `store_orders` pelo `mp_preference_id`
6. Atualizar `status = 'paid'`, `mp_payment_id`
7. Criar pedido na Printful: `POST https://api.printful.com/orders` com os itens e endereço de entrega
8. Salvar `printful_order_id`; se falhar, salvar erro em `printful_error` (não reverter pagamento)
9. Enviar email de confirmação via Resend: subject "Pedido confirmado — Pet Aumigo"

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Assinatura HMAC inválida retorna 401
- [ ] Pagamento não-aprovado não cria pedido na Printful
- [ ] Falha na Printful não bloqueia response (try/catch com log)
- [ ] Email de confirmação enviado após `status = 'paid'`
- [ ] `npm run typecheck` sem erros

---

## T6 — Páginas da loja com carrinho e UI

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivos:** `app/(public)/loja/page.tsx`, `app/(public)/loja/[id]/page.tsx`, `app/(public)/loja/checkout/page.tsx`, `app/(public)/loja/sucesso/page.tsx`

### O que fazer
1. `/loja`: grid de produtos do Supabase (`in_stock = true`); botão "Adicionar ao carrinho" em cada card; badge no header via `useCart`
2. `/loja/[id]`: seleção de variante (cor/tamanho); botão "Adicionar ao carrinho"; preço em BRL formatado
3. `/loja/checkout`: listar itens, total, formulário de endereço; botão "Pagar com Mercado Pago" que chama `/api/store/checkout` e redireciona para `init_point`
4. `/loja/sucesso`: ler `?payment_id` da URL; exibir número do pedido e próximos passos
5. Adicionar `CartProvider` em `app/layout.tsx`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] `/loja` lista produtos com preço formatado em BRL
- [ ] Badge do carrinho atualiza sem reload
- [ ] `/loja/checkout` sem itens redireciona para `/loja`
- [ ] Página de sucesso exibe número do pedido
- [ ] `npm run build` sem erros

---

## Ordem de Execução

T1 → T2 → T3 → T4 → T5 → T6

**Dependências:**
- T2 pode rodar em paralelo com T1 (usa store_products existente)
- T3 é independente (apenas localStorage)
- T4 depende de T1 (store_orders) e T3 (CartItem type)
- T5 depende de T1 e T4
- T6 depende de T3 e T4

## Harness Global

```bash
npm run typecheck
npm run build
```

