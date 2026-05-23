# CI / Monitoramento — Guia de Configuração

## Visão Geral

O projeto SOS Pet tem **duas camadas de proteção automática**:

| Camada | Ferramenta | Quando ativa | O que detecta |
|--------|-----------|--------------|---------------|
| Pré-deploy | GitHub Actions CI | Em todo `git push` | Erros de TypeScript, lint, build quebrado |
| Runtime | Sentry | Em produção (Vercel) | Erros que acontecem enquanto usuários usam o app |

---

## 1. GitHub Actions CI

### O que já foi criado
Arquivo: `.github/workflows/ci.yml`

Roda automaticamente em todo push para `main` ou `develop`:
1. TypeScript typecheck (`tsc --noEmit`)
2. ESLint
3. Next.js build
4. Testes unitários (Vitest)

Se qualquer etapa falhar → Vercel **não faz o deploy**.

### Configurar os Secrets no GitHub

Acesse: `github.com/SEU-USUARIO/sos-pet` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Adicione estes secrets:

| Nome do Secret | Onde encontrar |
|---------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry → Project → Settings → Client Keys (DSN) |
| `SENTRY_AUTH_TOKEN` | Sentry → User Settings → Auth Tokens → Create |

> ⚠️ Sem os dois primeiros, o `next build` vai falhar. Os de Sentry são opcionais.

### Bloquear deploy na Vercel (importante)

1. Acesse `vercel.com` → seu projeto → **Settings** → **Git**
2. Ative: **"Required Checks"** ou **"Deployment Protection"**
3. Selecione o check `CI passou ✓` como obrigatório

---

## 2. Sentry — Monitoramento de Erros em Produção

O Sentry **já está instalado** no projeto (`@sentry/nextjs`). Só precisa do DSN.

### Criar conta e projeto no Sentry

1. Acesse [sentry.io](https://sentry.io) e crie uma conta gratuita
2. Crie um novo projeto: **Next.js**
3. Copie o DSN (parece com `https://abc123@o123.ingest.sentry.io/456`)

### Adicionar na Vercel

Acesse `vercel.com` → projeto → **Settings** → **Environment Variables**:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SENTRY_DSN` | O DSN copiado acima |
| `SENTRY_AUTH_TOKEN` | Token de autenticação do Sentry (para source maps) |

### O que o Sentry captura automaticamente

- Erros de JavaScript em produção
- Erros de Server Actions
- Rotas com erro 500
- Performance (load time das páginas)

Cada erro mostra: qual usuário, qual página, stack trace completo.

---

## 3. Testes Unitários (Vitest)

### Instalar (uma vez na sua máquina)

```bash
npm install
```

### Rodar os testes

```bash
# Rodar uma vez
npm run test

# Modo watch (fica rodando enquanto você edita)
npm run test:watch

# Interface visual no browser
npm run test:ui
```

### Estrutura dos testes

```
__tests__/
  utils/
    format.test.ts        → formatPhone, whatsappLink, labels
  pets/
    validation.test.ts    → createPetSchema, validatePhoto
  matching/
    score.test.ts         → algoritmo de compatibilidade de pets
  auth/
    validation.test.ts    → loginSchema, registerSchema
```

### Adicionar novo teste

Crie um arquivo `__tests__/<modulo>/nome.test.ts` e use:

```typescript
import { describe, it, expect } from "vitest";

describe("Nome do módulo", () => {
  it("faz o que deveria fazer", () => {
    expect(minhaFuncao("input")).toBe("resultado esperado");
  });
});
```

---

## Fluxo completo após a configuração

```
Você faz git push
       ↓
GitHub Actions roda (typecheck + lint + build + testes)
       ↓
    Passou?
   /       \
 Sim        Não
  ↓           ↓
Vercel      Você recebe e-mail do GitHub
deploy      com o erro exato — sem gastar token
  ↓
App em produção
  ↓
Sentry monitora erros em tempo real
  ↓
Se algo quebrar → e-mail automático para você
```
