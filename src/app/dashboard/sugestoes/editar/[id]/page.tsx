'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSugestoes } from '@/contexts/SugestoesContext';
import { UrgenciaSugestao, StatusSugestao, Sugestao, ComentarioInput } from '@/types/sugestoes';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle, Loader2, MessageCircle, Send, Trash, Check, X } from 'lucide-react';

export default function EditarSugestaoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { getSugestao, updateSugestao, deleteSugestao, addComentario } = useSugestoes();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [formData, setFormData] = useState<Sugestao | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [comentario, setComentario] = useState<string>('');
  const [isAddingComentario, setIsAddingComentario] = useState(false);

  useEffect(() => {
    const fetchSugestao = () => {
      try {
        const sugestao = getSugestao(params.id);
        if (!sugestao) {
          setError('Sugestão não encontrada');
          return;
        }
        setFormData(sugestao);
      } catch (err) {
        setError('Erro ao carregar sugestão');
        console.error(err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchSugestao();
  }, [params.id, getSugestao]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    
    const { name, value } = e.target;
    
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Validação básica
      if (!formData.nomeProduto.trim()) {
        throw new Error('O nome do produto é obrigatório');
      }
      
      if (!formData.fornecedor.trim()) {
        throw new Error('O fornecedor é obrigatório');
      }
      
      if (!formData.cliente.trim()) {
        throw new Error('O cliente é obrigatório');
      }
      
      await updateSugestao(params.id, formData);
      setMessage({ type: 'success', text: 'Sugestão atualizada com sucesso!' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao atualizar a sugestão');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await deleteSugestao(params.id);
      router.push('/dashboard/sugestoes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao excluir a sugestão');
      setIsLoading(false);
    }
  };

  const handleAddComentario = async () => {
    if (!comentario.trim()) return;
    
    setIsAddingComentario(true);
    
    try {
      await addComentario(params.id, { texto: comentario });
      setComentario('');
      setMessage({ type: 'success', text: 'Comentário adicionado com sucesso!' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao adicionar o comentário');
    } finally {
      setIsAddingComentario(false);
    }
  };

  // Função para obter o label do status
  const getStatusLabel = (status: StatusSugestao) => {
    switch(status) {
      case StatusSugestao.CRIADO:
        return 'Criado';
      case StatusSugestao.PEDIDO_REALIZADO:
        return 'Pedido Realizado';
      case StatusSugestao.PRODUTO_CHEGOU:
        return 'Produto Chegou';
      default:
        return 'Desconhecido';
    }
  };

  // Função para formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Carregando sugestão...</p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
        <div className="flex">
          <AlertCircle size={20} className="text-red-500 mt-0.5 mr-3" />
          <div>
            <p className="text-red-700">{error || 'Sugestão não encontrada'}</p>
            <Link
              href="/dashboard/sugestoes"
              className="mt-3 inline-flex text-sm text-red-700 hover:text-red-900 font-medium"
            >
              Voltar para lista de sugestões
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href="/dashboard/sugestoes" 
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Editar Sugestão de Compra</h1>
        </div>
        
        <div className="flex space-x-3">
          {confirmDelete ? (
            <div className="flex items-center space-x-2 bg-red-50 p-2 rounded">
              <span className="text-sm text-red-600">Confirmar exclusão?</span>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              <Trash size={16} className="mr-2" />
              Excluir
            </button>
          )}
        </div>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <AlertCircle size={20} className="text-red-500 mt-0.5 mr-3" />
            <div>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`rounded-md p-4 ${message.type === 'success' ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <Check className={`h-5 w-5 text-green-400`} />
              ) : (
                <AlertCircle className={`h-5 w-5 text-red-400`} />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {message.text}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="ean" className="block text-sm font-medium text-gray-700">
                    EAN
                  </label>
                  <input
                    type="text"
                    id="ean"
                    name="ean"
                    value={formData.ean}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ex: 7891234567890"
                  />
                </div>

                <div>
                  <label htmlFor="nomeProduto" className="block text-sm font-medium text-gray-700">
                    Nome do Produto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nomeProduto"
                    name="nomeProduto"
                    value={formData.nomeProduto}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ex: Detergente Líquido"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="fornecedor" className="block text-sm font-medium text-gray-700">
                    Fornecedor/Marca <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fornecedor"
                    name="fornecedor"
                    value={formData.fornecedor}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ex: Ypê"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="urgencia" className="block text-sm font-medium text-gray-700">
                    Urgência <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="urgencia"
                    name="urgencia"
                    value={formData.urgencia}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value={UrgenciaSugestao.BAIXA}>Baixa (1-2 semanas)</option>
                    <option value={UrgenciaSugestao.MEDIA}>Média (5-10 dias)</option>
                    <option value={UrgenciaSugestao.ALTA}>Alta (2-5 dias)</option>
                    <option value={UrgenciaSugestao.CRITICA}>Crítica (1 dia)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="cliente" className="block text-sm font-medium text-gray-700">
                    Cliente <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="cliente"
                    name="cliente"
                    value={formData.cliente}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ex: Maria Silva"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="telefoneCliente" className="block text-sm font-medium text-gray-700">
                    Telefone do Cliente <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="telefoneCliente"
                    name="telefoneCliente"
                    value={formData.telefoneCliente}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ex: (11) 98765-4321"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value={StatusSugestao.CRIADO}>Criado</option>
                    <option value={StatusSugestao.PEDIDO_REALIZADO}>Pedido Realizado</option>
                    <option value={StatusSugestao.PRODUTO_CHEGOU}>Produto Chegou</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="observacao" className="block text-sm font-medium text-gray-700">
                  Observação
                </label>
                <textarea
                  id="observacao"
                  name="observacao"
                  rows={3}
                  value={formData.observacao || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Informações adicionais sobre a sugestão de compra..."
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <Link
                  href="/dashboard/sugestoes"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar de informações e comentários */}
        <div className="space-y-6">
          {/* Detalhes da sugestão */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">ID</p>
                <p className="font-mono text-sm">{formData.id}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Data de Criação</p>
                <p>{formatDate(formData.dataCriacao)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Status Atual</p>
                <p>{getStatusLabel(formData.status)}</p>
              </div>
              
              {formData.dataPedidoRealizado && (
                <div>
                  <p className="text-sm text-gray-500">Data do Pedido</p>
                  <p>{formatDate(formData.dataPedidoRealizado)}</p>
                </div>
              )}
              
              {formData.dataProdutoChegou && (
                <div>
                  <p className="text-sm text-gray-500">Data de Chegada</p>
                  <p>{formatDate(formData.dataProdutoChegou)}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Comentários */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center mb-4">
              <MessageCircle size={18} className="text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Comentários</h3>
            </div>
            
            <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto">
              {formData.comentarios.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Nenhum comentário adicionado</p>
              ) : (
                formData.comentarios.map(comentario => (
                  <div key={comentario.id} className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">{comentario.usuarioNome}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comentario.dataCriacao).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm">{comentario.texto}</p>
                  </div>
                ))
              )}
            </div>
            
            <div className="pt-3 border-t border-gray-200">
              <label htmlFor="novo-comentario" className="block text-sm font-medium text-gray-700 mb-1">
                Adicionar comentário
              </label>
              <div className="flex items-start">
                <textarea
                  id="novo-comentario"
                  rows={2}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Digite seu comentário..."
                />
                <button
                  type="button"
                  onClick={handleAddComentario}
                  disabled={isAddingComentario || !comentario.trim()}
                  className="ml-3 mt-1 inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isAddingComentario ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 