# CONSTITUIÇÃO TÉCNICA — SOS Pet Aumigo
# Nível SDD: Spec-anchored
# Harness: TypeScript + ESLint + Build + Vitest
# Highermind: .claude/skills/sos-pet-orchestrator-v2
# ─────────────────────────────────────────────────────────────────────────────
# CLAUDE.md — SOS Pet Aumigo
# Contrato de Contexto entre Claude Code e o Projeto
# Versão: 1.1.0 | Atualizado: 2026-06-08
# ─────────────────────────────────────────────────────────────────────────────
# INSTRUÇÕES PARA O CLAUDE:
# Este arquivo é lido automaticamente pelo Claude Code a cada sessão.
# Ele substitui qualquer explicação manual do projeto.
# Antes de gerar qualquer código, leia este arquivo na íntegra.
# ─────────────────────────────────────────────────────────────────────────────

## PRODUTO

**Nome:** SOS Pet Aumigo
**Missão:** Plataforma SaaS para localização de pets perdidos e conexão com
prestadores de serviços pet na Baixada Santista.
**Região:** Santos, Guarujá, São Vicente, Cubatão, Bertioga, Praia Grande,
Mongaguá, Itanhaém, Peruíbe.
**Modelo de negócio:** Gratuito para tutores + monetização B2B/Premium.
**Público:** Tutores, protetores, voluntários, clínicas, pet shops.

---

## STACK COMPLETA

```
CAMADA          TECNOLOGIA                          VERSÃO
──────────────────────────────────────────────────────────
Frontend        Next.js (App Router, Turbopack)     16.1.1
Runtime         React                               19.2.3
Estilos         Tailwind CSS v4 (CSS Variables)     4.x
Mapas           Leaflet                             1.9.4
Deploy          Vercel (CI/CD via branch main)      ✓
Imagens UI      next/image + html-to-image          ✓

Banco           Supabase (PostgreSQL)               ✓
Auth            Supabase Auth (Email + PKCE)        ✓
Storage         Supabase Storage                    ✓
Client SSR      @supabase/ssr                       ✓
Client Browser  @supabase/supabase-js               ^2.90.0

Automação       n8n (self-hosted ou cloud)          ✓
Agentes IA      Claude (Anthropic) / Gemini         ✓
Memória         Window Buffer / Supabase Postgres   ✓

Linguagem       TypeScript strict + JavaScript/JSX  ✓
Validação       Zod                                 ✓
Import alias    @/* → ./*                           ✓
```

---

## ENCODING — REGRA ABSOLUTA

```
ENCODING DO PROJETO: UTF-8 em todos os arquivos, sem exceção.

✗ NUNCA salvar arquivo em Latin-1, ISO-8859-1 ou Windows-1252
✗ NUNCA usar entidades HTML para caracteres PT-BR (ã, ç, é, etc.)
✗ NUNCA escapar caracteres acentuados em strings TypeScript

✓ SEMPRE: ã á à â é ê í ó ô õ ú ç — diretamente no código
✓ SEMPRE: Emojis são válidos em textos PT-BR de interface
✓ SEMPRE: Strings de interface em PT-BR com acentuação direta

Exemplo CORRETO:
  const mensagem = "Pet não encontrado na região de Guarujá"
  placeholder="Nome do animal (ex: Mel, Bolinha, Princesa)"

Exemplo ERRADO:
  const mensagem = "Pet não encontrado na região de Guarujá"
  placeholder="Nome do animal (ex: Mel, Bolinha, Princesa)" (sem acento)
```

---

## BANCO DE DADOS — SCHEMA ATIVO

### Tabelas existentes (não recriar, usar ALTER TABLE)

