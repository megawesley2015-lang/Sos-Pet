# Requirements — Auth

**Status:** ✅ Implementado
**Slug:** auth

---

## O que o sistema faz

WHEN um novo usuário se registra via `/registro`
THE SYSTEM SHALL criar conta no Supabase Auth (PKCE flow) e criar row em `profiles` via trigger.

WHEN um usuário confirma o email e faz login via `/login`
THE SYSTEM SHALL iniciar sessão com cookie seguro (SSR via @supabase/ssr) e redirecionar para `/meus-pets`.

WHEN um usuário acessa rota protegida sem sessão ativa
THE SYSTEM SHALL redirecionar para `/login` via middleware.

WHEN um token de sessão está corrompido/expirado
THE SYSTEM SHALL fazer cleanup automático (handleAuthError) e redirecionar para login sem quebrar a navegação.

WHEN um usuário solicita redefinição de senha
THE SYSTEM SHALL enviar email via Resend com link de redefinição que usa getBaseUrl() dinâmico.

---

## Fora do escopo

- OAuth (Google, Facebook) — pós-MVP
- 2FA — pós-MVP

---

## Estado atual

- [x] Login + registro + esqueci/redefinir senha
- [x] PKCE flow via auth/callback/route.ts
- [x] Middleware de proteção de rotas
- [x] handleAuthError + getSessionSafe + getUserSafe
- [x] Trigger Supabase: cria profiles on auth.users insert
- [x] getBaseUrl() dinâmico para emailRedirectTo
