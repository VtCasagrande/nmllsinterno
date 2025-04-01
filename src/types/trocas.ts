// Tipo de operação de troca
export enum TipoTroca {
  EMPRESTAMOS = 'emprestamos',
  PEGAMOS_EMPRESTADO = 'pegamos_emprestado'
}

// Status possíveis para uma troca do tipo "Emprestamos"
export enum StatusTrocaEmprestamos {
  AGUARDANDO_DEVOLUCAO = 'aguardando_devolucao',
  DEVOLVIDO = 'devolvido'
}

// Status possíveis para uma troca do tipo "Pegamos Emprestado"
export enum StatusTrocaPegamosEmprestado {
  AGUARDANDO_DEVOLUCAO = 'aguardando_devolucao',
  DEVOLVIDO = 'devolvido'
}

// Interface para comentário da troca
export interface ComentarioTroca {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  texto: string;
  dataCriacao: string;
}

// Status possíveis para uma troca
export enum TrocaStatus {
  // Status para troca tipo ENVIADA
  AGUARDANDO_DEVOLUCAO = 'AGUARDANDO_DEVOLUCAO',
  
  // Status para troca tipo RECEBIDA
  COLETADO = 'COLETADO',
  
  // Status compartilhados
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA'
}

// Tipo de troca
export enum TrocaTipo {
  ENVIADA = 'ENVIADA',
  RECEBIDA = 'RECEBIDA'
}

// Interface para uma troca
export interface Troca {
  id: string;
  tipo: TrocaTipo;
  status: TrocaStatus;
  ean: string;
  nomeProduto: string;
  quantidade: number;
  lojaParceira: string;
  responsavel: string;
  telefoneResponsavel: string;
  motivo: string;
  observacoes?: string;
  dataCriacao: string;
  dataAtualizacao: string;
  usuarioCriacao: string;
  usuarioAtualizacao?: string;
  comentarios?: ComentarioTroca[];
}

// Interface para criar uma nova troca
export type TrocaInput = Omit<
  Troca,
  'id' | 'status' | 'dataCriacao' | 'dataAtualizacao' | 'usuarioCriacao' | 'usuarioAtualizacao'
>;

// Interface para atualizar uma troca existente
export type TrocaUpdate = Partial<Omit<Troca, 'id' | 'dataCriacao' | 'usuarioCriacao'>>;

// Interface para adicionar um comentário
export interface ComentarioTrocaInput {
  texto: string;
}

// Interface para filtrar trocas
export type TrocaFiltros = {
  tipo?: TrocaTipo;
  status?: TrocaStatus;
  ean?: string;
  lojaParceira?: string;
  dataInicio?: string;
  dataFim?: string;
  nomeProduto?: string;
  responsavel?: string;
}; 