```sql
-- ─────────────────────────────────────────
-- TABELA: profiles
-- ─────────────────────────────────────────
-- id           UUID → auth.users (PK)
-- nome         TEXT
-- telefone     TEXT
-- cidade       TEXT
-- tipo_usuario TEXT CHECK IN ('tutor', 'prestador')
-- created_at   TIMESTAMPTZ DEFAULT NOW()
-- updated_at   TIMESTAMPTZ DEFAULT NOW()
-- RLS: SELECT/UPDATE apenas pelo próprio auth.uid()

-- ─────────────────────────────────────────
-- TABELA: pets (Achados e Perdidos)
-- ─────────────────────────────────────────
-- ATENÇÃO: schema real em INGLÊS (não PT-BR como era antes)
-- id            UUID DEFAULT gen_random_uuid() (PK)
-- owner_id      UUID → auth.users (FK, NOT NULL)  [era user_id]
-- name          TEXT NOT NULL                      [era nome]
-- species       TEXT ['dog','cat','bird','other']   [era especie]
-- kind          TEXT CHECK IN ('lost','found')      [era status perdido/encontrado]
-- status        TEXT CHECK IN ('active','resolved','removed')
-- breed         TEXT                               [era raca]
-- color         TEXT
-- description   TEXT                               [era descricao]
-- photo_url     TEXT (Storage: bucket pet-images)
-- neighborhood  TEXT
-- city          TEXT                               [era cidade]
-- state         TEXT
-- latitude      FLOAT8
-- longitude     FLOAT8
-- contact_name  TEXT  → APENAS visível em /pets/[id], NUNCA na listagem
-- contact_phone TEXT  → APENAS visível em /pets/[id], NUNCA na listagem
-- contact_whatsapp BOOLEAN
-- created_at    TIMESTAMPTZ DEFAULT NOW()
-- View pública: pets_public (exclui contact_* — usar em listagens)
-- RLS: SELECT público via pets_public / INSERT+UPDATE+DELETE auth.uid() = owner_id

-- ─────────────────────────────────────────
-- TABELA: prestadores
-- ─────────────────────────────────────────
-- id             UUID DEFAULT gen_random_uuid() (PK)
-- user_id        UUID → auth.users (FK)
-- nome           TEXT NOT NULL
-- categoria      TEXT NOT NULL
-- descricao      TEXT
-- telefone       TEXT
-- endereco       TEXT
-- cidade         TEXT
-- emergencia_24h BOOLEAN DEFAULT FALSE
-- avaliacao      DECIMAL(2,1)
-- created_at     TIMESTAMPTZ DEFAULT NOW()
-- RLS: SELECT público
```

### Storage

```
Bucket: pet-images (público)
Path padrão: {user_id}/{filename}
Upload: apenas authenticated
Delete: apenas o dono (verifica folder = auth.uid())
```

---

## RLS — REGRAS INVIOLÁVEIS

```
✗ NUNCA criar tabela sem ENABLE ROW LEVEL SECURITY
✗ NUNCA usar IDs inteiros → sempre UUID gen_random_uuid()
✗ NUNCA referenciar usuário sem → auth.users(id) ON DELETE CASCADE
✗ NUNCA expor service_role key no código cliente ou em variáveis NEXT_PUBLIC_

✓ SEMPRE: SELECT público onde o negócio permite (pets, prestadores)
✓ SEMPRE: INSERT/UPDATE/DELETE restritos a auth.uid() = user_id
✓ SEMPRE: Política de SELECT antes de INSERT/UPDATE
✓ SEMPRE: RLS com CREATE OR REPLACE para políticas (idempotente)

PADRÃO PARA TABELAS PÚBLICAS (pets, prestadores):
  - SELECT: TO PUBLIC → USING (true)
  - INSERT: TO authenticated → WITH CHECK (auth.uid() = user_id)
  - UPDATE: TO authenticated → USING + WITH CHECK (auth.uid() = user_id)
  - DELETE: TO authenticated → USING (auth.uid() = user_id)

PADRÃO PARA TABELAS PRIVADAS (profiles, agent_memory):
  - ALL: TO authenticated → USING (auth.uid() = user_id)
```

---

## ROTAS ATIVAS

