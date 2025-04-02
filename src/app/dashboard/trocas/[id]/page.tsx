'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTrocas } from '@/contexts/TrocasContext';
import { Troca, TrocaStatus, TrocaTipo, ComentarioTroca } from '@/types/trocas';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  Edit, 
  Truck, 
  AlertCircle, 
  X, 
  MessageCircle,
  RefreshCw,
  Send
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DetalheTrocaPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { getTrocaById, updateTrocaStatus, addComentario, deleteTroca, error: contextError } = useTrocas();
  const router = useRouter();
  const { toast } = useToast();
  const { profile } = useAuth();
  
  const [troca, setTroca] = useState<Troca | null>(null);
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(() => async () => {});
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Carregar dados da troca
  useEffect(() => {
    const carregarTroca = async () => {
      try {
        setLoading(true);
        const dadosTroca = await getTrocaById(id);
        if (dadosTroca) {
          setTroca(dadosTroca);
        } else {
          toast({
            title: "Troca não encontrada",
            description: "A troca solicitada não foi encontrada",
            variant: "destructive"
          });
          router.push('/dashboard/trocas');
        }
      } catch (err) {
        console.error('Erro ao carregar troca:', err);
        toast({
          title: "Erro ao carregar troca",
          description: "Ocorreu um erro ao buscar os dados da troca",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    carregarTroca();
  }, [id, getTrocaById, router, toast]);

  // Atualizar status da troca
  const handleUpdateStatus = (status: TrocaStatus) => {
    if (!troca) return;
    
    let mensagem = '';
    let titulo = 'Confirmar mudança de status';
    
    if (status === TrocaStatus.FINALIZADA) {
      mensagem = 'Finalizar esta troca? Isso não poderá ser desfeito.';
    } else if (status === TrocaStatus.CANCELADA) {
      mensagem = 'Cancelar esta troca? Isso não poderá ser desfeito.';
      titulo = 'Cancelar troca';
    } else if (troca.tipo === TrocaTipo.ENVIADA && status === TrocaStatus.AGUARDANDO_DEVOLUCAO) {
      mensagem = 'Marcar esta troca como aguardando devolução?';
    } else if (troca.tipo === TrocaTipo.RECEBIDA && status === TrocaStatus.COLETADO) {
      mensagem = 'Marcar esta troca como coletada?';
    }
    
    setConfirmTitle(titulo);
    setConfirmMessage(mensagem);
    setConfirmAction(() => async () => {
      try {
        const success = await updateTrocaStatus(troca.id, status);
        if (success) {
          toast({
            title: "Status atualizado",
            description: "O status da troca foi atualizado com sucesso",
            variant: "default"
          });
          // Atualizar a troca local
          setTroca(prev => prev ? { ...prev, status } : null);
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

  // Excluir troca
  const handleDelete = async () => {
    if (!troca) return;
    
    try {
      const success = await deleteTroca(troca.id);
      if (success) {
        toast({
          title: "Troca excluída",
          description: "A troca foi excluída com sucesso",
          variant: "default"
        });
        router.push('/dashboard/trocas');
      }
    } catch (error) {
      console.error('Erro ao excluir troca:', error);
      toast({
        title: "Erro ao excluir troca",
        description: "Não foi possível excluir a troca",
        variant: "destructive"
      });
    }
  };

  // Adicionar comentário à troca
  const handleAddComentario = async () => {
    if (!troca || !comentarioTexto.trim() || !profile) return;
    
    setEnviandoComentario(true);
    try {
      const success = await addComentario(troca.id, { texto: comentarioTexto });
      if (success) {
        // Recarregar troca para obter o comentário adicionado
        const trocaAtualizada = await getTrocaById(troca.id);
        if (trocaAtualizada) {
          setTroca(trocaAtualizada);
        }
        
        setComentarioTexto('');
        toast({
          title: "Comentário adicionado",
          description: "Seu comentário foi adicionado à troca",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: "Erro ao adicionar comentário",
        description: "Não foi possível adicionar seu comentário",
        variant: "destructive"
      });
    } finally {
      setEnviandoComentario(false);
    }
  };
  
  // Obter o ícone e cor do status
  const getStatusInfo = (status: TrocaStatus) => {
    switch (status) {
      case TrocaStatus.AGUARDANDO_DEVOLUCAO:
        return { 
          icon: <Clock className="w-5 h-5" />, 
          label: 'Aguardando Devolução',
          color: 'bg-orange-100 text-orange-800 border-orange-300'
        };
      case TrocaStatus.COLETADO:
        return { 
          icon: <Truck className="w-5 h-5" />, 
          label: 'Coletado',
          color: 'bg-blue-100 text-blue-800 border-blue-300'
        };
      case TrocaStatus.FINALIZADA:
        return { 
          icon: <Check className="w-5 h-5" />, 
          label: 'Finalizada',
          color: 'bg-green-100 text-green-800 border-green-300'
        };
      case TrocaStatus.CANCELADA:
        return { 
          icon: <AlertCircle className="w-5 h-5" />, 
          label: 'Cancelada',
          color: 'bg-red-100 text-red-800 border-red-300'
        };
      default:
        return { 
          icon: <Clock className="w-5 h-5" />, 
          label: status,
          color: 'bg-gray-100 text-gray-800 border-gray-300'
        };
    }
  };

  // Renderizar ações disponíveis baseadas no tipo e status da troca
  const renderAcoes = () => {
    if (!troca) return null;
    
    // Se a troca já estiver finalizada ou cancelada, não mostrar botões de status
    if (troca.status === TrocaStatus.FINALIZADA || troca.status === TrocaStatus.CANCELADA) {
      return (
        <div className="mt-4 flex flex-col gap-4">
          <Button 
            variant="outline" 
            asChild
          >
            <Link href={`/dashboard/trocas/${troca.id}/editar`}>
              <Edit className="w-4 h-4 mr-2" />
              Editar Detalhes
            </Link>
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <X className="w-4 h-4 mr-2" />
            Excluir Troca
          </Button>
        </div>
      );
    }
    
    return (
      <div className="mt-4 flex flex-col gap-4">
        {troca.tipo === TrocaTipo.ENVIADA && troca.status !== TrocaStatus.AGUARDANDO_DEVOLUCAO && (
          <Button 
            onClick={() => handleUpdateStatus(TrocaStatus.AGUARDANDO_DEVOLUCAO)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Clock className="w-4 h-4 mr-2" />
            Marcar como Aguardando Devolução
          </Button>
        )}
        
        {troca.tipo === TrocaTipo.RECEBIDA && troca.status !== TrocaStatus.COLETADO && (
          <Button 
            onClick={() => handleUpdateStatus(TrocaStatus.COLETADO)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Truck className="w-4 h-4 mr-2" />
            Marcar como Coletado
          </Button>
        )}
        
        <Button 
          onClick={() => handleUpdateStatus(TrocaStatus.FINALIZADA)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="w-4 h-4 mr-2" />
          Finalizar Troca
        </Button>
        
        <Button 
          onClick={() => handleUpdateStatus(TrocaStatus.CANCELADA)}
          variant="destructive"
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar Troca
        </Button>
        
        <Button 
          variant="outline" 
          asChild
        >
          <Link href={`/dashboard/trocas/${troca.id}/editar`}>
            <Edit className="w-4 h-4 mr-2" />
            Editar Detalhes
          </Link>
        </Button>
        
        <Button 
          variant="outline" 
          className="border-red-200 text-red-700 hover:bg-red-50"
          onClick={() => setDeleteConfirmOpen(true)}
        >
          <X className="w-4 h-4 mr-2" />
          Excluir Troca
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/dashboard/trocas" className="text-blue-600 hover:text-blue-800 mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Detalhes da Troca</h1>
        </div>
        
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-gray-500">Carregando detalhes da troca...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!troca) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/dashboard/trocas" className="text-blue-600 hover:text-blue-800 mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Troca não encontrada</h1>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Troca não encontrada</h2>
            <p className="text-gray-500 mb-6">
              Não foi possível encontrar a troca solicitada. Ela pode ter sido removida ou o ID é inválido.
            </p>
            <Button asChild>
              <Link href="/dashboard/trocas">Voltar para lista de trocas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(troca.status);

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/trocas" className="text-blue-600 hover:text-blue-800 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Detalhes da Troca</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{troca.nomeProduto}</CardTitle>
                  <CardDescription>Código EAN: {troca.ean}</CardDescription>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-sm font-medium border flex items-center gap-1.5 ${statusInfo.color}`}>
                  {statusInfo.icon}
                  {statusInfo.label}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Tipo de Troca</h3>
                    <p className="font-medium">
                      {troca.tipo === TrocaTipo.ENVIADA 
                        ? 'Enviada para outra loja' 
                        : 'Recebida de outra loja'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Loja Parceira</h3>
                    <p className="font-medium">{troca.lojaParceira}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Quantidade</h3>
                    <p className="font-medium">{troca.quantidade} {troca.quantidade > 1 ? 'unidades' : 'unidade'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Responsável</h3>
                    <p className="font-medium">{troca.responsavel}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Telefone</h3>
                    <p className="font-medium">{troca.telefoneResponsavel || 'Não informado'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Data de Criação</h3>
                    <p className="font-medium">
                      {format(new Date(troca.dataCriacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Motivo da Troca</h3>
                <p className="bg-gray-50 p-3 rounded-md">{troca.motivo}</p>
              </div>
              
              {troca.observacoes && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Observações Adicionais</h3>
                  <p className="bg-gray-50 p-3 rounded-md">{troca.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Comentários */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Comentários
              </CardTitle>
            </CardHeader>
            <CardContent>
              {troca.comentarios && troca.comentarios.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {troca.comentarios.map((comentario: ComentarioTroca) => (
                    <div key={comentario.id} className="bg-gray-50 p-4 rounded-md">
                      <div className="flex items-center mb-2">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback>
                            {comentario.usuarioNome.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{comentario.usuarioNome}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(comentario.dataCriacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700">{comentario.texto}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum comentário ainda</p>
                </div>
              )}
              
              <div className="mt-4">
                <Textarea
                  placeholder="Adicione um comentário sobre esta troca..."
                  value={comentarioTexto}
                  onChange={(e) => setComentarioTexto(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    onClick={handleAddComentario}
                    disabled={!comentarioTexto.trim() || enviandoComentario}
                  >
                    {enviandoComentario ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Enviar Comentário
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent>
              {renderAcoes()}
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">
                <p className="mb-2">
                  <span className="font-medium">Criada em:</span>{' '}
                  {format(new Date(troca.dataCriacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
                <p className="mb-2">
                  <span className="font-medium">Última atualização:</span>{' '}
                  {format(new Date(troca.dataAtualizacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
                <p>
                  <span className="font-medium">Status atual:</span>{' '}
                  <span className={`inline-flex items-center gap-1 ${statusInfo.color.split(' ')[1]}`}>
                    {statusInfo.icon}
                    {statusInfo.label}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Diálogo de confirmação para ações */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
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
      
      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir troca</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta troca? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 