import { useState, useEffect, useCallback } from 'react';
import { LembreteMedicamento } from '@/types/medicamentos';
import { 
  getLembretesMedicamentos, 
  alterarStatusLembreteMedicamento 
} from '@/lib/api/medicamentos';

/**
 * Hook que fornece funcionalidades para gerenciar lembretes de medicamentos
 */
export function useLembretesService() {
  const [lembretes, setLembretes] = useState<LembreteMedicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Carrega a lista de lembretes ao inicializar
  const fetchLembretes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getLembretesMedicamentos();
      setLembretes(data);
    } catch (err) {
      console.error('Erro ao buscar lembretes:', err);
      setError('Falha ao carregar lembretes de medicamentos. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Carrega os lembretes na inicialização
  useEffect(() => {
    fetchLembretes();
  }, [fetchLembretes]);
  
  // Função para alternar o status ativo/inativo de um lembrete
  const toggleAtivoStatus = async (id: string, novoStatus: boolean) => {
    try {
      await alterarStatusLembreteMedicamento(id, novoStatus);
      
      // Atualiza o estado local após a alteração bem-sucedida
      setLembretes(prevLembretes => 
        prevLembretes.map(lembrete => 
          lembrete.id === id ? { ...lembrete, ativo: novoStatus } : lembrete
        )
      );
      
      return true;
    } catch (err) {
      console.error('Erro ao alterar status do lembrete:', err);
      setError('Falha ao alterar status do lembrete. Tente novamente mais tarde.');
      return false;
    }
  };
  
  // Função para recarregar os lembretes manualmente
  const recarregarLembretes = () => {
    fetchLembretes();
  };
  
  return {
    lembretes,
    loading,
    error,
    toggleAtivoStatus,
    recarregarLembretes
  };
} 