'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Troca, 
  TrocaInput, 
  TrocaUpdate, 
  ComentarioTroca, 
  ComentarioTrocaInput,
  TrocaFiltros,
  TrocaStatus,
  TrocaTipo,
  TipoTroca,
  StatusTrocaEmprestamos,
  StatusTrocaPegamosEmprestado,
} from '@/types/trocas';
import { useAuth } from './AuthContext';
import { useWebhooks } from './WebhooksContext';
import { WebhookEventType, TrocaEventPayload } from '@/types/webhooks';
import { toast } from 'react-hot-toast';
import { useToast } from '@/components/ui/toast-provider';

// Interface para o contexto
interface TrocasContextProps {
  trocas: Troca[];
  loading: boolean;
  error: string | null;
  filtros: TrocaFiltros;
  setFiltros: (filtros: TrocaFiltros) => void;
  getTrocas: () => Promise<Troca[]>;
  getTrocaById: (id: string) => Promise<Troca | null>;
  createTroca: (dados: TrocaInput) => Promise<Troca>;
  updateTroca: (id: string, dados: TrocaUpdate) => Promise<Troca>;
  deleteTroca: (id: string) => Promise<boolean>;
  addComentario: (trocaId: string, comentario: ComentarioTrocaInput) => Promise<ComentarioTroca>;
  filtrarTrocas: (filtro: TrocaFiltros) => Troca[];
  exportarTrocas: (filtro: TrocaFiltros) => Promise<string>;
  finalizarTroca: (id: string) => Promise<Troca>;
  updateTrocaStatus: (id: string, status: TrocaStatus) => Promise<boolean>;
}

// Criar o contexto
const TrocasContext = createContext<TrocasContextProps | undefined>(undefined);

// Hook para usar o contexto
export const useTrocas = () => {
  const context = useContext(TrocasContext);
  if (context === undefined) {
    throw new Error('useTrocas deve ser usado dentro de um TrocasProvider');
  }
  return context;
};

interface TrocasProviderProps {
  children: ReactNode;
}

// Dados de exemplo para trocas
const TROCAS_MOCK: Troca[] = [
  {
    id: '1',
    tipo: TrocaTipo.ENVIADA,
    status: TrocaStatus.AGUARDANDO_DEVOLUCAO,
    dataCriacao: new Date(Date.now() - 259200000).toISOString(), // 3 dias atrás
    dataAtualizacao: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
    ean: '7891234567890',
    nomeProduto: 'Produto A',
    lojaParceira: 'Loja Parceira ABC',
    responsavel: 'João Silva',
    telefoneResponsavel: '(11) 98765-4321',
    motivo: 'Cliente solicitou específico para evento',
    observacoes: 'Devolução prevista para 10/04/2023',
    usuarioCriacao: 'admin',
    quantidade: 2,
    comentarios: [
      {
        id: '1',
        usuarioId: 'admin',
        usuarioNome: 'Administrador',
        texto: 'Entrei em contato para confirmar a devolução',
        dataCriacao: new Date(Date.now() - 86400000).toISOString() // 1 dia atrás
      }
    ]
  },
  {
    id: '2',
    tipo: TrocaTipo.RECEBIDA,
    status: TrocaStatus.COLETADO,
    dataCriacao: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
    dataAtualizacao: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
    ean: '7891234567891',
    nomeProduto: 'Condicionador Dove',
    lojaParceira: 'Loja Shopping',
    responsavel: 'Maria Oliveira',
    telefoneResponsavel: '(11) 98765-1234',
    motivo: 'Estoque em falta',
    usuarioCriacao: 'admin',
    quantidade: 1,
    comentarios: []
  }
];

