-- =====================================================
-- SQL MIGRATIONS - SOS PET PACOTE COMPLETO
-- Execute no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. ATUALIZAR TABELA PRESTADORES
-- Adicionar colunas para os novos filtros
-- =====================================================

ALTER TABLE prestadores 
ADD COLUMN IF NOT EXISTS emergencia24h BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS agendamento_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
ADD COLUMN IF NOT EXISTS media_avaliacoes DECIMAL(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_avaliacoes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_prestadores_cidade ON prestadores(cidade);
CREATE INDEX IF NOT EXISTS idx_prestadores_categoria ON prestadores(categoria);
CREATE INDEX IF NOT EXISTS idx_prestadores_status ON prestadores(status);
CREATE INDEX IF NOT EXISTS idx_prestadores_emergencia ON prestadores(emergencia24h);
CREATE INDEX IF NOT EXISTS idx_prestadores_slug ON prestadores(slug);

-- =====================================================
-- 2. CRIAR TABELA DE AVALIAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prestador_id UUID NOT NULL REFERENCES prestadores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  autor_nome VARCHAR(100) NOT NULL,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  servico_utilizado VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_avaliacoes_prestador ON avaliacoes(prestador_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_nota ON avaliacoes(nota);

-- RLS
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

-- Políticas: qualquer um pode ler, usuários logados podem criar suas próprias
CREATE POLICY "Avaliacoes são públicas" ON avaliacoes 
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem criar avaliações" ON avaliacoes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar suas avaliações" ON avaliacoes 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas avaliações" ON avaliacoes 
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 3. CRIAR TABELA DE ESTATÍSTICAS DO PRESTADOR
-- =====================================================

CREATE TABLE IF NOT EXISTS prestador_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prestador_id UUID NOT NULL UNIQUE REFERENCES prestadores(id) ON DELETE CASCADE,
  visualizacoes INTEGER DEFAULT 0,
  cliques_whatsapp INTEGER DEFAULT 0,
  total_avaliacoes INTEGER DEFAULT 0,
  media_notas DECIMAL(2,1) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE prestador_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stats são públicas para leitura" ON prestador_stats 
  FOR SELECT USING (true);

-- =====================================================
-- 4. CRIAR TABELA DE AVISOS (TICKER)
-- =====================================================

CREATE TABLE IF NOT EXISTS avisos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mensagem TEXT NOT NULL,
  emoji VARCHAR(10) DEFAULT '📢',
  link VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  prioridade INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- RLS
ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Avisos ativos são públicos" ON avisos 
  FOR SELECT USING (ativo = true);

-- Inserir avisos iniciais
INSERT INTO avisos (mensagem, emoji, link, ativo, prioridade) VALUES
  ('Bem-vindo ao SOS Pet! Ajudando pets na Baixada Santista 🐾', '🐾', NULL, true, 1),
  ('Perdeu seu pet? Cadastre agora e receba ajuda da comunidade', '🚨', '/achados-e-perdidos/cadastrar', true, 2),
  ('ONGs e protetores: tornem-se parceiros AUmigos!', '🤝', '/parcerias', true, 3);

-- =====================================================
-- 5. CRIAR TABELA DE PARCEIROS
-- =====================================================

CREATE TABLE IF NOT EXISTS parceiros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  descricao TEXT,
  site VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pendente',
  verificado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE parceiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parceiros aprovados são públicos" ON parceiros 
  FOR SELECT USING (status = 'aprovado');

CREATE POLICY "Qualquer um pode solicitar parceria" ON parceiros 
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 6. FUNÇÕES PARA INCREMENTAR CONTADORES
-- =====================================================

-- Função para incrementar visualizações
CREATE OR REPLACE FUNCTION incrementar_visualizacao_prestador(prestador_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO prestador_stats (prestador_id, visualizacoes)
  VALUES (prestador_id, 1)
  ON CONFLICT (prestador_id)
  DO UPDATE SET 
    visualizacoes = prestador_stats.visualizacoes + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para incrementar cliques no WhatsApp
CREATE OR REPLACE FUNCTION incrementar_clique_whatsapp(prestador_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO prestador_stats (prestador_id, cliques_whatsapp)
  VALUES (prestador_id, 1)
  ON CONFLICT (prestador_id)
  DO UPDATE SET 
    cliques_whatsapp = prestador_stats.cliques_whatsapp + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGER PARA ATUALIZAR MÉDIA DE AVALIAÇÕES
-- =====================================================

CREATE OR REPLACE FUNCTION atualizar_media_prestador()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE prestadores 
  SET 
    media_avaliacoes = (
      SELECT ROUND(AVG(nota)::numeric, 1) 
      FROM avaliacoes 
      WHERE prestador_id = COALESCE(NEW.prestador_id, OLD.prestador_id)
    ),
    total_avaliacoes = (
      SELECT COUNT(*) 
      FROM avaliacoes 
      WHERE prestador_id = COALESCE(NEW.prestador_id, OLD.prestador_id)
    )
  WHERE id = COALESCE(NEW.prestador_id, OLD.prestador_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_atualizar_media ON avaliacoes;
CREATE TRIGGER trigger_atualizar_media
AFTER INSERT OR UPDATE OR DELETE ON avaliacoes
FOR EACH ROW EXECUTE FUNCTION atualizar_media_prestador();

-- =====================================================
-- 8. ATUALIZAR TABELA PETS (FILTRO POR CIDADE)
-- =====================================================

ALTER TABLE pets 
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);

-- Índice para busca por cidade
CREATE INDEX IF NOT EXISTS idx_pets_cidade ON pets(cidade);

-- =====================================================
-- FIM DAS MIGRATIONS
-- =====================================================

-- VERIFICAR SE TUDO FOI CRIADO:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'prestadores';
