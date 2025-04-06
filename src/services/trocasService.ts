import { supabase } from '@/lib/supabase';
import { Troca, TrocaStatus, TrocaTipo, ComentarioTroca } from '@/types/trocas';
import { v4 as uuidv4 } from 'uuid';

const logAction = async (
  action: 'create' | 'update' | 'delete',
  description: string,
  entity: string,
  entityId: string,
  userId: string
) => {
  try {
    await supabase.from('logs').insert({
      acao: action,
      descricao: description,
      entidade: entity,
      entidade_id: entityId,
      usuario_id: userId
    });
  } catch (error) {
    console.error('Erro ao registrar log:', error);
  }
};

// Mapeia os tipos do banco para os tipos da interface
const mapTrocaFromDB = (data: any): Troca => {
  return {
    id: data.id,
    tipo: data.tipo,
    status: data.status,
    ean: data.ean,
    nomeProduto: data.nome_produto,
    quantidade: data.quantidade,
    lojaParceira: data.loja_parceira,
    responsavel: data.responsavel,
    telefoneResponsavel: data.telefone_responsavel,
    motivo: data.motivo,
    observacoes: data.observacoes,
    dataCriacao: data.created_at,
    dataAtualizacao: data.updated_at,
    usuarioCriacao: data.created_by,
    usuarioAtualizacao: data.updated_by,
    comentarios: []
  };
};

// Mapeia os comentários do banco para a interface
const mapComentarioFromDB = (data: any): ComentarioTroca => {
  return {
    id: data.id,
    usuarioId: data.usuario_id,
    usuarioNome: data.profile?.name || 'Usuário',
    texto: data.texto,
    dataCriacao: data.created_at
  };
};

