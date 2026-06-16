# Multi-Spec Orchestrador — SOS Pet Aumigo
# Equivalente ao padrão .specs/ do vídeo — processa todas as specs pendentes
# com um sub-agente `dev` isolado por spec, sequencialmente.
# ─────────────────────────────────────────────────────────────────────────────
# INVOCAR: /multi-orchestrador
# INVOCAR COM FILTRO: /multi-orchestrador priority=1
# INVOCAR SPEC ÚNICA: /multi-orchestrador spec=rate-limiting-completo
# ─────────────────────────────────────────────────────────────────────────────

## O que este skill faz

1. Lê todos os arquivos em `.specs/*.md`
2. Filtra os que têm `status: pending`
3. Ordena por `priority` (1 = mais urgente)
4. Para cada spec pendente, aciona o agente `dev` em contexto isolado
5. Aguarda o gate `npm run typecheck && npm run build` passar
6. Apresenta relatório final com o que foi concluído e o que ficou bloqueado

## Pipeline de execução

```
PARA CADA spec com status: pending (ordenada por priority):
  1. Acionar agente `dev` com:
     - Caminho da spec: .specs/<nome>.md
     - Instrução: "Implemente esta spec do SOS Pet seguindo o pipeline do agente dev"
  2. O agente `dev` opera com contexto limpo (sem histórico desta sessão)
  3. Ao finalizar, o agente `dev` atualiza o frontmatter: status: done
  4. Gate: verificar se typecheck e build passam
  5. Se gate falhar: marcar como status: blocked + continuar para próxima spec
  6. Registrar resultado no relatório
```

## Formato de relatório final

```
═══════════════════════════════════════════════════
MULTI-ORCHESTRADOR — RELATÓRIO FINAL
SOS Pet Aumigo | [data]
═══════════════════════════════════════════════════

✅ CONCLUÍDAS ([N] specs):
  - [nome]: [resumo do que foi feito]

⚠️  BLOQUEADAS ([N] specs):
  - [nome]: [motivo do bloqueio]

🔲 PULADAS ([N] specs):
  - [nome]: [motivo — ex: depende de X]

Gate final: [typecheck ✅/❌] | [build ✅/❌]

Próximos passos:
  1. [ação manual necessária, ex: aplicar migration no Supabase]
  2. ...
═══════════════════════════════════════════════════
```

## Como usar

### Rodar todas as specs pendentes
```
/multi-orchestrador
```

### Rodar só as de prioridade 1
```
/multi-orchestrador priority=1
```

### Rodar uma spec específica
```
/multi-orchestrador spec=rate-limiting-completo
```

### Adicionar nova spec ao backlog
```
Criar arquivo .specs/<nome>.md com frontmatter:
---
name: <nome>
status: pending
priority: <1|2|3>
depends_on: [<outros nomes, ou vazio>]
---
```

## Specs disponíveis

| Arquivo | Priority | Status | Descrição |
|---------|----------|--------|-----------|
| `rate-limiting-completo.md` | 1 | pending | Completar rate limiting nas rotas descobertas |
| `onboarding-tutor.md` | 2 | pending | Fluxo pós-registro com 3 passos |
| `pwa-push.md` | 2 | pending | PWA + notificações push no browser |
| `busca-foto.md` | 2 | pending | Busca visual de pets por foto (Claude Vision) |
| `avaliacoes-prestadores.md` | 2 | pending | Sistema de reviews/rating para prestadores |
| `mapa-calor.md` | 3 | pending | Heatmap de pets perdidos por bairro |
| `lgpd-painel.md` | 3 | pending | Painel LGPD — export + exclusão de conta |

## Relação com specs/

- `.specs/` → specs **leves**, novas features, formato conciso (esta pasta)
- `specs/` → specs **pesadas** com notação EARS completa (módulos grandes já implementados)
- O `sos-pet-orchestrator-v2` continua sendo usado para specs EARS individuais
- O `multi-orchestrador` é para rodar **todas as specs leves de uma vez**
