import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Interface para os dados de devolução
export interface Devolucao {
  id: string;
  codigo: string;
  produto: string;
  motivo: 'produto_danificado' | 'produto_incorreto' | 'cliente_desistiu' | 'endereco_nao_encontrado' | 'outro';
  status: 'pendente' | 'em_analise' | 'finalizado' | 'cancelado';
  data: string;
  responsavel: string;
  responsavel_id?: string;
  responsavel_recebimento: string;
  responsavel_analise?: string;
  observacoes?: string;
  fotos?: string[];
  data_finalizacao?: string;
  pedido_tiny?: string;
  nota_fiscal?: string;
  descricao?: string;
  produtos?: { id: string; codigo: string; nome: string; quantidade: number }[];
  comentarios?: { id: string; texto: string; autor: string; data: string; usuario_id?: string }[];
}

// Interface para criação/atualização de devoluções
export interface DevolucaoInput {
  produto: string;
  motivo: 'produto_danificado' | 'produto_incorreto' | 'cliente_desistiu' | 'endereco_nao_encontrado' | 'outro';
  descricao?: string;
  responsavel_id: string;
  data_recebimento: string;
  pedido_tiny?: string;
  nota_fiscal?: string;
  atribuido_id?: string;
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

// Interface para item de devolução
export interface ItemDevolucao {
  id?: string;
  codigo: string;
  nome: string;
  quantidade: number;
  devolucao_id?: string;
}

// Dados mockados para compatibilidade com o código existente (serão removidos após integração)
export const DEVOLUCOES_MOCK = [
  {
    id: 1,
    codigo: "DEV001",
    produto: "Smartphone Galaxy S21",
    motivo: "produto_danificado",
    status: "em_aberto",
    data: "2023-09-01",
    responsavel: "João Silva",
    responsavel_recebimento: "Maria Souza",
    produtos: [
      { id: 1, codigo: "SM-G991", nome: "Samsung Galaxy S21 5G", quantidade: 1 }
    ],
    comentarios: [
      { id: 1, texto: "Produto recebido. Tela trincada.", autor: "Maria Souza", data: "2023-09-01T10:30:00" }
    ]
  },
  // outros dados mockados...
];

const storageUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rnqdwjslfoxtdchxzgfr.supabase.co') + '/storage/v1/object/public/devolucoes/';

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
          responsavel_id,
          responsavel:responsavel_id (id, name),
          atribuido_id,
          atribuido:atribuido_id (id, name),
          descricao,
          pedido_tiny,
          nota_fiscal,
          created_at,
          updated_at,
          devolucoes_fotos (id, url),
          devolucoes_comentarios (id, comentario, usuario_id, created_at, profiles:usuario_id (name)),
          devolucoes_itens (id, codigo, nome, quantidade)
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
        responsavel_id: d.responsavel_id,
        responsavel: d.responsavel?.[0]?.name || 'Não atribuído',
        responsavel_recebimento: d.responsavel?.[0]?.name || 'Não atribuído',
        responsavel_analise: d.atribuido?.[0]?.name,
        observacoes: d.descricao,
        fotos: d.devolucoes_fotos?.map(f => f.url) || [],
        data_finalizacao: d.updated_at,
        pedido_tiny: d.pedido_tiny,
        nota_fiscal: d.nota_fiscal,
        produtos: d.devolucoes_itens?.map(item => ({
          id: item.id,
          codigo: item.codigo,
          nome: item.nome,
          quantidade: item.quantidade
        })) || [],
        comentarios: d.devolucoes_comentarios?.map(c => ({
          id: c.id,
          texto: c.comentario,
          autor: c.profiles?.[0]?.name || 'Usuário',
          usuario_id: c.usuario_id,
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
          responsavel_id,
          responsavel:responsavel_id (id, name),
          atribuido_id,
          atribuido:atribuido_id (id, name),
          descricao,
          pedido_tiny,
          nota_fiscal,
          created_at,
          updated_at,
          devolucoes_fotos (id, url),
          devolucoes_comentarios (id, comentario, usuario_id, created_at, profiles:usuario_id (name)),
          devolucoes_itens (id, codigo, nome, quantidade)
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
        responsavel_id: data.responsavel_id,
        responsavel: data.responsavel?.[0]?.name || 'Não atribuído',
        responsavel_recebimento: data.responsavel?.[0]?.name || 'Não atribuído',
        responsavel_analise: data.atribuido?.[0]?.name,
        observacoes: data.descricao,
        fotos: data.devolucoes_fotos?.map(f => f.url) || [],
        data_finalizacao: data.updated_at,
        pedido_tiny: data.pedido_tiny,
        nota_fiscal: data.nota_fiscal,
        produtos: data.devolucoes_itens?.map(item => ({
          id: item.id,
          codigo: item.codigo,
          nome: item.nome,
          quantidade: item.quantidade
        })) || [],
        comentarios: data.devolucoes_comentarios?.map(c => ({
          id: c.id,
          texto: c.comentario,
          autor: c.profiles?.[0]?.name || 'Usuário',
          usuario_id: c.usuario_id,
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
      // Gerar código único para a devolução
      const codigo = `DEV${new Date().getFullYear().toString().substring(2)}${Math.floor(1000 + Math.random() * 9000)}`;
      
      const { data, error } = await supabase
        .from('devolucoes')
        .insert({
          codigo,
          produto: devolucao.produto,
          motivo: devolucao.motivo,
          descricao: devolucao.descricao,
          responsavel_id: usuarioId,
          data_recebimento: devolucao.data_recebimento,
          status: 'pendente',
          pedido_tiny: devolucao.pedido_tiny,
          nota_fiscal: devolucao.nota_fiscal,
          created_by: usuarioId
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
        responsavel_id: usuarioId,
        responsavel_recebimento: usuarioId,
        observacoes: data.descricao,
        fotos: [],
        pedido_tiny: data.pedido_tiny,
        nota_fiscal: data.nota_fiscal,
        produtos: [],
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
  async updateDevolucao(id: string, devolucao: Partial<DevolucaoInput>, usuarioId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('devolucoes')
        .update({
          ...devolucao,
          updated_at: new Date().toISOString(),
          updated_by: usuarioId
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
   * Atualiza o status de uma devolução
   */
  async atualizarStatus(id: string, status: 'pendente' | 'em_analise' | 'finalizado' | 'cancelado', usuarioId: string): Promise<boolean> {
    try {
      const dadosAtualizacao: any = {
        status,
        updated_at: new Date().toISOString(),
        updated_by: usuarioId
      };
      
      // Se estiver atribuindo para análise
      if (status === 'em_analise') {
        dadosAtualizacao.atribuido_id = usuarioId;
      }
      
      // Se estiver finalizando ou cancelando
      if (status === 'finalizado' || status === 'cancelado') {
        dadosAtualizacao.data_finalizacao = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('devolucoes')
        .update(dadosAtualizacao)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar status da devolução:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar status da devolução:', error);
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
          id: uuidv4(),
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
   * Adiciona um item a uma devolução
   */
  async addItem(devolucaoId: string, item: ItemDevolucao, usuarioId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('devolucoes_itens')
        .insert({
          id: uuidv4(),
          devolucao_id: devolucaoId,
          codigo: item.codigo,
          nome: item.nome,
          quantidade: item.quantidade,
          created_by: usuarioId
        });

      if (error) {
        console.error('Erro ao adicionar item:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      return false;
    }
  },

  /**
   * Remove um item de uma devolução
   */
  async removeItem(itemId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('devolucoes_itens')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Erro ao remover item:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao remover item:', error);
      return false;
    }
  },

  /**
   * Atualiza vários itens de uma devolução
   */
  async updateItens(devolucaoId: string, itens: ItemDevolucao[], usuarioId: string): Promise<boolean> {
    try {
      // Primeiro buscar os itens existentes
      const { data: itensExistentes, error: errorBusca } = await supabase
        .from('devolucoes_itens')
        .select('id')
        .eq('devolucao_id', devolucaoId);
        
      if (errorBusca) {
        throw new Error(`Erro ao buscar itens existentes: ${errorBusca.message}`);
      }
      
      // IDs dos itens existentes
      const idsExistentes = itensExistentes.map(item => item.id);
      
      // Separar itens a serem atualizados dos novos
      const itensParaAtualizar = itens.filter(item => item.id && !item.id.startsWith('temp_'));
      const itensParaAdicionar = itens.filter(item => !item.id || item.id.startsWith('temp_'));
      
      // IDs dos itens que serão mantidos
      const idsManterItens = itensParaAtualizar.map(item => item.id);
      
      // IDs dos itens para excluir (itens que existem mas não estão na lista atualizada)
      const idsExcluirItens = idsExistentes.filter(id => !idsManterItens.includes(id));
      
      // Excluir itens removidos
      if (idsExcluirItens.length > 0) {
        const { error: errorExcluir } = await supabase
          .from('devolucoes_itens')
          .delete()
          .in('id', idsExcluirItens);
          
        if (errorExcluir) {
          throw new Error(`Erro ao excluir itens: ${errorExcluir.message}`);
        }
      }
      
      // Atualizar itens existentes
      for (const item of itensParaAtualizar) {
        const { error: errorAtualizar } = await supabase
          .from('devolucoes_itens')
          .update({
            codigo: item.codigo,
            nome: item.nome,
            quantidade: item.quantidade,
            updated_at: new Date().toISOString(),
            updated_by: usuarioId
          })
          .eq('id', item.id);
          
        if (errorAtualizar) {
          throw new Error(`Erro ao atualizar item ${item.id}: ${errorAtualizar.message}`);
        }
      }
      
      // Adicionar novos itens
      if (itensParaAdicionar.length > 0) {
        const novosItens = itensParaAdicionar.map(item => ({
          id: uuidv4(),
          devolucao_id: devolucaoId,
          codigo: item.codigo,
          nome: item.nome,
          quantidade: item.quantidade,
          created_at: new Date().toISOString(),
          created_by: usuarioId
        }));
        
        const { error: errorAdicionar } = await supabase
          .from('devolucoes_itens')
          .insert(novosItens);
          
        if (errorAdicionar) {
          throw new Error(`Erro ao adicionar novos itens: ${errorAdicionar.message}`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar itens:', error);
      return false;
    }
  },

  /**
   * Adiciona uma foto a uma devolução
   */
  async addFoto(devolucaoId: string, arquivo: File, usuarioId: string): Promise<string | null> {
    try {
      // Gerar um nome único para o arquivo
      const extensao = arquivo.name.split('.').pop();
      const nomeArquivo = `${devolucaoId}/${uuidv4()}.${extensao}`;
      
      // Upload do arquivo para o bucket 'devolucoes'
      const { error: uploadError } = await supabase
        .storage
        .from('devolucoes')
        .upload(nomeArquivo, arquivo);

      if (uploadError) {
        console.error('Erro ao fazer upload da imagem:', uploadError);
        return null;
      }

      // Obter URL pública do arquivo
      const { data: urlData } = await supabase
        .storage
        .from('devolucoes')
        .getPublicUrl(nomeArquivo);

      if (!urlData?.publicUrl) {
        console.error('Erro ao obter URL da imagem');
        return null;
      }

      // Adicionar registro da foto no banco
      const { error: dbError } = await supabase
        .from('devolucoes_fotos')
        .insert({
          id: uuidv4(),
          devolucao_id: devolucaoId,
          url: urlData.publicUrl,
          uploaded_by: usuarioId
        });

      if (dbError) {
        console.error('Erro ao registrar foto no banco:', dbError);
        
        // Tentar excluir o arquivo já que ocorreu erro no registro
        await supabase
          .storage
          .from('devolucoes')
          .remove([nomeArquivo]);
          
        return null;
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao adicionar foto:', error);
      return null;
    }
  },

  /**
   * Exclui uma foto de uma devolução
   */
  async deleteFoto(fotoUrl: string): Promise<boolean> {
    try {
      // Primeiro encontrar o registro da foto no banco
      const { data, error: findError } = await supabase
        .from('devolucoes_fotos')
        .select('id')
        .eq('url', fotoUrl)
        .single();

      if (findError) {
        console.error('Erro ao encontrar foto:', findError);
        return false;
      }

      // Excluir o registro da foto do banco
      const { error: deleteDbError } = await supabase
        .from('devolucoes_fotos')
        .delete()
        .eq('id', data.id);

      if (deleteDbError) {
        console.error('Erro ao excluir registro da foto:', deleteDbError);
        return false;
      }

      // Extrair o caminho do arquivo a partir da URL
      const filePath = fotoUrl.replace(storageUrl, '');

      // Excluir o arquivo do storage
      const { error: deleteFileError } = await supabase
        .storage
        .from('devolucoes')
        .remove([filePath]);

      if (deleteFileError) {
        console.error('Erro ao excluir arquivo de storage:', deleteFileError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao excluir foto:', error);
      return false;
    }
  }
}; 