# Spec — Fase 1: Paridade de filtros em /pets

- **Status:** proposta (aguardando aprovação)
- **Data:** 2026-07-06
- **Épico:** consolidação `/achados-e-perdidos` × `/pets` (esta é a Fase 1; a Fase 2 — redirect — é decisão separada e **não** entra aqui).
- **Pré-requisito para:** qualquer redirect de `/achados-e-perdidos → /pets`. Sem esta paridade, redirecionar **regride** funcionalidade.

---

## 1. Objetivo

Fazer `/pets` (rota canônica, SSR) oferecer **todos os filtros reais** que hoje só existem em
`/achados-e-perdidos`, para que a consolidação futura não perca nenhuma capacidade de busca.
Nenhum redirect nesta fase.

---

## 2. Estado atual (fatos apurados)

**`/pets`** (`app/pets/page.tsx` + `components/pets/PetFilters.tsx`): Server Component consultando
`pets_public` com **offset** (`.range()`, `?page=N`). Filtros: `q` (nome), `kind`, `species`, `city`.
Tem `canonical`, OG e SSR. Ordenação: select decorativo (só "recentes").

**`/achados-e-perdidos`** (`FilterBar` + `PetListClient` → `usePaginatedPets` → **`/api/pets`**):
paginação **cursor** client-side. Filtros: `kind`, `species`, `city`, **`neighborhood`, `color`, `size`,
`lat/lng/radiusKm` (proximidade)**. **Não** tem busca por nome (`q`).

**`/api/pets` (GET)** já implementa, com Zod: `kind, species, city, neighborhood (ilike), color (ilike),
size (eq), lat/lng/radius_km (bbox + haversine exata, ordenado por distância)`, cursor + count, rate-limit.
**Importante:** força `status='active'` (linha `q.eq('status','active')`). **Não** suporta `q` (nome).

### Descobertas que mudam o escopo
- **`status=resolved` é um parâmetro morto hoje.** Nem o `FilterBar` tem esse controle, nem `/api/pets`
  aceita — a view `pets_public` é **active-only**. O link `HallRreencontros → /achados-e-perdidos?status=resolved`
  **já mostra ativos**, não resolvidos. Logo, "listar resolvidos" **não é** funcionalidade a preservar nesta
  fase — é um bug/gap à parte (ver §5).
- **Cada rota tem um filtro que a outra não tem:** `/pets` tem `q` (nome); `/achados` tem geo/cor/porte/bairro.
  Paridade real = `/pets` ganha geo/cor/porte/bairro **mantendo** `q`.
- **Mismatch de nomes de param:** URL usa `radiusKm` (camel, via `useSearchFilters`); a API usa `radius_km`
  (snake). A paridade precisa padronizar/mapear (decisão em §7).

---

## 3. Escopo (o que muda)

Adicionar a `/pets` os filtros: **cor, porte, bairro, proximidade (GPS + raio)** — preservando `q`, `kind`,
`species`, `city` e a canônica/SSR. Definir ordenação. Arquivos prováveis:

| Arquivo | Mudança |
|---|---|
| `components/pets/PetFilters.tsx` | Adicionar controles: bairro (input), cor (input), porte (select), proximidade (checkbox GPS + raio). Reusar padrões do `FilterBar`. Escrever na URL. |
| `app/pets/page.tsx` | Ler os novos params e aplicá-los à consulta. Ver estratégia de dados em §4. |
| (talvez) `lib/geo.ts` / helper | Reusar `haversineKm` já existente (não recriar). |

**Fora de escopo:** `/achados-e-perdidos` (intocada nesta fase), `/achados-e-perdidos/cadastrar`, redirect,
schema, RLS, auth, `/api/pets` **POST**, e a questão de listar resolvidos (§5).

---

## 4. Estratégia de dados (decisão central)

Geo exige ordenação por distância (haversine) — não sai de um `range()` SQL puro. Três abordagens:

- **A — Enriquecer o Server Component (`/pets`):** adicionar `neighborhood/color/size` (trivial: `ilike`/`eq`)
  à query `pets_public` atual; para geo, portar o padrão do `/api/pets` (bbox no SQL + haversine em JS + sort).
  Mantém SSR/SEO. Complexidade: paginação em geo mode não é offset trivial (precisa cursor/slice como a API).
- **B — `/pets` consome `/api/pets` (client, cursor):** paridade imediata (mesmo endpoint), mas **perde SSR**
  da lista → regride SEO/preview de `/pets`. **Não recomendado** (contradiz por que `/pets` é canônica).
- **C — Híbrido (recomendado):** `/pets` continua **SSR + offset** para o caso comum
  (`q/kind/species/city/color/size/neighborhood`); **quando proximidade está ativa**, alterna para o caminho
  cursor via `/api/pets` (que já faz bbox+haversine), espelhando o próprio *dual-mode* da API. Preserva SSR no
  caso dominante e delega o geo ao código já testado.

**Recomendação:** **C** (ou A se preferir tudo no server). A escolha define a complexidade de paginação.

---

## 5. Análise do `status=resolved`

- **Não implementar nesta fase.** Listar pets **resolvidos** exige fonte de dados diferente (a `pets_public`
  esconde não-ativos; `/api/pets` força `active`). Adicionar isso mexeria em view/RLS/consulta — fora do
  princípio "sem schema nesta fase".
