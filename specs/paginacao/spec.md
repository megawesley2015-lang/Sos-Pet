# Spec — Paginação Cursor-Based
# SDD Fase 1: ESPECIFICAR (O QUÊ — sem tecnologia)
# Notação: EARS (Easy Approach to Requirements Syntax)
# Status: ⬜ Pendente
# Slug: paginacao
# Responsável: Wes
# Data: 2026-06-10

---

## Contexto de Negócio

A plataforma Pet Aumigo exibe listas de pets perdidos/encontrados, prestadores de serviço e pets
de abrigo. Sem paginação, uma cidade com centenas de cadastros trava o browser, degrada o
SEO (page weight alto) e onera o Supabase com queries sem LIMIT. O cursor-based pagination
(keyset pagination) é preferível ao offset porque mantém consistência quando novos registros
são inseridos durante a navegação — crítico em alertas de pets perdidos que chegam em
tempo real.

## Estado Atual

| Item | Status |
|---|---|
| `/achados-e-perdidos` — listagem de pets | Sem paginação — carrega todos os registros |
| `/prestadores` — listagem de prestadores | Sem paginação |
| `/ong/pets` — pets do abrigo | Sem paginação |
| `api/pets` — GET route | Sem LIMIT/cursor |
| Componente `PetGrid.tsx` | Sem suporte a "Carregar mais" |
| `FilterBar.tsx` | Sem estado de paginação |

## Requisitos — Notação EARS

### 2.1 Listagem de Pets com Cursor

WHEN o usuário acessa `/achados-e-perdidos`
THE SYSTEM SHALL exibir no máximo 24 pets por página, ordenados por `created_at` DESC.

WHEN a página carrega pela primeira vez
THE SYSTEM SHALL buscar os 24 pets mais recentes sem cursor (primeira página).

WHEN o usuário clica em "Carregar mais"
THE SYSTEM SHALL buscar os próximos 24 pets usando `created_at` e `id` do último item
como cursor, sem repetir itens já exibidos.

WHEN não existirem mais pets a exibir
THE SYSTEM SHALL ocultar o botão "Carregar mais" e exibir "Todos os pets carregados".

IF a requisição de paginação falhar (erro de rede ou Supabase)
THEN THE SYSTEM SHALL exibir mensagem de erro não-destrutiva, mantendo os itens já
carregados na tela.

### 2.2 Paginação na API `/api/pets`

WHEN a rota `GET /api/pets` recebe os query params `cursor_created_at` e `cursor_id`
THE SYSTEM SHALL retornar os próximos 24 pets onde `created_at < cursor_created_at`
OR (`created_at = cursor_created_at` AND `id < cursor_id`), ordenados por
`(created_at DESC, id DESC)`.

WHEN a rota `GET /api/pets` não recebe cursor
THE SYSTEM SHALL retornar os primeiros 24 pets (página inicial).

THE SYSTEM SHALL incluir no response o campo `next_cursor: { created_at, id } | null`
indicando se há próxima página.

IF `limit` no query param exceder 100
THEN THE SYSTEM SHALL retornar erro 400 com `{ success: false, error: "Limite máximo é 100" }`.

### 2.3 Paginação em `/prestadores`

WHEN o usuário acessa `/prestadores`
THE SYSTEM SHALL exibir no máximo 20 prestadores por página, ordenados por
`avaliacao DESC, created_at DESC`.

WHEN o usuário clica em "Carregar mais"
THE SYSTEM SHALL buscar os próximos 20 prestadores com cursor composto
`(avaliacao, created_at, id)`.

### 2.4 Paginação em `/ong/pets`

WHEN um usuário autenticado com shelter acessa `/ong/pets`
THE SYSTEM SHALL exibir no máximo 20 pets por página, ordenados por `created_at DESC`.

WHEN o usuário navega para a próxima página
THE SYSTEM SHALL manter os filtros de status (disponível/adotado/em tratamento) ativos.

### 2.5 Integração com Filtros

WHEN o usuário altera qualquer filtro em `FilterBar` (espécie, cidade, porte)
THE SYSTEM SHALL resetar o cursor para null e recarregar desde a primeira página.

WHEN o cursor é resetado após mudança de filtro
THE SYSTEM SHALL limpar os itens da página anterior antes de exibir os novos resultados.

---

## Critérios de Aceitação

- [ ] `/achados-e-perdidos` exibe exatamente 24 pets no carregamento inicial
- [ ] Clicar "Carregar mais" acrescenta 24 pets sem duplicatas
- [ ] Alterar filtro de espécie reseta para a primeira página
- [ ] Quando não há mais pets, botão "Carregar mais" desaparece
- [ ] `GET /api/pets?cursor_created_at=X&cursor_id=Y` retorna próxima página correta
- [ ] `GET /api/pets` sem cursor retorna primeira página com `next_cursor` preenchido
- [ ] `GET /api/pets?limit=200` retorna 400
- [ ] `/prestadores` pagina por 20 com cursor composto de avaliação
- [ ] `/ong/pets` pagina por 20 mantendo filtros ativos
- [ ] `npm run typecheck` sem erros após implementação
