'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Tipos de eventos para webhooks
export enum WebhookEventType {
  ENTREGA_EM_ROTA = 'ENTREGA_EM_ROTA',
  ENTREGA_ENTREGUE = 'ENTREGA_ENTREGUE',
  ENTREGA_ATRASADA = 'ENTREGA_ATRASADA',
  PEDIDO_REALIZADO = 'PEDIDO_REALIZADO',
  PEDIDO_APROVADO = 'PEDIDO_APROVADO',
  PEDIDO_RECUSADO = 'PEDIDO_RECUSADO',
  PEDIDO_ENVIADO = 'PEDIDO_ENVIADO',
  PEDIDO_CANCELADO = 'PEDIDO_CANCELADO',
  PAGAMENTO_APROVADO = 'PAGAMENTO_APROVADO',
  PAGAMENTO_RECUSADO = 'PAGAMENTO_RECUSADO',
  REEMBOLSO_SOLICITADO = 'REEMBOLSO_SOLICITADO',
  REEMBOLSO_APROVADO = 'REEMBOLSO_APROVADO',
  REEMBOLSO_RECUSADO = 'REEMBOLSO_RECUSADO',
  LEMBRETE_MEDICAMENTO = 'LEMBRETE_MEDICAMENTO'
}

// Status do webhook
export enum WebhookStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO'
}

// Interface para webhook
export interface Webhook {
  id: string;
  nome: string;
  url: string;
  eventos: WebhookEventType[];
  headers?: Record<string, string>;
  status: WebhookStatus;
  dataCriacao: string;
  ultimaAtualizacao: string;
  ultimaExecucao?: string;
  ultimoStatus?: number; // HTTP status code da última execução
  timeoutMs?: number; // timeout em milissegundos
  maxRetries?: number; // número máximo de tentativas
}

// Tipo do contexto
interface WebhooksContextType {
  webhooks: Webhook[];
  loading: boolean;
  error: string | null;
  obterWebhooks: () => Promise<Webhook[]>;
  obterWebhookPorId: (id: string) => Promise<Webhook | null>;
  criarWebhook: (webhook: Omit<Webhook, 'id' | 'dataCriacao' | 'ultimaAtualizacao'>) => Promise<Webhook>;
  atualizarWebhook: (id: string, dados: Partial<Omit<Webhook, 'id' | 'dataCriacao' | 'ultimaAtualizacao'>>) => Promise<Webhook>;
  excluirWebhook: (id: string) => Promise<boolean>;
  dispararWebhook: (id: string, payload: any) => Promise<{ sucesso: boolean; statusCode?: number; resposta?: any; erro?: string }>;
  dispararEventoEmTodosWebhooks: (tipo: WebhookEventType, payload: any) => Promise<{ [webhookId: string]: { sucesso: boolean; statusCode?: number; erro?: string } }>;
}

// Criar o contexto
const WebhooksContext = createContext<WebhooksContextType | undefined>(undefined);

// Hook para usar o contexto
export const useWebhooks = () => {
  const context = useContext(WebhooksContext);
  if (context === undefined) {
    throw new Error('useWebhooks deve ser usado dentro de um WebhooksProvider');
  }
  return context;
};

// Exemplos de webhooks para desenvolvimento
const webhooksIniciais: Webhook[] = [
  {
    id: '1',
    nome: 'Webhook de Entregas',
    url: 'https://api.example.com/webhooks/delivery',
    eventos: [WebhookEventType.ENTREGA_EM_ROTA, WebhookEventType.ENTREGA_ENTREGUE],
    headers: {
      'Authorization': 'Bearer abc123',
      'Content-Type': 'application/json'
    },
    status: WebhookStatus.ATIVO,
    dataCriacao: '2023-01-15T10:30:00Z',
    ultimaAtualizacao: '2023-03-20T14:15:00Z',
    ultimaExecucao: '2023-04-01T09:45:00Z',
    ultimoStatus: 200,
    timeoutMs: 5000,
    maxRetries: 3
  },
  {
    id: '2',
    nome: 'Webhook de Pedidos',
    url: 'https://erp.minhaempresa.com/api/orders',
    eventos: [WebhookEventType.PEDIDO_REALIZADO, WebhookEventType.PEDIDO_APROVADO, WebhookEventType.PEDIDO_ENVIADO],
    status: WebhookStatus.ATIVO,
    dataCriacao: '2023-02-10T08:20:00Z',
    ultimaAtualizacao: '2023-02-10T08:20:00Z',
    timeoutMs: 10000,
    maxRetries: 5
  },
  {
    id: '3',
    nome: 'Webhook de Pagamentos',
    url: 'https://payments.example.org/webhooks',
    eventos: [WebhookEventType.PAGAMENTO_APROVADO, WebhookEventType.PAGAMENTO_RECUSADO],
    status: WebhookStatus.INATIVO,
    dataCriacao: '2022-11-05T16:40:00Z',
    ultimaAtualizacao: '2023-01-20T11:30:00Z',
    ultimaExecucao: '2023-01-19T23:10:00Z',
    ultimoStatus: 500
  }
];

interface WebhooksProviderProps {
  children: ReactNode;
}

