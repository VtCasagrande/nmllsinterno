'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTrocas } from '@/contexts/TrocasContext';
import { Troca, TrocaStatus, TrocaTipo, TrocaUpdate } from '@/types/trocas';
import Link from 'next/link';
import { ArrowLeft, Check, Clock, Edit, Truck, AlertCircle, Repeat, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DetalheTrocaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { getTrocaById, updateTroca, updateTrocaStatus, addComentario, loading, error } = useTrocas();
  const [troca, setTroca] = useState<Troca | null>(null);
  const [atualizando, setAtualizando] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [comentario, setComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);

  useEffect(() => {
    if (!dataLoaded) {
      const carregarTroca = async () => {
        try {
          const dadosTroca = await getTrocaById(params.id);
          if (dadosTroca) {
            setTroca(dadosTroca);
          } else {
            // Troca não encontrada
            router.push('/dashboard/trocas');
          }
        } catch (err) {
          console.error('Erro ao carregar troca:', err);
        } finally {
          setLoading(false);
          setDataLoaded(true);
        }
      };

      carregarTroca();
    }
  }, [params.id, getTrocaById, router, dataLoaded]);

  const handleFinalizar = async () => {
    if (!troca) return;
    
    setAtualizandoStatus(true);
    try {
      await updateTrocaStatus(troca.id, TrocaStatus.FINALIZADA);
      toast.success('Troca finalizada com sucesso!');
      // Atualizar a troca local
      setTroca(prev => prev ? { ...prev, status: TrocaStatus.FINALIZADA } : null);
    } catch (error) {
      console.error('Erro ao finalizar troca:', error);
      toast.error('Erro ao finalizar troca');
    } finally {
      setAtualizandoStatus(false);
    }
  };

  const handleCancelar = async () => {
    if (!troca) return;
    
    setAtualizandoStatus(true);
    try {
      await updateTrocaStatus(troca.id, TrocaStatus.CANCELADA);
      toast.success('Troca cancelada com sucesso!');
      // Atualizar a troca local
      setTroca(prev => prev ? { ...prev, status: TrocaStatus.CANCELADA } : null);
    } catch (error) {
      console.error('Erro ao cancelar troca:', error);
      toast.error('Erro ao cancelar troca');
    } finally {
      setAtualizandoStatus(false);
    }
  };

  // Função para obter o ícone do status
  const getStatusIcon = (status: TrocaStatus) => {
    switch (status) {
      case TrocaStatus.AGUARDANDO_DEVOLUCAO:
        return <Clock className="w-6 h-6 text-orange-500" />;
      case TrocaStatus.COLETADO:
        return <Truck className="w-6 h-6 text-blue-500" />;
      case TrocaStatus.FINALIZADA:
        return <Check className="w-6 h-6 text-green-700" />;
      case TrocaStatus.CANCELADA:
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  // Função para obter o rótulo do status
  const getStatusLabel = (status: TrocaStatus) => {
    switch (status) {
      case TrocaStatus.AGUARDANDO_DEVOLUCAO:
        return 'Aguardando Devolução';
      case TrocaStatus.COLETADO:
        return 'Coletado';
      case TrocaStatus.FINALIZADA:
        return 'Finalizado';
      case TrocaStatus.CANCELADA:
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Renderizar botões de ação com base no tipo e status da troca
  const renderAcoes = () => {
    if (!troca) return null;
    
    // Se a troca já estiver finalizada ou cancelada, não mostrar botões
    if (troca.status === TrocaStatus.FINALIZADA || troca.status === TrocaStatus.CANCELADA) {
      return (
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <p className="text-gray-700">
            Esta troca já foi {troca.status === TrocaStatus.FINALIZADA ? 'finalizada' : 'cancelada'}.
          </p>
        </div>
      );
    }
    
    // Se for uma troca enviada e estiver aguardando devolução
    if (troca.tipo === TrocaTipo.ENVIADA && troca.status === TrocaStatus.AGUARDANDO_DEVOLUCAO) {
      return (
        <div className="mt-4 flex space-x-4">
          <button
            onClick={handleFinalizar}
            disabled={atualizandoStatus}
            className="bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-800 flex items-center justify-center"
          >
            {atualizandoStatus ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <Check className="w-5 h-5 mr-2" />
            )}
            Finalizar
          </button>
          <button
            onClick={handleCancelar}
            disabled={atualizandoStatus}
            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center justify-center"
          >
            {atualizandoStatus ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <X className="w-5 h-5 mr-2" />
            )}
            Cancelar
          </button>
        </div>
      );
    }
    
    // Se for uma troca recebida e estiver coletada
    if (troca.tipo === TrocaTipo.RECEBIDA && troca.status === TrocaStatus.COLETADO) {
      return (
        <div className="mt-4 flex space-x-4">
          <button
            onClick={handleFinalizar}
            disabled={atualizandoStatus}
            className="bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-800 flex items-center justify-center"
          >
            {atualizandoStatus ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <Check className="w-5 h-5 mr-2" />
            )}
            Finalizar
          </button>
          <button
            onClick={handleCancelar}
            disabled={atualizandoStatus}
            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center justify-center"
          >
            {atualizandoStatus ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <X className="w-5 h-5 mr-2" />
            )}
            Cancelar
          </button>
        </div>
      );
    }
    
    return null;
  };

  // Formatação de data
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(data);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!troca) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Erro!</strong>
        <span className="block sm:inline"> Troca não encontrada</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/trocas" className="text-blue-600 hover:text-blue-800 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Detalhes da Troca</h1>
        <Link
          href={`/dashboard/trocas/${troca.id}/editar`}
          className="ml-auto text-blue-600 hover:text-blue-800 flex items-center"
        >
          <Edit className="w-5 h-5 mr-1" />
          Editar
        </Link>
      </div>

      {(updateError || error) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {updateError || error}</span>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Cabeçalho com status */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              <Repeat className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h2 className="text-xl font-semibold">{troca.nomeProduto}</h2>
                <p className="text-gray-600">EAN: {troca.ean}</p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center">
              {getStatusIcon(troca.status)}
              <span
                className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${
                  troca.status === TrocaStatus.AGUARDANDO_DEVOLUCAO
                    ? 'bg-orange-100 text-orange-800'
                    : troca.status === TrocaStatus.COLETADO
                    ? 'bg-blue-100 text-blue-800'
                    : troca.status === TrocaStatus.FINALIZADA
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {getStatusLabel(troca.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Detalhes da troca */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Informações do Produto</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nome do Produto</p>
                <p className="font-medium">{troca.nomeProduto}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Código EAN</p>
                <p className="font-medium">{troca.ean}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quantidade</p>
                <p className="font-medium">{troca.quantidade}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de Troca</p>
                <p className="font-medium">
                  {troca.tipo === TrocaTipo.ENVIADA ? 'Enviada para outra loja' : 'Recebida de outra loja'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Loja Parceira</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nome da Loja</p>
                <p className="font-medium">{troca.lojaParceira}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Responsável</p>
                <p className="font-medium">{troca.responsavel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefone</p>
                <p className="font-medium">{troca.telefoneResponsavel}</p>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Detalhes</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Motivo da Troca</p>
                <p className="font-medium">{troca.motivo}</p>
              </div>
              {troca.observacoes && (
                <div>
                  <p className="text-sm text-gray-500">Observações</p>
                  <p className="font-medium whitespace-pre-line">{troca.observacoes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Datas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Data de Criação</p>
                <p className="font-medium">{formatarData(troca.dataCriacao)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Última Atualização</p>
                <p className="font-medium">{formatarData(troca.dataAtualizacao)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ações disponíveis */}
        <div className="border-t border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Ações</h3>
          {renderAcoes()}
        </div>
      </div>
    </div>
  );
} 