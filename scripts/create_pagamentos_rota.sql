-- Criação da tabela pagamentos_rota para relacionar com rotas
CREATE TABLE IF NOT EXISTS pagamentos_rota (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rota_id UUID NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
  forma_pagamento VARCHAR(50) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  data_pagamento TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para atualizar o timestamp de updated_at
CREATE TRIGGER update_pagamentos_rota_updated_at
BEFORE UPDATE ON pagamentos_rota
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE pagamentos_rota ENABLE ROW LEVEL SECURITY;

-- Adicionar políticas de acesso
-- Permitir que todos os usuários autenticados possam visualizar
CREATE POLICY "Todos podem visualizar pagamentos de rota"
ON pagamentos_rota FOR SELECT
TO authenticated
USING (true);

-- Apenas administradores e gerentes podem inserir, atualizar ou excluir
CREATE POLICY "Admins e gerentes podem gerenciar pagamentos de rota"
ON pagamentos_rota
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'gerente')
  )
);

-- Adicionar índices para melhorar a performance
CREATE INDEX idx_pagamentos_rota_rota_id ON pagamentos_rota(rota_id); 