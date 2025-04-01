'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Sugestao, 
  SugestaoInput, 
  SugestaoUpdate, 
  StatusSugestao, 
  Comentario, 
  ComentarioInput,
  FiltroSugestao,
  UrgenciaSugestao
} from '@/types/sugestoes';
import { useAuth } from './AuthContext';
import { useWebhooks } from './WebhooksContext';
import { WebhookEventType, SugestaoEventPayload } from '@/types/webhooks';

// Interface para o contexto
interface SugestoesContextType {
  sugestoes: Sugestao[];
  loading: boolean;
  error: string | null;
  getSugestao: (id: string) => Sugestao | undefined;
  createSugestao: (data: SugestaoInput) => Promise<Sugestao>;
  updateSugestao: (id: string, data: SugestaoUpdate) => Promise<Sugestao>;
  deleteSugestao: (id: string) => Promise<boolean>;
  addComentario: (sugestaoId: string, comentario: ComentarioInput) => Promise<Comentario>;
  filtrarSugestoes: (filtro: FiltroSugestao) => Sugestao[];
  exportarSugestoes: (filtro: FiltroSugestao) => Promise<string>;
  avancarStatus: (id: string) => Promise<Sugestao>;
  updateStatusMultiple: (ids: string[], status: StatusSugestao) => Promise<Sugestao[]>;
}

// Criar o contexto
const SugestoesContext = createContext<SugestoesContextType | undefined>(undefined);

// Hook para usar o contexto
export const useSugestoes = () => {
  const context = useContext(SugestoesContext);
  if (context === undefined) {
    throw new Error('useSugestoes deve ser usado dentro de um SugestoesProvider');
  }
  return context;
};

interface SugestoesProviderProps {
  children: ReactNode;
}

// Dados de exemplo para sugestões
const SUGESTOES_MOCK: Sugestao[] = [
  {
    id: '1',
    data: new Date().toISOString(),
    ean: '7891234567890',
    nomeProduto: 'Detergente Líquido Ypê',
    fornecedor: 'Ypê',
    cliente: 'Maria Silva',
    telefoneCliente: '(11) 98765-4321',
    urgencia: UrgenciaSugestao.ALTA,
    status: StatusSugestao.CRIADO,
    observacao: 'Cliente frequente, solicita o produto semanalmente',
    comentarios: [
      {
        id: '1',
        usuarioId: 'admin',
        usuarioNome: 'Administrador',
        texto: 'Entrei em contato com o fornecedor, previsão de entrega em 5 dias',
        dataCriacao: new Date(Date.now() - 86400000).toISOString() // um dia atrás
      }
    ],
    criadoPor: 'admin',
    dataCriacao: new Date(Date.now() - 172800000).toISOString(), // dois dias atrás
    dataAtualizacao: new Date(Date.now() - 86400000).toISOString() // um dia atrás
  }
];