```
ROTA                              TIPO          DESCRIÇÃO
───────────────────────────────────────────────────────────────────────
-- PÚBLICAS (route group (marketing) + (public)) --
/                                 Page          Home pública
/achados-e-perdidos               Page          Listagem pública de pets
/achados-e-perdidos/[id]          Page          Detalhe + CONTATO (só aqui)
/achados-e-perdidos/novo          Page          Formulário de cadastro
/pets/[id]                        Page          Detalhe público do pet
/prestadores                      Page          Listagem de prestadores
/prestadores/[slug]               Page          Perfil do prestador
/mapa                             Page          Mapa de avistamentos
/avistamentos                     Page          Feed de avistamentos
/avistamentos/novo                Page          Registrar avistamento
/sentinela                        Page          Rede de câmeras sentinela
/[type]-em-[city]                 Page          SEO dinâmico por cidade/espécie
/loja                             Page          Loja de plaquinhas (Printful)
/loja/[id]                        Page          Detalhe do produto
/plaquinha                        Page          Plaquinha tag pet
/dicas                            Page          Guia rápido
/parcerias                        Page          Formulário de parcerias

-- AUTH (route group (auth)) --
/login                            Page          Login/cadastro [NÃO é /auth/login]
/registro                         Page          Cadastro de conta
/esqueci-senha                    Page          Recuperação de senha
/auth/callback                    Route         Callback PKCE do Supabase

-- APP AUTENTICADO --
/meus-pets                        Page          Pets do usuário logado
/perfil/[id]                      Page          Perfil público de usuário
/cadastro                         Page          Onboarding pós-registro
/dashboard-prestador              Page          Dashboard do prestador

-- ONG (requer shelter cadastrado) --
/ong/dashboard                    Page          Dashboard ONG
/ong/pets                         Page          Pets do shelter
/ong/adocoes                      Page          Gestão de adoções
/ong/adocoes/novo                 Page          Registrar adoção
/ong/pets/[id]/vacinas            Page          Vacinas do pet
/ong/pets/[id]/medicacoes         Page          Medicações do pet
/ong/pets/[id]/prontuario         Page          Prontuário médico

-- ADMIN --
/admin                            Page          Painel admin geral
/admin/pets                       Page          Gestão de pets
/admin/prestadores                Page          Gestão de prestadores

-- API ROUTES --
/api/pets                         API Route     GET + POST
/api/pets/[id]                    API Route     GET + PATCH + DELETE
/api/pets/lost-active             API Route     GET — pets perdidos ativos
/api/ong/available-pets           API Route     GET — pets disponíveis para adoção
/api/ong/adoption/[id]            API Route     GET — detalhe de adoção
/api/user/export-data             API Route     GET — exportação LGPD
/api/sync/printful                API Route     POST — sync catálogo Printful
```

**Regra de contato:** `contato` (telefone/WhatsApp do tutor) NUNCA aparece
na listagem `/achados-e-perdidos`. APENAS na rota `/achados-e-perdidos/[id]`.
Gerar código que viola isso é um bug de segurança.

---

## COMPONENTES EXISTENTES

```
COMPONENTE                PATH                           STATUS
──────────────────────────────────────────────────────────────────
PetCard.tsx               components/pets/PetCard        ATIVO (TypeScript)
  Props: { pet: PetPublic } — usa tipo de lib/types/database.ts
  ATENÇÃO: PetCardFuturistic.jsx NÃO EXISTE mais

PetGrid.tsx               components/pets/PetGrid        ATIVO
FilterBar.tsx             components/pets/FilterBar      ATIVO
MarketingHeader.tsx       components/layout/             ATIVO
MarketingFooter.tsx       components/layout/             ATIVO
HallRreencontros.tsx      components/                    ATIVO — hall de sucessos
SOSBadge.tsx              components/ui/                 ATIVO — badges semânticos
EmergencyFAB.tsx          components/ui/                 ATIVO — botão flutuante SOS
```

**ANTES de criar qualquer novo componente:**
1. Verifique `components/` (não `src/components/` — não existe src/)
2. Verifique se o existente pode ser adaptado com props
3. Tipos de props em `lib/types/database.ts` ou `types/pets.ts`

---

## VARIÁVEIS DE AMBIENTE

```
-- OBRIGATÓRIAS --
NEXT_PUBLIC_SUPABASE_URL        → https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   → eyJ... (anon — segura no frontend)
NEXT_PUBLIC_SITE_URL            → https://dominio.vercel.app
SUPABASE_SERVICE_ROLE_KEY       → server-only, nunca NEXT_PUBLIC_

-- RATE LIMITING (obrigatório em produção) --
UPSTASH_REDIS_REST_URL          → https://precise-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN        → token longo

-- PAGAMENTOS --
MP_ACCESS_TOKEN                 → Mercado Pago (server-only)
MP_WEBHOOK_SECRET               → validação HMAC webhook MP
NEXT_PUBLIC_MP_PUBLIC_KEY       → chave pública MP (frontend)

-- LOJA --
PRINTFUL_API_KEY                → integração catálogo
SYNC_TOKEN                      → autenticação endpoint sync/printful
NEXT_PUBLIC_TAG_PRICE_BRL       → preço da plaquinha

-- COMUNICAÇÃO --
RESEND_API_KEY                  → email (server-only)
RESEND_FROM                     → remetente (era FROM_EMAIL)
N8N_ADOPTION_WEBHOOK_URL        → webhook adoções ONG

-- SEGURANÇA --
TURNSTILE_SECRET_KEY            → anti-bot formulários (server-only)
NEXT_PUBLIC_TURNSTILE_SITE_KEY  → chave pública Turnstile

-- OPCIONAIS --
NEXT_PUBLIC_GA_MEASUREMENT_ID   → Google Analytics
NEXT_PUBLIC_SENTRY_DSN          → Sentry error tracking

✗ NUNCA:
  NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY  → BLOQUEIO imediato de deploy
```

