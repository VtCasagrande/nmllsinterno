'use client';

import { useState, useEffect } from 'react';
import { useEntregas } from '@/contexts/EntregasContext';
import { StatusEntrega, Entrega, Rota, Motorista } from '@/types/entregas';
import { 
  Search, 
  Filter, 
  MapPin, 
  User, 
  Package, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  Calendar,
  X,
  FileText,
  Check,
  Map,
  Truck
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Importar o mapa de forma dinâmica para evitar erro de "window is not defined"
const EntregaMap = dynamic(() => import('@/components/EntregaMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full flex items-center justify-center bg-gray-100 rounded-md">
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span>Carregando mapa...</span>
      </div>
    </div>
  )
});

export default function ControleEntregasPage() {
  const { entregas, motoristas, rotas, getEntregasPendentes, loading } = useEntregas();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [motoristaFilter, setMotoristaFilter] = useState<string>('todos');
  const [dataFilter, setDataFilter] = useState<string>('');
  const [expandedRotas, setExpandedRotas] = useState<string[]>([]);
  const [expandedFiltros, setExpandedFiltros] = useState(false);
  const [entregasSemRota, setEntregasSemRota] = useState<Entrega[]>([]);
  
  // Carregar entregas sem rota
  useEffect(() => {
    const semRota = entregas.filter(e => 
      !e.rotaId && 
      e.status !== StatusEntrega.ENTREGUE && 
      e.status !== StatusEntrega.CANCELADA
    );
    setEntregasSemRota(semRota);
  }, [entregas]);
  
  // Filtrar rotas
  const rotasFiltradas = rotas.filter(rota => {
    const rotaEntregas = entregas.filter(e => e.rotaId === rota.id);
    
    const matchesSearch = 
      rota.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rota.motoristaNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rotaEntregas.some(e => 
        e.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.cidade.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
    const matchesMotorista = motoristaFilter === 'todos' || rota.motoristaId === motoristaFilter;
    
    const matchesData = !dataFilter || new Date(rota.data).toLocaleDateString() === new Date(dataFilter).toLocaleDateString();
    
    return matchesSearch && matchesMotorista && matchesData;
  });
  
  // Filtrar entregas sem rota
  const entregasSemRotaFiltradas = entregasSemRota.filter(entrega => {
    const matchesSearch = 
      entrega.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrega.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrega.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrega.cidade.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'todas' || entrega.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Toggle expansão de rota
  const toggleRotaExpansion = (rotaId: string) => {
    setExpandedRotas(prev => {
      if (prev.includes(rotaId)) {
        return prev.filter(id => id !== rotaId);
      } else {
        return [...prev, rotaId];
      }
    });
  };
  
  // Expandir todos os filtros
  const toggleFiltros = () => {
    setExpandedFiltros(!expandedFiltros);
  };
  
  // Obter entregas de uma rota
  const getEntregasRota = (rotaId: string) => {
    return entregas
      .filter(e => e.rotaId === rotaId)
      .sort((a, b) => (a.posicaoRota || 0) - (b.posicaoRota || 0));
  };
  
  // Calcular estatísticas de uma rota
  const getRotaStats = (rotaId: string) => {
    const entregasRota = getEntregasRota(rotaId);
    const total = entregasRota.length;
    const entregues = entregasRota.filter(e => e.status === StatusEntrega.ENTREGUE).length;
    const emRota = entregasRota.filter(e => e.status === StatusEntrega.EM_ROTA).length;
    const pendentes = total - entregues - emRota;
    
    return { total, entregues, emRota, pendentes };
  };
  
  // Renderizar card de rota
  const renderRotaCard = (rota: Rota) => {
    const isExpanded = expandedRotas.includes(rota.id);
    const entregasRota = getEntregasRota(rota.id);
    const stats = getRotaStats(rota.id);
    const motorista = motoristas.find(m => m.id === rota.motoristaId);
    
    return (
      <div key={rota.id} className="bg-white border rounded-lg overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          onClick={() => toggleRotaExpansion(rota.id)}
        >
          <div>
            <h3 className="font-medium">{rota.codigo}</h3>
            <p className="text-sm text-gray-500">
              {new Date(rota.data).toLocaleDateString('pt-BR')} • {rota.motoristaNome}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="text-sm text-gray-500">Total</span>
              <p className="font-medium">{stats.total}</p>
            </div>
            
            <div className="text-center">
              <span className="text-sm text-green-600">Entregues</span>
              <p className="font-medium">{stats.entregues}</p>
            </div>
            
            <div className="text-center">
              <span className="text-sm text-blue-600">Em rota</span>
              <p className="font-medium">{stats.emRota}</p>
            </div>
            
            <div className="text-center">
              <span className="text-sm text-yellow-600">Pendentes</span>
              <p className="font-medium">{stats.pendentes}</p>
            </div>
            
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="border-t">
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-500" />
                  <span className="text-sm font-medium">Motorista: {rota.motoristaNome}</span>
                </div>
                
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/entregas/rotas/editar/${rota.id}`}
                    className="text-blue-600 text-sm font-medium flex items-center"
                  >
                    Editar Rota
                  </Link>
                  
                  {motorista && motorista.latitude && motorista.longitude && (
                    <button
                      onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${motorista.latitude}&mlon=${motorista.longitude}#map=15/${motorista.latitude}/${motorista.longitude}`, '_blank')}
                      className="text-green-600 text-sm font-medium flex items-center"
                    >
                      <Map size={16} className="mr-1" />
                      Ver Motorista no Mapa
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Mapa da rota */}
            {entregasRota.length > 0 && (
              <div className="border-b">
                <div className="p-4 h-[300px]">
                  <EntregaMap
                    enderecos={entregasRota.map(e => ({
                      endereco: e.endereco,
                      cidade: e.cidade,
                      cep: e.cep
                    }))}
                    motorista={motorista && motorista.latitude && motorista.longitude ? {
                      nome: motorista.nome,
                      veiculo: motorista.veiculo || "Não especificado",
                      placa: motorista.placaVeiculo || "Sem placa",
                      lat: motorista.latitude,
                      lng: motorista.longitude
                    } : undefined}
                    height="100%"
                  />
                </div>
              </div>
            )}
            
            <div className="divide-y">
              {entregasRota.length > 0 ? (
                entregasRota.map((entrega) => (
                  <div key={entrega.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between">
                      <div>
                        <div className="flex gap-2 items-center">
                          <span className="text-sm font-medium">#{entrega.numeroPedido}</span>
                          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entrega.status)}`}>
                            {getStatusLabel(entrega.status)}
                          </div>
                        </div>
                        <h4 className="font-medium mt-1">{entrega.nomeCliente}</h4>
                        <div className="mt-1 text-sm text-gray-600 flex items-start">
                          <MapPin size={14} className="mr-1 mt-0.5 flex-shrink-0" />
                          <span>{entrega.endereco}, {entrega.cidade}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Link
                          href={`/dashboard/entregas/detalhe/${entrega.id}`}
                          className="text-blue-600 text-sm font-medium flex items-center"
                        >
                          Detalhes
                          <ChevronRight size={16} className="ml-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  Nenhuma entrega nesta rota
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Controle de Entregas</h1>
          <p className="text-gray-500 mt-1">Gerencie todas as rotas e entregas</p>
        </div>
        
        <div className="flex gap-2">
          <Link
            href="/dashboard/entregas/rotas/nova"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Nova Rota
          </Link>
          
          <Link
            href="/dashboard/entregas/rotas/nova"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Nova Entrega
          </Link>
        </div>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por rota, motorista, cliente, endereço..."
                className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={toggleFiltros}
                className="flex items-center text-gray-700 hover:text-gray-900"
              >
                <Filter size={18} className="mr-2" />
                Filtros avançados
                {expandedFiltros ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
              </button>
              
              {(statusFilter !== 'todas' || motoristaFilter !== 'todos' || dataFilter) && (
                <button
                  onClick={() => {
                    setStatusFilter('todas');
                    setMotoristaFilter('todos');
                    setDataFilter('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <X size={14} className="mr-1" />
                  Limpar filtros
                </button>
              )}
            </div>
            
            {expandedFiltros && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="statusFilter"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="todas">Todos os status</option>
                    {Object.values(StatusEntrega).map(status => (
                      <option key={status} value={status}>
                        {getStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="motoristaFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Motorista
                  </label>
                  <select
                    id="motoristaFilter"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={motoristaFilter}
                    onChange={(e) => setMotoristaFilter(e.target.value)}
                  >
                    <option value="todos">Todos os motoristas</option>
                    {motoristas.map(motorista => (
                      <option key={motorista.id} value={motorista.id}>
                        {motorista.nome}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="dataFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    id="dataFilter"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={dataFilter}
                    onChange={(e) => setDataFilter(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total de Rotas</p>
              <h3 className="text-2xl font-bold mt-1">{rotas.length}</h3>
            </div>
            <FileText size={20} className="text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Entregas Pendentes</p>
              <h3 className="text-2xl font-bold mt-1">
                {entregas.filter(e => e.status === StatusEntrega.PENDENTE || e.status === StatusEntrega.ATRIBUIDA).length}
              </h3>
            </div>
            <Clock size={20} className="text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Entregas em Rota</p>
              <h3 className="text-2xl font-bold mt-1">
                {entregas.filter(e => e.status === StatusEntrega.EM_ROTA).length}
              </h3>
            </div>
            <Truck size={20} className="text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Entregas Concluídas</p>
              <h3 className="text-2xl font-bold mt-1">
                {entregas.filter(e => e.status === StatusEntrega.ENTREGUE).length}
              </h3>
            </div>
            <Check size={20} className="text-green-500" />
          </div>
        </div>
      </div>

      {/* Lista de rotas */}
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-500">Carregando dados...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-3">Rotas ({rotasFiltradas.length})</h2>
            {rotasFiltradas.length > 0 ? (
              <div className="space-y-4">
                {rotasFiltradas.map(rota => renderRotaCard(rota))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <p className="text-gray-500">Nenhuma rota encontrada para os filtros aplicados</p>
              </div>
            )}
          </div>
          
          {/* Entregas sem rota */}
          <div>
            <h2 className="text-lg font-medium mb-3">
              Entregas sem Rota ({entregasSemRotaFiltradas.length})
            </h2>
            {entregasSemRotaFiltradas.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="divide-y">
                  {entregasSemRotaFiltradas.map((entrega) => (
                    <div key={entrega.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between">
                        <div>
                          <div className="flex gap-2 items-center">
                            <span className="text-sm font-medium">#{entrega.numeroPedido}</span>
                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entrega.status)}`}>
                              {getStatusLabel(entrega.status)}
                            </div>
                          </div>
                          <h4 className="font-medium mt-1">{entrega.nomeCliente}</h4>
                          <div className="mt-1 text-sm text-gray-600 flex items-start">
                            <MapPin size={14} className="mr-1 mt-0.5 flex-shrink-0" />
                            <span>{entrega.endereco}, {entrega.cidade}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Link
                            href={`/dashboard/entregas/detalhe/${entrega.id}`}
                            className="text-blue-600 text-sm font-medium flex items-center"
                          >
                            Detalhes
                            <ChevronRight size={16} className="ml-1" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <p className="text-gray-500">Nenhuma entrega sem rota encontrada para os filtros aplicados</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Funções auxiliares para formatação
function getStatusLabel(status: StatusEntrega | string): string {
  const labels: Record<string, string> = {
    [StatusEntrega.PENDENTE]: 'Pendente',
    [StatusEntrega.ATRIBUIDA]: 'Atribuída',
    [StatusEntrega.EM_ROTA]: 'Em Rota',
    [StatusEntrega.ENTREGUE]: 'Entregue',
    [StatusEntrega.CANCELADA]: 'Cancelada',
    [StatusEntrega.COM_PROBLEMA]: 'Com Problema'
  };
  
  return labels[status] || status;
}

function getStatusColor(status: StatusEntrega): string {
  const colors = {
    [StatusEntrega.PENDENTE]: 'bg-yellow-100 text-yellow-800',
    [StatusEntrega.ATRIBUIDA]: 'bg-blue-100 text-blue-800',
    [StatusEntrega.EM_ROTA]: 'bg-indigo-100 text-indigo-800',
    [StatusEntrega.ENTREGUE]: 'bg-green-100 text-green-800',
    [StatusEntrega.CANCELADA]: 'bg-red-100 text-red-800',
    [StatusEntrega.COM_PROBLEMA]: 'bg-orange-100 text-orange-800'
  };
  
  return colors[status] || '';
} 