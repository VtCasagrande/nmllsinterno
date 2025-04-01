// Tipos de destinatários de avisos
export enum TipoDestinatario {
  TODOS = 'TODOS',
  GRUPO = 'GRUPO',
  USUARIOS = 'USUARIOS'
}

// Status de um aviso
export enum AvisoStatus {
  ATIVO = 'ATIVO',
  ARQUIVADO = 'ARQUIVADO'
}

// Prioridade de um aviso
export enum AvisoPrioridade {
  BAIXA = 'BAIXA',
  NORMAL = 'NORMAL',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE'
}

// Tipos de reações possíveis
export enum TipoReacao {
  CURTIR = 'CURTIR',          // 👍
  CONCORDAR = 'CONCORDAR',    // ✅
  VERIFICADO = 'VERIFICADO',  // ✓
  IMPORTANTE = 'IMPORTANTE',  // ⚠️
  CELEBRAR = 'CELEBRAR'       // 🎉
}

// Interface para um grupo de usuários
export interface GrupoUsuarios {
  id: string;
  nome: string;
  descricao?: string;
  papeis: ('admin' | 'gerente' | 'operador' | 'motorista')[];
}

// Interface para reação a um aviso
export interface Reacao {
  id: string;
  avisoId: string;
  usuarioId: string;
  usuarioNome: string;
  tipo: TipoReacao;
  dataCriacao: string;
}

// Interface para um aviso
export interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  tipoDestinatario: TipoDestinatario;
  grupos?: string[]; // IDs dos grupos quando tipoDestinatario é GRUPO
  usuarios?: string[]; // IDs dos usuários quando tipoDestinatario é USUARIOS
  prioridade: AvisoPrioridade;
  status: AvisoStatus;
  dataExpiracao?: string; // Data opcional de expiração
  dataPublicacao: string;
  usuarioCriacao: string;
  visualizacoes: number;
  reacoes: Reacao[];
}

// Interface para criação de um novo aviso
export type AvisoInput = Omit<
  Aviso,
  'id' | 'dataPublicacao' | 'usuarioCriacao' | 'visualizacoes' | 'reacoes'
>;

// Interface para atualização de um aviso existente
export type AvisoUpdate = Partial<Omit<Aviso, 'id' | 'dataPublicacao' | 'usuarioCriacao'>>;

// Interface para adicionar uma reação
export interface ReacaoInput {
  avisoId: string;
  tipo: TipoReacao;
}

// Interface para filtrar avisos
export interface AvisoFiltros {
  status?: AvisoStatus;
  prioridade?: AvisoPrioridade;
  dataInicio?: string;
  dataFim?: string;
  apenasNaoVisualizados?: boolean;
} 