# Tasks — Achados e Perdidos

## Melhorias pendentes (priorizadas)

- [ ] **SEO-1** — Adicionar `generateMetadata` dinâmico em `/achados-e-perdidos/[id]`
  - title: `{nome} — Pet {status} em {cidade} | SOS Pet Aumigo`
  - og:image: foto_url do pet
  - og:description: primeiros 160 chars da descricao

- [ ] **SEO-2** — Sitemap dinâmico listando todas as páginas de detalhe ativas

- [ ] **UX-1** — Paginação ou infinite scroll na listagem
  - Usar query param `?page=N` para manter URL bookmarkável
  - Limite por página: 12 cards

- [ ] **PERF-1** — Cache da listagem com `revalidate` no Server Component
  - Revalidar a cada 60s (não é tempo real, tem latência aceitável)

## Já feito

- [x] CRUD completo com RLS
- [x] Upload foto → Supabase Storage
- [x] Turnstile anti-spam
- [x] Soft delete (status='resolvido')
