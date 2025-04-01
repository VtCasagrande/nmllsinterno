'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReembolsos } from '@/contexts/ReembolsosContext';
import { Reembolso, ReembolsoStatus, ReembolsoPrioridade } from '@/types/reembolsos';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, Edit, Check, XCircle, Clock, DollarSign, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function ReembolsoDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { getReembolsoById, updateReembolso, deleteReembolso, updateReembolsoStatus, error } = useReembolsos();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reembolso, setReembolso] = useState<Reembolso | null>(null);
  const [formData, setFormData] = useState<Partial<Reembolso>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showComprovanteModal, setShowComprovanteModal] = useState(false);
  const [statusToChange, setStatusToChange] = useState<ReembolsoStatus | null>(null);
  const [comprovante, setComprovante] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadReembolso = async () => {
      try {
        const data = await getReembolsoById(params.id);
        if (data) {
          setReembolso(data);
          setFormData(data);
        }
      } catch (err) {
        console.error('Erro ao carregar reembolso:', err);
        setFormError(err instanceof Error ? err.message : 'Erro ao carregar dados do reembolso');
      } finally {
        setLoading(false);
      }
    };

    loadReembolso();
  }, [getReembolsoById, params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Para campos de valor numérico, converter para número
    if (name === 'valorPedidoTotal' || name === 'valorReembolso') {
      const numericValue = value === '' ? 0 : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (!reembolso || !formData) return;
      
      await updateReembolso(params.id, formData);
      const updatedReembolso = await getReembolsoById(params.id);
      if (updatedReembolso) {
        setReembolso(updatedReembolso);
        setFormData(updatedReembolso);
      }
      
      setIsEditing(false);
      toast.success('Reembolso atualizado com sucesso!');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ocorreu um erro ao atualizar o reembolso');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este reembolso? Esta ação não pode ser desfeita.')) {
      setIsSubmitting(true);
      try {
        await deleteReembolso(params.id);
        toast.success('Reembolso excluído com sucesso!');
        router.push('/dashboard/reembolsos');
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Ocorreu um erro ao excluir o reembolso');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleStatusChange = async (status: ReembolsoStatus) => {
    // Para APROVADO ou PAGO, mostrar modal de upload de comprovante
    if (status === ReembolsoStatus.APROVADO || status === ReembolsoStatus.PAGO) {
      setStatusToChange(status);
      setShowComprovanteModal(true);
    } else {
      // Para outros status, continuar com o fluxo normal
      await processStatusChange(status);
    }
  };

  const processStatusChange = async (status: ReembolsoStatus, file?: File) => {
    setIsSubmitting(true);
    try {
      await updateReembolsoStatus(params.id, status, file);
      const updatedReembolso = await getReembolsoById(params.id);
      if (updatedReembolso) {
        setReembolso(updatedReembolso);
        setFormData(updatedReembolso);
      }
      toast.success(`Status atualizado para ${formatarStatus(status)}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ocorreu um erro ao atualizar o status');
    } finally {
      setIsSubmitting(false);
      setShowComprovanteModal(false);
      setStatusToChange(null);
      setComprovante(null);
    }
  };

  const handleComprovanteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Por favor, selecione um arquivo PDF');
        return;
      }
      setComprovante(file);
    }
  };

  const handleComprovanteModalConfirm = () => {
    if (statusToChange === ReembolsoStatus.PAGO && !comprovante) {
      toast.error('É necessário anexar um comprovante para marcar como Pago');
      return;
    }
    processStatusChange(statusToChange!, comprovante || undefined);
  };

  const handleComprovanteModalCancel = () => {
    setShowComprovanteModal(false);
    setStatusToChange(null);
    setComprovante(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatarStatus = (status: ReembolsoStatus): string => {
    switch (status) {
      case ReembolsoStatus.EM_ANALISE:
        return 'Em Análise';
      case ReembolsoStatus.APROVADO:
        return 'Aprovado';
      case ReembolsoStatus.PAGO:
        return 'Pago';
      case ReembolsoStatus.CANCELADO:
        return 'Cancelado';
      default:
        return status;
    }
  };

  const formatarPrioridade = (prioridade: ReembolsoPrioridade): string => {
    switch (prioridade) {
      case ReembolsoPrioridade.BAIXA:
        return 'Baixa';
      case ReembolsoPrioridade.MEDIA:
        return 'Média';
      case ReembolsoPrioridade.ALTA:
        return 'Alta';
      case ReembolsoPrioridade.URGENTE:
        return 'Urgente';
      default:
        return prioridade;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-6">
          <Link href="/dashboard/reembolsos" className="text-blue-600 hover:text-blue-800 mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Carregando...</h1>
        </div>
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!reembolso || !formData) {
    return (
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-6">
          <Link href="/dashboard/reembolsos" className="text-blue-600 hover:text-blue-800 mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Reembolso não encontrado</h1>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>O reembolso solicitado não foi encontrado. Ele pode ter sido excluído ou não existe.</p>
          <Link
            href="/dashboard/reembolsos"
            className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Voltar para Reembolsos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/dashboard/reembolsos" className="text-blue-600 hover:text-blue-800 mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">
            Reembolso #{reembolso.numeroPedidoTiny}
          </h1>
        </div>
        <div className="flex space-x-2">
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                disabled={isSubmitting}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                disabled={isSubmitting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </button>
            </>
          )}
        </div>
      </div>

      {(formError || error) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {formError || error}</span>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Informações do Reembolso</h2>
              <p className="text-gray-500">
                Criado em {formatDate(reembolso.dataCriacao)} por {reembolso.usuarioCriacao}
              </p>
            </div>
            <div className="flex items-center">
              <span className="mr-2">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                reembolso.status === ReembolsoStatus.EM_ANALISE 
                  ? 'bg-blue-100 text-blue-800' 
                  : reembolso.status === ReembolsoStatus.APROVADO
                  ? 'bg-yellow-100 text-yellow-800'
                  : reembolso.status === ReembolsoStatus.PAGO
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {reembolso.status === ReembolsoStatus.EM_ANALISE && <Clock className="inline w-4 h-4 mr-1" />}
                {reembolso.status === ReembolsoStatus.APROVADO && <Check className="inline w-4 h-4 mr-1" />}
                {reembolso.status === ReembolsoStatus.PAGO && <DollarSign className="inline w-4 h-4 mr-1" />}
                {reembolso.status === ReembolsoStatus.CANCELADO && <XCircle className="inline w-4 h-4 mr-1" />}
                {formatarStatus(reembolso.status)}
              </span>
            </div>
          </div>
        </div>

        {isEditing ? (
          /* Formulário de edição */
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações do Pedido */}
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Informações do Pedido</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número do Pedido TINY
                      </label>
                      <input
                        type="text"
                        name="numeroPedidoTiny"
                        value={formData.numeroPedidoTiny}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status do Pedido no TINY
                      </label>
                      <input
                        type="text"
                        name="statusPedidoTiny"
                        value={formData.statusPedidoTiny}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data do Pedido
                      </label>
                      <input
                        type="date"
                        name="dataPedido"
                        value={formData.dataPedido?.split('T')[0]}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prioridade
                      </label>
                      <select
                        name="prioridade"
                        value={formData.prioridade}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value={ReembolsoPrioridade.BAIXA}>Baixa</option>
                        <option value={ReembolsoPrioridade.MEDIA}>Média</option>
                        <option value={ReembolsoPrioridade.ALTA}>Alta</option>
                        <option value={ReembolsoPrioridade.URGENTE}>Urgente</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Informações do Cliente */}
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Informações do Cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Cliente
                      </label>
                      <input
                        type="text"
                        name="nomeCliente"
                        value={formData.nomeCliente}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone do Cliente
                      </label>
                      <input
                        type="text"
                        name="telefoneCliente"
                        value={formData.telefoneCliente}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Forma de Pagamento
                      </label>
                      <input
                        type="text"
                        name="formaPagamento"
                        value={formData.formaPagamento}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Responsável pelo Reembolso
                      </label>
                      <input
                        type="text"
                        name="responsavelReembolso"
                        value={formData.responsavelReembolso}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Valores */}
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Valores</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor do Pedido Total
                      </label>
                      <input
                        type="number"
                        name="valorPedidoTotal"
                        value={formData.valorPedidoTotal || ''}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      {formData.valorPedidoTotal && formData.valorPedidoTotal > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {formatCurrency(formData.valorPedidoTotal)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor do Reembolso
                      </label>
                      <input
                        type="number"
                        name="valorReembolso"
                        value={formData.valorReembolso || ''}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      {formData.valorReembolso && formData.valorReembolso > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {formatCurrency(formData.valorReembolso)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Motivo e Observação */}
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Detalhes</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Motivo do Reembolso
                      </label>
                      <input
                        type="text"
                        name="motivoReembolso"
                        value={formData.motivoReembolso}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observações
                      </label>
                      <textarea
                        name="observacao"
                        value={formData.observacao || ''}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-between">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                disabled={isSubmitting}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        ) : (
          /* Visualização de detalhes */
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações do Pedido */}
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Informações do Pedido</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Número do Pedido TINY</p>
                    <p className="font-medium">{reembolso.numeroPedidoTiny}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status do Pedido no TINY</p>
                    <p className="font-medium">{reembolso.statusPedidoTiny}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data do Pedido</p>
                    <p className="font-medium">{formatDate(reembolso.dataPedido)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Prioridade</p>
                    <p className="font-medium">{formatarPrioridade(reembolso.prioridade)}</p>
                  </div>
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Informações do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nome do Cliente</p>
                    <p className="font-medium">{reembolso.nomeCliente}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telefone do Cliente</p>
                    <p className="font-medium">{reembolso.telefoneCliente}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Forma de Pagamento</p>
                    <p className="font-medium">{reembolso.formaPagamento}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Responsável pelo Reembolso</p>
                    <p className="font-medium">{reembolso.responsavelReembolso}</p>
                  </div>
                </div>
              </div>

              {/* Valores */}
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Valores</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Valor do Pedido Total</p>
                    <p className="font-medium">{formatCurrency(reembolso.valorPedidoTotal)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valor do Reembolso</p>
                    <p className="font-medium">{formatCurrency(reembolso.valorReembolso)}</p>
                  </div>
                </div>
              </div>

              {/* Motivo e Observação */}
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Detalhes</h3>
                <div>
                  <p className="text-sm text-gray-500">Motivo do Reembolso</p>
                  <p className="font-medium mb-4">{reembolso.motivoReembolso}</p>
                </div>
                {reembolso.observacao && (
                  <div>
                    <p className="text-sm text-gray-500">Observações</p>
                    <p className="font-medium">{reembolso.observacao}</p>
                  </div>
                )}
              </div>

              {/* Comprovante (se disponível) */}
              {reembolso.urlComprovante && (
                <div className="col-span-1 md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold mb-4">Comprovante</h3>
                  <div className="flex items-center">
                    <div className="bg-blue-100 text-blue-700 p-3 rounded-lg mr-3">
                      <span className="font-medium">PDF</span>
                    </div>
                    <div>
                      <a 
                        href={reembolso.urlComprovante} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                      >
                        Visualizar comprovante
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <p className="text-sm text-gray-500">
                        Adicionado em {reembolso.status === ReembolsoStatus.PAGO ? formatDate(reembolso.dataAtualizacao) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="p-6 border-t bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Ações</h3>
            <div className="flex flex-wrap gap-2">
              {reembolso.status === ReembolsoStatus.EM_ANALISE && (
                <>
                  <button
                    onClick={() => handleStatusChange(ReembolsoStatus.APROVADO)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                    disabled={isSubmitting}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Aprovar Reembolso
                  </button>
                  <button
                    onClick={() => handleStatusChange(ReembolsoStatus.CANCELADO)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                    disabled={isSubmitting}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar Reembolso
                  </button>
                </>
              )}
              {reembolso.status === ReembolsoStatus.APROVADO && (
                <button
                  onClick={() => handleStatusChange(ReembolsoStatus.PAGO)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  disabled={isSubmitting}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Marcar como Pago
                </button>
              )}
              {reembolso.status !== ReembolsoStatus.EM_ANALISE && (
                <button
                  onClick={() => handleStatusChange(ReembolsoStatus.EM_ANALISE)}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-100 flex items-center"
                  disabled={isSubmitting}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Voltar para Análise
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal para Upload de Comprovante */}
      {showComprovanteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {statusToChange === ReembolsoStatus.APROVADO ? 'Aprovar Reembolso' : 'Marcar como Pago'}
              </h3>
              <button
                onClick={handleComprovanteModalCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="mb-4">
              {statusToChange === ReembolsoStatus.APROVADO 
                ? 'Você pode anexar um comprovante para este reembolso (opcional).' 
                : 'Por favor, anexe o comprovante de pagamento.'}
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleComprovanteUpload}
                accept="application/pdf"
                className="hidden"
              />
              
              {comprovante ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-blue-100 text-blue-500 p-2 rounded mr-2">
                      <span className="text-sm">PDF</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{comprovante.name}</p>
                      <p className="text-xs text-gray-500">{(comprovante.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setComprovante(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center cursor-pointer py-4"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-1">Clique para selecionar um PDF</p>
                  <p className="text-xs text-gray-400">Tamanho máximo: 10MB</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleComprovanteModalCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleComprovanteModalConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processando...' : statusToChange === ReembolsoStatus.APROVADO ? 'Aprovar' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 