# Spec — Painel de Moderação Admin
# SDD Fase 1: ESPECIFICAR (O QUÊ — sem tecnologia)
# Notação: EARS (Easy Approach to Requirements Syntax)
# Status: ⬜ Pendente
# Slug: admin-panel
# Responsável: Wes
# Data: 2026-06-10

---

## Contexto de Negócio

Com o crescimento da plataforma, conteúdo inadequado vai aparecer: pets falsos, spam,
fotos impróprias. O painel admin permite que Wes (e futuros moderadores) revisem denúncias,
removam conteúdo abusivo, e acompanhem métricas gerais da plataforma. As rotas `/admin` e
`/admin/pets` já existem. Hoje, qualquer usuário autenticado consegue acessar essas rotas —
não há verificação de permissão de admin. Isso é um bug de segurança que precisa ser
corrigido primeiro.

## Estado Atual

| Item | Status |
|---|---|
| Rota `/admin` | Existe (sem proteção de admin) |
| Rota `/admin/pets` | Existe (sem proteção de admin) |
| Rota `/admin/prestadores` | Existe (sem proteção de admin) |
| Campo `role` em `profiles` | Não existe |
| Sistema de denúncias | Não existe |
| Métricas gerais | Não existem |

## Requisitos — Notação EARS

### 2.1 Controle de Acesso Admin

WHEN qualquer usuário tenta acessar rotas `/admin/*`
THE SYSTEM SHALL verificar que `profiles.role = 'admin'` para o `auth.uid()`.

IF o usuário não for admin
THEN THE SYSTEM SHALL retornar página 403 com mensagem "Acesso restrito" e link para a home.

WHEN o sistema realiza a migration de admin-panel
THE SYSTEM SHALL adicionar campo `role TEXT CHECK IN ('user','admin','moderator')
DEFAULT 'user'` na tabela `profiles`.

THE SYSTEM SHALL criar middleware Next.js que protege todas as rotas `/admin/*`.

### 2.2 Dashboard de Métricas Gerais

WHEN um admin acessa `/admin`
THE SYSTEM SHALL exibir painel com:
- Total de pets cadastrados (ativos, resolvidos, removidos)
- Total de pets perdidos vs encontrados (últimos 30 dias)
- Total de usuários cadastrados
- Total de prestadores
- Novos cadastros hoje vs ontem (pets + usuários)
- Pets com mais de 30 dias sem resolução (lista dos top 10)

### 2.3 Moderação de Pets

WHEN um admin acessa `/admin/pets`
THE SYSTEM SHALL exibir lista de todos os pets com: id, nome, tutor, cidade, status,
data de cadastro, número de denúncias.

WHEN o admin usa os filtros da lista
THE SYSTEM SHALL filtrar por: status, city, kind (lost/found), `report_count > 0`.

WHEN o admin clica em "Remover" em um pet
THE SYSTEM SHALL atualizar `pets.status = 'removed'` e registrar em `admin_actions`
com `admin_id`, `action_type = 'remove_pet'`, `target_id`, `reason`, `created_at`.

WHEN o admin clica em "Restaurar" em um pet removido
THE SYSTEM SHALL atualizar `pets.status = 'active'` e registrar em `admin_actions`.

### 2.4 Sistema de Denúncias

WHEN um usuário clica em "Denunciar" em um pet ou avistamento
THE SYSTEM SHALL exibir formulário com opções: "Spam / Falso", "Foto imprópria",
"Informação errada", "Outro".

WHEN a denúncia é submetida
THE SYSTEM SHALL inserir em `reports` com `reporter_id`, `target_type` (pet|sighting),
`target_id`, `reason`, `status = 'pending'`.

WHEN `reports.count` para o mesmo `target_id` atinge 3
THE SYSTEM SHALL automaticamente setar o target para `status = 'hidden'` (soft-hide).

WHEN o admin visualiza denúncias em `/admin/pets?filter=reported`
THE SYSTEM SHALL exibir pets com `report_count >= 1`, ordenados por `report_count DESC`.

WHEN o admin clica "Aprovar conteúdo" (inocentar)
THE SYSTEM SHALL setar todos os reports do target para `status = 'dismissed'` e
`report_count = 0` no pet.

### 2.5 Banimento de Usuário

WHEN o admin clica em "Banir usuário" em um pet ou denúncia
THE SYSTEM SHALL atualizar `profiles.role = 'banned'` para o usuário.

WHEN um usuário com `role = 'banned'` tenta fazer login
THE SYSTEM SHALL retornar erro de autenticação com mensagem "Conta suspensa. Contate o suporte."

IF o admin tentar banir outro admin
THEN THE SYSTEM SHALL retornar erro 403 "Não é possível banir um administrador".

---

## Critérios de Aceitação

- [ ] Usuário sem `role = 'admin'` recebe 403 em todas as rotas `/admin/*`
- [ ] Middleware protege rotas sem necessidade de verificação em cada página
- [ ] `profiles.role` adicionado via migration com DEFAULT 'user'
- [ ] `/admin` exibe 6 métricas de overview
- [ ] `/admin/pets` filtrável por status e report_count > 0
- [ ] Remover pet seta `status = 'removed'` e registra em `admin_actions`
- [ ] 3 denúncias no mesmo pet auto-hide o conteúdo
- [ ] Banir usuário bloqueia login subsequente
- [ ] Admin não pode banir outro admin
- [ ] `npm run typecheck` sem erros
