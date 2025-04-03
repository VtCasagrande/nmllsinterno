'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Status possíveis para um atendimento de CRM
export enum StatusCRM {
  EM_ABERTO = 'em_aberto',
  EM_MONITORAMENTO = 'em_monitoramento',
  FINALIZADO = 'finalizado'
}

// Interface para um atendimento do CRM
export interface AtendimentoCRM {
  id: string;
  data: string;           // Data do atendimento no formato ISO
  cliente: {
    id: string;
    nome: string;
    cpf: string;
    telefone: string;
  };
  motivo: string;         // Descrição do motivo do atendimento
  observacoes?: string;   // Observações adicionais
  responsavel: {
    id: string;
    nome: string;
  };
  status: StatusCRM;
  dataCriacao: string;    // Data de criação do registro
  dataAtualizacao: string; // Data da última atualização
  dataProximoContato?: string; // Data do próximo contato planejado (para monitoramento)
  historico?: HistoricoAtendimento[]; // Histórico de interações do atendimento
}

// Interface para histórico de atendimento
export interface HistoricoAtendimento {
  id: string;
  data: string;
  responsavel: {
    id: string;
    nome: string;
  };
  descricao: string;
  status: StatusCRM;
}

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

// Criar o contexto
const CRMContext = createContext<CRMContextType | undefined>(undefined);

// Hook para usar o contexto
export const useCRM = () => {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM deve ser usado dentro de um CRMProvider');
  }
  return context;
};

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
  }
];

interface CRMProviderProps {
  children: ReactNode;
}

// Provider component
export const CRMProvider: React.FC<CRMProviderProps> = ({ children }) => {
  const [atendimentos, setAtendimentos] = useState<AtendimentoCRM[]>(dadosIniciais);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [usuariosDisponiveis] = useState(usuariosIniciais);

  // Funções mock
  const adicionarAtendimento = async (novoAtendimento: Omit<AtendimentoCRM, 'id' | 'dataCriacao' | 'dataAtualizacao' | 'historico'>): Promise<AtendimentoCRM> => {
    return dadosIniciais[0];
  };

  const atualizarAtendimento = async (id: string, dadosAtualizados: Partial<AtendimentoCRM>, comentario?: string): Promise<AtendimentoCRM> => {
    return dadosIniciais[0];
  };

  const obterAtendimentoPorId = (id: string): AtendimentoCRM | undefined => {
    return dadosIniciais[0];
  };

  const filtrarAtendimentosPorStatus = (status: StatusCRM | 'todos'): AtendimentoCRM[] => {
    return dadosIniciais;
  };

  const filtrarAtendimentosPorResponsavel = (responsavelId: string | 'todos'): AtendimentoCRM[] => {
    return dadosIniciais;
  };

  const filtrarAtendimentosPorData = (dataInicio: string, dataFim: string): AtendimentoCRM[] => {
    return dadosIniciais;
  };

  const buscarAtendimentos = (termo: string): AtendimentoCRM[] => {
    return dadosIniciais;
  };

  const adicionarComentario = async (atendimentoId: string, comentario: string, novoStatus?: StatusCRM): Promise<AtendimentoCRM> => {
    return dadosIniciais[0];
  };

  const atribuirResponsavel = async (atendimentoId: string, responsavelId: string, responsavelNome: string, comentario?: string): Promise<AtendimentoCRM> => {
    return dadosIniciais[0];
  };

  const finalizarECriarNovoAtendimento = async (
    atendimentoId: string, 
    observacaoFinalizacao: string,
    criarNovo: boolean,
    diasParaNovoContato?: number,
    dataNovoContato?: string
  ): Promise<{atendimentoFinalizado: AtendimentoCRM, novoAtendimento?: AtendimentoCRM}> => {
    return {
      atendimentoFinalizado: dadosIniciais[0],
      novoAtendimento: criarNovo ? dadosIniciais[0] : undefined
    };
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