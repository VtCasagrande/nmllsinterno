// Status possíveis para um atendimento de CRM
export enum StatusCRM {
  EM_ABERTO = 'em_aberto',
  EM_MONITORAMENTO = 'em_monitoramento',
  FINALIZADO = 'finalizado'
}

// Interface para um atendimento do CRM
export interface AtendimentoCRM {
  id: string;
  data: string;           // Data do atendimento no formato ISO
  cliente: {
    id: string;
    nome: string;
    cpf: string;
    telefone: string;
  };
  motivo: string;         // Descrição do motivo do atendimento
  observacoes?: string;   // Observações adicionais
  responsavel: {
    id: string;
    nome: string;
  };
  status: StatusCRM;
  dataCriacao: string;    // Data de criação do registro
  dataAtualizacao: string; // Data da última atualização
  dataProximoContato?: string; // Data do próximo contato planejado (para monitoramento)
  historico?: HistoricoAtendimento[]; // Histórico de interações do atendimento
}

// Interface para histórico de atendimento
export interface HistoricoAtendimento {
  id: string;
  data: string;
  responsavel: {
    id: string;
    nome: string;
  };
  descricao: string;
  status: StatusCRM;
} 