# Tasks — Sistema de Email Transacional
# SDD Fase 3: DECOMPOR
# Status geral: ✅ Concluído — 2026-06-12
# Referências: spec.md

---

## T1 — Instalar Resend SDK e criar migration `email_logs`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivos:**
- `package.json`
- `supabase/migrations/20260610_email_logs.sql` (novo)

### O que fazer
1. Verificar se `resend` está no `package.json`; se não, instalar com `npm install resend`
2. Criar tabela `email_logs`:
   - `id UUID PK DEFAULT gen_random_uuid()`
   - `to_email_hash TEXT NOT NULL` — SHA256 do email (nunca plaintext)
   - `template_name TEXT NOT NULL`
   - `status TEXT CHECK IN ('sent','failed') NOT NULL`
   - `error_message TEXT`
   - `resend_id TEXT` — ID retornado pela API Resend (para debugging)
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
3. ENABLE ROW LEVEL SECURITY — SELECT apenas service_role (logs são privados)
4. Índices: `(template_name, status)`, `(to_email_hash, template_name)` — para verificar duplicatas de follow-up

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] `resend` no `package.json`
- [ ] `email_logs` sem campo de email plaintext
- [ ] RLS: usuários comuns não acessam email_logs
- [ ] Índice `(to_email_hash, template_name)` para deduplicação eficiente

---

## T2 — Função centralizada `lib/email/send.ts`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `lib/email/send.ts` (novo)

### Especificação EARS
THE SYSTEM SHALL usar função centralizada `sendEmail` que loga tentativas e falha silenciosamente.

### O que fazer
1. Importar `Resend` de `resend`; instanciar com `process.env.RESEND_API_KEY`
2. Função `sendEmail(params: SendEmailParams): Promise<void>`:
   ```ts
   interface SendEmailParams {
     to: string
     subject: string
     html: string
     templateName: string
   }
   ```
3. Se `!process.env.RESEND_API_KEY`: `console.warn('RESEND_API_KEY não configurado')` e retornar
4. Try/catch com retry único em 429: `if (error.statusCode === 429) { await sleep(1000); retry once }`
5. Logar em `email_logs` via Supabase usando `createClient()` (service_role no server):
   - `to_email_hash`: `crypto.createHash('sha256').update(to.toLowerCase()).digest('hex')`
   - `status = 'sent'` ou `status = 'failed'`
6. Nunca lançar exceção — apenas logar e retornar
7. Exportar também `hasEmailBeenSent(toEmail: string, templateName: string): Promise<boolean>` para deduplicação

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] Sem `RESEND_API_KEY`, função retorna sem erro
- [ ] `to_email_hash` é SHA256 do email (verificável)
- [ ] Erro de Resend (exceto 429) é logado e função retorna sem throw
- [ ] `hasEmailBeenSent` consulta `email_logs` por hash + template_name
- [ ] `npm run typecheck` sem erros

---

## T3 — Templates de email HTML

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `lib/email/templates.ts` (novo)

### O que fazer
1. Criar funções de template que retornam HTML string (não React Email — HTML simples e compatível):
   - `petConfirmationTemplate({ petName, petId, photoUrl, species, siteUrl }): string`
   - `matchFoundTemplate({ petName, matchPetName, matchCity, matchPhotoUrl, matchId, score, siteUrl }): string`
   - `adoptionConfirmationTemplate({ petName, petId, photoUrl, adopterName, siteUrl }): string`
   - `petFollowUpTemplate({ petName, petId, daysSinceLost, siteUrl }): string`
2. HTML deve ser tabela-based simples e compatível com clientes de email (Outlook, Gmail)
3. Usar inline CSS — sem classes externas
4. Incluir logo/nome "Pet Aumigo" no header
5. Usar cores da paleta: `#FF851B` (laranja) para botões CTA, `#121214` (dark) para header
6. CTA buttons: `<a href="..." style="background:#FF851B;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Texto</a>`
7. Footer com link para descadastrar alertas (link futuro — pode ser `{siteUrl}/perfil/configuracoes`)

