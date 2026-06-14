-- ─────────────────────────────────────────────────────────────────────────────
-- AI-First OS — Tabelas de infraestrutura de agentes
-- Migration: 20260613_ai_agents.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── agent_logs ────────────────────────────────────────────────────────────────
-- Registra cada execução de agente (triagem, moderação, matching, notificação)

CREATE TABLE IF NOT EXISTS agent_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name  TEXT NOT NULL CHECK (agent_name IN ('triagem', 'moderacao', 'matching', 'notificacao')),
  pet_id      UUID REFERENCES pets(id) ON DELETE CASCADE,
  status      TEXT NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
  input_summary  TEXT,
  output_summary TEXT,
  latency_ms  INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_logs_pet_id_idx    ON agent_logs(pet_id);
CREATE INDEX IF NOT EXISTS agent_logs_agent_idx     ON agent_logs(agent_name);
CREATE INDEX IF NOT EXISTS agent_logs_created_idx   ON agent_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS agent_logs_status_idx    ON agent_logs(status);

ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

-- Apenas service_role escreve; admin lê
CREATE POLICY "agent_logs_admin_select" ON agent_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── pet_ai_data ───────────────────────────────────────────────────────────────
-- Armazena dados enriquecidos pelo Agente de Triagem

CREATE TABLE IF NOT EXISTS pet_ai_data (
  pet_id                 UUID PRIMARY KEY REFERENCES pets(id) ON DELETE CASCADE,
  tags                   TEXT[]      DEFAULT '{}',
  descricao_enriquecida  TEXT,
  caracteristicas        JSONB       DEFAULT '{}',
  palavras_chave         TEXT[]      DEFAULT '{}',
  confianca              FLOAT8      DEFAULT 0,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pet_ai_data_tags_idx ON pet_ai_data USING GIN(tags);
CREATE INDEX IF NOT EXISTS pet_ai_data_kw_idx   ON pet_ai_data USING GIN(palavras_chave);

ALTER TABLE pet_ai_data ENABLE ROW LEVEL SECURITY;

-- Leitura pública (ajuda na busca)
CREATE POLICY "pet_ai_data_public_select" ON pet_ai_data
  FOR SELECT TO PUBLIC
  USING (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_pet_ai_data_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_pet_ai_data_updated_at ON pet_ai_data;
CREATE TRIGGER set_pet_ai_data_updated_at
  BEFORE UPDATE ON pet_ai_data
  FOR EACH ROW EXECUTE FUNCTION update_pet_ai_data_updated_at();
