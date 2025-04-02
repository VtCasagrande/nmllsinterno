-- Configuração inicial do schema para o projeto Nmalls

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====== FUNÇÕES UTILITÁRIAS ======

-- Trigger para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar um novo registro de log automaticamente
CREATE OR REPLACE FUNCTION log_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO logs (usuario_id, acao, descricao, entidade, entidade_id)
  VALUES (auth.uid(), 
          TG_ARGV[0]::log_action, 
          TG_ARGV[1], 
          TG_ARGV[2]::log_entity, 
          NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para gerar códigos únicos
CREATE OR REPLACE FUNCTION generate_unique_code(prefix text, table_name text, column_name text)
RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean;
  counter integer := 1;
BEGIN
  LOOP
    -- Gerar código com prefixo + número de 3 dígitos
    new_code := prefix || LPAD(counter::text, 3, '0');
    
    -- Verificar se o código já existe na tabela
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE %I = %L)', table_name, column_name, new_code)
    INTO code_exists;
    
    EXIT WHEN NOT code_exists;
    counter := counter + 1;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ====== TIPOS ENUMERADOS ======

-- Tipos para profiles
CREATE TYPE user_role AS ENUM ('admin', 'gerente', 'operador', 'motorista');

-- Tipos para motoristas
CREATE TYPE driver_status AS ENUM ('ativo', 'inativo', 'em_rota');

-- Tipos para rotas
CREATE TYPE route_status AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');

-- Tipos para devoluções
CREATE TYPE return_status AS ENUM ('pendente', 'em_analise', 'finalizado', 'cancelado');
CREATE TYPE return_reason AS ENUM ('produto_danificado', 'produto_incorreto', 'cliente_desistiu', 'endereco_nao_encontrado', 'outro');

-- Tipos para logs
CREATE TYPE log_action AS ENUM ('login', 'logout', 'create', 'update', 'delete', 'view', 'complete');
CREATE TYPE log_entity AS ENUM ('auth', 'devolucoes', 'rotas', 'motoristas', 'usuarios', 'produtos');

-- Tipos para sugestões
CREATE TYPE suggestion_urgency AS ENUM ('baixa', 'media', 'alta');
CREATE TYPE suggestion_status AS ENUM ('criado', 'em_analise', 'aprovado', 'rejeitado', 'concluido');

-- Tipos para trocas
CREATE TYPE troca_tipo AS ENUM ('enviada', 'recebida');
CREATE TYPE troca_status AS ENUM ('pendente', 'em_andamento', 'aguardando_devolucao', 'coletado', 'concluida', 'cancelada');

-- Tipos para avisos
CREATE TYPE aviso_prioridade AS ENUM ('baixa', 'normal', 'alta');
CREATE TYPE aviso_status AS ENUM ('ativo', 'arquivado');
CREATE TYPE aviso_destinatario AS ENUM ('todos', 'grupo', 'usuarios');
CREATE TYPE aviso_reacao AS ENUM ('concordar', 'discordar', 'verificado');

-- ====== TABELAS PRINCIPAIS ======

-- Tabela de perfis (estende a auth.users padrão do Supabase)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'operador',
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela de motoristas
CREATE TABLE motoristas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  veiculo VARCHAR(100) NOT NULL,
  placa VARCHAR(20) NOT NULL,
  cnh VARCHAR(20) NOT NULL,
  status driver_status NOT NULL DEFAULT 'inativo',
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  last_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_motoristas_updated_at
BEFORE UPDATE ON motoristas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela de rotas
CREATE TABLE rotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  motorista_id UUID REFERENCES motoristas(id),
  data_entrega DATE NOT NULL,
  destino TEXT NOT NULL,
  observacoes TEXT,
  status route_status NOT NULL DEFAULT 'pendente',
  
  -- Campos adicionais para gerenciamento da entrega
  cliente_nome VARCHAR(255),
  cliente_telefone VARCHAR(20),
  cliente_email VARCHAR(255),
  endereco_completo TEXT,
  cidade VARCHAR(100),
  cep VARCHAR(10),
  complemento VARCHAR(255),
  
  -- Campos para rastreamento e confirmação de entrega
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_entrega_efetiva TIMESTAMP WITH TIME ZONE,
  assinatura_url TEXT,
  data_assinatura TIMESTAMP WITH TIME ZONE,
  responsavel_recebimento VARCHAR(255),
  observacoes_entrega TEXT,
  
  -- Campos para rastreamento de localização
  ultima_latitude DECIMAL(10, 6),
  ultima_longitude DECIMAL(10, 6),
  ultima_atualizacao_local TIMESTAMP WITH TIME ZONE,
  
  created_by UUID NOT NULL REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_rotas_updated_at
