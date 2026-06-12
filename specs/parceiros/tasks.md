# Tasks — Módulo de Parcerias B2B
# SDD Fase 3: DECOMPOR
# Status geral: ✅ Concluído — 2026-06-12
# Referências: spec.md

---

## T1 — Migration SQL: `partnership_requests` e campo `status_parceiro` em `prestadores`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `supabase/migrations/20260610_parceiros.sql` (novo)

### O que fazer
1. Criar `partnership_requests`:
   - `id UUID PK DEFAULT gen_random_uuid()`
   - `nome TEXT NOT NULL`
   - `email TEXT NOT NULL`
   - `telefone TEXT NOT NULL`
   - `tipo_negocio TEXT CHECK IN ('clinica','petshop','banho_tosa','adestramento','hotel_pet','ong','outro') NOT NULL`
   - `cidade TEXT NOT NULL`
   - `mensagem TEXT`
   - `status TEXT CHECK IN ('pending','approved','rejected') DEFAULT 'pending'`
   - `prestador_id UUID → prestadores(id) ON DELETE SET NULL` — referência ao prestador criado
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ DEFAULT NOW()`
   - UNIQUE constraint em `(email)` WHERE status IN ('pending', 'approved')
2. `ALTER TABLE prestadores ADD COLUMN IF NOT EXISTS status_parceiro TEXT CHECK (status_parceiro IN ('aguardando_aprovacao','ativo','inativo')) DEFAULT NULL`
3. ENABLE ROW LEVEL SECURITY em `partnership_requests`
4. Políticas RLS:
   - INSERT: público (qualquer pessoa pode submeter)
   - SELECT: service_role apenas (admins acessam via service_role)
   - UPDATE: service_role apenas
5. Trigger `update_updated_at_column` em `partnership_requests`
6. Índices: `(status)`, `(email)`, `(created_at DESC)`

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] Migration idempotente
- [ ] UNIQUE parcial em email para status pending/approved
- [ ] INSERT público funciona sem autenticação
- [ ] `status_parceiro` não quebra prestadores existentes (DEFAULT NULL)

---

## T2 — Schema Zod do formulário de parcerias

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `lib/validation/parceiros.ts` (novo)

### O que fazer
1. `partnershipRequestSchema`:
   - `nome`: `string().min(2).max(100)`
   - `email`: `string().email()`
   - `telefone`: `string().regex(/^\d{10,11}$/)` — 10 ou 11 dígitos
   - `tipo_negocio`: `z.enum(['clinica','petshop','banho_tosa','adestramento','hotel_pet','ong','outro'])`
   - `cidade`: `z.enum(['Santos','Guarujá','São Vicente','Cubatão','Bertioga','Praia Grande','Mongaguá','Itanhaém','Peruíbe'])`
   - `mensagem`: `string().max(1000).optional()`
   - `aceita_termos`: `z.literal(true, { errorMap: () => ({ message: 'Você deve aceitar os termos' }) })`
   - `turnstile_token`: `string().min(1)` — token do Cloudflare Turnstile
2. Exportar tipo `PartnershipRequestInput`

### Harness Commands
```bash
npm run typecheck
npx vitest run parceiros
```

### Critério de Aceite
- [ ] `aceita_termos = false` lança ZodError
- [ ] `telefone = '999'` (3 dígitos) lança ZodError
- [ ] `cidade = 'São Paulo'` lança ZodError (não está na lista)
- [ ] `npm run typecheck` sem erros

---

## T3 — API Route `POST /api/parceiros`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/api/parceiros/route.ts` (novo)

### Especificação EARS
WHEN formulário válido é submetido
THE SYSTEM SHALL salvar, criar prestador e enviar emails — tudo em sequência.

### O que fazer
1. Parsear e validar body com `partnershipRequestSchema`
2. Verificar token Turnstile: `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` com `TURNSTILE_SECRET_KEY`; se inválido: retornar 422
3. Rate limiting: `checkRateLimit` com chave `parceiros:{ip}` — max 3/hora; retornar 429 se excedido
4. Verificar duplicata: buscar `partnership_requests WHERE email = ? AND status IN ('pending','approved')`; se existe: retornar 409
5. Criar prestador em `prestadores` com dados mapeados e `status_parceiro = 'aguardando_aprovacao'`
6. Inserir em `partnership_requests` com `prestador_id` do step anterior
7. Fire-and-forget:
   - Email de boas-vindas para o parceiro: `sendEmail(email, 'partnership_welcome', { nome, ... })`
   - Email de notificação para admin: `sendEmail(ADMIN_EMAIL, 'partnership_admin_alert', { ... })`
