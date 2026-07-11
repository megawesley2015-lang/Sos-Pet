# Métricas Tier 0 do funil de cartaz

- **Data:** 2026-07-06
- **Status:** aprovada

## Contexto
Precisamos medir se o cartaz de resgate gera **abertura, geração, compartilhamento, scan e contato** —
hoje o cartaz existe (`SOSAlertCard` + QR → `/pets/[id]`), mas não havia nenhuma medição do funil, então
não dava para saber se o QR converte nem onde o funil vaza.

## Decisão
Usar **GA4 via `trackEvent`** (`lib/analytics`) com **consentimento estrito** (só dispara quando o
consentimento de analytics foi explicitamente concedido) — **sem schema, sem banco, sem endpoint/API**.
Adicionar **`?src=cartaz`** à URL do QR para atribuir o scan; o QR continua apontando para `/pets/[id]`,
só com o query param. Tier 1 (eventos first-party em tabela) fica como **melhoria futura** se o GA4 não
bastar.

## Motivo
Validar o funil do cartaz **sem criar complexidade** (nenhuma migração/RLS) nem **coletar PII**,
reutilizando a infra de analytics + consentimento já existente.

## Impacto
- Eventos: `cartaz_open`, `cartaz_generated`, `cartaz_shared`, `cartaz_scan_visit`, `pet_contact_click`.
- Arquivos: `lib/analytics/cartaz-funnel.ts` (helper), `components/rescue/RescueLauncher.tsx`,
  `app/resgate/page.tsx` (`?src=cartaz`), `components/analytics/CartazVisitTracker.tsx`,
  `components/pets/PetContactButtons.tsx`, `app/pets/[id]/page.tsx`.
- Sem mudança de schema, RLS, auth ou SEO. QR segue resolvendo `/pets/[id]` correto.
- Gates: typecheck ✅, build ✅ (70/70), vitest ✅.

## Privacidade
Sem telefone, nome, e-mail, endereço completo ou IP. Apenas **`pet_id`, `src` e `channel`**. Respeita o
consentimento existente (`hasAnalyticsConsent`).

## Validação pendente
- **GA4 DebugView:** confirmar disparo real dos 5 eventos nos momentos certos.
- **Escanear o PNG real** do cartaz e confirmar `cartaz_scan_visit` com `src=cartaz` + chegada em
  `/pets/[id]` correto.
- Testar com **consentimento negado** → nenhum evento dispara.

## Referências
- Spec: `.claude/specs/cartaz-metrics/spec.md`
- Commit: `b85bfb7` (feat: track rescue poster funnel)
- Relacionado: `docs/decisions/2026-07-05-rescue-poster-qr.md`
