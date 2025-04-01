'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Reembolso, 
  ReembolsoInput, 
  ReembolsoUpdate, 
  ReembolsoStatus,
  ReembolsoPrioridade,
  ReembolsoFiltros
} from '@/types/reembolsos';
import { useAuth } from './AuthContext';
import { useWebhooks } from './WebhooksContext';
import { WebhookEventType } from '@/types/webhooks';
import { toast } from 'react-hot-toast';

// Definição do payload para webhook de reembolso
export interface ReembolsoEventPayload {
  evento: WebhookEventType;
  timestamp: string;
  dados: {
    reembolsoId: string;
    numeroPedidoTiny: string;
    nomeCliente: string;
    status: ReembolsoStatus;
    valorReembolso: number;
    prioridade: ReembolsoPrioridade;
    dataAtualizacao: string;
    urlComprovante?: string | null;
  };
}

// Interface para o contexto
interface ReembolsosContextProps {
  reembolsos: Reembolso[];
  loading: boolean;
  error: string | null;
  filtros: ReembolsoFiltros;
  setFiltros: (filtros: ReembolsoFiltros) => void;
  getReembolsos: () => Promise<Reembolso[]>;
  getReembolsoById: (id: string) => Promise<Reembolso | null>;
  createReembolso: (dados: ReembolsoInput) => Promise<Reembolso>;
  updateReembolso: (id: string, dados: ReembolsoUpdate) => Promise<Reembolso>;
  deleteReembolso: (id: string) => Promise<boolean>;
  updateReembolsoStatus: (id: string, status: ReembolsoStatus, comprovanteFile?: File) => Promise<boolean>;
}

// Criar o contexto
const ReembolsosContext = createContext<ReembolsosContextProps | undefined>(undefined);

// Hook para usar o contexto
export const useReembolsos = () => {
  const context = useContext(ReembolsosContext);
  if (context === undefined) {
    throw new Error('useReembolsos deve ser usado dentro de um ReembolsosProvider');
  }
  return context;
};

interface ReembolsosProviderProps {
  children: ReactNode;
}

