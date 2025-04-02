'use client';

import { useState, useRef } from 'react';
import { useSugestoes } from '@/contexts/SugestoesContext';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Filter, 
  Search, 
  PlusCircle, 
  FileDown, 
  RefreshCw, 
  Trash, 
  AlertCircle,
  Check,
  X,
  Eye,
  ArrowRight,
  CheckSquare,
  Square,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { 
  StatusSugestao, 
  UrgenciaSugestao, 
  Sugestao,
  FiltroSugestao
} from '@/types/sugestoes';

// Tipo para ordenação
type OrderField = 'nomeProduto' | 'fornecedor' | 'cliente' | 'data' | 'urgencia' | 'status' | 'ean';
type OrderDirection = 'asc' | 'desc';

export default function SugestoesPage() {
  const { sugestoes, loading, deleteSugestao, filtrarSugestoes, exportarSugestoes, updateSugestao, avancarStatus, updateStatusMultiple } = useSugestoes();
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroSugestao>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [quickLookSugestao, setQuickLookSugestao] = useState<Sugestao | null>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const [selectedSugestoes, setSelectedSugestoes] = useState<string[]>([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [orderBy, setOrderBy] = useState<OrderField>('data');
  const [orderDirection, setOrderDirection] = useState<OrderDirection>('desc');

  // Função para obter o label do status
  const getStatusLabel = (status: StatusSugestao) => {
    switch(status) {
      case StatusSugestao.CRIADO:
        return 'Criado';
      case StatusSugestao.PEDIDO_REALIZADO:
        return 'Pedido Realizado';
      case StatusSugestao.PRODUTO_CHEGOU:
        return 'Produto Chegou';
      default:
        return 'Desconhecido';
    }
  };

  // Função para obter o label da urgência
  const getUrgenciaLabel = (urgencia: UrgenciaSugestao) => {
    switch(urgencia) {
      case UrgenciaSugestao.BAIXA:
        return 'Baixa (1-2 semanas)';
      case UrgenciaSugestao.MEDIA:
        return 'Média (5-10 dias)';
      case UrgenciaSugestao.ALTA:
        return 'Alta (2-5 dias)';
      case UrgenciaSugestao.CRITICA:
        return 'Crítica (1 dia)';
      default:
        return 'Desconhecida';
    }
  };

  // Função para obter a classe de cor da urgência
  const getUrgenciaColorClass = (urgencia: UrgenciaSugestao) => {
    switch(urgencia) {
      case UrgenciaSugestao.BAIXA:
        return 'text-green-600 bg-green-50';
      case UrgenciaSugestao.MEDIA:
        return 'text-blue-600 bg-blue-50';
      case UrgenciaSugestao.ALTA:
        return 'text-orange-600 bg-orange-50';
      case UrgenciaSugestao.CRITICA:
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Função para obter a classe de cor do status
  const getStatusColorClass = (status: StatusSugestao) => {
    switch(status) {
      case StatusSugestao.CRIADO:
        return 'text-purple-600 bg-purple-50';
      case StatusSugestao.PEDIDO_REALIZADO:
        return 'text-blue-600 bg-blue-50';
      case StatusSugestao.PRODUTO_CHEGOU:
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Função para ordenar sugestões
  const sortSugestoes = (sugestoes: Sugestao[]): Sugestao[] => {
    return [...sugestoes].sort((a, b) => {
      let valueA, valueB;
      
      // Determinar os valores a serem comparados com base no campo de ordenação
      switch (orderBy) {
        case 'nomeProduto':
          valueA = a.nomeProduto.toLowerCase();
          valueB = b.nomeProduto.toLowerCase();
          break;
        case 'fornecedor':
          valueA = a.fornecedor.toLowerCase();
          valueB = b.fornecedor.toLowerCase();
          break;
        case 'cliente':
          valueA = a.cliente.toLowerCase();
          valueB = b.cliente.toLowerCase();
          break;
        case 'data':
          valueA = new Date(a.data).getTime();
          valueB = new Date(b.data).getTime();
          break;
        case 'urgencia':
          // Ordenar por prioridade (Crítica > Alta > Média > Baixa)
          const urgencyOrder = {
            'critica': 3,
            'alta': 2,
            'media': 1,
            'baixa': 0
          };
          valueA = urgencyOrder[a.urgencia as keyof typeof urgencyOrder];
          valueB = urgencyOrder[b.urgencia as keyof typeof urgencyOrder];
          break;
        case 'status':
          // Ordenar por status (Criado > Pedido Realizado > Produto Chegou)
          const statusOrder = {
            'criado': 0,
            'pedido_realizado': 1,
            'produto_chegou': 2
          };
          valueA = statusOrder[a.status as keyof typeof statusOrder];
          valueB = statusOrder[b.status as keyof typeof statusOrder];
          break;
        case 'ean':
          valueA = a.ean;
          valueB = b.ean;
          break;
        default:
          valueA = a.data;
          valueB = b.data;
      }
      
      // Realizar a comparação com base na direção de ordenação
      if (orderDirection === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  };

  // Função para alterar a ordenação
  const handleSort = (field: OrderField) => {
    if (orderBy === field) {
      // Se já estamos ordenando por este campo, apenas inverter a direção
      setOrderDirection(orderDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Caso contrário, mudar o campo e definir a direção padrão (asc)
      setOrderBy(field);
      setOrderDirection('asc');
    }
  };

  // Função que renderiza o ícone de ordenação
  const renderSortIcon = (field: OrderField) => {
    if (orderBy !== field) {
      return (
        <span className="ml-1 text-gray-400">
          <ChevronUp size={14} className="opacity-50" />
        </span>
      );
    }
    
    return (
      <span className="ml-1 text-blue-600">
        {orderDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </span>
    );
  };

  // Filtrar e ordenar sugestões
  const filteredSugestoes = () => {
    let resultado = filtrarSugestoes(filtro);
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(s => 
        s.nomeProduto.toLowerCase().includes(term) || 
        s.fornecedor.toLowerCase().includes(term) || 
        s.cliente.toLowerCase().includes(term) || 
        s.ean.includes(term)
      );
    }
    
    // Aplicar ordenação
    return sortSugestoes(resultado);
  };

  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltro({});
    setSearchTerm('');
  };

  // Função para atualizar filtros
  const atualizarFiltro = (campo: keyof FiltroSugestao, valor: any) => {
    setFiltro(prev => ({ ...prev, [campo]: valor }));
  };

  // Função para realizar a exportação
  const handleExportar = async () => {
    try {
      const csv = await exportarSugestoes(filtro);
      
      // Criar um blob e um URL para download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Criar nome do arquivo com data atual
      const now = new Date();
      const fileName = `sugestoes_compras_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.csv`;
      
      // Usar o link de referência para download
      if (downloadLinkRef.current) {
        downloadLinkRef.current.href = url;
        downloadLinkRef.current.download = fileName;
        downloadLinkRef.current.click();
      }
      
      setMessage({ type: 'success', text: 'Exportação concluída com sucesso!' });
      
      // Limpar o objeto URL após o download
      setTimeout(() => {
        URL.revokeObjectURL(url);
        setMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      setMessage({ type: 'error', text: 'Erro ao exportar as sugestões' });
      
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Função para excluir uma sugestão
  const handleDelete = async (id: string) => {
    try {
      await deleteSugestao(id);
      setConfirmDelete(null);
      setMessage({ type: 'success', text: 'Sugestão excluída com sucesso!' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      setMessage({ type: 'error', text: 'Erro ao excluir a sugestão' });
      
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Função para exibir QuickLook
  const handleQuickLook = (sugestao: Sugestao) => {
    setQuickLookSugestao(sugestao);
  };

  // Função para fechar QuickLook
  const closeQuickLook = () => {
    setQuickLookSugestao(null);
  };

  // Função para avançar para o próximo status
  const handleAvancarStatus = async (id: string) => {
    try {
      const sugestaoAtualizada = await avancarStatus(id);
      
      // Se a sugestão que está em QuickLook foi atualizada, atualizar também o estado do QuickLook
      if (quickLookSugestao && quickLookSugestao.id === id) {
        setQuickLookSugestao(sugestaoAtualizada);
      }
      
      setMessage({ type: 'success', text: 'Status atualizado com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao avançar status:', error);
      setMessage({ type: 'error', text: 'Erro ao atualizar status' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Função para atualizar o status no QuickLook
  const handleUpdateStatusQuickLook = async (status: StatusSugestao) => {
    if (!quickLookSugestao) return;
    
    try {
      const sugestaoAtualizada = await updateSugestao(quickLookSugestao.id, { status });
      setQuickLookSugestao(sugestaoAtualizada);
      
      setMessage({ type: 'success', text: 'Status atualizado com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setMessage({ type: 'error', text: 'Erro ao atualizar status' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Função para alternar a seleção de uma sugestão
  const toggleSugestaoSelection = (id: string) => {
    setSelectedSugestoes(prev => {
      if (prev.includes(id)) {
        return prev.filter(sugestaoId => sugestaoId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Função para selecionar/desmarcar todas as sugestões
  const toggleSelectAll = () => {
    const newSelectAllState = !selectAllChecked;
    setSelectAllChecked(newSelectAllState);
    
    if (newSelectAllState) {
      const allIds = filteredSugestoes().map(s => s.id);
      setSelectedSugestoes(allIds);
    } else {
      setSelectedSugestoes([]);
    }
  };

  // Função para atualizar o status de múltiplas sugestões
  const handleUpdateMultipleStatus = async (status: StatusSugestao) => {
    if (selectedSugestoes.length === 0) {
      setMessage({ type: 'error', text: 'Nenhuma sugestão selecionada' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    try {
      await updateStatusMultiple(selectedSugestoes, status);
      
      setMessage({ 
        type: 'success', 
        text: `Status de ${selectedSugestoes.length} sugestões atualizado com sucesso!` 
      });
      
      // Limpar seleções após a operação
      setSelectedSugestoes([]);
      setSelectAllChecked(false);
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao atualizar status múltiplo:', error);
      setMessage({ type: 'error', text: 'Erro ao atualizar status das sugestões' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Renderizar QuickLook
  const renderQuickLook = () => {
    if (!quickLookSugestao) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{quickLookSugestao.nomeProduto}</h3>
              <button 
                onClick={closeQuickLook}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">EAN</p>
                <p className="font-medium">{quickLookSugestao.ean}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Fornecedor/Marca</p>
                <p className="font-medium">{quickLookSugestao.fornecedor}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-medium">{quickLookSugestao.cliente}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Telefone</p>
                <p className="font-medium">{quickLookSugestao.telefoneCliente}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Data</p>
                <p className="font-medium">{formatDate(quickLookSugestao.data)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(quickLookSugestao.status)}`}>
                    {getStatusLabel(quickLookSugestao.status)}
                  </span>
                  <div className="relative ml-2 inline-block">
                    <select
                      className="bg-white border border-gray-300 rounded-md text-xs py-1 pl-2 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={quickLookSugestao.status}
                      onChange={(e) => handleUpdateStatusQuickLook(e.target.value as StatusSugestao)}
                    >
                      <option value={StatusSugestao.CRIADO}>Criado</option>
                      <option value={StatusSugestao.PEDIDO_REALIZADO}>Pedido Realizado</option>
                      <option value={StatusSugestao.PRODUTO_CHEGOU}>Produto Chegou</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Urgência</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgenciaColorClass(quickLookSugestao.urgencia)}`}>
                  {getUrgenciaLabel(quickLookSugestao.urgencia)}
                </span>
              </div>
            </div>
            
            {quickLookSugestao.observacao && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Observação</p>
                <p className="bg-gray-50 p-3 rounded text-sm">{quickLookSugestao.observacao}</p>
              </div>
            )}
            
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-2">Comentários</h4>
              
              {quickLookSugestao.comentarios.length === 0 ? (
                <p className="text-gray-500 text-sm italic">Nenhum comentário adicionado</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {quickLookSugestao.comentarios.map(comentario => (
                    <div key={comentario.id} className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-sm">{comentario.usuarioNome}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comentario.dataCriacao).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm">{comentario.texto}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeQuickLook}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
              
              <Link
                href={`/dashboard/sugestoes/editar/${quickLookSugestao.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Editar
              </Link>
              
              {quickLookSugestao.status !== StatusSugestao.PRODUTO_CHEGOU && (
                <button
                  onClick={() => handleAvancarStatus(quickLookSugestao.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 inline-flex items-center"
                >
                  <ArrowRight size={16} className="mr-1" />
                  Avançar Status
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
          <ShoppingCart size={24} className="mr-2 text-blue-600" />
          <h1 className="text-2xl font-bold">Sugestões de Compras</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter size={16} className="mr-2" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          
          <button
            onClick={handleExportar}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FileDown size={16} className="mr-2" />
            Exportar
          </button>
          
          <Link
            href="/dashboard/sugestoes/novo"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusCircle size={16} className="mr-2" />
            Nova Sugestão
          </Link>
        </div>
      </div>
      
      {/* Link para download escondido */}
      <a ref={downloadLinkRef} className="hidden"></a>
      
      {/* Mensagem de erro ou sucesso */}
      {message && (
        <div className={`rounded-md p-4 ${message.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <Check className={`h-5 w-5 text-green-400`} />
              ) : (
                <AlertCircle className={`h-5 w-5 text-red-400`} />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {message.text}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Painel de ações em lote (quando há seleção) */}
      {selectedSugestoes.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <p className="text-blue-800 font-medium mb-3 sm:mb-0">
              {selectedSugestoes.length} {selectedSugestoes.length === 1 ? 'sugestão selecionada' : 'sugestões selecionadas'}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleUpdateMultipleStatus(StatusSugestao.CRIADO)}
                className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200"
              >
                Marcar como Criado
              </button>
              <button
                onClick={() => handleUpdateMultipleStatus(StatusSugestao.PEDIDO_REALIZADO)}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                Marcar como Pedido Realizado
              </button>
              <button
                onClick={() => handleUpdateMultipleStatus(StatusSugestao.PRODUTO_CHEGOU)}
                className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
              >
                Marcar como Produto Chegou
              </button>
              <button
                onClick={() => setSelectedSugestoes([])}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                Limpar Seleção
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Filtros */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Filtro de status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filtro.status ? filtro.status[0] : ''}
                onChange={(e) => atualizarFiltro('status', e.target.value ? [e.target.value as StatusSugestao] : undefined)}
              >
                <option value="">Todos</option>
                <option value={StatusSugestao.CRIADO}>Criado</option>
                <option value={StatusSugestao.PEDIDO_REALIZADO}>Pedido Realizado</option>
                <option value={StatusSugestao.PRODUTO_CHEGOU}>Produto Chegou</option>
              </select>
            </div>
            
            {/* Filtro de urgência */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgência
              </label>
              <select
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filtro.urgencia ? filtro.urgencia[0] : ''}
                onChange={(e) => atualizarFiltro('urgencia', e.target.value ? [e.target.value as UrgenciaSugestao] : undefined)}
              >
                <option value="">Todas</option>
                <option value={UrgenciaSugestao.BAIXA}>Baixa (1-2 semanas)</option>
                <option value={UrgenciaSugestao.MEDIA}>Média (5-10 dias)</option>
                <option value={UrgenciaSugestao.ALTA}>Alta (2-5 dias)</option>
                <option value={UrgenciaSugestao.CRITICA}>Crítica (1 dia)</option>
              </select>
            </div>
            
            {/* Filtro de fornecedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fornecedor
              </label>
              <input
                type="text"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Digite o fornecedor"
                value={filtro.fornecedor || ''}
                onChange={(e) => atualizarFiltro('fornecedor', e.target.value || undefined)}
              />
            </div>
            
            {/* Período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filtro.dataInicio || ''}
                onChange={(e) => atualizarFiltro('dataInicio', e.target.value || undefined)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final
              </label>
              <input
                type="date"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filtro.dataFim || ''}
                onChange={(e) => atualizarFiltro('dataFim', e.target.value || undefined)}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={limparFiltros}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
            >
              <RefreshCw size={16} className="mr-2" />
              Limpar Filtros
            </button>
          </div>
        </div>
      )}
      
      {/* Barra de pesquisa */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md"
              placeholder="Buscar por produto, fornecedor, cliente ou EAN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Lista de sugestões */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">
            <RefreshCw size={24} className="animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-500">Carregando sugestões...</p>
          </div>
        ) : filteredSugestoes().length === 0 ? (
          <div className="p-10 text-center border">
            <ShoppingCart size={40} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma sugestão encontrada</h3>
            <p className="text-gray-500 mb-3">Não existem sugestões com os filtros aplicados.</p>
            {(Object.keys(filtro).length > 0 || searchTerm) && (
              <button
                onClick={limparFiltros}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw size={16} className="mr-2" />
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={toggleSelectAll} className="flex items-center">
                      {selectAllChecked ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      className="flex items-center focus:outline-none group" 
                      onClick={() => handleSort('nomeProduto')}
                    >
                      <span className="group-hover:text-blue-600">Produto</span>
                      {renderSortIcon('nomeProduto')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      className="flex items-center focus:outline-none group" 
                      onClick={() => handleSort('ean')}
                    >
                      <span className="group-hover:text-blue-600">EAN</span>
                      {renderSortIcon('ean')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      className="flex items-center focus:outline-none group" 
                      onClick={() => handleSort('fornecedor')}
                    >
                      <span className="group-hover:text-blue-600">Fornecedor</span>
                      {renderSortIcon('fornecedor')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      className="flex items-center focus:outline-none group" 
                      onClick={() => handleSort('cliente')}
                    >
                      <span className="group-hover:text-blue-600">Cliente</span>
                      {renderSortIcon('cliente')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      className="flex items-center focus:outline-none group" 
                      onClick={() => handleSort('data')}
                    >
                      <span className="group-hover:text-blue-600">Data</span>
                      {renderSortIcon('data')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      className="flex items-center focus:outline-none group" 
                      onClick={() => handleSort('urgencia')}
                    >
                      <span className="group-hover:text-blue-600">Urgência</span>
                      {renderSortIcon('urgencia')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      className="flex items-center focus:outline-none group" 
                      onClick={() => handleSort('status')}
                    >
                      <span className="group-hover:text-blue-600">Status</span>
                      {renderSortIcon('status')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSugestoes().map((sugestao) => (
                  <tr key={sugestao.id} className={`hover:bg-gray-50 ${selectedSugestoes.includes(sugestao.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-2 py-4 whitespace-nowrap">
                      <button onClick={() => toggleSugestaoSelection(sugestao.id)} className="flex items-center">
                        {selectedSugestoes.includes(sugestao.id) ? (
                          <CheckSquare size={16} className="text-blue-600" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sugestao.nomeProduto}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{sugestao.ean}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{sugestao.fornecedor}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{sugestao.cliente}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(sugestao.data)}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgenciaColorClass(sugestao.urgencia)}`}>
                        {getUrgenciaLabel(sugestao.urgencia)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(sugestao.status)}`}>
                        {getStatusLabel(sugestao.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleQuickLook(sugestao)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Ver detalhes"
                        >
                          <Eye size={18} />
                        </button>
                        
                        {sugestao.status !== StatusSugestao.PRODUTO_CHEGOU && (
                          <button
                            onClick={() => handleAvancarStatus(sugestao.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Avançar status"
                          >
                            <ArrowRight size={18} />
                          </button>
                        )}
                        
                        <Link
                          href={`/dashboard/sugestoes/editar/${sugestao.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        
                        {confirmDelete === sugestao.id ? (
                          <div className="inline-flex">
                            <button
                              onClick={() => handleDelete(sugestao.id)}
                              className="text-red-600 hover:text-red-900 mr-1"
                              title="Confirmar exclusão"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Cancelar"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(sugestao.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* QuickLook modal */}
      {renderQuickLook()}
    </div>
  );
} 