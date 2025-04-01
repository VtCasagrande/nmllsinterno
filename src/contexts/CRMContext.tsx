import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AtendimentoCRM, StatusCRM, HistoricoAtendimento } from '@/types/crm';
import { useToast } from '@/components/ui/toast-provider';

interface CRMContextType {
  atendimentos: AtendimentoCRM[];
  loading: boolean;
  error: string | null;
  adicionarAtendimento: (novoAtendimento: Omit<AtendimentoCRM, 'id' | 'dataCriacao' | 'dataAtualizacao' | 'historico'>) => Promise<AtendimentoCRM>;
  atualizarAtendimento: (id: string, dadosAtualizados: Partial<AtendimentoCRM>, comentario?: string) => Promise<AtendimentoCRM>;
  obterAtendimentoPorId: (id: string) => AtendimentoCRM | undefined;
  filtrarAtendimentosPorStatus: (status: StatusCRM | 'todos') => AtendimentoCRM[];
  filtrarAtendimentosPorResponsavel: (responsavelId: string | 'todos') => AtendimentoCRM[];
  filtrarAtendimentosPorData: (dataInicio: string, dataFim: string) => AtendimentoCRM[];
  buscarAtendimentos: (termo: string) => AtendimentoCRM[];
  adicionarComentario: (atendimentoId: string, comentario: string, novoStatus?: StatusCRM) => Promise<AtendimentoCRM>;
  atribuirResponsavel: (atendimentoId: string, responsavelId: string, responsavelNome: string, comentario?: string) => Promise<AtendimentoCRM>;
  usuariosDisponiveis: { id: string, nome: string }[];
  finalizarECriarNovoAtendimento: (
    atendimentoId: string, 
    observacaoFinalizacao: string,
    criarNovo: boolean,
    diasParaNovoContato?: number,
    dataNovoContato?: string
  ) => Promise<{atendimentoFinalizado: AtendimentoCRM, novoAtendimento?: AtendimentoCRM}>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

// Dados fictícios para desenvolvimento
const usuariosIniciais = [
  { id: '1', nome: 'Ana Silva' },
  { id: '2', nome: 'João Pereira' },
  { id: '3', nome: 'Maria Oliveira' },
  { id: '4', nome: 'Carlos Santos' }
];

const dadosIniciais: AtendimentoCRM[] = [
  {
    id: '1',
    data: new Date().toISOString(),
    cliente: {
      id: '101',
      nome: 'Roberto Almeida',
      cpf: '123.456.789-00',
      telefone: '(11) 98765-4321'
    },
    motivo: 'Problema com entrega do pedido #12345',
    observacoes: 'Cliente relatou que o produto chegou danificado',
    responsavel: {
      id: '1',
      nome: 'Ana Silva'
    },
    status: StatusCRM.EM_ABERTO,
    dataCriacao: new Date().toISOString(),
    dataAtualizacao: new Date().toISOString(),
    dataProximoContato: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    historico: [
      {
        id: '1001',
        data: new Date().toISOString(),
        responsavel: {
          id: '1',
          nome: 'Ana Silva'
        },
        descricao: 'Atendimento inicial. Cliente relatou produto danificado.',
        status: StatusCRM.EM_ABERTO
      }
    ]
  },
  {
    id: '2',
    data: new Date().toISOString(),
    cliente: {
      id: '102',
      nome: 'Fernanda Costa',
      cpf: '987.654.321-00',
      telefone: '(11) 91234-5678'
    },
    motivo: 'Solicitação de troca de produto',
    responsavel: {
      id: '2',
      nome: 'João Pereira'
    },
    status: StatusCRM.EM_MONITORAMENTO,
    dataCriacao: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    dataAtualizacao: new Date().toISOString(),
    dataProximoContato: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    historico: [
      {
        id: '2001',
        data: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        responsavel: {
          id: '3',
          nome: 'Maria Oliveira'
        },
        descricao: 'Registro inicial da solicitação de troca.',
        status: StatusCRM.EM_ABERTO
      },
      {
        id: '2002',
        data: new Date().toISOString(),
        responsavel: {
          id: '2',
          nome: 'João Pereira'
        },
        descricao: 'Processo de troca iniciado. Aguardando resposta do fornecedor.',
        status: StatusCRM.EM_MONITORAMENTO
      }
    ]
  }
];

export const CRMProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [atendimentos, setAtendimentos] = useState<AtendimentoCRM[]>(dadosIniciais);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usuariosDisponiveis] = useState(usuariosIniciais);
  const { toast } = useToast();

  // Função para obter atendimentos da API (simulada)
  useEffect(() => {
    const carregarAtendimentos = async () => {
      setLoading(true);
      try {
        // Aqui seria a chamada para a API real
        // const response = await fetch('/api/crm/atendimentos');
        // const data = await response.json();
        // setAtendimentos(data);
        
        // Simulando um delay de carregamento
        setTimeout(() => {
          setAtendimentos(dadosIniciais);
          setLoading(false);
        }, 1000);
      } catch (error) {
        setError('Erro ao carregar atendimentos');
        toast({
          title: "Erro",
          description: "Não foi possível carregar os atendimentos.",
          variant: "destructive"
        });
        setLoading(false);
      }
    };

    carregarAtendimentos();
  }, [toast]);

  // Função para adicionar um novo atendimento
  const adicionarAtendimento = async (novoAtendimento: Omit<AtendimentoCRM, 'id' | 'dataCriacao' | 'dataAtualizacao' | 'historico'>): Promise<AtendimentoCRM> => {
    setLoading(true);
    try {
      // Aqui seria a chamada para a API real
      // const response = await fetch('/api/crm/atendimentos', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(novoAtendimento)
      // });
      // const data = await response.json();
      
      // Simulando a adição
      const agora = new Date().toISOString();
      const historicoInicial: HistoricoAtendimento = {
        id: Date.now().toString(),
        data: agora,
        responsavel: novoAtendimento.responsavel,
        descricao: `Atendimento inicial: ${novoAtendimento.motivo}`,
        status: novoAtendimento.status
      };
      
      const atendimentoCompleto: AtendimentoCRM = {
        ...novoAtendimento,
        id: Date.now().toString(),
        dataCriacao: agora,
        dataAtualizacao: agora,
        historico: [historicoInicial]
      };
      
      setAtendimentos(prev => [...prev, atendimentoCompleto]);
      toast({
        title: "Sucesso",
        description: "Atendimento adicionado com sucesso."
      });
      
      setLoading(false);
      return atendimentoCompleto;
    } catch (error) {
      setError('Erro ao adicionar atendimento');
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o atendimento.",
        variant: "destructive"
      });
      setLoading(false);
      throw error;
    }
  };

  // Função para atualizar um atendimento
  const atualizarAtendimento = async (id: string, dadosAtualizados: Partial<AtendimentoCRM>, comentario?: string): Promise<AtendimentoCRM> => {
    setLoading(true);
    try {
      const agora = new Date().toISOString();
      const atendimentoIndex = atendimentos.findIndex(a => a.id === id);
      
      if (atendimentoIndex === -1) {
        throw new Error('Atendimento não encontrado');
      }
      
      const atendimentoAtual = atendimentos[atendimentoIndex];
      
      // Criar um novo histórico se houver comentário
      let novoHistorico = [...(atendimentoAtual.historico || [])];
      if (comentario) {
        const itemHistorico: HistoricoAtendimento = {
          id: Date.now().toString(),
          data: agora,
          responsavel: dadosAtualizados.responsavel || atendimentoAtual.responsavel,
          descricao: comentario,
          status: dadosAtualizados.status || atendimentoAtual.status
        };
        novoHistorico.push(itemHistorico);
      }
      
      const atendimentoAtualizado = {
        ...atendimentoAtual,
        ...dadosAtualizados,
        dataAtualizacao: agora,
        historico: novoHistorico
      };
      
      const novosAtendimentos = [...atendimentos];
      novosAtendimentos[atendimentoIndex] = atendimentoAtualizado;
      
      setAtendimentos(novosAtendimentos);
      toast({
        title: "Sucesso",
        description: "Atendimento atualizado com sucesso."
      });
      
      setLoading(false);
      return atendimentoAtualizado;
    } catch (error) {
      setError('Erro ao atualizar atendimento');
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o atendimento.",
        variant: "destructive"
      });
      setLoading(false);
      throw error;
    }
  };

  // Função para obter um atendimento pelo ID
  const obterAtendimentoPorId = (id: string): AtendimentoCRM | undefined => {
    return atendimentos.find(a => a.id === id);
  };

  // Função para filtrar atendimentos por status
  const filtrarAtendimentosPorStatus = (status: StatusCRM | 'todos'): AtendimentoCRM[] => {
    if (status === 'todos') {
      return atendimentos;
    }
    return atendimentos.filter(a => a.status === status);
  };

  // Função para filtrar atendimentos por responsável
  const filtrarAtendimentosPorResponsavel = (responsavelId: string | 'todos'): AtendimentoCRM[] => {
    if (responsavelId === 'todos') {
      return atendimentos;
    }
    return atendimentos.filter(a => a.responsavel.id === responsavelId);
  };

  // Função para filtrar atendimentos por data
  const filtrarAtendimentosPorData = (dataInicio: string, dataFim: string): AtendimentoCRM[] => {
    const inicio = new Date(dataInicio).getTime();
    const fim = new Date(dataFim).getTime();
    
    return atendimentos.filter(a => {
      const dataAtendimento = new Date(a.data).getTime();
      return dataAtendimento >= inicio && dataAtendimento <= fim;
    });
  };

  // Função para buscar atendimentos
  const buscarAtendimentos = (termo: string): AtendimentoCRM[] => {
    if (!termo.trim()) return atendimentos;
    
    const termoBusca = termo.toLowerCase();
    return atendimentos.filter(a => 
      a.cliente.nome.toLowerCase().includes(termoBusca) ||
      a.cliente.cpf.includes(termoBusca) ||
      a.cliente.telefone.includes(termoBusca) ||
      a.motivo.toLowerCase().includes(termoBusca) ||
      (a.observacoes && a.observacoes.toLowerCase().includes(termoBusca))
    );
  };

  // Função para adicionar comentário a um atendimento
  const adicionarComentario = async (atendimentoId: string, comentario: string, novoStatus?: StatusCRM): Promise<AtendimentoCRM> => {
    if (!comentario.trim()) {
      toast({
        title: "Erro",
        description: "O comentário não pode estar vazio.",
        variant: "destructive"
      });
      throw new Error('Comentário vazio');
    }
    
    const atendimento = obterAtendimentoPorId(atendimentoId);
    if (!atendimento) {
      toast({
        title: "Erro",
        description: "Atendimento não encontrado.",
        variant: "destructive"
      });
      throw new Error('Atendimento não encontrado');
    }
    
    const atualizacoes: Partial<AtendimentoCRM> = {};
    if (novoStatus) {
      atualizacoes.status = novoStatus;
    }
    
    return atualizarAtendimento(atendimentoId, atualizacoes, comentario);
  };

  // Função para atribuir responsável a um atendimento
  const atribuirResponsavel = async (atendimentoId: string, responsavelId: string, responsavelNome: string, comentario?: string): Promise<AtendimentoCRM> => {
    const atendimento = obterAtendimentoPorId(atendimentoId);
    if (!atendimento) {
      toast({
        title: "Erro",
        description: "Atendimento não encontrado.",
        variant: "destructive"
      });
      throw new Error('Atendimento não encontrado');
    }
    
    const novoResponsavel = {
      id: responsavelId,
      nome: responsavelNome
    };
    
    const comentarioAtribuicao = comentario || 
      `Atendimento atribuído para ${responsavelNome}${
        atendimento.responsavel.id !== responsavelId 
          ? ` (anteriormente: ${atendimento.responsavel.nome})`
          : ''
      }`;
    
    return atualizarAtendimento(
      atendimentoId, 
      { responsavel: novoResponsavel },
      comentarioAtribuicao
    );
  };

  // Função para finalizar um atendimento e criar um novo atendimento baseado nele
  const finalizarECriarNovoAtendimento = async (
    atendimentoId: string, 
    observacaoFinalizacao: string,
    criarNovo: boolean,
    diasParaNovoContato?: number,
    dataNovoContato?: string
  ): Promise<{atendimentoFinalizado: AtendimentoCRM, novoAtendimento?: AtendimentoCRM}> => {
    setLoading(true);
    try {
      // Encontrar o atendimento original
      const atendimentoOriginal = atendimentos.find(a => a.id === atendimentoId);
      
      if (!atendimentoOriginal) {
        throw new Error('Atendimento não encontrado');
      }
      
      // 1. Finalizar o atendimento atual
      const observacao = observacaoFinalizacao.trim() || 'Atendimento finalizado';
      const atendimentoFinalizado = await atualizarAtendimento(
        atendimentoId,
        {
          ...atendimentoOriginal,
          status: StatusCRM.FINALIZADO,
          observacoes: 
            (atendimentoOriginal.observacoes ? atendimentoOriginal.observacoes + '\n\n' : '') + 
            observacao
        },
        `Atendimento finalizado: ${observacao}`
      );
      
      // 2. Se solicitado, criar um novo atendimento com base no atual
      let novoAtendimento: AtendimentoCRM | undefined;
      
      if (criarNovo) {
        // Determinar a data do próximo contato
        let dataProximoContato: string;
        
        if (dataNovoContato) {
          // Usar a data específica informada
          dataProximoContato = new Date(dataNovoContato).toISOString();
        } else if (diasParaNovoContato) {
          // Calcular a data baseada no número de dias a partir de hoje
          const novaData = new Date();
          novaData.setDate(novaData.getDate() + diasParaNovoContato);
          dataProximoContato = novaData.toISOString();
        } else {
          // Padrão: 7 dias a partir de hoje
          const novaData = new Date();
          novaData.setDate(novaData.getDate() + 7);
          dataProximoContato = novaData.toISOString();
        }
        
        // Criar o novo atendimento
        const dadosNovoAtendimento = {
          data: new Date().toISOString(),
          cliente: atendimentoOriginal.cliente,
          motivo: `Continuação: ${atendimentoOriginal.motivo}`,
          responsavel: atendimentoOriginal.responsavel,
          status: StatusCRM.EM_MONITORAMENTO,
          dataProximoContato: dataProximoContato,
          observacoes: `Continuação do atendimento #${atendimentoOriginal.id}.\n\nÚltimas observações: ${observacao}`
        };
        
        novoAtendimento = await adicionarAtendimento(dadosNovoAtendimento);
      }
      
      setLoading(false);
      return { atendimentoFinalizado, novoAtendimento };
    } catch (error) {
      setError('Erro ao finalizar e criar novo atendimento');
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o atendimento ou criar o novo.",
        variant: "destructive"
      });
      setLoading(false);
      throw error;
    }
  };

  return (
    <CRMContext.Provider
      value={{
        atendimentos,
        loading,
        error,
        adicionarAtendimento,
        atualizarAtendimento,
        obterAtendimentoPorId,
        filtrarAtendimentosPorStatus,
        filtrarAtendimentosPorResponsavel,
        filtrarAtendimentosPorData,
        buscarAtendimentos,
        adicionarComentario,
        atribuirResponsavel,
        usuariosDisponiveis,
        finalizarECriarNovoAtendimento
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM deve ser usado dentro de um CRMProvider');
  }
  return context;
}; 