// Provider component
export const TrocasProvider: React.FC<TrocasProviderProps> = ({ children }) => {
  const [trocas, setTrocas] = useState<Troca[]>(TROCAS_MOCK);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const { dispararWebhook } = useWebhooks();
  const [filtros, setFiltros] = useState<TrocaFiltros>({});

  // Carregar trocas do armazenamento local ao iniciar
  useEffect(() => {
    const loadTrocas = () => {
      try {
        const savedTrocas = localStorage.getItem('trocas');
        if (savedTrocas) {
          setTrocas(JSON.parse(savedTrocas));
        }
      } catch (err) {
        console.error('Erro ao carregar trocas:', err);
      }
    };

    loadTrocas();
  }, []);

  // Salvar trocas no armazenamento local quando mudar
  useEffect(() => {
    try {
      localStorage.setItem('trocas', JSON.stringify(trocas));
    } catch (err) {
      console.error('Erro ao salvar trocas:', err);
    }
  }, [trocas]);

  // Obter uma troca específica pelo ID
  const getTroca = (id: string) => trocas.find(troca => troca.id === id);

  // Obter uma troca pelo ID (da API)
  const getTrocaById = async (id: string): Promise<Troca | null> => {
    // Verificar se já temos a troca em memória
    const trocaLocal = trocas.find(t => t.id === id);
    if (trocaLocal) {
      return trocaLocal;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trocas/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar troca');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar troca';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Criar uma nova troca
  const createTroca = async (dados: TrocaInput): Promise<Troca> => {
    setLoading(true);
    setError(null);

    try {
      // Definir o status inicial baseado no tipo de troca
      let statusInicial: TrocaStatus;
      
      if (dados.tipo === TrocaTipo.ENVIADA) {
        statusInicial = TrocaStatus.AGUARDANDO_DEVOLUCAO;
      } else {
        statusInicial = TrocaStatus.COLETADO;
      }
      
      const response = await fetch('/api/trocas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dados,
          status: statusInicial
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar troca');
      }
      
      const novaTroca = await response.json();
      
      // Atualizar a lista de trocas em memória
      setTrocas(prevTrocas => [...prevTrocas, novaTroca]);
      
      // Disparar webhook para troca criada
      const payload: TrocaEventPayload = {
        evento: WebhookEventType.TROCA_CRIADA,
        timestamp: new Date().toISOString(),
        dados: {
          trocaId: novaTroca.id,
          tipo: novaTroca.tipo,
          status: novaTroca.status,
          ean: novaTroca.ean,
          nomeProduto: novaTroca.nomeProduto,
          lojaParceira: novaTroca.lojaParceira,
          responsavel: novaTroca.responsavel,
          telefoneResponsavel: novaTroca.telefoneResponsavel,
          motivo: novaTroca.motivo,
          dataAtualizacao: novaTroca.dataAtualizacao
        }
      };
      
      await dispararWebhook(WebhookEventType.TROCA_CRIADA, payload);
      
      return novaTroca;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao criar troca';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar uma troca existente
  const updateTroca = async (id: string, dados: TrocaUpdate): Promise<Troca> => {
    setLoading(true);
    setError(null);

    try {
      // Verifica se temos a troca em cache
      const trocaExistente = trocas.find(t => t.id === id);
      
      if (!trocaExistente) {
        throw new Error(`Troca com ID ${id} não encontrada`);
      }
      
      // Atualiza a troca localmente primeiro para feedback imediato ao usuário
      const trocaAtualizada = {
        ...trocaExistente,
        ...dados,
        dataAtualizacao: new Date().toISOString()
      };
      
      // Atualiza o estado local
      setTrocas(prevTrocas => 
        prevTrocas.map(t => (t.id === id ? trocaAtualizada : t))
      );

      // Faz a requisição para a API
      const response = await fetch(`/api/trocas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar troca');
      }
      
      const responseData = await response.json();
      
      return responseData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar troca';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Finalizar uma troca (marcar como devolvida)
  const finalizarTroca = async (id: string): Promise<Troca> => {
    const troca = getTroca(id);
    if (!troca) {
      throw new Error(`Troca com ID ${id} não encontrada`);
    }
    
    // Determinar o status final com base no tipo de troca
    let status;
    if (troca.tipo === TrocaTipo.ENVIADA) {
      status = TrocaStatus.FINALIZADA;
    } else {
      status = TrocaStatus.FINALIZADA;
    }
    
    return await updateTroca(id, { status });
  };

  // Excluir uma troca
  const deleteTroca = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trocas/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir troca');
      }
      
      // Atualizar a lista de trocas em memória
      setTrocas(prevTrocas => prevTrocas.filter(t => t.id !== id));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao excluir troca';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Adicionar um comentário a uma troca
  const addComentario = async (trocaId: string, comentarioData: ComentarioTrocaInput): Promise<ComentarioTroca> => {
    setLoading(true);
    setError(null);
    
    try {
      const troca = getTroca(trocaId);
      if (!troca) {
        throw new Error(`Troca com ID ${trocaId} não encontrada`);
      }
      
      const now = new Date().toISOString();
      
      const newComentario: ComentarioTroca = {
        id: Date.now().toString(),
        usuarioId: profile?.id || 'unknown',
        usuarioNome: profile?.name || 'Usuário',
        texto: comentarioData.texto,
        dataCriacao: now
      };
      
      const updatedTroca = {
        ...troca,
        comentarios: [...(troca.comentarios || []), newComentario],
        dataAtualizacao: now
      };
      
      setTrocas(prev => prev.map(t => t.id === trocaId ? updatedTroca : t));
      
      // Disparar webhook quando comentário for adicionado
      const payload: TrocaEventPayload = {
        evento: WebhookEventType.TROCA_ATUALIZADA,
        timestamp: now,
        dados: {
          trocaId: updatedTroca.id,
          tipo: updatedTroca.tipo,
          status: updatedTroca.status,
          ean: updatedTroca.ean,
          nomeProduto: updatedTroca.nomeProduto,
          lojaParceira: updatedTroca.lojaParceira,
          responsavel: updatedTroca.responsavel,
          telefoneResponsavel: updatedTroca.telefoneResponsavel,
          motivo: updatedTroca.motivo,
          dataAtualizacao: updatedTroca.dataAtualizacao
        }
      };
      
      await dispararWebhook(WebhookEventType.TROCA_ATUALIZADA, payload);
      
      return newComentario;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar comentário');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Filtrar trocas com base nos critérios fornecidos
  const filtrarTrocas = (filtro: TrocaFiltros): Troca[] => {
    let trocasFiltradas = [...trocas];
    
    if (filtro.tipo && filtro.tipo.length > 0) {
      trocasFiltradas = trocasFiltradas.filter(t => filtro.tipo?.includes(t.tipo));
    }
    
    if (filtro.status && filtro.status.length > 0) {
      trocasFiltradas = trocasFiltradas.filter(t => filtro.status?.includes(t.status as any));
    }
    
    if (filtro.lojaParceira) {
      trocasFiltradas = trocasFiltradas.filter(t => 
        t.lojaParceira.toLowerCase().includes(filtro.lojaParceira!.toLowerCase())
      );
    }
    
    if (filtro.nomeProduto) {
      trocasFiltradas = trocasFiltradas.filter(t => 
        t.nomeProduto.toLowerCase().includes(filtro.nomeProduto!.toLowerCase())
      );
    }
    
    if (filtro.responsavel) {
      trocasFiltradas = trocasFiltradas.filter(t => 
        t.responsavel.toLowerCase().includes(filtro.responsavel!.toLowerCase())
      );
    }
    
    if (filtro.dataInicio) {
      const dataInicio = new Date(filtro.dataInicio);
      trocasFiltradas = trocasFiltradas.filter(t => new Date(t.dataCriacao) >= dataInicio);
    }
    
    if (filtro.dataFim) {
      const dataFim = new Date(filtro.dataFim);
      dataFim.setHours(23, 59, 59, 999); // Fim do dia
      trocasFiltradas = trocasFiltradas.filter(t => new Date(t.dataCriacao) <= dataFim);
    }
    
    return trocasFiltradas;
  };

  // Exportar trocas filtradas para CSV
  const exportarTrocas = async (filtro: TrocaFiltros): Promise<string> => {
    const trocasFiltradas = filtrarTrocas(filtro);
    
    // Cabeçalhos do CSV
    const headers = [
      'ID', 
      'Tipo', 
      'Status', 
      'Data de Criação', 
      'Última Atualização', 
      'Data de Finalização',
      'EAN', 
      'Nome do Produto', 
      'Loja Parceira', 
      'Responsável', 
      'Telefone', 
      'Motivo', 
      'Observação'
    ];
    
    // Função auxiliar para formatar datas
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    };
    
    // Função para obter label do status
    const getStatusLabel = (tipo: TrocaTipo, status: string) => {
      // Retornar o status formatado para exibição
      if (status === TrocaStatus.AGUARDANDO_DEVOLUCAO) {
        return 'Aguardando Devolução';
      } else if (status === TrocaStatus.COLETADO) {
        return 'Coletado';
      } else if (status === TrocaStatus.FINALIZADA) {
        return 'Finalizada';
      } else if (status === TrocaStatus.CANCELADA) {
        return 'Cancelada';
      }
      return status;
    };
    
    // Função auxiliar para obter label do tipo
    const getTipoLabel = (tipo: TrocaTipo) => {
      return tipo === TrocaTipo.ENVIADA ? 'Enviada' : 'Recebida';
    };
    
    // Função para escapar campos CSV
    const escapeCsv = (field: string) => {
      if (field === null || field === undefined) return '';
      return `"${String(field).replace(/"/g, '""')}"`;
    };
    
    // Converter trocas para linhas CSV
    let csv = headers.join(',') + '\n';
    trocasFiltradas.forEach(troca => {
      csv += [
        troca.id,
        escapeCsv(getTipoLabel(troca.tipo)),
        escapeCsv(getStatusLabel(troca.tipo, troca.status)),
        troca.ean,
        escapeCsv(troca.nomeProduto),
        troca.quantidade.toString(),
        escapeCsv(troca.lojaParceira),
        escapeCsv(troca.responsavel),
        escapeCsv(troca.telefoneResponsavel),
        escapeCsv(troca.motivo),
        formatDate(troca.dataCriacao)
      ].join(',') + '\n';
    });
    
    return csv;
  };

  // Buscar todas as trocas
  const getTrocas = async (): Promise<Troca[]> => {
    // Evitar chamadas desnecessárias se já tivermos dados
    if (trocas.length > 0 && !loading) {
      return trocas;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/trocas');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar trocas');
      }
      
      const data = await response.json();
      console.log('Dados recebidos da API:', data);
      data.forEach((troca: Troca) => {
        console.log(`Troca ${troca.id} - tipo: ${troca.tipo}, status: ${troca.status}`);
      });
      setTrocas(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar trocas';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar o status de uma troca
  const updateTrocaStatus = async (id: string, status: TrocaStatus): Promise<boolean> => {
    try {
      console.log(`Tentando atualizar troca ${id} para status ${status}`);
      
      // Verificar se a troca existe na lista local
      const trocaExistente = trocas.find(t => t.id === id);
      if (!trocaExistente) {
        console.error(`Troca com ID ${id} não encontrada na lista local`);
        throw new Error(`Troca com ID ${id} não encontrada`);
      }

      // Atualizar a lista local imediatamente para feedback ao usuário
      setTrocas((trocasAtuais) => {
        return trocasAtuais.map((troca) => {
          if (troca.id === id) {
            console.log(`Atualizando troca ${id} na lista local para status ${status}`);
            return { ...troca, status, dataAtualizacao: new Date().toISOString() };
          }
          return troca;
        });
      });

      // Fazer a requisição para a API
      const response = await fetch(`/api/trocas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao atualizar status: ${response.statusText}`);
      }

      const trocaAtualizada = await response.json();
      console.log('Resposta da API após atualização:', trocaAtualizada);
      
      // Recarregar a lista de trocas para sincronizar com o servidor
      await getTrocas();
      
      toast.success('Status atualizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error(`Erro ao atualizar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      // Recarregar as trocas para restaurar o estado correto
      await getTrocas();
      return false;
    }
  };

  return (
    <TrocasContext.Provider
      value={{
        trocas,
        loading,
        error,
        filtros,
        setFiltros,
        getTrocas,
        getTrocaById,
        createTroca,
        updateTroca,
        deleteTroca,
        addComentario,
        filtrarTrocas,
        exportarTrocas,
        finalizarTroca,
        updateTrocaStatus
      }}
    >
      {children}
    </TrocasContext.Provider>
  );
}; 