'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAvisos } from '@/contexts/AvisosContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  AvisoStatus, 
  AvisoPrioridade, 
  TipoDestinatario, 
  TipoReacao 
} from '@/types/avisos';
import { formatarData } from '@/utils/formatarData';
import { 
  Bell as BellIcon, 
  Plus as PlusIcon, 
  CheckCircle as CheckCircleIcon, 
  ThumbsUp as ThumbsUpIcon,
  Ban as BanIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  RefreshCw as RefreshCwIcon,
  Archive as ArchiveIcon,
  User as UserIcon,
  Users as UsersIcon,
  Globe as GlobeIcon
} from 'lucide-react';

export default function AvisosPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { 
    avisos,
    meusAvisos, 
    loading, 
    getAvisos, 
    adicionarReacao, 
    removerReacao,
    marcarComoLido,
    filtros,
    setFiltros 
  } = useAvisos();
  
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [prioridadeFiltro, setPrioridadeFiltro] = useState<string>('todas');
  const [busca, setBusca] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'todos' | 'meus'>('meus');
  const [dataLoaded, setDataLoaded] = useState(false);

  const avisosAtivos = selectedTab === 'meus' ? meusAvisos : avisos;

  // Carrega avisos apenas na montagem inicial do componente
  useEffect(() => {
    if (!dataLoaded) {
      const loadData = async () => {
        await getAvisos();
        setDataLoaded(true);
      };
      
      loadData();
    }
  }, [dataLoaded, getAvisos]);

  // Filtrar avisos com base nos critérios selecionados
  const avisosFiltrados = avisosAtivos.filter(aviso => {
    // Filtro de status
    if (statusFiltro !== 'todos' && aviso.status !== statusFiltro) {
      return false;
    }
    
    // Filtro de prioridade
    if (prioridadeFiltro !== 'todas' && aviso.prioridade !== prioridadeFiltro) {
      return false;
    }
    
    // Filtro de texto (busca)
    if (busca.trim() !== '') {
      const termoBusca = busca.toLowerCase();
      return (
        aviso.titulo.toLowerCase().includes(termoBusca) ||
        aviso.conteudo.toLowerCase().includes(termoBusca)
      );
    }
    
    return true;
  });

  // Função para reagir a um aviso
  const reagir = async (avisoId: string, tipo: TipoReacao) => {
    if (!profile) return;
    
    const reacaoExistente = aviso => {
      return aviso.reacoes.some(r => 
        r.usuarioId === profile.id && r.tipo === tipo
      );
    };
    
    const aviso = avisos.find(a => a.id === avisoId);
    
    if (aviso && reacaoExistente(aviso)) {
      await removerReacao(avisoId);
    } else {
      await adicionarReacao(avisoId, tipo);
    }
    
    // Atualizar avisos após reagir
    getAvisos(true); // força atualização
  };

  // Verificar se o usuário já reagiu a um aviso
  const verificarReacao = (avisoId: string, tipo: TipoReacao) => {
    if (!profile) return false;
    
    const aviso = avisos.find(a => a.id === avisoId);
    if (!aviso) return false;
    
    return aviso.reacoes.some(r => 
      r.usuarioId === profile.id && r.tipo === tipo
    );
  };

  // Contar reações por tipo
  const contarReacoes = (avisoId: string, tipo: TipoReacao) => {
    const aviso = avisos.find(a => a.id === avisoId);
    if (!aviso) return 0;
    
    return aviso.reacoes.filter(r => r.tipo === tipo).length;
  };

  // Ver detalhes de um aviso
  const verAviso = (avisoId: string) => {
    marcarComoLido(avisoId);
    router.push(`/dashboard/avisos/${avisoId}`);
  };

  // Função para atualizar avisos manualmente
  const atualizarAvisos = () => {
    getAvisos(true); // força atualização ignorando cache
  };

  // Exibir ícone do tipo de destinatário
  const getDestinatarioIcon = (tipo: TipoDestinatario) => {
    switch (tipo) {
      case TipoDestinatario.TODOS:
        return <GlobeIcon className="h-4 w-4" />;
      case TipoDestinatario.GRUPO:
        return <UsersIcon className="h-4 w-4" />;
      case TipoDestinatario.USUARIOS:
        return <UserIcon className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  // Exibir cor da prioridade
  const getPrioridadeColor = (prioridade: AvisoPrioridade) => {
    switch (prioridade) {
      case AvisoPrioridade.BAIXA:
        return "bg-green-100 text-green-800";
      case AvisoPrioridade.NORMAL:
        return "bg-blue-100 text-blue-800";
      case AvisoPrioridade.ALTA:
        return "bg-orange-100 text-orange-800";
      case AvisoPrioridade.URGENTE:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avisos e Comunicados</h1>
          <p className="text-muted-foreground">
            Fique por dentro das informações importantes da empresa
          </p>
        </div>
        
        {profile && (profile.role === 'admin' || profile.role === 'gerente') && (
          <button 
            onClick={() => router.push('/dashboard/avisos/novo')}
            className="flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" /> Novo Aviso
          </button>
        )}
      </div>
      
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setSelectedTab('meus')}
            className={`px-3 py-2 text-sm font-medium ${
              selectedTab === 'meus'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Meus Avisos
          </button>
          {(profile?.role === 'admin' || profile?.role === 'gerente') && (
            <button
              onClick={() => setSelectedTab('todos')}
              className={`px-3 py-2 text-sm font-medium ${
                selectedTab === 'todos'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Todos os Avisos
            </button>
          )}
        </nav>
      </div>
      
      <div className="flex flex-col space-y-4 mt-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar avisos..."
              className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          
          <select
            className="rounded-md border border-gray-300 px-3 py-2"
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
          >
            <option value="todos">Todos os status</option>
            <option value={AvisoStatus.ATIVO}>Ativos</option>
            <option value={AvisoStatus.ARQUIVADO}>Arquivados</option>
          </select>
          
          <select
            className="rounded-md border border-gray-300 px-3 py-2"
            value={prioridadeFiltro}
            onChange={(e) => setPrioridadeFiltro(e.target.value)}
          >
            <option value="todas">Todas as prioridades</option>
            <option value={AvisoPrioridade.BAIXA}>Baixa</option>
            <option value={AvisoPrioridade.NORMAL}>Normal</option>
            <option value={AvisoPrioridade.ALTA}>Alta</option>
            <option value={AvisoPrioridade.URGENTE}>Urgente</option>
          </select>
          
          <button 
            onClick={atualizarAvisos}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" /> Atualizar
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {avisosFiltrados.length === 0 ? (
              <div className="text-center p-8 bg-gray-100 rounded-lg">
                <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">Nenhum aviso encontrado</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Não há avisos que correspondam aos critérios de filtro selecionados.
                </p>
              </div>
            ) : (
              avisosFiltrados.map((aviso) => (
                <div key={aviso.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border border-gray-300">
                          {getDestinatarioIcon(aviso.tipoDestinatario)}
                          <span className="ml-1">
                            {aviso.tipoDestinatario === TipoDestinatario.TODOS ? 'Todos' : 
                             aviso.tipoDestinatario === TipoDestinatario.GRUPO ? 'Grupo' : 'Usuários selecionados'}
                          </span>
                        </span>
                        
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(aviso.prioridade)}`}>
                          {aviso.prioridade === AvisoPrioridade.BAIXA && 'Baixa'}
                          {aviso.prioridade === AvisoPrioridade.NORMAL && 'Normal'}
                          {aviso.prioridade === AvisoPrioridade.ALTA && 'Alta'}
                          {aviso.prioridade === AvisoPrioridade.URGENTE && 'Urgente'}
                        </span>
                        
                        {aviso.status === AvisoStatus.ARQUIVADO && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <ArchiveIcon className="h-3 w-3 mr-1" /> Arquivado
                          </span>
                        )}
                      </div>
                      
                      <h3 
                        className="text-lg font-medium cursor-pointer hover:text-blue-600 transition-colors" 
                        onClick={() => verAviso(aviso.id)}
                      >
                        {aviso.titulo}
                      </h3>
                      
                      <p className="text-sm text-gray-500 mt-1">
                        Publicado em {formatarData(aviso.dataPublicacao)} • {aviso.visualizacoes} visualizações
                      </p>
                    </div>
                  </div>
                  
                  <p className="mt-4 line-clamp-2 text-sm">
                    {aviso.conteudo}
                  </p>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button 
                        className={`flex items-center px-2 py-1 text-xs font-medium rounded-md ${
                          verificarReacao(aviso.id, TipoReacao.VERIFICADO) 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                        onClick={() => reagir(aviso.id, TipoReacao.VERIFICADO)}
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        {contarReacoes(aviso.id, TipoReacao.VERIFICADO)}
                      </button>
                      
                      <button 
                        className={`flex items-center px-2 py-1 text-xs font-medium rounded-md ${
                          verificarReacao(aviso.id, TipoReacao.CONCORDAR) 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                        onClick={() => reagir(aviso.id, TipoReacao.CONCORDAR)}
                      >
                        <ThumbsUpIcon className="h-4 w-4 mr-1" />
                        {contarReacoes(aviso.id, TipoReacao.CONCORDAR)}
                      </button>
                    </div>
                    
                    <button 
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => verAviso(aviso.id)}
                    >
                      Ver detalhes
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
} 