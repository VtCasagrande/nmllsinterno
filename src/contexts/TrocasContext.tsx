'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
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
import { trocasService } from '@/services/trocasService';

// Interface para o contexto
interface TrocasContextProps {
  trocas: Troca[];
  loading: boolean;
  error: string | null;
  filtros: TrocaFiltros;
  setFiltros: (filtros: TrocaFiltros) => void;
  getTrocas: () => Promise<void>;
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
  const [trocas, setTrocas] = useState<Troca[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();
  const [filtros, setFiltros] = useState<TrocaFiltros>({});

  // Carregar trocas do Supabase ao iniciar
  useEffect(() => {
    getTrocas();
  }, []);

  // Obter todas as trocas
  const getTrocas = async (): Promise<void> => {
    if (!profile) return;

    try {
      setLoading(true);
      setError(null);
      const data = await trocasService.buscarTrocas();
      setTrocas(data);
    } catch (err) {
      console.error('Erro ao carregar trocas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar trocas';
      setError(errorMessage);
      toast({
        title: "Erro ao carregar trocas",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Obter uma troca pelo ID
  const getTrocaById = async (id: string): Promise<Troca | null> => {
    if (!profile) return null;
    
    try {
      setLoading(true);
      setError(null);
      const troca = await trocasService.buscarTrocaPorId(id);
      return troca;
    } catch (err) {
      console.error(`Erro ao buscar troca ${id}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar troca';
      setError(errorMessage);
      toast({
        title: "Erro ao buscar troca",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Criar uma nova troca
  const createTroca = async (dados: TrocaInput): Promise<Troca> => {
    if (!profile) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const novaTroca = await trocasService.criarTroca(dados, profile.id);
      
      // Atualizar o estado local
      setTrocas(prevTrocas => [...prevTrocas, novaTroca]);
      
      toast({
        title: "Troca criada",
        description: "A troca foi criada com sucesso",
        variant: "default"
      });
      
      return novaTroca;
    } catch (err) {
      console.error('Erro ao criar troca:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao criar troca';
      setError(errorMessage);
      
      toast({
        title: "Erro ao criar troca",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar uma troca existente
  const updateTroca = async (id: string, dados: TrocaUpdate): Promise<Troca> => {
    if (!profile) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const trocaAtualizada = await trocasService.atualizarTroca(id, dados, profile.id);
      
      // Atualizar o estado local
      setTrocas(prevTrocas => 
        prevTrocas.map(t => t.id === id ? trocaAtualizada : t)
      );
      
      toast({
        title: "Troca atualizada",
        description: "A troca foi atualizada com sucesso",
        variant: "default"
      });
      
      return trocaAtualizada;
    } catch (err) {
      console.error(`Erro ao atualizar troca ${id}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar troca';
      setError(errorMessage);
      
      toast({
        title: "Erro ao atualizar troca",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Finalizar uma troca
  const finalizarTroca = async (id: string): Promise<Troca> => {
    if (!profile) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const trocaFinalizada = await trocasService.finalizarTroca(id, profile.id);
      
      // Atualizar o estado local
      setTrocas(prevTrocas => 
        prevTrocas.map(t => t.id === id ? trocaFinalizada : t)
      );
      
      toast({
        title: "Troca finalizada",
        description: "A troca foi finalizada com sucesso",
        variant: "default"
      });
      
      return trocaFinalizada;
    } catch (err) {
      console.error(`Erro ao finalizar troca ${id}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao finalizar troca';
      setError(errorMessage);
      
      toast({
        title: "Erro ao finalizar troca",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Excluir uma troca
  const deleteTroca = async (id: string): Promise<boolean> => {
    if (!profile) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await trocasService.excluirTroca(id, profile.id);
      
      // Atualizar o estado local
      setTrocas(prevTrocas => prevTrocas.filter(t => t.id !== id));
      
      toast({
        title: "Troca excluída",
        description: "A troca foi excluída com sucesso",
        variant: "default"
      });
      
      return true;
    } catch (err) {
      console.error(`Erro ao excluir troca ${id}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao excluir troca';
      setError(errorMessage);
      
      toast({
        title: "Erro ao excluir troca",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Adicionar comentário a uma troca
  const addComentario = async (trocaId: string, comentario: ComentarioTrocaInput): Promise<ComentarioTroca> => {
    if (!profile) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const novoComentario = await trocasService.adicionarComentario(
        trocaId, 
        comentario.texto, 
        profile.id
      );
      
      // Atualizar o estado local
      setTrocas(prevTrocas => 
        prevTrocas.map(t => {
          if (t.id === trocaId) {
            const comentariosAtualizados = [...(t.comentarios || []), novoComentario];
            return { ...t, comentarios: comentariosAtualizados };
          }
          return t;
        })
      );
      
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi adicionado com sucesso",
        variant: "default"
      });
      
      return novoComentario;
    } catch (err) {
      console.error(`Erro ao adicionar comentário à troca ${trocaId}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao adicionar comentário';
      setError(errorMessage);
      
      toast({
        title: "Erro ao adicionar comentário",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Filtrar trocas baseado em critérios
  const filtrarTrocas = (filtro: TrocaFiltros): Troca[] => {
    if (!filtro || Object.keys(filtro).length === 0) {
      return trocas;
    }

    return trocas.filter(troca => {
      // Filtrar por tipo
      if (filtro.tipo && troca.tipo !== filtro.tipo) {
        return false;
      }
      
      // Filtrar por status
      if (filtro.status && troca.status !== filtro.status) {
        return false;
      }
      
      // Filtrar por EAN
      if (filtro.ean && !troca.ean.toLowerCase().includes(filtro.ean.toLowerCase())) {
        return false;
      }
      
      // Filtrar por nome do produto
      if (filtro.nomeProduto && !troca.nomeProduto.toLowerCase().includes(filtro.nomeProduto.toLowerCase())) {
        return false;
      }
      
      // Filtrar por loja parceira
      if (filtro.lojaParceira && !troca.lojaParceira.toLowerCase().includes(filtro.lojaParceira.toLowerCase())) {
        return false;
      }
      
      // Filtrar por responsável
      if (filtro.responsavel && !troca.responsavel.toLowerCase().includes(filtro.responsavel.toLowerCase())) {
        return false;
      }
      
      // Filtrar por período
      if (filtro.dataInicio && filtro.dataFim) {
        const dataCriacao = new Date(troca.dataCriacao);
        const dataInicio = new Date(filtro.dataInicio);
        const dataFim = new Date(filtro.dataFim);
        
        if (dataCriacao < dataInicio || dataCriacao > dataFim) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Gerar arquivo CSV para exportação
  const exportarTrocas = async (filtro: TrocaFiltros): Promise<string> => {
    const trocasFiltradas = filtrarTrocas(filtro);
    
    // Cabeçalho do CSV
    const headers = [
      'ID', 'Tipo', 'Status', 'EAN', 'Produto', 'Quantidade',
      'Loja Parceira', 'Responsável', 'Telefone',
      'Motivo', 'Observações', 'Data de Criação', 'Data de Atualização'
    ];
    
    // Função para formatar data
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleString('pt-BR');
    };
    
    // Função para obter o label do status
    const getStatusLabel = (tipo: TrocaTipo, status: string) => {
      if (tipo === TrocaTipo.ENVIADA) {
        if (status === TrocaStatus.AGUARDANDO_DEVOLUCAO) return 'Aguardando Devolução';
        if (status === TrocaStatus.FINALIZADA) return 'Finalizada';
        if (status === TrocaStatus.CANCELADA) return 'Cancelada';
      } else {
        if (status === TrocaStatus.COLETADO) return 'Item Coletado';
        if (status === TrocaStatus.FINALIZADA) return 'Finalizada';
        if (status === TrocaStatus.CANCELADA) return 'Cancelada';
      }
      return status;
    };
    
    // Função para obter o label do tipo
    const getTipoLabel = (tipo: TrocaTipo) => {
      return tipo === TrocaTipo.ENVIADA ? 'Enviada' : 'Recebida';
    };
    
    // Função para escapar texto no CSV
    const escapeCsv = (field: string) => {
      if (field === null || field === undefined) return '';
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    // Linha de cabeçalho
    let csv = headers.join(',') + '\n';
    
    // Adicionar dados
    trocasFiltradas.forEach(troca => {
      const row = [
        escapeCsv(troca.id),
        escapeCsv(getTipoLabel(troca.tipo)),
        escapeCsv(getStatusLabel(troca.tipo, troca.status)),
        escapeCsv(troca.ean),
        escapeCsv(troca.nomeProduto),
        escapeCsv(String(troca.quantidade)),
        escapeCsv(troca.lojaParceira),
        escapeCsv(troca.responsavel),
        escapeCsv(troca.telefoneResponsavel || ''),
        escapeCsv(troca.motivo),
        escapeCsv(troca.observacoes || ''),
        escapeCsv(formatDate(troca.dataCriacao)),
        escapeCsv(formatDate(troca.dataAtualizacao))
      ];
      
      csv += row.join(',') + '\n';
    });
    
    return csv;
  };

  // Atualizar o status de uma troca
  const updateTrocaStatus = async (id: string, status: TrocaStatus): Promise<boolean> => {
    if (!profile) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await trocasService.atualizarStatusTroca(id, status, profile.id);
      
      // Atualizar o estado local
      setTrocas(prevTrocas => 
        prevTrocas.map(t => t.id === id ? { ...t, status } : t)
      );
      
      toast({
        title: "Status atualizado",
        description: "O status da troca foi atualizado com sucesso",
        variant: "default"
      });
      
      return true;
    } catch (err) {
      console.error(`Erro ao atualizar status da troca ${id}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar status';
      setError(errorMessage);
      
      toast({
        title: "Erro ao atualizar status",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Trocas filtradas com base nos filtros atuais
  const trocasFiltradas = useMemo(() => {
    return filtrarTrocas(filtros);
  }, [trocas, filtros]);

  return (
    <TrocasContext.Provider value={{
      trocas: trocasFiltradas,
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
    }}>
      {children}
    </TrocasContext.Provider>
  );
}; 