### Harness Commands
```bash
npm run typecheck
npx vitest run email-sistema
```

### Critério de Aceite
- [ ] Cada template retorna HTML string válido
- [ ] Templates sem CSS externo (apenas inline)
- [ ] Nenhuma tag de script no HTML
- [ ] `petName` e outros dados são sanitizados (sem injeção HTML) — usar `escapeHtml`
- [ ] `npm run typecheck` sem erros

---

## T4 — Integrar email de confirmação em `POST /api/pets`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/api/pets/route.ts`

### Especificação EARS
WHEN pet é cadastrado com sucesso
THE SYSTEM SHALL enviar email ao tutor fire-and-forget.

### O que fazer
1. Após INSERT bem-sucedido, buscar email do tutor via `profiles.email` (ou `auth.users.email`)
2. Se email disponível: chamar `sendEmail({ to: email, subject: '...', html: petConfirmationTemplate(...), templateName: 'pet_confirmation' })`
3. Usar `void sendEmail(...)` — não aguardar (fire-and-forget)
4. Resposta da API não deve mudar nem atrasar por causa do email

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] `POST /api/pets` responde em tempo normal (email não bloqueia)
- [ ] Email é enviado após cadastro bem-sucedido
- [ ] Falha no email não retorna erro na API
- [ ] `npm run typecheck` sem erros

---

## T5 — Email de match e follow-up de 7 dias

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivos:**
- `app/api/matching/run/route.ts` (editar — integrar email)
- `app/api/email/follow-up/route.ts` (novo — para CRON)

### O que fazer
**Matching (editar T3 do módulo matching-ia):**
1. Após criar match com `confidence_score >= 0.70`, buscar email do tutor do pet perdido
2. Chamar `sendEmail` com `matchFoundTemplate` — fire-and-forget

**Follow-up CRON:**
1. `POST /api/email/follow-up` com `Authorization: Bearer {FOLLOW_UP_SECRET}`
2. Buscar pets `kind = 'lost', status = 'active', created_at <= NOW() - INTERVAL '7 days'`
3. Para cada pet: `hasEmailBeenSent(ownerEmail, 'pet_follow_up')` — se false, enviar
4. Retornar `{ success: true, data: { sent, skipped } }`
5. Documentar CRON n8n: Schedule `0 10 * * *` UTC → `POST /api/email/follow-up`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Follow-up enviado apenas para pets com > 7 dias sem resolução
- [ ] Segundo CRON no mesmo pet não reenvia (deduplicação via `hasEmailBeenSent`)
- [ ] Email de match enviado para score >= 0.70
- [ ] `npm run typecheck` sem erros

---

## T6 — Testes de templates e deduplicação

**Fase SDD:** Verificar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `tests/email-sistema/email-sistema.test.ts` (novo)

### O que fazer
1. Testar `petConfirmationTemplate`: HTML gerado contém `petName` e `petId`
2. Testar `matchFoundTemplate`: HTML contém score em porcentagem
3. Testar sanitização: `petName = '<script>alert(1)</script>'` — HTML deve escapar
4. Testar `to_email_hash`: mesmo email → mesmo hash (determinístico)
5. Mock do Resend para testar `sendEmail` sem envio real
6. Testar `sendEmail` sem `RESEND_API_KEY` — retorna sem erro

### Harness Commands
```bash
npx vitest run email-sistema
```

### Critério de Aceite
- [ ] Pelo menos 8 casos de teste
- [ ] Sanitização de HTML testada
- [ ] Hash SHA256 determinístico verificado
- [ ] Todos os testes passam

---

## Ordem de Execução

T1 → T2 → T3 → T4 → T5 → T6

**Dependências:**
- T2 depende de T1 (tabela email_logs)
- T3 pode ser feito em paralelo com T2 (sem DB)
- T4 depende de T2 e T3
- T5 depende de T2 e T3
- T6 depende de T2 e T3

## Harness Global

```bash
npm run typecheck
npx vitest run email-sistema
npm run build
```

