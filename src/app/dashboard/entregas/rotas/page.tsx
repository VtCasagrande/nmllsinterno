'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash, MapPin, Map, Eye, X, Package, Phone, Calendar, Clock, ShoppingBag, Filter, ChevronDown, Smartphone, ArrowUpDown, MoreHorizontal, ExternalLink, Truck, User, CircleDot, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatarMoeda, formatarData } from '@/lib/utils';
import { createPortal } from 'react-dom';

// Importar o mapa de forma dinâmica para evitar erro de "window is not defined"
const EntregaMap = dynamic(() => import('@/components/EntregaMap'), {
  ssr: false,
  loading: () => (
    <div 
      style={{ 
        height: '200px', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#f0f0f0',
        borderRadius: '0.375rem'
      }}
    >
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        Carregando mapa...
      </div>
    </div>
  )
});

// Dados simulados para as entregas
const ENTREGAS_MOCK = [
  {
    id: '1001',
    numeroPedido: '10001',
    status: 'atribuida',
    nomeCliente: 'Carlos Almeida',
    telefoneCliente: '(11) 98765-4321',
    endereco: 'Rua A, 123',
    cidade: 'São Paulo',
    cep: '01000-000',
    dataEntrega: '2025-04-01',
    horarioMaximo: '18:00',
    motoristaId: '1',
    motoristaNome: 'João Silva',
    itens: [
      { id: '101', nome: 'Produto 1', quantidade: 2, preco: 99.90 },
      { id: '102', nome: 'Produto 2', quantidade: 1, preco: 149.90 }
    ],
    pagamento: {
      forma: 'dinheiro',
      valor: 349.70,
      recebido: false
    }
  },
  {
    id: '1002',
    numeroPedido: '10002',
    status: 'pendente',
    nomeCliente: 'Ana Silva',
    telefoneCliente: '(11) 91234-5678',
    endereco: 'Av. B, 456',
    cidade: 'São Paulo',
    cep: '01100-000',
    motoristaId: null,
    motoristaNome: null,
    itens: [
      { id: '201', nome: 'Produto 3', quantidade: 3, preco: 59.90 }
    ],
    pagamento: {
      forma: 'cartao',
      valor: 179.70,
      recebido: false
    }
  },
  {
    id: '2001',
    numeroPedido: '20001',
    status: 'em_rota',
    nomeCliente: 'Roberto Ferreira',
    telefoneCliente: '(11) 97654-3210',
    endereco: 'Av. C, 789',
    cidade: 'São Paulo',
    cep: '02000-000',
    dataEntrega: '2025-04-01',
    motoristaId: '2',
    motoristaNome: 'Maria Souza',
    itens: [
      { id: '301', nome: 'Produto 4', quantidade: 1, preco: 299.90 }
    ],
    pagamento: {
      forma: 'pix',
      valor: 299.90,
      recebido: false
    }
  },
  {
    id: '3001',
    numeroPedido: '30001',
    status: 'entregue',
    nomeCliente: 'Mariana Santos',
    telefoneCliente: '(11) 95555-7777',
    endereco: 'Rua D, 222',
    cidade: 'São Paulo',
    cep: '03000-000',
    dataEntrega: '2025-03-31',
    motoristaId: '3',
    motoristaNome: 'Pedro Santos',
    itens: [
      { id: '401', nome: 'Produto 5', quantidade: 2, preco: 129.90 }
    ],
    pagamento: {
      forma: 'dinheiro',
      valor: 259.80,
      recebido: true
    }
  },
  {
    id: '4001',
    numeroPedido: '40001',
    status: 'cancelada',
    nomeCliente: 'Ricardo Oliveira',
    telefoneCliente: '(11) 96666-8888',
    endereco: 'Av. E, 333',
    cidade: 'São Paulo',
    cep: '04000-000',
    motoristaId: null,
    motoristaNome: null,
    itens: [
      { id: '501', nome: 'Produto 6', quantidade: 1, preco: 449.90 }
    ],
    pagamento: {
      forma: 'cartao',
      valor: 449.90,
      recebido: false
    }
  }
];

