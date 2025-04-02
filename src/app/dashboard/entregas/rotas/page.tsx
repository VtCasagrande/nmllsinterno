'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash, MapPin, Map, Eye, X, Package, Phone, Calendar, Clock, ShoppingBag, Filter, ChevronDown, Smartphone, ArrowUpDown, MoreHorizontal, ExternalLink, Truck, User, CircleDot, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { rotasService, RotaCompleta } from '@/services/rotasService';
import { useAuth } from '@/contexts/AuthContext';

// Importar o mapa de forma dinâmica para evitar erro de "window is not defined"
const EntregaMap = dynamic(() => import('@/components/EntregaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-gray-500">Carregando mapa...</div>
    </div>
  )
});

// Interface para itens de rota
interface ItemRota {
  id: string;
  nome: string;
  quantidade: number;
  preco?: number;
}

// Interface para pagamento
interface Pagamento {
  forma: string;
  valor: number;
  recebido: boolean;
}

// Interface completa para entregas
interface Entrega {
  id: string;
  numeroPedido: string;
  status: string;
  nomeCliente?: string;
  telefoneCliente?: string;
  endereco: string;
  cidade?: string;
  cep?: string;
  dataEntrega: string;
  horarioMaximo?: string;
  motoristaId?: string | null;
  motoristaNome?: string | null;
  itens: ItemRota[];
  pagamento?: Pagamento;
  codigo: string;
  created_at: string;
  updated_at: string;
  observacoes?: string;
}

