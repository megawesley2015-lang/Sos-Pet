# SESSION-STATE.md — SOS Pet Amigo
# WAL (Write-Ahead Log) de estado da sessão atual
# Atualizar ANTES de qualquer decisão de código ou arquitetura.
# ─────────────────────────────────────────────────────────────
# REGRA /dream: A cada 5 sessões, consolidar este arquivo → MEMORY.md
# Última consolidação: 2026-06-08 (sessão atual)
# ─────────────────────────────────────────────────────────────

## Estado em: 2026-06-08

### Objetivo da sessão
Estruturar o tripé SDD + Harness + Highermind e desbloquear módulo ONG.

### O que foi feito (concluído hoje)

#### SDD / Constituição
- [x] `CLAUDE.md`: cabeçalho Constituição Técnica adicionado (Passo 1)
- [x] `.specify/memory/constitution.md`: constituição técnica formal criada
- [x] `specs/index.md`: registry de módulos + instruções Highermind

#### Specs ONG (Passo 3)
- [x] `specs/ong-module/spec.md`: requisitos EARS completos
- [x] `specs/ong-module/data-model.md`: schema + relacionamentos
- [x] `specs/ong-module/contracts.md`: payloads de API
- [x] `specs/ong-module/tasks.md`: 10 tarefas T1–T10 com harness

#### Harness (Passo 2)
- [x] `.claude/settings.json`: hook PostToolUse adicionado — `tsc --noEmit` após Write/Edit

#### Highermind (Passo 4)
- [x] `CLAUDE.md`: seção HIGHERMIND documentada com instruções de invocação

#### Infra / Migration ONG (T1 + T2)
- [x] `supabase/migrations/001_ong_module.sql`: aplicada no Supabase (6 tabelas criadas)
- [x] `lib/types/database.ts`: regenerado + bloco de aliases customizados adicionado
- [x] TypeScript: 0 erros após regeneração de tipos

#### Bugs corrigidos
- [x] `app/ong/dashboard/page.tsx`: query de follow-ups corrigida
  (filtrava `follow_up_date.lte` em vez de `adoption_date.lte` + `is.null`)

### Bloqueadores ativos
- Nenhum bloqueador crítico

### Módulo ONG — Status das Tasks
| Task | Status |
|------|--------|
| T1 — Migration | ✅ Aplicada |
| T2 — RLS verify | ✅ (migration idempotente com DROP+CREATE policies) |
| T3 — Dashboard | ✅ Código correto (bug corrigido) |
| T4 — Pets | ✅ Código correto |
| T5 — Prontuário | ✅ Código correto |
| T6 — Vacinas | ✅ Código correto |
| T7 — Medicações | ✅ Código correto |
| T8 — Adoções | ✅ Código correto |
| T9 — Follow-up | ✅ Código correto |
| T10 — Tipos TS | ✅ Gerados |

### Próxima sessão — o que fazer primeiro
1. Teste smoke do módulo ONG no browser (`/ong/cadastro` → `/ong/dashboard`)
2. Criar spec para `pet_saude` (tabela ainda sem migration)
3. Rate limiting com Upstash (dívida técnica prioritária do CLAUDE.md)

### Decisões abertas
- `pet_saude`: tabela referenciada no código mas migration não existe ainda
- `prestadores`: colunas `horarios_disponiveis` e `dias_atendimento` no código mas não no DB → migration pendente
- Supabase MCP conectado ao projeto "Soberano de Trading" (não ao SOS Pet) — migrations via Dashboard

---

## Regras WAL (não apagar)
- REGRA 1: Atualizar este arquivo antes de qualquer decisão de arquitetura
- REGRA 2: Se um erro ocorrer 2 vezes → registrar em MEMORY.md
- REGRA 3: Nunca ignorar políticas de RLS em novas tabelas
- REGRA 4: Commits atômicos — não misturar contextos diferentes
- REGRA /dream: A cada 5 sessões → rodar `/dream` para consolidar para MEMORY.md
