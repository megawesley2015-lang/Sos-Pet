# Spec — SEO Dinâmico com ISR
# SDD Fase 1: ESPECIFICAR (O QUÊ — sem tecnologia)
# Notação: EARS (Easy Approach to Requirements Syntax)
# Status: ⬜ Pendente
# Slug: seo-dinamico
# Responsável: Wes
# Data: 2026-06-10

---

## Contexto de Negócio

Tutores que perdem um pet geralmente fazem buscas no Google como "cachorro perdido em Santos"
ou "gato encontrado em Guarujá". A plataforma precisa ranquear nessas buscas para que o
tutor chegue ao Pet Aumigo organicamente. A rota dinâmica `/[type]-em-[city]` já existe no
CLAUDE.md mas ainda não está implementada com geração estática. Com ISR (Incremental Static
Regeneration), as páginas são geradas uma vez e revalidadas periodicamente, garantindo SEO
forte sem custo de processamento por request. Um sitemap automático fecha o ciclo.

## Estado Atual

| Item | Status |
|---|---|
| Rota `/[type]-em-[city]` | Listada em CLAUDE.md, não implementada |
| Sitemap | Não existe (`/sitemap.xml`) |
| Metatags Open Graph | Presentes apenas na home |
| `generateStaticParams` | Não implementado |
| Cidades da Baixada Santista | Listadas em CLAUDE.md |

## Cidades e Tipos Suportados

**Cidades:** santos, guaruja, sao-vicente, cubatao, bertioga, praia-grande, mongagua, itanhaem, peruibe

**Tipos de busca:**
- `cachorro-perdido` → `species=dog, kind=lost`
- `gato-perdido` → `species=cat, kind=lost`
- `cachorro-encontrado` → `species=dog, kind=found`
- `gato-encontrado` → `species=cat, kind=found`
- `pet-perdido` → `kind=lost` (sem filtro de espécie)
- `pet-encontrado` → `kind=found` (sem filtro de espécie)

## Requisitos — Notação EARS

### 2.1 Geração Estática das Páginas SEO

WHEN o build do Next.js executa
THE SYSTEM SHALL gerar estaticamente todas as combinações de `type × city`
(6 tipos × 9 cidades = 54 páginas).

THE SYSTEM SHALL usar `generateStaticParams` retornando todos os 54 pares.

THE SYSTEM SHALL usar `revalidate = 3600` (ISR: revalidar a cada 1 hora).

IF a combinação `type + city` não tiver nenhum pet ativo
THE SYSTEM SHALL renderizar a página sem retornar 404 (página existe, mas com estado vazio).

### 2.2 Conteúdo da Página SEO

WHEN um visitante acessa `/cachorro-perdido-em-santos`
THE SYSTEM SHALL exibir:
- `<title>` e `<h1>`: "Cachorros perdidos em Santos — Pet Aumigo"
- `<meta name="description">`: "Veja os cachorros perdidos em Santos. Ajude a reunir famílias com seus pets na Baixada Santista."
- Open Graph: `og:title`, `og:description`, `og:image` (imagem do pet mais recente ou imagem padrão)
- Lista de até 24 pets filtrados por `species` e `kind` e `city`
- Link canonical: `https://{SITE_URL}/cachorro-perdido-em-santos`

WHEN a página lista pets
THE SYSTEM SHALL reutilizar o componente `PetCard` existente.

WHEN o visitante clica em um pet
THE SYSTEM SHALL redirecionar para `/pets/[id]`.

### 2.3 URL Slugs e Parsing

WHEN a URL `/cachorro-perdido-em-santos` é acessada
THE SYSTEM SHALL parsear `type = 'cachorro-perdido'` e `city = 'santos'` do path.

THE SYSTEM SHALL normalizar a cidade para o formato usado no banco
(ex: `sao-vicente` → `São Vicente` para a query SQL).

IF `type` não estiver na lista permitida
THEN THE SYSTEM SHALL retornar `notFound()` do Next.js (404).

IF `city` não estiver na lista de cidades suportadas
THEN THE SYSTEM SHALL retornar `notFound()` do Next.js (404).

### 2.4 Sitemap Automático

WHEN um crawler acessa `/sitemap.xml`
THE SYSTEM SHALL retornar um sitemap XML incluindo:
- Rotas estáticas: `/`, `/achados-e-perdidos`, `/prestadores`, `/mapa`, `/loja`, etc.
- Todas as 54 páginas SEO dinâmicas
- Rotas de pets individuais: `/pets/[id]` para todos os pets `status = 'active'`
- Priority: home = 1.0, SEO pages = 0.8, pets individuais = 0.6

THE SYSTEM SHALL usar `next-sitemap` ou rota nativa `app/sitemap.ts`.

THE SYSTEM SHALL incluir `lastmod` nas páginas de pets (usando `updated_at`).

---

## Critérios de Aceitação

- [ ] `npm run build` gera as 54 páginas sem erro
- [ ] `/cachorro-perdido-em-santos` tem `<title>` correto
- [ ] `<meta name="description">` presente e específico para cada combinação type+city
- [ ] Open Graph completo com imagem
- [ ] Pets filtrados corretamente por espécie e tipo
- [ ] URL com type inválido retorna 404
- [ ] URL com city inválida retorna 404
- [ ] `/sitemap.xml` retorna XML válido
- [ ] Sitemap inclui todas as 54 páginas SEO
- [ ] `revalidate = 3600` configurado (ISR)
- [ ] `npm run typecheck` sem erros
