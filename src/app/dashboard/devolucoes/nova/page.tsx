'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { devolucoesService, DevolucaoInput } from '@/services/devolucoesService';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/auth';
import { Spinner } from '@/components/ui/spinner';

export default function NovaDevolucaoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<DevolucaoInput>({
    produto: '',
    motivo: 'produto_danificado',
    descricao: '',
    responsavel_id: user?.id || '',
    data_recebimento: new Date().toISOString().split('T')[0],
    pedido_tiny: '',
    nota_fiscal: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpar erro ao editar o campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.produto) {
      newErrors.produto = 'O produto é obrigatório';
    }

    if (!formData.motivo) {
      newErrors.motivo = 'O motivo da devolução é obrigatório';
    }

    if (!formData.data_recebimento) {
      newErrors.data_recebimento = 'A data de recebimento é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) {
      return;
    }

    setLoading(true);

    try {
      const result = await devolucoesService.createDevolucao(formData, user.id);

      if (result) {
        toast({
          title: 'Sucesso!',
          description: 'Devolução criada com sucesso',
          variant: 'success'
        });
        router.push(`/dashboard/devolucoes/edicao/${result.id}`);
      } else {
        throw new Error('Não foi possível criar a devolução');
      }
    } catch (error) {
      console.error('Erro ao criar devolução:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao criar a devolução',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Você precisa estar logado para acessar esta página.</p>
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
          <h1 className="text-2xl font-bold">Nova Devolução</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Produto */}
            <div className="col-span-2">
              <label htmlFor="produto" className="block text-sm font-medium text-gray-700 mb-1">
                Produto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="produto"
                name="produto"
                value={formData.produto}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${errors.produto ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Nome ou ID do produto"
              />
              {errors.produto && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.produto}
                </p>
              )}
            </div>

            {/* Motivo */}
            <div>
              <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-1">
                Motivo da Devolução <span className="text-red-500">*</span>
              </label>
              <select
                id="motivo"
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${errors.motivo ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="produto_danificado">Produto Danificado</option>
                <option value="produto_incorreto">Produto Incorreto</option>
                <option value="cliente_desistiu">Cliente Desistiu</option>
                <option value="endereco_nao_encontrado">Endereço Não Encontrado</option>
                <option value="outro">Outro</option>
              </select>
              {errors.motivo && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.motivo}
                </p>
              )}
            </div>

            {/* Data de Recebimento */}
            <div>
              <label htmlFor="data_recebimento" className="block text-sm font-medium text-gray-700 mb-1">
                Data de Recebimento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="data_recebimento"
                name="data_recebimento"
                value={formData.data_recebimento}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${errors.data_recebimento ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.data_recebimento && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.data_recebimento}
                </p>
              )}
            </div>

            {/* Número do Pedido Tiny */}
            <div>
              <label htmlFor="pedido_tiny" className="block text-sm font-medium text-gray-700 mb-1">
                Número do Pedido Tiny
              </label>
              <input
                type="text"
                id="pedido_tiny"
                name="pedido_tiny"
                value={formData.pedido_tiny || ''}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="12345"
              />
            </div>

            {/* Número da Nota Fiscal */}
            <div>
              <label htmlFor="nota_fiscal" className="block text-sm font-medium text-gray-700 mb-1">
                Número da Nota Fiscal
              </label>
              <input
                type="text"
                id="nota_fiscal"
                name="nota_fiscal"
                value={formData.nota_fiscal || ''}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="NF-e 123456"
              />
            </div>

            {/* Descrição/Observações */}
            <div className="col-span-2">
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição / Observações
              </label>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao || ''}
                onChange={handleChange}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Informações adicionais sobre a devolução..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Link
              href="/dashboard/devolucoes/acompanhamento"
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" /> Salvando...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" /> Salvar Devolução
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 