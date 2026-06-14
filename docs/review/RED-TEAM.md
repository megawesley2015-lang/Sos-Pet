# RED-TEAM — Auditoria Adversarial Pet Aumigo
**Agente**: verifier | **Metodologia**: OpenSpec Spec-anchored
**Total**: 2 CRÍTICO · 3 ALTO · 4 MÉDIO · 1 BAIXO

---

## PONTOS POSITIVOS CONFIRMADOS

- `contact_phone` de pets **não vaza** em `/pets/page.tsx` nem em `PetCard.tsx`/`PetGrid.tsx` — a view `pets_public` e o select explícito funcionam corretamente.
- `SUPABASE_SERVICE_ROLE_KEY` não tem prefixo `NEXT_PUBLIC_` e não aparece em componentes cliente.
- RLS habilitado em todas as tabelas do módulo ONG: `shelters`, `shelter_pets`, `medical_records`, `vaccinations`, `medications`, `adoptions`.
- Webhook Mercado Pago com validação HMAC-SHA256 correta.
- XSS em JSON-LD mitigado via `JSON.stringify()`.
- Rate limiting funcional nas rotas principais `/api/pets` e `/api/pets/[id]`.

---

## VULNERABILIDADES

### VULN-001: Vazamento de `adopter_phone` na listagem de adoções da ONG
**Severidade**: CRÍTICO
**Vetor**: Qualquer usuário autenticado com shelter cadastrado acessa `/ong/adocoes`. A query seleciona explicitamente `adopter_phone` (linha 46) e esse campo é renderizado diretamente na listagem.
**Arquivo**: `app/ong/adocoes/page.tsx:46`
**Impacto**: Coleta massiva de telefones de adotantes. Violação LGPD arts. 6 e 18.
**Mitigação**: Remover `adopter_phone` do select na listagem. O campo deve aparecer apenas em `/ong/adocoes/[id]`.
**EARS**: SE um usuário acessa a listagem `/ong/adocoes` ENTÃO O SISTEMA DEVE omitir `adopter_phone` e `adopter_email` do select, expondo-os apenas em `/ong/adocoes/[id]`.

---

### VULN-002: Rate limiting ineficaz — fallback in-memory bypassa em Vercel serverless
**Severidade**: CRÍTICO
**Vetor**: `lib/rate-limit.ts:62-88` usa `Map` em memória como fallback quando Upstash não está configurado. Na Vercel, cada invocação serverless pode ser instância separada — o Map reinicia por instância. Um atacante distribui requisições entre múltiplas instâncias e bypassa completamente o sliding window. Sem Upstash configurado = rate limiting zero em produção.
**Arquivo**: `lib/rate-limit.ts:29-31` (verificação de Upstash), `lib/rate-limit.ts:62-88` (fallback in-memory)
**Impacto**: Scraping ilimitado de `/api/pets`, spam de cadastro, varredura de todos os telefones via `get_pet_contact` RPC.
**Mitigação**: (1) Configurar `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` como variáveis obrigatórias em produção. (2) Adicionar verificação de startup que bloqueia o deploy se `NODE_ENV=production` e Upstash ausente.
**EARS**: SE a aplicação inicializa em `NODE_ENV=production` sem `UPSTASH_REDIS_REST_URL` configurada ENTÃO O SISTEMA DEVE lançar erro fatal "Rate limiter Redis não configurado".

---

### VULN-003: `select('*')` no admin/pets expõe `contact_phone` em listagem admin
**Severidade**: ALTO
**Vetor**: `app/admin/pets/page.tsx:24` usa `.select("*")` — inclui `contact_phone`, `contact_name`, `contact_whatsapp`. A linha 120-124 renderiza `contact_phone` em texto claro na listagem.
**Arquivo**: `app/admin/pets/page.tsx:22-26`, `app/admin/pets/page.tsx:120-124`
**Impacto**: Conta admin comprometida = acesso imediato a todos os telefones. Viola menor privilégio e CLAUDE.md.
**Mitigação**: Substituir `select("*")` por colunas explícitas sem `contact_*`.

