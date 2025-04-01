'use client';

import { useState } from 'react';
import { useEntregas } from '@/contexts/EntregasContext';
import { StatusEntrega, Entrega } from '@/types/entregas';
import { 
  Search, 
  MapPin, 
  Package, 
  Calendar, 
  Clock, 
  ChevronRight, 
  ShoppingBag, 
  Truck,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

// Componente de confirmação
function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>
        <p className="mb-4 text-gray-600">{message}</p>
        
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Confirmar
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EntregasPendentesPage() {
  const { entregas, motoristas, atribuirEntregaMotorista, loading } = useEntregas();
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [entregaParaAtribuir, setEntregaParaAtribuir] = useState<string | null>(null);

  // Filtra as entregas que estão pendentes (não atribuídas a nenhum motorista)
  const entregasPendentes = entregas.filter(e => 
    e.status === StatusEntrega.PENDENTE && !e.motoristaId
  );

  // Filtra as entregas com base no termo de busca
  const entregasFiltradas = entregasPendentes.filter(entrega =>
    entrega.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entrega.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entrega.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entrega.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abre o modal de confirmação para atribuir entrega
  const confirmAtribuirEntrega = (entregaId: string) => {
    setEntregaParaAtribuir(entregaId);
    setConfirmModalOpen(true);
  };

  // Handler para atribuir uma entrega a si mesmo (motorista logado)
  // Temporariamente vamos usar o primeiro motorista ativo
  const handleAtribuirEntrega = async () => {
    if (!entregaParaAtribuir) return;
    
    try {
      // Aqui no futuro usaremos o ID do motorista logado
      const motoristaAtivo = motoristas.find(m => m.status === 'ativo');
      
      if (!motoristaAtivo) {
        setErrorMessage('Não há motoristas ativos disponíveis');
        setTimeout(() => setErrorMessage(''), 3000);
        setConfirmModalOpen(false);
        return;
      }
      
      await atribuirEntregaMotorista(entregaParaAtribuir, motoristaAtivo.id);
      setSuccessMessage('Entrega atribuída com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setConfirmModalOpen(false);
    } catch (error) {
      setErrorMessage('Erro ao atribuir entrega');
      setTimeout(() => setErrorMessage(''), 3000);
      setConfirmModalOpen(false);
    }
  };

  // Função para renderizar card de entrega
  const renderEntregaCard = (entrega: Entrega) => {
    // Calcular valor total da entrega
    const valorTotal = entrega.pagamento?.valor || 
      entrega.itens.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    
    // Formatar valores
    const formattedValor = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valorTotal);
    
    // Verificar se tem data máxima
    const temDataMaxima = !!entrega.dataMaxima;
    
    return (
      <div key={entrega.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="p-3 border-b">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-sm font-medium text-gray-500">Pedido #{entrega.numeroPedido}</span>
              <h3 className="font-medium text-lg">{entrega.nomeCliente}</h3>
            </div>
            {temDataMaxima && (
              <div className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full flex items-center">
                <Clock size={12} className="mr-1" />
                <span>Agendada</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-3">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-start">
              <MapPin size={18} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm">{entrega.endereco}</p>
                <p className="text-sm text-gray-500">{entrega.cidade}, {entrega.cep}</p>
                {entrega.complemento && (
                  <p className="text-sm text-gray-500">Complemento: {entrega.complemento}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center">
              <Package size={18} className="text-gray-400 mr-2 flex-shrink-0" />
              <span className="text-sm">{entrega.itens.length} {entrega.itens.length === 1 ? 'item' : 'itens'}</span>
            </div>
            
            <div className="flex items-center">
              <ShoppingBag size={18} className="text-gray-400 mr-2 flex-shrink-0" />
              <span className="text-sm">
                {entrega.pagamento && entrega.pagamento.forma !== 'sem_pagamento' 
                  ? `Receber ${formattedValor}` 
                  : 'Sem pagamento'}
              </span>
            </div>
            
            {entrega.pagamento && entrega.pagamento.forma === 'credito' && entrega.pagamento.parcelamento && entrega.pagamento.parcelamento > 1 && (
              <div className="text-sm ml-6">
                <span className="text-gray-500">Parcelamento:</span> {entrega.pagamento.parcelamento}x de {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(entrega.pagamento.valor / entrega.pagamento.parcelamento)}
              </div>
            )}
            
            {entrega.pagamento && entrega.pagamento.forma === 'dinheiro' && (entrega.pagamento.troco ?? 0) > 0 && (
              <div className="text-sm ml-6">
                <span className="text-gray-500">Troco para:</span> {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format((entrega.pagamento.troco ?? 0) + entrega.pagamento.valor)}
              </div>
            )}
            
            {entrega.observacoes && (
              <div className="text-sm border-t pt-2 mt-2">
                <p className="font-medium">Observações:</p>
                <p className="text-gray-600">{entrega.observacoes}</p>
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
          
          <button
            onClick={() => confirmAtribuirEntrega(entrega.id)}
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Truck size={16} className="mr-1" />
            Adicionar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 px-0 sm:px-4 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link 
              href="/dashboard/entregas/minhas"
              className="inline-flex items-center justify-center p-2 text-gray-600 bg-white rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold">Entregas Pendentes</h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Selecione entregas disponíveis para sua rota</p>
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="bg-white rounded-lg shadow-sm border sticky top-0 z-10">
        <div className="p-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por cliente, endereço ou pedido..."
              className="pl-10 pr-4 py-2 text-sm w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mensagens de sucesso ou erro */}
      {successMessage && (
        <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="p-3 bg-red-100 text-red-800 rounded-md text-sm">
          {errorMessage}
        </div>
      )}

      {/* Lista de entregas pendentes */}
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-500">Carregando entregas...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entregasFiltradas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {entregasFiltradas.map(entrega => renderEntregaCard(entrega))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <div className="rounded-full bg-amber-100 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-1">Nenhuma entrega pendente</h3>
              <p className="text-gray-500 text-sm">
                Não há entregas pendentes disponíveis no momento.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmação */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleAtribuirEntrega}
        title="Confirmar atribuição"
        message="Deseja adicionar esta entrega à sua lista de entregas?"
      />
    </div>
  );
} 