---

## PADRÕES DE CÓDIGO TYPESCRIPT

```typescript
// ✓ CORRETO — Server Component com Supabase
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()  // await obrigatório no Next.js 15+

// ✓ CORRETO — Client Component com Supabase
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// ✓ CORRETO — Select explícito (nunca *) — colunas REAIS em inglês
const { data } = await supabase
  .from('pets_public')  // view pública sem contact_*
  .select('id, name, species, kind, status, city, photo_url, created_at')
  .eq('kind', 'lost')   // era .eq('status', 'perdido')
  .eq('status', 'active')
  .order('created_at', { ascending: false })

// ✓ CORRETO — Import alias
import { PetCard } from '@/components/pets/PetCard'  // NÃO PetCardFuturistic
import { createClient } from '@/lib/supabase/server'

// ✓ CORRETO — API response helpers (obrigatório em API Routes)
import { ok, fail } from '@/lib/api-response'
return ok({ pets })          // { success: true, data: { pets } }
return fail(new Error('...')) // { success: false, error: '...', code: '...' }

// ✓ CORRETO — Formato de erro padrão
return NextResponse.json(
  { success: false, error: 'Pet não encontrado' },
  { status: 404 }
)

// ✓ CORRETO — Resposta de sucesso
return NextResponse.json(
  { success: true, data: pet },
  { status: 200 }
)

// ✗ ERRADO — select('*')
const { data } = await supabase.from('pets').select('*')

// ✗ ERRADO — any não justificado
const handler = async (req: any) => { ... }

// ✗ ERRADO — cookies sem await (Next.js 15+)
const store = cookies()   // deve ser: const store = await cookies()
```

---

## FLUXO DE DADOS

```
Usuário (Browser)
    ↓
    ▼
Vercel (Next.js App Router)
    ├── Server Components → @supabase/ssr (await createClient())
    └── Client Components → @supabase/supabase-js (createClient())
         ↓
         ▼
    Supabase
    ├── PostgreSQL (tabelas: profiles, pets, prestadores)
    ├── Auth (PKCE flow, email/password)
    └── Storage (bucket: pet-images)
         ↓
         ▼
    n8n (Webhooks / Workflows)
    ├── Trigger: INSERT/UPDATE no Supabase → webhook n8n
    ├── Agentes IA (Advanced AI Node → Tools Agent)
    │   ├── Model: Claude claude-sonnet-4-20250514
    │   └── Tools: HTTP → Supabase REST API
    └── Canais de saída: WhatsApp, Telegram, Email

Contratos de payload em todas as camadas: JSON estrito
Formato de erro: { "success": false, "error": "mensagem" }
Formato de sucesso: { "success": true, "data": {...} }
```

---

## INTEGRAÇÃO n8n — MAPA COMPLETO

### Variáveis de ambiente no n8n

```
SUPABASE_URL         → https://xxxxx.supabase.co
SUPABASE_ANON_KEY    → eyJ... (leitura pública)
SUPABASE_HOST        → db.xxxxx.supabase.co (memória persistente)
ANTHROPIC_API_KEY    → sk-ant-...
GOOGLE_API_KEY       → AIza... (Gemini — alternativa)
```

### Endpoints Supabase REST disponíveis para n8n

```
LEITURA (anon_key segura):
  GET  /rest/v1/pets          → listagem de pets
  GET  /rest/v1/pets?id=eq.{id}  → pet específico
  GET  /rest/v1/prestadores   → listagem de prestadores

ESCRITA (requer service_role no n8n — nunca no frontend):
  POST   /rest/v1/pets        → cadastrar pet
  PATCH  /rest/v1/pets?id=eq.{id}  → atualizar status
  DELETE /rest/v1/pets?id=eq.{id}  → remover pet
```

