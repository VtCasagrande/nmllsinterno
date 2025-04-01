'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTrocas } from '@/contexts/TrocasContext';
import { Troca, TrocaStatus, TrocaTipo, TrocaUpdate } from '@/types/trocas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Clock, Search, Truck, AlertCircle, Plus, Filter, Eye, Edit, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function TrocasPage() {
  const { trocas, getTrocas, updateTroca, updateTrocaStatus, loading, error } = useTrocas();
  const [filteredTrocas, setFilteredTrocas] = useState<Troca[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tipo: '',
    status: '',
    dataInicio: '',
    dataFim: '',
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [quicklookTroca, setQuicklookTroca] = useState<Troca | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);

  useEffect(() => {
    if (!dataLoaded) {
      const loadTrocas = async () => {
        try {
          await getTrocas();
          setDataLoaded(true);
        } catch (err) {
          console.error('Erro ao carregar trocas:', err);
          setDataLoaded(true);
        }
      };

      loadTrocas();
    }
  }, [getTrocas, dataLoaded]);

  useEffect(() => {
    if (!trocas) return;

    console.log('Trocas disponíveis:', trocas);
    console.log('Filtro tipo atual:', filters.tipo);
    console.log('Valor TrocaTipo.ENVIADA:', TrocaTipo.ENVIADA);
    console.log('Valor TrocaTipo.RECEBIDA:', TrocaTipo.RECEBIDA);

    let filtered = [...trocas];

    // Aplicar filtros
    if (filters.tipo) {
      console.log('Aplicando filtro por tipo:', filters.tipo);
      filtered = filtered.filter((troca) => {
        console.log('Comparando:', troca.tipo, '===', filters.tipo, troca.tipo === filters.tipo);
        return troca.tipo === filters.tipo;
      });
      console.log('Resultado após filtro por tipo:', filtered);
    }

    if (filters.status) {
      filtered = filtered.filter((troca) => troca.status === filters.status);
    }

    if (filters.dataInicio) {
      const dataInicio = new Date(filters.dataInicio);
      filtered = filtered.filter(
        (troca) => new Date(troca.dataCriacao) >= dataInicio
      );
    }

    if (filters.dataFim) {
      const dataFim = new Date(filters.dataFim);
      dataFim.setHours(23, 59, 59);
      filtered = filtered.filter(
        (troca) => new Date(troca.dataCriacao) <= dataFim
      );
    }

    // Aplicar busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (troca) =>
          troca.nomeProduto.toLowerCase().includes(term) ||
          troca.ean.toLowerCase().includes(term) ||
          troca.lojaParceira.toLowerCase().includes(term) ||
          troca.responsavel.toLowerCase().includes(term)
      );
    }

    setFilteredTrocas(filtered);
  }, [trocas, searchTerm, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      tipo: '',
      status: '',
      dataInicio: '',
      dataFim: '',
    });
    setSearchTerm('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  // Transforma o status no formato de visualização para o usuário
  const formatarStatus = (status: TrocaStatus): string => {
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

  const getStatusBadge = (status: TrocaStatus) => {
    switch (status) {
      case TrocaStatus.AGUARDANDO_DEVOLUCAO:
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
            <Clock className="w-3 h-3 mr-1" />
            {formatarStatus(status)}
          </span>
        );
      case TrocaStatus.COLETADO:
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            <Truck className="w-3 h-3 mr-1" />
            {formatarStatus(status)}
          </span>
        );
      case TrocaStatus.FINALIZADA:
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" />
            {formatarStatus(status)}
          </span>
        );
      case TrocaStatus.CANCELADA:
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

  const handleQuicklook = (troca: Troca) => {
    setQuicklookTroca(troca);
  };

  const closeQuicklook = () => {
    setQuicklookTroca(null);
  };

  const handleFinalizar = async (id: string) => {
    try {
      setAtualizando(true);
      setAtualizandoId(id);
      console.log(`Finalizando troca ${id}`);
      await updateTrocaStatus(id, TrocaStatus.FINALIZADA);
      toast.success('Troca finalizada com sucesso!');
    } catch (error) {
      console.error('Erro ao finalizar troca:', error);
      toast.error('Erro ao finalizar troca');
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
      console.log(`Cancelando troca ${id}`);
      await updateTrocaStatus(id, TrocaStatus.CANCELADA);
      toast.success('Troca cancelada com sucesso!');
    } catch (error) {
      console.error('Erro ao cancelar troca:', error);
      toast.error('Erro ao cancelar troca');
    } finally {
      setAtualizando(false);
      setAtualizandoId(null);
      closeQuicklook();
    }
  };

  const handleAtualizarStatus = async (id: string, novoStatus: TrocaStatus) => {
    try {
      setAtualizandoId(id);
      setAtualizando(true);
      await updateTrocaStatus(id, novoStatus);
      toast.success(`Status atualizado para ${formatarStatus(novoStatus)}`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setAtualizando(false);
      setAtualizandoId(null);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trocas Entre Lojas</h1>
        <Link
          href="/dashboard/trocas/nova"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Troca
        </Link>
      </div>

      {/* Navegação rápida por tipo */}
      <div className="flex mb-6 space-x-4">
        <button
          onClick={() => setFilters(prev => ({ ...prev, tipo: '' }))}
          className={`px-4 py-2 rounded-md transition-colors ${
            filters.tipo === '' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilters(prev => ({ ...prev, tipo: TrocaTipo.ENVIADA }))}
          className={`px-4 py-2 rounded-md transition-colors ${
            filters.tipo === TrocaTipo.ENVIADA 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Enviadas
        </button>
        <button
          onClick={() => setFilters(prev => ({ ...prev, tipo: TrocaTipo.RECEBIDA }))}
          className={`px-4 py-2 rounded-md transition-colors ${
            filters.tipo === TrocaTipo.RECEBIDA 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Recebidas
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Buscar por produto, EAN, loja..."
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Troca
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={filters.tipo}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  <option value={TrocaTipo.ENVIADA}>Enviamos para outra loja</option>
                  <option value={TrocaTipo.RECEBIDA}>Recebemos de outra loja</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  <option value={TrocaStatus.AGUARDANDO_DEVOLUCAO}>Aguardando Devolução</option>
                  <option value={TrocaStatus.COLETADO}>Coletado</option>
                  <option value={TrocaStatus.FINALIZADA}>Finalizado</option>
                  <option value={TrocaStatus.CANCELADA}>Cancelado</option>
                </select>
              </div>

              <div>
                <label htmlFor="dataInicio" className="block text-sm font-medium text-gray-700 mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  id="dataInicio"
                  name="dataInicio"
                  value={filters.dataInicio}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="dataFim" className="block text-sm font-medium text-gray-700 mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  id="dataFim"
                  name="dataFim"
                  value={filters.dataFim}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredTrocas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-2 text-lg">Nenhuma troca encontrada</p>
            <p className="text-sm">
              {trocas.length === 0
                ? 'Não há trocas registradas. Clique em "Nova Troca" para adicionar.'
                : 'Nenhum resultado encontrado com os filtros aplicados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loja Parceira
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responsável
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTrocas.map((troca) => (
                  <tr key={troca.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {troca.nomeProduto}
                          </div>
                          <div className="text-xs text-gray-500">EAN: {troca.ean}</div>
                          <div className="text-xs text-gray-500">Quantidade: {troca.quantidade}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {troca.tipo === TrocaTipo.ENVIADA ? 'Enviada' : 'Recebida'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{troca.lojaParceira}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{troca.responsavel}</div>
                      <div className="text-xs text-gray-500">{troca.telefoneResponsavel}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(troca.dataCriacao)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center group relative">
                        {getStatusBadge(troca.status)}
                        
                        {/* Botão para mudar o status */}
                        {!atualizando && (
                          <button 
                            className="ml-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Alterar status"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuicklookTroca(troca);
                            }}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        
                        {atualizando && atualizandoId === troca.id && (
                          <span className="ml-2">
                            <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full inline-block"></span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuicklook(troca)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Visualização rápida"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <Link
                          href={`/dashboard/trocas/${troca.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalhes"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Quicklook */}
      {quicklookTroca && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 p-4">
              <h2 className="text-xl font-semibold">Detalhes da Troca</h2>
              <button 
                onClick={closeQuicklook} 
                className="text-gray-500 hover:text-gray-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">{quicklookTroca.nomeProduto}</h3>
                <div>{getStatusBadge(quicklookTroca.status)}</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Código EAN</p>
                  <p className="font-medium">{quicklookTroca.ean}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Quantidade</p>
                  <p className="font-medium">{quicklookTroca.quantidade}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo de Troca</p>
                  <p className="font-medium">
                    {quicklookTroca.tipo === TrocaTipo.ENVIADA ? 'Enviada para outra loja' : 'Recebida de outra loja'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Loja Parceira</p>
                  <p className="font-medium">{quicklookTroca.lojaParceira}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Responsável</p>
                  <p className="font-medium">{quicklookTroca.responsavel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium">{quicklookTroca.telefoneResponsavel}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Motivo da Troca</p>
                  <p className="font-medium">{quicklookTroca.motivo}</p>
                </div>
                {quicklookTroca.observacoes && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Observações</p>
                    <p className="font-medium">{quicklookTroca.observacoes}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Data de Criação</p>
                  <p className="font-medium">{formatDate(quicklookTroca.dataCriacao)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Última Atualização</p>
                  <p className="font-medium">{formatDate(quicklookTroca.dataAtualizacao)}</p>
                </div>
              </div>

              {/* Opções de mudança de status */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-md font-medium mb-3">Alterar Status</h4>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {quicklookTroca.tipo === TrocaTipo.ENVIADA && (
                    <>
                      <button
                        className={`px-3 py-2 rounded-md text-sm flex items-center justify-center ${
                          quicklookTroca.status === TrocaStatus.AGUARDANDO_DEVOLUCAO 
                            ? 'bg-orange-100 text-orange-800 font-medium border-2 border-orange-300' 
                            : 'bg-gray-100 hover:bg-orange-50 text-gray-700'
                        }`}
                        onClick={() => handleAtualizarStatus(quicklookTroca.id, TrocaStatus.AGUARDANDO_DEVOLUCAO)}
                        disabled={atualizando || quicklookTroca.status === TrocaStatus.AGUARDANDO_DEVOLUCAO}
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Aguardando Devolução
                      </button>
                      <button
                        className={`px-3 py-2 rounded-md text-sm flex items-center justify-center ${
                          quicklookTroca.status === TrocaStatus.FINALIZADA 
                            ? 'bg-green-100 text-green-800 font-medium border-2 border-green-300' 
                            : 'bg-gray-100 hover:bg-green-50 text-gray-700'
                        }`}
                        onClick={() => handleAtualizarStatus(quicklookTroca.id, TrocaStatus.FINALIZADA)}
                        disabled={atualizando || quicklookTroca.status === TrocaStatus.FINALIZADA}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Finalizado
                      </button>
                    </>
                  )}
                  
                  {quicklookTroca.tipo === TrocaTipo.RECEBIDA && (
                    <>
                      <button
                        className={`px-3 py-2 rounded-md text-sm flex items-center justify-center ${
                          quicklookTroca.status === TrocaStatus.COLETADO 
                            ? 'bg-blue-100 text-blue-800 font-medium border-2 border-blue-300' 
                            : 'bg-gray-100 hover:bg-blue-50 text-gray-700'
                        }`}
                        onClick={() => handleAtualizarStatus(quicklookTroca.id, TrocaStatus.COLETADO)}
                        disabled={atualizando || quicklookTroca.status === TrocaStatus.COLETADO}
                      >
                        <Truck className="w-4 h-4 mr-1" />
                        Coletado
                      </button>
                      <button
                        className={`px-3 py-2 rounded-md text-sm flex items-center justify-center ${
                          quicklookTroca.status === TrocaStatus.FINALIZADA 
                            ? 'bg-green-100 text-green-800 font-medium border-2 border-green-300' 
                            : 'bg-gray-100 hover:bg-green-50 text-gray-700'
                        }`}
                        onClick={() => handleAtualizarStatus(quicklookTroca.id, TrocaStatus.FINALIZADA)}
                        disabled={atualizando || quicklookTroca.status === TrocaStatus.FINALIZADA}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Finalizado
                      </button>
                    </>
                  )}
                  
                  {/* Este botão é comum para ambos os tipos */}
                  <button
                    className={`px-3 py-2 rounded-md text-sm flex items-center justify-center col-span-2 ${
                      quicklookTroca.status === TrocaStatus.CANCELADA 
                        ? 'bg-red-100 text-red-800 font-medium border-2 border-red-300' 
                        : 'bg-gray-100 hover:bg-red-50 text-gray-700'
                    }`}
                    onClick={() => handleAtualizarStatus(quicklookTroca.id, TrocaStatus.CANCELADA)}
                    disabled={atualizando || quicklookTroca.status === TrocaStatus.CANCELADA}
                  >
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Cancelar
                  </button>
                </div>
                
                {atualizando && (
                  <div className="mt-2 flex items-center text-gray-600">
                    <span className="animate-spin h-5 w-5 mr-2 border-t-2 border-b-2 border-blue-500 rounded-full"></span>
                    Atualizando...
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <Link
                  href={`/dashboard/trocas/${quicklookTroca.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Ver Página Completa
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 