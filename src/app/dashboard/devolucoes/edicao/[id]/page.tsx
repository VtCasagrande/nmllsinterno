'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Camera, Upload, X, ArrowLeft, Save, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Importamos os dados mockados temporariamente
// Em um sistema real, faríamos a busca via API
import { DEVOLUCOES_MOCK } from '../../acompanhamento/page';

export default function EdicaoDevolucaoPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  
  const [isLoading, setIsLoading] = useState(true);
  const [devolucao, setDevolucao] = useState<any>(null);
  const [formData, setFormData] = useState({
    responsavel: '',
    responsavel_recebimento: '',
    data_recebimento: '',
    hora_recebimento: '',
    observacoes: '',
    produtos: [] as any[],
    motivo: '',
    descricao: '',
    comentarios: [] as any[]
  });
  
  const [fotos, setFotos] = useState<string[]>([]);
  const [previewFotos, setPreviewFotos] = useState<{ url: string; name: string }[]>([]);
  const [novoProduto, setNovoProduto] = useState({
    codigo: '',
    nome: '',
    quantidade: 1
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  
  // Carregar dados da devolução
  useEffect(() => {
    // Em um sistema real, faríamos uma chamada à API
    const devolucaoEncontrada = DEVOLUCOES_MOCK.find(dev => dev.id === id);
    
    if (devolucaoEncontrada) {
      setDevolucao(devolucaoEncontrada);
      
      // Extrair data e hora
      const data = new Date(devolucaoEncontrada.data);
      
      setFormData({
        responsavel: devolucaoEncontrada.responsavel || '',
        responsavel_recebimento: devolucaoEncontrada.responsavel_recebimento || '',
        data_recebimento: data.toISOString().split('T')[0],
        hora_recebimento: data.toTimeString().split(' ')[0].substring(0, 5),
        observacoes: devolucaoEncontrada.observacoes || '',
        produtos: [...(devolucaoEncontrada.produtos || [])],
        motivo: devolucaoEncontrada.motivo || '',
        descricao: devolucaoEncontrada.descricao || '',
        comentarios: [...(devolucaoEncontrada.comentarios || [])]
      });
      
      setFotos(devolucaoEncontrada.fotos || []);
      setPreviewFotos(
        (devolucaoEncontrada.fotos || []).map((foto: string) => ({
          url: foto, // Em um sistema real, essa seria a URL completa
          name: foto
        }))
      );
    }
    
    setIsLoading(false);
  }, [id]);
  
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
      if (fotos.length + filesArray.length > 5) {
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
      const newPreviewFotos = filesArray.map(file => ({
        url: URL.createObjectURL(file),
        name: file.name
      }));
      
      setPreviewFotos(prev => [...prev, ...newPreviewFotos]);
      setFotos(prev => [...prev, ...filesArray.map(file => file.name)]);
    }
  };

  // Remover foto
  const removerFoto = (index: number) => {
    setPreviewFotos(fotos => fotos.filter((_, i) => i !== index));
    setFotos(fotos => fotos.filter((_, i) => i !== index));
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
          id: prev.produtos.length > 0 ? Math.max(...prev.produtos.map(p => p.id)) + 1 : 1,
          codigo: novoProduto.codigo,
          nome: novoProduto.nome,
          quantidade: novoProduto.quantidade
        }
      ]
    }));

    // Limpar o formulário
    setNovoProduto({
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

  const removerProduto = (id: number) => {
    setFormData(prev => ({
      ...prev,
      produtos: prev.produtos.filter(produto => produto.id !== id)
    }));
  };

  // Validar formulário
  const validarFormulario = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.responsavel) newErrors.responsavel = 'Responsável pelo registro é obrigatório';
    if (!formData.responsavel_recebimento) newErrors.responsavel_recebimento = 'Responsável pelo recebimento é obrigatório';
    if (!formData.data_recebimento) newErrors.data_recebimento = 'Data de recebimento é obrigatória';
    if (!formData.hora_recebimento) newErrors.hora_recebimento = 'Hora de recebimento é obrigatória';
    if (fotos.length === 0) newErrors.fotos = 'Pelo menos uma foto da devolução é obrigatória';
    
    // Validações adicionais para status em_analise
    if (devolucao && devolucao.status === 'em_analise') {
      if (!formData.motivo) newErrors.motivo = 'O motivo da devolução é obrigatório';
      if (formData.produtos.length === 0) newErrors.produtos = 'Adicione pelo menos um produto';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Montando o objeto de devolução atualizado
      const devolucaoAtualizada = {
        ...devolucao,
        responsavel: formData.responsavel,
        responsavel_recebimento: formData.responsavel_recebimento,
        data: `${formData.data_recebimento}T${formData.hora_recebimento}:00`,
        observacoes: formData.observacoes,
        fotos: fotos,
        motivo: formData.motivo,
        descricao: formData.descricao,
        produtos: formData.produtos,
        comentarios: formData.comentarios
      };
      
      // Encontrar o índice da devolução no array
      const index = DEVOLUCOES_MOCK.findIndex(dev => dev.id === id);
      
      // Atualizar a devolução no array
      if (index !== -1) {
        DEVOLUCOES_MOCK[index] = {
          ...DEVOLUCOES_MOCK[index],
          ...devolucaoAtualizada
        };
      }
      
      // Aguardar um momento para dar feedback visual
      setTimeout(() => {
        router.push('/dashboard/devolucoes/acompanhamento');
      }, 500);
    } catch (error) {
      console.error('Erro ao atualizar devolução:', error);
      alert('Erro ao salvar as alterações. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmarSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    setMostrarConfirmacao(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!devolucao) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Devolução não encontrada</h1>
          <p className="text-gray-500 mt-1">A devolução solicitada não foi encontrada.</p>
        </div>
        <div>
          <Link 
            href="/dashboard/devolucoes/acompanhamento"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={16} className="mr-1" /> Voltar para Acompanhamento
          </Link>
        </div>
      </div>
    );
  }

  // Determinar se é possível editar campos específicos baseado no status
  const podeEditarCamposAnalise = devolucao.status === 'em_analise';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Editar Devolução</h1>
          <p className="text-gray-500 mt-1">Código: {devolucao.codigo}</p>
        </div>
        <div>
          <Link 
            href="/dashboard/devolucoes/acompanhamento"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={16} className="mr-1" /> Voltar
          </Link>
        </div>
      </div>

      <form onSubmit={confirmarSalvar} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium mb-4">Informações da Devolução</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="responsavel" className="block text-sm font-medium text-gray-700 mb-1">
                Responsável pelo Registro
              </label>
              <input
                type="text"
                id="responsavel"
                name="responsavel"
                value={formData.responsavel}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.responsavel ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.responsavel && (
                <p className="mt-1 text-sm text-red-600">{errors.responsavel}</p>
              )}
            </div>

            <div>
              <label htmlFor="responsavel_recebimento" className="block text-sm font-medium text-gray-700 mb-1">
                Responsável pelo Recebimento
              </label>
              <input
                type="text"
                id="responsavel_recebimento"
                name="responsavel_recebimento"
                value={formData.responsavel_recebimento}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.responsavel_recebimento ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.responsavel_recebimento && (
                <p className="mt-1 text-sm text-red-600">{errors.responsavel_recebimento}</p>
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

        {podeEditarCamposAnalise && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium mb-4">Informações da Análise</h2>
            
            <div className="grid grid-cols-1 gap-6">
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
                <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição do Problema
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  rows={3}
                  value={formData.descricao}
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
                    onClick={() => removerFoto(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full"
                  >
                    <X size={16} />
                  </button>
                  <p className="mt-1 text-xs text-gray-500 truncate">{foto.name}</p>
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
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} className="mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>

      {/* Modal de Confirmação */}
      {mostrarConfirmacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">
              Confirmar Alterações
            </h3>
            <p className="mb-6">
              Tem certeza que deseja salvar as alterações nesta devolução?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMostrarConfirmacao(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 