---

### VULN-004: RPC `get_pet_contact` sem rate limiting — scraping de telefones via API pública
**Severidade**: ALTO
**Vetor**: Disponível para `anon` sem limitação. Atacante enumera UUIDs de `pets_public` e chama `POST /rest/v1/rpc/get_pet_contact` para cada um. Com 200 pets = 200 requests = todos os contatos em segundos.
**Arquivo**: `supabase/migrations/20260504_hardening.sql:89-106` (TODO documentado)
**Impacto**: Coleta massiva de telefones. Violação LGPD.
**Mitigação**: Adicionar `checkRateLimit` no Server Action que chama a RPC. Limite: 10 chamadas/hora por IP.

---

### VULN-005: 4 rotas de API sem rate limiting
**Severidade**: ALTO
**Vetor**: `GET /api/pets/lost-active` (usa serviceClient, sem limite), `GET /api/user/export-data` (retorna contact_phone de todos os pets), `GET /api/ong/available-pets`, `GET /api/ong/adoption/[id]` — todas sem `checkRateLimit`. Spec `specs/rate-limiting/tasks.md` documenta T1-T3 como `⬜ Pendente`.
**Impacto**: `/api/pets/lost-active` usa `createServiceClient()` — bypassa RLS. `/api/user/export-data` retorna dados pessoais completos sem limite.
**Mitigação**: Implementar tasks T1-T3 conforme `specs/rate-limiting/tasks.md`.

---

### VULN-006: Cadastro de sentinela sem Turnstile — bots podem poluir o mapa
**Severidade**: MÉDIO
**Vetor**: `app/sentinela/novo/actions.ts:56` usa `createServiceClient()` sem captcha. Diferente do cadastro de pets (que exige Turnstile).
**Impacto**: Poluição do mapa da Rede Sentinela com câmeras falsas.
**Mitigação**: Adicionar Turnstile ao Server Action `cadastrarSentinela`.

---

### VULN-007: Cadastro de avistamentos sem Turnstile
**Severidade**: MÉDIO
**Vetor**: `app/avistamentos/actions.ts:41` usa `createServiceClient()` sem captcha. Bot pode criar avistamentos falsos para qualquer `pet_id` válido.
**Impacto**: Tutores recebem alertas de localização falsos para pets perdidos.
**Mitigação**: Adicionar Turnstile ao formulário de avistamento anônimo.

---

### VULN-008: `GET /api/sync/printful` expõe blueprint de ataque sem autenticação
**Severidade**: MÉDIO
**Vetor**: Handler GET retorna JSON público com método, headers esperados e exemplo curl com `SYNC_TOKEN`.
**Arquivo**: `app/api/sync/printful/route.ts:61-71`
**Mitigação**: Remover o handler GET ou retornar `{ ok: true }` sem metadados.

---

### VULN-009: IP spoofing via `x-forwarded-for` bypassa rate limiting
**Severidade**: MÉDIO
**Vetor**: `lib/rate-limit.ts:113` usa `x-forwarded-for` como chave — manipulável pelo cliente antes de chegar à edge.
**Arquivo**: `lib/rate-limit.ts:110-117`
**Mitigação**: Usar `x-real-ip` ou `x-vercel-forwarded-for` (injetado pela Vercel, não manipulável) como chave primária.

---

### VULN-010: `dangerouslySetInnerHTML` com `themeScript` — risco futuro de XSS
**Severidade**: BAIXO
**Vetor**: `app/layout.tsx:88` injeta `themeScript` no `<head>`. Conteúdo atual é hardcoded (não é XSS). Risco: se dados dinâmicos forem interpolados sem sanitização no futuro.
**Arquivo**: `app/layout.tsx:88`, `lib/theme-script.ts`
**Mitigação**: Adicionar comentário explícito em `lib/theme-script.ts` proibindo interpolação de dados externos.
