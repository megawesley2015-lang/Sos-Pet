# Spec — Matching Automatizado por IA
# SDD Fase 1: ESPECIFICAR (O QUÊ — sem tecnologia)
# Notação: EARS (Easy Approach to Requirements Syntax)
# Status: ⬜ Pendente
# Slug: matching-ia
# Referências: CLAUDE.md — Agentes planejados (Matching — Mês 3)
# Responsável: Wes
# Data: 2026-06-10

---

## Contexto de Negócio

Diariamente, pets perdidos e pets encontrados são cadastrados na plataforma. Um tutor que
perdeu um Labrador amarelo em Santos pode não saber que outro usuário encontrou um
Labrador amarelo na mesma semana a 2km de distância. O matching automatizado cruza
essas informações e notifica ambas as partes quando há compatibilidade. O processo roda
como CRON diário para não sobrecarregar o Supabase em tempo real. Resultados são salvos
na tabela `pet_matches` com score de confiança para priorização.

## Estado Atual

| Item | Status |
|---|---|
| Tabela `pet_matches` | Não existe |
| Algoritmo de matching | Não existe |
| CRON job no n8n | Não existe |
| Notificação de match ao tutor | Não existe |
| Campos de coordenadas em `pets` (`latitude`, `longitude`) | Existem |

## Requisitos — Notação EARS

### 2.1 Tabela de Matches

WHEN o sistema realiza a migration de matching-ia
THE SYSTEM SHALL criar a tabela `pet_matches` com:
`id`, `lost_pet_id`, `found_pet_id`, `confidence_score` (0.0–1.0), `status`
(`pending` | `confirmed` | `dismissed`), `matched_by` (`system` | `user`),
`created_at`, `updated_at`.

THE SYSTEM SHALL criar índice único em `(lost_pet_id, found_pet_id)` para evitar
matches duplicados.

### 2.2 Critérios de Score de Matching

WHEN o sistema calcula o score de compatibilidade entre dois pets
THE SYSTEM SHALL somar pontos conforme:
- `species` igual: +40 pontos (obrigatório — matches cross-species são ignorados)
- `city` igual: +30 pontos
- `color` similar (fuzzy): +15 pontos
- `breed` similar (fuzzy): +10 pontos
- distância < 5km (lat/long): +5 pontos extras
- `created_at` do found dentro de 30 dias do lost: +0 (sem penalidade além de 30 dias)

THE SYSTEM SHALL descartar pares com score < 55 (menos de 55 pontos de 100).

THE SYSTEM SHALL normalizar o score para `confidence_score` entre 0.0 e 1.0
dividindo por 100.

### 2.3 Execução do CRON

WHEN o CRON diário executa (00:00 BRT)
THE SYSTEM SHALL buscar todos os pets com `kind = 'lost'` e `status = 'active'`
cadastrados nos últimos 60 dias.

THE SYSTEM SHALL cruzar cada pet perdido com todos os pets `kind = 'found'`
e `status = 'active'` da mesma `city`.

IF um par `(lost_pet_id, found_pet_id)` já existe em `pet_matches`
THEN THE SYSTEM SHALL pular esse par (sem duplicar).

WHEN um novo match com `confidence_score >= 0.55` é encontrado
THE SYSTEM SHALL inserir em `pet_matches` com `status = 'pending'`.

WHEN a execução do CRON termina
THE SYSTEM SHALL registrar em `notification_logs`: quantos matches foram criados,
quantos pares foram avaliados, duração em ms.

### 2.4 Notificação de Novo Match

WHEN um novo match com `confidence_score >= 0.70` é inserido em `pet_matches`
THE SYSTEM SHALL enviar email ao tutor do pet perdido via Resend com:
- Nome do pet perdido
- Foto e dados do pet encontrado
- Link para `/pets/[found_pet_id]`
- Link para confirmar (`/matches/[id]/confirmar`) ou descartar (`/matches/[id]/descartar`)

WHEN um match com `confidence_score >= 0.85` é inserido
THE SYSTEM SHALL também enviar WhatsApp (se telefone cadastrado).

### 2.5 Confirmação / Descarte pelo Usuário

WHEN o tutor acessa `/matches/[id]/confirmar`
THE SYSTEM SHALL verificar que o `lost_pet_id` pertence ao usuário logado.
THE SYSTEM SHALL atualizar `status = 'confirmed'` e `matched_by = 'user'`.
THE SYSTEM SHALL notificar o usuário que cadastrou o pet encontrado.

WHEN o tutor acessa `/matches/[id]/descartar`
THE SYSTEM SHALL atualizar `status = 'dismissed'`.

IF o pet já está com `status = 'resolved'`
THEN THE SYSTEM SHALL retornar 410 com mensagem "Este pet já foi marcado como encontrado".

---

## Critérios de Aceitação

- [ ] Tabela `pet_matches` criada com índice único `(lost_pet_id, found_pet_id)`
- [ ] Score calculado corretamente: Labrador amarelo Santos vs Labrador amarelo Santos = 95 pontos
- [ ] Pares com score < 55 não são inseridos
- [ ] CRON não cria duplicatas (pares já existentes são pulados)
- [ ] Email enviado para matches >= 0.70
- [ ] WhatsApp enviado para matches >= 0.85 (se telefone disponível)
- [ ] `/matches/[id]/confirmar` retorna 403 se pet não pertence ao usuário logado
- [ ] Matches com espécies diferentes não são criados
- [ ] `npm run typecheck` sem erros
