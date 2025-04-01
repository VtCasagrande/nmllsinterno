import { LembreteMedicamento, LembreteMedicamentoFormValues } from '@/types/medicamentos';

// URL base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Busca todos os lembretes de medicamentos
 */
export async function getLembretesMedicamentos(): Promise<LembreteMedicamento[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/medicamentos/lembretes`);
    if (!response.ok) {
      throw new Error('Falha ao buscar lembretes de medicamentos');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar lembretes de medicamentos:', error);
    throw error;
  }
}

/**
 * Busca um lembrete de medicamento específico pelo ID
 */
export async function getLembreteMedicamento(id: string): Promise<LembreteMedicamento> {
  try {
    const response = await fetch(`${API_BASE_URL}/medicamentos/lembretes/${id}`);
    if (!response.ok) {
      throw new Error(`Falha ao buscar lembrete de medicamento com ID ${id}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar lembrete de medicamento com ID ${id}:`, error);
    throw error;
  }
}

/**
 * Cria um novo lembrete de medicamento
 */
export async function criarLembreteMedicamento(
  lembrete: LembreteMedicamentoFormValues
): Promise<LembreteMedicamento> {
  try {
    const response = await fetch(`${API_BASE_URL}/medicamentos/lembretes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lembrete),
    });

    if (!response.ok) {
      throw new Error('Falha ao criar lembrete de medicamento');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao criar lembrete de medicamento:', error);
    throw error;
  }
}

/**
 * Atualiza um lembrete de medicamento existente
 */
export async function atualizarLembreteMedicamento(
  id: string,
  lembrete: LembreteMedicamentoFormValues
): Promise<LembreteMedicamento> {
  try {
    const response = await fetch(`${API_BASE_URL}/medicamentos/lembretes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lembrete),
    });

    if (!response.ok) {
      throw new Error(`Falha ao atualizar lembrete de medicamento com ID ${id}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro ao atualizar lembrete de medicamento com ID ${id}:`, error);
    throw error;
  }
}

/**
 * Altera o status ativo/inativo de um lembrete de medicamento
 */
export async function alterarStatusLembreteMedicamento(
  id: string,
  ativo: boolean
): Promise<LembreteMedicamento> {
  try {
    const response = await fetch(`${API_BASE_URL}/medicamentos/lembretes/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ativo }),
    });

    if (!response.ok) {
      throw new Error(`Falha ao alterar status do lembrete de medicamento com ID ${id}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro ao alterar status do lembrete de medicamento com ID ${id}:`, error);
    throw error;
  }
}

/**
 * Exclui um lembrete de medicamento
 */
export async function excluirLembreteMedicamento(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/medicamentos/lembretes/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Falha ao excluir lembrete de medicamento com ID ${id}`);
    }
  } catch (error) {
    console.error(`Erro ao excluir lembrete de medicamento com ID ${id}:`, error);
    throw error;
  }
} 