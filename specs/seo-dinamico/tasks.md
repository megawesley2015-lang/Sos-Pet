# Tasks — SEO Dinâmico com ISR
# SDD Fase 3: DECOMPOR
# Status geral: ✅ Concluído — 2026-06-12
# Referências: spec.md

---

## T1 — Mapa de slugs e utilitários de parsing

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `lib/seo/slug-maps.ts` (novo)

### O que fazer
1. Criar constante `CITIES_SLUG_MAP`:
   ```ts
   { 'santos': 'Santos', 'guaruja': 'Guarujá', 'sao-vicente': 'São Vicente',
     'cubatao': 'Cubatão', 'bertioga': 'Bertioga', 'praia-grande': 'Praia Grande',
     'mongagua': 'Mongaguá', 'itanhaem': 'Itanhaém', 'peruibe': 'Peruíbe' }
   ```
2. Criar constante `TYPE_FILTER_MAP`:
   ```ts
   { 'cachorro-perdido': { species: 'dog', kind: 'lost' },
     'gato-perdido': { species: 'cat', kind: 'lost' },
     'cachorro-encontrado': { species: 'dog', kind: 'found' },
     'gato-encontrado': { species: 'cat', kind: 'found' },
     'pet-perdido': { species: undefined, kind: 'lost' },
     'pet-encontrado': { species: undefined, kind: 'found' } }
   ```
3. Criar funções:
   - `parseSlug(type: string, city: string): { species?: string, kind: string, cityName: string } | null`
   - `generateSeoTitle(type: string, cityName: string): string` → "Cachorros perdidos em Santos — SOS Pet Amigo"
   - `generateSeoDescription(type: string, cityName: string): string`
   - `generateAllParams(): { type: string, city: string }[]` — 54 combinações

### Harness Commands
```bash
npm run typecheck
npx vitest run seo-dinamico
```

### Critério de Aceite
- [ ] `parseSlug('cachorro-perdido', 'santos')` retorna `{ species: 'dog', kind: 'lost', cityName: 'Santos' }`
- [ ] `parseSlug('tipo-invalido', 'santos')` retorna `null`
- [ ] `generateAllParams()` retorna exatamente 54 combinações (6 × 9)
- [ ] `generateSeoTitle` usa PT-BR correto ("cachorros" plural, não "cachorro")
- [ ] `npm run typecheck` sem erros

---

## T2 — Página SEO dinâmica `/[type]-em-[city]`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/(public)/[type]-em-[city]/page.tsx` (criar ou implementar existente)

### Especificação EARS
THE SYSTEM SHALL gerar estaticamente 54 páginas com `generateStaticParams` e `revalidate = 3600`.

### O que fazer
1. `export async function generateStaticParams()` retornando `generateAllParams()` de `lib/seo/slug-maps.ts`
2. `export const revalidate = 3600`
3. Server Component:
   - `const { id } = await params` — Next.js 15+ com `params: Promise<{ type: string; 'em-city': string }>` — atenção ao parsing do slug composto
   - Extrair `type` e `city` do path dinâmico
   - Chamar `parseSlug(type, city)`; se null, chamar `notFound()`
4. Buscar pets no Supabase: `pets_public` com filtros de `species`, `kind`, `city`, `status = 'active'`, LIMIT 24, `order: created_at DESC`
5. Renderizar com `PetGrid` existente
6. Estado vazio: "Nenhum pet encontrado em {cityName} com esse filtro" + link para `/achados-e-perdidos`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] `npm run build` gera as 54 páginas estáticas sem erro
- [ ] `/pet-perdido-em-guaruja` lista pets perdidos de Guarujá
- [ ] URL com type inválido retorna 404
- [ ] URL com city inválida retorna 404
- [ ] `revalidate = 3600` no arquivo
- [ ] `npm run typecheck` sem erros

---

