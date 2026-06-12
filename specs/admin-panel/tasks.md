# Tasks — Painel de Moderação Admin
# SDD Fase 3: DECOMPOR
# Status geral: ✅ Concluído — 2026-06-12
# Referências: spec.md

---

## T1 — Migration SQL: role em profiles, tabelas reports e admin_actions

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `supabase/migrations/20260610_admin_panel.sql` (novo)

### O que fazer
1. `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('user','admin','moderator','banned')) DEFAULT 'user'`
2. Criar `reports`:
   - `id UUID PK DEFAULT gen_random_uuid()`
   - `reporter_id UUID → auth.users(id) ON DELETE SET NULL`
   - `target_type TEXT CHECK IN ('pet','sighting') NOT NULL`
   - `target_id UUID NOT NULL`
   - `reason TEXT CHECK IN ('spam','inappropriate_photo','wrong_info','other') NOT NULL`
   - `status TEXT CHECK IN ('pending','reviewed','dismissed') DEFAULT 'pending'`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
   - UNIQUE constraint em `(reporter_id, target_type, target_id)` — uma denúncia por usuário por item
3. Criar `admin_actions`:
   - `id UUID PK DEFAULT gen_random_uuid()`
   - `admin_id UUID → auth.users(id) NOT NULL`
   - `action_type TEXT CHECK IN ('remove_pet','restore_pet','ban_user','dismiss_report','approve_content') NOT NULL`
   - `target_id UUID NOT NULL`
   - `reason TEXT`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
4. ENABLE ROW LEVEL SECURITY em `reports` e `admin_actions`
5. RLS:
   - `reports`: INSERT autenticado; SELECT para o reporter ou admins; UPDATE apenas admin/moderator
   - `admin_actions`: INSERT/SELECT apenas `role IN ('admin','moderator')` via function check
6. Índices: `(target_type, target_id)` em reports; `(status)` em reports; `(admin_id)` em admin_actions

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] Migration idempotente
- [ ] UNIQUE em `(reporter_id, target_type, target_id)` impede denúncias duplicadas
- [ ] `role DEFAULT 'user'` — usuários existentes ganham 'user'
- [ ] RLS em admin_actions impede usuários comuns de inserir

---

## T2 — Middleware de proteção das rotas `/admin/*`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — guard implementado em app/admin/layout.tsx (Server Component)
**Arquivo:** `middleware.ts` (criar ou editar existente)

### Especificação EARS
WHEN qualquer usuário acessa `/admin/*`
THE SYSTEM SHALL verificar `profiles.role = 'admin'` ou retornar 403.

### O que fazer
1. No `middleware.ts`, adicionar matcher para `/admin/:path*`
2. Verificar sessão Supabase via `@supabase/ssr`
3. Se não autenticado: redirecionar para `/login?next=/admin`
4. Se autenticado: buscar `profiles.role` do `auth.uid()`
5. Se `role !== 'admin' && role !== 'moderator'`: retornar `NextResponse.redirect('/403')`
6. Criar página `app/403/page.tsx` com mensagem "Acesso restrito" e link para home
7. Garantir que o middleware não quebra rotas existentes fora de `/admin/*`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Usuário sem `role = 'admin'` é redirecionado para `/403`
- [ ] Usuário não logado é redirecionado para `/login`
- [ ] Usuário com `role = 'admin'` acessa `/admin` normalmente
- [ ] Rotas fora de `/admin/*` não são afetadas
- [ ] `npm run typecheck` sem erros

---

## T3 — API Routes de moderação

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivos:**
- `app/api/admin/pets/[id]/route.ts` (novo)
- `app/api/admin/users/[id]/ban/route.ts` (novo)
- `app/api/reports/route.ts` (novo)
- `app/api/reports/[id]/route.ts` (novo)

### O que fazer
**`/api/admin/pets/[id]`:**
1. `PATCH`: verificar `role = 'admin' | 'moderator'`; aceitar `{ action: 'remove' | 'restore', reason? }`
2. Se `action = 'remove'`: UPDATE `pets.status = 'removed'`; INSERT em `admin_actions`
3. Se `action = 'restore'`: UPDATE `pets.status = 'active'`; INSERT em `admin_actions`

**`/api/admin/users/[id]/ban`:**
1. `POST`: verificar `role = 'admin'` (moderator não pode banir)
2. Verificar que o target não é admin — retornar 403 "Não é possível banir um administrador"
3. UPDATE `profiles.role = 'banned'`; INSERT em `admin_actions`

