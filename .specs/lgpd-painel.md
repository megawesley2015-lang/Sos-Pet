---
name: lgpd-painel
status: pending
priority: 3
depends_on: []
---

# Painel LGPD — Dados do Usuário

## O que implementar

### 1. Rota já existe: `GET /api/user/export-data`
- Verificar implementação atual e completar se parcial
- Deve retornar: perfil, pets cadastrados, avistamentos, histórico de adoções
- Formato: JSON downloadável

### 2. UI em `/perfil` ou `/configuracoes`
- Seção "Seus Dados (LGPD)"
- Botão "Baixar meus dados" → chama `/api/user/export-data` → download JSON
- Botão "Excluir minha conta" → modal de confirmação → DELETE em `auth.users` (cascade delete)

### 3. API de exclusão
- `DELETE /api/user/account`
- Requer: confirmação de senha ou código de email
- Ação: `supabase.auth.admin.deleteUser(userId)` — cascade via FK

### 4. Email de confirmação de exclusão
- Usar Resend: template "Sua conta foi excluída"
- Enviar após exclusão bem-sucedida

## Harness gate
```bash
npm run typecheck && npm run build
```

## Critério de aceite
- Download JSON contém todos os dados do usuário
- Exclusão de conta remove todos os dados (cascade verifica)
- Email de confirmação enviado via Resend
- Fluxo funciona sem erros TypeScript
