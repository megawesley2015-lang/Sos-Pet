# Spec — Módulo de Parcerias B2B
# SDD Fase 1: ESPECIFICAR (O QUÊ — sem tecnologia)
# Notação: EARS (Easy Approach to Requirements Syntax)
# Status: ⬜ Pendente
# Slug: parceiros
# Responsável: Wes
# Data: 2026-06-10

---

## Contexto de Negócio

A rota `/parcerias` existe como página com formulário mas sem backend — ao clicar em enviar,
nada acontece. Esse é o principal ponto de entrada B2B: clínicas, pet shops e ONGs que querem
visibilidade na plataforma chegam por aqui. Quando um parceiro preenche o formulário, o fluxo
ideal é: salvar no Supabase → enviar email de boas-vindas → criar automaticamente um registro
na tabela `prestadores` com status `pendente` para aprovação do admin. Cada passo é
rastreável e permite escalar sem intervenção manual para cada parceiro.

## Estado Atual

| Item | Status |
|---|---|
| Rota `/parcerias` | Existe (formulário estático sem backend) |
| Tabela para parceiros/leads | Não existe |
| Envio de email de boas-vindas | Não existe |
| Criação automática de `prestadores` | Não existe |
| Aprovação de parceiros pelo admin | Não existe |
| `RESEND_API_KEY` | Configurado |

## Requisitos — Notação EARS

### 2.1 Formulário de Parcerias

WHEN um visitante acessa `/parcerias`
THE SYSTEM SHALL exibir formulário com campos:
- `nome` (texto — nome da empresa ou pessoa)
- `email` (email válido)
- `telefone` (obrigatório)
- `tipo_negocio` (select: clínica veterinária | pet shop | banho e tosa | adestramento | hotel para pets | ONG / abrigo | outro)
- `cidade` (select das 9 cidades da Baixada Santista)
- `mensagem` (textarea opcional — apresentação)
- `aceita_termos` (checkbox obrigatório)

WHEN o visitante submete o formulário com dados válidos
THE SYSTEM SHALL:
1. Salvar em `partnership_requests` com `status = 'pending'`
2. Retornar resposta de sucesso ao visitante
3. Enviar email de boas-vindas para o `email` fornecido
4. Criar registro em `prestadores` com `status_parceiro = 'aguardando_aprovacao'`
5. Enviar notificação interna para Wes (email de admin)

IF o email já tiver uma solicitação com `status = 'pending'` ou `status = 'approved'`
THEN THE SYSTEM SHALL retornar erro 409 "Já existe uma solicitação com este email" sem
criar duplicata.

IF qualquer campo obrigatório estiver ausente
THEN THE SYSTEM SHALL retornar erro 422 com o campo específico inválido.

WHEN o formulário é submetido com sucesso
THE SYSTEM SHALL exibir mensagem "Recebemos sua solicitação! Entraremos em contato em até 48 horas."

### 2.2 Proteção Anti-Spam

WHEN o formulário é submetido
THE SYSTEM SHALL verificar o token Turnstile (`TURNSTILE_SECRET_KEY`) antes de
processar.

IF a verificação Turnstile falhar
THEN THE SYSTEM SHALL retornar erro 422 "Verificação anti-spam falhou" sem salvar.

THE SYSTEM SHALL aplicar rate limiting: máximo 3 submissions por IP por hora.

### 2.3 Email de Boas-Vindas

WHEN uma partnership request é salva com sucesso
THE SYSTEM SHALL enviar email para o parceiro com:
- Subject: "Bem-vindo à rede Pet Aumigo!"
- Conteúdo: agradecimento, próximos passos, link para `/parcerias` (FAQ)
- Prazo de resposta: "48 horas úteis"
- Contato de suporte

THE SYSTEM SHALL enviar email de notificação interna para `ADMIN_EMAIL` (nova env var) com:
- Subject: "Nova solicitação de parceria — [nome] ([tipo_negocio])"
- Dados completos da solicitação
- Link para `/admin/parceiros`

### 2.4 Aprovação pelo Admin

WHEN o admin acessa `/admin/parceiros` (nova rota admin)
THE SYSTEM SHALL listar todas as `partnership_requests` com status e data.

WHEN o admin clica em "Aprovar" em uma solicitação
THE SYSTEM SHALL:
1. Atualizar `partnership_requests.status = 'approved'`
2. Atualizar `prestadores.status_parceiro = 'ativo'` para o registro criado
3. Enviar email de aprovação para o parceiro com link para completar o perfil `/dashboard-prestador`

WHEN o admin clica em "Rejeitar"
THE SYSTEM SHALL atualizar `status = 'rejected'` e enviar email de rejeição gentil.

### 2.5 Criação Automática de Prestador

WHEN uma `partnership_request` é salva
THE SYSTEM SHALL criar automaticamente um registro em `prestadores` com:
- `nome`: do formulário
- `categoria`: mapeado do `tipo_negocio` (ex: 'clínica veterinária' → 'clinica')
- `telefone`: do formulário
- `cidade`: do formulário
- `user_id`: null (ainda sem conta criada)
- `status_parceiro`: 'aguardando_aprovacao'

IF `status_parceiro` não existir na tabela `prestadores`
THE SYSTEM SHALL executar migration para adicionar o campo.

---

## Critérios de Aceitação

- [ ] Formulário em `/parcerias` tem todos os 8 campos especificados
- [ ] Submit salva em `partnership_requests` com `status = 'pending'`
- [ ] Email duplicado (mesmo email, status pending/approved) retorna 409
- [ ] Verificação Turnstile bloqueada → 422
- [ ] Rate limit: 4ª submission por IP em 1 hora retorna 429
- [ ] Email de boas-vindas enviado para o parceiro
- [ ] Email de notificação enviado para admin (`ADMIN_EMAIL`)
- [ ] Registro criado em `prestadores` com `status_parceiro = 'aguardando_aprovacao'`
- [ ] Admin pode aprovar/rejeitar em `/admin/parceiros`
- [ ] Aprovação atualiza `prestadores.status_parceiro = 'ativo'`
- [ ] `npm run typecheck` sem erros