- **Achado a registrar:** o link `HallRreencontros → /achados-e-perdidos?status=resolved` **hoje não lista
  resolvidos** (param ignorado). Corrigir o "Hall de Reencontros" de verdade é uma **spec própria** (precisa
  de uma fonte de resolvidos com contato oculto). Nesta fase, apenas **documentar** que o param é inócuo — não
  herdar essa promessa quebrada para `/pets`.

---

## 6. Ordenação

- Manter **"Mais recentes"** como padrão (comportamento atual de ambas em modo normal).
- Em **modo proximidade**, ordenar por **distância** (como o `/api/pets` já faz) e rotular o select
  ("Mais próximos") automaticamente.
- Opcional (decidir): adicionar "Mais antigos". Se não, **tornar o select honesto** (hoje é decorativo com
  só uma opção) — ou remover, ou popular com as opções reais. Sem opção fake.

---

## 7. Impacto em SSR / SEO / paginação

- **SSR/SEO:** com abordagem **A/C**, o caso comum permanece SSR → mantém `canonical`, OG e preview. Só o
  modo proximidade (nicho, exige geolocalização do usuário) roda client-side — aceitável, pois páginas geo
  são personalizadas e não precisam ser indexadas.
- **Paginação:** decidir a convergência —
  - manter **offset** (`?page=N`, shareable, SEO) no modo normal;
  - **cursor** no modo geo (não há "página N" estável numa lista ordenada por distância).
  Documentar que deep-link de página só vale no modo normal.
- **Nomes de param na URL (decisão):** padronizar para o que `/pets` já usa e o que a API espera. Sugerido:
  manter na URL `kind, species, city, q, color, size, neighborhood` + geo `lat, lng, radiusKm`; mapear
  `radiusKm → radius_km` só na chamada à API. Garantir que os params sobrevivam à navegação e ao back button
  (padrão "URL as state" já usado nos dois lados).
- **Canonical:** manter `/pets` canônica; o paliativo já aponta `/achados → /pets`.

---

## 8. Critérios de aceite

- [ ] `/pets` filtra por **cor** (ilike), **porte** (eq) e **bairro** (ilike), além dos atuais.
- [ ] `/pets` oferece **proximidade** (botão GPS que preenche lat/lng) + **raio** (1/2/5/10/20 km) e retorna
      resultados ordenados por distância real (haversine), equivalentes ao `/achados` hoje.
- [ ] `q` (busca por nome) **continua funcionando** em `/pets` (não regride).
- [ ] Todos os filtros refletem na **URL** e sobrevivem a reload/back (shareable).
- [ ] Modo normal permanece **SSR** com `canonical`/OG intactos; paginação normal shareable.
- [ ] Nenhuma mudança em `pets_public`, RLS, schema, auth ou no POST de `/api/pets`.
- [ ] `status=resolved` **não** é introduzido; comportamento de resolvidos inalterado.
- [ ] Paridade verificada lado a lado: para o mesmo conjunto de filtros, `/pets` retorna o mesmo conjunto de
      pets que `/achados-e-perdidos` retornaria hoje.
- [ ] `typecheck` + `build` verdes; testes existentes verdes.

## 9. Plano de verificação
1. `npm.cmd run typecheck` · `npm.cmd run build` · Vitest (suíte atual).
2. **Teste de paridade manual:** aplicar cada filtro (cor, porte, bairro, proximidade com um raio) em ambas
   as rotas e comparar os resultados/contagem.
3. Conferir na URL que os params persistem e o back button funciona.
4. Conferir que o `<link rel="canonical">` e o OG de `/pets` seguem presentes no modo normal.
5. (Se abordagem C) Conferir o *fallback* geo: sem geo → SSR/offset; com geo → cursor/distância.

---

## 10. Plano de migração (Fase 1 → Fase 2)

1. **Fase 1 (esta spec):** paridade de filtros em `/pets`. Sem redirect. Sem tocar `/achados`.
2. **Gate:** confirmar (critério de aceite) que `/pets` cobre 100% do que `/achados` faz. Registrar decisão
   em `docs/decisions/`.
3. **Fase 2 (spec futura, separada):** converter `app/achados-e-perdidos/page.tsx` em `redirect('/pets')`
   mapeando params, e atualizar links internos de marketing/home/Hero/Hall/onboarding. **Só depois** da Fase 1.
4. **À parte (spec própria):** listagem real de resolvidos para o Hall de Reencontros (fonte de dados nova);
   e duplicação `/achados-e-perdidos/cadastrar` vs `/pets/novo`.

---

## Decisões pendentes (para aprovar junto da spec)
1. **Abordagem de dados:** C (híbrido, recomendado) vs A (tudo no server).
2. **Ordenação:** só "recentes" + "próximos" (geo), ou adicionar "mais antigos"? Remover o select decorativo
   se ficar com uma opção só?
3. **Escopo de `q` no modo geo:** o `/api/pets` não suporta `q`. Em modo proximidade, desabilitar a busca por
   nome, ou estender o endpoint para aceitar `q`? (estender endpoint = mudança em `/api/pets`, avaliar).

Aguardando aprovação da spec + decisões acima para gerar o `/plan` e implementar.
