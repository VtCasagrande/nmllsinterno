-- Criação da tabela itens_rota para relacionar com rotas
CREATE TABLE IF NOT EXISTS itens_rota (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rota_id UUID NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
  descricao VARCHAR(255) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para atualizar o timestamp de updated_at
CREATE TRIGGER update_itens_rota_updated_at
BEFORE UPDATE ON itens_rota
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE itens_rota ENABLE ROW LEVEL SECURITY;

-- Adicionar políticas de acesso
-- Permitir que todos os usuários autenticados possam visualizar
CREATE POLICY "Todos podem visualizar itens de rota"
ON itens_rota FOR SELECT
TO authenticated
USING (true);

-- Apenas administradores e gerentes podem inserir, atualizar ou excluir
CREATE POLICY "Admins e gerentes podem gerenciar itens de rota"
ON itens_rota
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'gerente')
  )
);

-- Adicionar índices para melhorar a performance
CREATE INDEX idx_itens_rota_rota_id ON itens_rota(rota_id); 