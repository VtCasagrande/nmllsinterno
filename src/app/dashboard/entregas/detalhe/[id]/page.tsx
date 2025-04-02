'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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
  ChevronRight,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SignatureCanvas from 'react-signature-canvas';
import { formatAddressForNavigation } from '@/utils/address';
import { useToast } from '@/components/ui/use-toast';
import { rotasService } from '@/services/rotasService';
import { Button } from '@/components/ui/button';

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
  onCapture: (file: File) => void;
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
    
    // Converter para blob/file
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Não foi possível processar a imagem');
        return;
      }
      
      // Criar um arquivo a partir do blob
      const file = new File([blob], `foto-${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      // Parar o stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Retornar o arquivo
      onCapture(file);
    }, 'image/jpeg', 0.9);
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

// Componente modal de confirmação
function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
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
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>
        <p className="mb-6 text-gray-600">{message}</p>
        
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-white ${
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente para formulário de finalização de entrega
function FormularioFinalizar({ 
  isVisible, 
  onSubmit, 
  onCancel,
  isLoading = false,
  formState,
  setFormState
}: { 
  isVisible: boolean; 
  onSubmit: () => void; 
  onCancel: () => void;
  isLoading?: boolean;
  formState: {
    responsavel: string;
    observacoes: string;
  };
  setFormState: (state: any) => void;
}) {
  if (!isVisible) return null;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md w-full mx-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Finalizar Entrega</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="responsavel" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do responsável pelo recebimento
              </label>
              <input
                type="text"
                id="responsavel"
                name="responsavel"
                value={formState.responsavel}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Ex: João Silva"
              />
            </div>
            
            <div>
              <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
                Observações (opcional)
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                rows={3}
                value={formState.observacoes}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Informe observações sobre a entrega, se necessário"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-3 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Processando...
                </span>
              ) : (
                'Confirmar Entrega'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DetalhesEntrega() {
  const { id } = useParams();
  const rotaId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [entrega, setEntrega] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proximaEntrega, setProximaEntrega] = useState<any | null>(null);
  const [showProximaEntrega, setShowProximaEntrega] = useState(false);
  const [showAssinatura, setShowAssinatura] = useState(false);
  const [showFoto, setShowFoto] = useState(false);
  const [showNavegador, setShowNavegador] = useState(false);
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmationState, setConfirmationState] = useState({
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    isDanger: false,
    action: () => {}
  });
  const [formFinalizarEntrega, setFormFinalizarEntrega] = useState({
    responsavel: '',
    observacoes: ''
  });
  const [showFormFinalizar, setShowFormFinalizar] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);

  // Carregar entrega via Supabase
  useEffect(() => {
    const carregarEntrega = async () => {
      if (!rotaId) return;
      
      try {
        setLoading(true);
        const entregaData = await rotasService.buscarRotaPorId(rotaId);
        
        if (!entregaData) {
          setError('Entrega não encontrada');
          return;
        }
        
        setEntrega(entregaData);
        
        // Carregar fotos da entrega
        const fotosEntrega = await rotasService.obterFotosEntrega(rotaId);
        setFotos(fotosEntrega);
        
      } catch (err) {
        console.error('Erro ao carregar entrega:', err);
        setError('Erro ao carregar detalhes da entrega');
      } finally {
        setLoading(false);
      }
    };

    carregarEntrega();
    
    // Configurar atualizações em tempo real
    const subscription = rotasService.obterAtualizacoesTempoReal(rotaId, (atualizacao) => {
      // Atualizar o estado da entrega quando houver mudanças
      setEntrega(prevEntrega => {
        if (!prevEntrega) return atualizacao;
        return { ...prevEntrega, ...atualizacao };
      });
    });
    
    return () => {
      // Desinscrever das atualizações em tempo real
      subscription.unsubscribe();
    };
  }, [rotaId]);

  // Atualizar localização do motorista
  useEffect(() => {
    if (!entrega || entrega.status !== 'em_andamento' || !user?.id) return;
    
    let positionWatcher: number | null = null;
    
    const atualizarLocalizacao = () => {
      if (navigator.geolocation) {
        positionWatcher = navigator.geolocation.watchPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              await rotasService.atualizarLocalizacaoEntrega(
                rotaId,
                latitude,
                longitude,
                user.id
              );
            } catch (error) {
              console.error('Erro ao atualizar localização:', error);
            }
          },
          (error) => {
            console.error('Erro ao obter localização:', error);
          },
          { 
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 27000
          }
        );
      }
    };
    
    atualizarLocalizacao();
    
    return () => {
      if (positionWatcher !== null) {
        navigator.geolocation.clearWatch(positionWatcher);
      }
    };
  }, [entrega?.status, rotaId, user?.id]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">Carregando detalhes da entrega...</p>
        </div>
      </div>
    );
  }

  if (error || !entrega) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ocorreu um erro</h2>
          <p className="text-gray-600 mb-4">{error || 'Não foi possível carregar os detalhes da entrega'}</p>
          <Link href="/dashboard/entregas" className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  // Funções para manipulação de assinatura e fotos
  const handleShowAssinatura = () => {
    setShowAssinatura(true);
  };

  const handleCaptureAssinatura = async (assinaturaUrl: string) => {
    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "É necessário estar autenticado para adicionar uma assinatura",
        variant: "destructive"
      });
      return;
    }
    
    setShowAssinatura(false);
    
    try {
      toast({
        title: "Processando assinatura",
        description: "Aguarde enquanto salvamos a assinatura...",
      });
      
      const sucesso = await rotasService.adicionarAssinatura(rotaId, assinaturaUrl, user.id);
      
      if (sucesso) {
        toast({
          title: "Sucesso!",
          description: "Assinatura salva com sucesso",
          variant: "default"
        });
        setAssinatura(assinaturaUrl);
      } else {
        throw new Error("Não foi possível salvar a assinatura");
      }
    } catch (error) {
      console.error("Erro ao capturar assinatura:", error);
      toast({
        title: "Erro ao salvar assinatura",
        description: "Não foi possível salvar a assinatura. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleShowFoto = () => {
    setShowFoto(true);
  };

  const handleCaptureFoto = async (fotoFile: File) => {
    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "É necessário estar autenticado para adicionar uma foto",
        variant: "destructive"
      });
      return;
    }
    
    setShowFoto(false);
    
    try {
      toast({
        title: "Processando foto",
        description: "Aguarde enquanto salvamos a foto...",
      });
      
      const fotoUrl = await rotasService.adicionarFotoEntrega(rotaId, fotoFile, user.id);
      
      if (fotoUrl) {
        toast({
          title: "Sucesso!",
          description: "Foto adicionada com sucesso",
          variant: "default"
        });
        
        // Atualizar a lista de fotos
        setFotos(prev => [fotoUrl, ...prev]);
      } else {
        throw new Error("Não foi possível salvar a foto");
      }
    } catch (error) {
      console.error("Erro ao processar foto:", error);
      toast({
        title: "Erro ao salvar foto",
        description: "Não foi possível salvar a foto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleNavegar = () => {
    setShowNavegador(true);
  };

  const handleFinalizarEntrega = async () => {
    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "É necessário estar autenticado para finalizar a entrega",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setAtualizandoStatus(true);
      toast({
        title: "Processando",
        description: "Finalizando entrega...",
      });
      
      const sucesso = await rotasService.finalizarEntrega(
        rotaId, 
        {
          assinatura: assinatura,
          observacoes: formFinalizarEntrega.observacoes,
          responsavel_recebimento: formFinalizarEntrega.responsavel
        }, 
        user.id
      );
      
      if (sucesso) {
        toast({
          title: "Sucesso!",
          description: "Entrega finalizada com sucesso",
          variant: "default"
        });
        
        // Atualizar o estado local
        setEntrega(prev => ({ ...prev, status: 'concluida' }));
        
        // Verificar próxima entrega na rota
        // Esta lógica poderia ser implementada para mostrar o modal de próxima entrega
      } else {
        throw new Error("Não foi possível finalizar a entrega");
      }
    } catch (error) {
      console.error("Erro ao finalizar entrega:", error);
      toast({
        title: "Erro ao finalizar entrega",
        description: "Não foi possível finalizar a entrega. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setAtualizandoStatus(false);
      setShowFormFinalizar(false);
    }
  };

  const handleAlterarStatus = async (novoStatus: StatusEntrega) => {
    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "É necessário estar autenticado para alterar o status",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar se é uma finalização de entrega
    if (novoStatus === StatusEntrega.ENTREGUE) {
      setShowFormFinalizar(true);
      return;
    }
    
    try {
      setAtualizandoStatus(true);
      
      // Se estiver iniciando a entrega (colocando em rota)
      if (novoStatus === StatusEntrega.EM_ROTA) {
        await rotasService.atualizarStatusRota(rotaId, novoStatus, user.id);
        
        toast({
          title: "Sucesso!",
          description: "Entrega iniciada com sucesso",
          variant: "default"
        });
        
        // Atualizar o estado local
        setEntrega(prev => ({ ...prev, status: novoStatus }));
      } 
      // Se estiver cancelando
      else if (novoStatus === StatusEntrega.CANCELADA) {
        setConfirmationState({
          title: "Cancelar entrega",
          message: "Tem certeza que deseja cancelar esta entrega? Esta ação não pode ser desfeita.",
          confirmText: "Sim, cancelar",
          cancelText: "Não, manter",
          isDanger: true,
          action: async () => {
            try {
              await rotasService.atualizarStatusRota(rotaId, novoStatus, user.id);
              
              toast({
                title: "Entrega cancelada",
                description: "A entrega foi cancelada com sucesso",
                variant: "default"
              });
              
              // Atualizar o estado local
              setEntrega(prev => ({ ...prev, status: novoStatus }));
            } catch (error) {
              console.error("Erro ao cancelar entrega:", error);
              toast({
                title: "Erro ao cancelar",
                description: "Não foi possível cancelar a entrega. Tente novamente.",
                variant: "destructive"
              });
            }
          }
        });
        setConfirmDialogOpen(true);
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status da entrega. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setAtualizandoStatus(false);
    }
  };

  // Renderização do resto da página
  // ... existing code ...

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Resto do seu componente permanece o mesmo */}
    </div>
  );
} 