# SESSION-STATE.md — SOS Pet Amigo
# WAL (Write-Ahead Log) de estado da sessão atual
# Atualizar ANTES de qualquer decisão de código ou arquitetura.
# ─────────────────────────────────────────────────────────────

## Estado em: 2026-06-01

### Objetivo da sessão atual
Implementar e corrigir features da home seguindo a sequência:
Fix CSS → Fix Deployment Protection → Hall de Reencontros → Parceiros → B2B

### O que foi feito (concluído hoje)
- [x] AGENTS.md reescrito como harness real (mapa de contexto para agentes)
- [x] `.claude/specs/` criada com specs SDD por feature
- [x] HallRreencontros: schema corrigido + mocks de 4 histórias + posição após Hero
- [x] HallRreencontros.server.tsx: fallback gracioso quando Supabase pausado
- [x] HeroSection.server.tsx: colunas corrigidas (nome→name, especie→species, kind)
- [x] Migration `20260601_parceiros_display.sql`: colunas de exibição na tabela parceiros
- [x] FaixaParceiros: componente pronto, posição correta (antes do FinalCTA)
- [x] Módulo ONG: spec SDD completa + harness n8n de follow-up
- [x] QMD: docs/sos-pet-status.qmd gerado
- [x] next.config.ts: Unsplash adicionado ao remotePatterns

### Bloqueadores ativos
1. **Supabase pausado** (`odrybnjjpdxqjofgewam`) → BLOQUEIO TOTAL de autenticação
   - Fix: Restore no dashboard Supabase → projeto fica ativo em ~2min
   - URL: https://supabase.com/dashboard/project/odrybnjjpdxqjofgewam

2. **Migrations pendentes** (rodar no SQL Editor após restaurar Supabase):
   - `supabase/migrations/001_ong_module.sql` — módulo ONG (bloqueador do módulo)
   - `supabase/migrations/20260601_parceiros_display.sql` — colunas de exibição de parceiros

### Próxima sessão — o que fazer primeiro
1. Restaurar Supabase → confirmar que `/login` funciona
2. Rodar as 2 migrations pendentes
3. Smoke test do módulo ONG (TASK-ONG-01)
4. Fix do bug de visibilidade do CTA final (botões `bg-brand-500` no Tailwind v3)

### Decisões abertas
- **Parceiros fundadores**: 5 parceiros offline → Admin adiciona via SQL
  (script na migration `20260601_parceiros_display.sql`)
- **FaixaParceiros**: já integrada, retorna null enquanto não há parceiros ativos
- **B2B landing `/parceiros`**: existe, aguarda 1 parceiro fechado offline para ativar

---

## Regras WAL (não apagar)
- REGRA 1: Atualizar este arquivo antes de qualquer decisão de arquitetura
- REGRA 2: Se um erro ocorrer 2 vezes → registrar em `learnings.md`
- REGRA 3: Nunca ignorar políticas de RLS em novas tabelas
- REGRA 4: Commits atômicos — não misturar contextos diferentes
