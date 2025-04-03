'use client';

import { useState, useEffect } from 'react';

// Definindo interfaces localmente para não depender de arquivos externos
interface Webhook {
  id: string;
  nome: string;
  url: string;
  eventos: string[];
  headers?: Record<string, string>;
  status: string;
  dataCriacao: string;
  ultimaAtualizacao: string;
  ultimaExecucao?: string;
  ultimoStatus?: number;
}

// Versão simplificada do hook useWebhooks
function useWebhooksInterno() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const obterWebhooks = async (): Promise<Webhook[]> => {
    setLoading(true);
    try {
      // Simulação de chamada API
      await new Promise(resolve => setTimeout(resolve, 500));
      return [];
    } catch (erro) {
      setError('Erro ao obter webhooks');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const dispararEventoEmTodosWebhooks = async (tipo: string, payload: any): Promise<{ [webhookId: string]: { sucesso: boolean; statusCode?: number; erro?: string } }> => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {};
    } catch (erro) {
      setError(`Erro ao disparar evento ${tipo} em webhooks`);
      return {};
    } finally {
      setLoading(false);
    }
  };

  return {
    webhooks,
    loading,
    error,
    obterWebhooks,
    dispararEventoEmTodosWebhooks
  };
}

export enum FrequenciaMedicamento {
  DIARIO = 'diario',
  SEMANAL = 'semanal',
  QUINZENAL = 'quinzenal',
  MENSAL = 'mensal',
  ESPECIFICO = 'especifico'
}

export enum StatusLembrete {
  ATIVO = 'ativo',
  INATIVO = 'inativo',
  FINALIZADO = 'finalizado'
}

export interface LembreteMedicamento {
  id: string;
  clienteId: string;
  clienteNome: string;
  medicamentos: string[];
  dataCriacao: string;
  dataAtualizacao: string;
  dataInicio: string;
  dataFim?: string;
  frequencia: FrequenciaMedicamento;
  horarios: string[];
  diasSemana?: number[]; // 0 = domingo, 1 = segunda, etc. (usado para frequencia semanal)
  diasMes?: number[]; // dias do mês (usado para frequencia mensal)
  dataEspecifica?: string[]; // datas específicas (usado para frequencia especifica)
  status: StatusLembrete;
  notificacaoAntecipada: boolean;
  minutoNotificacaoAntecipada?: number;
  ultimaNotificacao?: string;
  observacoes?: string;
}