export const trocasService = {
  /**
   * Busca todas as trocas
   */
  async buscarTrocas(filtros?: {
    tipo?: TrocaTipo;
    status?: TrocaStatus;
    ean?: string;
    lojaParceira?: string;
    dataInicio?: string;
    dataFim?: string;
    nomeProduto?: string;
    responsavel?: string;
  }): Promise<Troca[]> {
    try {
      let query = supabase
        .from('trocas')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Aplicar filtros se fornecidos
      if (filtros) {
        if (filtros.tipo) {
          query = query.eq('tipo', filtros.tipo);
        }
        
        if (filtros.status) {
          query = query.eq('status', filtros.status);
        }
        
        if (filtros.ean) {
          query = query.ilike('ean', `%${filtros.ean}%`);
        }
        
        if (filtros.lojaParceira) {
          query = query.ilike('loja_parceira', `%${filtros.lojaParceira}%`);
        }
        
        if (filtros.nomeProduto) {
          query = query.ilike('nome_produto', `%${filtros.nomeProduto}%`);
        }
        
        if (filtros.responsavel) {
          query = query.ilike('responsavel', `%${filtros.responsavel}%`);
        }
        
        if (filtros.dataInicio && filtros.dataFim) {
          query = query
            .gte('created_at', filtros.dataInicio)
            .lte('created_at', filtros.dataFim);
        }
      }

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Erro ao buscar trocas: ${error.message}`);
      }
      
      // Mapear para o formato da aplicação
      const trocas = await Promise.all(data.map(async (item) => {
        const troca = mapTrocaFromDB(item);
        
        // Buscar comentários de cada troca
        const { data: comentariosData, error: comentariosError } = await supabase
          .from('trocas_comentarios')
          .select('*, profile:profiles(name)')
          .eq('troca_id', troca.id)
          .order('created_at', { ascending: true });
        
        if (!comentariosError && comentariosData) {
          troca.comentarios = comentariosData.map(mapComentarioFromDB);
        }
        
        return troca;
      }));
      
      return trocas;
    } catch (error) {
      console.error('Erro ao buscar trocas:', error);
      throw error;
    }
  },
  
  /**
   * Busca uma troca pelo ID
   */
  async buscarTrocaPorId(id: string): Promise<Troca | null> {
    try {
      const { data, error } = await supabase
        .from('trocas')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(`Erro ao buscar troca: ${error.message}`);
      }
      
      if (!data) {
        return null;
      }
      
      // Mapear para o formato da aplicação
      const troca = mapTrocaFromDB(data);
      
      // Buscar comentários da troca
      const { data: comentariosData, error: comentariosError } = await supabase
        .from('trocas_comentarios')
        .select('*, profile:profiles(name)')
        .eq('troca_id', troca.id)
        .order('created_at', { ascending: true });
      
      if (!comentariosError && comentariosData) {
        troca.comentarios = comentariosData.map(mapComentarioFromDB);
      }
      
      return troca;
    } catch (error) {
      console.error(`Erro ao buscar troca com ID ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Cria uma nova troca
   */
  async criarTroca(dados: {
    tipo: TrocaTipo;
    ean: string;
    nomeProduto: string;
    quantidade: number;
    lojaParceira: string;
    responsavel: string;
    telefoneResponsavel?: string;
    motivo: string;
    observacoes?: string;
  }, userId: string): Promise<Troca> {
    try {
      // Definir o status inicial baseado no tipo de troca
      let statusInicial: TrocaStatus;
      
      if (dados.tipo === TrocaTipo.ENVIADA) {
        statusInicial = TrocaStatus.AGUARDANDO_DEVOLUCAO;
      } else {
        statusInicial = TrocaStatus.COLETADO;
      }
      
      const { data, error } = await supabase
        .from('trocas')
        .insert({
          tipo: dados.tipo,
          status: statusInicial,
          ean: dados.ean,
          nome_produto: dados.nomeProduto,
          quantidade: dados.quantidade,
          loja_parceira: dados.lojaParceira,
          responsavel: dados.responsavel,
          telefone_responsavel: dados.telefoneResponsavel || null,
          motivo: dados.motivo,
          observacoes: dados.observacoes || null,
          created_by: userId
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Erro ao criar troca: ${error.message}`);
      }
      
      await logAction(
        'create',
        'Nova troca registrada',
        'trocas',
        data.id,
        userId
      );
      
      return mapTrocaFromDB(data);
    } catch (error) {
      console.error('Erro ao criar troca:', error);
      throw error;
    }
  },
  
  /**
   * Atualiza uma troca existente
   */
  async atualizarTroca(id: string, dados: {
    tipo?: TrocaTipo;
    status?: TrocaStatus;
    ean?: string;
    nomeProduto?: string;
    quantidade?: number;
    lojaParceira?: string;
    responsavel?: string;
    telefoneResponsavel?: string;
    motivo?: string;
    observacoes?: string;
  }, userId: string): Promise<Troca> {
    try {
      // Verificar se a troca existe
      const { data: trocaExistente, error: trocaError } = await supabase
        .from('trocas')
        .select('id')
        .eq('id', id)
        .single();
      
      if (trocaError || !trocaExistente) {
        throw new Error(`Troca não encontrada: ${trocaError?.message || 'ID inválido'}`);
      }
      
      // Mapear os dados para o formato do banco
      const dadosAtualizados: Record<string, any> = {
        updated_by: userId
      };
      
      if (dados.tipo !== undefined) dadosAtualizados.tipo = dados.tipo;
      if (dados.status !== undefined) dadosAtualizados.status = dados.status;
      if (dados.ean !== undefined) dadosAtualizados.ean = dados.ean;
      if (dados.nomeProduto !== undefined) dadosAtualizados.nome_produto = dados.nomeProduto;
      if (dados.quantidade !== undefined) dadosAtualizados.quantidade = dados.quantidade;
      if (dados.lojaParceira !== undefined) dadosAtualizados.loja_parceira = dados.lojaParceira;
      if (dados.responsavel !== undefined) dadosAtualizados.responsavel = dados.responsavel;
      if (dados.telefoneResponsavel !== undefined) dadosAtualizados.telefone_responsavel = dados.telefoneResponsavel;
      if (dados.motivo !== undefined) dadosAtualizados.motivo = dados.motivo;
      if (dados.observacoes !== undefined) dadosAtualizados.observacoes = dados.observacoes;
      
      const { data, error } = await supabase
        .from('trocas')
        .update(dadosAtualizados)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Erro ao atualizar troca: ${error.message}`);
      }
      
      await logAction(
        'update',
        'Troca atualizada',
        'trocas',
        id,
        userId
      );
      
      return mapTrocaFromDB(data);
    } catch (error) {
      console.error(`Erro ao atualizar troca ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Atualiza o status de uma troca
   */
  async atualizarStatusTroca(id: string, status: TrocaStatus, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trocas')
        .update({
          status,
          updated_by: userId
        })
        .eq('id', id);
      
      if (error) {
        throw new Error(`Erro ao atualizar status da troca: ${error.message}`);
      }
      
      await logAction(
        'update',
        `Status da troca atualizado para: ${status}`,
        'trocas',
        id,
        userId
      );
      
      return true;
    } catch (error) {
      console.error(`Erro ao atualizar status da troca ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Finaliza uma troca
   */
  async finalizarTroca(id: string, userId: string): Promise<Troca> {
    try {
      const { data, error } = await supabase
        .from('trocas')
        .update({
          status: TrocaStatus.FINALIZADA,
          updated_by: userId
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Erro ao finalizar troca: ${error.message}`);
      }
      
      await logAction(
        'update',
        'Troca finalizada',
        'trocas',
        id,
        userId
      );
      
      return mapTrocaFromDB(data);
    } catch (error) {
      console.error(`Erro ao finalizar troca ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Exclui uma troca
   */
  async excluirTroca(id: string, userId: string): Promise<boolean> {
    try {
      // Verificar se a troca existe
      const { data: trocaExistente, error: trocaError } = await supabase
        .from('trocas')
        .select('id')
        .eq('id', id)
        .single();
      
      if (trocaError || !trocaExistente) {
        throw new Error(`Troca não encontrada: ${trocaError?.message || 'ID inválido'}`);
      }
      
      // Excluir comentários relacionados
      await supabase
        .from('trocas_comentarios')
        .delete()
        .eq('troca_id', id);
      
      // Excluir a troca
      const { error } = await supabase
        .from('trocas')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Erro ao excluir troca: ${error.message}`);
      }
      
      await logAction(
        'delete',
        'Troca excluída',
        'trocas',
        id,
        userId
      );
      
      return true;
    } catch (error) {
      console.error(`Erro ao excluir troca ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Adiciona um comentário a uma troca
   */
  async adicionarComentario(trocaId: string, texto: string, userId: string): Promise<ComentarioTroca> {
    try {
      // Verificar se a troca existe
      const { data: trocaExistente, error: trocaError } = await supabase
        .from('trocas')
        .select('id')
        .eq('id', trocaId)
        .single();
      
      if (trocaError || !trocaExistente) {
        throw new Error(`Troca não encontrada: ${trocaError?.message || 'ID inválido'}`);
      }
      
      // Buscar informações do usuário
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.warn('Não foi possível buscar dados do usuário:', userError.message);
      }
      
      const userName = userData?.name || 'Usuário';
      
      // Adicionar o comentário
      const { data, error } = await supabase
        .from('trocas_comentarios')
        .insert({
          troca_id: trocaId,
          usuario_id: userId,
          texto
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Erro ao adicionar comentário: ${error.message}`);
      }
      
      await logAction(
        'create',
        'Comentário adicionado à troca',
        'trocas_comentarios',
        data.id,
        userId
      );
      
      // Construir o objeto de retorno
      const comentario: ComentarioTroca = {
        id: data.id,
        usuarioId: userId,
        usuarioNome: userName,
        texto: data.texto,
        dataCriacao: data.created_at
      };
      
      return comentario;
    } catch (error) {
      console.error(`Erro ao adicionar comentário à troca ${trocaId}:`, error);
      throw error;
    }
  }
};

// Exportar uma versão compatível para os endpoints existentes
export const trocas = trocasService; 