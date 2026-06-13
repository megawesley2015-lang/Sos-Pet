# Tasks — Dashboard do Prestador de Serviço
# SDD Fase 3: DECOMPOR
# Status geral: ✅ Concluído — 2026-06-12
# Referências: spec.md

---

## T1 — Migration SQL: campos de métricas e tabela de eventos

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `supabase/migrations/20260610_prestador_metrics.sql` (novo)

### O que fazer
1. ALTER TABLE `prestadores` ADD COLUMN IF NOT EXISTS:
   - `view_count INTEGER DEFAULT 0`
   - `whatsapp_clicks INTEGER DEFAULT 0`
   - `photos JSONB DEFAULT '[]'::jsonb`
2. Criar `prestador_events`:
   - `id UUID PK DEFAULT gen_random_uuid()`
   - `prestador_id UUID → prestadores(id) ON DELETE CASCADE NOT NULL`
   - `event_type TEXT CHECK IN ('view','whatsapp_click') NOT NULL`
   - `city TEXT`
   - `occurred_at TIMESTAMPTZ DEFAULT NOW()`
3. ENABLE ROW LEVEL SECURITY em `prestador_events`
4. Políticas:
   - INSERT: público (sem auth) para registrar eventos anônimos
   - SELECT: apenas `user_id = auth.uid()` via JOIN com `prestadores`
5. Índices: `(prestador_id, event_type, occurred_at DESC)`, `(occurred_at DESC)`
6. Criar RPC Supabase `incrementar_visualizacao(p_prestador_id UUID)`:
   `UPDATE prestadores SET view_count = view_count + 1 WHERE id = p_prestador_id`
   — usar SECURITY DEFINER para funcionar sem RLS

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] `ALTER TABLE` idempotente (IF NOT EXISTS)
- [ ] `prestador_events` com INSERT público (sem autenticação)
- [ ] RPC `incrementar_visualizacao` funciona sem auth
- [ ] `photos` default é array vazio (`[]`), não null

---

## T2 — API Routes de métricas e edição de prestador

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivos:**
- `app/api/prestadores/[id]/click/route.ts` (novo)
- `app/api/prestadores/[id]/route.ts` (novo ou completar existente)

### O que fazer
**`/api/prestadores/[id]/click`:**
1. `POST`: sem necessidade de autenticação; parsear `{ event_type: 'whatsapp_click' }`
2. Incrementar `whatsapp_clicks` via UPDATE; inserir em `prestador_events`
3. Rate limit leve: `prestador-click:{ip_hash}:{prestador_id}` — max 10/min por IP
4. Retornar `{ success: true }` sem dados extras

**`/api/prestadores/[id]`:**
1. `GET`: retornar dados do prestador (público)
2. `PATCH`: verificar autenticação e que `user_id = auth.uid()`; validar body com Zod;
   campos editáveis: `nome`, `categoria`, `descricao`, `telefone`, `endereco`, `cidade`, `emergencia_24h`
3. Se `user_id !== auth.uid()`: retornar 403

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] `POST /click` sem auth funciona (registra evento)
- [ ] `PATCH` sem auth retorna 401
- [ ] `PATCH` de prestador de outro usuário retorna 403
- [ ] Rate limit em clicks (10/min)
- [ ] `npm run typecheck` sem erros

---

## T3 — Incremento de visualização em `/prestadores/[slug]`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/(public)/prestadores/[slug]/page.tsx`

### Especificação EARS
WHEN visitante acessa o perfil
THE SYSTEM SHALL incrementar `view_count` sem bloquear a renderização.

### O que fazer
1. Na página Server Component, após renderizar, chamar RPC `incrementar_visualizacao` de forma assíncrona sem await (fire-and-forget seguro — usar `void supabase.rpc(...)`)
2. Inserir evento em `prestador_events` com `event_type = 'view'`
3. Botão WhatsApp: adicionar `onClick` Client Component que chama `POST /api/prestadores/[id]/click` antes de abrir o link WhatsApp
4. Separar a lógica do botão em componente `WhatsAppButton.tsx` (client component)

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Página carrega sem esperar o incremento (sem `await` no RPC)
- [ ] `WhatsAppButton` chama a API antes de abrir o link
- [ ] `npm run typecheck` sem erros

