# Requirements — Achados e Perdidos

**Status:** ✅ Implementado (CRUD completo)
**Slug:** achados-e-perdidos

---

## O que o sistema faz

WHEN um usuário acessa `/achados-e-perdidos`
THE SYSTEM SHALL exibir listagem pública de pets, ordenada por created_at DESC, sem expor `contato`.

WHEN um usuário submete o formulário em `/achados-e-perdidos/novo`
THE SYSTEM SHALL cadastrar o pet com validação Zod, fazer upload da foto (bucket pet-images) e redirecionar para `/achados-e-perdidos/[id]`.

WHEN um usuário não autenticado cadastra um pet
THE SYSTEM SHALL exigir Cloudflare Turnstile antes de aceitar o submit.

WHEN o dono do pet acessa `/achados-e-perdidos/[id]`
THE SYSTEM SHALL exibir botões de editar e excluir (soft delete: status='resolvido').

WHEN qualquer usuário acessa `/achados-e-perdidos/[id]`
THE SYSTEM SHALL exibir o campo `contato`. Este é o ÚNICO lugar onde contato aparece.

---

## Fora do escopo

- Matching automático (spec separada)
- Notificações push/WhatsApp (pós-MVP)
- Geolocalização GPS no formulário (pós-MVP)

---

## Estado atual

- [x] Listagem com filtros (espécie, status, cidade)
- [x] Formulário + upload de foto
- [x] Turnstile para anônimos
- [x] Detalhe com contato protegido
- [x] Edição e soft delete para o dono
- [x] RLS cobrindo todas operações
- [ ] Paginação na listagem
- [ ] Meta tags OG por página de detalhe
