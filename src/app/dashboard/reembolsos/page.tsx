'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useReembolsos } from '@/contexts/ReembolsosContext';
import { Reembolso, ReembolsoStatus, ReembolsoPrioridade } from '@/types/reembolsos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Clock, Search, AlertCircle, Plus, Filter, Eye, Edit, X, RefreshCw, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ReembolsosPage() {
  const { reembolsos, getReembolsos, updateReembolsoStatus, loading, error } = useReembolsos();
  const [filteredReembolsos, setFilteredReembolsos] = useState<Reembolso[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    prioridade: '',
    dataInicio: '',
    dataFim: '',
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [quicklookReembolso, setQuicklookReembolso] = useState<Reembolso | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);

  useEffect(() => {
    if (!dataLoaded) {
      const loadReembolsos = async () => {
        try {
          await getReembolsos();
          setDataLoaded(true);
        } catch (err) {
          console.error('Erro ao carregar reembolsos:', err);
          setDataLoaded(true);
        }
      };

      loadReembolsos();
    }
  }, [getReembolsos, dataLoaded]);

  useEffect(() => {
    if (!reembolsos) return;

    let filtered = [...reembolsos];

    // Aplicar filtros
    if (filters.status) {
      filtered = filtered.filter((reembolso) => reembolso.status === filters.status);
    }

    if (filters.prioridade) {
      filtered = filtered.filter((reembolso) => reembolso.prioridade === filters.prioridade);
    }

    if (filters.dataInicio) {
      const dataInicio = new Date(filters.dataInicio);
      filtered = filtered.filter(
        (reembolso) => new Date(reembolso.dataCriacao) >= dataInicio
      );
    }

    if (filters.dataFim) {
      const dataFim = new Date(filters.dataFim);
      dataFim.setHours(23, 59, 59);
      filtered = filtered.filter(
        (reembolso) => new Date(reembolso.dataCriacao) <= dataFim
      );
    }

    // Aplicar busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (reembolso) =>
          reembolso.nomeCliente.toLowerCase().includes(term) ||
          reembolso.numeroPedidoTiny.toLowerCase().includes(term) ||
          reembolso.responsavelReembolso.toLowerCase().includes(term) ||
          reembolso.telefoneCliente.toLowerCase().includes(term)
      );
    }

    setFilteredReembolsos(filtered);
  }, [reembolsos, searchTerm, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      prioridade: '',
      dataInicio: '',
      dataFim: '',
    });
    setSearchTerm('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Transforma o status no formato de visualização para o usuário
  const formatarStatus = (status: ReembolsoStatus): string => {
    switch (status) {
      case ReembolsoStatus.EM_ANALISE:
        return 'Em Análise';
      case ReembolsoStatus.APROVADO:
        return 'Aprovado';
      case ReembolsoStatus.PAGO:
        return 'Pago';
      case ReembolsoStatus.CANCELADO:
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Formata a prioridade para exibição
  const formatarPrioridade = (prioridade: ReembolsoPrioridade): string => {
    switch (prioridade) {
      case ReembolsoPrioridade.BAIXA:
        return 'Baixa';
      case ReembolsoPrioridade.MEDIA:
        return 'Média';
      case ReembolsoPrioridade.ALTA:
        return 'Alta';
      case ReembolsoPrioridade.URGENTE:
        return 'Urgente';
      default:
        return prioridade;
    }
  };

  const getStatusBadge = (status: ReembolsoStatus) => {
    switch (status) {
      case ReembolsoStatus.EM_ANALISE:
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            {formatarStatus(status)}
          </span>
        );
      case ReembolsoStatus.APROVADO:
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <Check className="w-3 h-3 mr-1" />
            {formatarStatus(status)}
          </span>
        );
      case ReembolsoStatus.PAGO:
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <DollarSign className="w-3 h-3 mr-1" />
            {formatarStatus(status)}
          </span>
        );
      case ReembolsoStatus.CANCELADO:
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            {formatarStatus(status)}
          </span>
        );
      default:
        return <span>{formatarStatus(status)}</span>;
    }
  };

  const getPrioridadeBadge = (prioridade: ReembolsoPrioridade) => {
    switch (prioridade) {
      case ReembolsoPrioridade.BAIXA:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {formatarPrioridade(prioridade)}
          </span>
        );
      case ReembolsoPrioridade.MEDIA:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            {formatarPrioridade(prioridade)}
          </span>
        );
      case ReembolsoPrioridade.ALTA:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
            {formatarPrioridade(prioridade)}
          </span>
        );
      case ReembolsoPrioridade.URGENTE:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            {formatarPrioridade(prioridade)}
          </span>
        );
      default:
        return <span>{formatarPrioridade(prioridade)}</span>;
    }
  };

  const handleQuicklook = (reembolso: Reembolso) => {
    setQuicklookReembolso(reembolso);
  };

  const closeQuicklook = () => {
    setQuicklookReembolso(null);
  };

  const handleAprovar = async (id: string) => {
    try {
      setAtualizando(true);
      setAtualizandoId(id);
      await updateReembolsoStatus(id, ReembolsoStatus.APROVADO);
      toast.success('Reembolso aprovado com sucesso!');
    } catch (error) {
      console.error('Erro ao aprovar reembolso:', error);
      toast.error('Erro ao aprovar reembolso');
    } finally {
      setAtualizando(false);
      setAtualizandoId(null);
      closeQuicklook();
    }
  };

  const handlePagar = async (id: string) => {
    try {
      setAtualizando(true);
      setAtualizandoId(id);
      await updateReembolsoStatus(id, ReembolsoStatus.PAGO);
      toast.success('Reembolso marcado como pago com sucesso!');
    } catch (error) {
      console.error('Erro ao pagar reembolso:', error);
      toast.error('Erro ao pagar reembolso');
    } finally {
      setAtualizando(false);
      setAtualizandoId(null);
      closeQuicklook();
    }
  };

  const handleCancelar = async (id: string) => {
    try {
      setAtualizando(true);
      setAtualizandoId(id);
      await updateReembolsoStatus(id, ReembolsoStatus.CANCELADO);
      toast.success('Reembolso cancelado com sucesso!');
    } catch (error) {
      console.error('Erro ao cancelar reembolso:', error);
      toast.error('Erro ao cancelar reembolso');
    } finally {
      setAtualizando(false);
      setAtualizandoId(null);
      closeQuicklook();
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reembolsos</h1>
        <Link
          href="/dashboard/reembolsos/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Reembolso
        </Link>
      </div>

      {/* Navegação rápida por status */}
      <div className="flex mb-6 space-x-4 overflow-x-auto pb-2">
        <button
          onClick={() => setFilters(prev => ({ ...prev, status: '' }))}
          className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
            filters.status === '' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilters(prev => ({ ...prev, status: ReembolsoStatus.EM_ANALISE }))}
          className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
            filters.status === ReembolsoStatus.EM_ANALISE 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Em Análise
        </button>
        <button
          onClick={() => setFilters(prev => ({ ...prev, status: ReembolsoStatus.APROVADO }))}
          className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
            filters.status === ReembolsoStatus.APROVADO 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Aprovados
        </button>
        <button
          onClick={() => setFilters(prev => ({ ...prev, status: ReembolsoStatus.PAGO }))}
          className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
            filters.status === ReembolsoStatus.PAGO 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pagos
        </button>
        <button
          onClick={() => setFilters(prev => ({ ...prev, status: ReembolsoStatus.CANCELADO }))}
          className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
            filters.status === ReembolsoStatus.CANCELADO 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Cancelados
        </button>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome do cliente, número do pedido, responsável..."
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-md flex items-center ${
              Object.values(filters).some(val => val !== '')
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Filter className="h-5 w-5 mr-1" />
            Filtros
            {Object.values(filters).some(val => val !== '') && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-white text-blue-600 rounded-full">
                {Object.values(filters).filter(val => val !== '').length}
              </span>
            )}
          </button>
          <button
            onClick={() => getReembolsos()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Painel de filtros */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white border rounded-md shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Filtros avançados</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Limpar filtros
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Todos</option>
                  <option value={ReembolsoStatus.EM_ANALISE}>Em Análise</option>
                  <option value={ReembolsoStatus.APROVADO}>Aprovado</option>
                  <option value={ReembolsoStatus.PAGO}>Pago</option>
                  <option value={ReembolsoStatus.CANCELADO}>Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Prioridade</label>
                <select
                  name="prioridade"
                  value={filters.prioridade}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Todas</option>
                  <option value={ReembolsoPrioridade.BAIXA}>Baixa</option>
                  <option value={ReembolsoPrioridade.MEDIA}>Média</option>
                  <option value={ReembolsoPrioridade.ALTA}>Alta</option>
                  <option value={ReembolsoPrioridade.URGENTE}>Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Data Início</label>
                <input
                  type="date"
                  name="dataInicio"
                  value={filters.dataInicio}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Data Fim</label>
                <input
                  type="date"
                  name="dataFim"
                  value={filters.dataFim}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && !dataLoaded ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button
            onClick={() => getReembolsos()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      ) : filteredReembolsos.length === 0 ? (
        <div className="text-center my-12">
          <p className="text-gray-500 mb-4">Nenhum reembolso encontrado</p>
          <Link
            href="/dashboard/reembolsos/novo"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Reembolso
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReembolsos.map((reembolso) => (
                <tr key={reembolso.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {reembolso.numeroPedidoTiny}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reembolso.nomeCliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(reembolso.valorReembolso)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getStatusBadge(reembolso.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getPrioridadeBadge(reembolso.prioridade)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(reembolso.dataCriacao)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleQuicklook(reembolso)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Visualizar detalhes"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <Link
                        href={`/dashboard/reembolsos/${reembolso.id}`}
                        className="text-green-600 hover:text-green-900"
                        title="Editar reembolso"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de visualização rápida */}
      {quicklookReembolso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium">Detalhes do Reembolso</h3>
              <button onClick={closeQuicklook} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Número do Pedido</p>
                  <p className="font-medium">{quicklookReembolso.numeroPedidoTiny}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(quicklookReembolso.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data do Pedido</p>
                  <p className="font-medium">{formatDate(quicklookReembolso.dataPedido)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status do Pedido no TINY</p>
                  <p className="font-medium">{quicklookReembolso.statusPedidoTiny}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nome do Cliente</p>
                  <p className="font-medium">{quicklookReembolso.nomeCliente}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium">{quicklookReembolso.telefoneCliente}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Responsável</p>
                  <p className="font-medium">{quicklookReembolso.responsavelReembolso}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Prioridade</p>
                  <div className="mt-1">{getPrioridadeBadge(quicklookReembolso.prioridade)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Forma de Pagamento</p>
                  <p className="font-medium">{quicklookReembolso.formaPagamento}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data de Criação</p>
                  <p className="font-medium">{formatDate(quicklookReembolso.dataCriacao)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valor do Pedido Total</p>
                  <p className="font-medium">{formatCurrency(quicklookReembolso.valorPedidoTotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valor do Reembolso</p>
                  <p className="font-medium">{formatCurrency(quicklookReembolso.valorReembolso)}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Motivo do Reembolso</p>
                <p className="bg-gray-50 p-3 rounded-md">{quicklookReembolso.motivoReembolso}</p>
              </div>

              {quicklookReembolso.observacao && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-1">Observações</p>
                  <p className="bg-gray-50 p-3 rounded-md">{quicklookReembolso.observacao}</p>
                </div>
              )}
            </div>
            <div className="border-t px-6 py-4 flex justify-end gap-2">
              {quicklookReembolso.status === ReembolsoStatus.EM_ANALISE && (
                <>
                  <button
                    onClick={() => handleAprovar(quicklookReembolso.id)}
                    disabled={atualizando}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {atualizando && atualizandoId === quicklookReembolso.id ? 'Processando...' : 'Aprovar'}
                  </button>
                  <button
                    onClick={() => handleCancelar(quicklookReembolso.id)}
                    disabled={atualizando}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {atualizando && atualizandoId === quicklookReembolso.id ? 'Processando...' : 'Cancelar'}
                  </button>
                </>
              )}
              {quicklookReembolso.status === ReembolsoStatus.APROVADO && (
                <button
                  onClick={() => handlePagar(quicklookReembolso.id)}
                  disabled={atualizando}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {atualizando && atualizandoId === quicklookReembolso.id ? 'Processando...' : 'Marcar como Pago'}
                </button>
              )}
              <Link
                href={`/dashboard/reembolsos/${quicklookReembolso.id}`}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Ver Detalhes
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 