### Filtros Supabase REST (referência rápida)

```
Igual:         ?campo=eq.valor
Diferente:     ?campo=neq.valor
Contém texto:  ?campo=ilike.*termo*
Em lista:      ?campo=in.(a,b,c)
Ordenar:       &order=created_at.desc
Limitar:       &limit=10
Offset:        &offset=20
Select:        &select=campo1,campo2,campo3   → NUNCA select=*
```

### Regras de agentes n8n

```
✗ NUNCA criar agente fora do modo "Tools Agent"
✗ NUNCA usar temperature > 0.3 em agentes que acessam banco
✗ NUNCA retornar Markdown em canais de mensageria (WhatsApp/Telegram)
✗ NUNCA select=* em HTTP Tools → sempre colunas explícitas

✓ SEMPRE: agent_type: Tools Agent
✓ SEMPRE: System Message com seção REGRAS ABSOLUTAS anti-alucinação
✓ SEMPRE: max_iterations mínimo 5
✓ SEMPRE: JSON Schema de validação nas Tools
✓ SEMPRE: Memória Window Buffer para sessões curtas
✓ SEMPRE: Modelo padrão: claude-sonnet-4-20250514 (temperatura 0.3)
```

### Agentes planejados (não implementados ainda)

```
AGENTE              GATILHO                   STATUS
─────────────────────────────────────────────────────
Notificação         INSERT em pets            Semana 1
  → Tools: buscar_voluntarios_cidade()
           enviar_whatsapp(telefone, msg)
           registrar_notificacao(pet_id)

Conteúdo            status → 'resolvido'      Mês 1
  → Tools: buscar_pet(id)
           gerar_post(template, dados)
           retornar_link_compartilhavel()

Moderação           INSERT em pets            Mês 2
  → Tools: analisar_foto(url)
           checar_spam(texto)
           bloquear_registro(id, motivo)

Matching            Periódico (CRON diário)   Mês 3
  → Tools: buscar_perdidos(cidade, especie, cor)
           buscar_encontrados(cidade, especie, cor)
           registrar_match(id1, id2, confianca)
           notificar_tutor(telefone, match_id)
```

---

## DESIGN SYSTEM

```
PALETA DE CORES (Tailwind CSS v4 — @theme em globals.css):
  Primária:  Laranja âmbar  #FF851B  (--color-primary, --color-brand)
  Accent:    Teal           #20B2AA  (--color-accent)
  Ink:       Escala neutra  #0A0A0C → #F3F4F6 (--color-ink-900..50)

TEMA ESCURO (padrão):
  Fundo:     #121214  (--color-bg)
  Texto:     #FFFFFF  (--color-fg)

TEMA CLARO:
  Fundo:     #F8F9FA  (--color-bg)
  Texto:     #212529  (--color-fg)

REGRA INVIOLÁVEL: Nunca alterar a paleta sem autorização explícita.
"A paleta é intocável." — sos-pet-designer skill

COMPONENTES UI:
  ✓ Verificar src/components/ antes de criar qualquer novo componente
  ✓ Reutilizar PetCardFuturistic.jsx para cards de pets
  ✓ Tailwind v4: usar CSS variables nativas via @theme em globals.css
  ✓ Tokens semânticos: bg-primary, text-brand-500, shadow-glow-brand
```

---

## REGRAS DE DESENVOLVIMENTO

### Supabase

```
✗ CREATE TABLE sem ENABLE ROW LEVEL SECURITY
✗ IDs inteiros (SERIAL, INTEGER) → sempre UUID
✗ SELECT * em qualquer query
✗ service_role key exposta no cliente
✗ Tabelas sem trigger de updated_at (quando campo existe)

✓ CREATE TABLE IF NOT EXISTS (idempotente)
✓ id UUID DEFAULT gen_random_uuid() PRIMARY KEY
✓ user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
✓ Índices em: user_id, status, created_at
✓ Trigger update_updated_at_column com CREATE OR REPLACE
✓ ALTER TABLE quando tabela já existe (não CREATE TABLE)
```

### Next.js / TypeScript

