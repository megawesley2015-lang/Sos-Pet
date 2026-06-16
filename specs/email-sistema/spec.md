# Spec — Sistema de Email Transacional
# SDD Fase 1: ESPECIFICAR (O QUÊ — sem tecnologia)
# Notação: EARS (Easy Approach to Requirements Syntax)
# Status: ⬜ Pendente
# Slug: email-sistema
# Responsável: Wes
# Data: 2026-06-10

---

## Contexto de Negócio

Emails transacionais são o canal silencioso que sustenta a confiança do usuário: confirmar
o cadastro do pet, avisar sobre um match encontrado, notificar sobre adoção. Hoje, nenhum
email transacional é enviado — o `RESEND_API_KEY` está configurado mas sem integração.
O resultado é que tutores cadastram pets perdidos e ficam sem nenhum feedback assíncrono.
O Resend já foi escolhido como provedor; este módulo cria a camada de envio com templates
HTML reutilizáveis e uma tabela de log para auditoria.

## Estado Atual

| Item | Status |
|---|---|
| `RESEND_API_KEY` | Configurado nas env vars |
| `RESEND_FROM` | Configurado (`FROM_EMAIL` era o nome antigo) |
| Emails transacionais | Nenhum enviado atualmente |
| Templates de email | Não existem |
| Log de emails enviados | Não existe |
| SDK Resend instalado | Não verificado |

## Requisitos — Notação EARS

### 2.1 Infraestrutura de Email

WHEN o sistema precisa enviar um email
THE SYSTEM SHALL usar a função centralizada `sendEmail(to, template, data)` de
`lib/email/send.ts`.

THE SYSTEM SHALL logar cada tentativa em `email_logs` com `to_email` (hash SHA256,
não o email plaintext), `template_name`, `status` (sent|failed), `error_message`.

IF o Resend retornar erro de rate limit (429)
THEN THE SYSTEM SHALL aguardar 1 segundo e tentar novamente uma vez.

IF o Resend retornar qualquer outro erro
THEN THE SYSTEM SHALL logar o erro e retornar sem lançar exceção (fire-and-fail-silently).

IF `RESEND_API_KEY` não estiver configurado
THEN THE SYSTEM SHALL logar aviso no console e não tentar o envio.

### 2.2 Email: Confirmação de Cadastro de Pet

WHEN um pet é cadastrado com sucesso em `POST /api/pets`
THE SYSTEM SHALL enviar email para `profiles.email` do tutor com:
- Subject: "Pet cadastrado com sucesso — SOS Pet Aumigo"
- Conteúdo: nome do pet, espécie, foto, link para `/pets/[id]`
- CTA: "Ver cadastro do pet"

IF o tutor não tiver email cadastrado
THE SYSTEM SHALL pular o envio silenciosamente.

### 2.3 Email: Alerta de Match Encontrado

WHEN um novo `pet_match` com `confidence_score >= 0.70` é criado
THE SYSTEM SHALL enviar email para o tutor do pet perdido com:
- Subject: "Encontramos um possível match para [nome do pet]! 🐾"
- Conteúdo: dados do pet encontrado (nome, cidade, foto), score de confiança (em %)
- CTAs: "Confirmar match" → `/matches/[id]/confirmar` | "Não é meu pet" → `/matches/[id]/descartar`

### 2.4 Email: Confirmação de Adoção (módulo ONG)

WHEN uma adoção é confirmada no módulo ONG (`adoptions.status = 'completed'`)
THE SYSTEM SHALL enviar email para o adotante com:
- Subject: "Parabéns! Sua adoção de [nome do pet] foi confirmada 🐾"
- Conteúdo: nome do pet, foto, próximos passos (vacinação, microchipagem)
- CTA: "Ver perfil do pet" → `/pets/[id]`

### 2.5 Email: Follow-up de Pet Não Resolvido

WHEN um pet tem `kind = 'lost'` e `status = 'active'` por mais de 7 dias
THE SYSTEM SHALL verificar se já foi enviado follow-up (via `email_logs`)
e, se não, enviar email ao tutor com:
- Subject: "Ainda procurando [nome]? Dicas para aumentar as chances"
- Conteúdo: link para compartilhar, dicas de busca, CTA para marcar como encontrado

THE SYSTEM SHALL enviar esse follow-up apenas uma vez por pet (verificar `email_logs`).

---

## Critérios de Aceitação

- [ ] SDK Resend instalado (`npm list resend` mostra versão)
- [ ] `sendEmail` centralizado em `lib/email/send.ts`
- [ ] Erro de Resend não quebra a request principal (fire-and-fail-silently)
- [ ] `email_logs` criada com `to_email` como hash (nunca plaintext)
- [ ] Email de confirmação enviado após `POST /api/pets` com sucesso
- [ ] Email de match enviado para `confidence_score >= 0.70`
- [ ] Email de adoção enviado após ONG confirmar adoção
- [ ] Follow-up de 7 dias enviado apenas uma vez por pet
- [ ] `npm run typecheck` sem erros
