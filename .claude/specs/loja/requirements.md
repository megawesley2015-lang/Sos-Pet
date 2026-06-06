# Requirements — Loja (Plaquinhas + Produtos)

**Status:** 🔧 Implementado (integrações externas ativas)
**Slug:** loja

---

## O que o sistema faz

WHEN um usuário acessa `/loja`
THE SYSTEM SHALL exibir catálogo de produtos sincronizados do Printful.

WHEN um usuário compra uma plaquinha SOS
THE SYSTEM SHALL iniciar checkout via Mercado Pago e, após aprovação,
criar order no Printful para fulfillment/dropshipping.

WHEN Printful envia webhook de status de pedido
THE SYSTEM SHALL atualizar o status da order na tabela `pet_tag_orders`.

---

## Integrações ativas

- **Printful** — catálogo e fulfillment (lib/services/printful.ts)
- **Mercado Pago** — checkout (lib/services/mercadopago.ts)

## Variáveis de ambiente necessárias

```
PRINTFUL_API_KEY
MERCADOPAGO_ACCESS_TOKEN
```

---

## Estado atual

- [x] Catálogo sincronizado do Printful
- [x] Checkout Mercado Pago
- [x] Schema pet_tag_orders + store_products
- [x] Painel admin de gerenciamento de loja
- [ ] Webhook de status de envio para o cliente (email de rastreamento)
- [ ] Página de acompanhamento de pedido para o usuário
