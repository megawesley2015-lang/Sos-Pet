/**
 * Fonte única das cidades alvo do Pet Aumigo.
 *
 * Hoje o produto cobre a Baixada Santista (9 cidades). O array é exportado
 * como `BAIXADA_SANTISTA` e usado por:
 *   - components/pets/PetFilters (chips de filtro)
 *   - app/sitemap.ts (URLs SEO localizadas)
 *   - lib/services/avisos / matching (referência geográfica)
 *
 * Para expandir cobertura: adicionar entradas aqui e o sitemap pega
 * automaticamente. Slug é derivado via cityToSlug().
 */
export const BAIXADA_SANTISTA = [
  "Santos",
  "São Vicente",
  "Guarujá",
  "Praia Grande",
  "Cubatão",
  "Bertioga",
  "Mongaguá",
  "Itanhaém",
  "Peruíbe",
] as const;

export type BaixadaSantistaCity = (typeof BAIXADA_SANTISTA)[number];