// Provider component
export const ReembolsosProvider: React.FC<ReembolsosProviderProps> = ({ children }) => {
  const [reembolsos, setReembolsos] = useState<Reembolso[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const { dispararWebhook } = useWebhooks();
  const [filtros, setFiltros] = useState<ReembolsoFiltros>({});

  // Carregar reembolsos do armazenamento local ao iniciar
  useEffect(() => {
    const loadReembolsos = () => {
      try {
        const savedReembolsos = localStorage.getItem('reembolsos');
        if (savedReembolsos) {
          setReembolsos(JSON.parse(savedReembolsos));
        }
      } catch (err) {
        console.error('Erro ao carregar reembolsos:', err);
      }
    };

    loadReembolsos();
  }, []);

  // Salvar reembolsos no armazenamento local quando mudar
  useEffect(() => {
    try {
      localStorage.setItem('reembolsos', JSON.stringify(reembolsos));
    } catch (err) {
      console.error('Erro ao salvar reembolsos:', err);
    }
  }, [reembolsos]);

  // Obter um reembolso específico pelo ID
  const getReembolso = (id: string) => reembolsos.find(reembolso => reembolso.id === id);

  // Obter um reembolso pelo ID (da API)
  const getReembolsoById = async (id: string): Promise<Reembolso | null> => {
    // Verificar se já temos o reembolso em memória
    const reembolsoLocal = reembolsos.find(r => r.id === id);
    if (reembolsoLocal) {
      return reembolsoLocal;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reembolsos/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar reembolso');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar reembolso';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Criar um novo reembolso
  const createReembolso = async (dados: ReembolsoInput): Promise<Reembolso> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reembolsos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dados,
          status: ReembolsoStatus.EM_ANALISE
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar reembolso');
      }
      
      const novoReembolso = await response.json();
      
      // Atualizar a lista de reembolsos em memória
      setReembolsos(prevReembolsos => [...prevReembolsos, novoReembolso]);
      
      // Disparar webhook para reembolso criado
      const payload: ReembolsoEventPayload = {
        evento: WebhookEventType.REEMBOLSO_CRIADO,
        timestamp: new Date().toISOString(),
        dados: {
          reembolsoId: novoReembolso.id,
          numeroPedidoTiny: novoReembolso.numeroPedidoTiny,
          nomeCliente: novoReembolso.nomeCliente,
          status: novoReembolso.status,
          valorReembolso: novoReembolso.valorReembolso,
          prioridade: novoReembolso.prioridade,
          dataAtualizacao: novoReembolso.dataAtualizacao,
          urlComprovante: novoReembolso.urlComprovante || null
        }
      };
      
      await dispararWebhook(WebhookEventType.REEMBOLSO_CRIADO, payload);
      
      return novoReembolso;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao criar reembolso';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar um reembolso existente
  const updateReembolso = async (id: string, dados: ReembolsoUpdate): Promise<Reembolso> => {
    setLoading(true);
    setError(null);

    try {
      // Verifica se temos o reembolso em cache
      const reembolsoExistente = reembolsos.find(r => r.id === id);
      
      if (!reembolsoExistente) {
        throw new Error(`Reembolso com ID ${id} não encontrado`);
      }
      
      // Atualiza o reembolso localmente primeiro para feedback imediato ao usuário
      const reembolsoAtualizado = {
        ...reembolsoExistente,
        ...dados,
        dataAtualizacao: new Date().toISOString(),
        usuarioAtualizacao: profile?.name || profile?.email || 'sistema'
      };
      
      setReembolsos(prevReembolsos => 
        prevReembolsos.map(r => r.id === id ? reembolsoAtualizado : r)
      );
      
      // Enviar a atualização para a API
      const response = await fetch(`/api/reembolsos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });
      
      if (!response.ok) {
        // Reverter mudanças locais em caso de erro
        setReembolsos(prevReembolsos => 
          prevReembolsos.map(r => r.id === id ? reembolsoExistente : r)
        );
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar reembolso');
      }
      
      // Obter o reembolso atualizado do servidor
      const reembolsoServidorAtualizado = await response.json();
      
      // Atualizar a lista local com os dados do servidor
      setReembolsos(prevReembolsos => 
        prevReembolsos.map(r => r.id === id ? reembolsoServidorAtualizado : r)
      );
      
      // Disparar webhook para reembolso atualizado
      const payload: ReembolsoEventPayload = {
        evento: WebhookEventType.REEMBOLSO_ATUALIZADO,
        timestamp: new Date().toISOString(),
        dados: {
          reembolsoId: reembolsoServidorAtualizado.id,
          numeroPedidoTiny: reembolsoServidorAtualizado.numeroPedidoTiny,
          nomeCliente: reembolsoServidorAtualizado.nomeCliente,
          status: reembolsoServidorAtualizado.status,
          valorReembolso: reembolsoServidorAtualizado.valorReembolso,
          prioridade: reembolsoServidorAtualizado.prioridade,
          dataAtualizacao: reembolsoServidorAtualizado.dataAtualizacao,
          urlComprovante: reembolsoServidorAtualizado.urlComprovante || null
        }
      };
      
      await dispararWebhook(WebhookEventType.REEMBOLSO_ATUALIZADO, payload);
      
      return reembolsoServidorAtualizado;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar reembolso';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Excluir um reembolso
  const deleteReembolso = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Verificar se o reembolso existe
      const reembolsoParaExcluir = reembolsos.find(r => r.id === id);
      if (!reembolsoParaExcluir) {
        throw new Error(`Reembolso com ID ${id} não encontrado`);
      }
      
      // Remover o reembolso localmente primeiro para feedback imediato
      setReembolsos(prevReembolsos => prevReembolsos.filter(r => r.id !== id));
      
      // Enviar a solicitação de exclusão para a API
      const response = await fetch(`/api/reembolsos/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // Reverter alterações locais em caso de erro
        setReembolsos(prevReembolsos => [...prevReembolsos, reembolsoParaExcluir]);
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir reembolso');
      }
      
      // Disparar webhook para reembolso excluído
      const payload: ReembolsoEventPayload = {
        evento: WebhookEventType.REEMBOLSO_EXCLUIDO,
        timestamp: new Date().toISOString(),
        dados: {
          reembolsoId: reembolsoParaExcluir.id,
          numeroPedidoTiny: reembolsoParaExcluir.numeroPedidoTiny,
          nomeCliente: reembolsoParaExcluir.nomeCliente,
          status: reembolsoParaExcluir.status,
          valorReembolso: reembolsoParaExcluir.valorReembolso,
          prioridade: reembolsoParaExcluir.prioridade,
          dataAtualizacao: new Date().toISOString(),
          urlComprovante: reembolsoParaExcluir.urlComprovante || null
        }
      };
      
      await dispararWebhook(WebhookEventType.REEMBOLSO_EXCLUIDO, payload);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao excluir reembolso';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obter todos os reembolsos
  const getReembolsos = async (): Promise<Reembolso[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reembolsos');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar reembolsos');
      }
      
      const data = await response.json();
      setReembolsos(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar reembolsos';
      setError(errorMessage);
      console.error('Erro ao carregar reembolsos:', err);
      
      // Em ambiente de desenvolvimento, se a API falhar, podemos usar os dados locais
      if (process.env.NODE_ENV === 'development') {
        return reembolsos;
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar o status de um reembolso
  const updateReembolsoStatus = async (id: string, status: ReembolsoStatus, comprovanteFile?: File): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const reembolsoExistente = reembolsos.find(r => r.id === id);
      
      if (!reembolsoExistente) {
        throw new Error(`Reembolso com ID ${id} não encontrado`);
      }
      
      // Atualizar primeiro localmente para feedback imediato
      const reembolsoAtualizado = {
        ...reembolsoExistente,
        status,
        dataAtualizacao: new Date().toISOString(),
        usuarioAtualizacao: profile?.name || profile?.email || 'sistema'
      };
      
      setReembolsos(prevReembolsos => 
        prevReembolsos.map(r => r.id === id ? reembolsoAtualizado : r)
      );
      
      // Preparar dados para envio à API
      const formData = new FormData();
      formData.append('status', status);
      
      // Adicionar o arquivo de comprovante se existir
      if (comprovanteFile) {
        formData.append('comprovante', comprovanteFile);
      }
      
      // Enviar a atualização para a API
      const response = await fetch(`/api/reembolsos/${id}/status`, {
        method: 'PUT',
        body: formData,
      });
      
      if (!response.ok) {
        // Reverter mudanças locais em caso de erro
        setReembolsos(prevReembolsos => 
          prevReembolsos.map(r => r.id === id ? reembolsoExistente : r)
        );
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar status do reembolso');
      }
      
      // Atualizar o reembolso com os dados retornados pela API
      const reembolsoResponse = await response.json();
      setReembolsos(prevReembolsos => 
        prevReembolsos.map(r => r.id === id ? reembolsoResponse : r)
      );
      
      // Disparar webhook para status de reembolso atualizado
      const payload: ReembolsoEventPayload = {
        evento: WebhookEventType.REEMBOLSO_STATUS_ATUALIZADO,
        timestamp: new Date().toISOString(),
        dados: {
          reembolsoId: reembolsoResponse.id,
          numeroPedidoTiny: reembolsoResponse.numeroPedidoTiny,
          nomeCliente: reembolsoResponse.nomeCliente,
          status: reembolsoResponse.status,
          valorReembolso: reembolsoResponse.valorReembolso,
          prioridade: reembolsoResponse.prioridade,
          dataAtualizacao: reembolsoResponse.dataAtualizacao,
          urlComprovante: reembolsoResponse.urlComprovante || null
        }
      };
      
      await dispararWebhook(WebhookEventType.REEMBOLSO_STATUS_ATUALIZADO, payload);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar status do reembolso';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ReembolsosContext.Provider
      value={{
        reembolsos,
        loading,
        error,
        filtros,
        setFiltros,
        getReembolsos,
        getReembolsoById,
        createReembolso,
        updateReembolso,
        deleteReembolso,
        updateReembolsoStatus
      }}
    >
      {children}
    </ReembolsosContext.Provider>
  );
}; 