## T3 — Metadata e Open Graph por página

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/(public)/[type]-em-[city]/page.tsx`

### Especificação EARS
THE SYSTEM SHALL gerar `<title>`, `<meta description>` e Open Graph específicos para cada página.

### O que fazer
1. Adicionar `export async function generateMetadata({ params })`:
   ```ts
   export async function generateMetadata({ params }: Props) {
     const { type, 'em-city': cityParam } = await params
     // parsear e gerar title, description
   }
   ```
2. Retornar objeto com:
   - `title`: `generateSeoTitle(type, cityName)` — max 60 chars
   - `description`: `generateSeoDescription(type, cityName)` — max 155 chars
   - `openGraph.title`, `openGraph.description`
   - `openGraph.images`: foto do primeiro pet da lista, ou `/images/og-default.jpg`
   - `alternates.canonical`: URL canônica completa
3. Criar `/public/images/og-default.jpg` (placeholder 1200×630) se não existir

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] `<title>` gerado corretamente para cada combinação
- [ ] `<meta name="description">` diferente entre páginas
- [ ] Open Graph com imagem
- [ ] URL canônica presente
- [ ] `npm run typecheck` sem erros

---

## T4 — Sitemap automático `/sitemap.xml`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/sitemap.ts` (novo — Next.js App Router nativo)

### Especificação EARS
WHEN crawler acessa `/sitemap.xml`
THE SYSTEM SHALL retornar XML com todas as rotas estáticas, SEO e pets individuais.

### O que fazer
1. Criar `app/sitemap.ts` com função `export default async function sitemap(): Promise<MetadataRoute.Sitemap>`
2. Rotas estáticas com priority e changefreq:
   ```ts
   { url: '/', priority: 1.0, changeFrequency: 'daily' },
   { url: '/achados-e-perdidos', priority: 0.9, changeFrequency: 'hourly' },
   { url: '/prestadores', priority: 0.8, changeFrequency: 'daily' },
   { url: '/mapa', priority: 0.7 }, { url: '/loja', priority: 0.7 }, ...
   ```
3. 54 páginas SEO: mapear `generateAllParams()` → URLs com `priority: 0.8, changeFrequency: 'hourly'`
4. Pets individuais ativos: query em `pets_public` com `select('id, updated_at'), status = 'active'`; mapear para `/pets/[id]` com `lastModified: updated_at, priority: 0.6`
5. Retornar array concatenado

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] `GET /sitemap.xml` retorna XML válido após build
- [ ] Sitemap inclui exatamente 54 páginas SEO
- [ ] Rotas estáticas presentes com priority correto
- [ ] Pets individuais incluídos com `lastModified`
- [ ] `npm run typecheck` sem erros

---

## T5 — Testes unitários do parsing de slugs

**Fase SDD:** Verificar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `tests/seo-dinamico/seo-dinamico.test.ts` (novo)

### O que fazer
1. Testar `parseSlug` para todos os 6 tipos válidos
2. Testar `parseSlug` com type inválido → null
3. Testar `parseSlug` com city inválida → null
4. Testar `generateAllParams` → 54 itens, sem duplicatas
5. Testar `generateSeoTitle` com normalização de plural (cachorro → cachorros, gato → gatos)
6. Testar normalização de cidade com acento correto

### Harness Commands
```bash
npx vitest run seo-dinamico
```

### Critério de Aceite
- [ ] Pelo menos 12 casos de teste
- [ ] Todos os tipos válidos testados
- [ ] `generateAllParams` retorna exatamente 54 itens sem duplicatas
- [ ] Todos os testes passam

---

## Ordem de Execução

T1 → T2 → T3 → T4 → T5

**Dependências:**
- T2 depende de T1 (usa funções de parsing)
- T3 é extensão de T2 (mesmo arquivo, adicionar `generateMetadata`)
- T4 depende de T1 (usa `generateAllParams`)
- T5 testa T1 (pode ser desenvolvido em paralelo com T2)

## Harness Global

```bash
npm run typecheck
npx vitest run seo-dinamico
npm run build
```

