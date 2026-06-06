# Requirements — Prestadores de Serviço

**Status:** ✅ Implementado
**Slug:** prestadores

---

## O que o sistema faz

WHEN qualquer usuário acessa `/prestadores`
THE SYSTEM SHALL listar prestadores com filtros: categoria, cidade, emergência 24h, delivery.

WHEN um usuário acessa `/prestadores/[slug]`
THE SYSTEM SHALL exibir detalhe do prestador com avaliações e incrementar visualizações via RPC.

WHEN um usuário clica em "Contato via WhatsApp"
THE SYSTEM SHALL incrementar cliques_whatsapp via RPC `incrementar_clique_whatsapp`.

WHEN um prestador autenticado acessa seu dashboard
THE SYSTEM SHALL exibir métricas reais: visualizações, cliques WhatsApp, avaliações.

---

## Fora do escopo

- Agendamento online integrado (pós-MVP)
- Pagamento via plataforma (pós-MVP)

---

## Estado atual

- [x] Listagem com filtros ricos
- [x] Detalhe por slug
- [x] RPCs de stats (visualizacoes, cliques_whatsapp)
- [x] Dashboard do prestador com métricas
- [x] Avaliações (schema + interface)
- [ ] Verificação/badge de prestador verificado (UI existe, fluxo de aprovação pendente)
