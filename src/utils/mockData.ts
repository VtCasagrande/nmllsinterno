/**
 * AVISO: Este arquivo está mantido apenas para compatibilidade com código legado.
 * Todos os novos desenvolvimentos devem usar as APIs do Supabase diretamente.
 * 
 * Este arquivo será removido em futuras versões.
 */

import { 
  Entrega, StatusEntrega, FormaPagamento, Rota, Motorista 
} from '../types/entregas';
import { supabase } from '@/lib/supabase';

// Função para obter motoristas do Supabase
export async function getMotoristas(): Promise<Motorista[]> {
  try {
    const { data: motoristasData, error } = await supabase
      .from('motoristas')
      .select(`
        id,
        veiculo,
        placa:placa,
        status,
        latitude,
        longitude,
        last_update:last_update,
        profiles (
          id:profile_id,
          nome:name,
          telefone:phone
        )
      `);

    if (error) {
      console.error('Erro ao buscar motoristas:', error);
      return [];
    }

    // Transformar para o formato esperado pelas funções existentes
    return motoristasData.map((m: any) => ({
      id: m.id,
      nome: m.profiles?.nome || 'Motorista sem nome',
      telefone: m.profiles?.telefone || '',
      status: m.status as 'ativo' | 'inativo' | 'em_rota',
      veiculo: m.veiculo,
      placaVeiculo: m.placa,
      ultimaAtualizacao: m.last_update || new Date().toISOString(),
      latitude: m.latitude || undefined,
      longitude: m.longitude || undefined,
      rotaAtual: undefined
    }));
  } catch (error) {
    console.error('Erro ao buscar motoristas:', error);
    return [];
  }
}

// Função para obter rotas do Supabase
export async function getRotas(): Promise<Rota[]> {
  try {
    const { data: rotasData, error } = await supabase
      .from('rotas')
      .select(`
        id,
        codigo,
        data_entrega,
        motorista_id,
        status,
        motoristas (
          id,
          profiles (
            name
          )
        )
      `);

    if (error) {
      console.error('Erro ao buscar rotas:', error);
      return [];
    }

    // Transformar para o formato esperado pelas funções existentes
    return rotasData.map((r: any) => ({
      id: r.id,
      codigo: r.codigo,
      data: r.data_entrega,
      motoristaId: r.motorista_id || undefined,
      motoristaNome: r.motoristas?.[0]?.profiles?.[0]?.name || undefined,
      status: r.status as 'pendente' | 'em_andamento' | 'concluida' | 'cancelada',
      entregas: [], // Seriam preenchidas com produtos_rota em uma implementação completa
      otimizada: true
    }));
  } catch (error) {
    console.error('Erro ao buscar rotas:', error);
    return [];
  }
}

// Mantendo arrays vazios para compatibilidade, mas recomendando o uso das funções assíncronas acima
export const MOTORISTAS_MOCK: Motorista[] = [];
export const ENTREGAS_MOCK: Entrega[] = [];
export const ROTAS_MOCK: Rota[] = []; 