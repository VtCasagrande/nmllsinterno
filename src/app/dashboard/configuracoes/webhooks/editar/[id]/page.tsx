'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWebhooks } from '@/contexts/WebhooksContext';
import { WebhookEventType, WebhookStatus, Webhook } from '@/types/webhooks';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle, Loader2 } from 'lucide-react';

export default function EditarWebhookPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { webhooks, getWebhookById, updateWebhook } = useWebhooks();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Webhook | null>(null);

  useEffect(() => {
    const fetchWebhook = async () => {
      try {
        const webhook = await getWebhookById(params.id);
        if (!webhook) {
          setError('Webhook não encontrado');
          return;
        }
        setFormData(webhook);
      } catch (err) {
        setError('Erro ao carregar webhook');
        console.error(err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchWebhook();
  }, [params.id, getWebhookById]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    
    const { name, value, type } = e.target;
    let processedValue: any = value;

    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      processedValue = target.checked ? WebhookStatus.ATIVO : WebhookStatus.INATIVO;
    }

    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: processedValue
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
      if (!formData.nome.trim()) {
        throw new Error('O nome é obrigatório');
      }
      
      if (!formData.url.trim()) {
        throw new Error('A URL é obrigatória');
      }
      
      if (!formData.url.startsWith('http://') && !formData.url.startsWith('https://')) {
        throw new Error('A URL deve começar com http:// ou https://');
      }

      await updateWebhook(params.id, formData);
      router.push('/dashboard/configuracoes/webhooks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao atualizar o webhook');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Carregando webhook...</p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
        <div className="flex">
          <AlertCircle size={20} className="text-red-500 mt-0.5 mr-3" />
          <div>
            <p className="text-red-700">{error || 'Webhook não encontrado'}</p>
            <Link
              href="/dashboard/configuracoes/webhooks"
              className="mt-3 inline-flex text-sm text-red-700 hover:text-red-900 font-medium"
            >
              Voltar para lista de webhooks
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
            href="/dashboard/configuracoes/webhooks" 
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Editar Webhook</h1>
        </div>
        
        <div className="text-sm text-gray-500">
          <span className="mr-2">ID:</span>
          <code className="bg-gray-100 px-2 py-1 rounded">{formData.id}</code>
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
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Ex: Notificação de entrega em rota"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Um nome descritivo para identificar este webhook
            </p>
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">
              URL de destino <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="https://sua-api.exemplo.com/webhook"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              O endpoint que receberá as requisições POST com os dados do evento
            </p>
          </div>

          <div>
            <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700">
              Chave secreta (opcional)
            </label>
            <input
              type="text"
              id="secretKey"
              name="secretKey"
              value={formData.secretKey || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="sua-chave-secreta"
            />
            <p className="mt-1 text-sm text-gray-500">
              Uma chave secreta para validar a autenticidade das requisições. Será enviada no cabeçalho X-Webhook-Signature
            </p>
          </div>

          <div>
            <label htmlFor="evento" className="block text-sm font-medium text-gray-700">
              Evento <span className="text-red-500">*</span>
            </label>
            <select
              id="evento"
              name="evento"
              value={formData.evento}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <optgroup label="Eventos de Entregas">
                <option value={WebhookEventType.ENTREGA_EM_ROTA}>Entregas - Entrega em Rota</option>
                <option value={WebhookEventType.ENTREGA_ENTREGUE}>Entregas - Entrega Concluída</option>
                <option value={WebhookEventType.ENTREGA_CANCELADA}>Entregas - Entrega Cancelada</option>
                <option value={WebhookEventType.ENTREGA_PROBLEMA}>Entregas - Problema na Entrega</option>
              </optgroup>
              
              <optgroup label="Eventos de Devoluções">
                <option value={WebhookEventType.DEVOLUCAO_INICIADA}>Devoluções - Devolução Iniciada</option>
                <option value={WebhookEventType.DEVOLUCAO_APROVADA}>Devoluções - Devolução Aprovada</option>
                <option value={WebhookEventType.DEVOLUCAO_REJEITADA}>Devoluções - Devolução Rejeitada</option>
              </optgroup>
              
              <optgroup label="Eventos de Sugestões">
                <option value={WebhookEventType.SUGESTAO_CRIADA}>Sugestões - Sugestão Criada</option>
                <option value={WebhookEventType.SUGESTAO_PEDIDO_REALIZADO}>Sugestões - Pedido Realizado</option>
                <option value={WebhookEventType.SUGESTAO_PRODUTO_CHEGOU}>Sugestões - Produto Chegou</option>
              </optgroup>
              
              <optgroup label="Eventos de Trocas">
                <option value={WebhookEventType.TROCA_CRIADA}>Trocas - Troca Criada</option>
                <option value={WebhookEventType.TROCA_ATUALIZADA}>Trocas - Troca Atualizada</option>
                <option value={WebhookEventType.TROCA_FINALIZADA}>Trocas - Troca Finalizada</option>
              </optgroup>
              
              <optgroup label="Eventos de Reembolsos">
                <option value={WebhookEventType.REEMBOLSO_CRIADO}>Reembolsos - Reembolso Criado</option>
                <option value={WebhookEventType.REEMBOLSO_ATUALIZADO}>Reembolsos - Reembolso Atualizado</option>
                <option value={WebhookEventType.REEMBOLSO_STATUS_ATUALIZADO}>Reembolsos - Status Atualizado</option>
                <option value={WebhookEventType.REEMBOLSO_EXCLUIDO}>Reembolsos - Reembolso Excluído</option>
              </optgroup>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              O evento que irá disparar este webhook
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="status"
              name="status"
              checked={formData.status === WebhookStatus.ATIVO}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="status" className="ml-2 block text-sm text-gray-900">
              Webhook ativo
            </label>
          </div>

          {formData.ultimoDisparo && (
            <div className="pt-4 pb-2 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Informações do último disparo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-gray-500">Data/Hora:</span>
                  <span>{new Date(formData.ultimoDisparo).toLocaleString('pt-BR')}</span>
                </div>
                {formData.ultimoStatusCode && (
                  <div>
                    <span className="block text-gray-500">Status da resposta:</span>
                    <span className={`${
                      formData.ultimoStatusCode >= 200 && formData.ultimoStatusCode < 300
                        ? 'text-green-600'
                        : 'text-red-600'
                    } font-medium`}>
                      {formData.ultimoStatusCode}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 flex justify-end">
            <Link
              href="/dashboard/configuracoes/webhooks"
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
                  Salvar alterações
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}