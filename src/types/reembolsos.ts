// Status possíveis para um reembolso
export enum ReembolsoStatus {
  EM_ANALISE = 'EM_ANALISE',
  APROVADO = 'APROVADO',
  PAGO = 'PAGO',
  CANCELADO = 'CANCELADO'
}

// Prioridade do reembolso
export enum ReembolsoPrioridade {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE'
}

// Interface para um reembolso
export interface Reembolso {
  id: string;
  numeroPedidoTiny: string;
  nomeCliente: string;
  dataPedido: string;
  statusPedidoTiny: string;
  responsavelReembolso: string;
  prioridade: ReembolsoPrioridade;
  formaPagamento: string;
  telefoneCliente: string;
  valorPedidoTotal: number;
  valorReembolso: number;
  motivoReembolso: string;
  observacao?: string;
  dataCriacao: string;
  dataAtualizacao: string;
  status: ReembolsoStatus;
  usuarioCriacao: string;
  usuarioAtualizacao?: string;
  urlComprovante?: string;
}

// Interface para criar um novo reembolso
export type ReembolsoInput = Omit<
  Reembolso,
  'id' | 'status' | 'dataCriacao' | 'dataAtualizacao' | 'usuarioCriacao' | 'usuarioAtualizacao'
>;

// Interface para atualizar um reembolso existente
export type ReembolsoUpdate = Partial<Omit<Reembolso, 'id' | 'dataCriacao' | 'usuarioCriacao'>>;

// Interface para filtrar reembolsos
export type ReembolsoFiltros = {
  status?: ReembolsoStatus;
  prioridade?: ReembolsoPrioridade;
  numeroPedidoTiny?: string;
  nomeCliente?: string;
  responsavelReembolso?: string;
  dataInicio?: string;
  dataFim?: string;
}; 