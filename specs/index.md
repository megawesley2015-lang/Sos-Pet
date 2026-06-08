# Specs Registry — SOS Pet Amigo
# Highermind entry point: /sos-pet-orchestrator-v2 spec=specs/<module>/tasks.md
# ─────────────────────────────────────────────────────────────────────────────

## Módulos com Spec Completa

| Módulo | Spec | Tasks | Status |
|--------|------|-------|--------|
| ONG / Abrigos | [spec.md](ong-module/spec.md) | [tasks.md](ong-module/tasks.md) | ⚠️ T1+T10 feitos · T3–T9 aguardam teste |

## Como Invocar o Highermind

```
/sos-pet-orchestrator-v2 spec=specs/ong-module/tasks.md
```

O orquestrador vai:
1. Ler o `tasks.md` e identificar tarefas pendentes
2. Executar a tarefa seguindo o pipeline EARS (Specify → Plan → Decompose → Implement)
3. Rodar o harness (`npm run typecheck && npm run build`) como gate de saída
4. Marcar a tarefa como concluída no `tasks.md`

## Módulos Planejados (sem spec ainda)

| Módulo | Prioridade | Referência |
|--------|-----------|------------|
| Rate Limiting (Upstash) | Alta | CLAUDE.md — Dívidas Técnicas |
| pet_saude (histórico de saúde) | Média | `PetSaudeRow` em `lib/types/database.ts` |
| Notificações n8n | Média | CLAUDE.md — Agentes planejados |
| Matching IA | Baixa | CLAUDE.md — Mês 3 |

## Harness Global

```bash
npm run typecheck   # gate obrigatório após qualquer Edit/Write
npm run build       # gate obrigatório pré-commit
npx vitest run      # gate de testes (quando existirem)
```

## Constituição

Arquivo: `.specify/memory/constitution.md`
CLAUDE.md é a lei máxima — specs não podem contradizê-la.
