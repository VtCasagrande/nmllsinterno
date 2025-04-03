'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Enums para os tipos de eventos e status
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

// Interface para o webhook
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

// Interface para o contexto de webhooks
interface WebhooksContextType {
  webhooks: Webhook[];
  loading: boolean;
  error: string | null;
  getWebhookById: (id: string) => Promise<Webhook | null>;
  createWebhook: (webhook: Omit<Webhook, 'id' | 'ultimoDisparo' | 'ultimoStatusCode'>) => Promise<void>;
  updateWebhook: (id: string, webhook: Partial<Webhook>) => Promise<void>;
  deleteWebhook: (id: string) => Promise<void>;
  dispararWebhook: (evento: WebhookEventType, payload: any) => Promise<void>;
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

interface WebhooksProviderProps {
  children: ReactNode;
}

// Provider component
export const WebhooksProvider: React.FC<WebhooksProviderProps> = ({ children }) => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Mock das funções
  const getWebhookById = async (id: string): Promise<Webhook | null> => {
    return null;
  };

  const createWebhook = async (webhook: Omit<Webhook, 'id' | 'ultimoDisparo' | 'ultimoStatusCode'>) => {
    // Mock para criar webhook
  };

  const updateWebhook = async (id: string, updatedData: Partial<Webhook>) => {
    // Mock para atualizar webhook
  };

  const deleteWebhook = async (id: string) => {
    // Mock para deletar webhook
  };

  const dispararWebhook = async (evento: WebhookEventType, payload: any): Promise<void> => {
    // Mock para disparar webhook
  };

  return (
    <WebhooksContext.Provider
      value={{
        webhooks,
        loading,
        error,
        getWebhookById,
        createWebhook,
        updateWebhook,
        deleteWebhook,
        dispararWebhook
      }}
    >
      {children}
    </WebhooksContext.Provider>
  );
}; 