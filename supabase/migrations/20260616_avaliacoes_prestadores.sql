-- ============================================================
-- Migration: Sistema de Avaliações de Prestadores
-- Data: 2026-06-16
-- ============================================================

-- 1. Campos de avaliação na tabela prestadores
ALTER TABLE public.prestadores
  ADD COLUMN IF NOT EXISTS media_avaliacoes  DECIMAL(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_avaliacoes  INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verificado        BOOLEAN      NOT NULL DEFAULT FALSE;

-- 2. Tabela de avaliações
CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id  UUID    NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  user_id       UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nota          INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(prestador_id, user_id)
);

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- SELECT público
DROP POLICY IF EXISTS "avaliacoes_select_public" ON public.avaliacoes;
CREATE POLICY "avaliacoes_select_public"
  ON public.avaliacoes FOR SELECT
  USING (true);

-- INSERT: apenas autenticado, user_id = auth.uid()
DROP POLICY IF EXISTS "avaliacoes_insert_auth" ON public.avaliacoes;
CREATE POLICY "avaliacoes_insert_auth"
  ON public.avaliacoes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: apenas o autor
DROP POLICY IF EXISTS "avaliacoes_update_auth" ON public.avaliacoes;
CREATE POLICY "avaliacoes_update_auth"
  ON public.avaliacoes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: apenas o autor
DROP POLICY IF EXISTS "avaliacoes_delete_auth" ON public.avaliacoes;
CREATE POLICY "avaliacoes_delete_auth"
  ON public.avaliacoes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_avaliacoes_prestador
  ON public.avaliacoes (prestador_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_user
  ON public.avaliacoes (user_id);

-- 4. Função de atualização da média
CREATE OR REPLACE FUNCTION sync_prestador_avaliacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_media  DECIMAL(3,2);
  v_total  INTEGER;
  v_pid    UUID;
BEGIN
  -- Identifica o prestador_id independente do tipo de operação
  IF TG_OP = 'DELETE' THEN
    v_pid := OLD.prestador_id;
  ELSE
    v_pid := NEW.prestador_id;
  END IF;

  SELECT COALESCE(AVG(nota), 0), COUNT(*)
    INTO v_media, v_total
    FROM public.avaliacoes
    WHERE prestador_id = v_pid;

  UPDATE public.prestadores
    SET media_avaliacoes = v_media,
        total_avaliacoes = v_total
    WHERE id = v_pid;

  RETURN NEW;
END;
$$;

-- 5. Trigger na tabela avaliacoes
DROP TRIGGER IF EXISTS trg_sync_avaliacao ON public.avaliacoes;
CREATE TRIGGER trg_sync_avaliacao
  AFTER INSERT OR UPDATE OR DELETE ON public.avaliacoes
  FOR EACH ROW EXECUTE FUNCTION sync_prestador_avaliacao();
