'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEntregas } from '@/contexts/EntregasContext';
import { Entrega, StatusEntrega, FormaPagamento } from '@/types/entregas';
import { Motorista } from '@/types/entregas';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Package, 
  ShoppingBag, 
  Truck, 
  Clipboard, 
  CheckCircle, 
  XCircle, 
  Map,
  Edit,
  Camera,
  Pen,
  AlertTriangle,
  Image,
  X,
  Navigation,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SignatureCanvas from 'react-signature-canvas';
import { formatAddressForNavigation } from '@/utils/address';

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

// Componente para captura de assinatura
function AssinaturaCapture({ isVisible, onCapture, onCancel }: { 
  isVisible: boolean; 
  onCapture: (assinaturaUrl: string) => void; 
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isVisible && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.lineWidth = 3;
        context.lineCap = 'round';
        context.strokeStyle = 'black';
      }
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    setLastPosition({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      // Evitar o scroll da página durante o desenho
      e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    context.beginPath();
    context.moveTo(lastPosition.x, lastPosition.y);
    context.lineTo(x, y);
    context.stroke();
    
    setLastPosition({ x, y });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleCapture = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const assinaturaUrl = canvas.toDataURL('image/png');
    onCapture(assinaturaUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md w-full mx-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Capturar Assinatura</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="border rounded-md mb-3 bg-gray-50">
            <canvas
              ref={canvasRef}
              width={300}
              height={200}
              className="w-full touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            />
          </div>
          
          <p className="text-sm text-gray-500 mb-4 text-center">
            Assine no campo acima usando o dedo ou mouse
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="flex-1 px-3 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Limpar
            </button>
            <button
              onClick={handleCapture}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para captura de foto
function FotoCapture({ isVisible, onCapture, onCancel }: {
  isVisible: boolean;
  onCapture: (fotoUrl: string) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          setStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error('Erro ao acessar câmera:', err);
          setError('Não foi possível acessar a câmera. Verifique as permissões.');
        });
    } else {
      // Parar o stream quando o componente for fechado
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const fotoUrl = canvas.toDataURL('image/jpeg');
    
    onCapture(fotoUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md w-full mx-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Capturar Foto</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          {error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          ) : (
            <>
              <div className="bg-black rounded-md mb-3 overflow-hidden">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline
                  className="w-full h-[300px] object-cover"
                />
              </div>
              
              <p className="text-sm text-gray-500 mb-4 text-center">
                Posicione o objeto no centro da tela
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  className="flex-1 px-3 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCapture}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Tirar Foto
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente para confirmação de ações
function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDanger = false
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
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
            className={`flex-1 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 ${
              isDanger 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DetalheEntregaPage() {
  const params = useParams();
  const router = useRouter();
  const entregaId = params.id as string;
  const { getEntrega, updateEntrega, loading, entregas, removerEntregaMotorista } = useEntregas();
  
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [novoStatus, setNovoStatus] = useState<StatusEntrega | null>(null);
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [assinaturaVisible, setAssinaturaVisible] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [fotos, setFotos] = useState<string[]>([]);
  const [fotoVisible, setFotoVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(() => async () => {});
  const [confirmData, setConfirmData] = useState({
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    isDanger: false
  });
  const [navegadorModalAberto, setNavegadorModalAberto] = useState(false);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState('');
  const [proximaEntregaModal, setProximaEntregaModal] = useState(false);
  const [proximaEntrega, setProximaEntrega] = useState<Entrega | null>(null);
  
  // Dependência memoizada para useEffect
  const memoEncontrarProximaEntrega = useCallback(
    () => {
      if (!entrega || !entrega.motoristaId) return null;
      
      // Pegar todas as entregas deste motorista que não estão entregues nem canceladas
      const entregasAtivas = entregas.filter(e => 
        e.motoristaId === entrega.motoristaId && 
        e.id !== entrega.id &&
        e.status !== StatusEntrega.ENTREGUE && 
        e.status !== StatusEntrega.CANCELADA
      );
      
      if (entregasAtivas.length === 0) return null;
      
      // Ordenar por posição na rota, se disponível
      const entregasOrdenadas = [...entregasAtivas].sort((a, b) => {
        // Se ambas têm posição na rota, ordenar por posição
        if (a.posicaoRota !== undefined && b.posicaoRota !== undefined) {
          return a.posicaoRota - b.posicaoRota;
        }
        // Se apenas uma tem posição, priorizar a que tem
        if (a.posicaoRota !== undefined) return -1;
        if (b.posicaoRota !== undefined) return 1;
        
        // Se nenhuma tem posição, ordenar por status (priorizar Em Rota)
        if (a.status === StatusEntrega.EM_ROTA && b.status !== StatusEntrega.EM_ROTA) return -1;
        if (a.status !== StatusEntrega.EM_ROTA && b.status === StatusEntrega.EM_ROTA) return 1;
        
        // Por último, ordenar pela data de criação
        return new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime();
      });
      
      // Retornar a primeira entrega da lista ordenada
      return entregasOrdenadas[0] || null;
    },
    [entrega, entregas]
  );

  useEffect(() => {
    if (entregaId) {
      const entregaData = getEntrega(entregaId);
      if (entregaData) {
        setEntrega(entregaData);
        setNovoStatus(entregaData.status);
        setAssinatura(entregaData.assinatura || null);
        setFotos(entregaData.fotos || []);
        
        // Se a entrega já estiver finalizada e o usuário acessar diretamente esta página,
        // verificar se há uma próxima entrega disponível
        if (entregaData.status === StatusEntrega.ENTREGUE) {
          const proxima = memoEncontrarProximaEntrega();
          if (proxima) {
            setProximaEntrega(proxima);
          }
        }
      } else {
        // Se a entrega não for encontrada, redirecionar para a lista de entregas
        router.push('/dashboard/entregas/minhas');
      }
    }
  }, [entregaId, getEntrega, router, memoEncontrarProximaEntrega]);
  
  // Função para mostrar o modal de confirmação
  const showConfirmation = (
    title: string,
    message: string,
    action: () => Promise<void>,
    isDanger = false,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
  ) => {
    setConfirmData({
      title,
      message,
      confirmText,
      cancelText,
      isDanger
    });
    setConfirmAction(() => action);
    setConfirmModalVisible(true);
  };
  
  // Navegar para a próxima entrega
  const irParaProximaEntrega = () => {
    if (proximaEntrega) {
      router.push(`/dashboard/entregas/detalhe/${proximaEntrega.id}`);
      setProximaEntregaModal(false);
    }
  };
  
  // Handler para alteração de status com confirmação
  const confirmarAlterarStatus = (status: StatusEntrega) => {
    let title = '';
    let message = '';
    
    switch(status) {
      case StatusEntrega.ENTREGUE:
        title = 'Confirmar entrega';
        message = 'Deseja confirmar que a entrega foi realizada com sucesso?';
        break;
      case StatusEntrega.CANCELADA:
        title = 'Cancelar entrega';
        message = 'Tem certeza que deseja cancelar esta entrega?';
        break;
      case StatusEntrega.EM_ROTA:
        title = 'Iniciar entrega';
        message = 'Deseja iniciar esta entrega?';
        break;
      default:
        title = 'Alterar status';
        message = `Deseja alterar o status para "${getStatusLabel(status)}"?`;
    }
    
    const action = async () => {
      await handleAlterarStatus(status);
    };
    
    showConfirmation(
      title, 
      message, 
      action, 
      status === StatusEntrega.CANCELADA
    );
  };
  
  // Handler para alteração de status
  const handleAlterarStatus = async (status: StatusEntrega) => {
    if (!entrega) return;
    
    try {
      // Dados adicionais dependendo do status
      const dadosAdicionais: Partial<Entrega> = { status };
      
      if (status === StatusEntrega.ENTREGUE) {
        dadosAdicionais.dataEntrega = new Date().toISOString();
        
        // Validar se temos assinatura quando necessário
        if (entrega.pagamento && entrega.pagamento.forma !== FormaPagamento.SEM_PAGAMENTO && !assinatura) {
          setMessage({
            text: 'É necessário coletar a assinatura do cliente para confirmar a entrega',
            type: 'error'
          });
          setTimeout(() => setMessage({ text: '', type: '' }), 3000);
          return;
        }
        
        if (assinatura) {
          dadosAdicionais.assinatura = assinatura;
        }
        
        if (fotos.length > 0) {
          dadosAdicionais.fotos = fotos;
        }
      }
      
      // Atualizar o status da entrega
      const entregaAtualizada = await updateEntrega(entrega.id, dadosAdicionais);
      setEntrega(entregaAtualizada);
      setNovoStatus(entregaAtualizada.status);
      
      // Se o status for EM_ROTA, perguntar se quer abrir navegação
      if (status === StatusEntrega.EM_ROTA) {
        const endereco = `${entrega.endereco}, ${entrega.cidade}, ${entrega.cep}`;
        setEnderecoSelecionado(endereco);
        setNavegadorModalAberto(true);
      }
      
      // Se o status for ENTREGUE ou CANCELADA, remover da lista do motorista
      if (status === StatusEntrega.ENTREGUE || status === StatusEntrega.CANCELADA) {
        // Salvar o ID do motorista antes de remover
        const motoristaId = entrega.motoristaId;
        
        // Se o status for ENTREGUE, verificar se há próxima entrega antes de remover
        if (status === StatusEntrega.ENTREGUE) {
          const proxima = memoEncontrarProximaEntrega();
          
          // Remover entrega da lista do motorista
          await removerEntregaMotorista(entrega.id);
          
          // Só após remover, mostrar o modal da próxima entrega
          if (proxima) {
            setProximaEntrega(proxima);
            setProximaEntregaModal(true);
          } else {
            // Se não houver próxima entrega, redirecionar para a lista de entregas
            setTimeout(() => {
              router.push('/dashboard/entregas/minhas');
            }, 1500);
          }
        } else {
          // Se for cancelada, apenas remover
          await removerEntregaMotorista(entrega.id);
        }
      }
      
      setMessage({
        text: 'Status da entrega atualizado com sucesso!',
        type: 'success'
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({
        text: 'Erro ao atualizar status da entrega',
        type: 'error'
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };
  
  // Mostrar assinatura
  const handleShowAssinatura = () => {
    setAssinaturaVisible(true);
  };
  
  // Capturar assinatura
  const handleCaptureAssinatura = (assinaturaUrl: string) => {
    setAssinatura(assinaturaUrl);
    setAssinaturaVisible(false);
    
    setMessage({
      text: 'Assinatura capturada com sucesso!',
      type: 'success'
    });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };
  
  // Mostrar câmera
  const handleShowFoto = () => {
    setFotoVisible(true);
  };
  
  // Capturar foto
  const handleCaptureFoto = (fotoUrl: string) => {
    setFotos(prev => [...prev, fotoUrl]);
    setFotoVisible(false);
    
    setMessage({
      text: 'Foto capturada com sucesso!',
      type: 'success'
    });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };
  
  // Remover foto
  const handleRemoveFoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handler para abrir mapa de navegação
  const handleNavegar = () => {
    if (!entrega) return;
    
    // Formatar endereço para navegação
    const enderecoFormatado = formatAddressForNavigation({
      endereco: entrega.endereco,
      cidade: entrega.cidade,
      cep: entrega.cep
    });
    
    setEnderecoSelecionado(enderecoFormatado);
    setNavegadorModalAberto(true);
  };
  
  // Handler para abrir mapa
  const handleOpenMap = () => {
    if (!entrega) return;
    
    // Formatar endereço para navegação
    const enderecoFormatado = formatAddressForNavigation({
      endereco: entrega.endereco,
      cidade: entrega.cidade,
      cep: entrega.cep
    });
    
    const encodedEndereco = encodeURIComponent(enderecoFormatado);
    
    // Abrir no OpenStreetMap (gratuito)
    window.open(`https://www.openstreetmap.org/search?query=${encodedEndereco}`, '_blank');
  };
  
  // Handler para marcar pagamento como recebido
  const handleReceberPagamento = async () => {
    if (!entrega || !entrega.pagamento) return;
    
    const action = async () => {
      try {
        const dadosPagamento = {
          pagamento: {
            ...entrega.pagamento,
            recebido: true
          }
        };
        
        const entregaAtualizada = await updateEntrega(entrega.id, dadosPagamento);
        setEntrega(entregaAtualizada);
        
        setMessage({
          text: 'Pagamento marcado como recebido!',
          type: 'success'
        });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } catch (error) {
        setMessage({
          text: 'Erro ao atualizar pagamento',
          type: 'error'
        });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    };
    
    showConfirmation(
      'Confirmar pagamento', 
      `Deseja confirmar o recebimento de ${new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(entrega.pagamento.valor)}?`,
      action
    );
  };
  
  if (loading || !entrega) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-2 text-gray-500">Carregando detalhes da entrega...</p>
      </div>
    );
  }

  // Calcular valor total da entrega
  const valorTotal = entrega.pagamento?.valor || 
    entrega.itens.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  
  // Formatar valores
  const formattedValor = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valorTotal);
  
  return (
    <div className="space-y-4 px-0 sm:px-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Link 
          href="/dashboard/entregas/minhas"
          className="inline-flex items-center justify-center p-2 text-gray-600 bg-white rounded-md hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Detalhes da Entrega</h1>
          <p className="text-gray-500 mt-1 text-sm">Pedido #{entrega.numeroPedido}</p>
        </div>
      </div>

      {/* Mensagens */}
      {message.text && (
        <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Coluna 1: Informações principais */}
        <div className="lg:col-span-8 space-y-4">
          {/* Status e ações */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-3 border-b">
              <h2 className="font-medium">Status da entrega</h2>
            </div>
            <div className="p-3">
              <div className="flex flex-wrap gap-2 mb-3">
                <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(entrega.status)}`}>
                  {getStatusLabel(entrega.status)}
                </div>
                
                {entrega.dataMaxima && (
                  <div className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                    Entrega Agendada
                  </div>
                )}
                
                {entrega.pagamento && entrega.pagamento.recebido && (
                  <div className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Pagamento Recebido
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Atualizar status:</h3>
                <div className="flex flex-wrap gap-2">
                  {entrega.status !== StatusEntrega.EM_ROTA && entrega.status !== StatusEntrega.ENTREGUE && entrega.status !== StatusEntrega.CANCELADA && (
                    <button
                      onClick={() => confirmarAlterarStatus(StatusEntrega.EM_ROTA)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1 text-sm font-medium"
                    >
                      <Truck size={16} />
                      Iniciar Entrega
                    </button>
                  )}
                  
                  {entrega.status !== StatusEntrega.ENTREGUE && entrega.status !== StatusEntrega.CANCELADA && (
                    <button
                      onClick={() => confirmarAlterarStatus(StatusEntrega.ENTREGUE)}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1 text-sm font-medium"
                    >
                      <CheckCircle size={16} />
                      Confirmar Entrega
                    </button>
                  )}
                  
                  {entrega.status !== StatusEntrega.CANCELADA && entrega.status !== StatusEntrega.ENTREGUE && (
                    <button
                      onClick={() => confirmarAlterarStatus(StatusEntrega.CANCELADA)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1 text-sm font-medium"
                    >
                      <XCircle size={16} />
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Cliente e endereço */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-3 border-b">
              <h2 className="font-medium">Informações do cliente</h2>
            </div>
            <div className="p-3">
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="rounded-full bg-blue-100 p-1.5 mr-3 flex-shrink-0">
                    <Clipboard className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{entrega.nomeCliente}</div>
                    <div className="text-sm text-gray-500">
                      {entrega.telefoneCliente && (
                        <a href={`tel:${entrega.telefoneCliente}`} className="flex items-center text-gray-500 hover:text-gray-700">
                          <Phone size={14} className="mr-1" />
                          {entrega.telefoneCliente}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="rounded-full bg-blue-100 p-1.5 mr-3 flex-shrink-0">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Endereço</div>
                    <div className="text-sm text-gray-500">
                      {entrega.endereco}<br />
                      {entrega.cidade}, {entrega.cep}
                      {entrega.complemento && <div>Complemento: {entrega.complemento}</div>}
                    </div>
                    <button
                      onClick={handleNavegar}
                      className="mt-2 inline-flex items-center text-blue-600 text-sm hover:text-blue-800"
                    >
                      <Navigation size={16} className="mr-1" />
                      Navegar até o endereço
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Itens da entrega */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-3 border-b">
              <h2 className="font-medium">Itens do pedido</h2>
            </div>
            {entrega.itens.length > 0 ? (
              <div className="p-3">
                <ul className="divide-y">
                  {entrega.itens.map((item, index) => (
                    <li key={index} className="py-2 flex justify-between">
                      <div className="flex items-start">
                        <div className="rounded-full bg-gray-100 p-1.5 mr-3 flex-shrink-0">
                          <Package className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">{item.nome}</div>
                          <div className="text-sm text-gray-500">
                            {item.quantidade} {item.quantidade > 1 ? 'unidades' : 'unidade'} • {item.codigo}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(item.preco * item.quantidade)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.quantidade > 1 ? 
                            `${item.quantidade} x ${new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(item.preco)}` 
                            : ''
                          }
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div className="border-t mt-3 pt-3 flex justify-between items-center">
                  <div className="font-medium text-gray-700">Total</div>
                  <div className="font-bold text-lg">
                    {formattedValor}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                Nenhum item encontrado para esta entrega.
              </div>
            )}
          </div>

          {/* Observações */}
          {entrega.observacoes && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-3 border-b">
                <h2 className="font-medium">Observações</h2>
              </div>
              <div className="p-3">
                <p className="text-gray-700">{entrega.observacoes}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Coluna 2: Ações e informações adicionais */}
        <div className="lg:col-span-4 space-y-4">
          {/* Pagamento */}
          {entrega.pagamento && entrega.pagamento.forma !== FormaPagamento.SEM_PAGAMENTO && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-3 border-b">
                <h2 className="font-medium">Pagamento</h2>
              </div>
              <div className="p-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Forma</span>
                    <span className="font-medium">{getFormaPagamentoLabel(entrega.pagamento.forma)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Valor</span>
                    <span className="font-medium">{new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(entrega.pagamento.valor)}</span>
                  </div>
                  
                  {entrega.pagamento.forma === FormaPagamento.CREDITO && entrega.pagamento.parcelamento && entrega.pagamento.parcelamento > 1 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Parcelamento</span>
                      <span className="font-medium">
                        {entrega.pagamento.parcelamento}x de {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(entrega.pagamento.valor / entrega.pagamento.parcelamento)}
                      </span>
                    </div>
                  )}
                  
                  {entrega.pagamento.forma === FormaPagamento.DINHEIRO && entrega.pagamento.troco && entrega.pagamento.troco > 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Troco para</span>
                        <span className="font-medium">{new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(entrega.pagamento.valor + entrega.pagamento.troco)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Troco</span>
                        <span className="font-medium">{new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(entrega.pagamento.troco)}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-medium ${entrega.pagamento.recebido ? 'text-green-600' : 'text-amber-600'}`}>
                      {entrega.pagamento.recebido ? 'Recebido' : 'Pendente'}
                    </span>
                  </div>
                </div>
                
                {!entrega.pagamento.recebido && entrega.status !== StatusEntrega.CANCELADA && (
                  <button
                    onClick={handleReceberPagamento}
                    className="mt-3 w-full inline-flex items-center justify-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                  >
                    Confirmar Recebimento
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Assinatura */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-3 border-b">
              <h2 className="font-medium">Assinatura do cliente</h2>
            </div>
            <div className="p-3">
              {assinatura ? (
                <div className="border rounded-md p-2 bg-gray-50">
                  <img 
                    src={assinatura} 
                    alt="Assinatura do cliente" 
                    className="w-full h-auto" 
                  />
                </div>
              ) : (
                <div className="text-center p-4 border rounded-md bg-gray-50">
                  <Pen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 text-sm">Nenhuma assinatura registrada</p>
                </div>
              )}
              
              {entrega.status !== StatusEntrega.ENTREGUE && entrega.status !== StatusEntrega.CANCELADA && (
                <button
                  onClick={handleShowAssinatura}
                  className="mt-3 w-full inline-flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                  <Pen className="mr-1 h-4 w-4" />
                  {assinatura ? 'Atualizar Assinatura' : 'Capturar Assinatura'}
                </button>
              )}
            </div>
          </div>
          
          {/* Fotos */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-3 border-b">
              <h2 className="font-medium">Fotos da entrega</h2>
            </div>
            <div className="p-3">
              {fotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {fotos.map((foto, index) => (
                    <div key={index} className="relative border rounded-md overflow-hidden">
                      <img 
                        src={foto} 
                        alt={`Foto ${index + 1}`} 
                        className="w-full h-auto aspect-square object-cover" 
                      />
                      {entrega.status !== StatusEntrega.ENTREGUE && entrega.status !== StatusEntrega.CANCELADA && (
                        <button
                          onClick={() => handleRemoveFoto(index)}
                          className="absolute top-1 right-1 rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 border rounded-md bg-gray-50">
                  <Image className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 text-sm">Nenhuma foto registrada</p>
                </div>
              )}
              
              {entrega.status !== StatusEntrega.ENTREGUE && entrega.status !== StatusEntrega.CANCELADA && (
                <button
                  onClick={handleShowFoto}
                  className="mt-3 w-full inline-flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                  <Camera className="mr-1 h-4 w-4" />
                  Tirar Foto
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Componentes para captura */}
      <AssinaturaCapture 
        isVisible={assinaturaVisible} 
        onCapture={handleCaptureAssinatura} 
        onCancel={() => setAssinaturaVisible(false)} 
      />
      
      <FotoCapture 
        isVisible={fotoVisible}
        onCapture={handleCaptureFoto}
        onCancel={() => setFotoVisible(false)}
      />
      
      <ConfirmationModal 
        isOpen={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        onConfirm={() => {
          setConfirmModalVisible(false);
          confirmAction();
        }}
        title={confirmData.title}
        message={confirmData.message}
        confirmText={confirmData.confirmText}
        cancelText={confirmData.cancelText}
        isDanger={confirmData.isDanger}
      />
      
      <NavegadorModal
        isOpen={navegadorModalAberto}
        onClose={() => setNavegadorModalAberto(false)}
        endereco={enderecoSelecionado}
      />
      
      <ProximaEntregaModal
        isOpen={proximaEntregaModal}
        onClose={() => setProximaEntregaModal(false)}
        proximaEntrega={proximaEntrega}
        onConfirm={irParaProximaEntrega}
      />
    </div>
  );
}

// Funções auxiliares para formatação
function getStatusLabel(status: StatusEntrega): string {
  const labels: Record<string, string> = {
    'pendente': 'Pendente',
    'atribuida': 'Atribuída',
    'em_rota': 'Em Rota',
    'entregue': 'Entregue',
    'cancelada': 'Cancelada',
    'com_problema': 'Com Problema',
  };
  return labels[status] || status;
}

function getStatusColor(status: StatusEntrega): string {
  const colors: Record<string, string> = {
    'pendente': 'bg-yellow-100 text-yellow-800',
    'atribuida': 'bg-blue-100 text-blue-800',
    'em_rota': 'bg-purple-100 text-purple-800',
    'entregue': 'bg-green-100 text-green-800',
    'cancelada': 'bg-red-100 text-red-800',
    'com_problema': 'bg-orange-100 text-orange-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getFormaPagamentoLabel(forma: FormaPagamento): string {
  const labels: Record<string, string> = {
    'dinheiro': 'Dinheiro',
    'credito': 'Cartão de Crédito',
    'debito': 'Cartão de Débito',
    'pix': 'PIX',
    'boleto': 'Boleto',
    'sem_pagamento': 'Sem Pagamento',
  };
  return labels[forma] || forma;
}

// Componente para sugerir próxima entrega
function ProximaEntregaModal({ isOpen, onClose, proximaEntrega, onConfirm }: { 
  isOpen: boolean; 
  onClose: () => void; 
  proximaEntrega: Entrega | null;
  onConfirm: () => void;
}) {
  if (!isOpen || !proximaEntrega) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md w-full mx-auto">
        <div className="p-4 border-b flex justify-between items-center bg-green-50">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-green-800">Entrega concluída!</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <p className="mb-4">Deseja ir para a próxima entrega na sua rota?</p>
          
          <div className="bg-gray-50 p-3 rounded-lg mb-4 border">
            <div className="flex items-start">
              <MapPin size={18} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">{proximaEntrega.nomeCliente}</p>
                <p className="text-sm text-gray-500">{proximaEntrega.endereco}</p>
                <p className="text-sm text-gray-500">{proximaEntrega.cidade}, {proximaEntrega.cep}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Ficar na página atual
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Ir para próxima entrega
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 