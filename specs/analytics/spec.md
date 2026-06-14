# Spec — Analytics (GA4 + Sentry)
# SDD Fase 1: ESPECIFICAR (O QUÊ — sem tecnologia)
# Notação: EARS (Easy Approach to Requirements Syntax)
# Status: ⬜ Pendente
# Slug: analytics
# Responsável: Wes
# Data: 2026-06-10

---

## Contexto de Negócio

Sem analytics, é impossível saber quais cidades têm mais pets perdidos, quais espécies
são mais buscadas, ou em qual etapa do cadastro os usuários abandonam. O GA4 fornece
comportamento do usuário e eventos de negócio; o Sentry captura erros em produção antes
que os usuários reclamem. As variáveis `NEXT_PUBLIC_GA_MEASUREMENT_ID` e
`NEXT_PUBLIC_SENTRY_DSN` já estão configuradas mas nenhum SDK está integrado.
Implementação mínima com eventos de negócio relevantes (não apenas pageview genérico).

## Estado Atual

| Item | Status |
|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Configurado |
| `NEXT_PUBLIC_SENTRY_DSN` | Configurado |
| SDK Google Analytics 4 | Não instalado |
| SDK Sentry | Não instalado |
| Eventos customizados de negócio | Nenhum |
| Source maps no Sentry | Não configurado |

## Requisitos — Notação EARS

### 2.1 Google Analytics 4 — Pageviews

WHEN qualquer página do app é carregada no browser
THE SYSTEM SHALL enviar pageview para GA4 com `page_title` e `page_path`.

WHEN o usuário navega entre páginas (SPA navigation no App Router)
THE SYSTEM SHALL enviar novo evento `page_view` para cada mudança de rota.

THE SYSTEM SHALL inicializar o GA4 apenas no client-side (`'use client'`) para não
bloquear SSR.

IF `NEXT_PUBLIC_GA_MEASUREMENT_ID` não estiver configurado
THE SYSTEM SHALL pular a inicialização silenciosamente (sem erro no console).

### 2.2 Eventos de Negócio GA4

WHEN um pet é cadastrado com sucesso
THE SYSTEM SHALL enviar evento `pet_registered` com parâmetros: `species`, `kind`
(lost/found), `city`.

WHEN um usuário visualiza o contato de um pet em `/pets/[id]`
THE SYSTEM SHALL enviar evento `contact_viewed` com parâmetros: `pet_id`, `species`,
`kind`, `city`.

WHEN um usuário clica no botão de WhatsApp de um prestador
THE SYSTEM SHALL enviar evento `provider_contact` com parâmetros: `provider_id`,
`category`, `city`.

WHEN um usuário inicia o checkout da loja
THE SYSTEM SHALL enviar evento `begin_checkout` com `value` (total em BRL) e
`currency = 'BRL'`.

WHEN um pagamento é confirmado
THE SYSTEM SHALL enviar evento `purchase` com `transaction_id`, `value`, `currency`.

### 2.3 Sentry — Error Tracking

WHEN uma exceção não capturada ocorre no browser
THE SYSTEM SHALL capturar e enviar ao Sentry com contexto de usuário (sem PII —
apenas `user.id` hash).

WHEN uma API Route retorna status 5xx
THE SYSTEM SHALL capturar o erro no Sentry com o stack trace completo.

WHEN o Sentry é inicializado
THE SYSTEM SHALL configurar `tracesSampleRate: 0.1` (10% de sampling em produção)
para não exceder cota.

THE SYSTEM SHALL configurar `environment` como `production` ou `development` baseado
em `NODE_ENV`.

IF `NEXT_PUBLIC_SENTRY_DSN` não estiver configurado
THE SYSTEM SHALL pular a inicialização silenciosamente.

### 2.4 LGPD — Consentimento de Analytics

WHEN um visitante acessa a plataforma pela primeira vez
THE SYSTEM SHALL exibir banner de consentimento de cookies com opções "Aceitar" e
"Recusar".

WHEN o visitante aceita o consentimento
THE SYSTEM SHALL salvar `analytics_consent = 'accepted'` em `localStorage` e
inicializar GA4 e Sentry.

WHEN o visitante recusa
THE SYSTEM SHALL salvar `analytics_consent = 'rejected'` em `localStorage` e
NÃO inicializar GA4.

WHEN o visitante já deu resposta em visita anterior
THE SYSTEM SHALL respeitar a resposta armazenada e não exibir o banner novamente.

---

## Critérios de Aceitação

- [ ] GA4 envia pageview em cada navegação de rota
- [ ] GA4 não inicializa sem consentimento
- [ ] Evento `pet_registered` enviado após cadastro de pet
- [ ] Evento `contact_viewed` enviado em `/pets/[id]`
- [ ] Evento `provider_contact` enviado ao clicar no WhatsApp do prestador
- [ ] Evento `purchase` enviado após pagamento confirmado
- [ ] Sentry captura erros de browser não tratados
- [ ] Sentry captura erros de API 5xx
- [ ] `tracesSampleRate = 0.1` em produção
- [ ] Banner de consentimento exibido na primeira visita
- [ ] GA4 não inicializa quando consentimento = 'rejected'
- [ ] `npm run typecheck` sem erros
