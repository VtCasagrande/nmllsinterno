// Status possíveis para uma entrega
export enum StatusEntrega {
  PENDENTE = 'pendente',
  ATRIBUIDA = 'atribuida',
  EM_ROTA = 'em_rota',
  ENTREGUE = 'entregue',
  CANCELADA = 'cancelada',
  COM_PROBLEMA = 'com_problema'
}

// Interface para forma de pagamento
export enum FormaPagamento {
  DINHEIRO = 'dinheiro',
  CREDITO = 'credito',
  DEBITO = 'debito',
  PIX = 'pix',
  BOLETO = 'boleto',
  SEM_PAGAMENTO = 'sem_pagamento'
}

// Interface para um item do pedido
export interface ItemPedido {
  id: string;
  nome: string;
  quantidade: number;
  codigo: string;
  preco: number;
}

// Interface para pagamento
export interface Pagamento {
  forma: FormaPagamento;
  valor: number;
  recebido: boolean;
  troco?: number;
  parcelamento?: number; // Número de parcelas para cartão de crédito
}

// Interface principal para uma entrega
export interface Entrega {
  id: string;
  numeroPedido: string;
  dataCriacao: string;
  dataEntrega?: string;
  dataMaxima?: string;
  status: StatusEntrega;
  
  // Cliente
  nomeCliente: string;
  telefoneCliente: string;
  
  // Endereço
  endereco: string;
  cidade: string;
  cep: string;
  complemento?: string;
  
  // Motorista
  motoristaId?: string;
  motoristaNome?: string;
  
  // Rota
  rotaId?: string;
  posicaoRota?: number;
  
  // Pagamento
  pagamento?: Pagamento;
  
  // Itens do pedido
  itens: ItemPedido[];
  
  // Outros
  formaEnvio: string;
  observacoes?: string;
  assinatura?: string;
  fotos?: string[];
}

// Interface para a rota de entregas
export interface Rota {
  id: string;
  codigo: string;
  data: string;
  motoristaId: string;
  motoristaNome: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  entregas: string[]; // IDs das entregas
  otimizada: boolean;
}

// Interface para motorista
export interface Motorista {
  id: string;
  nome: string;
  telefone: string;
  status: 'ativo' | 'inativo';
  veiculo: string;
  placaVeiculo: string;
  ultimaAtualizacao?: string;
  latitude?: number;
  longitude?: number;
  rotaAtual?: string;
} 