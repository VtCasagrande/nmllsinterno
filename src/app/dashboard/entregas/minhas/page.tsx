'use client';

import { useState, useEffect } from 'react';
import { useEntregas } from '@/contexts/EntregasContext';
import { Entrega, StatusEntrega, FormaPagamento } from '@/types/entregas';
import { 
  Search, 
  MapPin, 
  Package, 
  Clock, 
  ChevronRight, 
  CheckSquare, 
  XCircle, 
  Menu,
  ArrowDown,
  ArrowUp,
  MoveUp,
  MoveDown,
  Eye,
  X,
  Navigation,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { formatAddressForNavigation } from '@/utils/address';

// Importar o mapa de forma dinâmica para evitar erro de "window is not defined"
const EntregaMap = dynamic(() => import('@/components/EntregaMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full flex items-center justify-center bg-gray-100 rounded-md">
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span>Carregando mapa...</span>
      </div>
    </div>
  )
});

// Mapeamento de status de entrega para exibição
const ENTREGA_STATUS_MAP: Record<StatusEntrega, { label: string, className: string }> = {
  [StatusEntrega.PENDENTE]: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
  [StatusEntrega.ATRIBUIDA]: { label: 'Atribuída', className: 'bg-blue-100 text-blue-800' },
  [StatusEntrega.EM_ROTA]: { label: 'Em Rota', className: 'bg-purple-100 text-purple-800' },
  [StatusEntrega.ENTREGUE]: { label: 'Entregue', className: 'bg-green-100 text-green-800' },
  [StatusEntrega.CANCELADA]: { label: 'Cancelada', className: 'bg-red-100 text-red-800' },
  [StatusEntrega.COM_PROBLEMA]: { label: 'Com Problema', className: 'bg-orange-100 text-orange-800' },
};

// Mapeamento de forma de pagamento para exibição
const PAGAMENTO_MAP: Record<string, string> = {
  [FormaPagamento.DINHEIRO]: 'Dinheiro',
  [FormaPagamento.CREDITO]: 'Cartão de Crédito',
  [FormaPagamento.DEBITO]: 'Cartão de Débito',
  [FormaPagamento.PIX]: 'PIX',
  [FormaPagamento.BOLETO]: 'Boleto',
  [FormaPagamento.SEM_PAGAMENTO]: 'Sem Pagamento',
};

