---
name: avaliacoes-prestadores
status: pending
priority: 2
depends_on: []
---

# Sistema de Avaliações de Prestadores

## O que implementar

### 1. Tabela Supabase
```sql
CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prestador_id UUID REFERENCES prestadores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nota INTEGER CHECK (nota BETWEEN 1 AND 5) NOT NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prestador_id, user_id) -- 1 avaliação por usuário por prestador
);
-- RLS: SELECT público, INSERT/UPDATE/DELETE = auth.uid() = user_id
```

### 2. API Routes
- `POST /api/prestadores/[id]/avaliacoes` — criar avaliação (auth obrigatório)
- `GET /api/prestadores/[id]/avaliacoes` — listar avaliações (público)

### 3. Atualizar média automaticamente
- Trigger Supabase `update_prestador_avaliacao()` atualiza `prestadores.avaliacao` após INSERT/UPDATE/DELETE em `avaliacoes`

### 4. UI em `/prestadores/[slug]`
- Seção "Avaliações" com lista de comentários + estrelas
- Formulário de avaliação (visível apenas para usuário logado, oculto se já avaliou)
- Stars component: `components/ui/StarRating.tsx`

## Harness gate
```bash
npm run typecheck && npm run build
```

## Critério de aceite
- Usuário logado pode avaliar (1–5 estrelas + comentário opcional)
- Média em `prestadores.avaliacao` atualiza automaticamente via trigger
- Usuário não pode avaliar o mesmo prestador duas vezes (UNIQUE constraint)
- Lista de avaliações visível sem login
