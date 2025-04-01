'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Aviso, 
  AvisoInput, 
  AvisoUpdate, 
  AvisoStatus,
  AvisoPrioridade,
  TipoDestinatario,
  Reacao,
  ReacaoInput,
  TipoReacao,
  AvisoFiltros
} from '@/types/avisos';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

// Interface para o contexto
interface AvisosContextProps {
  avisos: Aviso[];
  meusAvisos: Aviso[];
  loading: boolean;
  error: string | null;
  filtros: AvisoFiltros;
  setFiltros: (filtros: AvisoFiltros) => void;
  getAvisos: (forceRefresh?: boolean) => Promise<Aviso[]>;
  getAvisoById: (id: string) => Promise<Aviso | null>;
  createAviso: (dados: AvisoInput) => Promise<Aviso>;
  updateAviso: (id: string, dados: AvisoUpdate) => Promise<Aviso>;
  arquivarAviso: (id: string) => Promise<Aviso>;
  adicionarReacao: (avisoId: string, tipo: TipoReacao) => Promise<Reacao>;
  removerReacao: (avisoId: string) => Promise<boolean>;
  marcarComoLido: (avisoId: string) => Promise<void>;
}

// Criar o contexto
const AvisosContext = createContext<AvisosContextProps | undefined>(undefined);

// Hook para usar o contexto
export const useAvisos = () => {
  const context = useContext(AvisosContext);
  if (context === undefined) {
    throw new Error('useAvisos deve ser usado dentro de um AvisosProvider');
  }
  return context;
};

interface AvisosProviderProps {
  children: ReactNode;
}

// Dados de exemplo para avisos
const AVISOS_MOCK: Aviso[] = [
  {
    id: '1',
    titulo: 'Manutenção Programada do Sistema',
    conteudo: 'Informamos que haverá manutenção programada no sistema no dia 20/04, das 22h às 02h. Durante este período, o sistema ficará indisponível.',
    tipoDestinatario: TipoDestinatario.TODOS,
    prioridade: AvisoPrioridade.ALTA,
    status: AvisoStatus.ATIVO,
    dataPublicacao: new Date(Date.now() - 259200000).toISOString(), // 3 dias atrás
    usuarioCriacao: 'admin',
    visualizacoes: 12,
    reacoes: [
      {
        id: '1',
        avisoId: '1',
        usuarioId: 'user1',
        usuarioNome: 'João Silva',
        tipo: TipoReacao.VERIFICADO,
        dataCriacao: new Date(Date.now() - 172800000).toISOString() // 2 dias atrás
      },
      {
        id: '2',
        avisoId: '1',
        usuarioId: 'user2',
        usuarioNome: 'Maria Oliveira',
        tipo: TipoReacao.CONCORDAR,
        dataCriacao: new Date(Date.now() - 86400000).toISOString() // 1 dia atrás
      }
    ]
  },
  {
    id: '2',
    titulo: 'Nova Política de Entregas',
    conteudo: 'A partir do dia 25/04, entrarão em vigor novas políticas de entrega. Todos os motoristas devem comparecer à reunião informativa no dia 22/04 às 9h.',
    tipoDestinatario: TipoDestinatario.GRUPO,
    grupos: ['motoristas'],
    prioridade: AvisoPrioridade.NORMAL,
    status: AvisoStatus.ATIVO,
    dataPublicacao: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
    usuarioCriacao: 'admin',
    visualizacoes: 8,
    reacoes: []
  }
];

