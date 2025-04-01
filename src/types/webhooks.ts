// Tipos de eventos que podem acionar um webhook
export enum WebhookEventType {
  ENTREGA_EM_ROTA = 'entrega_em_rota',
  ENTREGA_ENTREGUE = 'entrega_entregue',
  ENTREGA_CANCELADA = 'entrega_cancelada',
  ENTREGA_PROBLEMA = 'entrega_problema',
  DEVOLUCAO_INICIADA = 'devolucao_iniciada',
  DEVOLUCAO_APROVADA = 'devolucao_aprovada',
  DEVOLUCAO_REJEITADA = 'devolucao_rejeitada',
  SUGESTAO_CRIADA = 'sugestao_criada',
  SUGESTAO_PEDIDO_REALIZADO = 'sugestao_pedido_realizado',
  SUGESTAO_PRODUTO_CHEGOU = 'sugestao_produto_chegou',
  TROCA_CRIADA = 'troca_criada',
  TROCA_ATUALIZADA = 'troca_atualizada',
  TROCA_FINALIZADA = 'troca_finalizada',
  // Novos eventos para reembolsos
  REEMBOLSO_CRIADO = 'reembolso_criado',
  REEMBOLSO_ATUALIZADO = 'reembolso_atualizado',
  REEMBOLSO_STATUS_ATUALIZADO = 'reembolso_status_atualizado',
  REEMBOLSO_EXCLUIDO = 'reembolso_excluido',
  // Eventos de Lembretes de Medicamentos
  LEMBRETE_MEDICAMENTO_CRIADO = 'lembrete_medicamento_criado',
  LEMBRETE_MEDICAMENTO_ATUALIZADO = 'lembrete_medicamento_atualizado',
  LEMBRETE_MEDICAMENTO_ENVIADO = 'lembrete_medicamento_enviado',
  LEMBRETE_MEDICAMENTO_FINALIZADO = 'lembrete_medicamento_finalizado',
  // Eventos de Bugs
  BUG_REPORTADO = 'bug_reportado',
  BUG_ATUALIZADO = 'bug_atualizado',
  BUG_RESOLVIDO = 'bug_resolvido'
}

// Status do webhook
export enum WebhookStatus {
  ATIVO = 'ativo',
  INATIVO = 'inativo'
}

// Interface para configuração de webhook
export interface Webhook {
  id: string;
  nome: string;
  url: string;
  evento: WebhookEventType;
  status: WebhookStatus;
  headers?: Record<string, string>;
  ultimoDisparo?: string;
  ultimoStatusCode?: number;
  chaveSecreta?: string;
}

// Interface para criar um novo webhook
export interface WebhookInput {
  nome: string;
  url: string;
  evento: WebhookEventType;
  status?: WebhookStatus;
  headers?: Record<string, string>;
  chaveSecreta?: string;
}

// Interface para atualizar um webhook existente
export interface WebhookUpdate {
  nome?: string;
  url?: string;
  evento?: WebhookEventType;
  status?: WebhookStatus;
  headers?: Record<string, string>;
  chaveSecreta?: string;
}

// Interface para payload de um evento de entrega
export interface EntregaEventPayload {
  evento: WebhookEventType;
  timestamp: string;
  dados: {
    entregaId: string;
    numeroPedido: string;
    status: string;
    nomeCliente: string;
    endereco: string;
    cidade: string;
    cep: string;
    motoristaNome?: string;
    motoristaId?: string;
    dataAtualizacao: string;
    itens?: Array<{
      id: string;
      nome: string;
      quantidade: number;
      preco: number;
    }>;
  };
}

// Interface para resposta de disparo de webhook
export interface WebhookResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  timestamp: string;
}

// Interface para log de disparo de webhook
export interface WebhookLog {
  id: string;
  webhookId: string;
  evento: WebhookEventType;
  statusCode: number;
  sucesso: boolean;
  payload: string;
  resposta?: string;
  dataCriacao: string;
}

// Interface para payload de um evento de sugestão
export interface SugestaoEventPayload {
  evento: WebhookEventType;
  timestamp: string;
  dados: {
    sugestaoId: string;
    ean: string;
    nomeProduto: string;
    fornecedor: string;
    cliente: string;
    telefoneCliente: string;
    status: string;
    urgencia: string;
    dataAtualizacao: string;
  };
}

// Interface para payload de um evento de troca
export interface TrocaEventPayload {
  evento: WebhookEventType;
  timestamp: string;
  dados: {
    trocaId: string;
    tipo: string;
    status: string;
    ean: string;
    nomeProduto: string;
    lojaParceira: string;
    responsavel: string;
    telefoneResponsavel: string;
    motivo: string;
    dataAtualizacao: string;
  };
}

// Interface para payload de um evento de reembolso
export interface ReembolsoEventPayload {
  evento: WebhookEventType;
  timestamp: string;
  dados: {
    reembolsoId: string;
    numeroPedidoTiny: string;
    nomeCliente: string;
    status: string;
    valorReembolso: number;
    prioridade: string;
    dataAtualizacao: string;
    urlComprovante?: string | null;
  };
}

// Interface para payload de um evento de bug
export interface BugEventPayload {
  evento: WebhookEventType;
  timestamp: string;
  dados: {
    bugId: string;
    titulo: string;
    descricao: string;
    severidade: string;
    status: string;
    reportadoPor: string;
    dataReporte: string;
    dataCriacao: string;
    ultimaAtualizacao: string;
    prints?: string[];
  };
} 