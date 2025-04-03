'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWebhooks, WebhookEventType, WebhookStatus, Webhook } from '../../WebhooksContext';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle, Loader2, Check, Trash2 } from 'lucide-react';

export default function EditarWebhookPage({ params }: { params: { id: string } }) {
  const { obterWebhookPorId, atualizarWebhook, loading, error: apiError } = useWebhooks();
  const [webhook, setWebhook] = useState<Webhook | null>(null);
  const [nome, setNome] = useState('');
  const [url, setUrl] = useState('');
  const [evento, setEvento] = useState<WebhookEventType | ''>('');
  const [status, setStatus] = useState<WebhookStatus>(WebhookStatus.ATIVO);
  const [headers, setHeaders] = useState<{key: string, value: string}[]>([{ key: '', value: '' }]);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    const fetchWebhook = async () => {
      if (params.id) {
        try {
          const webhookData = await obterWebhookPorId(params.id);
          
          if (webhookData) {
            setWebhook(webhookData);
            setNome(webhookData.nome);
            setUrl(webhookData.url);
            setEvento(webhookData.eventos[0] || '');
            setStatus(webhookData.status);
            
            if (webhookData.headers) {
              setHeaders(
                Object.entries(webhookData.headers).map(([key, value]) => ({ key, value: value as string }))
              );
            }
          } else {
            setError('Webhook não encontrado');
          }
        } catch (err) {
          console.error('Erro ao carregar webhook:', err);
          setError('Erro ao carregar webhook');
        }
      }
    };
    
    fetchWebhook();
  }, [params.id]);

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const handleRemoveHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !url || !evento) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('A URL deve começar com http:// ou https://');
      return;
    }
    
    const headersObj: Record<string, string> = {};
    headers.forEach(h => {
      if (h.key && h.value) {
        headersObj[h.key] = h.value;
      }
    });
    
    try {
      setSalvando(true);
      setError(null);
      
      await atualizarWebhook(params.id, {
        nome,
        url,
        eventos: [evento as WebhookEventType],
        headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
        status
      });
      
      setSucesso(true);
      setTimeout(() => {
        router.push('/dashboard/configuracoes/webhooks');
      }, 2000);
    } catch (err) {
      console.error('Erro ao salvar webhook:', err);
      setError('Ocorreu um erro ao salvar as alterações');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Carregando webhook...</p>
      </div>
    );
  }

  if (!webhook) {
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
          <code className="bg-gray-100 px-2 py-1 rounded">{webhook.id}</code>
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

      {sucesso && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
          <div className="flex">
            <Check size={20} className="text-green-500 mt-0.5 mr-3" />
            <div>
              <p className="text-green-700">Webhook atualizado com sucesso!</p>
              <p className="text-sm text-green-600">Redirecionando para a lista de webhooks...</p>
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
              value={nome}
              onChange={(e) => setNome(e.target.value)}
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
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="https://sua-api.exemplo.com/webhook"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Endpoint que receberá as requisições do webhook
            </p>
          </div>

          <div>
            <label htmlFor="evento" className="block text-sm font-medium text-gray-700">
              Evento <span className="text-red-500">*</span>
            </label>
            <select
              id="evento"
              name="evento"
              value={evento}
              onChange={(e) => setEvento(e.target.value as WebhookEventType)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="">Selecione um evento</option>
              {Object.values(WebhookEventType).map(eventType => (
                <option key={eventType} value={eventType}>
                  {eventType.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Tipo de evento que irá disparar este webhook
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Headers (opcional)
              </label>
              <button
                type="button"
                onClick={handleAddHeader}
                className="px-3 py-1 text-xs font-medium text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
              >
                + Adicionar header
              </button>
            </div>
            <div className="mt-2 space-y-3">
              {headers.map((header, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                    placeholder="Nome do header"
                    className="block w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                    placeholder="Valor"
                    className="block w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveHeader(index)}
                      className="px-2 py-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Headers HTTP adicionais para enviar com cada requisição
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="status"
              name="status"
              checked={status === WebhookStatus.ATIVO}
              onChange={(e) => setStatus(e.target.checked ? WebhookStatus.ATIVO : WebhookStatus.INATIVO)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="status" className="ml-2 block text-sm text-gray-700">
              Webhook ativo
            </label>
          </div>

          {webhook.ultimaExecucao && (
            <div className="pt-4 pb-2 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Informações da última execução</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-gray-500">Data/Hora:</span>
                  <span>{new Date(webhook.ultimaExecucao).toLocaleString('pt-BR')}</span>
                </div>
                {webhook.ultimoStatus && (
                  <div>
                    <span className="block text-gray-500">Status da resposta:</span>
                    <span className={`${
                      webhook.ultimoStatus >= 200 && webhook.ultimoStatus < 300
                        ? 'text-green-600'
                        : 'text-red-600'
                    } font-medium`}>
                      {webhook.ultimoStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end">
          <Link
            href="/dashboard/configuracoes/webhooks"
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={salvando}
            className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center ${
              salvando ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {salvando ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
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
      </form>
    </div>
  );
}