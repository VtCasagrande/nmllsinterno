'use client';

import React, { useState, useEffect } from 'react';
import { useTrocas } from '@/contexts/TrocasContext';
import { TrocaStatus, TrocaTipo, Troca } from '@/types/trocas';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Tag,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TrocasPage() {
  const { trocas, getTrocas, updateTrocaStatus, loading, error, filtros, setFiltros } = useTrocas();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [quicklookTroca, setQuicklookTroca] = useState<Troca | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(() => async () => {});
  const [confirmMessage, setConfirmMessage] = useState('');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    dataInicio: '',
    dataFim: '',
    tipo: '',
    status: '',
    lojaParceira: '',
  });
  
  // Carregar trocas ao iniciar
  useEffect(() => {
    const loadData = async () => {
      try {
        await getTrocas();
      } catch (error) {
        console.error('Erro ao carregar trocas:', error);
      }
    };
    
    loadData();
  }, [getTrocas]);
  
  // Aplicar filtro de busca
  const filteredTrocas = trocas.filter((troca) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      troca.ean.toLowerCase().includes(query) ||
      troca.nomeProduto.toLowerCase().includes(query) ||
      troca.lojaParceira.toLowerCase().includes(query) ||
      troca.responsavel.toLowerCase().includes(query)
    );
  });
  
  // Atualizar status da troca (com confirmação)
  const handleUpdateStatus = (id: string, status: TrocaStatus) => {
    const troca = trocas.find(t => t.id === id);
    if (!troca) return;
    
    let mensagem = '';
    
    if (status === TrocaStatus.FINALIZADA) {
      mensagem = 'Finalizar esta troca? Isso não poderá ser desfeito.';
    } else if (status === TrocaStatus.CANCELADA) {
      mensagem = 'Cancelar esta troca? Isso não poderá ser desfeito.';
    } else if (troca.tipo === TrocaTipo.ENVIADA && status === TrocaStatus.AGUARDANDO_DEVOLUCAO) {
      mensagem = 'Marcar esta troca como aguardando devolução?';
    } else if (troca.tipo === TrocaTipo.RECEBIDA && status === TrocaStatus.COLETADO) {
      mensagem = 'Marcar esta troca como coletada?';
    }
    
    setConfirmMessage(mensagem);
    setConfirmAction(() => async () => {
      try {
        const success = await updateTrocaStatus(id, status);
        if (success) {
          toast({
            title: "Status atualizado",
            description: "O status da troca foi atualizado com sucesso",
            variant: "default"
          });
        }
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
        toast({
          title: "Erro ao atualizar status",
          description: "Não foi possível atualizar o status da troca",
          variant: "destructive"
        });
      }
    });
    
    setConfirmDialogOpen(true);
  };
  
  // Exportar trocas como CSV
  const handleExport = async () => {
    try {
      const { exportarTrocas } = useTrocas();
      
      const csvContent = await exportarTrocas({
        tipo: exportFilters.tipo ? exportFilters.tipo as TrocaTipo : undefined,
        status: exportFilters.status ? exportFilters.status as TrocaStatus : undefined,
        lojaParceira: exportFilters.lojaParceira || undefined,
        dataInicio: exportFilters.dataInicio || undefined,
        dataFim: exportFilters.dataFim || undefined,
      });
      
      // Criar blob e link para download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `trocas_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportModalOpen(false);
      toast({
        title: "Exportação concluída",
        description: "O arquivo CSV foi gerado com sucesso",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao exportar trocas:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar as trocas",
        variant: "destructive"
      });
    }
  };
  
  // Obter a cor do status da troca
  const getStatusColor = (tipo: TrocaTipo, status: TrocaStatus): string => {
    if (status === TrocaStatus.FINALIZADA) {
      return 'bg-green-100 text-green-800 border-green-300';
    } else if (status === TrocaStatus.CANCELADA) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    
    if (tipo === TrocaTipo.ENVIADA) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    } else {
      return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };
  
  // Obter o label do status da troca
  const getStatusLabel = (tipo: TrocaTipo, status: TrocaStatus): string => {
    if (status === TrocaStatus.FINALIZADA) {
      return 'Finalizada';
    } else if (status === TrocaStatus.CANCELADA) {
      return 'Cancelada';
    }
    
    if (tipo === TrocaTipo.ENVIADA) {
      if (status === TrocaStatus.AGUARDANDO_DEVOLUCAO) {
        return 'Aguardando Devolução';
      }
    } else {
      if (status === TrocaStatus.COLETADO) {
        return 'Item Coletado';
      }
    }
    
    return status.replace('_', ' ');
  };
  
  // Renderizar a lista de trocas
  const renderTrocasList = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {error}</span>
          <Button 
            variant="outline" 
            onClick={() => getTrocas()}
            className="mt-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
          </Button>
        </div>
      );
    }
    
    if (filteredTrocas.length === 0) {
      return (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <FileText className="mx-auto h-10 w-10 text-gray-400 mb-2" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma troca encontrada</h3>
          <p className="text-gray-500">
            {searchQuery || Object.keys(filtros).length > 0
              ? 'Tente ajustar seus filtros ou critérios de busca'
              : 'Clique em "Nova Troca" para começar'}
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTrocas.map((troca) => (
          <Card key={troca.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{troca.nomeProduto}</CardTitle>
                  <CardDescription>EAN: {troca.ean}</CardDescription>
                </div>
                <div 
                  className={`px-2 py-1 rounded-full text-xs font-medium border 
                  ${getStatusColor(troca.tipo, troca.status)}`}
                >
                  {getStatusLabel(troca.tipo, troca.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo:</span>
                  <span className="font-medium">
                    {troca.tipo === TrocaTipo.ENVIADA ? 'Enviada' : 'Recebida'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Loja:</span>
                  <span className="font-medium">{troca.lojaParceira}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Data:</span>
                  <span className="font-medium">
                    {format(new Date(troca.dataCriacao), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setQuicklookTroca(troca)}
              >
                Visualizar
              </Button>
              <div className="space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/dashboard/trocas/${troca.id}`}>
                    Detalhes
                  </Link>
                </Button>
                {troca.status !== TrocaStatus.FINALIZADA && troca.status !== TrocaStatus.CANCELADA && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(troca.id, TrocaStatus.FINALIZADA)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Finalizar
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
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
          onClick={() => setFiltros(prev => ({ ...prev, tipo: undefined }))}
          className={`px-4 py-2 rounded-md transition-colors ${
            !filtros.tipo 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFiltros(prev => ({ ...prev, tipo: TrocaTipo.ENVIADA }))}
          className={`px-4 py-2 rounded-md transition-colors ${
            filtros.tipo === TrocaTipo.ENVIADA 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Enviadas
        </button>
        <button
          onClick={() => setFiltros(prev => ({ ...prev, tipo: TrocaTipo.RECEBIDA }))}
          className={`px-4 py-2 rounded-md transition-colors ${
            filtros.tipo === TrocaTipo.RECEBIDA 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Recebidas
        </button>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Buscar por EAN, produto, loja..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setExportModalOpen(true)}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => getTrocas()}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Atualizar</span>
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md border">
          <h3 className="font-medium mb-3">Filtros Avançados</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select 
                value={filtros.status || ''} 
                onValueChange={(value) => 
                  setFiltros(prev => ({ 
                    ...prev, 
                    status: value ? value as TrocaStatus : undefined 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value={TrocaStatus.AGUARDANDO_DEVOLUCAO}>Aguardando Devolução</SelectItem>
                  <SelectItem value={TrocaStatus.COLETADO}>Coletado</SelectItem>
                  <SelectItem value={TrocaStatus.FINALIZADA}>Finalizada</SelectItem>
                  <SelectItem value={TrocaStatus.CANCELADA}>Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loja Parceira
              </label>
              <Input 
                placeholder="Digite o nome da loja"
                value={filtros.lojaParceira || ''}
                onChange={(e) => 
                  setFiltros(prev => ({ 
                    ...prev, 
                    lojaParceira: e.target.value || undefined 
                  }))
                }
              />
            </div>
            <div className="md:col-span-1">
              <Button 
                variant="outline" 
                className="mt-6 w-full"
                onClick={() => setFiltros({})}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de trocas */}
      {renderTrocasList()}

      {/* Modal de visualização rápida */}
      <Dialog open={!!quicklookTroca} onOpenChange={(open) => !open && setQuicklookTroca(null)}>
        {quicklookTroca && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{quicklookTroca.nomeProduto}</DialogTitle>
            </DialogHeader>
            
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
            </div>
            
            <DialogFooter>
              <div className="w-full flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => setQuicklookTroca(null)}
                >
                  Fechar
                </Button>
                <Button 
                  variant="default"
                  asChild
                >
                  <Link href={`/dashboard/trocas/${quicklookTroca.id}`}>
                    Ver Detalhes
                  </Link>
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Diálogo de confirmação para ações */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              confirmAction().then(() => setConfirmDialogOpen(false));
            }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de exportação */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Trocas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Inicial
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    type="date"
                    className="pl-10"
                    value={exportFilters.dataInicio}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, dataInicio: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Final
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    type="date"
                    className="pl-10"
                    value={exportFilters.dataFim}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, dataFim: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <Select 
                  value={exportFilters.tipo}
                  onValueChange={(value) => setExportFilters(prev => ({ ...prev, tipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    <SelectItem value={TrocaTipo.ENVIADA}>Enviadas</SelectItem>
                    <SelectItem value={TrocaTipo.RECEBIDA}>Recebidas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select 
                  value={exportFilters.status}
                  onValueChange={(value) => setExportFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value={TrocaStatus.AGUARDANDO_DEVOLUCAO}>Aguardando Devolução</SelectItem>
                    <SelectItem value={TrocaStatus.COLETADO}>Coletado</SelectItem>
                    <SelectItem value={TrocaStatus.FINALIZADA}>Finalizada</SelectItem>
                    <SelectItem value={TrocaStatus.CANCELADA}>Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loja Parceira
              </label>
              <Input 
                placeholder="Digite o nome da loja (opcional)"
                value={exportFilters.lojaParceira}
                onChange={(e) => setExportFilters(prev => ({ ...prev, lojaParceira: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 