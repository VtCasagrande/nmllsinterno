import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Recorrencia, StatusRecorrencia, ProdutoRecorrencia } from '@/types/recorrencias';
import { useToast } from '@/components/ui/toast-provider';

interface RecorrenciasContextType {
  recorrencias: Recorrencia[];
  loading: boolean;
  error: string | null;
  adicionarRecorrencia: (novaRecorrencia: Omit<Recorrencia, 'id' | 'dataCriacao'>) => Promise<Recorrencia>;
  atualizarRecorrencia: (id: string, dadosAtualizados: Partial<Recorrencia>) => Promise<Recorrencia>;
  alterarStatusRecorrencia: (id: string, novoStatus: StatusRecorrencia) => Promise<Recorrencia>;
  obterRecorrenciaPorId: (id: string) => Recorrencia | undefined;
  calcularProximaData: (diasRecorrencia: number) => string;
  filtrarRecorrenciasPorStatus: (status: StatusRecorrencia | 'todas') => Recorrencia[];
}

const RecorrenciasContext = createContext<RecorrenciasContextType | undefined>(undefined);

// Dados fictícios para desenvolvimento
const dadosIniciais: Recorrencia[] = [
  {
    id: '1',
    nomeCliente: 'Maria Silva',
    cpfCliente: '123.456.789-00',
    telefoneCliente: '(11) 98765-4321',
    diasRecorrencia: 15,
    proximaData: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dataCriacao: new Date().toISOString().split('T')[0],
    status: StatusRecorrencia.ATIVA,
    produtos: [
      {
        id: '101',
        ean: '7891234567890',
        titulo: 'Água Mineral 20L',
        quantidade: 2,
        preco: 15.90
      }
    ],
    observacoes: 'Entregar pela manhã'
  },
  {
    id: '2',
    nomeCliente: 'João Pereira',
    cpfCliente: '987.654.321-00',
    telefoneCliente: '(11) 91234-5678',
    diasRecorrencia: 30,
    proximaData: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dataCriacao: new Date().toISOString().split('T')[0],
    status: StatusRecorrencia.ATIVA,
    produtos: [
      {
        id: '201',
        ean: '7894561237890',
        titulo: 'Cesta de Frutas',
        quantidade: 1,
        preco: 89.90
      },
      {
        id: '202',
        ean: '7893216549870',
        titulo: 'Caixa de Ovos',
        quantidade: 2,
        preco: 18.50
      }
    ]
  }
];

export const RecorrenciasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recorrencias, setRecorrencias] = useState<Recorrencia[]>(dadosIniciais);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Função para obter recorrências da API (simulada)
  useEffect(() => {
    const carregarRecorrencias = async () => {
      setLoading(true);
      try {
        // Aqui seria a chamada para a API real
        // const response = await fetch('/api/recorrencias');
        // const data = await response.json();
        // setRecorrencias(data);
        
        // Simulando um delay de carregamento
        setTimeout(() => {
          setRecorrencias(dadosIniciais);
          setLoading(false);
        }, 1000);
      } catch (error) {
        setError('Erro ao carregar recorrências');
        toast({
          title: "Erro",
          description: "Não foi possível carregar as recorrências.",
          variant: "destructive"
        });
        setLoading(false);
      }
    };

    carregarRecorrencias();
  }, [toast]);

  // Função para adicionar uma nova recorrência
  const adicionarRecorrencia = async (novaRecorrencia: Omit<Recorrencia, 'id' | 'dataCriacao'>): Promise<Recorrencia> => {
    setLoading(true);
    try {
      // Aqui seria a chamada para a API real
      // const response = await fetch('/api/recorrencias', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(novaRecorrencia)
      // });
      // const data = await response.json();
      
      // Simulando a adição
      const recorrenciaCompleta: Recorrencia = {
        ...novaRecorrencia,
        id: Date.now().toString(),
        dataCriacao: new Date().toISOString().split('T')[0]
      };
      
      setRecorrencias(prev => [...prev, recorrenciaCompleta]);
      toast({
        title: "Sucesso",
        description: "Recorrência adicionada com sucesso."
      });
      
      setLoading(false);
      return recorrenciaCompleta;
    } catch (error) {
      setError('Erro ao adicionar recorrência');
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a recorrência.",
        variant: "destructive"
      });
      setLoading(false);
      throw error;
    }
  };

  // Função para atualizar uma recorrência
  const atualizarRecorrencia = async (id: string, dadosAtualizados: Partial<Recorrencia>): Promise<Recorrencia> => {
    setLoading(true);
    try {
      // Aqui seria a chamada para a API real
      // const response = await fetch(`/api/recorrencias/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(dadosAtualizados)
      // });
      // const data = await response.json();
      
      // Simulando a atualização
      const recorrenciaIndex = recorrencias.findIndex(r => r.id === id);
      
      if (recorrenciaIndex === -1) {
        throw new Error('Recorrência não encontrada');
      }
      
      const recorrenciaAtualizada = {
        ...recorrencias[recorrenciaIndex],
        ...dadosAtualizados
      };
      
      const novaLista = [...recorrencias];
      novaLista[recorrenciaIndex] = recorrenciaAtualizada;
      
      setRecorrencias(novaLista);
      toast({
        title: "Sucesso",
        description: "Recorrência atualizada com sucesso."
      });
      
      setLoading(false);
      return recorrenciaAtualizada;
    } catch (error) {
      setError('Erro ao atualizar recorrência');
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a recorrência.",
        variant: "destructive"
      });
      setLoading(false);
      throw error;
    }
  };

  // Função para alterar o status de uma recorrência
  const alterarStatusRecorrencia = async (id: string, novoStatus: StatusRecorrencia): Promise<Recorrencia> => {
    return atualizarRecorrencia(id, { status: novoStatus });
  };

  // Função para obter uma recorrência pelo ID
  const obterRecorrenciaPorId = (id: string): Recorrencia | undefined => {
    return recorrencias.find(r => r.id === id);
  };

  // Função para calcular a próxima data com base nos dias de recorrência
  const calcularProximaData = (diasRecorrencia: number): string => {
    const hoje = new Date();
    const proximaData = new Date(hoje.getTime() + diasRecorrencia * 24 * 60 * 60 * 1000);
    return proximaData.toISOString().split('T')[0];
  };

  // Função para filtrar recorrências por status
  const filtrarRecorrenciasPorStatus = (status: StatusRecorrencia | 'todas'): Recorrencia[] => {
    if (status === 'todas') {
      return recorrencias;
    }
    return recorrencias.filter(r => r.status === status);
  };

  return (
    <RecorrenciasContext.Provider
      value={{
        recorrencias,
        loading,
        error,
        adicionarRecorrencia,
        atualizarRecorrencia,
        alterarStatusRecorrencia,
        obterRecorrenciaPorId,
        calcularProximaData,
        filtrarRecorrenciasPorStatus
      }}
    >
      {children}
    </RecorrenciasContext.Provider>
  );
};

export const useRecorrencias = () => {
  const context = useContext(RecorrenciasContext);
  if (context === undefined) {
    throw new Error('useRecorrencias deve ser usado dentro de um RecorrenciasProvider');
  }
  return context;
}; 