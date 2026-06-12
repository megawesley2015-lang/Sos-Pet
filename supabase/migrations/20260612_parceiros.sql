-- ============================================================
-- Migration: Parceiros B2B — adiciona status_parceiro em prestadores
-- Data: 2026-06-12
-- A tabela parceiros já existe — esta migration apenas adiciona o campo
-- ============================================================

ALTER TABLE public.prestadores
  ADD COLUMN IF NOT EXISTS status_parceiro TEXT
  CHECK (status_parceiro IN ('aguardando_aprovacao','ativo','inativo'));

CREATE INDEX IF NOT EXISTS idx_prestadores_status_parceiro
  ON public.prestadores (status_parceiro)
  WHERE status_parceiro IS NOT NULL;
