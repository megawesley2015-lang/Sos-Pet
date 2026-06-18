-- ============================================================
-- RPC: incremento atômico de report_count em sightings
-- ============================================================
-- Substitui o padrão read-then-write da rota
-- POST /api/sightings/[id]/report, que tinha race condition sob
-- denúncias concorrentes no mesmo avistamento (B3).
--
-- Faz o UPDATE ... RETURNING num único statement (atômico) e
-- esconde o avistamento ao atingir o limite de 3 denúncias.
--
-- SECURITY DEFINER: a rota precisa incrementar/ocultar um sighting
-- que o usuário não é dono. Escopo limitado a um contador + status.
-- search_path fixo evita injeção de search_path.
--
-- Idempotente: CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION public.increment_sighting_report_count(p_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE public.sightings
     SET report_count = COALESCE(report_count, 0) + 1
   WHERE id = p_id
  RETURNING report_count INTO new_count;

  IF new_count IS NULL THEN
    RETURN 0;  -- sighting inexistente
  END IF;

  IF new_count >= 3 THEN
    UPDATE public.sightings SET status = 'hidden' WHERE id = p_id;
  END IF;

  RETURN new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_sighting_report_count(uuid) TO authenticated;