8. Retornar `{ success: true, data: { message: 'Solicitação recebida!' } }`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Turnstile inválido retorna 422
- [ ] Rate limit: 4ª submission/hora retorna 429
- [ ] Email duplicado retorna 409
- [ ] Prestador criado com `status_parceiro = 'aguardando_aprovacao'`
- [ ] Emails enviados fire-and-forget (não bloqueiam resposta)
- [ ] `npm run typecheck` sem erros

---

## T4 — Templates de email para parcerias

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `lib/email/templates.ts` (editar — adicionar novos templates)

### O que fazer
1. `partnershipWelcomeTemplate({ nome, tipoNegocio, cidade, siteUrl }): string`:
   - Subject sugerido: "Bem-vindo à rede SOS Pet Amigo!"
   - Agradecimento personalizado com nome
   - Prazo de resposta: 48 horas úteis
   - Próximos passos: aguardar aprovação, completar perfil após aprovação
2. `partnershipAdminAlertTemplate({ nome, email, telefone, tipoNegocio, cidade, mensagem, requestId, adminUrl }): string`:
   - Todos os dados da solicitação formatados
   - Link de aprovação direta: `{adminUrl}/admin/parceiros`
3. `partnershipApprovedTemplate({ nome, siteUrl }): string`:
   - Parabéns + instruções para criar conta e completar perfil
   - CTA: "Completar meu perfil" → `/dashboard-prestador`
4. `partnershipRejectedTemplate({ nome }): string`:
   - Rejeição gentil com possibilidade de entrar em contato

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] 4 templates criados
- [ ] Templates sanitizam `nome` e outros campos (sem injeção HTML)
- [ ] `npm run typecheck` sem erros

---

## T5 — Atualizar formulário `/parcerias` com backend

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/(public)/parcerias/page.tsx`

### O que fazer
1. Converter formulário estático em Client Component com estado controlado
2. Campos do formulário conforme spec (8 campos incluindo checkbox de termos)
3. Integrar `@marsidev/react-turnstile` (ou similar) — verificar se instalado; se não: `npm install @marsidev/react-turnstile`
4. Submit: `POST /api/parceiros` com todos os campos incluindo `turnstile_token`
5. Tratar respostas:
   - 200: mostrar mensagem de sucesso inline, limpar formulário
   - 409: "Já existe uma solicitação com este email. Aguarde nosso contato."
   - 422: exibir erros de campo
   - 429: "Muitas tentativas. Aguarde alguns minutos."
6. Botão de submit: desabilitado durante loading; texto "Enviando..." durante loading

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Formulário tem os 8 campos especificados
- [ ] Turnstile widget renderiza no formulário
- [ ] Erro 409 exibe mensagem específica
- [ ] Sucesso limpa formulário e exibe confirmação
- [ ] `npm run build` sem erros

---

## T6 — Página `/admin/parceiros` com aprovação

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivos:**
- `app/admin/parceiros/page.tsx` (novo)
- `app/api/admin/parceiros/[id]/route.ts` (novo)

### O que fazer
**API `PATCH /api/admin/parceiros/[id]`:**
1. Verificar `role = 'admin'`
2. Aceitar `{ action: 'approve' | 'reject' }`
3. Se approve: UPDATE `partnership_requests.status = 'approved'`; UPDATE `prestadores.status_parceiro = 'ativo'`; enviar email de aprovação
4. Se reject: UPDATE `status = 'rejected'`; enviar email de rejeição

**Página `/admin/parceiros`:**
1. Listar `partnership_requests` com `created_at DESC`, paginação simples
2. Colunas: nome, email, tipo, cidade, status, data, ações
3. Filtro por status (pending/approved/rejected)
4. Botões "Aprovar" / "Rejeitar" inline — chamam API client-side

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Sem role admin: middleware bloqueia acesso (403)
- [ ] "Aprovar" muda status para approved e envia email
- [ ] Prestador associado tem `status_parceiro = 'ativo'` após aprovação
- [ ] `npm run typecheck` sem erros

---

## Ordem de Execução

T1 → T2 → T3 → T4 → T5 → T6

**Dependências:**
- T2 pode ser feito em paralelo com T1
- T3 depende de T1 (tabela) e T2 (schema Zod)
- T4 pode ser feito em paralelo com T3 (apenas templates HTML)
- T5 depende de T3 (chama a API)
- T6 depende de T3 (PATCH usa a tabela)

## Harness Global

```bash
npm run typecheck
npx vitest run parceiros
npm run build
```

