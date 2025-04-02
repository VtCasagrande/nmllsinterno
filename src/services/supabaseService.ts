import { supabase, logAction } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Serviço para gerenciar operações relacionadas ao Supabase
 */
export const supabaseService = {
  /**
   * Cria um novo usuário no Supabase Auth e seu perfil correspondente
   */
  async createUser(email: string, password: string, name: string, role: 'admin' | 'gerente' | 'operador' | 'motorista', phone?: string) {
    try {
      // Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado');
      }

      // Criar perfil para o usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name,
          role,
          phone: phone || null,
        })
        .select()
        .single();

      if (profileError) {
        // Se falhar ao criar perfil, tenta excluir o usuário criado para evitar inconsistências
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Erro ao criar perfil: ${profileError.message}`);
      }

      await logAction(
        'create',
        `Usuário ${name} criado com sucesso`,
        'usuarios',
        authData.user.id
      );

      return { user: authData.user, profile: profileData };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  },

  /**
   * Busca todos os perfis/usuários
   */
  async getProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (error) {
        throw new Error(`Erro ao buscar perfis: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
      throw error;
    }
  },

  /**
   * Busca um perfil pelo ID
   */
  async getProfileById(id: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Erro ao buscar perfil: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      throw error;
    }
  },

  /**
   * Atualiza um perfil de usuário
   */
  async updateProfile(id: string, updates: { name?: string; role?: 'admin' | 'gerente' | 'operador' | 'motorista'; phone?: string | null }) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar perfil: ${error.message}`);
      }

      await logAction(
        'update',
        `Perfil de ${data.name} atualizado`,
        'usuarios',
        id
      );

      return data;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  },

  /**
   * Função genérica para buscar registros de uma tabela
   */
  async getRecords<T>(table: string, options?: {
    select?: string;
    filters?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    try {
      let query = supabase
        .from(table)
        .select(options?.select || '*');

      // Aplicar filtros
      if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        }
      }

      // Aplicar ordenação
      if (options?.order) {
        query = query.order(
          options.order.column, 
          { ascending: options.order.ascending ?? true }
        );
      }

      // Aplicar limite
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      // Aplicar offset
      if (options?.offset) {
        query = query.range(
          options.offset, 
          options.offset + (options.limit || 10) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar registros de ${table}: ${error.message}`);
      }

      return (data as T[]) || [];
    } catch (error) {
      console.error(`Erro ao buscar registros de ${table}:`, error);
      throw error;
    }
  },

  /**
   * Função genérica para criar um registro em uma tabela
   */
  async createRecord<T>(table: string, data: Record<string, any>, logInfo?: {
    message: string;
    entity: 'auth' | 'devolucoes' | 'rotas' | 'motoristas' | 'usuarios' | 'produtos';
    userId?: string;
  }): Promise<T> {
    try {
      // Adiciona ID uuid se não existir
      const recordData = {
        ...data,
        id: data.id || uuidv4(),
      };

      const { data: newRecord, error } = await supabase
        .from(table)
        .insert(recordData)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar registro em ${table}: ${error.message}`);
      }

      if (logInfo) {
        await logAction(
          'create',
          logInfo.message,
          logInfo.entity,
          newRecord.id,
          logInfo.userId
        );
      }

      return newRecord as T;
    } catch (error) {
      console.error(`Erro ao criar registro em ${table}:`, error);
      throw error;
    }
  },

  /**
   * Função genérica para atualizar um registro em uma tabela
   */
  async updateRecord<T>(table: string, id: string, updates: Record<string, any>, logInfo?: {
    message: string;
    entity: 'auth' | 'devolucoes' | 'rotas' | 'motoristas' | 'usuarios' | 'produtos';
    userId?: string;
  }): Promise<T> {
    try {
      const { data, error } = await supabase
        .from(table)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar registro em ${table}: ${error.message}`);
      }

      if (logInfo) {
        await logAction(
          'update',
          logInfo.message,
          logInfo.entity,
          id,
          logInfo.userId
        );
      }

      return data as T;
    } catch (error) {
      console.error(`Erro ao atualizar registro em ${table}:`, error);
      throw error;
    }
  },

  /**
   * Função genérica para excluir um registro de uma tabela
   */
  async deleteRecord(table: string, id: string, logInfo?: {
    message: string;
    entity: 'auth' | 'devolucoes' | 'rotas' | 'motoristas' | 'usuarios' | 'produtos';
    userId?: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao excluir registro de ${table}: ${error.message}`);
      }

      if (logInfo) {
        await logAction(
          'delete',
          logInfo.message,
          logInfo.entity,
          id,
          logInfo.userId
        );
      }

      return true;
    } catch (error) {
      console.error(`Erro ao excluir registro de ${table}:`, error);
      throw error;
    }
  },

  /**
   * Função para Upload de arquivos
   */
  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Erro ao fazer upload de arquivo: ${error.message}`);
      }

      // Retornar URL pública do arquivo
      const { data: publicURL } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicURL.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload de arquivo:', error);
      throw error;
    }
  },

  /**
   * Função para excluir um arquivo
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw new Error(`Erro ao excluir arquivo: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      throw error;
    }
  }
}; 