// Mapeamento de status de entrega para exibição
const ENTREGA_STATUS_MAP: Record<string, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
  atribuida: { label: 'Atribuída', className: 'bg-blue-100 text-blue-800' },
  em_rota: { label: 'Em Rota', className: 'bg-purple-100 text-purple-800' },
  entregue: { label: 'Entregue', className: 'bg-green-100 text-green-800' },
  cancelada: { label: 'Cancelada', className: 'bg-red-100 text-red-800' },
};

// Mapeamento de forma de pagamento para exibição
const PAGAMENTO_MAP: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  pix: 'PIX',
  boleto: 'Boleto',
  sem_pagamento: 'Sem Pagamento',
};

// Modal com Portal para evitar problemas de renderização
function Modal({ 
  isOpen, 
  onClose, 
  children, 
  title,
  className = '' 
}: { 
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  className?: string;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Fechar ao clicar fora do modal
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  // Só renderizamos o modal se estamos no lado cliente
  if (typeof window === 'undefined') return null;
  
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div 
        ref={modalRef}
        className={`relative max-h-[90vh] overflow-auto rounded-lg bg-white p-6 shadow-lg ${className}`}
      >
        {title && (
          <div className="mb-4 flex justify-between items-center">
            <div>{title}</div>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}

export default function EntregasListaPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [motoristaFilter, setMotoristaFilter] = useState('todos');
  const [dataFilter, setDataFilter] = useState('todas');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [quickViewEntrega, setQuickViewEntrega] = useState<any | null>(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);

  // Filtragem das entregas
  const entregasFiltradas = ENTREGAS_MOCK.filter(entrega => {
    const matchesSearch = 
      entrega.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrega.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrega.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrega.cidade.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'todas' || entrega.status === statusFilter;
    const matchesMotorista = motoristaFilter === 'todos' || 
      (motoristaFilter === 'atribuidas' && entrega.motoristaId) ||
      (motoristaFilter === 'nao-atribuidas' && !entrega.motoristaId) ||
      (entrega.motoristaId === motoristaFilter);
    
    const matchesData = dataFilter === 'todas' || 
      (dataFilter === 'hoje' && entrega.dataEntrega === new Date().toISOString().split('T')[0]) ||
      (dataFilter === 'amanha' && entrega.dataEntrega === new Date(Date.now() + 86400000).toISOString().split('T')[0]) ||
      (dataFilter === 'esta-semana' && entrega.dataEntrega && isThisWeek(new Date(entrega.dataEntrega)));
    
    return matchesSearch && matchesStatus && matchesMotorista && matchesData;
  });

  // Função auxiliar para verificar se uma data está na semana atual
  function isThisWeek(date: Date) {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    return date >= startOfWeek && date <= endOfWeek;
  }

  // Adicionar ou remover filtro rápido
  const toggleFilter = (filterType: string, value: string) => {
    const filterKey = `${filterType}:${value}`;
    
    if (selectedFilters.includes(filterKey)) {
      setSelectedFilters(selectedFilters.filter(f => f !== filterKey));
      
      // Resetar o filtro específico
      if (filterType === 'status') setStatusFilter('todas');
      if (filterType === 'motorista') setMotoristaFilter('todos');
      if (filterType === 'data') setDataFilter('todas');
    } else {
      setSelectedFilters([...selectedFilters.filter(f => !f.startsWith(`${filterType}:`)), filterKey]);
      
      // Aplicar o filtro
      if (filterType === 'status') setStatusFilter(value);
      if (filterType === 'motorista') setMotoristaFilter(value);
      if (filterType === 'data') setDataFilter(value);
    }
  };

  // Remover um filtro específico
  const removeFilter = (filterKey: string) => {
    const [filterType, value] = filterKey.split(':');
    setSelectedFilters(selectedFilters.filter(f => f !== filterKey));
    
    // Resetar o filtro específico
    if (filterType === 'status') setStatusFilter('todas');
    if (filterType === 'motorista') setMotoristaFilter('todos');
    if (filterType === 'data') setDataFilter('todas');
  };

  // Limpar todos os filtros
  const clearAllFilters = () => {
    setSelectedFilters([]);
    setStatusFilter('todas');
    setMotoristaFilter('todos');
    setDataFilter('todas');
    setSearchTerm('');
  };
  
  // Mostrar/esconder mapa  
  const toggleMap = () => {
    setShowMap(!showMap);
  };
  
  // Obter os motoristas únicos das entregas para filtros
  const motoristaSet = new Set<string>();
  const motoristas = ENTREGAS_MOCK
    .filter(e => e.motoristaId && e.motoristaNome)
    .filter(e => {
      // Verificar se já adicionamos este motorista
      const key = `${e.motoristaId}-${e.motoristaNome}`;
      if (!motoristaSet.has(key)) {
        motoristaSet.add(key);
        return true;
      }
      return false;
    })
    .map(e => ({ id: e.motoristaId!, nome: e.motoristaNome! }));

  // Handler para visualização rápida
  const handleQuickView = (entregaId: string) => {
    const entrega = ENTREGAS_MOCK.find(e => e.id === entregaId);
    if (entrega) {
      setQuickViewEntrega(entrega);
    }
  };
  
  // Handler para fechar visualização rápida
  const handleCloseQuickView = () => {
    setQuickViewEntrega(null);
  };
  
  // Handler para ver detalhes
  const verDetalhesEntrega = (entrega: any) => {
    setQuickViewEntrega(entrega);
    setModalDetalhesAberto(true);
  };
  
  // Handler para fechar modal de detalhes
  const fecharModalDetalhes = () => {
    setModalDetalhesAberto(false);
  };

  // Função para agrupar entregas por data
  const agruparEntregasPorData = (entregas: any[]) => {
    // Primeiro ordenar por data
    const entregasOrdenadas = [...entregas].sort((a, b) => {
      if (!a.dataEntrega && !b.dataEntrega) return 0;
      if (!a.dataEntrega) return 1; // Entregas sem data vão para o final
      if (!b.dataEntrega) return -1; // Entregas com data vêm primeiro
      
      return new Date(a.dataEntrega).getTime() - new Date(b.dataEntrega).getTime();
    });
    
    // Depois agrupar por data
    const grupos: Record<string, any[]> = {};
    
    entregasOrdenadas.forEach(entrega => {
      const chave = entrega.dataEntrega || 'sem_data';
      if (!grupos[chave]) {
        grupos[chave] = [];
      }
      grupos[chave].push(entrega);
    });
    
    return grupos;
  };
  
  // Agrupar entregas por data
  const entregasAgrupadas = agruparEntregasPorData(entregasFiltradas);
  
  // Formatar data de grupo para exibição
  const formatarDataGrupo = (dataKey: string) => {
    if (dataKey === 'sem_data') return 'Sem data definida';
    
    const data = new Date(dataKey);
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);
    
    // Verificar se é hoje, amanhã ou outro dia
    if (data.toDateString() === hoje.toDateString()) {
      return `Hoje - ${formatarData(data)}`;
    } else if (data.toDateString() === amanha.toDateString()) {
      return `Amanhã - ${formatarData(data)}`;
    } else {
      return formatarData(data);
    }
  };

  // Função para definir rapidamente o filtro de status
  const setFiltroRapido = (status: string) => {
    if (statusFilter === status) {
      setStatusFilter('todas');
      setSelectedFilters(selectedFilters.filter(f => !f.startsWith('status:')));
    } else {
      setStatusFilter(status);
      setSelectedFilters([
        ...selectedFilters.filter(f => !f.startsWith('status:')), 
        `status:${status}`
      ]);
    }
  };

  return (
    <div className="space-y-4 px-0 sm:px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Lista de Entregas</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Visualize e gerencie todas as entregas</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={toggleMap} 
            variant={showMap ? "default" : "outline"}
            className="flex items-center"
          >
            <Map className="mr-2 h-4 w-4" />
            {showMap ? "Ocultar Mapa" : "Mostrar Mapa"}
          </Button>
          
          <Link href="/dashboard/entregas/rotas/nova">
            <Button className="bg-blue-600 hover:bg-blue-700 flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Nova Entrega
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros rápidos em formato de botões/chips */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm"
          className={`rounded-full ${statusFilter === 'pendente' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}`}
          onClick={() => setFiltroRapido('pendente')}
        >
          <CircleDot className="mr-1 h-3 w-3 text-yellow-500" />
          Aguardando
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          className={`rounded-full ${statusFilter === 'atribuida' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}`}
          onClick={() => setFiltroRapido('atribuida')}
        >
          <User className="mr-1 h-3 w-3 text-blue-500" />
          Atribuída
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          className={`rounded-full ${statusFilter === 'em_rota' ? 'bg-purple-100 text-purple-800 border-purple-200' : ''}`}
          onClick={() => setFiltroRapido('em_rota')}
        >
          <Truck className="mr-1 h-3 w-3 text-purple-500" />
          Em Rota
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          className={`rounded-full ${statusFilter === 'entregue' ? 'bg-green-100 text-green-800 border-green-200' : ''}`}
          onClick={() => setFiltroRapido('entregue')}
        >
          <CheckSquare className="mr-1 h-3 w-3 text-green-500" />
          Entregue
        </Button>

        {selectedFilters.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            className="rounded-full text-blue-600"
            onClick={clearAllFilters}
          >
            <X className="mr-1 h-3 w-3" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Barra de pesquisa e filtros - Sempre visível */}
      <div className="bg-white rounded-lg shadow-sm border sticky top-0 z-10">
        <div className="p-3">
          <div className="flex flex-col space-y-3">
            {/* Pesquisa */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Buscar por cliente, endereço ou pedido..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filtros em linha */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Select value={statusFilter} onValueChange={(value) => toggleFilter('status', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="atribuida">Atribuída</SelectItem>
                  <SelectItem value="em_rota">Em Rota</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={motoristaFilter} onValueChange={(value) => toggleFilter('motorista', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Motorista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os motoristas</SelectItem>
                  <SelectItem value="atribuidas">Com motorista</SelectItem>
                  <SelectItem value="nao-atribuidas">Sem motorista</SelectItem>
                  {motoristas.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={dataFilter} onValueChange={(value) => toggleFilter('data', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as datas</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="amanha">Amanhã</SelectItem>
                  <SelectItem value="esta-semana">Esta semana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtros ativos (chips) */}
            {selectedFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-sm text-gray-500">Filtros ativos:</span>
                {selectedFilters.map((filter) => {
                  const [type, value] = filter.split(':');
                  let label = value;
                  
                  // Exibir rótulos mais amigáveis
                  if (type === 'status') {
                    label = ENTREGA_STATUS_MAP[value]?.label || value;
                  } else if (type === 'motorista') {
                    if (value === 'atribuidas') label = 'Com motorista';
                    else if (value === 'nao-atribuidas') label = 'Sem motorista';
                    else {
                      const motorista = motoristas.find(m => m.id === value);
                      if (motorista) label = motorista.nome;
                    }
                  } else if (type === 'data') {
                    if (value === 'hoje') label = 'Hoje';
                    else if (value === 'amanha') label = 'Amanhã';
                    else if (value === 'esta-semana') label = 'Esta semana';
                  }
                  
                  return (
                    <div 
                      key={filter} 
                      className="flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm"
                    >
                      <span>{label}</span>
                      <button 
                        onClick={() => removeFilter(filter)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mapa (opcional) */}
      {showMap && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-4">
          <div className="p-3 border-b flex justify-between items-center">
            <h2 className="font-medium">Mapa de Entregas</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleMap}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-[400px]">
            <EntregaMap
              enderecos={entregasFiltradas.map(e => `${e.endereco}, ${e.cidade}`)}
              height="100%"
            />
          </div>
        </div>
      )}

      {/* Número de resultados */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Mostrando {entregasFiltradas.length} de {ENTREGAS_MOCK.length} entregas
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Ordenar por:</span>
          <Select defaultValue="data">
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="data">Data de entrega</SelectItem>
              <SelectItem value="cliente">Nome do cliente</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="valor">Valor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Lista de entregas em formato de tabela */}
      {entregasFiltradas.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="w-[120px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entregasFiltradas.map((entrega) => (
                <TableRow key={entrega.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    #{entrega.numeroPedido}
                    {entrega.motoristaNome && (
                      <div className="flex items-center mt-1">
                        <div className="flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs">
                          <Avatar className="h-3 w-3 mr-1">
                            <AvatarFallback className="text-[8px]">
                              {entrega.motoristaNome.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[80px]">{entrega.motoristaNome}</span>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-medium">{entrega.nomeCliente}</div>
                    <div className="text-xs text-gray-500">{entrega.telefoneCliente}</div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm">{entrega.endereco}</div>
                        <div className="text-xs text-gray-500">{entrega.cidade}</div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {entrega.dataEntrega ? (
                      <div>
                        <div className="text-sm">{formatarData(entrega.dataEntrega)}</div>
                        {entrega.horarioMaximo && (
                          <div className="text-xs flex items-center text-amber-600">
                            <Clock className="h-3 w-3 mr-1" />
                            {entrega.horarioMaximo}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Não definida</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={ENTREGA_STATUS_MAP[entrega.status].className}>
                      {ENTREGA_STATUS_MAP[entrega.status].label}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="font-medium text-right">
                    {formatarMoeda(entrega.pagamento?.valor || 
                      entrega.itens.reduce((total, item) => total + (item.preco * item.quantidade), 0))}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => verDetalhesEntrega(entrega)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Excluir"
                      >
                        <Trash className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="py-12 text-center bg-white rounded-lg shadow-sm border">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma entrega encontrada</h3>
          <p className="mt-1 text-gray-500">Tente ajustar os filtros para ver mais resultados.</p>
          <Button
            onClick={clearAllFilters}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Limpar todos os filtros
          </Button>
        </div>
      )}
      
      {/* Modal de detalhes da entrega (QuickLook melhorado) */}
      <Dialog open={modalDetalhesAberto} onOpenChange={fecharModalDetalhes}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">Detalhes da Entrega #{quickViewEntrega?.numeroPedido}</DialogTitle>
                <DialogDescription>
                  {quickViewEntrega?.dataEntrega && (
                    <span className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-1 text-gray-500" /> 
                      {formatarData(quickViewEntrega.dataEntrega)}
                      {quickViewEntrega.horarioMaximo && (
                        <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-800 border-amber-200">
                          Até {quickViewEntrega.horarioMaximo}
                        </Badge>
                      )}
                    </span>
                  )}
                </DialogDescription>
              </div>
              
              {quickViewEntrega && (
                <Badge className={`text-sm px-3 py-1 ${ENTREGA_STATUS_MAP[quickViewEntrega.status].className}`}>
                  {ENTREGA_STATUS_MAP[quickViewEntrega.status].label}
                </Badge>
              )}
            </div>
          </DialogHeader>
          
          {quickViewEntrega && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold flex items-center text-gray-900">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      Informações do Cliente
                    </h3>
                    <div className="mt-3 space-y-3">
                      <div>
                        <div className="text-sm text-gray-500">Nome</div>
                        <div className="font-medium">{quickViewEntrega.nomeCliente}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Telefone</div>
                        <div className="font-medium flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-gray-400" />
                          {quickViewEntrega.telefoneCliente}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold flex items-center text-gray-900">
                      <MapPin className="h-5 w-5 mr-2 text-red-600" />
                      Endereço de Entrega
                    </h3>
                    <div className="mt-3 space-y-1">
                      <div className="font-medium">{quickViewEntrega.endereco}</div>
                      <div className="text-gray-600">{quickViewEntrega.cidade}, {quickViewEntrega.cep}</div>
                    </div>
                    
                    <div className="h-[200px] mt-4 rounded-md overflow-hidden border">
                      <EntregaMap
                        enderecos={[{
                          endereco: quickViewEntrega.endereco,
                          cidade: quickViewEntrega.cidade,
                          cep: quickViewEntrega.cep
                        }]}
                        height="200px"
                        zoom={15}
                      />
                    </div>
                  </div>
                  
                  {quickViewEntrega.motoristaNome && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold flex items-center text-gray-900">
                        <Truck className="h-5 w-5 mr-2 text-purple-600" />
                        Motorista
                      </h3>
                      <div className="mt-3 flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback>
                            {quickViewEntrega.motoristaNome.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{quickViewEntrega.motoristaNome}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold flex items-center text-gray-900">
                      <Package className="h-5 w-5 mr-2 text-gray-800" />
                      Itens do Pedido
                    </h3>
                    <div className="mt-3">
                      {quickViewEntrega.itens && quickViewEntrega.itens.length > 0 ? (
                        <>
                          <div className="max-h-[200px] overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Item</TableHead>
                                  <TableHead className="text-right">Qtd</TableHead>
                                  <TableHead className="text-right">Preço</TableHead>
                                  <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {quickViewEntrega.itens.map((item: any, index: number) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <div className="flex items-center">
                                        <ShoppingBag className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>{item.nome}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">{item.quantidade}</TableCell>
                                    <TableCell className="text-right">{formatarMoeda(item.preco)}</TableCell>
                                    <TableCell className="text-right font-medium">
                                      {formatarMoeda(item.preco * item.quantidade)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <div className="border-t mt-3 pt-3">
                            <div className="flex justify-between items-center text-lg font-bold">
                              <span>Total:</span>
                              <span>
                                {formatarMoeda(quickViewEntrega.pagamento?.valor || 
                                  quickViewEntrega.itens.reduce((total: number, item: any) => 
                                    total + (item.preco * item.quantidade), 0))}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500 text-center py-4">Nenhum item registrado</div>
                      )}
                    </div>
                  </div>
                  
                  {quickViewEntrega.pagamento && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold flex items-center text-gray-900">
                        <ShoppingBag className="h-5 w-5 mr-2 text-green-600" />
                        Informações de Pagamento
                      </h3>
                      <div className="mt-3 grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Forma de Pagamento</div>
                          <div className="font-medium">{PAGAMENTO_MAP[quickViewEntrega.pagamento.forma]}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Valor</div>
                          <div className="font-medium">{formatarMoeda(quickViewEntrega.pagamento.valor)}</div>
                        </div>
                        {quickViewEntrega.pagamento.forma === 'credito' && quickViewEntrega.pagamento.parcelamento && quickViewEntrega.pagamento.parcelamento > 1 && (
                          <div>
                            <div className="text-sm text-gray-500">Parcelamento</div>
                            <div className="font-medium">
                              {quickViewEntrega.pagamento.parcelamento}x de {formatarMoeda(quickViewEntrega.pagamento.valor / quickViewEntrega.pagamento.parcelamento)}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-sm text-gray-500">Status</div>
                          <div className={`font-medium ${quickViewEntrega.pagamento.recebido ? 'text-green-600' : 'text-amber-600'}`}>
                            {quickViewEntrega.pagamento.recebido ? 'Recebido' : 'Pendente'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter className="flex justify-end gap-2 mt-6 border-t pt-4">
                <Button variant="outline" onClick={fecharModalDetalhes}>
                  Fechar
                </Button>
                <Link href={`/dashboard/entregas/detalhe/${quickViewEntrega.id}`}>
                  <Button className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Ver página completa
                  </Button>
                </Link>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 