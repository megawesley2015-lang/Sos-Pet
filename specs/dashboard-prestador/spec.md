# Spec — Dashboard do Prestador de Serviço
# SDD Fase 1: ESPECIFICAR (O QUÊ — sem tecnologia)
# Notação: EARS (Easy Approach to Requirements Syntax)
# Status: ⬜ Pendente
# Slug: dashboard-prestador
# Responsável: Wes
# Data: 2026-06-10

---

## Contexto de Negócio

Prestadores de serviço (clínicas, pet shops, banho e tosa) pagam pela visibilidade premium
na plataforma. Para justificar a assinatura, precisam de um dashboard que mostre métricas
de visualização do perfil, quantos usuários clicaram no WhatsApp, e que permita editar
o perfil diretamente. Hoje a rota `/dashboard-prestador` existe mas está sem implementação.
O modelo de monetização B2B depende diretamente dessa feature — sem dashboard, prestadores
não têm motivo para pagar. A tabela `prestadores` existe com campos de avaliação e
`emergencia_24h`.

## Estado Atual

| Item | Status |
|---|---|
| Rota `/dashboard-prestador` | Existe (sem implementação) |
| Tabela `prestadores` | Existe |
| Campos de métricas em `prestadores` | Não existem (`view_count`, `whatsapp_clicks`) |
| RPC `incrementar_clique_whatsapp` | Referenciada em CLAUDE.md como pendente de regeneração |
| Edição de perfil de prestador | Não existe |
| Upload de fotos do estabelecimento | Não existe |

## Requisitos — Notação EARS

### 2.1 Métricas de Visualização

WHEN um visitante acessa `/prestadores/[slug]`
THE SYSTEM SHALL incrementar `view_count` na tabela `prestadores` via RPC Supabase,
sem bloquear a renderização da página.

WHEN um visitante clica em "WhatsApp" no perfil do prestador
THE SYSTEM SHALL incrementar `whatsapp_clicks` via `POST /api/prestadores/[id]/click`.

THE SYSTEM SHALL registrar cada clique em `prestador_events` com `event_type`,
`prestador_id`, `timestamp`, `city` (sem IP ou dados pessoais).

### 2.2 Dashboard de Métricas

WHEN um prestador autenticado acessa `/dashboard-prestador`
THE SYSTEM SHALL verificar que o usuário tem um registro em `prestadores` com
`user_id = auth.uid()`.

IF o usuário não tiver `prestadores` associado
THEN THE SYSTEM SHALL exibir CTA "Cadastre-se como prestador" e link para o formulário.

WHEN o dashboard carrega
THE SYSTEM SHALL exibir:
- Total de visualizações do perfil (últimos 30 dias e total)
- Total de cliques no WhatsApp (últimos 30 dias e total)
- Taxa de conversão (cliques / visualizações × 100)
- Gráfico simples de visualizações por dia dos últimos 7 dias (barras)

### 2.3 Edição de Perfil do Prestador

WHEN o prestador clica em "Editar perfil" no dashboard
THE SYSTEM SHALL exibir formulário com campos editáveis: `nome`, `categoria`,
`descricao`, `telefone`, `endereco`, `cidade`, `emergencia_24h`.

WHEN o prestador submete o formulário com dados válidos
THE SYSTEM SHALL atualizar o registro em `prestadores` via `PATCH /api/prestadores/[id]`,
verificando que `user_id = auth.uid()`.

IF `nome` estiver vazio ou `categoria` não estiver na lista permitida
THEN THE SYSTEM SHALL retornar erro 422 com campo específico inválido.

WHEN o prestador altera `emergencia_24h`
THE SYSTEM SHALL refletir o badge "24h" no perfil público imediatamente após o save.

### 2.4 Fotos do Estabelecimento

WHEN o prestador clica em "Adicionar foto"
THE SYSTEM SHALL permitir upload de até 5 fotos no bucket `establishment-images`
com path `{prestador_id}/{filename}`.

WHEN as fotos são salvas
THE SYSTEM SHALL armazenar as URLs em `prestadores.photos` (JSONB array).

IF o arquivo não for imagem (JPEG, PNG, WebP) ou exceder 5MB
THEN THE SYSTEM SHALL rejeitar o upload com mensagem clara.

WHEN o prestador remove uma foto
THE SYSTEM SHALL deletar do Storage e atualizar o array `photos`.

### 2.5 Status de Emergência 24h

WHEN o prestador ativa `emergencia_24h` no dashboard
THE SYSTEM SHALL atualizar o campo imediatamente e exibir confirmação.

WHEN o prestador está marcado como `emergencia_24h = true`
THE SYSTEM SHALL exibir o badge de destaque no card e no perfil público.

---

## Critérios de Aceitação

- [ ] `view_count` incrementa a cada visita em `/prestadores/[slug]` (sem bloquear render)
- [ ] `whatsapp_clicks` incrementa ao clicar no botão WhatsApp
- [ ] Dashboard exibe métricas de 30 dias e total
- [ ] Taxa de conversão calculada corretamente
- [ ] Formulário de edição valida `nome` e `categoria`
- [ ] PATCH de perfil verifica `user_id = auth.uid()` (403 se não for o dono)
- [ ] Upload de foto > 5MB é rejeitado
- [ ] Máximo 5 fotos por prestador
- [ ] `emergencia_24h` reflete no perfil público sem cache
- [ ] `npm run typecheck` sem erros