// Provider component
export const SugestoesProvider: React.FC<SugestoesProviderProps> = ({ children }) => {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>(SUGESTOES_MOCK);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const { dispararWebhook } = useWebhooks();

  // Carregar sugestões do armazenamento local ao iniciar
  useEffect(() => {
    const loadSugestoes = () => {
      try {
        const savedSugestoes = localStorage.getItem('sugestoes');
        if (savedSugestoes) {
          setSugestoes(JSON.parse(savedSugestoes));
        }
      } catch (err) {
        console.error('Erro ao carregar sugestões:', err);
      }
    };

    loadSugestoes();
  }, []);

  // Salvar sugestões no armazenamento local quando mudar
  useEffect(() => {
    try {
      localStorage.setItem('sugestoes', JSON.stringify(sugestoes));
    } catch (err) {
      console.error('Erro ao salvar sugestões:', err);
    }
  }, [sugestoes]);

  // Obter uma sugestão específica pelo ID
  const getSugestao = (id: string) => sugestoes.find(sugestao => sugestao.id === id);

  // Obter próximo status com base no status atual
  const getProximoStatus = (statusAtual: StatusSugestao): StatusSugestao => {
    switch (statusAtual) {
      case StatusSugestao.CRIADO:
        return StatusSugestao.PEDIDO_REALIZADO;
      case StatusSugestao.PEDIDO_REALIZADO:
        return StatusSugestao.PRODUTO_CHEGOU;
      default:
        return statusAtual; // Se já estiver no último status, mantém
    }
  };

  // Avançar para o próximo status automaticamente
  const avancarStatus = async (id: string): Promise<Sugestao> => {
    const sugestao = getSugestao(id);
    if (!sugestao) {
      throw new Error(`Sugestão com ID ${id} não encontrada`);
    }
    
    const proximoStatus = getProximoStatus(sugestao.status);
    // Se não houver mudança de status, retorna a sugestão sem alteração
    if (proximoStatus === sugestao.status) {
      return sugestao;
    }
    
    return await updateSugestao(id, { status: proximoStatus });
  };

  // Atualizar o status de múltiplas sugestões
  const updateStatusMultiple = async (ids: string[], status: StatusSugestao): Promise<Sugestao[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedSugestoes: Sugestao[] = [];
      
      for (const id of ids) {
        const sugestao = getSugestao(id);
        if (sugestao) {
          const updated = await updateSugestao(id, { status });
          updatedSugestoes.push(updated);
        }
      }
      
      return updatedSugestoes;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar status das sugestões');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar uma sugestão existente
  const updateSugestao = async (id: string, data: SugestaoUpdate): Promise<Sugestao> => {
    setLoading(true);
    setError(null);
    
    try {
      const sugestao = getSugestao(id);
      if (!sugestao) {
        throw new Error(`Sugestão com ID ${id} não encontrada`);
      }
      
      const now = new Date().toISOString();
      
      // Se o status mudou, atualizar as datas correspondentes
      let dataFields = {};
      if (data.status) {
        if (data.status === StatusSugestao.PEDIDO_REALIZADO && sugestao.status !== StatusSugestao.PEDIDO_REALIZADO) {
          dataFields = { dataPedidoRealizado: now };
        } else if (data.status === StatusSugestao.PRODUTO_CHEGOU && sugestao.status !== StatusSugestao.PRODUTO_CHEGOU) {
          dataFields = { dataProdutoChegou: now };
        }
      }
      
      const updatedSugestao = {
        ...sugestao,
        ...data,
        ...dataFields,
        dataAtualizacao: now
      };
      
      setSugestoes(prev => prev.map(s => s.id === id ? updatedSugestao : s));
      
      // Disparar webhook se o status foi alterado
      if (data.status && data.status !== sugestao.status) {
        let eventoWebhook: WebhookEventType | null = null;
        
        switch (data.status) {
          case StatusSugestao.PEDIDO_REALIZADO:
            eventoWebhook = WebhookEventType.SUGESTAO_PEDIDO_REALIZADO;
            break;
          case StatusSugestao.PRODUTO_CHEGOU:
            eventoWebhook = WebhookEventType.SUGESTAO_PRODUTO_CHEGOU;
            break;
        }
        
        if (eventoWebhook) {
          const payload: SugestaoEventPayload = {
            evento: eventoWebhook,
            timestamp: now,
            dados: {
              sugestaoId: updatedSugestao.id,
              ean: updatedSugestao.ean,
              nomeProduto: updatedSugestao.nomeProduto,
              fornecedor: updatedSugestao.fornecedor,
              cliente: updatedSugestao.cliente,
              telefoneCliente: updatedSugestao.telefoneCliente,
              status: updatedSugestao.status,
              urgencia: updatedSugestao.urgencia,
              dataAtualizacao: updatedSugestao.dataAtualizacao
            }
          };
          
          await dispararWebhook(eventoWebhook, payload);
        }
      }
      
      return updatedSugestao;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar sugestão');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Criar uma nova sugestão
  const createSugestao = async (data: SugestaoInput): Promise<Sugestao> => {
    setLoading(true);
    setError(null);
    
    try {
      // Em uma aplicação real, isso seria uma chamada API
      const now = new Date().toISOString();
      const newSugestao: Sugestao = {
        ...data,
        id: Date.now().toString(),
        data: now,
        status: StatusSugestao.CRIADO,
        comentarios: [],
        criadoPor: profile?.id || 'unknown',
        dataCriacao: now,
        dataAtualizacao: now
      };
      
      setSugestoes(prev => [...prev, newSugestao]);
      
      // Disparar webhook para sugestão criada
      const payload: SugestaoEventPayload = {
        evento: WebhookEventType.SUGESTAO_CRIADA,
        timestamp: now,
        dados: {
          sugestaoId: newSugestao.id,
          ean: newSugestao.ean,
          nomeProduto: newSugestao.nomeProduto,
          fornecedor: newSugestao.fornecedor,
          cliente: newSugestao.cliente,
          telefoneCliente: newSugestao.telefoneCliente,
          status: newSugestao.status,
          urgencia: newSugestao.urgencia,
          dataAtualizacao: newSugestao.dataAtualizacao
        }
      };
      
      await dispararWebhook(WebhookEventType.SUGESTAO_CRIADA, payload);
      
      return newSugestao;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar sugestão');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Excluir uma sugestão
  const deleteSugestao = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      setSugestoes(prev => prev.filter(sugestao => sugestao.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir sugestão');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Adicionar um comentário a uma sugestão
  const addComentario = async (sugestaoId: string, comentarioData: ComentarioInput): Promise<Comentario> => {
    setLoading(true);
    setError(null);
    
    try {
      const sugestao = getSugestao(sugestaoId);
      if (!sugestao) {
        throw new Error(`Sugestão com ID ${sugestaoId} não encontrada`);
      }
      
      const now = new Date().toISOString();
      
      const newComentario: Comentario = {
        id: Date.now().toString(),
        usuarioId: profile?.id || 'unknown',
        usuarioNome: profile?.name || 'Usuário',
        texto: comentarioData.texto,
        dataCriacao: now
      };
      
      const updatedSugestao = {
        ...sugestao,
        comentarios: [...sugestao.comentarios, newComentario],
        dataAtualizacao: now
      };
      
      setSugestoes(prev => prev.map(s => s.id === sugestaoId ? updatedSugestao : s));
      return newComentario;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar comentário');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Filtrar sugestões com base nos critérios fornecidos
  const filtrarSugestoes = (filtro: FiltroSugestao): Sugestao[] => {
    let sugestoesFiltradas = [...sugestoes];
    
    if (filtro.status && filtro.status.length > 0) {
      sugestoesFiltradas = sugestoesFiltradas.filter(s => filtro.status?.includes(s.status));
    }
    
    if (filtro.urgencia && filtro.urgencia.length > 0) {
      sugestoesFiltradas = sugestoesFiltradas.filter(s => filtro.urgencia?.includes(s.urgencia));
    }
    
    if (filtro.fornecedor) {
      sugestoesFiltradas = sugestoesFiltradas.filter(s => 
        s.fornecedor.toLowerCase().includes(filtro.fornecedor!.toLowerCase())
      );
    }
    
    if (filtro.nomeProduto) {
      sugestoesFiltradas = sugestoesFiltradas.filter(s => 
        s.nomeProduto.toLowerCase().includes(filtro.nomeProduto!.toLowerCase())
      );
    }
    
    if (filtro.cliente) {
      sugestoesFiltradas = sugestoesFiltradas.filter(s => 
        s.cliente.toLowerCase().includes(filtro.cliente!.toLowerCase())
      );
    }
    
    if (filtro.dataInicio) {
      const dataInicio = new Date(filtro.dataInicio);
      sugestoesFiltradas = sugestoesFiltradas.filter(s => new Date(s.data) >= dataInicio);
    }
    
    if (filtro.dataFim) {
      const dataFim = new Date(filtro.dataFim);
      dataFim.setHours(23, 59, 59, 999); // Fim do dia
      sugestoesFiltradas = sugestoesFiltradas.filter(s => new Date(s.data) <= dataFim);
    }
    
    return sugestoesFiltradas;
  };

  // Exportar sugestões filtradas para CSV
  const exportarSugestoes = async (filtro: FiltroSugestao): Promise<string> => {
    const sugestoesFiltradas = filtrarSugestoes(filtro);
    
    // Cabeçalhos do CSV
    const headers = [
      'ID', 
      'Data', 
      'EAN', 
      'Nome do Produto', 
      'Fornecedor', 
      'Cliente', 
      'Telefone', 
      'Urgência', 
      'Status', 
      'Observação',
      'Data de Criação',
      'Data do Pedido',
      'Data de Chegada'
    ];
    
    // Função auxiliar para formatar datas
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    };
    
    // Função para escapar campos CSV
    const escapeCsv = (field: string) => {
      if (field === null || field === undefined) return '';
      return `"${String(field).replace(/"/g, '""')}"`;
    };
    
    // Converter sugestões para linhas CSV
    const rows = sugestoesFiltradas.map(s => [
      s.id,
      formatDate(s.data),
      s.ean,
      s.nomeProduto,
      s.fornecedor,
      s.cliente,
      s.telefoneCliente,
      s.urgencia,
      s.status,
      s.observacao || '',
      formatDate(s.dataCriacao),
      formatDate(s.dataPedidoRealizado),
      formatDate(s.dataProdutoChegou)
    ].map(escapeCsv).join(','));
    
    // Combinar cabeçalhos e linhas
    const csv = [headers.join(','), ...rows].join('\n');
    
    return csv;
  };

  return (
    <SugestoesContext.Provider
      value={{
        sugestoes,
        loading,
        error,
        getSugestao,
        createSugestao,
        updateSugestao,
        deleteSugestao,
        addComentario,
        filtrarSugestoes,
        exportarSugestoes,
        avancarStatus,
        updateStatusMultiple
      }}
    >
      {children}
    </SugestoesContext.Provider>
  );
}; 