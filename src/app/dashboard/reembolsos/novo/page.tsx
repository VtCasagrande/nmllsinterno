'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReembolsos } from '@/contexts/ReembolsosContext';
import { ReembolsoPrioridade } from '@/types/reembolsos';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function NovoReembolsoPage() {
  const router = useRouter();
  const { createReembolso, error } = useReembolsos();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    numeroPedidoTiny: '',
    nomeCliente: '',
    dataPedido: format(new Date(), 'yyyy-MM-dd'),
    statusPedidoTiny: '',
    responsavelReembolso: '',
    prioridade: ReembolsoPrioridade.MEDIA,
    formaPagamento: '',
    telefoneCliente: '',
    valorPedidoTotal: 0,
    valorReembolso: 0,
    motivoReembolso: '',
    observacao: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

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

    // Validação básica
    if (
      !formData.numeroPedidoTiny || 
      !formData.nomeCliente || 
      !formData.dataPedido || 
      !formData.responsavelReembolso || 
      !formData.formaPagamento || 
      !formData.telefoneCliente || 
      formData.valorReembolso <= 0 ||
      !formData.motivoReembolso
    ) {
      setFormError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createReembolso(formData);
      router.push('/dashboard/reembolsos');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ocorreu um erro ao criar o reembolso');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/reembolsos" className="text-blue-600 hover:text-blue-800 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Novo Reembolso</h1>
      </div>

      {(formError || error) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {formError || error}</span>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            {/* Informações do Pedido */}
            <div className="col-span-1 pt-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Informações do Pedido</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número do Pedido TINY *
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
                    Status do Pedido no TINY *
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
                    Data do Pedido *
                  </label>
                  <input
                    type="date"
                    name="dataPedido"
                    value={formData.dataPedido}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade *
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
            <div className="col-span-1 pt-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Informações do Cliente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Cliente *
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
                    Telefone do Cliente *
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
                    Forma de Pagamento *
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
                    Responsável pelo Reembolso *
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
            <div className="col-span-1 pt-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Valores</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor do Pedido Total *
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
                  {formData.valorPedidoTotal > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(formData.valorPedidoTotal)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor do Reembolso *
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
                  {formData.valorReembolso > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(formData.valorReembolso)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Detalhes Adicionais */}
            <div className="col-span-1 pt-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Detalhes Adicionais</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo do Reembolso *
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
                    value={formData.observacao}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              href="/dashboard/reembolsos"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Reembolso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 