-- Configuração inicial do schema para o projeto Nmalls

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de perfis de usuário
CREATE TYPE user_role AS ENUM ('admin', 'gerente', 'operador', 'motorista');

-- Tabela de perfis (estende a auth.users padrão do Supabase)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'operador',
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela de motoristas
CREATE TYPE driver_status AS ENUM ('ativo', 'inativo', 'em_rota');

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
CREATE TYPE route_status AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');

CREATE TABLE rotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  motorista_id UUID REFERENCES motoristas(id),
  data_entrega DATE NOT NULL,
  destino TEXT NOT NULL,
  observacoes TEXT,
  status route_status NOT NULL DEFAULT 'pendente',
  created_by UUID NOT NULL REFERENCES profiles(id),
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
CREATE TYPE return_status AS ENUM ('pendente', 'em_analise', 'finalizado', 'cancelado');
CREATE TYPE return_reason AS ENUM ('produto_danificado', 'produto_incorreto', 'cliente_desistiu', 'endereco_nao_encontrado', 'outro');

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
CREATE TYPE log_action AS ENUM ('login', 'logout', 'create', 'update', 'delete', 'view', 'complete');
CREATE TYPE log_entity AS ENUM ('auth', 'devolucoes', 'rotas', 'motoristas', 'usuarios', 'produtos');

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

-- RLS (Row Level Security) Policies

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_rota ENABLE ROW LEVEL SECURITY;
ALTER TABLE devolucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE devolucoes_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE devolucoes_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Motoristas só veem suas próprias rotas"
ON rotas FOR SELECT
USING (auth.uid() IN (
  SELECT profile_id FROM motoristas WHERE id = motorista_id
));

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

CREATE POLICY "Admins, gerentes e operadores podem criar devoluções"
ON devolucoes FOR INSERT
WITH CHECK (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('admin', 'gerente', 'operador')
));

CREATE POLICY "Responsáveis e atribuídos podem editar devoluções"
ON devolucoes FOR UPDATE
USING (auth.uid() = responsavel_id OR auth.uid() = atribuido_id OR auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('admin', 'gerente')
));

-- Policies para fotos de devoluções
CREATE POLICY "Todos podem ver fotos de devoluções"
ON devolucoes_fotos FOR SELECT
USING (true);

CREATE POLICY "Responsáveis e atribuídos podem adicionar fotos"
ON devolucoes_fotos FOR INSERT
WITH CHECK (auth.uid() IN (
  SELECT d.responsavel_id FROM devolucoes d WHERE d.id = devolucao_id
) OR auth.uid() IN (
  SELECT d.atribuido_id FROM devolucoes d WHERE d.id = devolucao_id
) OR auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('admin', 'gerente')
));

-- Policies para comentários de devoluções
CREATE POLICY "Todos podem ver comentários de devoluções"
ON devolucoes_comentarios FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem adicionar comentários"
ON devolucoes_comentarios FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- Policies para logs
CREATE POLICY "Admins e gerentes podem ver logs"
ON logs FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('admin', 'gerente')
));

-- Função para criar código único
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

-- Triggers para gerar códigos únicos automaticamente
CREATE OR REPLACE FUNCTION generate_rota_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.codigo := generate_unique_code('RT', 'rotas', 'codigo');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_rota_code
BEFORE INSERT ON rotas
FOR EACH ROW
WHEN (NEW.codigo IS NULL)
EXECUTE FUNCTION generate_rota_code();

CREATE OR REPLACE FUNCTION generate_devolucao_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.codigo := generate_unique_code('DEV', 'devolucoes', 'codigo');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_devolucao_code
BEFORE INSERT ON devolucoes
FOR EACH ROW
WHEN (NEW.codigo IS NULL)
EXECUTE FUNCTION generate_devolucao_code(); 