export enum StatusSugestao {
  CRIADO = 'criado',
  PEDIDO_REALIZADO = 'pedido_realizado',
  PRODUTO_CHEGOU = 'produto_chegou'
}

export enum UrgenciaSugestao {
  BAIXA = 'baixa',
  MEDIA = 'media',
  ALTA = 'alta',
  CRITICA = 'critica'
}

export interface Comentario {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  texto: string;
  dataCriacao: string;
}

export interface Sugestao {
  id: string;
  data: string;
  ean: string;
  nomeProduto: string;
  fornecedor: string;
  cliente: string;
  telefoneCliente: string;
  urgencia: UrgenciaSugestao;
  status: StatusSugestao;
  observacao?: string;
  comentarios: Comentario[];
  criadoPor: string;
  dataCriacao: string;
  dataAtualizacao: string;
  dataPedidoRealizado?: string;
  dataProdutoChegou?: string;
}

export interface SugestaoInput {
  ean: string;
  nomeProduto: string;
  fornecedor: string;
  cliente: string;
  telefoneCliente: string;
  urgencia: UrgenciaSugestao;
  observacao?: string;
}

export interface SugestaoUpdate {
  ean?: string;
  nomeProduto?: string;
  fornecedor?: string;
  cliente?: string;
  telefoneCliente?: string;
  urgencia?: UrgenciaSugestao;
  status?: StatusSugestao;
  observacao?: string;
}

export interface ComentarioInput {
  texto: string;
}

export interface FiltroSugestao {
  status?: StatusSugestao[];
  urgencia?: UrgenciaSugestao[];
  fornecedor?: string;
  dataInicio?: string;
  dataFim?: string;
  nomeProduto?: string;
  cliente?: string;
} 