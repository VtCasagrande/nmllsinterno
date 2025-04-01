'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAvisos } from '@/contexts/AvisosContext';
import { useAuth } from '@/contexts/AuthContext';
import { Aviso, AvisoStatus, AvisoPrioridade, TipoReacao } from '@/types/avisos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  BellRing, 
  Calendar, 
  Clock, 
  Users, 
  User, 
  ThumbsUp, 
  CheckCircle, 
  AlertTriangle, 
  PartyPopper, 
  Check,
  Archive,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PageProps {
  params: {
    id: string;
  };
}

export default function AvisoDetalhesPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const { getAvisoById, adicionarReacao, removerReacao, arquivarAviso, marcarComoLido } = useAvisos();
  const { profile } = useAuth();
  
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atualizandoAviso, setAtualizandoAviso] = useState(false);
  
  // Carregar aviso
  useEffect(() => {
    const loadAviso = async () => {
      try {
        setIsLoading(true);
        const avisoData = await getAvisoById(id);
        
        if (avisoData) {
          setAviso(avisoData);
          // Marcar como visualizado
          await marcarComoLido(id);
        } else {
          setError('Aviso não encontrado');
        }
      } catch (err) {
        console.error('Erro ao carregar aviso:', err);
        setError('Erro ao carregar aviso');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAviso();
  }, [id, getAvisoById, marcarComoLido]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };
  
  const getPrioridadeBadge = (prioridade: AvisoPrioridade) => {
    switch (prioridade) {
      case AvisoPrioridade.BAIXA:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Baixa
          </span>
        );
      case AvisoPrioridade.NORMAL:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            Normal
          </span>
        );
      case AvisoPrioridade.ALTA:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Alta
          </span>
        );
      case AvisoPrioridade.URGENTE:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Urgente
          </span>
        );
      default:
        return <span>{prioridade}</span>;
    }
  };
  
  const getReacaoIcon = (tipo: TipoReacao) => {
    switch (tipo) {
      case TipoReacao.CURTIR:
        return <ThumbsUp className="w-5 h-5" />;
      case TipoReacao.CONCORDAR:
        return <CheckCircle className="w-5 h-5" />;
      case TipoReacao.VERIFICADO:
        return <Check className="w-5 h-5" />;
      case TipoReacao.IMPORTANTE:
        return <AlertTriangle className="w-5 h-5" />;
      case TipoReacao.CELEBRAR:
        return <PartyPopper className="w-5 h-5" />;
      default:
        return <ThumbsUp className="w-5 h-5" />;
    }
  };
  
  const getReacaoText = (tipo: TipoReacao) => {
    switch (tipo) {
      case TipoReacao.CURTIR:
        return 'Curtir';
      case TipoReacao.CONCORDAR:
        return 'Concordar';
      case TipoReacao.VERIFICADO:
        return 'Verificado';
      case TipoReacao.IMPORTANTE:
        return 'Importante';
      case TipoReacao.CELEBRAR:
        return 'Celebrar';
      default:
        return 'Desconhecido';
    }
  };
  
  const getReacoesCount = (aviso: Aviso) => {
    const counts: { [key: string]: number } = {};
    
    aviso.reacoes.forEach(reacao => {
      counts[reacao.tipo] = (counts[reacao.tipo] || 0) + 1;
    });
    
    return counts;
  };
  
  const userHasReacted = (tipo?: TipoReacao) => {
    if (!profile || !aviso) return false;
    
    const reacao = aviso.reacoes.find(r => r.usuarioId === profile.id);
    
    if (!tipo) return !!reacao;
    
    return reacao?.tipo === tipo;
  };
  
  const getUserReaction = () => {
    if (!profile || !aviso) return null;
    
    return aviso.reacoes.find(r => r.usuarioId === profile.id);
  };
  
  const handleReacao = async (tipoReacao: TipoReacao) => {
    if (!aviso) return;
    
    try {
      setAtualizandoAviso(true);
      const userReacao = getUserReaction();
      
      if (userReacao && userReacao.tipo === tipoReacao) {
        // Se já reagiu com esse tipo, remove a reação
        await removerReacao(aviso.id);
        
        // Atualiza o estado local
        const updatedReacoes = aviso.reacoes.filter(r => r.usuarioId !== profile?.id);
        setAviso({
          ...aviso,
          reacoes: updatedReacoes
        });
        
        toast.success('Reação removida');
      } else {
        // Adiciona ou substitui a reação
        const novaReacao = await adicionarReacao(aviso.id, tipoReacao);
        
        // Atualiza o estado local
        let updatedReacoes = [...aviso.reacoes];
        if (userReacao) {
          // Substitui a reação existente
          updatedReacoes = updatedReacoes.filter(r => r.usuarioId !== profile?.id);
        }
        updatedReacoes.push(novaReacao);
        
        setAviso({
          ...aviso,
          reacoes: updatedReacoes
        });
        
        toast.success(userReacao ? 'Reação atualizada' : 'Reação adicionada');
      }
    } catch (error) {
      console.error('Erro ao reagir:', error);
      toast.error('Erro ao processar sua reação');
    } finally {
      setAtualizandoAviso(false);
    }
  };
  
  const handleArquivar = async () => {
    if (!aviso) return;
    
    try {
      setAtualizandoAviso(true);
      await arquivarAviso(aviso.id);
      
      // Atualiza o estado local
      setAviso({
        ...aviso,
        status: AvisoStatus.ARQUIVADO
      });
      
      toast.success('Aviso arquivado com sucesso');
    } catch (error) {
      console.error('Erro ao arquivar aviso:', error);
      toast.error('Erro ao arquivar aviso');
    } finally {
      setAtualizandoAviso(false);
    }
  };
  
  // Renderização condicional durante carregamento
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Renderização para erros
  if (error || !aviso) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-800 mb-2">
          {error || 'Aviso não encontrado'}
        </h2>
        <p className="text-red-600 mb-4">
          Não foi possível carregar o aviso solicitado.
        </p>
        <Link href="/dashboard/avisos" className="text-blue-600 hover:text-blue-800">
          Voltar para lista de avisos
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard/avisos" className="text-blue-600 hover:text-blue-800">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">Detalhes do Aviso</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Cabeçalho do aviso */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-start space-x-3">
              <BellRing className="w-6 h-6 text-blue-500 mt-1" />
              <div>
                <h2 className="text-xl font-semibold">{aviso.titulo}</h2>
                <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1 gap-4">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(aviso.dataPublicacao)}
                  </span>
                  <span className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    Admin
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {aviso.visualizacoes} visualizações
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getPrioridadeBadge(aviso.prioridade)}
              {aviso.status === AvisoStatus.ARQUIVADO && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                  <Archive className="w-3 h-3 mr-1" />
                  Arquivado
                </span>
              )}
            </div>
          </div>
          
          {aviso.dataExpiracao && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Expira em:</span> {formatDate(aviso.dataExpiracao)}
            </div>
          )}
          
          {/* Destinatários */}
          <div className="mt-3 text-sm">
            <span className="font-medium text-gray-700 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Destinatários:
            </span>
            <div className="mt-1 pl-5">
              {aviso.tipoDestinatario === 'TODOS' ? (
                <span className="text-gray-600">Todos os usuários</span>
              ) : aviso.tipoDestinatario === 'GRUPO' ? (
                <div className="flex flex-wrap gap-1">
                  {(aviso.grupos || []).map((grupo) => (
                    <span 
                      key={grupo} 
                      className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-full"
                    >
                      {grupo === 'motoristas' ? 'Motoristas' :
                       grupo === 'operadores' ? 'Operadores' :
                       grupo === 'gerentes' ? 'Gerentes' :
                       grupo === 'admins' ? 'Administradores' : grupo}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-600">Usuários específicos</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Conteúdo do aviso */}
        <div className="p-6 whitespace-pre-wrap">
          {aviso.conteudo}
        </div>
        
        {/* Reações e ações */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Reações</h3>
              <div className="flex flex-wrap gap-2">
                {Object.keys(TipoReacao).map((tipo) => {
                  const tipoValue = TipoReacao[tipo as keyof typeof TipoReacao];
                  const count = aviso.reacoes.filter(r => r.tipo === tipoValue).length;
                  const hasReacted = userHasReacted(tipoValue);
                  
                  return count > 0 || (profile && !atualizandoAviso) ? (
                    <button
                      key={tipo}
                      onClick={() => profile && !atualizandoAviso && handleReacao(tipoValue)}
                      disabled={!profile || atualizandoAviso}
                      className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full ${
                        hasReacted
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
                          : count > 0
                            ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {getReacaoIcon(tipoValue)}
                      <span className="ml-1.5">{count > 0 ? `${count} ${getReacaoText(tipoValue)}` : getReacaoText(tipoValue)}</span>
                    </button>
                  ) : null;
                })}
                
                {atualizandoAviso && (
                  <span className="inline-flex items-center text-gray-500 ml-2">
                    <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-blue-500 rounded-full"></span>
                    Atualizando...
                  </span>
                )}
              </div>
            </div>
            
            {/* Permitir arquivamento apenas para avisos ativos */}
            {aviso.status === AvisoStatus.ATIVO && (
              <button
                onClick={handleArquivar}
                disabled={atualizandoAviso}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Archive className="w-4 h-4 mr-2" />
                Arquivar
              </button>
            )}
          </div>
          
          {/* Lista de pessoas que reagiram */}
          {aviso.reacoes.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Quem reagiu</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reação
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {aviso.reacoes.map((reacao) => (
                      <tr key={reacao.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{reacao.usuarioNome}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getReacaoIcon(reacao.tipo)}
                            <span className="ml-1.5">{getReacaoText(reacao.tipo)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(reacao.dataCriacao)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 