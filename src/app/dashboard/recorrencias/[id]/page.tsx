'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRecorrencias } from '@/contexts/RecorrenciasContext';
import { StatusRecorrencia } from '@/types/recorrencias';
import {
  ArrowLeft,
  Calendar,
  RefreshCw,
  Package,
  User,
  Phone,
  FileText,
  Edit,
  AlertTriangle,
  CheckCircle,
  PauseCircle,
  XCircle,
  ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

export default function DetalhesRecorrenciaPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { obterRecorrenciaPorId, alterarStatusRecorrencia, loading } = useRecorrencias();

  const [recorrencia, setRecorrencia] = useState(obterRecorrenciaPorId(id));
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [acaoConfirmacao, setAcaoConfirmacao] = useState<'pausar' | 'reativar' | 'cancelar' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Buscar recorrência quando o ID mudar
  useEffect(() => {
    setRecorrencia(obterRecorrenciaPorId(id));
  }, [id, obterRecorrenciaPorId]);

  // Calcular valor total da recorrência
  const valorTotal = recorrencia?.produtos.reduce(
    (total, produto) => total + produto.preco * produto.quantidade,
    0
  ) || 0;

  // Formatar valor em reais
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Abrir modal de confirmação
  const abrirConfirmacao = (acao: 'pausar' | 'reativar' | 'cancelar') => {
    setAcaoConfirmacao(acao);
    setConfirmModalOpen(true);
  };

  // Executar ação após confirmação
  const confirmarAcao = async () => {
    if (!recorrencia || !acaoConfirmacao) return;

    setIsUpdating(true);

    try {
      let novoStatus: StatusRecorrencia;

      switch (acaoConfirmacao) {
        case 'pausar':
          novoStatus = StatusRecorrencia.PAUSADA;
          break;
        case 'reativar':
          novoStatus = StatusRecorrencia.ATIVA;
          break;
        case 'cancelar':
          novoStatus = StatusRecorrencia.CANCELADA;
          break;
      }

      const recorrenciaAtualizada = await alterarStatusRecorrencia(recorrencia.id, novoStatus);
      setRecorrencia(recorrenciaAtualizada);

      const mensagens = {
        pausar: 'Recorrência pausada com sucesso!',
        reativar: 'Recorrência reativada com sucesso!',
        cancelar: 'Recorrência cancelada com sucesso!'
      };

      toast({
        title: 'Sucesso',
        description: mensagens[acaoConfirmacao]
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar o status da recorrência.',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
      setConfirmModalOpen(false);
      setAcaoConfirmacao(null);
    }
  };

  if (!recorrencia && !loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertTriangle size={48} className="text-amber-500" />
        <h1 className="text-xl font-bold">Recorrência não encontrada</h1>
        <p className="text-gray-600">A recorrência que você está procurando não existe ou foi removida.</p>
        <Link
          href="/dashboard/recorrencias"
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar para a lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-0 sm:px-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/recorrencias"
          className="inline-flex items-center justify-center p-2 text-gray-600 bg-white rounded-md hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold">Detalhes da Recorrência</h1>
      </div>

      {loading ? (
        <div className="bg-white shadow-sm rounded-lg p-8 flex justify-center">
          <p className="text-gray-500">Carregando detalhes da recorrência...</p>
        </div>
      ) : recorrencia ? (
        <>
          {/* Status e Ações */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Status:</span>
                {recorrencia.status === StatusRecorrencia.ATIVA && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <RefreshCw size={12} className="mr-1" />
                    Ativa
                  </span>
                )}
                {recorrencia.status === StatusRecorrencia.PAUSADA && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    <PauseCircle size={12} className="mr-1" />
                    Pausada
                  </span>
                )}
                {recorrencia.status === StatusRecorrencia.CANCELADA && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle size={12} className="mr-1" />
                    Cancelada
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {recorrencia.status === StatusRecorrencia.ATIVA && (
                  <button
                    onClick={() => abrirConfirmacao('pausar')}
                    disabled={isUpdating}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-amber-600 bg-amber-50 rounded-md hover:bg-amber-100 disabled:opacity-50"
                  >
                    <PauseCircle size={16} className="mr-1" />
                    Pausar
                  </button>
                )}
                {recorrencia.status === StatusRecorrencia.PAUSADA && (
                  <button
                    onClick={() => abrirConfirmacao('reativar')}
                    disabled={isUpdating}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 disabled:opacity-50"
                  >
                    <CheckCircle size={16} className="mr-1" />
                    Reativar
                  </button>
                )}
                {recorrencia.status !== StatusRecorrencia.CANCELADA && (
                  <button
                    onClick={() => abrirConfirmacao('cancelar')}
                    disabled={isUpdating}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50"
                  >
                    <XCircle size={16} className="mr-1" />
                    Cancelar
                  </button>
                )}
                <Link
                  href={`/dashboard/recorrencias/${id}/editar`}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                >
                  <Edit size={16} className="mr-1" />
                  Editar
                </Link>
              </div>
            </div>
          </div>

          {/* Informações do Cliente */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Dados do Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <User size={18} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Nome</p>
                  <p className="text-gray-700">{recorrencia.nomeCliente}</p>
                </div>
              </div>
              <div className="flex items-start">
                <FileText size={18} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">CPF</p>
                  <p className="text-gray-700">{recorrencia.cpfCliente}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone size={18} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Telefone</p>
                  <p className="text-gray-700">{recorrencia.telefoneCliente}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Calendar size={18} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Data de Criação</p>
                  <p className="text-gray-700">{recorrencia.dataCriacao}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Informações da Recorrência */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Dados da Recorrência</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex items-center">
                <RefreshCw size={20} className="text-blue-500 mr-2" />
                <div>
                  <p className="font-medium">Intervalo</p>
                  <p className="text-gray-700">
                    {recorrencia.diasRecorrencia === 7 
                      ? "A cada 7 dias (semanal)" 
                      : recorrencia.diasRecorrencia === 15 
                      ? "A cada 15 dias (quinzenal)" 
                      : recorrencia.diasRecorrencia === 30 
                      ? "A cada 30 dias (mensal)"
                      : recorrencia.diasRecorrencia === 60
                      ? "A cada 60 dias (bimestral)"
                      : recorrencia.diasRecorrencia === 90
                      ? "A cada 90 dias (trimestral)"
                      : `A cada ${recorrencia.diasRecorrencia} dias (personalizado)`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar size={20} className="text-blue-500 mr-2" />
                <div>
                  <p className="font-medium">Próxima Entrega</p>
                  <p className="text-gray-700">{recorrencia.proximaData}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Produtos */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Produtos</h2>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Produto
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        EAN
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Quantidade
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Preço Unit.
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recorrencia.produtos.map((produto) => {
                      const subtotal = produto.quantidade * produto.preco;
                      return (
                        <tr key={produto.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <ShoppingBag size={16} className="text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">
                                {produto.titulo}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {produto.ean}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {produto.quantidade}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatarValor(produto.preco)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatarValor(subtotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                        Total:
                      </td>
                      <td className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                        {formatarValor(valorTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Observações */}
          {recorrencia.observacoes && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Observações</h2>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-gray-700">{recorrencia.observacoes}</p>
              </div>
            </div>
          )}

          {/* Modal de Confirmação */}
          {confirmModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
                <h2 className="mb-2 text-lg font-semibold">
                  {acaoConfirmacao === 'pausar'
                    ? 'Pausar Recorrência'
                    : acaoConfirmacao === 'reativar'
                    ? 'Reativar Recorrência'
                    : 'Cancelar Recorrência'}
                </h2>
                <p className="mb-4 text-gray-600">
                  {acaoConfirmacao === 'pausar'
                    ? 'Tem certeza que deseja pausar esta recorrência? Ela não será processada enquanto estiver pausada.'
                    : acaoConfirmacao === 'reativar'
                    ? 'Tem certeza que deseja reativar esta recorrência? Ela voltará a ser processada normalmente.'
                    : 'Tem certeza que deseja cancelar esta recorrência? Esta ação não pode ser desfeita.'}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={confirmarAcao}
                    disabled={isUpdating}
                    className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isUpdating ? 'Processando...' : 'Confirmar'}
                  </button>
                  <button
                    onClick={() => setConfirmModalOpen(false)}
                    disabled={isUpdating}
                    className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
} 