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
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';

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

// Provider component
export const SugestoesProvider: React.FC<SugestoesProviderProps> = ({ children }) => {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const { dispararWebhook } = useWebhooks();

  // Carregar sugestões do Supabase ao iniciar
  useEffect(() => {
    const fetchSugestoes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('sugestoes')
          .select(`
            id,
            ean,
            nome_produto,
            fornecedor,
            cliente,
            telefone_cliente,
            urgencia,
            status,
            observacao,
            created_by,
            created_at,
            updated_at,
            sugestoes_comentarios (
              id,
              usuario_id,
              texto,
              created_at,
              profiles:usuario_id (
                name
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        // Transformar dados do Supabase para o formato da aplicação
        const formattedSugestoes: Sugestao[] = data.map(item => ({
          id: item.id,
          data: item.created_at,
          ean: item.ean,
          nomeProduto: item.nome_produto,
          fornecedor: item.fornecedor || '',
          cliente: item.cliente || '',
          telefoneCliente: item.telefone_cliente || '',
          urgencia: item.urgencia as UrgenciaSugestao,
          status: item.status as StatusSugestao,
          observacao: item.observacao || '',
          criadoPor: item.created_by,
          dataCriacao: item.created_at,
          dataAtualizacao: item.updated_at,
          comentarios: item.sugestoes_comentarios?.map(c => ({
            id: c.id,
            usuarioId: c.usuario_id,
            usuarioNome: c.profiles && c.profiles[0]?.name || 'Usuário',
            texto: c.texto,
            dataCriacao: c.created_at
          })) || []
        }));

        setSugestoes(formattedSugestoes);
      } catch (err: any) {
        console.error('Erro ao carregar sugestões:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSugestoes();
  }, []);

  // Adicionar listener para atualizações em tempo real
  useEffect(() => {
    const sugestoesChannel = supabase
      .channel('public:sugestoes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sugestoes' 
      }, async (payload) => {
        await fetchSugestoes();
      })
      .subscribe();

    const comentariosChannel = supabase
      .channel('public:sugestoes_comentarios')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sugestoes_comentarios' 
      }, async (payload) => {
        await fetchSugestoes();
      })
      .subscribe();

    // Função para carregar dados
    const fetchSugestoes = async () => {
      try {
        const { data, error } = await supabase
          .from('sugestoes')
          .select(`
            id,
            ean,
            nome_produto,
            fornecedor,
            cliente,
            telefone_cliente,
            urgencia,
            status,
            observacao,
            created_by,
            created_at,
            updated_at,
            sugestoes_comentarios (
              id,
              usuario_id,
              texto,
              created_at,
              profiles:usuario_id (
                name
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        // Transformar dados do Supabase para o formato da aplicação
        const formattedSugestoes: Sugestao[] = data.map(item => ({
          id: item.id,
          data: item.created_at,
          ean: item.ean,
          nomeProduto: item.nome_produto,
          fornecedor: item.fornecedor || '',
          cliente: item.cliente || '',
          telefoneCliente: item.telefone_cliente || '',
          urgencia: item.urgencia as UrgenciaSugestao,
          status: item.status as StatusSugestao,
          observacao: item.observacao || '',
          criadoPor: item.created_by,
          dataCriacao: item.created_at,
          dataAtualizacao: item.updated_at,
          comentarios: item.sugestoes_comentarios?.map(c => ({
            id: c.id,
            usuarioId: c.usuario_id,
            usuarioNome: c.profiles && c.profiles[0]?.name || 'Usuário',
            texto: c.texto,
            dataCriacao: c.created_at
          })) || []
        }));

        setSugestoes(formattedSugestoes);
      } catch (err: any) {
        console.error('Erro ao atualizar sugestões:', err);
      }
    };

    return () => {
      supabase.removeChannel(sugestoesChannel);
      supabase.removeChannel(comentariosChannel);
    };
  }, []);

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
      
      // Mapear campos para o formato do Supabase
      const supabaseData: any = {};
      if (data.ean !== undefined) supabaseData.ean = data.ean;
      if (data.nomeProduto !== undefined) supabaseData.nome_produto = data.nomeProduto;
      if (data.fornecedor !== undefined) supabaseData.fornecedor = data.fornecedor;
      if (data.cliente !== undefined) supabaseData.cliente = data.cliente;
      if (data.telefoneCliente !== undefined) supabaseData.telefone_cliente = data.telefoneCliente;
      if (data.urgencia !== undefined) supabaseData.urgencia = data.urgencia;
      if (data.status !== undefined) supabaseData.status = data.status;
      if (data.observacao !== undefined) supabaseData.observacao = data.observacao;
      
      // Atualizar no Supabase
      const { data: updatedData, error } = await supabase
        .from('sugestoes')
        .update({
          ...supabaseData,
          updated_at: now
        })
        .eq('id', id)
        .select(`
          id,
          ean,
          nome_produto,
          fornecedor,
          cliente,
          telefone_cliente,
          urgencia,
          status,
          observacao,
          created_by,
          created_at,
          updated_at,
          sugestoes_comentarios (
            id,
            usuario_id,
            texto,
            created_at,
            profiles:usuario_id (
              name
            )
          )
        `)
        .single();
      
      if (error) {
        throw new Error(`Erro ao atualizar sugestão: ${error.message}`);
      }
      
      // Transformar resposta para o formato da aplicação
      const updatedSugestao: Sugestao = {
        id: updatedData.id,
        data: updatedData.created_at,
        ean: updatedData.ean,
        nomeProduto: updatedData.nome_produto,
        fornecedor: updatedData.fornecedor || '',
        cliente: updatedData.cliente || '',
        telefoneCliente: updatedData.telefone_cliente || '',
        urgencia: updatedData.urgencia as UrgenciaSugestao,
        status: updatedData.status as StatusSugestao,
        observacao: updatedData.observacao || '',
        criadoPor: updatedData.created_by,
        dataCriacao: updatedData.created_at,
        dataAtualizacao: updatedData.updated_at,
        comentarios: updatedData.sugestoes_comentarios?.map(c => ({
          id: c.id,
          usuarioId: c.usuario_id,
          usuarioNome: c.profiles && c.profiles[0]?.name || 'Usuário',
          texto: c.texto,
          dataCriacao: c.created_at
        })) || []
      };
      
      // Atualizar estado local
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
      if (!profile) {
        throw new Error('Usuário não autenticado');
      }
      
      const now = new Date().toISOString();
      
      // Inserir no Supabase
      const { data: newData, error } = await supabase
        .from('sugestoes')
        .insert({
          ean: data.ean,
          nome_produto: data.nomeProduto,
          fornecedor: data.fornecedor,
          cliente: data.cliente,
          telefone_cliente: data.telefoneCliente,
          urgencia: data.urgencia || UrgenciaSugestao.MEDIA,
          status: StatusSugestao.CRIADO,
          observacao: data.observacao,
          created_by: profile.id
        })
        .select(`
          id,
          ean,
          nome_produto,
          fornecedor,
          cliente,
          telefone_cliente,
          urgencia,
          status,
          observacao,
          created_by,
          created_at,
          updated_at
        `)
        .single();
      
      if (error) {
        throw new Error(`Erro ao criar sugestão: ${error.message}`);
      }
      
      // Formatar para o modelo da aplicação
      const newSugestao: Sugestao = {
        id: newData.id,
        data: newData.created_at,
        ean: newData.ean,
        nomeProduto: newData.nome_produto,
        fornecedor: newData.fornecedor || '',
        cliente: newData.cliente || '',
        telefoneCliente: newData.telefone_cliente || '',
        urgencia: newData.urgencia as UrgenciaSugestao,
        status: newData.status as StatusSugestao,
        observacao: newData.observacao || '',
        criadoPor: newData.created_by,
        dataCriacao: newData.created_at,
        dataAtualizacao: newData.updated_at,
        comentarios: []
      };
      
      // Atualizar estado local
      setSugestoes(prev => [newSugestao, ...prev]);
      
      // Disparar webhook para nova sugestão
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
      // Excluir do Supabase
      const { error } = await supabase
        .from('sugestoes')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Erro ao excluir sugestão: ${error.message}`);
      }
      
      // Atualizar estado local
      setSugestoes(prev => prev.filter(s => s.id !== id));
      
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
      if (!profile) {
        throw new Error('Usuário não autenticado');
      }
      
      // Verificar se a sugestão existe
      const sugestao = getSugestao(sugestaoId);
      if (!sugestao) {
        throw new Error(`Sugestão com ID ${sugestaoId} não encontrada`);
      }
      
      // Inserir no Supabase
      const { data: newComentario, error } = await supabase
        .from('sugestoes_comentarios')
        .insert({
          sugestao_id: sugestaoId,
          usuario_id: profile.id,
          texto: comentarioData.texto
        })
        .select(`
          id,
          usuario_id,
          texto,
          created_at,
          profiles:usuario_id (
            name
          )
        `)
        .single();
      
      if (error) {
        throw new Error(`Erro ao adicionar comentário: ${error.message}`);
      }
      
      // Formatar para o modelo da aplicação
      const comentario: Comentario = {
        id: newComentario.id,
        usuarioId: newComentario.usuario_id,
        usuarioNome: newComentario.profiles && newComentario.profiles[0]?.name || profile.name || 'Usuário',
        texto: newComentario.texto,
        dataCriacao: newComentario.created_at
      };
      
      // Atualizar estado local
      setSugestoes(prev => prev.map(s => {
        if (s.id === sugestaoId) {
          return {
            ...s,
            comentarios: [...(s.comentarios || []), comentario]
          };
        }
        return s;
      }));
      
      return comentario;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar comentário');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Filtrar sugestões
  const filtrarSugestoes = (filtro: FiltroSugestao): Sugestao[] => {
    let resultado = [...sugestoes];
    
    if (filtro.id) {
      resultado = resultado.filter(s => s.id === filtro.id);
    }
    if (filtro.ean) {
      resultado = resultado.filter(s => s.ean.includes(filtro.ean!));
    }
    if (filtro.nomeProduto) {
      resultado = resultado.filter(s => s.nomeProduto.toLowerCase().includes(filtro.nomeProduto!.toLowerCase()));
    }
    if (filtro.status) {
      resultado = resultado.filter(s => filtro.status?.includes(s.status));
    }
    if (filtro.urgencia) {
      resultado = resultado.filter(s => filtro.urgencia?.includes(s.urgencia));
    }
    if (filtro.dataInicio) {
      const dataInicio = new Date(filtro.dataInicio);
      resultado = resultado.filter(s => new Date(s.dataCriacao) >= dataInicio);
    }
    if (filtro.dataFim) {
      const dataFim = new Date(filtro.dataFim);
      dataFim.setHours(23, 59, 59, 999); // Fim do dia
      resultado = resultado.filter(s => new Date(s.dataCriacao) <= dataFim);
    }
    
    return resultado;
  };

  // Exportar sugestões para CSV
  const exportarSugestoes = async (filtro: FiltroSugestao): Promise<string> => {
    const sugestoesFiltradas = filtrarSugestoes(filtro);
    
    if (sugestoesFiltradas.length === 0) {
      throw new Error('Nenhuma sugestão encontrada para exportar');
    }
    
    // Cabeçalho do CSV
    let csv = 'ID,EAN,Produto,Fornecedor,Cliente,Telefone,Urgência,Status,Observação,Data de Criação,Última Atualização\n';
    
    // Adicionar linhas
    sugestoesFiltradas.forEach(s => {
      csv += `${escapeCsv(s.id)},`;
      csv += `${escapeCsv(s.ean)},`;
      csv += `${escapeCsv(s.nomeProduto)},`;
      csv += `${escapeCsv(s.fornecedor || '')},`;
      csv += `${escapeCsv(s.cliente || '')},`;
      csv += `${escapeCsv(s.telefoneCliente || '')},`;
      csv += `${escapeCsv(s.urgencia)},`;
      csv += `${escapeCsv(s.status)},`;
      csv += `${escapeCsv(s.observacao || '')},`;
      csv += `${escapeCsv(formatDate(s.dataCriacao))},`;
      csv += `${escapeCsv(formatDate(s.dataAtualizacao))}\n`;
    });
    
    return csv;
  };
  
  // Funções auxiliares para exportação
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  };
  
  const escapeCsv = (field: string) => {
    if (!field) return '';
    // Escapar aspas e envolver em aspas se tiver vírgula
    const escaped = String(field).replace(/"/g, '""');
    return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"') 
      ? `"${escaped}"` 
      : escaped;
  };

  return (
    <SugestoesContext.Provider value={{
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
    }}>
      {children}
    </SugestoesContext.Provider>
  );
}; 