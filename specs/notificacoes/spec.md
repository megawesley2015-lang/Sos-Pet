# Spec — Notificações via n8n
# SDD Fase 1: ESPECIFICAR (O QUÊ — sem tecnologia)
# Notação: EARS (Easy Approach to Requirements Syntax)
# Status: ⬜ Pendente
# Slug: notificacoes
# Referências: CLAUDE.md — Agentes planejados (Notificação — Semana 1)
# Responsável: Wes
# Data: 2026-06-10

---

## Contexto de Negócio

Quando um tutor cadastra um pet como perdido na Baixada Santista, voluntários e protetores
da mesma cidade precisam saber imediatamente. Hoje, o cadastro acontece mas ninguém
é avisado — o pet fica invisível até alguém procurar ativamente. O n8n já está configurado
com webhook; o agente de notificação precisa ser ativado. A velocidade de notificação é
crítica: nas primeiras horas, a chance de encontrar o pet é drasticamente maior. O módulo
também notifica o tutor por email quando um match é encontrado (futuro) e quando o status
do pet muda.

## Estado Atual

| Item | Status |
|---|---|
| Webhook n8n configurado (`N8N_ADOPTION_WEBHOOK_URL`) | Existe (adoções ONG) |
| Webhook para pets perdidos | Não existe |
| Agente de notificação n8n | Não implementado |
| Tabela de controle de notificações enviadas | Não existe |
| Trigger Supabase em INSERT em `pets` | Não existe |
| Voluntários cadastrados com interesse por cidade | Não existe (sem tabela) |

## Requisitos — Notação EARS

### 2.1 Registro de Interesse de Voluntários

WHEN um usuário autenticado acessa `/perfil/configuracoes` e ativa "Receber alertas de pets perdidos"
THE SYSTEM SHALL salvar o interesse na tabela `notification_subscriptions` com
`user_id`, `city`, `channel` (whatsapp | email), e `active = true`.

WHEN o usuário desativa os alertas
THE SYSTEM SHALL setar `active = false` em seu registro de `notification_subscriptions`.

IF o usuário não forneceu telefone no perfil e escolhe canal WhatsApp
THEN THE SYSTEM SHALL exibir mensagem "Adicione seu telefone no perfil para receber alertas via WhatsApp" e não salvar.

### 2.2 Disparo de Notificação ao Cadastrar Pet Perdido

WHEN um INSERT na tabela `pets` com `kind = 'lost'` e `status = 'active'` é confirmado
THE SYSTEM SHALL enviar um webhook para o n8n com payload:
`{ pet_id, name, species, city, neighborhood, photo_url, contact_phone, created_at }`.

WHEN o n8n recebe o webhook
THE SYSTEM SHALL buscar voluntários ativos na mesma cidade via Supabase REST.

WHEN existirem voluntários com `channel = 'whatsapp'` na cidade do pet
THE SYSTEM SHALL enviar mensagem WhatsApp com foto, nome, cidade e link `/pets/[id]`.

WHEN existirem voluntários com `channel = 'email'` na cidade do pet
THE SYSTEM SHALL enviar email transacional via Resend com os dados do pet.

IF nenhum voluntário estiver cadastrado na cidade
THE SYSTEM SHALL registrar `status = 'no_recipients'` na tabela `notification_logs`.

### 2.3 Controle de Notificações Enviadas

WHEN uma notificação é enviada com sucesso para um voluntário
THE SYSTEM SHALL inserir em `notification_logs`: `pet_id`, `user_id`, `channel`,
`status = 'sent'`, `sent_at`.

WHEN uma notificação falha (timeout, número inválido, etc.)
THE SYSTEM SHALL inserir em `notification_logs` com `status = 'failed'`, `error_message`.

IF um voluntário já recebeu notificação para o mesmo `pet_id`
THEN THE SYSTEM SHALL não enviar novamente (deduplicação por `pet_id + user_id`).

### 2.4 Notificação ao Tutor sobre Mudança de Status

WHEN o `status` de um pet muda para `'resolved'`
THE SYSTEM SHALL enviar email ao tutor com subject "Seu pet [nome] foi marcado como encontrado!"
e link para `/pets/[id]`.

### 2.5 Rate Limit de Notificações

WHEN um único usuário cadastra mais de 3 pets perdidos em 24 horas
THE SYSTEM SHALL não disparar webhook n8n para os pets excedentes e registrar
`status = 'rate_limited'` em `notification_logs`.

---

## Critérios de Aceitação

- [ ] Tabela `notification_subscriptions` criada com RLS (usuário só vê/edita os próprios)
- [ ] Tabela `notification_logs` criada (somente INSERT via service_role, sem UPDATE/DELETE público)
- [ ] Webhook disparado em até 5 segundos após INSERT em `pets` com `kind = 'lost'`
- [ ] Voluntários da cidade correta recebem WhatsApp/email
- [ ] Segundo cadastro do mesmo `pet_id` para o mesmo voluntário não dispara duplicata
- [ ] Rate limit: 3+ pets perdidos/24h do mesmo usuário não geram notificações extras
- [ ] `notification_logs` registra todos os disparos (sucesso e falha)
- [ ] `npm run typecheck` sem erros após migration e API routes