// Mapeamento de status de entrega para exibição
const ENTREGA_STATUS_MAP: Record<string, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
  atribuida: { label: 'Atribuída', className: 'bg-blue-100 text-blue-800' },
  em_andamento: { label: 'Em Rota', className: 'bg-purple-100 text-purple-800' },
  concluida: { label: 'Entregue', className: 'bg-green-100 text-green-800' },
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
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [motoristaFilter, setMotoristaFilter] = useState('todos');
  const [dataFilter, setDataFilter] = useState('todas');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [quickViewEntrega, setQuickViewEntrega] = useState<any | null>(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  
  // Estado para as entregas reais do Supabase
  const [entregas, setEntregas] = useState<RotaCompleta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Referência para monitorar se o componente está montado
  const isMounted = useRef(true);
  
  // Carregar entregas do Supabase
  useEffect(() => {
    async function carregarEntregas() {
      setCarregando(true);
      try {
        // Buscar rotas do Supabase
        const rotas = await rotasService.listarRotas();
        
        if (isMounted.current) {
          // Mapear as rotas para o formato esperado pelo componente
          const entregasMapeadas = rotas.map(rota => {
            return {
              id: rota.id,
              codigo: rota.codigo,
              numeroPedido: rota.numero_pedido,
              nomeCliente: rota.nome_cliente,
              telefoneCliente: rota.telefone_cliente,
              endereco: rota.endereco,
              complemento: rota.complemento,
              cidade: rota.cidade,
              estado: rota.estado,
              cep: rota.cep,
              dataEntrega: rota.data_entrega,
              horarioMaximo: rota.horario_maximo,
              status: rota.status || 'pendente',
              observacoes: rota.observacoes,
              motoristaId: rota.motorista_id,
              motoristaNome: rota.motorista?.nome,
              motoristaVeiculo: rota.motorista?.veiculo,
              motoristaPlaca: rota.motorista?.placa,
              itens: rota.itens?.map(item => ({
                id: item.id,
                descricao: item.descricao,
                quantidade: item.quantidade,
                valorUnitario: item.valor_unitario
              })) || [],
              pagamentos: rota.pagamentos?.map(pagto => ({
                id: pagto.id,
                tipo: pagto.tipo,
                valor: pagto.valor,
                parcelado: pagto.parcelado,
                parcelas: pagto.parcelas,
                recebido: pagto.recebido
              })) || []
            };
          });
          
          setEntregas(entregasMapeadas);
          setErro(null);
        }
      } catch (error) {
        if (isMounted.current) {
          console.error('Erro ao carregar entregas:', error);
          setErro('Ocorreu um erro ao carregar as entregas. Tente novamente mais tarde.');
        }
      } finally {
        if (isMounted.current) {
          setCarregando(false);
        }
      }
    }
    
    carregarEntregas();
    
    // Limpeza ao desmontar o componente
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Filtragem das entregas
  const entregasFiltradas = entregas.filter(entrega => {
    const matchesSearch = 
      entrega.numeroPedido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrega.nomeCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrega.endereco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrega.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrega.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrega.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
      
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
  const motoristas = entregas
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
    const entrega = entregas.find(e => e.id === entregaId);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Entregas</h1>
          <p className="text-gray-500 mt-1">Gerencie as rotas de entrega</p>
        </div>
        
        <Link 
          href="/dashboard/entregas/rotas/nova"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Nova Entrega
        </Link>
      </div>
      
      <div className="bg-white shadow-sm border rounded-lg">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Buscar por pedido, cliente ou endereço..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Filter size={16} />
                    Filtros
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2 space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Status</p>
                      <div className="space-y-1">
                        {Object.entries(ENTREGA_STATUS_MAP).map(([status, { label }]) => (
                          <div 
                            key={status} 
                            className="flex items-center space-x-2"
                          >
                            <input 
                              type="checkbox" 
                              id={`status-${status}`}
                              checked={statusFilter === status}
                              onChange={() => toggleFilter('status', status)}
                              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <label 
                              htmlFor={`status-${status}`}
                              className="text-sm"
                            >
                              {label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Motorista</p>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="motorista-atribuidas"
                            checked={motoristaFilter === 'atribuidas'}
                            onChange={() => toggleFilter('motorista', 'atribuidas')}
                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <label 
                            htmlFor="motorista-atribuidas"
                            className="text-sm"
                          >
                            Com motorista
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="motorista-nao-atribuidas"
                            checked={motoristaFilter === 'nao-atribuidas'}
                            onChange={() => toggleFilter('motorista', 'nao-atribuidas')}
                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <label 
                            htmlFor="motorista-nao-atribuidas"
                            className="text-sm"
                          >
                            Sem motorista
                          </label>
                        </div>
                        {motoristas.map(motorista => (
                          <div 
                            key={motorista.id} 
                            className="flex items-center space-x-2"
                          >
                            <input 
                              type="checkbox" 
                              id={`motorista-${motorista.id}`}
                              checked={motoristaFilter === motorista.id}
                              onChange={() => toggleFilter('motorista', motorista.id)}
                              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <label 
                              htmlFor={`motorista-${motorista.id}`}
                              className="text-sm"
                            >
                              {motorista.nome}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Data</p>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="data-hoje"
                            checked={dataFilter === 'hoje'}
                            onChange={() => toggleFilter('data', 'hoje')}
                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <label 
                            htmlFor="data-hoje"
                            className="text-sm"
                          >
                            Hoje
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="data-amanha"
                            checked={dataFilter === 'amanha'}
                            onChange={() => toggleFilter('data', 'amanha')}
                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <label 
                            htmlFor="data-amanha"
                            className="text-sm"
                          >
                            Amanhã
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="data-esta-semana"
                            checked={dataFilter === 'esta-semana'}
                            onChange={() => toggleFilter('data', 'esta-semana')}
                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <label 
                            htmlFor="data-esta-semana"
                            className="text-sm"
                          >
                            Esta semana
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="outline" 
                size="sm"
                onClick={toggleMap}
              >
                {showMap ? <Map size={16} /> : <MapPin size={16} />}
                {showMap ? 'Esconder Mapa' : 'Ver Mapa'}
              </Button>
            </div>
          </div>
          
          {/* Filtros selecionados */}
          {selectedFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="text-sm text-gray-600">Filtros:</div>
              {selectedFilters.map(filterKey => {
                const [type, value] = filterKey.split(':');
                let label = value;
                
                if (type === 'status' && ENTREGA_STATUS_MAP[value]) {
                  label = ENTREGA_STATUS_MAP[value].label;
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
                  <Badge 
                    key={filterKey}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {label}
                    <button 
                      onClick={() => removeFilter(filterKey)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      <X size={14} />
                    </button>
                  </Badge>
                );
              })}
              <button 
                onClick={clearAllFilters}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Limpar todos
              </button>
            </div>
          )}
        </div>
        
        {/* Estatísticas resumidas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 border-b">
          <Card className="border-l-4 border-l-yellow-400">
            <CardContent className="p-3">
              <p className="text-sm text-gray-500">Pendentes</p>
              <p className="text-xl font-bold">{entregas.filter(e => e.status === 'pendente').length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-400">
            <CardContent className="p-3">
              <p className="text-sm text-gray-500">Atribuídas</p>
              <p className="text-xl font-bold">{entregas.filter(e => e.status === 'atribuida').length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-400">
            <CardContent className="p-3">
              <p className="text-sm text-gray-500">Em Rota</p>
              <p className="text-xl font-bold">{entregas.filter(e => e.status === 'em_andamento').length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-400">
            <CardContent className="p-3">
              <p className="text-sm text-gray-500">Concluídas</p>
              <p className="text-xl font-bold">{entregas.filter(e => e.status === 'concluida').length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-400">
            <CardContent className="p-3">
              <p className="text-sm text-gray-500">Canceladas</p>
              <p className="text-xl font-bold">{entregas.filter(e => e.status === 'cancelada').length}</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Estado de carregamento e erro */}
        {carregando && (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Carregando entregas...</p>
          </div>
        )}
        
        {erro && !carregando && (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100 text-red-600">
              <X size={24} />
            </div>
            <p className="mt-4 text-red-600">{erro}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-blue-600 hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        )}
        
        {/* Lista de entregas vazia */}
        {!carregando && !erro && entregasFiltradas.length === 0 && (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 text-gray-600">
              <Package size={24} />
            </div>
            {selectedFilters.length > 0 || searchTerm ? (
              <>
                <p className="mt-4 text-gray-600">Nenhuma entrega encontrada com os filtros atuais.</p>
                <button 
                  onClick={clearAllFilters} 
                  className="mt-2 text-blue-600 hover:underline"
                >
                  Limpar filtros
                </button>
              </>
            ) : (
              <>
                <p className="mt-4 text-gray-600">Nenhuma entrega cadastrada.</p>
                <Link 
                  href="/dashboard/entregas/rotas/nova" 
                  className="mt-2 text-blue-600 hover:underline"
                >
                  Criar uma nova entrega
                </Link>
              </>
            )}
          </div>
        )}
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
          Mostrando {entregasFiltradas.length} de {entregas.length} entregas
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
      
      {/* Lista de entregas por data */}
      {!carregando && !erro && entregasFiltradas.length > 0 && (
        <div className="divide-y">
          {Object.entries(entregasAgrupadas).map(([dataKey, entregasGrupo]) => (
            <div key={dataKey} className="py-4">
              <div className="px-4 pb-2">
                <h3 className="text-lg font-semibold text-gray-700">
                  {formatarDataGrupo(dataKey)}
                </h3>
                <p className="text-sm text-gray-500">{entregasGrupo.length} entregas</p>
              </div>
              
              <div className="overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Endereço
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Motorista
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entregasGrupo.map((entrega) => {
                      const { label: statusLabel, bgColor, textColor } = ENTREGA_STATUS_MAP[entrega.status] || ENTREGA_STATUS_MAP['pendente'];
                      const pagamentoInfo = entrega.pagamentos && entrega.pagamentos.length > 0 
                        ? entrega.pagamentos.reduce((total, pgto) => total + pgto.valor, 0) 
                        : 0;
                      
                      return (
                        <tr 
                          key={entrega.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => verDetalhesEntrega(entrega)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {entrega.codigo || entrega.numeroPedido || `#${entrega.id?.substring(0, 6)}`}
                            </div>
                            {entrega.numeroPedido && entrega.numeroPedido !== entrega.codigo && (
                              <div className="text-xs text-gray-500">
                                Pedido: {entrega.numeroPedido}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{entrega.nomeCliente}</div>
                            {entrega.telefoneCliente && (
                              <div className="text-xs text-gray-500">{entrega.telefoneCliente}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              {entrega.endereco}
                            </div>
                            {entrega.cidade && (
                              <div className="text-xs text-gray-500">
                                {entrega.cidade} {entrega.estado && `, ${entrega.estado}`}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span 
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {entrega.motoristaNome ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {entrega.motoristaNome}
                                </div>
                                {entrega.motoristaVeiculo && (
                                  <div className="text-xs text-gray-500">
                                    {entrega.motoristaVeiculo} {entrega.motoristaPlaca && `- ${entrega.motoristaPlaca}`}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Não atribuído</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {pagamentoInfo > 0 ? formatarMoeda(pagamentoInfo) : 'N/A'}
                            </div>
                            {entrega.pagamentos && entrega.pagamentos.length > 0 && (
                              <div className="text-xs text-gray-500">
                                {entrega.pagamentos[0].tipo === 'dinheiro' ? 'Dinheiro' : 'Cartão'}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  verDetalhesEntrega(entrega);
                                }}
                              >
                                <Eye size={16} className="text-gray-500" />
                              </Button>
                              
                              <Link
                                href={`/dashboard/entregas/rotas/${entrega.id}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit size={16} className="text-gray-500" />
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
         Mostrando {entregasFiltradas.length} de {entregas.length} entregas
        </div>
        
        {/* Paginação - para implementação futura */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline" 
            size="sm" 
            disabled
            className="text-xs"
          >
            <ChevronLeft size={14} className="mr-1" />
            Anterior
          </Button>
          <div className="text-sm font-medium">Página 1</div>
          <Button
            variant="outline" 
            size="sm" 
            disabled
            className="text-xs"
          >
            Próxima
            <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>
      
      {/* Visualização rápida */}
      {quickViewEntrega && !modalDetalhesAberto && (
        <div className="fixed right-4 bottom-4 w-80 bg-white rounded-lg shadow-lg border overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-medium text-sm">
              Entrega {quickViewEntrega.codigo || `#${quickViewEntrega.id?.substring(0, 6)}`}
            </h3>
            <button 
              onClick={handleCloseQuickView}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="p-4 space-y-3">
            <div>
              <div className="text-xs text-gray-500">Cliente</div>
              <div className="font-medium">{quickViewEntrega.nomeCliente}</div>
            </div>
            
            <div>
              <div className="text-xs text-gray-500">Endereço</div>
              <div className="font-medium">{quickViewEntrega.endereco}</div>
              {quickViewEntrega.cidade && (
                <div className="text-sm">{quickViewEntrega.cidade}, {quickViewEntrega.estado}</div>
              )}
            </div>
            
            {quickViewEntrega.motoristaId && (
              <div>
                <div className="text-xs text-gray-500">Motorista</div>
                <div className="font-medium">{quickViewEntrega.motoristaNome}</div>
                {quickViewEntrega.motoristaVeiculo && (
                  <div className="text-sm">{quickViewEntrega.motoristaVeiculo} - {quickViewEntrega.motoristaPlaca}</div>
                )}
              </div>
            )}
            
            <div className="pt-2 flex justify-end space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCloseQuickView}
              >
                Fechar
              </Button>
              <Button 
                size="sm"
                onClick={() => {
                  setModalDetalhesAberto(true);
                }}
              >
                Ver Detalhes
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de detalhes completos */}
      {modalDetalhesAberto && quickViewEntrega && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-3xl">
            <div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">
                  Detalhes da Entrega {quickViewEntrega.codigo || `#${quickViewEntrega.id?.substring(0, 6)}`}
                </h2>
                <p className="text-sm text-gray-500">
                  {quickViewEntrega.dataEntrega && formatarData(new Date(quickViewEntrega.dataEntrega))}
                </p>
              </div>
              <Button 
                variant="ghost" 
                onClick={fecharModalDetalhes}
                className="h-8 w-8 p-0"
              >
                <X size={18} />
              </Button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                    <div>
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ENTREGA_STATUS_MAP[quickViewEntrega.status]?.bgColor} ${ENTREGA_STATUS_MAP[quickViewEntrega.status]?.textColor}`}
                      >
                        {ENTREGA_STATUS_MAP[quickViewEntrega.status]?.label}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Cliente</h3>
                    <div className="font-medium">{quickViewEntrega.nomeCliente}</div>
                    {quickViewEntrega.telefoneCliente && (
                      <div className="text-sm">{quickViewEntrega.telefoneCliente}</div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Endereço de Entrega</h3>
                    <div className="font-medium">{quickViewEntrega.endereco}</div>
                    {quickViewEntrega.cidade && (
                      <div className="text-sm">
                        {quickViewEntrega.cidade}{quickViewEntrega.estado ? `, ${quickViewEntrega.estado}` : ''}
                      </div>
                    )}
                    {quickViewEntrega.complemento && (
                      <div className="text-sm italic">
                        {quickViewEntrega.complemento}
                      </div>
                    )}
                  </div>
                  
                  {quickViewEntrega.motoristaNome && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Motorista</h3>
                      <div className="font-medium">{quickViewEntrega.motoristaNome}</div>
                      {quickViewEntrega.motoristaVeiculo && (
                        <div className="text-sm">
                          {quickViewEntrega.motoristaVeiculo} 
                          {quickViewEntrega.motoristaPlaca && ` - ${quickViewEntrega.motoristaPlaca}`}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {quickViewEntrega.observacoes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Observações</h3>
                      <div className="text-sm p-2 bg-gray-50 rounded border">
                        {quickViewEntrega.observacoes}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {quickViewEntrega.itens && quickViewEntrega.itens.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Itens</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Item
                              </th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Qtd
                              </th>
                              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Valor
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {quickViewEntrega.itens.map((item, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                  {item.descricao}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                  {item.quantidade}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                                  {formatarMoeda(item.valorUnitario * item.quantidade)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td colSpan={2} className="px-3 py-2 whitespace-nowrap text-sm font-medium text-right">
                                Total:
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-right">
                                {formatarMoeda(quickViewEntrega.itens.reduce(
                                  (total, item) => total + (item.valorUnitario * item.quantidade), 0
                                ))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {quickViewEntrega.pagamentos && quickViewEntrega.pagamentos.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Pagamento</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Método
                              </th>
                              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Valor
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {quickViewEntrega.pagamentos.map((pagamento, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                  {pagamento.tipo === 'dinheiro' ? 'Dinheiro' : 'Cartão'}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                                  {formatarMoeda(pagamento.valor)}
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
            
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
              <Link href={`/dashboard/entregas/rotas/${quickViewEntrega.id}`}>
                <Button variant="outline">
                  <Edit size={16} className="mr-2" />
                  Editar
                </Button>
              </Link>
              <Button 
                onClick={fecharModalDetalhes}
                variant="default"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mapa de todas as entregas */}
      {showMap && !carregando && !erro && entregasFiltradas.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 h-[300px] bg-white rounded-lg shadow-lg border overflow-hidden z-20">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b">
            <h3 className="font-medium">Mapa de Entregas</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleMap}
              className="h-7 w-7 p-0"
            >
              <X size={16} />
            </Button>
          </div>
          
          <div className="h-[255px]">
            <EntregaMap 
              enderecos={entregasFiltradas.map(e => ({
                id: e.id,
                endereco: e.endereco,
                cidade: e.cidade,
                cep: e.cep,
                status: ENTREGA_STATUS_MAP[e.status].label,
                cliente: e.nomeCliente
              }))}
              height="100%"
              zoom={12}
            />
          </div>
        </div>
      )}
    </div>
  );
}