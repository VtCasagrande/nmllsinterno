// Status possíveis para uma recorrência
export enum StatusRecorrencia {
  ATIVA = 'ativa',
  PAUSADA = 'pausada',
  CANCELADA = 'cancelada'
}

// Interface para um produto de recorrência
export interface ProdutoRecorrencia {
  id: string;
  ean: string;
  titulo: string;
  quantidade: number;
  preco: number;
}

// Interface principal para uma recorrência
export interface Recorrencia {
  id: string;
  // Cliente
  nomeCliente: string;
  cpfCliente: string;
  telefoneCliente: string;
  
  // Dados da recorrência
  diasRecorrencia: number;  // Intervalo em dias entre cada entrega
  proximaData: string;      // Data da próxima entrega
  dataCriacao: string;
  status: StatusRecorrencia;
  
  // Produtos
  produtos: ProdutoRecorrencia[];
  
  // Observações
  observacoes?: string;
} 