'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Camera, Upload, X, ArrowLeft, Save, User, Trash2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { devolucoesService, Devolucao, ItemDevolucao } from '@/services/devolucoesService';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/auth';
import { Spinner } from '@/components/ui/spinner';

export default function EdicaoDevolucaoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [devolucao, setDevolucao] = useState<Devolucao | null>(null);
  const [formData, setFormData] = useState({
    produto: '',
    motivo: '' as 'produto_danificado' | 'produto_incorreto' | 'cliente_desistiu' | 'endereco_nao_encontrado' | 'outro',
    data_recebimento: '',
    hora_recebimento: '',
    observacoes: '',
    pedido_tiny: '',
    nota_fiscal: '',
    produtos: [] as ItemDevolucao[],
    comentarios: [] as {id: string; texto: string; autor: string; data: string}[]
  });
  
  const [fotos, setFotos] = useState<string[]>([]);
  const [newFotos, setNewFotos] = useState<File[]>([]);
  const [previewFotos, setPreviewFotos] = useState<{ url: string; id?: string; isNew?: boolean }[]>([]);
  const [novoProduto, setNovoProduto] = useState({
    id: `temp_${Date.now()}`,
    codigo: '',
    nome: '',
    quantidade: 1
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [uploadingFotos, setUploadingFotos] = useState(false);
  
  // Carregar dados da devolução
  useEffect(() => {
    const carregarDevolucao = async () => {
      if (!id) {
        toast({
          title: "Erro",
          description: "ID da devolução inválido",
          variant: "destructive"
        });
        router.push('/dashboard/devolucoes/acompanhamento');
        return;
      }

      try {
        setIsLoading(true);
        const devolucaoData = await devolucoesService.getDevolucaoById(id);
        
        if (!devolucaoData) {
          toast({
            title: "Erro",
            description: "Devolução não encontrada",
            variant: "destructive"
          });
          router.push('/dashboard/devolucoes/acompanhamento');
          return;
        }
        
        setDevolucao(devolucaoData);
        
        // Extrair data e hora
        const data = new Date(devolucaoData.data);
        const hora = data.toTimeString().split(' ')[0].substring(0, 5);
        
        setFormData({
          produto: devolucaoData.produto || '',
          motivo: devolucaoData.motivo,
          data_recebimento: data.toISOString().split('T')[0],
          hora_recebimento: hora,
          observacoes: devolucaoData.observacoes || '',
          produtos: devolucaoData.produtos || [],
          comentarios: devolucaoData.comentarios || [],
          pedido_tiny: devolucaoData.pedido_tiny || '',
          nota_fiscal: devolucaoData.nota_fiscal || ''
        });
        
        setFotos(devolucaoData.fotos || []);
        setPreviewFotos(
          (devolucaoData.fotos || []).map((foto: string, index: number) => ({
            url: foto,
            id: `foto_${index}`
          }))
        );
      } catch (error) {
        console.error('Erro ao carregar devolução:', error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao carregar os dados da devolução",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      carregarDevolucao();
    }
  }, [id, router, toast, user]);
  
  // Handler para mudanças nos inputs do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro quando o campo for preenchido
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Função para lidar com upload de imagens
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Limite de 5 fotos
      if (fotos.length + newFotos.length + filesArray.length > 5) {
        setErrors(prev => ({ ...prev, fotos: 'Limite máximo de 5 fotos excedido' }));
        return;
      }
      
      // Limpando erros de fotos caso existam
      if (errors.fotos) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.fotos;
          return newErrors;
        });
      }
      
      // Criando URLs para preview
      const newPreviewItems = filesArray.map(file => ({
        url: URL.createObjectURL(file),
        isNew: true,
        id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));
      
      setPreviewFotos(prev => [...prev, ...newPreviewItems]);
      setNewFotos(prev => [...prev, ...filesArray]);
    }
  };

  // Remover foto
  const removerFoto = async (index: number, isNew: boolean = false) => {
    if (isNew) {
      // Remover foto do preview e da lista de novos arquivos
      const newFotoId = previewFotos[index]?.id;
      setPreviewFotos(fotos => fotos.filter((_, i) => i !== index));
      
      if (newFotoId) {
        setNewFotos(prevFotos => prevFotos.filter((_, i) => 
          `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` !== newFotoId
        ));
      }
    } else {
      if (!user) return;
      
      try {
        const fotoUrl = fotos[index];
        const success = await devolucoesService.deleteFoto(fotoUrl);
        
        if (success) {
          setFotos(prevFotos => prevFotos.filter((_, i) => i !== index));
          setPreviewFotos(prevPreviews => prevPreviews.filter((_, i) => i !== index));
          
          toast({
            title: "Sucesso",
            description: "Foto removida com sucesso",
            variant: "success"
          });
        } else {
          throw new Error('Erro ao excluir foto');
        }
      } catch (error) {
        console.error('Erro ao remover foto:', error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao remover a foto",
          variant: "destructive"
        });
      }
    }
  };

  const handleNovoProdutoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNovoProduto(prev => ({
      ...prev,
      [name]: name === 'quantidade' ? parseInt(value) || 1 : value
    }));
  };

  const adicionarProduto = () => {
    if (!novoProduto.codigo || !novoProduto.nome) {
      setErrors(prev => ({
        ...prev,
        produtos: 'Código e nome do produto são obrigatórios'
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      produtos: [
        ...prev.produtos,
        { 
          id: novoProduto.id,
          codigo: novoProduto.codigo,
          nome: novoProduto.nome,
          quantidade: novoProduto.quantidade
        }
      ]
    }));

    // Limpar o formulário
    setNovoProduto({
      id: `temp_${Date.now()}`,
      codigo: '',
      nome: '',
      quantidade: 1
    });

    // Limpar erro
    if (errors.produtos) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.produtos;
        return newErrors;
      });
    }
  };

  const removerProduto = (id: string) => {
    setFormData(prev => ({
      ...prev,
      produtos: prev.produtos.filter(produto => produto.id !== id)
    }));
  };

  // Adicionar comentário
  const adicionarComentario = async (texto: string) => {
    if (!texto.trim() || !user || !devolucao) {
      return;
    }

    try {
      const success = await devolucoesService.addComentario(devolucao.id, texto, user.id);
      
      if (success) {
        // Recarregar a devolução para obter o comentário atualizado
        const devolucaoAtualizada = await devolucoesService.getDevolucaoById(devolucao.id);
        if (devolucaoAtualizada) {
          setDevolucao(devolucaoAtualizada);
          setFormData(prev => ({
            ...prev,
            comentarios: devolucaoAtualizada.comentarios || []
          }));
        }
        
        toast({
          title: "Sucesso",
          description: "Comentário adicionado com sucesso",
          variant: "success"
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar o comentário",
        variant: "destructive"
      });
    }
  };

  // Validar formulário
  const validarFormulario = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.produto) newErrors.produto = 'Produto é obrigatório';
    if (!formData.motivo) newErrors.motivo = 'O motivo da devolução é obrigatório';
    if (!formData.data_recebimento) newErrors.data_recebimento = 'Data de recebimento é obrigatória';
    
    // Validações adicionais para status em_analise
    if (devolucao && (devolucao.status === 'em_analise' || devolucao.status === 'pendente')) {
      if (formData.produtos.length === 0) newErrors.produtos = 'Adicione pelo menos um produto';
    }
    
    // Validações adicionais para status finalizado
    if (devolucao && devolucao.status === 'finalizado') {
      if (!formData.pedido_tiny) newErrors.pedido_tiny = 'O número do pedido Tiny é obrigatório';
      if (!formData.nota_fiscal) newErrors.nota_fiscal = 'O número da nota fiscal é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario() || !user || !devolucao) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      // 1. Atualizar informações básicas da devolução
      await devolucoesService.updateDevolucao(
        devolucao.id, 
        {
          produto: formData.produto,
          motivo: formData.motivo,
          descricao: formData.observacoes,
          data_recebimento: `${formData.data_recebimento}T${formData.hora_recebimento || '00:00'}:00`,
          pedido_tiny: formData.pedido_tiny,
          nota_fiscal: formData.nota_fiscal
        },
        user.id
      );
      
      // 2. Atualizar produtos
      await devolucoesService.updateItens(devolucao.id, formData.produtos, user.id);
      
      // 3. Fazer upload de novas fotos
      if (newFotos.length > 0) {
        setUploadingFotos(true);
        
        for (const foto of newFotos) {
          await devolucoesService.addFoto(devolucao.id, foto, user.id);
        }
        
        setUploadingFotos(false);
        setNewFotos([]);
      }
      
      toast({
        title: "Sucesso",
        description: "Devolução atualizada com sucesso",
        variant: "success"
      });
      
      router.push('/dashboard/devolucoes/acompanhamento');
    } catch (error) {
      console.error('Erro ao atualizar devolução:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar as alterações",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmarSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validarFormulario()) {
      setMostrarConfirmacao(true);
    }
  };
  
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Você precisa estar logado para acessar esta página.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Carregando informações da devolução...</p>
      </div>
    );
  }

  if (!devolucao) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Devolução não encontrada</h2>
        <p className="text-gray-600 mb-4">A devolução que você está procurando não está disponível.</p>
        <Link 
          href="/dashboard/devolucoes/acompanhamento" 
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Voltar para lista de devoluções
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/devolucoes/acompanhamento" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft size={16} className="mr-1" /> Voltar
          </Link>
          <h1 className="text-2xl font-bold">Editar Devolução: {devolucao.codigo}</h1>
        </div>
        <div className="flex gap-2">
          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
            devolucao.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
            devolucao.status === 'em_analise' ? 'bg-blue-100 text-blue-800' :
            devolucao.status === 'finalizado' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {devolucao.status === 'pendente' ? 'Pendente' :
             devolucao.status === 'em_analise' ? 'Em Análise' :
             devolucao.status === 'finalizado' ? 'Finalizado' :
             'Cancelado'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={confirmarSalvar} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium mb-4">Informações da Devolução</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="produto" className="block text-sm font-medium text-gray-700 mb-1">
                  Produto
                </label>
                <input
                  type="text"
                  id="produto"
                  name="produto"
                  value={formData.produto}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.produto ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.produto && (
                  <p className="mt-1 text-sm text-red-600">{errors.produto}</p>
                )}
              </div>

              <div>
                <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo da Devolução
                </label>
                <select
                  id="motivo"
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.motivo ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">Selecione um motivo</option>
                  <option value="produto_danificado">Produto Danificado</option>
                  <option value="produto_incorreto">Produto Incorreto</option>
                  <option value="cliente_desistiu">Cliente Desistiu</option>
                  <option value="endereco_nao_encontrado">Endereço Não Encontrado</option>
                  <option value="outro">Outro</option>
                </select>
                {errors.motivo && (
                  <p className="mt-1 text-sm text-red-600">{errors.motivo}</p>
                )}
              </div>

              <div>
                <label htmlFor="data_recebimento" className="block text-sm font-medium text-gray-700 mb-1">
                  Data do Recebimento
                </label>
                <input
                  type="date"
                  id="data_recebimento"
                  name="data_recebimento"
                  value={formData.data_recebimento}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.data_recebimento ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.data_recebimento && (
                  <p className="mt-1 text-sm text-red-600">{errors.data_recebimento}</p>
                )}
              </div>

              <div>
                <label htmlFor="hora_recebimento" className="block text-sm font-medium text-gray-700 mb-1">
                  Hora do Recebimento
                </label>
                <input
                  type="time"
                  id="hora_recebimento"
                  name="hora_recebimento"
                  value={formData.hora_recebimento}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.hora_recebimento ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.hora_recebimento && (
                  <p className="mt-1 text-sm text-red-600">{errors.hora_recebimento}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  rows={3}
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Observações adicionais sobre a devolução"
                />
              </div>
            </div>
          </div>

          {devolucao.status === 'em_analise' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-medium mb-4">Informações da Análise</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição do Problema
                  </label>
                  <textarea
                    id="descricao"
                    name="descricao"
                    rows={3}
                    value={devolucao.descricao}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva detalhadamente o problema com o produto"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produtos
                  </label>
                  
                  {formData.produtos.length > 0 && (
                    <div className="mb-4 overflow-auto max-h-48">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Código
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Nome
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Qtd
                            </th>
                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {formData.produtos.map(produto => (
                            <tr key={produto.id}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {produto.codigo}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {produto.nome}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {produto.quantidade}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                                <button
                                  type="button"
                                  onClick={() => removerProduto(produto.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-5 gap-2 items-end">
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Código
                      </label>
                      <input
                        type="text"
                        name="codigo"
                        value={novoProduto.codigo}
                        onChange={handleNovoProdutoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nome do Produto
                      </label>
                      <input
                        type="text"
                        name="nome"
                        value={novoProduto.nome}
                        onChange={handleNovoProdutoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Qtd
                      </label>
                      <input
                        type="number"
                        name="quantidade"
                        min="1"
                        value={novoProduto.quantidade}
                        onChange={handleNovoProdutoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={adicionarProduto}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Adicionar Produto
                    </button>
                  </div>
                  {errors.produtos && (
                    <p className="mt-1 text-sm text-red-600">{errors.produtos}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium mb-4">Fotos do Produto</h2>
            
            {errors.fotos && (
              <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{errors.fotos}</p>
            )}
            
            <div className="mb-6">
              <label htmlFor="fotos" className="block text-sm font-medium text-gray-700 mb-1">
                Adicionar Fotos (máximo 5)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="fotos"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                    >
                      <span>Carregar fotos</span>
                      <input
                        id="fotos"
                        name="fotos"
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={handleImageUpload}
                        disabled={previewFotos.length >= 5}
                      />
                    </label>
                    <p className="pl-1">ou arraste e solte</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF até 10MB
                  </p>
                </div>
              </div>
            </div>

            {previewFotos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {previewFotos.map((foto, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-square w-full rounded-md overflow-hidden border border-gray-300">
                      <div className="relative h-full w-full">
                        <Image
                          src={foto.url}
                          alt={`Foto ${index + 1}`}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerFoto(index, foto.isNew)}
                      className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full"
                    >
                      <X size={16} />
                    </button>
                    <p className="mt-1 text-xs text-gray-500 truncate">{foto.id?.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formData.comentarios && formData.comentarios.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-medium mb-4">Histórico de Comentários</h2>
              
              <div className="space-y-4">
                {formData.comentarios.map((comentario) => (
                  <div key={comentario.id} className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 p-2 rounded-full">
                      <User size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{comentario.autor}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(comentario.data).toLocaleDateString('pt-BR')} {new Date(comentario.data).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {comentario.texto}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard/devolucoes/acompanhamento"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} className="mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Modal de confirmação */}
      {mostrarConfirmacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirmar alterações</h3>
            <p className="mb-6">Tem certeza que deseja salvar as alterações na devolução?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMostrarConfirmacao(false)}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" className="mr-2" /> Salvando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 