---

## T4 — Schema Zod para edição de prestador

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `lib/validation/prestador.ts` (novo)

### O que fazer
1. `prestadorUpdateSchema`:
   - `nome`: `string().min(2).max(100)` obrigatório
   - `categoria`: `z.enum(['clinica','petshop','banho_tosa','adestrador','veterinario','hotel_pet','outros'])`
   - `descricao`: `string().max(1000)` opcional
   - `telefone`: `string().regex(/^\d{10,11}$/)` opcional
   - `endereco`: string opcional
   - `cidade`: string obrigatório
   - `emergencia_24h`: boolean
2. Exportar tipo `PrestadorUpdateInput`

### Harness Commands
```bash
npm run typecheck
npx vitest run dashboard-prestador
```

### Critério de Aceite
- [ ] `nome` vazio lança ZodError
- [ ] `categoria` fora do enum lança ZodError
- [ ] `telefone` com 9 dígitos lança ZodError
- [ ] `npm run typecheck` sem erros

---

## T5 — Upload de fotos do estabelecimento

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/api/prestadores/[id]/photos/route.ts` (novo)

### Especificação EARS
WHEN upload de foto com extensão inválida ou > 5MB
THE SYSTEM SHALL rejeitar com mensagem clara.

### O que fazer
1. `POST /api/prestadores/[id]/photos`: verificar auth e ownership; aceitar `multipart/form-data`
2. Validar: tipo MIME in `['image/jpeg','image/png','image/webp']`; tamanho <= 5MB
3. Verificar que `prestadores.photos` tem < 5 itens
4. Fazer upload para `establishment-images/{prestador_id}/{uuid}.{ext}` no Supabase Storage
5. Append da URL pública em `prestadores.photos` via UPDATE
6. Retornar `{ success: true, data: { photo_url } }`
7. `DELETE /api/prestadores/[id]/photos`: body `{ photo_url }`; verificar ownership; remover do Storage; remover do array JSONB

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Upload de PNG de 2MB funciona
- [ ] Upload de PDF retorna 422
- [ ] Upload de arquivo > 5MB retorna 422
- [ ] 6ª foto retorna 422 "Máximo de 5 fotos atingido"
- [ ] DELETE remove a URL do array JSONB
- [ ] `npm run typecheck` sem erros

---

## T6 — Página `/dashboard-prestador` com métricas e edição

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/dashboard-prestador/page.tsx`

### O que fazer
1. Server Component: verificar auth; buscar `prestadores` onde `user_id = auth.uid()`; se não encontrado, exibir CTA
2. Métricas de 30 dias: query em `prestador_events` com `occurred_at >= now() - 30 days` agrupado por `event_type`
3. Métricas totais: `view_count` e `whatsapp_clicks` da tabela `prestadores`
4. Calcular `conversion_rate = whatsapp_clicks / view_count * 100`
5. Gráfico de barras dos últimos 7 dias: query de eventos por dia; usar componente simples com SVG ou Recharts (sem lib externa se possível)
6. Formulário de edição (Client Component): pré-populado com dados atuais; submit para `PATCH /api/prestadores/[id]`; toast de sucesso
7. Seção de fotos: grid de fotos com botão de remoção; botão "Adicionar foto" com input file

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Sem autenticação: redireciona para `/login`
- [ ] Sem prestador: exibe CTA de cadastro
- [ ] Métricas de 30 dias calculadas corretamente
- [ ] Taxa de conversão exibida como "X.X%"
- [ ] Edição de perfil funciona com toast de confirmação
- [ ] Grid de fotos com botão de remoção funcional
- [ ] `npm run build` sem erros

---

## Ordem de Execução

T1 → T2 → T3 → T4 → T2 (PATCH) → T5 → T6

**Dependências:**
- T4 pode ser feito em paralelo com T1
- T2 click route depende de T1 (coluna whatsapp_clicks)
- T3 depende de T1 (RPC) e T2 (API route)
- T5 depende de T1 (coluna photos)
- T6 depende de T1, T2, T4, T5

## Harness Global

```bash
npm run typecheck
npx vitest run dashboard-prestador
npm run build
```