// Provider component
export const AvisosProvider: React.FC<AvisosProviderProps> = ({ children }) => {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [meusAvisos, setMeusAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const [filtros, setFiltros] = useState<AvisoFiltros>({});
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  // Filtrar avisos relevantes para o usuário atual
  const filtrarMeusAvisos = (todosAvisos: Aviso[]) => {
    if (!profile) {
      setMeusAvisos([]);
      return;
    }

    const avisosFiltrados = todosAvisos.filter(aviso => {
      // Avisos para todos são sempre relevantes
      if (aviso.tipoDestinatario === TipoDestinatario.TODOS) {
        return true;
      }

      // Avisos para grupos específicos
      if (aviso.tipoDestinatario === TipoDestinatario.GRUPO && aviso.grupos) {
        // Simplificado para o mock - em produção verificaria os IDs dos grupos
        if (aviso.grupos.includes('motoristas') && profile.role === 'motorista') {
          return true;
        }
        if (aviso.grupos.includes('operadores') && profile.role === 'operador') {
          return true;
        }
        if (aviso.grupos.includes('gerentes') && profile.role === 'gerente') {
          return true;
        }
        if (aviso.grupos.includes('admins') && profile.role === 'admin') {
          return true;
        }
      }

      // Avisos para usuários específicos
      if (aviso.tipoDestinatario === TipoDestinatario.USUARIOS && aviso.usuarios) {
        return aviso.usuarios.includes(profile.id);
      }

      return false;
    });

    setMeusAvisos(avisosFiltrados);
  };

  // Carregar avisos na inicialização (uma única vez)
  useEffect(() => {
    // Se já carregamos os dados, não fazer nada
    if (isDataLoaded) return;
    
    const loadAvisos = () => {
      try {
        // Tentar carregar do cache primeiro
        const savedAvisos = localStorage.getItem('avisos');
        if (savedAvisos) {
          const parsedAvisos = JSON.parse(savedAvisos);
          setAvisos(parsedAvisos);
          filtrarMeusAvisos(parsedAvisos);
          setIsDataLoaded(true);
        } else {
          // Se não houver avisos salvos, usar os dados de exemplo
          console.log("Carregando avisos mockados (primeira vez)");
          setAvisos(AVISOS_MOCK);
          filtrarMeusAvisos(AVISOS_MOCK);
          setIsDataLoaded(true);
          
          // Em desenvolvimento, salvar os dados mockados no localStorage
          if (process.env.NODE_ENV === 'development') {
            localStorage.setItem('avisos', JSON.stringify(AVISOS_MOCK));
          }
        }
      } catch (err) {
        console.error('Erro ao carregar avisos:', err);
        // Em caso de erro, usar dados mockados
        setAvisos(AVISOS_MOCK);
        filtrarMeusAvisos(AVISOS_MOCK);
        setIsDataLoaded(true);
      }
    };

    loadAvisos();
  }, []);  // ← Removido profile da dependência para evitar recarregamentos

  // Quando o perfil mudar, apenas filtrar os avisos novamente
  useEffect(() => {
    if (isDataLoaded) {
      filtrarMeusAvisos(avisos);
    }
  }, [profile, isDataLoaded]);

  // Salvar avisos no armazenamento local quando mudar
  useEffect(() => {
    if (avisos.length > 0) {
      try {
        localStorage.setItem('avisos', JSON.stringify(avisos));
      } catch (err) {
        console.error('Erro ao salvar avisos:', err);
      }
    }
  }, [avisos]);

  // Obter todos os avisos
  const getAvisos = async (forceRefresh = false): Promise<Aviso[]> => {
    // Se já estamos carregando, não fazer outra requisição
    if (loading) return avisos;
    
    // Verificar se foi buscado recentemente (nos últimos 30 segundos)
    const now = Date.now();
    const cacheTime = 30 * 1000; // 30 segundos
    
    if (!forceRefresh && 
        avisos.length > 0 && 
        now - lastFetchTime < cacheTime) {
      console.log("Usando cache de avisos (buscado há menos de 30s)");
      return avisos;
    }
    
    setLoading(true);
    setError(null);

    try {
      console.log("Buscando avisos da API");
      
      // Em produção, chamaria a API
      const response = await fetch('/api/avisos');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar avisos');
      }
      
      const avisosData = await response.json();
      setAvisos(avisosData);
      filtrarMeusAvisos(avisosData);
      setLastFetchTime(now);
      setIsDataLoaded(true);
      return avisosData;
    } catch (err) {
      console.error('Erro ao carregar avisos:', err);
      
      // Se já temos dados, retornar o que temos em vez de substituir com dados mockados
      if (avisos.length > 0) {
        return avisos;
      }
      
      // No ambiente de desenvolvimento, usamos os dados mockados
      console.log("Usando dados mockados devido a erro na API");
      setAvisos(AVISOS_MOCK);
      filtrarMeusAvisos(AVISOS_MOCK);
      setLastFetchTime(now);
      setIsDataLoaded(true);
      return AVISOS_MOCK;
    } finally {
      setLoading(false);
    }
  };

  // Obter um aviso pelo ID
  const getAvisoById = async (id: string): Promise<Aviso | null> => {
    // Se já estamos carregando, não fazer outra requisição
    if (loading) {
      const avisoEmCache = avisos.find(a => a.id === id);
      return avisoEmCache || null;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Verificar se já temos o aviso em memória
      const avisoLocal = avisos.find(a => a.id === id);
      if (avisoLocal) {
        console.log(`Usando aviso em cache para ID: ${id}`);
        setLoading(false);
        return avisoLocal;
      }
      
      console.log(`Buscando aviso com ID: ${id}`);
      
      // Em produção, chamaria a API
      const response = await fetch(`/api/avisos/${id}`);
      
      if (!response.ok) {
        throw new Error('Aviso não encontrado');
      }
      
      const aviso = await response.json();
      return aviso;
    } catch (err) {
      console.error('Erro ao carregar aviso:', err);
      
      // No ambiente de desenvolvimento, buscamos nos dados mockados
      const avisoMock = AVISOS_MOCK.find(a => a.id === id);
      return avisoMock || null;
    } finally {
      setLoading(false);
    }
  };

  // Criar um novo aviso
  const createAviso = async (dados: AvisoInput): Promise<Aviso> => {
    setLoading(true);
    setError(null);

    try {
      // Em produção, chamaria a API
      const response = await fetch('/api/avisos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar aviso');
      }
      
      const novoAviso = await response.json();
      
      // Atualizar a lista de avisos em memória
      setAvisos(prevAvisos => [...prevAvisos, novoAviso]);
      filtrarMeusAvisos([...avisos, novoAviso]);
      
      toast.success('Aviso criado com sucesso!');
      return novoAviso;
    } catch (err) {
      console.error('Erro ao criar aviso:', err);
      setError('Erro ao criar aviso');
      
      // Simulação para desenvolvimento
      const novoAviso: Aviso = {
        id: `temp-${Date.now()}`,
        ...dados,
        dataPublicacao: new Date().toISOString(),
        usuarioCriacao: profile?.id || 'unknown',
        visualizacoes: 0,
        reacoes: []
      };
      
      setAvisos(prevAvisos => [...prevAvisos, novoAviso]);
      filtrarMeusAvisos([...avisos, novoAviso]);
      
      toast.success('Aviso criado com sucesso!');
      return novoAviso;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar um aviso existente
  const updateAviso = async (id: string, dados: AvisoUpdate): Promise<Aviso> => {
    setLoading(true);
    setError(null);

    try {
      // Em produção, chamaria a API
      const response = await fetch(`/api/avisos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar aviso');
      }
      
      const avisoAtualizado = await response.json();
      
      // Atualizar a lista de avisos em memória
      setAvisos(prevAvisos => 
        prevAvisos.map(aviso => 
          aviso.id === id ? { ...aviso, ...avisoAtualizado } : aviso
        )
      );
      
      toast.success('Aviso atualizado com sucesso!');
      return avisoAtualizado;
    } catch (err) {
      console.error('Erro ao atualizar aviso:', err);
      setError('Erro ao atualizar aviso');
      
      // Simulação para desenvolvimento
      const avisoExistente = avisos.find(a => a.id === id);
      if (!avisoExistente) {
        throw new Error('Aviso não encontrado');
      }
      
      const avisoAtualizado = { ...avisoExistente, ...dados };
      
      setAvisos(prevAvisos => 
        prevAvisos.map(aviso => 
          aviso.id === id ? avisoAtualizado : aviso
        )
      );
      
      toast.success('Aviso atualizado com sucesso!');
      return avisoAtualizado;
    } finally {
      setLoading(false);
    }
  };

  // Arquivar um aviso
  const arquivarAviso = async (id: string): Promise<Aviso> => {
    setLoading(true);
    setError(null);

    try {
      // Em produção, chamaria a API
      const response = await fetch(`/api/avisos/${id}/arquivar`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao arquivar aviso');
      }
      
      const avisoAtualizado = await response.json();
      
      // Atualizar a lista de avisos em memória
      setAvisos(prevAvisos => 
        prevAvisos.map(aviso => 
          aviso.id === id ? { ...aviso, status: AvisoStatus.ARQUIVADO } : aviso
        )
      );
      
      toast.success('Aviso arquivado com sucesso!');
      return avisoAtualizado;
    } catch (err) {
      console.error('Erro ao arquivar aviso:', err);
      setError('Erro ao arquivar aviso');
      
      // Simulação para desenvolvimento
      const avisoExistente = avisos.find(a => a.id === id);
      if (!avisoExistente) {
        throw new Error('Aviso não encontrado');
      }
      
      const avisoAtualizado = { ...avisoExistente, status: AvisoStatus.ARQUIVADO };
      
      setAvisos(prevAvisos => 
        prevAvisos.map(aviso => 
          aviso.id === id ? avisoAtualizado : aviso
        )
      );
      
      toast.success('Aviso arquivado com sucesso!');
      return avisoAtualizado;
    } finally {
      setLoading(false);
    }
  };

  // Adicionar uma reação a um aviso
  const adicionarReacao = async (avisoId: string, tipo: TipoReacao): Promise<Reacao> => {
    if (!profile) {
      throw new Error('Usuário não autenticado');
    }

    setLoading(true);
    setError(null);

    try {
      // Em produção, chamaria a API
      const response = await fetch(`/api/avisos/${avisoId}/reacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tipo }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao adicionar reação');
      }
      
      const novaReacao = await response.json();
      
      // Atualizar a lista de avisos em memória
      setAvisos(prevAvisos => 
        prevAvisos.map(aviso => {
          if (aviso.id === avisoId) {
            // Verificar se o usuário já reagiu e remover reação anterior
            const reacoesFiltradas = aviso.reacoes.filter(r => r.usuarioId !== profile.id);
            
            return {
              ...aviso,
              reacoes: [...reacoesFiltradas, novaReacao]
            };
          }
          return aviso;
        })
      );
      
      return novaReacao;
    } catch (err) {
      console.error('Erro ao adicionar reação:', err);
      setError('Erro ao adicionar reação');
      
      // Simulação para desenvolvimento
      const avisoExistente = avisos.find(a => a.id === avisoId);
      if (!avisoExistente) {
        throw new Error('Aviso não encontrado');
      }
      
      const novaReacao: Reacao = {
        id: `temp-${Date.now()}`,
        avisoId,
        usuarioId: profile.id,
        usuarioNome: profile.name || 'Usuário',
        tipo,
        dataCriacao: new Date().toISOString()
      };
      
      setAvisos(prevAvisos => 
        prevAvisos.map(aviso => {
          if (aviso.id === avisoId) {
            // Verificar se o usuário já reagiu e remover reação anterior
            const reacoesFiltradas = aviso.reacoes.filter(r => r.usuarioId !== profile.id);
            
            return {
              ...aviso,
              reacoes: [...reacoesFiltradas, novaReacao]
            };
          }
          return aviso;
        })
      );
      
      return novaReacao;
    } finally {
      setLoading(false);
    }
  };

  // Remover reação de um aviso
  const removerReacao = async (avisoId: string): Promise<boolean> => {
    if (!profile) {
      throw new Error('Usuário não autenticado');
    }

    setLoading(true);
    setError(null);

    try {
      // Em produção, chamaria a API
      const response = await fetch(`/api/avisos/${avisoId}/reacoes`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao remover reação');
      }
      
      // Atualizar a lista de avisos em memória
      setAvisos(prevAvisos => 
        prevAvisos.map(aviso => {
          if (aviso.id === avisoId) {
            return {
              ...aviso,
              reacoes: aviso.reacoes.filter(r => r.usuarioId !== profile.id)
            };
          }
          return aviso;
        })
      );
      
      return true;
    } catch (err) {
      console.error('Erro ao remover reação:', err);
      setError('Erro ao remover reação');
      
      // Simulação para desenvolvimento
      setAvisos(prevAvisos => 
        prevAvisos.map(aviso => {
          if (aviso.id === avisoId) {
            return {
              ...aviso,
              reacoes: aviso.reacoes.filter(r => r.usuarioId !== profile.id)
            };
          }
          return aviso;
        })
      );
      
      return true;
    } finally {
      setLoading(false);
    }
  };

  // Marcar aviso como lido pelo usuário atual
  const marcarComoLido = async (avisoId: string): Promise<void> => {
    if (!profile) {
      return;
    }

    try {
      // Em produção, chamaria a API
      await fetch(`/api/avisos/${avisoId}/visualizar`, {
        method: 'POST'
      });
      
      // Em desenvolvimento, apenas atualizamos a contagem de visualizações
      setAvisos(prevAvisos => 
        prevAvisos.map(aviso => {
          if (aviso.id === avisoId) {
            return {
              ...aviso,
              visualizacoes: aviso.visualizacoes + 1
            };
          }
          return aviso;
        })
      );
    } catch (err) {
      console.error('Erro ao marcar aviso como lido:', err);
    }
  };

  return (
    <AvisosContext.Provider
      value={{
        avisos,
        meusAvisos,
        loading,
        error,
        filtros,
        setFiltros,
        getAvisos,
        getAvisoById,
        createAviso,
        updateAviso,
        arquivarAviso,
        adicionarReacao,
        removerReacao,
        marcarComoLido
      }}
    >
      {children}
    </AvisosContext.Provider>
  );
}; 