BEFORE UPDATE ON rotas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela de produtos em rotas
CREATE TABLE produtos_rota (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rota_id UUID NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_produtos_rota_updated_at
BEFORE UPDATE ON produtos_rota
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela de devoluções
CREATE TABLE devolucoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  produto VARCHAR(255) NOT NULL,
  motivo return_reason NOT NULL,
  descricao TEXT,
  status return_status NOT NULL DEFAULT 'pendente',
  data_recebimento DATE NOT NULL,
  responsavel_id UUID NOT NULL REFERENCES profiles(id),
  atribuido_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_devolucoes_updated_at
BEFORE UPDATE ON devolucoes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela de fotos de devoluções
CREATE TABLE devolucoes_fotos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  devolucao_id UUID NOT NULL REFERENCES devolucoes(id) ON DELETE CASCADE,
  url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de comentários de devoluções
CREATE TABLE devolucoes_comentarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  devolucao_id UUID NOT NULL REFERENCES devolucoes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES profiles(id),
  comentario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de logs do sistema
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES profiles(id),
  acao log_action NOT NULL,
  descricao TEXT NOT NULL,
  entidade log_entity NOT NULL,
  entidade_id VARCHAR(100),
  ip VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de sugestões
CREATE TABLE sugestoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ean VARCHAR(20) NOT NULL,
  nome_produto VARCHAR(255) NOT NULL,
  fornecedor VARCHAR(100),
  cliente VARCHAR(255),
  telefone_cliente VARCHAR(20),
  urgencia suggestion_urgency NOT NULL DEFAULT 'media',
  status suggestion_status NOT NULL DEFAULT 'criado',
  observacao TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_sugestoes_updated_at
BEFORE UPDATE ON sugestoes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela de comentários de sugestões
CREATE TABLE sugestoes_comentarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sugestao_id UUID NOT NULL REFERENCES sugestoes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES profiles(id),
  texto TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de trocas
CREATE TABLE trocas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo troca_tipo NOT NULL,
  status troca_status NOT NULL DEFAULT 'pendente',
  ean VARCHAR(20) NOT NULL,
  nome_produto VARCHAR(255) NOT NULL,
  loja_parceira VARCHAR(255) NOT NULL,
  responsavel VARCHAR(255) NOT NULL,
  telefone_responsavel VARCHAR(20),
  motivo TEXT NOT NULL,
  observacoes TEXT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_trocas_updated_at
BEFORE UPDATE ON trocas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela de comentários de trocas
CREATE TABLE trocas_comentarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  troca_id UUID NOT NULL REFERENCES trocas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES profiles(id),
  texto TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de avisos
CREATE TABLE avisos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(255) NOT NULL,
  conteudo TEXT NOT NULL,
  tipo_destinatario aviso_destinatario NOT NULL DEFAULT 'todos',
  grupos TEXT[] DEFAULT NULL,
  usuarios UUID[] DEFAULT NULL,
  prioridade aviso_prioridade NOT NULL DEFAULT 'normal',
  status aviso_status NOT NULL DEFAULT 'ativo',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_avisos_updated_at
BEFORE UPDATE ON avisos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela de visualizações de avisos
CREATE TABLE avisos_visualizacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aviso_id UUID NOT NULL REFERENCES avisos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(aviso_id, usuario_id)
);

-- Tabela de reações a avisos
CREATE TABLE avisos_reacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aviso_id UUID NOT NULL REFERENCES avisos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES profiles(id),
  tipo aviso_reacao NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(aviso_id, usuario_id)
);

-- Tabela de fotos de entrega
CREATE TABLE fotos_entrega (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rota_id UUID NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
  url VARCHAR(255) NOT NULL,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de histórico de localização durante entregas
CREATE TABLE localizacoes_entrega (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rota_id UUID NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
  motorista_id UUID NOT NULL REFERENCES profiles(id),
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====== TRIGGERS PARA GERAÇÃO DE CÓDIGOS ======

-- Trigger para gerar código de rota automaticamente
CREATE OR REPLACE FUNCTION generate_rota_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS NULL THEN
    NEW.codigo := generate_unique_code('RT', 'rotas', 'codigo');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_rota_code
BEFORE INSERT ON rotas
FOR EACH ROW
WHEN (NEW.codigo IS NULL)
EXECUTE FUNCTION generate_rota_code();

-- Trigger para gerar código de devolução automaticamente
CREATE OR REPLACE FUNCTION generate_devolucao_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS NULL THEN
    NEW.codigo := generate_unique_code('DV', 'devolucoes', 'codigo');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_devolucao_code
BEFORE INSERT ON devolucoes
FOR EACH ROW
WHEN (NEW.codigo IS NULL)
EXECUTE FUNCTION generate_devolucao_code();

-- ====== RLS (ROW LEVEL SECURITY) POLICIES ======

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_rota ENABLE ROW LEVEL SECURITY;
ALTER TABLE devolucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE devolucoes_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE devolucoes_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sugestoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sugestoes_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE trocas ENABLE ROW LEVEL SECURITY;
ALTER TABLE trocas_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos_visualizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos_reacoes ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Usuários podem ver seus próprios perfis"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins e gerentes podem ver todos os perfis"
ON profiles FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('admin', 'gerente')
));

CREATE POLICY "Admins podem editar todos os perfis"
ON profiles FOR UPDATE
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

-- Policies para motoristas
CREATE POLICY "Todos podem ver motoristas"
ON motoristas FOR SELECT
USING (true);

