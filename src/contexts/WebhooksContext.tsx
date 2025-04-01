'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { WebhookEventType, WebhookStatus, Webhook } from '@/types/webhooks';

// Interface para o contexto de webhooks
interface WebhooksContextType {
  webhooks: Webhook[];
  loading: boolean;
  error: string | null;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar webhooks
  useEffect(() => {
    const fetchWebhooks = async () => {
      try {
        setLoading(true);
        // Simular uma chamada de API com timeout
        await new Promise(resolve => setTimeout(resolve, 500));
        // Em um ambiente de produção, buscaria da API
        // Por enquanto, usamos dados de exemplo ou localStorage
        const savedWebhooks = localStorage.getItem('webhooks');
        if (savedWebhooks) {
          setWebhooks(JSON.parse(savedWebhooks));
        }
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar webhooks:', err);
        setError('Não foi possível carregar os webhooks. Tente novamente mais tarde.');
        setLoading(false);
      }
    };

    fetchWebhooks();
  }, []);

  // Salvar webhooks no localStorage
  const saveWebhooks = (updatedWebhooks: Webhook[]) => {
    localStorage.setItem('webhooks', JSON.stringify(updatedWebhooks));
    setWebhooks(updatedWebhooks);
  };

  // Criar novo webhook
  const createWebhook = async (webhook: Omit<Webhook, 'id' | 'ultimoDisparo' | 'ultimoStatusCode'>) => {
    try {
      // Gerar ID único
      const newWebhook: Webhook = {
        ...webhook,
        id: Date.now().toString(),
        ultimoDisparo: undefined,
        ultimoStatusCode: undefined
      };

      const updatedWebhooks = [...webhooks, newWebhook];
      saveWebhooks(updatedWebhooks);
    } catch (err) {
      console.error('Erro ao criar webhook:', err);
      throw new Error('Não foi possível criar o webhook.');
    }
  };

  // Atualizar webhook existente
  const updateWebhook = async (id: string, updatedData: Partial<Webhook>) => {
    try {
      const updatedWebhooks = webhooks.map(webhook => 
        webhook.id === id ? { ...webhook, ...updatedData } : webhook
      );
      saveWebhooks(updatedWebhooks);
    } catch (err) {
      console.error('Erro ao atualizar webhook:', err);
      throw new Error('Não foi possível atualizar o webhook.');
    }
  };

  // Excluir webhook
  const deleteWebhook = async (id: string) => {
    try {
      const updatedWebhooks = webhooks.filter(webhook => webhook.id !== id);
      saveWebhooks(updatedWebhooks);
    } catch (err) {
      console.error('Erro ao excluir webhook:', err);
      throw new Error('Não foi possível excluir o webhook.');
    }
  };

  // Disparar um webhook para o evento especificado
  const dispararWebhook = async (evento: WebhookEventType, payload: any): Promise<void> => {
    // Em um ambiente real, aqui você faria chamadas HTTP para cada webhook
    // Em nosso caso, vamos apenas simular o disparo
    console.log(`Disparando webhook para o evento: ${evento}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    // Atualizar o último disparo para webhooks correspondentes
    const updatedWebhooks = webhooks.map(webhook => {
      if (webhook.evento === evento && webhook.status === WebhookStatus.ATIVO) {
        return {
          ...webhook,
          ultimoDisparo: new Date().toISOString(),
          ultimoStatusCode: 200 // Simulando sucesso
        };
      }
      return webhook;
    });
    
    saveWebhooks(updatedWebhooks);
  };

  return (
    <WebhooksContext.Provider
      value={{
        webhooks,
        loading,
        error,
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