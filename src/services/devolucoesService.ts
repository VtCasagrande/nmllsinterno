import { supabase } from '@/lib/supabase';

// Interface para os dados de devolução
export interface Devolucao {
  id: string;
  codigo: string;
  produto: string;
  motivo: 'produto_danificado' | 'produto_incorreto' | 'cliente_desistiu' | 'endereco_nao_encontrado' | 'outro';
  status: 'pendente' | 'em_analise' | 'finalizado' | 'cancelado';
  data: string;
  responsavel: string;
  responsavel_recebimento: string;
  responsavel_analise?: string;
  observacoes?: string;
  fotos?: string[];
  data_finalizacao?: string;
  pedido_tiny?: string;
  nota_fiscal?: string;
  descricao?: string;
  produtos?: { id: number; codigo: string; nome: string; quantidade: number }[];
  comentarios?: { id: number; texto: string; autor: string; data: string }[];
}

// Interface para criação/atualização de devoluções
export interface DevolucaoInput {
  produto: string;
  motivo: 'produto_danificado' | 'produto_incorreto' | 'cliente_desistiu' | 'endereco_nao_encontrado' | 'outro';
  descricao?: string;
  responsavel_id: string;
  data_recebimento: string;
}

// Interface para filtro de devoluções
export interface DevolucaoFiltro {
  status?: 'pendente' | 'em_analise' | 'finalizado' | 'cancelado';
  motivo?: 'produto_danificado' | 'produto_incorreto' | 'cliente_desistiu' | 'endereco_nao_encontrado' | 'outro';
  data_inicio?: string;
  data_fim?: string;
  responsavel_id?: string;
  produto?: string;
}