```
✗ cookies() sem await (Next.js 15+)
✗ any não justificado com comentário
✗ Import sem alias @/ (usar sempre @/components, @/lib, etc.)
✗ Dados sensíveis em NEXT_PUBLIC_*

✓ Server Components → @supabase/ssr
✓ Client Components → @supabase/supabase-js
✓ Alias @/* em todos os imports
✓ Zod para validação de input em API Routes
✓ Tipos explícitos em todas as funções públicas
✓ params: Promise<{ id: string }> em Route Handlers (Next.js 15+)
✓ const { id } = await params  (await obrigatório)
```

### Git / Deploy

```
✗ .env.local no staging area → BLOQUEIO
✗ Commits "wip", "ajustes", "teste" para main
✗ service_role key hardcoded em qualquer arquivo

✓ Branch principal: main
✓ Commits semânticos: feat:, fix:, refactor:, docs:
✓ Pré-deploy: npm run typecheck && npm run build
✓ Rollback disponível: vercel rollback
✓ Case-sensitivity: nomes de arquivo devem bater EXATAMENTE com imports
   (Vercel é Linux → case-sensitive, diferente do Mac/Windows)
```

---

## MEMORY — RESISTÊNCIA À DEGRADAÇÃO DE CONTEXTO

```
WAL ATIVO:    SESSION-STATE.md  (atualizar ao início e fim de cada sessão)
MEMÓRIA:      ~/.claude/projects/.../memory/MEMORY.md  (persiste entre sessões)
CONSOLIDAÇÃO: A cada 5 sessões → /dream consolida SESSION-STATE → MEMORY.md

REGRA /dream:
  1. Ler SESSION-STATE.md
  2. Extrair decisões não-óbvias → salvar em memory/*.md
  3. Limpar SESSION-STATE.md → manter apenas próxima sessão
  4. Atualizar MEMORY.md index

QUANDO INICIAR UMA SESSÃO:
  ✓ Ler SESSION-STATE.md ("Próxima sessão — o que fazer primeiro")
  ✓ Confirmar estado com: npm run typecheck
  ✓ Atualizar data e objetivo em SESSION-STATE.md
```

---

## SESSÕES DE CLAUDE CODE — PROTOCOLO

```
COMO TRABALHAR COM ESTE PROJETO:

1. SESSÕES ESPECIALIZADAS (não misturar contexto):
   Sessão Frontend   → componentes, páginas, UI, Tailwind
   Sessão Backend    → API routes, Supabase queries, RLS
   Sessão SQL        → schema, migrations, políticas
   Sessão n8n        → workflows, agentes, tools
   Sessão Deploy     → checklist, env vars, Vercel

2. COMMITS PARCIAIS:
   Faça commits atômicos durante tarefas longas.
   Mensagem clara sobre o que mudou.
   Nunca acumule mudanças de contextos diferentes num commit.

3. ANTES DE CRIAR QUALQUER ARQUIVO:
   ✓ Verifique se já existe em src/
   ✓ Verifique se pode ser reutilizado
   ✓ Se criar novo: documente as props/params

4. ANTES DE QUALQUER QUERY SUPABASE:
   ✓ Confirme que a tabela existe no schema acima
   ✓ Confirme que RLS cobre a operação
   ✓ Use select explícito (nunca *)

5. VERIFICAÇÃO DE ENCODING:
   ✓ Após editar arquivo PT-BR: confirme que acentos aparecem diretos
   ✓ Nunca substituir ã/ç/é por entidades HTML ou escapes unicode

6. ATUALIZAR ESTE ARQUIVO:
   Após qualquer mudança estrutural no projeto:
   ✓ Nova tabela criada? Adicionar no SCHEMA ATIVO
   ✓ Nova rota? Adicionar em ROTAS ATIVAS
   ✓ Novo componente? Adicionar em COMPONENTES EXISTENTES
   ✓ Nova variável de ambiente? Adicionar em VARIÁVEIS
```

---

## CHECKLIST PRÉ-RESPOSTA (Claude deve verificar antes de gerar código)

```
[ ] O encoding está UTF-8 com acentos diretos?
[ ] O import usa alias @/ ?
[ ] O select do Supabase é explícito (sem *)?
[ ] A tabela referenciada existe no schema?
[ ] A operação tem RLS cobrindo ela?
[ ] O contato do tutor só aparece na rota /[id]?
[ ] A variável de ambiente sensível tem prefixo NEXT_PUBLIC_?
[ ] O componente já existe antes de criar um novo?
[ ] O formato de erro segue { success: false, error: '...' }?
[ ] O agente n8n usa mode Tools Agent?
```

