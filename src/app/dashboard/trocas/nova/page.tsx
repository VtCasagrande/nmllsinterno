'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTrocas } from '@/contexts/TrocasContext';
import { TrocaTipo } from '@/types/trocas';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NovaTrocaPage() {
  const router = useRouter();
  const { createTroca, error } = useTrocas();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tipo: TrocaTipo.ENVIADA,
    ean: '',
    nomeProduto: '',
    quantidade: 1,
    lojaParceira: '',
    responsavel: '',
    telefoneResponsavel: '',
    motivo: '',
    observacoes: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'quantidade' ? parseInt(value) || 0 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validação básica
    if (!formData.ean || !formData.nomeProduto || !formData.lojaParceira || !formData.responsavel) {
      setFormError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createTroca(formData);
      router.push('/dashboard/trocas');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ocorreu um erro ao criar a troca');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/trocas" className="text-blue-600 hover:text-blue-800 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Nova Troca</h1>
      </div>

      {(formError || error) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {formError || error}</span>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Troca */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Troca *
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value={TrocaTipo.ENVIADA}>Enviamos para outra loja</option>
                <option value={TrocaTipo.RECEBIDA}>Recebemos de outra loja</option>
              </select>
            </div>

            {/* Espaço vazio para manter o alinhamento na grid */}
            <div className="col-span-1"></div>

            {/* Informações do Produto */}
            <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Informações do Produto</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código EAN/SKU *
                  </label>
                  <input
                    type="text"
                    name="ean"
                    value={formData.ean}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    name="nomeProduto"
                    value={formData.nomeProduto}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    name="quantidade"
                    value={formData.quantidade}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Informações da Loja Parceira */}
            <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Loja Parceira</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Loja *
                  </label>
                  <input
                    type="text"
                    name="lojaParceira"
                    value={formData.lojaParceira}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Responsável *
                  </label>
                  <input
                    type="text"
                    name="responsavel"
                    value={formData.responsavel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone de Contato *
                  </label>
                  <input
                    type="text"
                    name="telefoneResponsavel"
                    value={formData.telefoneResponsavel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Detalhes Adicionais */}
            <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Detalhes Adicionais</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo da Troca *
                  </label>
                  <input
                    type="text"
                    name="motivo"
                    value={formData.motivo}
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
                    name="observacoes"
                    value={formData.observacoes}
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
              href="/dashboard/trocas"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Troca'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 