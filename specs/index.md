# Specs Registry — SOS Pet Amigo
# Highermind entry point: /sos-pet-orchestrator-v2 spec=specs/<module>/tasks.md
# ─────────────────────────────────────────────────────────────────────────────

## Módulos com Spec Completa

| Módulo | Slug | Spec | Tasks | Status |
|--------|------|------|-------|--------|
| ONG / Abrigos | ong-module | [spec.md](ong-module/spec.md) | [tasks.md](ong-module/tasks.md) | ✅ T1–T10 concluídos · 66/66 testes |
| Rate Limiting | rate-limiting | [spec.md](rate-limiting/spec.md) | [tasks.md](rate-limiting/tasks.md) | ✅ T1–T6 concluídos |
| Paginação Cursor-Based | paginacao | [spec.md](paginacao/spec.md) | [tasks.md](paginacao/tasks.md) | ⬜ T1–T6 pendentes |
| Histórico de Saúde do Pet | pet-saude | [spec.md](pet-saude/spec.md) | [tasks.md](pet-saude/tasks.md) | ✅ T1–T6 concluídos |
| Notificações via n8n | notificacoes | [spec.md](notificacoes/spec.md) | [tasks.md](notificacoes/tasks.md) | ✅ T1–T6 concluídos |
| Matching Automatizado por IA | matching-ia | [spec.md](matching-ia/spec.md) | [tasks.md](matching-ia/tasks.md) | ⬜ T1–T5 pendentes |
| Avistamentos (Sightings) | avistamentos | [spec.md](avistamentos/spec.md) | [tasks.md](avistamentos/tasks.md) | ✅ T1–T6 concluídos |
| Loja Printful + Mercado Pago | loja-printful | [spec.md](loja-printful/spec.md) | [tasks.md](loja-printful/tasks.md) | ✅ T1–T6 concluídos |
| Dashboard do Prestador | dashboard-prestador | [spec.md](dashboard-prestador/spec.md) | [tasks.md](dashboard-prestador/tasks.md) | ✅ T1–T6 concluídos |
| Busca Avançada Geoespacial | busca-avancada | [spec.md](busca-avancada/spec.md) | [tasks.md](busca-avancada/tasks.md) | ✅ T1–T6 concluídos |
| Plaquinha QR Code | plaquinha-qr | [spec.md](plaquinha-qr/spec.md) | [tasks.md](plaquinha-qr/tasks.md) | ✅ T1–T5 concluídos |
| Painel de Moderação Admin | admin-panel | [spec.md](admin-panel/spec.md) | [tasks.md](admin-panel/tasks.md) | ✅ T1–T6 concluídos |
| SEO Dinâmico com ISR | seo-dinamico | [spec.md](seo-dinamico/spec.md) | [tasks.md](seo-dinamico/tasks.md) | ⬜ T1–T5 pendentes |
| Email Transacional (Resend) | email-sistema | [spec.md](email-sistema/spec.md) | [tasks.md](email-sistema/tasks.md) | ✅ T1–T6 concluídos |
| Analytics (GA4 + Sentry) | analytics | [spec.md](analytics/spec.md) | [tasks.md](analytics/tasks.md) | ⬜ T1–T6 pendentes |
| Parcerias B2B | parceiros | [spec.md](parceiros/spec.md) | [tasks.md](parceiros/tasks.md) | ✅ T1–T6 concluídos |

## Como Invocar o Highermind

```
/sos-pet-orchestrator-v2 spec=specs/<slug>/tasks.md
```

Exemplos:
```
/sos-pet-orchestrator-v2 spec=specs/paginacao/tasks.md
/sos-pet-orchestrator-v2 spec=specs/pet-saude/tasks.md
/sos-pet-orchestrator-v2 spec=specs/avistamentos/tasks.md
```

O orquestrador vai:
1. Ler o `tasks.md` e identificar tarefas pendentes
2. Executar a tarefa seguindo o pipeline EARS (Specify → Plan → Decompose → Implement)
3. Rodar o harness (`npm run typecheck && npm run build`) como gate de saída
4. Marcar a tarefa como concluída no `tasks.md`

## Prioridade de Implementação Sugerida

### Tier 1 — Fundação (implementar primeiro — outras specs dependem)
| Módulo | Motivo |
|--------|--------|
| `paginacao` | Correção de performance urgente — browser trava com muitos pets |
| `admin-panel` | Bug de segurança ativo — rotas `/admin` sem proteção de role |
| `email-sistema` | Infraestrutura compartilhada por notificacoes, matching-ia, parceiros |

### Tier 2 — Core Features
| Módulo | Motivo |
|--------|--------|
| `avistamentos` | Rotas já existem sem backend |
| `busca-avancada` | Alto impacto em encontrar pets |
| `notificacoes` | Alerta em tempo real aumenta taxa de reencontro |
| `parceiros` | Formulário `/parcerias` sem backend — perda de leads B2B |

### Tier 3 — Monetização e Engajamento
| Módulo | Motivo |
|--------|--------|
| `loja-printful` | Receita direta |
| `dashboard-prestador` | Retenção B2B |
| `plaquinha-qr` | Produto físico central |
| `pet-saude` | Retenção de tutores |

### Tier 4 — Growth e IA
| Módulo | Motivo |
|--------|--------|
| `seo-dinamico` | Aquisição orgânica (Google) |
| `analytics` | Dados para decisões de produto |
| `matching-ia` | Diferencial competitivo |

## Dependências entre Módulos

```
email-sistema ← notificacoes
email-sistema ← matching-ia
email-sistema ← parceiros
admin-panel ← parceiros (rota /admin/parceiros)
loja-printful ← plaquinha-qr (checkout da plaquinha)
matching-ia ← email-sistema (notificação de match)
paginacao ← busca-avancada (reset de cursor ao filtrar)
```

## Harness Global

```bash
npm run typecheck   # gate obrigatório após qualquer Edit/Write (hook PostToolUse ativo)
npm run build       # gate obrigatório pré-commit
npx vitest run      # gate de testes (quando existirem para o módulo)
```

## Constituição

Arquivo: `CLAUDE.md` (raiz do projeto)
CLAUDE.md é a lei máxima — specs não podem contradizê-la.