---

## DÚVIDAS TÉCNICAS CONHECIDAS

```
[ ] Sem rate limiting nas rotas /api → implementar Upstash Ratelimit
[ ] Sem testes automatizados → vitest + testing-library (instalados)
[ ] n8n sem monitoramento de execuções falhas → configurar alertas
[ ] Geolocalização via GPS no formulário de cadastro → pós-MVP
[ ] Matching automático via IA → mês 3
[ ] Notificação push (PWA) → pós-MVP
[ ] Tipos RPC Supabase (incrementar_clique_whatsapp) → regenerar com:
    npx supabase gen types typescript --project-id enpgqgqinbdbvkqtnria > lib/types/database.ts
```

---

## HIGHERMIND — ORQUESTRADOR DE SPECS

```
INVOCAR:  /sos-pet-orchestrator-v2 spec=specs/<módulo>/tasks.md
REGISTRY: specs/index.md  (lista todos os módulos + status)

PIPELINE POR TAREFA:
  1. Lê tasks.md → identifica próxima tarefa pendente
  2. Executa seguindo notação EARS da spec
  3. Gate: npm run typecheck && npm run build
  4. Marca tarefa concluída no tasks.md

MÓDULOS ATIVOS:
  ong-module → specs/ong-module/tasks.md  (T3–T9 pendentes)

HARNESS GLOBAL:
  npm run typecheck  → obrigatório após Edit/Write (hook PostToolUse ativo)
  npm run build      → obrigatório pré-commit
```

---

## SKILLS DISPONÍVEIS (Claude Code pode acionar)

```
-- PROJETO SOS Pet Aumigo --
sos-pet-orchestrator-v2   → Highermind — executa tasks.md com harness gate
manifesto-de-contexto     → Este arquivo + contexto completo do projeto
supabase-architect        → Gerar SQL completo + RLS + tipos TypeScript
n8n-agent-blueprint       → Configurar agentes n8n completos
sos-pet-designer          → Design system + componentes UI
backend-review            → Auditoria e correção de código backend
debug-integration-tripler → Debug de erros Vercel → n8n → Supabase
deploy-checklist          → Verificação pré-deploy em 5 camadas
frontend-design-review    → Revisão de UI/UX existente

-- HARNESS (revfactory/harness v1.2.0) --
harness                   → Meta-fábrica de equipes de agentes
                            Uso: "Build a harness for [domínio]"
                            Gera .claude/agents/ + .claude/skills/ automaticamente
                            Padrões: Pipeline, Fan-out/Fan-in, Expert Pool,
                                     Producer-Reviewer, Supervisor, Hierarchical
                            Requer: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
                            Agents dir: .claude/agents/ (criado e pronto)
                            Refs: .claude/skills/harness/references/

-- SUPERPOWERS (obra/superpowers) --
brainstorming                   → Design antes de código — gate obrigatório pré-implementação
test-driven-development         → TDD rígido — RED→GREEN→REFACTOR, sem exceções
writing-plans                   → Plano de implementação com tarefas de 2-5 min
executing-plans                 → Executa plano task a task com commits atômicos
subagent-driven-development     → Fresh subagent por task + revisão em 2 estágios
dispatching-parallel-agents     → Despacha 3+ agentes paralelos para problemas independentes
systematic-debugging            → Debug com investigação de causa raiz obrigatória
verification-before-completion  → Evidência antes de declarar qualquer coisa "pronto"
requesting-code-review          → Revisão de código via subagente com severidade
receiving-code-review           → Recebe feedback: READ→VERIFY→RESPOND→IMPLEMENT, sem performatividade
using-git-worktrees             → Workspace isolado por feature branch
finishing-a-development-branch  → Finaliza branch: merge/PR/discard com validação
using-superpowers               → Meta-skill: mapa e prioridade de invocação
writing-skills                  → TDD aplicado a documentação — cria skills testados antes de deploy
```

---

*CLAUDE.md — SOS Pet Aumigo | Não commitar informações sensíveis neste arquivo.*
*Atualizar após cada mudança estrutural no projeto.*
