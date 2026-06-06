-- ============================================================
-- Migration: 20260601_parceiros_display
-- Adiciona colunas de exibição à tabela parceiros
--
-- Contexto: a tabela parceiros era só lead capture (formulário /parcerias).
-- Agora serve também como vitrine de parceiros aprovados na home (/FaixaParceiros)
-- e na página /prestadores.
--
-- Idempotente: usa IF NOT EXISTS em todos os blocos.
-- ============================================================

-- 1. Colunas de exibição pública
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parceiros' AND column_name='cidade') THEN
    ALTER TABLE public.parceiros ADD COLUMN cidade TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parceiros' AND column_name='logo_url') THEN
    ALTER TABLE public.parceiros ADD COLUMN logo_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parceiros' AND column_name='site_url') THEN
    ALTER TABLE public.parceiros ADD COLUMN site_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parceiros' AND column_name='verificado') THEN
    ALTER TABLE public.parceiros ADD COLUMN verificado BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parceiros' AND column_name='ativo') THEN
    ALTER TABLE public.parceiros ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parceiros' AND column_name='categoria_parceiro') THEN
    ALTER TABLE public.parceiros ADD COLUMN categoria_parceiro TEXT
      CHECK (categoria_parceiro IN ('veterinario','petshop','adestrador','hospedagem','banho_tosa','ong','outro'));
  END IF;
END $$;

-- 2. Índice para a query da FaixaParceiros (filtra ativo=true)
CREATE INDEX IF NOT EXISTS parceiros_ativo_idx ON public.parceiros (ativo) WHERE ativo = true;

-- 3. Policy SELECT público para parceiros aprovados/ativos
-- (antes: só admin via service_role conseguia ler)
DROP POLICY IF EXISTS "parceiros_select_ativos" ON public.parceiros;
CREATE POLICY "parceiros_select_ativos" ON public.parceiros
  FOR SELECT
  USING (ativo = true);

-- Comentário para o dev:
-- Para aprovar um parceiro que veio pelo formulário /parcerias:
--   UPDATE parceiros SET
--     ativo = true,
--     verificado = true,
--     cidade = 'Santos, SP',
--     categoria_parceiro = 'veterinario',
--     site_url = 'https://...'
--   WHERE id = '<uuid>';
--
-- Para adicionar um parceiro direto (sem ter passado pelo form):
--   INSERT INTO parceiros (nome, email, cidade, logo_url, site_url, verificado, ativo, categoria_parceiro, status)
--   VALUES ('Clínica Vida Animal', 'contato@vidaanimal.com.br', 'Santos, SP',
--           '<url-logo>', 'https://...', true, true, 'veterinario', 'aprovado');
