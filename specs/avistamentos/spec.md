# Spec — Avistamentos (Sightings)
# SDD Fase 1: ESPECIFICAR (O QUÊ — sem tecnologia)
# Notação: EARS (Easy Approach to Requirements Syntax)
# Status: ⬜ Pendente
# Slug: avistamentos
# Responsável: Wes
# Data: 2026-06-10

---

## Contexto de Negócio

Quando um pet está perdido, qualquer pessoa que o aviste pode ser a chave para encontrá-lo.
O recurso de avistamentos permite que voluntários e passantes registrem onde viram um pet
suspeito, com foto e coordenadas GPS. O tutor recebe uma notificação e pode ver todos os
avistamentos no mapa, formando um rastro visual que guia a busca. As rotas `/avistamentos`
e `/avistamentos/novo` já existem no sistema mas estão sem backend — precisam ser
implementadas com a tabela `sightings` e API routes correspondentes.

## Estado Atual

| Item | Status |
|---|---|
| Rota `/avistamentos` | Existe (sem backend) |
| Rota `/avistamentos/novo` | Existe (sem backend) |
| Rota `/mapa` | Existe |
| Tabela `sightings` | Não existe |
| API routes de avistamentos | Não existem |
| Exibição de avistamentos no mapa | Não existe |

## Requisitos — Notação EARS

### 2.1 Cadastro de Avistamento

WHEN um usuário autenticado acessa `/avistamentos/novo`
THE SYSTEM SHALL exibir formulário com campos: `pet_id` (seleção de pet perdido ativo),
`sighted_at` (data/hora), `latitude`, `longitude`, `neighborhood`, `city`,
`description` (texto livre), `photo_url` (opcional).

WHEN o usuário submete o formulário com campos válidos
THE SYSTEM SHALL inserir em `sightings` com `reporter_id = auth.uid()`.

WHEN o usuário ativa a geolocalização do dispositivo
THE SYSTEM SHALL preencher `latitude` e `longitude` automaticamente.

IF `latitude` ou `longitude` estiverem ausentes
THEN THE SYSTEM SHALL exigir preenchimento manual de `city` e `neighborhood`.

IF `sighted_at` for uma data mais de 30 dias no passado
THEN THE SYSTEM SHALL exibir aviso "Avistamento muito antigo — confirme a data" mas
permitir o cadastro.

IF `sighted_at` for uma data futura
THEN THE SYSTEM SHALL retornar erro 422 "Data do avistamento não pode ser futura".

WHEN o avistamento é salvo com sucesso
THE SYSTEM SHALL notificar o tutor do pet via email (se email cadastrado).

### 2.2 Listagem de Avistamentos

WHEN um visitante acessa `/avistamentos`
THE SYSTEM SHALL exibir feed de avistamentos recentes (máximo 20 por página, cursor-based),
ordenados por `sighted_at DESC`.

WHEN o visitante filtra por cidade
THE SYSTEM SHALL exibir apenas avistamentos da cidade selecionada.

THE SYSTEM SHALL exibir para cada avistamento: foto do pet perdido (de `pets.photo_url`),
data/hora, cidade, bairro, descrição e miniatura da foto do avistamento (se houver).

THE SYSTEM SHALL nunca exibir `reporter_id`, telefone do reporter ou dados pessoais
na listagem.

### 2.3 Avistamentos no Mapa

WHEN um visitante acessa `/mapa`
THE SYSTEM SHALL exibir pins no mapa para avistamentos dos últimos 30 dias que têm
coordenadas válidas.

WHEN o visitante clica em um pin de avistamento
THE SYSTEM SHALL exibir popup com: data, bairro, descrição (truncada em 100 chars)
e link para o pet perdido correspondente.

### 2.4 Avistamentos por Pet

WHEN um visitante acessa `/pets/[id]`
THE SYSTEM SHALL exibir seção "Avistamentos recentes" com até 5 avistamentos mais
recentes do pet, ordenados por `sighted_at DESC`.

WHEN o visitante clica em "Ver todos os avistamentos"
THE SYSTEM SHALL redirecionar para `/avistamentos?pet_id=[id]`.

### 2.5 Moderação e Spam

WHEN um usuário cadastra mais de 5 avistamentos em 1 hora
THE SYSTEM SHALL bloquear novos cadastros com erro 429 "Limite de avistamentos atingido".

WHEN um avistamento é reportado como spam por 3 usuários diferentes
THE SYSTEM SHALL setar `status = 'hidden'` e não exibir na listagem.

---

## Critérios de Aceitação

- [ ] Tabela `sightings` criada com RLS (INSERT autenticado, SELECT público)
- [ ] Formulário preenche lat/long via GPS do dispositivo
- [ ] Avistamento com data futura retorna 422
- [ ] Feed de `/avistamentos` exibe sem dados pessoais do reporter
- [ ] Mapa exibe pins de avistamentos dos últimos 30 dias
- [ ] Popup do pin exibe data, bairro, descrição truncada e link para o pet
- [ ] `/pets/[id]` exibe até 5 avistamentos recentes
- [ ] Rate limit: > 5 avistamentos/hora retorna 429
- [ ] `npm run typecheck` sem erros