// Serviço para gerenciar devoluções
export const devolucoesService = {
  /**
   * Busca todas as devoluções com opção de filtro
   */
  async getDevolucoes(filtro?: DevolucaoFiltro): Promise<Devolucao[]> {
    try {
      let query = supabase
        .from('devolucoes')
        .select(`
          id,
          codigo,
          produto,
          motivo,
          status,
          data_recebimento,
          responsavel:responsavel_id (id, name),
          atribuido:atribuido_id (id, name),
          descricao,
          created_at,
          updated_at,
          devolucoes_fotos (id, url),
          devolucoes_comentarios (id, comentario, usuario_id, created_at, profiles:usuario_id (name))
        `);

      // Aplicar filtros
      if (filtro?.status) {
        query = query.eq('status', filtro.status);
      }
      if (filtro?.motivo) {
        query = query.eq('motivo', filtro.motivo);
      }
      if (filtro?.responsavel_id) {
        query = query.eq('responsavel_id', filtro.responsavel_id);
      }
      if (filtro?.produto) {
        query = query.ilike('produto', `%${filtro.produto}%`);
      }
      if (filtro?.data_inicio) {
        query = query.gte('data_recebimento', filtro.data_inicio);
      }
      if (filtro?.data_fim) {
        query = query.lte('data_recebimento', filtro.data_fim);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar devoluções:', error);
        return [];
      }

      // Transformar para o formato esperado
      return data.map(d => ({
        id: d.id,
        codigo: d.codigo,
        produto: d.produto,
        motivo: d.motivo,
        status: d.status,
        data: d.data_recebimento,
        responsavel: d.responsavel?.name || 'Não atribuído',
        responsavel_recebimento: d.responsavel?.name || 'Não atribuído',
        responsavel_analise: d.atribuido?.name,
        observacoes: d.descricao,
        fotos: d.devolucoes_fotos?.map(f => f.url) || [],
        data_finalizacao: d.updated_at,
        comentarios: d.devolucoes_comentarios?.map(c => ({
          id: c.id,
          texto: c.comentario,
          autor: c.profiles?.name || 'Usuário',
          data: c.created_at
        })) || []
      }));
    } catch (error) {
      console.error('Erro ao buscar devoluções:', error);
      return [];
    }
  },

  /**
   * Busca uma devolução pelo ID
   */
  async getDevolucaoById(id: string): Promise<Devolucao | null> {
    try {
      const { data, error } = await supabase
        .from('devolucoes')
        .select(`
          id,
          codigo,
          produto,
          motivo,
          status,
          data_recebimento,
          responsavel:responsavel_id (id, name),
          atribuido:atribuido_id (id, name),
          descricao,
          created_at,
          updated_at,
          devolucoes_fotos (id, url),
          devolucoes_comentarios (id, comentario, usuario_id, created_at, profiles:usuario_id (name))
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar devolução:', error);
        return null;
      }

      return {
        id: data.id,
        codigo: data.codigo,
        produto: data.produto,
        motivo: data.motivo,
        status: data.status,
        data: data.data_recebimento,
        responsavel: data.responsavel?.name || 'Não atribuído',
        responsavel_recebimento: data.responsavel?.name || 'Não atribuído',
        responsavel_analise: data.atribuido?.name,
        observacoes: data.descricao,
        fotos: data.devolucoes_fotos?.map(f => f.url) || [],
        data_finalizacao: data.updated_at,
        comentarios: data.devolucoes_comentarios?.map(c => ({
          id: c.id,
          texto: c.comentario,
          autor: c.profiles?.name || 'Usuário',
          data: c.created_at
        })) || []
      };
    } catch (error) {
      console.error('Erro ao buscar devolução:', error);
      return null;
    }
  },

  /**
   * Cria uma nova devolução
   */
  async createDevolucao(devolucao: DevolucaoInput, usuarioId: string): Promise<Devolucao | null> {
    try {
      const { data, error } = await supabase
        .from('devolucoes')
        .insert({
          produto: devolucao.produto,
          motivo: devolucao.motivo,
          descricao: devolucao.descricao,
          responsavel_id: devolucao.responsavel_id,
          data_recebimento: devolucao.data_recebimento,
          status: 'pendente'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar devolução:', error);
        return null;
      }

      return {
        id: data.id,
        codigo: data.codigo,
        produto: data.produto,
        motivo: data.motivo,
        status: data.status,
        data: data.data_recebimento,
        responsavel: usuarioId,
        responsavel_recebimento: usuarioId,
        observacoes: data.descricao,
        fotos: [],
        comentarios: []
      };
    } catch (error) {
      console.error('Erro ao criar devolução:', error);
      return null;
    }
  },

  /**
   * Atualiza uma devolução existente
   */
  async updateDevolucao(id: string, devolucao: Partial<DevolucaoInput>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('devolucoes')
        .update({
          ...devolucao,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar devolução:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar devolução:', error);
      return false;
    }
  },

  /**
   * Adiciona um comentário a uma devolução
   */
  async addComentario(devolucaoId: string, texto: string, usuarioId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('devolucoes_comentarios')
        .insert({
          devolucao_id: devolucaoId,
          usuario_id: usuarioId,
          comentario: texto
        });

      if (error) {
        console.error('Erro ao adicionar comentário:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      return false;
    }
  },

  /**
   * Adiciona uma foto a uma devolução
   */
  async addFoto(devolucaoId: string, arquivo: File): Promise<string | null> {
    try {
      const filePath = `devolucoes/${devolucaoId}/${Date.now()}_${arquivo.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('devolucoes')
        .upload(filePath, arquivo);

      if (uploadError) {
        console.error('Erro ao fazer upload da foto:', uploadError);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('devolucoes')
        .getPublicUrl(filePath);

      // Registrar a foto na tabela devolucoes_fotos
      const { error: dbError } = await supabase
        .from('devolucoes_fotos')
        .insert({
          devolucao_id: devolucaoId,
          url: urlData.publicUrl
        });

      if (dbError) {
        console.error('Erro ao registrar foto no banco:', dbError);
        return null;
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao adicionar foto:', error);
      return null;
    }
  }
}; 