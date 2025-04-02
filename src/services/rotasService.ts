import { supabase, logAction } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '@/lib/supabase';

// Tipos
export type Rota = Database['public']['tables']['rotas']['Row'];
export type ProdutoRota = Database['public']['tables']['produtos_rota']['Row'];
export type ItemRota = Database['public']['tables']['itens_rota']['Row'];
export type PagamentoRota = Database['public']['tables']['pagamentos_rota']['Row'];

export interface RotaCompleta extends Rota {
  produtos?: ProdutoRota[];
  itens?: ItemRota[];
  pagamentos?: PagamentoRota[];
  motorista?: {
    id: string;
    nome: string;
    veiculo?: string;
    placa?: string;
  };
}

export interface CriarRotaParams {
  motorista_id?: string;
  data_entrega: string;
  destino: string;
  observacoes?: string;
  status?: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  created_by: string;
  produtos: {
    codigo: string;
    nome: string;
    quantidade: number;
  }[];
}

export interface NovaRotaParams {
  motorista_id?: string;
  nome_cliente: string;
  telefone_cliente?: string;
  data_entrega: string;
  horario_maximo?: string;
  endereco: string;
  complemento?: string;
  cidade: string;
  estado?: string;
  cep?: string;
  numero_pedido?: string;
  observacoes?: string;
  itens: {
    descricao: string;
    quantidade: number;
    valor_unitario: number;
  }[];
  pagamentos: {
    tipo: 'dinheiro' | 'cartao' | 'pix' | 'outro';
    valor: number;
    parcelado?: boolean;
    parcelas?: number;
    recebido?: boolean;
  }[];
}

/**
 * Serviço para gerenciar rotas e entregas
 */