**`/api/reports`:**
1. `POST`: verificar autenticação; validar body com Zod; inserir em `reports`
2. Após INSERT, verificar total de reports com `status = 'pending'` para o `target_id`
3. Se `count >= 3`: auto-hide (UPDATE pets/sightings SET status = 'hidden')

**`/api/reports/[id]`:**
1. `PATCH`: apenas admin/moderator; aceitar `{ action: 'approve' | 'dismiss' }`
2. Se approve: descartar todos os reports do target; resetar `report_count`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] `PATCH /api/admin/pets/[id]` sem role admin retorna 403
- [ ] Banir admin retorna 403
- [ ] 3 reports do mesmo target ativam auto-hide
- [ ] `npm run typecheck` sem erros

---

## T4 — Dashboard de métricas `/admin`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — app/admin/page.tsx existente
**Arquivo:** `app/admin/page.tsx`

### O que fazer
1. Server Component — todas as queries via Supabase server client
2. Queries paralelas com `Promise.all`:
   - `SELECT COUNT(*) FROM pets WHERE status = 'active'`
   - `SELECT COUNT(*) FROM pets WHERE status = 'resolved'`
   - `SELECT COUNT(*) FROM pets WHERE status = 'removed'`
   - `SELECT COUNT(*) FROM pets WHERE kind = 'lost' AND created_at >= NOW() - INTERVAL '30 days'`
   - `SELECT COUNT(*) FROM profiles WHERE role != 'banned'`
   - `SELECT COUNT(*) FROM prestadores`
   - Pets com > 30 dias sem resolução: `WHERE kind = 'lost' AND status = 'active' AND created_at < NOW() - INTERVAL '30 days'`
3. Layout com cards de métricas usando tokens do design system
4. Tabela "Top 10 pets perdidos sem resolução" com link para `/admin/pets?filter=old`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] 6 métricas de overview exibidas
- [ ] Queries rodam em paralelo (Promise.all)
- [ ] Lista dos 10 pets mais antigos sem resolução
- [ ] `npm run typecheck` sem erros

---

## T5 — Página `/admin/pets` com listagem e ações

**Fase SDD:** Implementar
**Status:** ✅ Concluído — app/admin/pets/page.tsx + actions.ts existentes
**Arquivo:** `app/admin/pets/page.tsx`

### O que fazer
1. Listar todos os pets com: id (truncado), nome, espécie, tutor email, cidade, status, report_count, data
2. Filtros via query params: `?status=removed`, `?filter=reported` (report_count >= 1)
3. Paginação simples por offset (admin usa, não é crítico ser cursor-based)
4. Botões inline "Remover" / "Restaurar" — chamam API via fetch client
5. Link "Ver denúncias" se `report_count > 0`
6. Botão "Banir tutor" → chamar `/api/admin/users/[user_id]/ban`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Listagem exibe `report_count` para cada pet
- [ ] Filtro `?filter=reported` mostra apenas pets denunciados
- [ ] Remover pet muda status na UI sem reload completo
- [ ] `npm run typecheck` sem erros

---

## T6 — Botão de denúncia nos cards de pets e avistamentos

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `components/ui/ReportButton.tsx` (novo)

### O que fazer
1. Componente Client Component: `<ReportButton targetType="pet" targetId={id} />`
2. Ao clicar: abrir modal com select de `reason` (Spam / Foto imprópria / Informação errada / Outro)
3. Submit: `POST /api/reports` com `{ target_type, target_id, reason }`
4. Após sucesso: desabilitar botão e mostrar "Denunciado ✓"
5. Usuário não logado: redirecionar para `/login?next=...`
6. Adicionar `<ReportButton>` em `PetCard.tsx` (visível apenas para usuários logados)

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Modal de denúncia abre ao clicar no botão
- [ ] Após denunciar, botão fica desabilitado com feedback visual
- [ ] Não logado redireciona para login
- [ ] `npm run typecheck` sem erros

---

## Ordem de Execução

T1 → T2 → T3 → T4 → T5 → T6

**Dependências:**
- T2 depende de T1 (campo role em profiles)
- T3 depende de T1 (tabelas reports, admin_actions)
- T4 e T5 dependem de T2 (middleware protege as páginas)
- T6 depende de T3 (API de reports)

## Harness Global

```bash
npm run typecheck
npm run build
```
