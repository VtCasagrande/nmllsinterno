'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSugestoes } from '@/contexts/SugestoesContext';
import { UrgenciaSugestao } from '@/types/sugestoes';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function NovaSugestaoPage() {
  const router = useRouter();
  const { createSugestao } = useSugestoes();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ean: '',
    nomeProduto: '',
    fornecedor: '',
    cliente: '',
    telefoneCliente: '',
    urgencia: UrgenciaSugestao.MEDIA,
    observacao: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      
      await createSugestao(formData);
      router.push('/dashboard/sugestoes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao criar a sugestão');
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold">Nova Sugestão de Compra</h1>
        </div>
      </div>

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
              <p className="mt-1 text-sm text-gray-500">
                Código de barras do produto, se disponível
              </p>
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
                <option value={UrgenciaSugestao.BAIXA}>Baixa</option>
                <option value={UrgenciaSugestao.MEDIA}>Média</option>
                <option value={UrgenciaSugestao.ALTA}>Alta</option>
                <option value={UrgenciaSugestao.CRITICA}>Crítica</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Nível de urgência para esta compra
              </p>
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
          </div>

          <div>
            <label htmlFor="observacao" className="block text-sm font-medium text-gray-700">
              Observação
            </label>
            <textarea
              id="observacao"
              name="observacao"
              rows={3}
              value={formData.observacao}
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
  );
} 