CREATE POLICY "Admins e gerentes podem editar motoristas"
ON motoristas FOR ALL
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('admin', 'gerente')
));

CREATE POLICY "Motoristas podem atualizar sua própria localização"
ON motoristas FOR UPDATE
USING (auth.uid() = profile_id)
WITH CHECK (
  auth.uid() = profile_id AND
  OLD.id = NEW.id AND
  OLD.profile_id = NEW.profile_id AND
  OLD.veiculo = NEW.veiculo AND
  OLD.placa = NEW.placa AND
  OLD.cnh = NEW.cnh
);

-- Policies para rotas
CREATE POLICY "Todos podem ver rotas"
ON rotas FOR SELECT
USING (true);

CREATE POLICY "Admins, gerentes e operadores podem criar e editar rotas"
ON rotas FOR ALL
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('admin', 'gerente', 'operador')
));

-- Policies para produtos_rota
CREATE POLICY "Todos podem ver produtos de rotas"
ON produtos_rota FOR SELECT
USING (true);

CREATE POLICY "Admins, gerentes e operadores podem criar e editar produtos de rotas"
ON produtos_rota FOR ALL
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('admin', 'gerente', 'operador')
));

-- Policies para devoluções
CREATE POLICY "Todos podem ver devoluções"
ON devolucoes FOR SELECT
USING (true);

CREATE POLICY "Admins, gerentes e operadores podem gerenciar devoluções"
ON devolucoes FOR ALL
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('admin', 'gerente', 'operador')
));

-- Policies para fotos de devoluções
CREATE POLICY "Todos podem ver fotos de devoluções"
ON devolucoes_fotos FOR SELECT
USING (true);

CREATE POLICY "Admins, gerentes e operadores podem gerenciar fotos de devoluções"
ON devolucoes_fotos FOR ALL
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('admin', 'gerente', 'operador')
));

-- Policies para comentários de devoluções
CREATE POLICY "Todos podem ver comentários de devoluções"
ON devolucoes_comentarios FOR SELECT
USING (true);

CREATE POLICY "Usuarios podem criar seus próprios comentários"
ON devolucoes_comentarios FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Admins podem gerenciar todos os comentários"
ON devolucoes_comentarios FOR ALL
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

-- Policies para logs
CREATE POLICY "Apenas admins podem ver logs"
ON logs FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

-- Policies para sugestões
CREATE POLICY "Todos podem ver sugestões"
ON sugestoes FOR SELECT
USING (true);

CREATE POLICY "Admins, gerentes e operadores podem gerenciar sugestões"
ON sugestoes FOR ALL
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('admin', 'gerente', 'operador')
));

-- Policies para comentários de sugestões
CREATE POLICY "Todos podem ver comentários de sugestões"
ON sugestoes_comentarios FOR SELECT
USING (true);

CREATE POLICY "Usuarios podem criar seus próprios comentários em sugestões"
ON sugestoes_comentarios FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Admins podem gerenciar todos os comentários em sugestões"
ON sugestoes_comentarios FOR ALL
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

-- Policies para trocas
CREATE POLICY "Todos podem ver trocas"
ON trocas FOR SELECT
USING (true);

CREATE POLICY "Admins, gerentes e operadores podem gerenciar trocas"
ON trocas FOR ALL
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('admin', 'gerente', 'operador')
));

-- Policies para comentários de trocas
CREATE POLICY "Todos podem ver comentários de trocas"
ON trocas_comentarios FOR SELECT
USING (true);

CREATE POLICY "Usuarios podem criar seus próprios comentários em trocas"
ON trocas_comentarios FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Admins podem gerenciar todos os comentários em trocas"
ON trocas_comentarios FOR ALL
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

-- Policies para avisos
CREATE POLICY "Todos podem ver avisos"
ON avisos FOR SELECT
USING (true);

CREATE POLICY "Admins e gerentes podem gerenciar avisos"
ON avisos FOR ALL
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('admin', 'gerente')
));

-- Policies para visualizações de avisos
CREATE POLICY "Todos podem ver visualizações de avisos"
ON avisos_visualizacoes FOR SELECT
USING (true);

CREATE POLICY "Usuarios podem registrar suas próprias visualizações"
ON avisos_visualizacoes FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- Policies para reações a avisos
CREATE POLICY "Todos podem ver reações a avisos"
ON avisos_reacoes FOR SELECT
USING (true);

CREATE POLICY "Usuarios podem criar e gerenciar suas próprias reações"
ON avisos_reacoes FOR ALL
USING (auth.uid() = usuario_id);

-- ====== DADOS INICIAIS ======

-- Criar um usuário administrador inicial (senha: admin123)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  uuid_generate_v4(),
  'admin@nmalls.com.br',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"name": "Administrador"}'
)
ON CONFLICT DO NOTHING;

-- Adicionar perfil para o usuário admin
INSERT INTO profiles (id, name, role)
SELECT id, 'Administrador', 'admin'
FROM auth.users
WHERE email = 'admin@nmalls.com.br'
ON CONFLICT DO NOTHING; 