// Componente Modal simplificado
function DetalheEntregaModal({ isOpen, onClose, entrega }: { 
  isOpen: boolean; 
  onClose: () => void; 
  entrega: Entrega | null;
}) {
  if (!isOpen || !entrega) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-6 shadow-lg">
        {/* Cabeçalho */}
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Detalhes da Entrega #{entrega.numeroPedido}</h2>
            <div className="flex items-center gap-2">
              <Badge className={ENTREGA_STATUS_MAP[entrega.status].className}>
                {ENTREGA_STATUS_MAP[entrega.status].label}
              </Badge>
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          {entrega.dataEntrega && (
            <p className="text-sm text-gray-500">Data de entrega: {entrega.dataEntrega}</p>
          )}
        </div>

        {/* Conteúdo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Cliente</h3>
              <p>{entrega.nomeCliente}</p>
              <p>{entrega.telefoneCliente}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">Endereço</h3>
              <p>{entrega.endereco}</p>
              <p>{entrega.cidade}{entrega.cep ? `, ${entrega.cep}` : ''}</p>
            </div>
            
            {entrega.motoristaNome && (
              <div>
                <h3 className="text-lg font-semibold">Motorista</h3>
                <p>{entrega.motoristaNome}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {entrega.itens && entrega.itens.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold">Itens</h3>
                <div className="space-y-2">
                  {entrega.itens.map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.quantidade}x {item.nome}</span>
                      <span>{new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(item.preco)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2 font-bold flex justify-between">
                  <span>Total:</span>
                  <span>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(entrega.itens.reduce((total: number, item: any) => 
                      total + (item.preco * item.quantidade), 0))}
                  </span>
                </div>
              </div>
            )}
            
            {entrega.pagamento && (
              <div>
                <h3 className="text-lg font-semibold">Pagamento</h3>
                {entrega.pagamento.recebido ? (
                  <div className="space-y-1">
                    <p><span className="font-medium">Recebido:</span> {PAGAMENTO_MAP[entrega.pagamento.forma]}</p>
                    <p><span className="font-medium">Valor:</span> {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(entrega.pagamento.valor)}</p>
                  </div>
                ) : (
                  <p>Pendente</p>
                )}
              </div>
            )}
            
            {/* Mini mapa */}
            <div>
              <h3 className="text-lg font-semibold">Localização</h3>
              <div className="h-[200px] mt-2">
                <EntregaMap 
                  enderecos={[`${entrega.endereco}, ${entrega.cidade}${entrega.cep ? `, ${entrega.cep}` : ''}`]}
                  height="200px"
                  zoom={15}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botão de fechar */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente para escolher o app de navegação
function NavegadorModal({ isOpen, onClose, endereco }: { isOpen: boolean, onClose: () => void, endereco: string }) {
  if (!isOpen) return null;
  
  const enderecoFormatado = encodeURIComponent(endereco);
  
  const abrirGoogleMaps = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${enderecoFormatado}`, '_blank');
    onClose();
  };
  
  const abrirWaze = () => {
    window.open(`https://waze.com/ul?q=${enderecoFormatado}&navigate=yes`, '_blank');
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-xs rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Escolha o app de navegação</h2>
        
        <div className="space-y-3">
          <button
            onClick={abrirGoogleMaps}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
          >
            <div className="flex items-center">
              <div className="mr-3 rounded-full bg-blue-100 p-2">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <span>Google Maps</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          
          <button
            onClick={abrirWaze}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
          >
            <div className="flex items-center">
              <div className="mr-3 rounded-full bg-blue-100 p-2">
                <Navigation className="h-5 w-5 text-blue-600" />
              </div>
              <span>Waze</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function MinhasEntregasPage() {
  const { 
    entregas, 
    motoristas, 
    updateEntrega, 
    removerEntregaMotorista, 
    loading, 
    recarregarEntregas 
  } = useEntregas();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [minhasEntregas, setMinhasEntregas] = useState<Entrega[]>([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [modalAberto, setModalAberto] = useState(false);
  const [entregaSelecionada, setEntregaSelecionada] = useState<any>(null);
  const [navegadorModalAberto, setNavegadorModalAberto] = useState(false);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState('');
  
  // Temporariamente usamos o primeiro motorista ativo
  const motoristaAtual = motoristas.find(m => m.status === 'ativo');
  
  useEffect(() => {
    if (motoristaAtual) {
      // Filtrar entregas do motorista atual
      const entregasMotorista = entregas.filter(e => e.motoristaId === motoristaAtual.id);
      
      // Ordenar por posição na rota (se existir) ou por data
      const entregasOrdenadas = [...entregasMotorista].sort((a, b) => {
        // Primeiro por rota e posição
        if (a.rotaId && b.rotaId && a.rotaId === b.rotaId) {
          return (a.posicaoRota || 0) - (b.posicaoRota || 0);
        }
        // Depois por data
        return new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime();
      });
      
      setMinhasEntregas(entregasOrdenadas);
    }
  }, [entregas, motoristaAtual]);
  
  // Filtragem por status e termo de busca
  const entregasFiltradas = minhasEntregas.filter(entrega => {
    const matchesSearch = 
      entrega.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrega.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrega.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrega.cidade.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'todas' || entrega.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Handler para mover entrega para cima na ordem (mantido para compatibilidade)
  const handleMoveUp = async (index: number) => {
    if (index === 0) return; // Já está no topo
    
    const items = Array.from(entregasFiltradas);
    const itemToMove = items[index];
    const newIndex = index - 1;
    
    // Remover o item da posição atual e inserir na nova posição
    items.splice(index, 1);
    items.splice(newIndex, 0, itemToMove);
    
    // Atualizar a ordem no state
    const todasEntregas = [...minhasEntregas];
    
    // Atualizar a posição no estado
    for (let i = 0; i < items.length; i++) {
      const entregaIndex = todasEntregas.findIndex(e => e.id === items[i].id);
      if (entregaIndex !== -1) {
        todasEntregas[entregaIndex] = {
          ...todasEntregas[entregaIndex],
          posicaoRota: i + 1
        };
      }
    }
    
    setMinhasEntregas(todasEntregas);
    
    // Atualizar a posição das entregas no contexto
    try {
      for (let i = 0; i < items.length; i++) {
        await updateEntrega(items[i].id, { posicaoRota: i + 1 });
      }
      
      setMessage({
        text: 'Rota reorganizada com sucesso!',
        type: 'success'
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({
        text: 'Erro ao reorganizar rota',
        type: 'error'
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };
  
  // Handler para mover entrega para baixo na ordem (mantido para compatibilidade)
  const handleMoveDown = async (index: number) => {
    if (index === entregasFiltradas.length - 1) return; // Já está no final
    
    const items = Array.from(entregasFiltradas);
    const itemToMove = items[index];
    const newIndex = index + 1;
    
    // Remover o item da posição atual e inserir na nova posição
    items.splice(index, 1);
    items.splice(newIndex, 0, itemToMove);
    
    // Atualizar a ordem no state
    const todasEntregas = [...minhasEntregas];
    
    // Atualizar a posição no estado
    for (let i = 0; i < items.length; i++) {
      const entregaIndex = todasEntregas.findIndex(e => e.id === items[i].id);
      if (entregaIndex !== -1) {
        todasEntregas[entregaIndex] = {
          ...todasEntregas[entregaIndex],
          posicaoRota: i + 1
        };
      }
    }
    
    setMinhasEntregas(todasEntregas);
    
    // Atualizar a posição das entregas no contexto
    try {
      for (let i = 0; i < items.length; i++) {
        await updateEntrega(items[i].id, { posicaoRota: i + 1 });
      }
      
      setMessage({
        text: 'Rota reorganizada com sucesso!',
        type: 'success'
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({
        text: 'Erro ao reorganizar rota',
        type: 'error'
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };
  
  // Handler para reorganização com drag and drop
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(entregasFiltradas);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Atualizar a ordem no state
    const todasEntregas = [...minhasEntregas];
    
    // Atualizar a posição no estado
    for (let i = 0; i < items.length; i++) {
      const entregaIndex = todasEntregas.findIndex(e => e.id === items[i].id);
      if (entregaIndex !== -1) {
        todasEntregas[entregaIndex] = {
          ...todasEntregas[entregaIndex],
          posicaoRota: i + 1
        };
      }
    }
    
    setMinhasEntregas(todasEntregas);
    
    // Atualizar a posição das entregas no contexto
    try {
      for (let i = 0; i < items.length; i++) {
        await updateEntrega(items[i].id, { posicaoRota: i + 1 });
      }
      
      setMessage({
        text: 'Rota reorganizada com sucesso!',
        type: 'success'
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({
        text: 'Erro ao reorganizar rota',
        type: 'error'
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };
  
  // Handler para iniciar navegação e mostrar o modal de escolha de navegador
  const handleNavegar = (entrega: Entrega) => {
    // Usar o formato correto para navegação
    const enderecoFormatado = formatAddressForNavigation({
      endereco: entrega.endereco,
      cidade: entrega.cidade,
      cep: entrega.cep
    });
    
    setEnderecoSelecionado(enderecoFormatado);
    setNavegadorModalAberto(true);
  };
  
  // Handler para marcar entrega como "Em Rota" e mostrar o modal de navegador
  const handleIniciarEntrega = async (entregaId: string) => {
    try {
      const entrega = entregas.find(e => e.id === entregaId);
      if (!entrega) return;
      
      await updateEntrega(entregaId, { status: StatusEntrega.EM_ROTA });
      
      setMessage({
        text: 'Entrega iniciada!',
        type: 'success'
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      
      // Abrir o modal para escolher o navegador
      handleNavegar(entrega);
    } catch (error) {
      setMessage({
        text: 'Erro ao iniciar entrega',
        type: 'error'
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };
  
  // Handler para otimizar rota automaticamente (mock)
  const handleOtimizarRota = async () => {
    try {
      // No mundo real, aqui seria implementado um algoritmo de otimização de rota
      // Por enquanto, apenas simulamos uma ordenação aleatória
      const entregasEmbaralhadas = [...minhasEntregas]
        .filter(e => e.status !== StatusEntrega.ENTREGUE && e.status !== StatusEntrega.CANCELADA)
        .sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < entregasEmbaralhadas.length; i++) {
        await updateEntrega(entregasEmbaralhadas[i].id, { posicaoRota: i + 1 });
      }
      
      setMessage({
        text: 'Rota otimizada com sucesso!',
        type: 'success'
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({
        text: 'Erro ao otimizar rota',
        type: 'error'
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };
  
  // Handler para devolver entrega (remover motorista)
  const handleDevolverEntrega = async (entregaId: string) => {
    try {
      const success = await removerEntregaMotorista(entregaId);
      
      if (success) {
        setMessage({
          text: 'Entrega devolvida com sucesso',
          type: 'success'
        });
      } else {
        setMessage({
          text: 'Não foi possível devolver esta entrega',
          type: 'error'
        });
      }
      
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({
        text: 'Erro ao devolver entrega',
        type: 'error'
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };
  
  // Função para renderizar card de entrega
  const renderEntregaCard = (entrega: Entrega, index: number) => {
    // Verificar se tem data máxima
    const temDataMaxima = !!entrega.dataMaxima;
    const podeSerMovida = entrega.status !== StatusEntrega.ENTREGUE && entrega.status !== StatusEntrega.CANCELADA;
    
    return (
      <div
        className="bg-white border rounded-lg overflow-hidden shadow-sm"
      >
        <div className="p-3 border-b flex justify-between items-start">
          <div>
            <span className="text-sm font-medium text-gray-500">Pedido #{entrega.numeroPedido}</span>
            <h3 className="font-medium text-lg">{entrega.nomeCliente}</h3>
            <div className="mt-1 flex flex-wrap gap-2">
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entrega.status)}`}>
                {getStatusLabel(entrega.status)}
              </div>
              
              {temDataMaxima && (
                <div className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full flex items-center">
                  <Clock size={10} className="mr-1" />
                  <span>Agendada</span>
                </div>
              )}
              
              {entrega.pagamento && entrega.pagamento.forma !== 'sem_pagamento' && (
                <div className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {getFormaPagamentoLabel(entrega.pagamento.forma)}
                </div>
              )}
            </div>
          </div>
          
          {podeSerMovida && (
            <div className="p-1 rounded-full bg-gray-100 text-gray-600">
              <Menu size={18} />
            </div>
          )}
        </div>
        
        <div className="p-3">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-start">
              <MapPin size={18} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm">{entrega.endereco}</p>
                <p className="text-sm text-gray-500">{entrega.cidade}, {entrega.cep}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Package size={18} className="text-gray-400 mr-2 flex-shrink-0" />
              <span className="text-sm">{entrega.itens.length} {entrega.itens.length === 1 ? 'item' : 'itens'}</span>
            </div>
            
            {entrega.posicaoRota && (
              <div className="flex items-center text-blue-600">
                <span className="text-sm font-medium">Posição na rota: {entrega.posicaoRota}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 border-t flex flex-wrap gap-2 items-center justify-between">
          <Link
            href={`/dashboard/entregas/detalhe/${entrega.id}`}
            className="text-blue-600 text-sm font-medium flex items-center"
          >
            Ver detalhes
            <ChevronRight size={16} className="ml-1" />
          </Link>
          
          <div className="flex gap-2">
            {/* Navegação para qualquer pedido com endereço */}
            <button
              onClick={() => handleNavegar(entrega)}
              className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              title="Navegar até o endereço"
            >
              <Navigation size={16} className="mr-1" />
              Navegar
            </button>
          
            {entrega.status === StatusEntrega.ATRIBUIDA && (
              <button
                onClick={() => handleIniciarEntrega(entrega.id)}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Iniciar
              </button>
            )}
            
            {(entrega.status === StatusEntrega.ATRIBUIDA || entrega.status === StatusEntrega.EM_ROTA) && (
              <button
                onClick={() => handleDevolverEntrega(entrega.id)}
                className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-800 text-sm font-medium rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                title="Devolver esta entrega para a lista de pendentes"
              >
                <XCircle size={16} className="mr-1" />
                Devolver
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const abrirModal = (entrega: any) => {
    setEntregaSelecionada(entrega);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEntregaSelecionada(null);
  };

  return (
    <div className="space-y-6 px-0 sm:px-4 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Minhas Entregas</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            {motoristaAtual 
              ? `Olá ${motoristaAtual.nome}! Aqui estão suas entregas para hoje.` 
              : 'Selecione um motorista para ver suas entregas.'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={recarregarEntregas}
            variant="outline"
            disabled={loading}
            className="flex items-center gap-1"
            size="sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Atualizar
          </Button>
          
          <Button
            onClick={handleOtimizarRota}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading || !motoristaAtual}
          >
            Otimizar Rota
          </Button>
          
          <Link
            href="/dashboard/entregas/pendentes"
            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Package size={16} className="mr-1" />
            Entregas Pendentes
          </Link>
        </div>
      </div>

      {message.text && (
        <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      {/* Pesquisa e filtros */}
      <div className="bg-white rounded-lg shadow-sm border sticky top-0 z-10">
        <div className="p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar entregas..."
                className="pl-10 pr-4 py-2 text-sm w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="py-2 px-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="todas">Todos os status</option>
              <option value={StatusEntrega.ATRIBUIDA}>Atribuída</option>
              <option value={StatusEntrega.EM_ROTA}>Em Rota</option>
              <option value={StatusEntrega.ENTREGUE}>Entregue</option>
              <option value={StatusEntrega.PENDENTE}>Pendente</option>
              <option value={StatusEntrega.CANCELADA}>Cancelada</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Mapa com entregas do motorista - Mostrado apenas em telas maiores */}
      {motoristaAtual && entregasFiltradas.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden hidden md:block">
          <div className="p-3 border-b">
            <h2 className="font-medium">Mapa de Entregas</h2>
          </div>
          <div className="h-[300px]">
            <EntregaMap
              enderecos={entregasFiltradas.map(e => ({
                endereco: e.endereco,
                cidade: e.cidade,
                cep: e.cep
              }))}
              motorista={{
                nome: motoristaAtual.nome,
                veiculo: motoristaAtual.veiculo || "Veículo não especificado",
                placa: motoristaAtual.placaVeiculo || "Sem placa"
              }}
              height="100%"
            />
          </div>
        </div>
      )}

      {/* Lista de entregas com drag and drop */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-3 border-b">
          <h2 className="font-medium flex items-center">
            <Smartphone size={18} className="mr-2 text-gray-500" />
            Lista de Entregas
            <span className="ml-2 text-sm text-gray-500">(arraste para reorganizar)</span>
          </h2>
        </div>

        <div>
          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Carregando entregas...</p>
            </div>
          ) : entregasFiltradas.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="entregas">
                {(provided) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    className="grid grid-cols-1 gap-3 p-3"
                  >
                    {entregasFiltradas.map((entrega, index) => (
                      <Draggable 
                        key={entrega.id} 
                        draggableId={entrega.id} 
                        index={index}
                        isDragDisabled={entrega.status === StatusEntrega.ENTREGUE || entrega.status === StatusEntrega.CANCELADA}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${snapshot.isDragging ? 'opacity-70' : ''}`}
                          >
                            {renderEntregaCard(entrega, index)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">Nenhuma entrega encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalhes */}
      <DetalheEntregaModal
        isOpen={modalAberto}
        onClose={fecharModal}
        entrega={entregaSelecionada}
      />
      
      {/* Modal de escolha de navegador */}
      <NavegadorModal
        isOpen={navegadorModalAberto}
        onClose={() => setNavegadorModalAberto(false)}
        endereco={enderecoSelecionado}
      />
    </div>
  );
}

// Funções auxiliares para formatação
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'pendente': 'Pendente',
    'atribuida': 'Atribuída',
    'em_rota': 'Em Rota',
    'entregue': 'Entregue',
    'cancelada': 'Cancelada',
  };
  return labels[status] || status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'pendente': 'bg-yellow-100 text-yellow-800',
    'atribuida': 'bg-blue-100 text-blue-800',
    'em_rota': 'bg-purple-100 text-purple-800',
    'entregue': 'bg-green-100 text-green-800',
    'cancelada': 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getFormaPagamentoLabel(forma: string): string {
  const labels: Record<string, string> = {
    'dinheiro': 'Dinheiro',
    'credito': 'Cartão de Crédito',
    'debito': 'Cartão de Débito',
    'cartao': 'Cartão',
    'pix': 'PIX',
    'boleto': 'Boleto',
    'sem_pagamento': 'Sem Pagamento',
  };
  return labels[forma] || forma;
} 