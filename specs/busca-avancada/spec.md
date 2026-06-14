# Spec — Busca Avançada com Filtros Geoespaciais
# SDD Fase 1: ESPECIFICAR (O QUÊ — sem tecnologia)
# Notação: EARS (Easy Approach to Requirements Syntax)
# Status: ⬜ Pendente
# Slug: busca-avancada
# Responsável: Wes
# Data: 2026-06-10

---

## Contexto de Negócio

Um tutor que perdeu um cão labrador marrom em Santos não quer ver todos os gatos de São
Paulo. A busca avançada com filtros de raio, espécie, cor, porte e bairro resolve isso —
reduz o ruído e aumenta as chances de encontrar o pet certo. Os campos `latitude` e
`longitude` já existem em `pets`, mas nunca foram usados para filtragem geoespacial.
A rota `/achados-e-perdidos` já tem `FilterBar.tsx`, mas os filtros são básicos. Esta spec
expande os filtros existentes com capacidade geoespacial real.

## Estado Atual

| Item | Status |
|---|---|
| `FilterBar.tsx` | Existe com filtros básicos (espécie, tipo) |
| Campos `latitude`, `longitude` em `pets` | Existem |
| Filtro por raio (km) | Não existe |
| Filtro por cor | Não existe |
| Filtro por porte | Não existe (campo `size` não está na tabela) |
| Filtro por bairro | Não existe |
| Extensão PostGIS | Pode não estar habilitada no Supabase |

## Requisitos — Notação EARS

### 2.1 Filtros Básicos Expandidos

WHEN o usuário seleciona filtro de espécie em `/achados-e-perdidos`
THE SYSTEM SHALL filtrar por `species` na query.

WHEN o usuário seleciona filtro de cor
THE SYSTEM SHALL filtrar pets onde `color ILIKE '%{cor}%'` (busca parcial, case-insensitive).

WHEN o usuário digita no campo de bairro
THE SYSTEM SHALL filtrar pets onde `neighborhood ILIKE '%{bairro}%'`.

WHEN o usuário seleciona porte
THE SYSTEM SHALL filtrar pets onde `size = {porte}` (pequeno | médio | grande).

IF o campo `size` não existir na tabela `pets`
THEN THE SYSTEM SHALL executar migration para adicionar `size TEXT CHECK IN ('small','medium','large')`.

### 2.2 Filtro por Raio Geoespacial

WHEN o usuário ativa o filtro "Buscar por proximidade" e fornece raio em km
THE SYSTEM SHALL usar a localização atual do dispositivo (`navigator.geolocation`) como
centro da busca.

WHEN a localização está disponível e o raio é definido
THE SYSTEM SHALL filtrar apenas pets com `latitude` e `longitude` preenchidos e dentro
do raio usando a fórmula Haversine (ou PostGIS se disponível).

IF PostGIS não estiver disponível no Supabase
THEN THE SYSTEM SHALL calcular a distância via bounding box SQL:
`latitude BETWEEN {lat - delta} AND {lat + delta}`
`AND longitude BETWEEN {lng - delta} AND {lng + delta}`
onde `delta = raio_km / 111.32` (aproximação razoável para a Baixada Santista).

IF o usuário nega permissão de geolocalização
THEN THE SYSTEM SHALL exibir aviso "Permissão de localização necessária para busca por raio"
e desabilitar o filtro de raio.

### 2.3 Ordenação de Resultados

WHEN filtro de raio está ativo
THE SYSTEM SHALL ordenar resultados por distância crescente (mais próximos primeiro).

WHEN filtro de raio não está ativo
THE SYSTEM SHALL manter ordenação padrão por `created_at DESC`.

### 2.4 Estado da URL e Compartilhamento

WHEN o usuário aplica filtros
THE SYSTEM SHALL atualizar os query params da URL sem reload:
`?species=dog&color=marrom&city=santos&radius=5&lat=-23.9&lng=-46.3`.

WHEN o usuário compartilha ou recarrega a URL com query params
THE SYSTEM SHALL restaurar os filtros exatos da URL.

### 2.5 Contagem de Resultados

WHEN filtros estão ativos
THE SYSTEM SHALL exibir "X pets encontrados" acima da listagem, atualizado após cada
mudança de filtro.

IF nenhum pet corresponder aos filtros
THE SYSTEM SHALL exibir mensagem "Nenhum pet encontrado com esses critérios" com CTA para
limpar filtros.

---

## Critérios de Aceitação

- [ ] Campo `size` adicionado via migration (se não existir)
- [ ] Filtro por cor usa ILIKE parcial (`marrom` encontra `marrom escuro`)
- [ ] Filtro por bairro usa ILIKE parcial
- [ ] Filtro por raio usa geolocalização do dispositivo
- [ ] Pets sem lat/long são excluídos quando filtro de raio está ativo
- [ ] Negar geolocalização desabilita filtro de raio com aviso
- [ ] URL reflete filtros aplicados (compartilhável)
- [ ] Recarregar URL com filtros restaura o estado dos filtros
- [ ] Contador de resultados atualiza ao mudar filtros
- [ ] "Limpar filtros" restaura query params para estado inicial
- [ ] `npm run typecheck` sem erros
