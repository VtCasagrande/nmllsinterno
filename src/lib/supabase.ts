import { createClient } from '@supabase/supabase-js';

// Verificação das variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Variáveis de ambiente do Supabase não definidas. Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas no arquivo .env.local'
  );
}

// Tipo para a base de dados
export type Database = {
  public: {
    tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          role: 'admin' | 'gerente' | 'operador' | 'motorista';
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          role?: 'admin' | 'gerente' | 'operador' | 'motorista';
          phone?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          role?: 'admin' | 'gerente' | 'operador' | 'motorista';
          phone?: string | null;
          updated_at?: string;
        };
      };
      motoristas: {
        Row: {
          id: string;
          profile_id: string;
          veiculo: string;
          placa: string;
          cnh: string;
          status: 'ativo' | 'inativo' | 'em_rota';
          latitude: number | null;
          longitude: number | null;
          last_update: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          veiculo: string;
          placa: string;
          cnh: string;
          status?: 'ativo' | 'inativo' | 'em_rota';
          latitude?: number | null;
          longitude?: number | null;
          last_update?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          veiculo?: string;
          placa?: string;
          cnh?: string;
          status?: 'ativo' | 'inativo' | 'em_rota';
          latitude?: number | null;
          longitude?: number | null;
          last_update?: string | null;
          updated_at?: string;
        };
      };
      rotas: {
        Row: {
          id: string;
          codigo: string;
          motorista_id: string | null;
          data_entrega: string;
          destino: string;
          observacoes: string | null;
          status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          codigo?: string;
          motorista_id?: string | null;
          data_entrega: string;
          destino: string;
          observacoes?: string | null;
          status?: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
          created_by: string;
        };
        Update: {
          id?: string;
          codigo?: string;
          motorista_id?: string | null;
          data_entrega?: string;
          destino?: string;
          observacoes?: string | null;
          status?: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
          created_by?: string;
          updated_at?: string;
        };
      };
      produtos_rota: {
        Row: {
          id: string;
          rota_id: string;
          codigo: string;
          nome: string;
          quantidade: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rota_id: string;
          codigo: string;
          nome: string;
          quantidade?: number;
        };
        Update: {
          id?: string;
          rota_id?: string;
          codigo?: string;
          nome?: string;
          quantidade?: number;
          updated_at?: string;
        };
      };
      devolucoes: {
        Row: {
          id: string;
          codigo: string;
          produto: string;
          motivo: 'produto_danificado' | 'produto_incorreto' | 'cliente_desistiu' | 'endereco_nao_encontrado' | 'outro';
          descricao: string | null;
          status: 'pendente' | 'em_analise' | 'finalizado' | 'cancelado';
          data_recebimento: string;
          responsavel_id: string;
          atribuido_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          codigo?: string;
          produto: string;
          motivo: 'produto_danificado' | 'produto_incorreto' | 'cliente_desistiu' | 'endereco_nao_encontrado' | 'outro';
          descricao?: string | null;
          status?: 'pendente' | 'em_analise' | 'finalizado' | 'cancelado';
          data_recebimento: string;
          responsavel_id: string;
          atribuido_id?: string | null;
        };
        Update: {
          id?: string;
          codigo?: string;
          produto?: string;
          motivo?: 'produto_danificado' | 'produto_incorreto' | 'cliente_desistiu' | 'endereco_nao_encontrado' | 'outro';
          descricao?: string | null;
          status?: 'pendente' | 'em_analise' | 'finalizado' | 'cancelado';
          data_recebimento?: string;
          responsavel_id?: string;
          atribuido_id?: string | null;
          updated_at?: string;
        };
      };
      devolucoes_fotos: {
        Row: {
          id: string;
          devolucao_id: string;
          url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          devolucao_id: string;
          url: string;
        };
        Update: {
          id?: string;
          devolucao_id?: string;
          url?: string;
        };
      };
      devolucoes_comentarios: {
        Row: {
          id: string;
          devolucao_id: string;
          usuario_id: string;
          comentario: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          devolucao_id: string;
          usuario_id: string;
          comentario: string;
        };
        Update: {
          id?: string;
          devolucao_id?: string;
          usuario_id?: string;
          comentario?: string;
        };
      };
      logs: {
        Row: {
          id: string;
          usuario_id: string | null;
          acao: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'complete';
          descricao: string;
          entidade: 'auth' | 'devolucoes' | 'rotas' | 'motoristas' | 'usuarios' | 'produtos';
          entidade_id: string | null;
          ip: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          usuario_id?: string | null;
          acao: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'complete';
          descricao: string;
          entidade: 'auth' | 'devolucoes' | 'rotas' | 'motoristas' | 'usuarios' | 'produtos';
          entidade_id?: string | null;
          ip?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          usuario_id?: string | null;
          acao?: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'complete';
          descricao?: string;
          entidade?: 'auth' | 'devolucoes' | 'rotas' | 'motoristas' | 'usuarios' | 'produtos';
          entidade_id?: string | null;
          ip?: string | null;
          user_agent?: string | null;
        };
      };
      sugestoes: {
        Row: {
          id: string;
          ean: string;
          nome_produto: string;
          fornecedor: string | null;
          cliente: string | null;
          telefone_cliente: string | null;
          urgencia: 'baixa' | 'media' | 'alta';
          status: 'criado' | 'em_analise' | 'aprovado' | 'rejeitado' | 'concluido';
          observacao: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ean: string;
          nome_produto: string;
          fornecedor?: string | null;
          cliente?: string | null;
          telefone_cliente?: string | null;
          urgencia?: 'baixa' | 'media' | 'alta';
          status?: 'criado' | 'em_analise' | 'aprovado' | 'rejeitado' | 'concluido';
          observacao?: string | null;
          created_by: string;
        };
        Update: {
          id?: string;
          ean?: string;
          nome_produto?: string;
          fornecedor?: string | null;
          cliente?: string | null;
          telefone_cliente?: string | null;
          urgencia?: 'baixa' | 'media' | 'alta';
          status?: 'criado' | 'em_analise' | 'aprovado' | 'rejeitado' | 'concluido';
          observacao?: string | null;
          created_by?: string;
          updated_at?: string;
        };
      };
      sugestoes_comentarios: {
        Row: {
          id: string;
          sugestao_id: string;
          usuario_id: string;
          texto: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sugestao_id: string;
          usuario_id: string;
          texto: string;
        };
        Update: {
          id?: string;
          sugestao_id?: string;
          usuario_id?: string;
          texto?: string;
        };
      };
      trocas: {
        Row: {
          id: string;
          tipo: 'enviada' | 'recebida';
          status: 'pendente' | 'em_andamento' | 'aguardando_devolucao' | 'coletado' | 'concluida' | 'cancelada';
          ean: string;
          nome_produto: string;
          loja_parceira: string;
          responsavel: string;
          telefone_responsavel: string | null;
          motivo: string;
          observacoes: string | null;
          quantidade: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tipo: 'enviada' | 'recebida';
          status?: 'pendente' | 'em_andamento' | 'aguardando_devolucao' | 'coletado' | 'concluida' | 'cancelada';
          ean: string;
          nome_produto: string;
          loja_parceira: string;
          responsavel: string;
          telefone_responsavel?: string | null;
          motivo: string;
          observacoes?: string | null;
          quantidade?: number;
          created_by: string;
        };
        Update: {
          id?: string;
          tipo?: 'enviada' | 'recebida';
          status?: 'pendente' | 'em_andamento' | 'aguardando_devolucao' | 'coletado' | 'concluida' | 'cancelada';
          ean?: string;
          nome_produto?: string;
          loja_parceira?: string;
          responsavel?: string;
          telefone_responsavel?: string | null;
          motivo?: string;
          observacoes?: string | null;
          quantidade?: number;
          created_by?: string;
          updated_at?: string;
        };
      };
      trocas_comentarios: {
        Row: {
          id: string;
          troca_id: string;
          usuario_id: string;
          texto: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          troca_id: string;
          usuario_id: string;
          texto: string;
        };
        Update: {
          id?: string;
          troca_id?: string;
          usuario_id?: string;
          texto?: string;
        };
      };
      avisos: {
        Row: {
          id: string;
          titulo: string;
          conteudo: string;
          tipo_destinatario: 'todos' | 'grupo' | 'usuarios';
          grupos: string[] | null;
          usuarios: string[] | null;
          prioridade: 'baixa' | 'normal' | 'alta';
          status: 'ativo' | 'arquivado';
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          titulo: string;
          conteudo: string;
          tipo_destinatario: 'todos' | 'grupo' | 'usuarios';
          grupos?: string[] | null;
          usuarios?: string[] | null;
          prioridade?: 'baixa' | 'normal' | 'alta';
          status?: 'ativo' | 'arquivado';
          created_by: string;
        };
        Update: {
          id?: string;
          titulo?: string;
          conteudo?: string;
          tipo_destinatario?: 'todos' | 'grupo' | 'usuarios';
          grupos?: string[] | null;
          usuarios?: string[] | null;
          prioridade?: 'baixa' | 'normal' | 'alta';
          status?: 'ativo' | 'arquivado';
          created_by?: string;
          updated_at?: string;
        };
      };
      avisos_visualizacoes: {
        Row: {
          id: string;
          aviso_id: string;
          usuario_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          aviso_id: string;
          usuario_id: string;
        };
        Update: {
          id?: string;
          aviso_id?: string;
          usuario_id?: string;
        };
      };
      avisos_reacoes: {
        Row: {
          id: string;
          aviso_id: string;
          usuario_id: string;
          tipo: 'concordar' | 'discordar' | 'verificado';
          created_at: string;
        };
        Insert: {
          id?: string;
          aviso_id: string;
          usuario_id: string;
          tipo: 'concordar' | 'discordar' | 'verificado';
        };
        Update: {
          id?: string;
          aviso_id?: string;
          usuario_id?: string;
          tipo?: 'concordar' | 'discordar' | 'verificado';
        };
      };
    };
  };
};

// Criar cliente Supabase
export const supabase = createClient<Database>(
  supabaseUrl || 'https://example.com',
  supabaseAnonKey || 'fallback-key'
);

// Função para registrar um log de ação
export const logAction = async (
  acao: Database['public']['tables']['logs']['Insert']['acao'],
  descricao: string,
  entidade: Database['public']['tables']['logs']['Insert']['entidade'],
  entidadeId?: string,
  userId?: string
) => {
  try {
    // Se não tiver as credenciais do Supabase, só loga no console
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('Log (simulado):', { acao, descricao, entidade, entidade_id: entidadeId });
      return;
    }
    
    const { error } = await supabase.from('logs').insert({
      acao,
      descricao,
      entidade,
      entidade_id: entidadeId,
      usuario_id: userId,
      ip: '127.0.0.1', // No lado do cliente, o IP é obtido pelo servidor
    });

    if (error) {
      console.error('Erro ao registrar log:', error);
    }
  } catch (error) {
    console.error('Erro ao registrar log:', error);
  }
};

export default supabase; 