// Provider component
export const WebhooksProvider: React.FC<WebhooksProviderProps> = ({ children }) => {
  const [webhooks, setWebhooks] = useState<Webhook[]>(webhooksIniciais);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Funções mock
  const obterWebhooks = async (): Promise<Webhook[]> => {
    setLoading(true);
    try {
      // Simulação de chamada API
      await new Promise(resolve => setTimeout(resolve, 500));
      return webhooksIniciais;
    } catch (erro) {
      setError('Erro ao obter webhooks');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const obterWebhookPorId = async (id: string): Promise<Webhook | null> => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const webhook = webhooksIniciais.find(w => w.id === id);
      return webhook || null;
    } catch (erro) {
      setError(`Erro ao obter webhook com ID ${id}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const criarWebhook = async (webhook: Omit<Webhook, 'id' | 'dataCriacao' | 'ultimaAtualizacao'>): Promise<Webhook> => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 700));
      
      const novoWebhook: Webhook = {
        ...webhook,
        id: `${Date.now()}`, // Gerar ID único
        dataCriacao: new Date().toISOString(),
        ultimaAtualizacao: new Date().toISOString()
      };
      
      setWebhooks(prevWebhooks => [...prevWebhooks, novoWebhook]);
      return novoWebhook;
    } catch (erro) {
      setError('Erro ao criar webhook');
      throw new Error('Erro ao criar webhook');
    } finally {
      setLoading(false);
    }
  };

  const atualizarWebhook = async (id: string, dados: Partial<Omit<Webhook, 'id' | 'dataCriacao' | 'ultimaAtualizacao'>>): Promise<Webhook> => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const webhookAtualizado = webhooksIniciais.find(w => w.id === id);
      
      if (!webhookAtualizado) {
        throw new Error(`Webhook com ID ${id} não encontrado`);
      }
      
      const updated: Webhook = {
        ...webhookAtualizado,
        ...dados,
        ultimaAtualizacao: new Date().toISOString()
      };
      
      setWebhooks(prevWebhooks => 
        prevWebhooks.map(w => w.id === id ? updated : w)
      );
      
      return updated;
    } catch (erro) {
      setError(`Erro ao atualizar webhook com ID ${id}`);
      throw erro;
    } finally {
      setLoading(false);
    }
  };

  const excluirWebhook = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setWebhooks(prevWebhooks => 
        prevWebhooks.filter(w => w.id !== id)
      );
      
      return true;
    } catch (erro) {
      setError(`Erro ao excluir webhook com ID ${id}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const dispararWebhook = async (id: string, payload: any): Promise<{ sucesso: boolean; statusCode?: number; resposta?: any; erro?: string }> => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const webhook = webhooksIniciais.find(w => w.id === id);
      
      if (!webhook) {
        throw new Error(`Webhook com ID ${id} não encontrado`);
      }
      
      if (webhook.status === WebhookStatus.INATIVO) {
        return {
          sucesso: false,
          erro: 'Webhook está inativo'
        };
      }
      
      // Simulação de sucesso ou falha
      const simulacoesRespostas = [
        { sucesso: true, statusCode: 200, resposta: { message: 'Webhook recebido com sucesso' } },
        { sucesso: true, statusCode: 201, resposta: { status: 'created', id: '12345' } },
        { sucesso: false, statusCode: 400, erro: 'Payload inválido' },
        { sucesso: false, statusCode: 500, erro: 'Erro interno do servidor' }
      ];
      
      // Escolher aleatoriamente uma resposta
      const resposta = simulacoesRespostas[Math.floor(Math.random() * simulacoesRespostas.length)];
      
      return resposta;
    } catch (erro) {
      setError(`Erro ao disparar webhook com ID ${id}`);
      return {
        sucesso: false,
        erro: `Erro ao disparar webhook: ${erro instanceof Error ? erro.message : 'Erro desconhecido'}`
      };
    } finally {
      setLoading(false);
    }
  };

  const dispararEventoEmTodosWebhooks = async (tipo: WebhookEventType, payload: any): Promise<{ [webhookId: string]: { sucesso: boolean; statusCode?: number; erro?: string } }> => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const webhooksParaEventos = webhooksIniciais.filter(
        w => w.status === WebhookStatus.ATIVO && w.eventos.includes(tipo)
      );
      
      const resultado: { [webhookId: string]: { sucesso: boolean; statusCode?: number; erro?: string } } = {};
      
      // Simulação de resultados
      for (const webhook of webhooksParaEventos) {
        resultado[webhook.id] = Math.random() > 0.3
          ? { sucesso: true, statusCode: 200 }
          : { sucesso: false, statusCode: 500, erro: 'Erro interno do servidor' };
      }
      
      return resultado;
    } catch (erro) {
      setError(`Erro ao disparar evento ${tipo} em webhooks`);
      return {};
    } finally {
      setLoading(false);
    }
  };

  return (
    <WebhooksContext.Provider
      value={{
        webhooks,
        loading,
        error,
        obterWebhooks,
        obterWebhookPorId,
        criarWebhook,
        atualizarWebhook,
        excluirWebhook,
        dispararWebhook,
        dispararEventoEmTodosWebhooks
      }}
    >
      {children}
    </WebhooksContext.Provider>
  );
}; 