export function useLembretesMedicamentos() {
  const [lembretes, setLembretes] = useState<LembreteMedicamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webhookHook = useWebhooksInterno();

  // Função para obter lembretes do servidor
  const obterLembretes = async (): Promise<LembreteMedicamento[]> => {
    setLoading(true);
    try {
      // Simulação de API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Dados de exemplo
      const dadosExemplo: LembreteMedicamento[] = [
        {
          id: '1',
          clienteId: '123',
          clienteNome: 'João Silva',
          medicamentos: ['Losartana 50mg', 'Atenolol 25mg'],
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
          dataInicio: new Date().toISOString(),
          frequencia: FrequenciaMedicamento.DIARIO,
          horarios: ['08:00', '20:00'],
          status: StatusLembrete.ATIVO,
          notificacaoAntecipada: true,
          minutoNotificacaoAntecipada: 30,
          observacoes: 'Tomar antes das refeições'
        },
        {
          id: '2',
          clienteId: '456',
          clienteNome: 'Maria Oliveira',
          medicamentos: ['Insulina', 'Metformina 500mg'],
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
          dataInicio: new Date().toISOString(),
          frequencia: FrequenciaMedicamento.SEMANAL,
          horarios: ['12:00'],
          diasSemana: [1, 3, 5], // Segunda, quarta e sexta
          status: StatusLembrete.ATIVO,
          notificacaoAntecipada: false
        }
      ];
      
      setLembretes(dadosExemplo);
      return dadosExemplo;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao carregar lembretes';
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar um lembrete pelo ID
  const obterLembretePorId = async (id: string): Promise<LembreteMedicamento | null> => {
    setLoading(true);
    try {
      // Simulação de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const lembrete = lembretes.find(l => l.id === id);
      return lembrete || null;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao buscar lembrete';
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Função para criar um novo lembrete
  const criarLembrete = async (lembrete: Omit<LembreteMedicamento, 'id' | 'dataCriacao' | 'dataAtualizacao'>): Promise<LembreteMedicamento> => {
    setLoading(true);
    try {
      // Simulação de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const novoLembrete: LembreteMedicamento = {
        ...lembrete,
        id: Date.now().toString(),
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      };
      
      setLembretes(prev => [...prev, novoLembrete]);
      
      // Disparar webhook
      try {
        await webhookHook.dispararEventoEmTodosWebhooks(
          'LEMBRETE_MEDICAMENTO', 
          { 
            acao: 'criado', 
            lembrete: { 
              id: novoLembrete.id, 
              cliente: novoLembrete.clienteNome,
              medicamentos: novoLembrete.medicamentos,
              frequencia: novoLembrete.frequencia
            } 
          }
        );
      } catch (err) {
        console.error('Erro ao disparar webhook de lembrete:', err);
      }
      
      return novoLembrete;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao criar lembrete';
      setError(error);
      throw new Error(error);
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar um lembrete existente
  const atualizarLembrete = async (id: string, dadosAtualizados: Partial<Omit<LembreteMedicamento, 'id' | 'dataCriacao' | 'dataAtualizacao'>>): Promise<LembreteMedicamento> => {
    setLoading(true);
    try {
      // Simulação de API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const lembreteExistente = lembretes.find(l => l.id === id);
      
      if (!lembreteExistente) {
        throw new Error('Lembrete não encontrado');
      }
      
      const lembreteAtualizado: LembreteMedicamento = {
        ...lembreteExistente,
        ...dadosAtualizados,
        dataAtualizacao: new Date().toISOString()
      };
      
      setLembretes(prev => prev.map(l => l.id === id ? lembreteAtualizado : l));
      
      // Disparar webhook
      try {
        await webhookHook.dispararEventoEmTodosWebhooks(
          'LEMBRETE_MEDICAMENTO', 
          { 
            acao: 'atualizado', 
            lembrete: { 
              id: lembreteAtualizado.id, 
              cliente: lembreteAtualizado.clienteNome,
              alteracoes: Object.keys(dadosAtualizados)
            } 
          }
        );
      } catch (err) {
        console.error('Erro ao disparar webhook de lembrete:', err);
      }
      
      return lembreteAtualizado;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao atualizar lembrete';
      setError(error);
      throw new Error(error);
    } finally {
      setLoading(false);
    }
  };

  // Função para excluir um lembrete
  const excluirLembrete = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Simulação de API
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const lembreteExistente = lembretes.find(l => l.id === id);
      
      if (!lembreteExistente) {
        throw new Error('Lembrete não encontrado');
      }
      
      setLembretes(prev => prev.filter(l => l.id !== id));
      
      // Disparar webhook
      try {
        await webhookHook.dispararEventoEmTodosWebhooks(
          'LEMBRETE_MEDICAMENTO', 
          { 
            acao: 'excluido', 
            lembrete: { 
              id: lembreteExistente.id, 
              cliente: lembreteExistente.clienteNome
            } 
          }
        );
      } catch (err) {
        console.error('Erro ao disparar webhook de lembrete:', err);
      }
      
      return true;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao excluir lembrete';
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função para marcar um lembrete como finalizado
  const finalizarLembrete = async (id: string): Promise<LembreteMedicamento> => {
    setLoading(true);
    try {
      // Simulação de API
      await new Promise(resolve => setTimeout(resolve, 700));
      
      const lembreteExistente = lembretes.find(l => l.id === id);
      
      if (!lembreteExistente) {
        throw new Error('Lembrete não encontrado');
      }
      
      const lembreteAtualizado: LembreteMedicamento = {
        ...lembreteExistente,
        status: StatusLembrete.FINALIZADO,
        dataFim: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      };
      
      setLembretes(prev => prev.map(l => l.id === id ? lembreteAtualizado : l));
      
      // Disparar webhook
      try {
        await webhookHook.dispararEventoEmTodosWebhooks(
          'LEMBRETE_MEDICAMENTO', 
          { 
            acao: 'finalizado', 
            lembrete: { 
              id: lembreteAtualizado.id, 
              cliente: lembreteAtualizado.clienteNome,
              dataFim: lembreteAtualizado.dataFim
            } 
          }
        );
      } catch (err) {
        console.error('Erro ao disparar webhook de lembrete:', err);
      }
      
      return lembreteAtualizado;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao finalizar lembrete';
      setError(error);
      throw new Error(error);
    } finally {
      setLoading(false);
    }
  };

  // Função para enviar notificação manual para um lembrete
  const enviarNotificacaoManual = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Simulação de API
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const lembreteExistente = lembretes.find(l => l.id === id);
      
      if (!lembreteExistente) {
        throw new Error('Lembrete não encontrado');
      }
      
      const lembreteAtualizado: LembreteMedicamento = {
        ...lembreteExistente,
        ultimaNotificacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      };
      
      setLembretes(prev => prev.map(l => l.id === id ? lembreteAtualizado : l));
      
      // Disparar webhook
      try {
        await webhookHook.dispararEventoEmTodosWebhooks(
          'LEMBRETE_MEDICAMENTO', 
          { 
            acao: 'notificacao_enviada', 
            lembrete: { 
              id: lembreteAtualizado.id, 
              cliente: lembreteAtualizado.clienteNome,
              medicamentos: lembreteAtualizado.medicamentos,
              dataNotificacao: lembreteAtualizado.ultimaNotificacao
            } 
          }
        );
      } catch (err) {
        console.error('Erro ao disparar webhook de lembrete:', err);
      }
      
      return true;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao enviar notificação';
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    lembretes,
    loading,
    error,
    obterLembretes,
    obterLembretePorId,
    criarLembrete,
    atualizarLembrete,
    excluirLembrete,
    finalizarLembrete,
    enviarNotificacaoManual
  };
} 