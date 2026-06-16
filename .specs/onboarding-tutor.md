---
name: onboarding-tutor
status: done
priority: 2
depends_on: []
completed_at: 2026-06-16
---

# Onboarding do Tutor — Pós-Registro

## Problema
Após criar conta, o usuário cai em `/dashboard` vazio sem saber o que fazer.
Taxa de abandono alta no pós-registro.

## O que implementar

### 1. Fluxo `/cadastro` (já existe a rota, implementar o conteúdo)
- Passo 1: Dados do perfil (nome, telefone, cidade) — salva em `profiles`
- Passo 2: "Tem um pet?" → Sim → vai para cadastrar pet | Não → vai para /achados-e-perdidos
- Passo 3 (opcional): Cadastrar primeiro pet — formulário simplificado (nome, espécie, foto)

### 2. Redirect pós-registro
- Após confirmar email → `/cadastro` (não `/dashboard`)
- Checar em `app/auth/callback/route.ts`: se `profiles.nome IS NULL` → redirecionar para `/cadastro`

### 3. Progress bar no onboarding
- Componente `components/onboarding/OnboardingProgress.tsx`
- 3 steps: Perfil → Tipo de usuário → Primeiro pet

### 4. Skip
- Botão "Pular por agora" em qualquer step → vai para `/achados-e-perdidos`
- Salvar `profiles.onboarding_completed = true` ao completar ou pular

### 5. Migration
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
```

## Harness gate
```bash
npm run typecheck && npm run build
```

## Critério de aceite
- Novo usuário é redirecionado para `/cadastro` após confirmar email
- Completar todos os passos → redireciona para `/meus-pets`
- Pular → redireciona para `/achados-e-perdidos`
- Usuário que já fez onboarding não é redirecionado de volta