export const rotasService = {
  /**
   * Busca todas as rotas (versão anterior)
   */
  async getRotas(options?: {
    status?: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
    motorista_id?: string;
    data?: string;
  }): Promise<RotaCompleta[]> {
    try {
      let query = supabase
        .from('rotas')
        .select(`
          *,
          produtos_rota(*)
        `);

      // Aplicar filtros se fornecidos
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      
      if (options?.motorista_id) {
        query = query.eq('motorista_id', options.motorista_id);
      }
      
      if (options?.data) {
        query = query.eq('data_entrega', options.data);
      }

      // Ordenar por data de criação, mais recentes primeiro
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar rotas: ${error.message}`);
      }

      // Transformar os dados para o formato esperado
      const rotas = data.map(rota => {
        const { produtos_rota, ...rotaData } = rota;
        return {
          ...rotaData,
          produtos: produtos_rota as unknown as ProdutoRota[]
        };
      });

      return rotas;
    } catch (error) {
      console.error('Erro ao buscar rotas:', error);
      throw error;
    }
  },
  
  /**
   * Busca todas as rotas (versão nova e melhorada)
   * Inclui motorista, itens e pagamentos
   */
  async listarRotas(options?: {
    status?: 'pendente' | 'atribuida' | 'em_andamento' | 'concluida' | 'cancelada';
    motorista_id?: string;
    data_inicio?: string;
    data_fim?: string;
  }): Promise<RotaCompleta[]> {
    try {
      let query = supabase
        .from('rotas')
        .select(`
          *,
          itens_rota(*),
          pagamentos_rota(*),
          motorista:motoristas(
            id,
            veiculo,
            placa,
            nome:profiles(name)
          )
        `);

      // Aplicar filtros se fornecidos
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      
      if (options?.motorista_id) {
        query = query.eq('motorista_id', options.motorista_id);
      }
      
      if (options?.data_inicio) {
        query = query.gte('data_entrega', options.data_inicio);
      }
      
      if (options?.data_fim) {
        query = query.lte('data_entrega', options.data_fim);
      }

      // Ordenar por data de entrega (mais próximas primeiro)
      query = query.order('data_entrega', { ascending: true });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar rotas: ${error.message}`);
      }

      // Transformar os dados para o formato esperado
      const rotas = data.map(rota => {
        // Extrair as relações
        const { itens_rota, pagamentos_rota, motorista, ...rotaData } = rota;
        
        // Formatar os dados do motorista, se houver
        let motoristaNormalizado = null;
        if (motorista && motorista.length > 0) {
          const { nome, ...dadosMotorista } = motorista[0];
          motoristaNormalizado = {
            ...dadosMotorista,
            nome: nome?.name || 'Motorista sem nome'
          };
        }
        
        return {
          ...rotaData,
          itens: itens_rota as unknown as ItemRota[],
          pagamentos: pagamentos_rota as unknown as PagamentoRota[],
          motorista: motoristaNormalizado
        };
      });

      return rotas;
    } catch (error) {
      console.error('Erro ao buscar rotas:', error);
      throw error;
    }
  },

  /**
   * Busca uma rota pelo ID
   */
  async getRotaById(id: string): Promise<RotaCompleta | null> {
    try {
      const { data, error } = await supabase
        .from('rotas')
        .select(`
          *,
          produtos_rota(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Rota não encontrada
          return null;
        }
        throw new Error(`Erro ao buscar rota: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      // Transformar os dados
      const { produtos_rota, ...rotaData } = data;
      return {
        ...rotaData,
        produtos: produtos_rota as unknown as ProdutoRota[]
      };
    } catch (error) {
      console.error(`Erro ao buscar rota com ID ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Busca detalhes completos de uma rota pelo ID
   */
  async buscarRotaPorId(id: string): Promise<RotaCompleta | null> {
    try {
      const { data, error } = await supabase
        .from('rotas')
        .select(`
          *,
          itens_rota(*),
          pagamentos_rota(*),
          motorista:motoristas(
            id,
            veiculo,
            placa,
            nome:profiles(name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Rota não encontrada
          return null;
        }
        throw new Error(`Erro ao buscar rota: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      // Extrair e transformar os dados
      const { itens_rota, pagamentos_rota, motorista, ...rotaData } = data;
      
      // Formatar os dados do motorista, se houver
      let motoristaNormalizado = null;
      if (motorista && motorista.length > 0) {
        const { nome, ...dadosMotorista } = motorista[0];
        motoristaNormalizado = {
          ...dadosMotorista,
          nome: nome?.name || 'Motorista sem nome'
        };
      }
      
      return {
        ...rotaData,
        itens: itens_rota as unknown as ItemRota[],
        pagamentos: pagamentos_rota as unknown as PagamentoRota[],
        motorista: motoristaNormalizado
      };
    } catch (error) {
      console.error(`Erro ao buscar rota com ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cria uma nova rota (versão anterior)
   */
  async criarRota(dados: CriarRotaParams): Promise<RotaCompleta> {
    try {
      // 1. Criar a rota principal
      const rotaId = uuidv4();
      
      const { data: rotaData, error: rotaError } = await supabase
        .from('rotas')
        .insert({
          id: rotaId,
          motorista_id: dados.motorista_id,
          data_entrega: dados.data_entrega,
          destino: dados.destino,
          observacoes: dados.observacoes,
          status: dados.status || 'pendente',
          created_by: dados.created_by
        })
        .select()
        .single();

      if (rotaError) {
        throw new Error(`Erro ao criar rota: ${rotaError.message}`);
      }

      // 2. Adicionar produtos à rota
      if (dados.produtos && dados.produtos.length > 0) {
        const produtosParaInserir = dados.produtos.map(produto => ({
          id: uuidv4(),
          rota_id: rotaId,
          codigo: produto.codigo,
          nome: produto.nome,
          quantidade: produto.quantidade
        }));

        const { error: produtosError } = await supabase
          .from('produtos_rota')
          .insert(produtosParaInserir);

        if (produtosError) {
          // Se falhar ao adicionar produtos, tenta excluir a rota criada
          await supabase.from('rotas').delete().eq('id', rotaId);
          throw new Error(`Erro ao adicionar produtos: ${produtosError.message}`);
        }
      }

      // 3. Registrar a ação nos logs
      await logAction(
        'create',
        `Rota ${rotaData.codigo} criada com sucesso`,
        'rotas',
        rotaId,
        dados.created_by
      );

      // 4. Buscar a rota completa com produtos
      const rotaCompleta = await this.getRotaById(rotaId);
      
      if (!rotaCompleta) {
        throw new Error('Erro ao recuperar a rota criada');
      }

      return rotaCompleta;
    } catch (error) {
      console.error('Erro ao criar rota:', error);
      throw error;
    }
  },
  
  /**
   * Cria uma nova rota completa com itens e pagamentos
   */
  async criarNovaRota(dados: NovaRotaParams, userId: string): Promise<RotaCompleta> {
    try {
      // 1. Gerar IDs e código
      const rotaId = uuidv4();
      const codigoRota = `RT${new Date().getFullYear().toString().substring(2)}${Math.floor(1000 + Math.random() * 9000)}`;
      
      // 2. Criar a rota principal
      const { data: rotaData, error: rotaError } = await supabase
        .from('rotas')
        .insert({
          id: rotaId,
          codigo: codigoRota,
          numero_pedido: dados.numero_pedido,
          motorista_id: dados.motorista_id,
          nome_cliente: dados.nome_cliente,
          telefone_cliente: dados.telefone_cliente,
          data_entrega: dados.data_entrega,
          horario_maximo: dados.horario_maximo,
          endereco: dados.endereco,
          complemento: dados.complemento,
          cidade: dados.cidade,
          estado: dados.estado,
          cep: dados.cep,
          observacoes: dados.observacoes,
          status: dados.motorista_id ? 'atribuida' : 'pendente',
          created_by: userId
        })
        .select()
        .single();

      if (rotaError) {
        throw new Error(`Erro ao criar rota: ${rotaError.message}`);
      }

      // 3. Adicionar itens à rota
      if (dados.itens && dados.itens.length > 0) {
        const itensParaInserir = dados.itens.map(item => ({
          id: uuidv4(),
          rota_id: rotaId,
          descricao: item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario
        }));

        const { error: itensError } = await supabase
          .from('itens_rota')
          .insert(itensParaInserir);

        if (itensError) {
          // Se falhar ao adicionar itens, tenta excluir a rota criada
          await supabase.from('rotas').delete().eq('id', rotaId);
          throw new Error(`Erro ao adicionar itens: ${itensError.message}`);
        }
      }
      
      // 4. Adicionar pagamentos à rota
      if (dados.pagamentos && dados.pagamentos.length > 0) {
        const pagamentosParaInserir = dados.pagamentos.map(pagamento => ({
          id: uuidv4(),
          rota_id: rotaId,
          tipo: pagamento.tipo,
          valor: pagamento.valor,
          parcelado: pagamento.parcelado || false,
          parcelas: pagamento.parcelas || 1,
          recebido: pagamento.recebido || false
        }));

        const { error: pagamentosError } = await supabase
          .from('pagamentos_rota')
          .insert(pagamentosParaInserir);

        if (pagamentosError) {
          // Já inserimos a rota e itens, apenas logar o erro
          console.error(`Erro ao adicionar pagamentos à rota ${rotaId}:`, pagamentosError);
          throw new Error(`Erro ao adicionar pagamentos: ${pagamentosError.message}`);
        }
      }

      // 5. Registrar a ação nos logs
      await logAction(
        'create',
        `Rota ${codigoRota} criada com sucesso`,
        'rotas',
        rotaId,
        userId
      );

      // 6. Buscar a rota completa
      const rotaCompleta = await this.buscarRotaPorId(rotaId);
      
      if (!rotaCompleta) {
        throw new Error('Erro ao recuperar a rota criada');
      }

      return rotaCompleta;
    } catch (error) {
      console.error('Erro ao criar rota:', error);
      throw error;
    }
  },

  /**
   * Atualiza o status de uma rota
   */
  async atualizarStatusRota(id: string, status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada', userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rotas')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao atualizar status da rota: ${error.message}`);
      }

      await logAction(
        'update',
        `Status da rota atualizado para ${status}`,
        'rotas',
        id,
        userId
      );
    } catch (error) {
      console.error(`Erro ao atualizar status da rota ${id}:`, error);
      throw error;
    }
  },

  /**
   * Atribui um motorista a uma rota
   */
  async atribuirMotorista(rotaId: string, motoristaId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rotas')
        .update({ 
          motorista_id: motoristaId,
          status: 'atribuida',
          updated_at: new Date().toISOString()
        })
        .eq('id', rotaId);

      if (error) {
        throw new Error(`Erro ao atribuir motorista: ${error.message}`);
      }

      await logAction(
        'update',
        `Motorista atribuído à rota`,
        'rotas',
        rotaId,
        userId
      );
    } catch (error) {
      console.error(`Erro ao atribuir motorista à rota ${rotaId}:`, error);
      throw error;
    }
  },

  /**
   * Lista todos os motoristas disponíveis
   */
  async listarMotoristas() {
    try {
      const { data, error } = await supabase
        .from('motoristas')
        .select(`
          id,
          profile_id,
          veiculo,
          placa,
          status,
          profiles(name)
        `)
        .eq('status', 'ativo');

      if (error) {
        throw new Error(`Erro ao listar motoristas: ${error.message}`);
      }

      return data.map(item => ({
        id: item.id,
        nome: item.profiles?.name || 'Motorista sem nome',
        veiculo: item.veiculo,
        placa: item.placa,
        status: item.status
      }));
    } catch (error) {
      console.error('Erro ao listar motoristas:', error);
      throw error;
    }
  },

  /**
   * Atualiza uma rota existente
   */
  async atualizarRota(id: string, dados: any, userId: string): Promise<RotaCompleta> {
    try {
      // Extrair itens e pagamentos dos dados
      const { itens, pagamentos, ...dadosRota } = dados;
      
      // 1. Atualizar os dados básicos da rota
      const { data: rotaAtualizada, error: rotaError } = await supabase
        .from('rotas')
        .update({
          ...dadosRota,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', id)
        .select()
        .single();
      
      if (rotaError) {
        throw new Error(`Erro ao atualizar rota: ${rotaError.message}`);
      }
      
      // 2. Atualizar os itens
      if (itens && itens.length > 0) {
        // Primeiro, buscar os itens existentes
        const { data: itensExistentes, error: errorItensLista } = await supabase
          .from('itens_rota')
          .select('id')
          .eq('rota_id', id);
          
        if (errorItensLista) {
          throw new Error(`Erro ao buscar itens existentes: ${errorItensLista.message}`);
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
            .from('itens_rota')
            .delete()
            .in('id', idsExcluirItens);
            
          if (errorExcluir) {
            throw new Error(`Erro ao excluir itens: ${errorExcluir.message}`);
          }
        }
        
        // Atualizar itens existentes
        for (const item of itensParaAtualizar) {
          const { error: errorAtualizar } = await supabase
            .from('itens_rota')
            .update({
              descricao: item.descricao,
              quantidade: item.quantidade,
              valor_unitario: item.valor_unitario,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
            
          if (errorAtualizar) {
            throw new Error(`Erro ao atualizar item ${item.id}: ${errorAtualizar.message}`);
          }
        }
        
        // Adicionar novos itens
        if (itensParaAdicionar.length > 0) {
          const novosItens = itensParaAdicionar.map(item => ({
            rota_id: id,
            descricao: item.descricao,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            created_at: new Date().toISOString(),
            created_by: userId
          }));
          
          const { error: errorAdicionar } = await supabase
            .from('itens_rota')
            .insert(novosItens);
            
          if (errorAdicionar) {
            throw new Error(`Erro ao adicionar novos itens: ${errorAdicionar.message}`);
          }
        }
      }
      
      // 3. Atualizar os pagamentos
      if (pagamentos && pagamentos.length > 0) {
        // Primeiro, buscar os pagamentos existentes
        const { data: pagamentosExistentes, error: errorPagamentosLista } = await supabase
          .from('pagamentos_rota')
          .select('id')
          .eq('rota_id', id);
          
        if (errorPagamentosLista) {
          throw new Error(`Erro ao buscar pagamentos existentes: ${errorPagamentosLista.message}`);
        }
        
        // IDs dos pagamentos existentes
        const idsExistentes = pagamentosExistentes.map(pagto => pagto.id);
        
        // Separar pagamentos a serem atualizados dos novos
        const pagamentosParaAtualizar = pagamentos.filter(pagto => pagto.id && !pagto.id.startsWith('temp_'));
        const pagamentosParaAdicionar = pagamentos.filter(pagto => !pagto.id || pagto.id.startsWith('temp_'));
        
        // IDs dos pagamentos que serão mantidos
        const idsManterPagtos = pagamentosParaAtualizar.map(pagto => pagto.id);
        
        // IDs dos pagamentos para excluir (pagamentos que existem mas não estão na lista atualizada)
        const idsExcluirPagtos = idsExistentes.filter(id => !idsManterPagtos.includes(id));
        
        // Excluir pagamentos removidos
        if (idsExcluirPagtos.length > 0) {
          const { error: errorExcluir } = await supabase
            .from('pagamentos_rota')
            .delete()
            .in('id', idsExcluirPagtos);
            
          if (errorExcluir) {
            throw new Error(`Erro ao excluir pagamentos: ${errorExcluir.message}`);
          }
        }
        
        // Atualizar pagamentos existentes
        for (const pagto of pagamentosParaAtualizar) {
          const { error: errorAtualizar } = await supabase
            .from('pagamentos_rota')
            .update({
              tipo: pagto.tipo,
              valor: pagto.valor,
              parcelado: pagto.parcelado,
              parcelas: pagto.parcelas,
              recebido: pagto.recebido,
              updated_at: new Date().toISOString()
            })
            .eq('id', pagto.id);
            
          if (errorAtualizar) {
            throw new Error(`Erro ao atualizar pagamento ${pagto.id}: ${errorAtualizar.message}`);
          }
        }
        
        // Adicionar novos pagamentos
        if (pagamentosParaAdicionar.length > 0) {
          const novosPagamentos = pagamentosParaAdicionar.map(pagto => ({
            rota_id: id,
            tipo: pagto.tipo,
            valor: pagto.valor,
            parcelado: pagto.parcelado,
            parcelas: pagto.parcelas,
            recebido: pagto.recebido,
            created_at: new Date().toISOString(),
            created_by: userId
          }));
          
          const { error: errorAdicionar } = await supabase
            .from('pagamentos_rota')
            .insert(novosPagamentos);
            
          if (errorAdicionar) {
            throw new Error(`Erro ao adicionar novos pagamentos: ${errorAdicionar.message}`);
          }
        }
      }
      
      // Buscar a rota atualizada com todos os relacionamentos
      return await this.buscarRotaPorId(id);
    } catch (error) {
      console.error(`Erro ao atualizar rota ${id}:`, error);
      throw error;
    }
  },

  /**
   * Adiciona uma assinatura de entrega
   */
  async adicionarAssinatura(rotaId: string, assinaturaBase64: string, userId: string): Promise<boolean> {
    try {
      // Verificar se a rota existe
      const { data: rotaExistente, error: rotaError } = await supabase
        .from('rotas')
        .select('id, status')
        .eq('id', rotaId)
        .single();

      if (rotaError || !rotaExistente) {
        throw new Error(`Rota não encontrada: ${rotaError?.message || 'ID inválido'}`);
      }

      // Converter a assinatura base64 para Blob
      const base64Data = assinaturaBase64.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const assinaturaBlob = new Blob([bytes], { type: 'image/png' });

      // Gerar nome do arquivo
      const fileName = `${rotaId}/assinatura-${Date.now()}.png`;

      // Fazer upload da assinatura para o storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('entregas')
        .upload(fileName, assinaturaBlob);

      if (uploadError) {
        throw new Error(`Erro ao fazer upload da assinatura: ${uploadError.message}`);
      }

      // Obter a URL pública da assinatura
      const { data: urlData } = await supabase.storage
        .from('entregas')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Erro ao obter URL da assinatura');
      }

      // Atualizar a rota com a URL da assinatura
      const { error: updateError } = await supabase
        .from('rotas')
        .update({ 
          assinatura_url: urlData.publicUrl,
          data_assinatura: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', rotaId);

      if (updateError) {
        throw new Error(`Erro ao atualizar rota com assinatura: ${updateError.message}`);
      }

      await logAction(
        'update',
        'Assinatura de entrega registrada',
        'rotas',
        rotaId,
        userId
      );

      return true;
    } catch (error) {
      console.error(`Erro ao adicionar assinatura à rota ${rotaId}:`, error);
      throw error;
    }
  },

  /**
   * Adiciona uma foto da entrega
   */
  async adicionarFotoEntrega(rotaId: string, arquivo: File, userId: string): Promise<string | null> {
    try {
      // Verificar se a rota existe
      const { data: rotaExistente, error: rotaError } = await supabase
        .from('rotas')
        .select('id, status')
        .eq('id', rotaId)
        .single();

      if (rotaError || !rotaExistente) {
        throw new Error(`Rota não encontrada: ${rotaError?.message || 'ID inválido'}`);
      }

      // Gerar nome do arquivo
      const extensao = arquivo.name.split('.').pop() || 'jpg';
      const fileName = `${rotaId}/foto-${Date.now()}.${extensao}`;

      // Upload do arquivo para o bucket 'entregas'
      const { error: uploadError } = await supabase
        .storage
        .from('entregas')
        .upload(fileName, arquivo);

      if (uploadError) {
        console.error('Erro ao fazer upload da foto da entrega:', uploadError);
        return null;
      }

      // Obter URL pública do arquivo
      const { data: urlData } = await supabase
        .storage
        .from('entregas')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        console.error('Erro ao obter URL da foto da entrega');
        return null;
      }

      // Adicionar registro da foto na tabela
      const { error: dbError } = await supabase
        .from('fotos_entrega')
        .insert({
          rota_id: rotaId,
          url: urlData.publicUrl,
          uploaded_by: userId,
          created_at: new Date().toISOString()
        });

      if (dbError) {
        console.error('Erro ao registrar foto da entrega no banco:', dbError);
        
        // Tentar excluir o arquivo já que ocorreu erro no registro
        await supabase
          .storage
          .from('entregas')
          .remove([fileName]);
          
        return null;
      }

      await logAction(
        'create',
        'Foto de entrega registrada',
        'fotos_entrega',
        rotaId,
        userId
      );

      return urlData.publicUrl;
    } catch (error) {
      console.error(`Erro ao adicionar foto à entrega ${rotaId}:`, error);
      return null;
    }
  },

  /**
   * Obtém as fotos de uma entrega
   */
  async obterFotosEntrega(rotaId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('fotos_entrega')
        .select('url')
        .eq('rota_id', rotaId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar fotos da entrega: ${error.message}`);
      }

      return data.map(item => item.url);
    } catch (error) {
      console.error(`Erro ao obter fotos da entrega ${rotaId}:`, error);
      return [];
    }
  },

  /**
   * Finaliza uma entrega com assinatura e fotos
   */
  async finalizarEntrega(
    rotaId: string, 
    dados: { 
      assinatura?: string; 
      observacoes?: string;
      responsavel_recebimento?: string;
    }, 
    userId: string
  ): Promise<boolean> {
    try {
      // Verificar se a rota existe e está em andamento
      const { data: rotaExistente, error: rotaError } = await supabase
        .from('rotas')
        .select('id, status')
        .eq('id', rotaId)
        .single();

      if (rotaError || !rotaExistente) {
        throw new Error(`Rota não encontrada: ${rotaError?.message || 'ID inválido'}`);
      }

      if (rotaExistente.status !== 'em_andamento') {
        throw new Error(`A rota não está em andamento. Status atual: ${rotaExistente.status}`);
      }

      // Iniciar transação (sem transação real, mas vamos registrar cada etapa)
      const atualizacoes: Record<string, any> = {
        status: 'concluida',
        data_entrega_efetiva: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: userId
      };

      // Adicionar observações, se fornecido
      if (dados.observacoes) {
        atualizacoes.observacoes_entrega = dados.observacoes;
      }

      // Adicionar responsável pelo recebimento, se fornecido
      if (dados.responsavel_recebimento) {
        atualizacoes.responsavel_recebimento = dados.responsavel_recebimento;
      }

      // Se tiver assinatura, fazer upload
      if (dados.assinatura) {
        try {
          await this.adicionarAssinatura(rotaId, dados.assinatura, userId);
          // URL da assinatura é atualizada na função acima
        } catch (assinaturaError) {
          console.error('Erro ao processar assinatura:', assinaturaError);
          // Continuar com a finalização mesmo sem a assinatura
        }
      }

      // Atualizar o status da rota para concluída
      const { error: updateError } = await supabase
        .from('rotas')
        .update(atualizacoes)
        .eq('id', rotaId);

      if (updateError) {
        throw new Error(`Erro ao finalizar entrega: ${updateError.message}`);
      }

      await logAction(
        'update',
        'Entrega finalizada com sucesso',
        'rotas',
        rotaId,
        userId
      );

      return true;
    } catch (error) {
      console.error(`Erro ao finalizar entrega ${rotaId}:`, error);
      throw error;
    }
  },

  /**
   * Atualiza a localização do motorista durante a entrega
   */
  async atualizarLocalizacaoEntrega(
    rotaId: string, 
    latitude: number, 
    longitude: number, 
    userId: string
  ): Promise<boolean> {
    try {
      // Registrar a localização na tabela de histórico
      const { error: insertError } = await supabase
        .from('localizacoes_entrega')
        .insert({
          rota_id: rotaId,
          latitude,
          longitude,
          motorista_id: userId,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        throw new Error(`Erro ao registrar localização: ${insertError.message}`);
      }

      // Atualizar a localização atual na rota também
      const { error: updateError } = await supabase
        .from('rotas')
        .update({
          ultima_latitude: latitude,
          ultima_longitude: longitude,
          ultima_atualizacao_local: new Date().toISOString()
        })
        .eq('id', rotaId);

      if (updateError) {
        throw new Error(`Erro ao atualizar localização na rota: ${updateError.message}`);
      }

      return true;
    } catch (error) {
      console.error(`Erro ao atualizar localização da entrega ${rotaId}:`, error);
      return false;
    }
  },

  /**
   * Configura assinante de atualizações em tempo real para uma rota
   */
  obterAtualizacoesTempoReal(rotaId: string, callback: (atualizacao: any) => void): { unsubscribe: () => void } {
    const subscription = supabase
      .channel(`rota-${rotaId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'rotas',
        filter: `id=eq.${rotaId}`
      }, payload => {
        callback(payload.new);
      })
      .subscribe();

    return {
      unsubscribe: () => {
        subscription.unsubscribe();
      }
    };
  }
}; 