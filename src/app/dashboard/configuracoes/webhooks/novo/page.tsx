'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWebhooks, WebhookEventType, WebhookStatus } from '../WebhooksContext';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function NovoWebhookPage() {
  const router = useRouter();
  const { criarWebhook, loading, error: apiError } = useWebhooks();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    url: '',
    eventos: [WebhookEventType.ENTREGA_EM_ROTA],
    status: WebhookStatus.ATIVO,
    chaveSecreta: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      processedValue = target.checked ? WebhookStatus.ATIVO : WebhookStatus.INATIVO;
    }

    if (name === 'evento') {
      setFormData(prev => ({
        ...prev,
        eventos: [value as WebhookEventType]
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Criar o webhook com os dados do formulário
      await criarWebhook(formData);

      router.push('/dashboard/configuracoes/webhooks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao criar o webhook');
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold">Novo Webhook</h1>
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
            <label htmlFor="chaveSecreta" className="block text-sm font-medium text-gray-700">
              Chave secreta (opcional)
            </label>
            <input
              type="text"
              id="chaveSecreta"
              name="chaveSecreta"
              value={formData.chaveSecreta}
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
              value={formData.eventos[0]}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <optgroup label="Eventos de Entregas">
                <option value={WebhookEventType.ENTREGA_EM_ROTA}>Entregas - Entrega em Rota</option>
                <option value={WebhookEventType.ENTREGA_ENTREGUE}>Entregas - Entrega Concluída</option>
                <option value={WebhookEventType.ENTREGA_ATRASADA}>Entregas - Entrega Atrasada</option>
              </optgroup>
              
              <optgroup label="Eventos de Pedidos">
                <option value={WebhookEventType.PEDIDO_REALIZADO}>Pedidos - Realizado</option>
                <option value={WebhookEventType.PEDIDO_APROVADO}>Pedidos - Aprovado</option>
                <option value={WebhookEventType.PEDIDO_RECUSADO}>Pedidos - Recusado</option>
                <option value={WebhookEventType.PEDIDO_ENVIADO}>Pedidos - Enviado</option>
                <option value={WebhookEventType.PEDIDO_CANCELADO}>Pedidos - Cancelado</option>
              </optgroup>
              
              <optgroup label="Eventos de Pagamentos">
                <option value={WebhookEventType.PAGAMENTO_APROVADO}>Pagamentos - Aprovado</option>
                <option value={WebhookEventType.PAGAMENTO_RECUSADO}>Pagamentos - Recusado</option>
              </optgroup>
              
              <optgroup label="Eventos de Reembolsos">
                <option value={WebhookEventType.REEMBOLSO_SOLICITADO}>Reembolsos - Solicitado</option>
                <option value={WebhookEventType.REEMBOLSO_APROVADO}>Reembolsos - Aprovado</option>
                <option value={WebhookEventType.REEMBOLSO_RECUSADO}>Reembolsos - Recusado</option>
              </optgroup>
              
              <optgroup label="Outros Eventos">
                <option value={WebhookEventType.LEMBRETE_MEDICAMENTO}>Lembretes de Medicamentos</option>
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
              Ativar webhook imediatamente
            </label>
          </div>

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
                  Salvar webhook
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 