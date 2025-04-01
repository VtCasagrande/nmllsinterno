'use client';

import { useState, useEffect } from 'react';
import { Layers, Trash2, Plus, Link as LinkIcon, Check, Bug, AlertCircle } from 'lucide-react';
import { useWebhooks } from '@/contexts/WebhooksContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WebhookEventType } from '@/types/webhooks';

// Descrições dos tipos de webhook
const tiposWebhook = {
  [WebhookEventType.BUG_REPORTADO]: {
    titulo: 'Bugs',
    descricao: 'Notificações quando novos bugs são reportados ou atualizados',
    icone: Bug,
    cor: 'text-red-500'
  },
  [WebhookEventType.ENTREGA_EM_ROTA]: {
    titulo: 'Entregas',
    descricao: 'Atualizações sobre status de entregas',
    icone: Layers,
    cor: 'text-blue-500'
  },
  [WebhookEventType.REEMBOLSO_CRIADO]: {
    titulo: 'Reembolsos',
    descricao: 'Eventos relacionados a reembolsos',
    icone: LinkIcon,
    cor: 'text-green-500'
  },
  [WebhookEventType.SUGESTAO_CRIADA]: {
    titulo: 'Sugestões',
    descricao: 'Alertas sobre novas sugestões de produtos',
    icone: AlertCircle,
    cor: 'text-orange-500'
  }
};

export default function WebhooksPage() {
  const { webhooks, loading, error, deleteWebhook } = useWebhooks();
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  // Formatar data
  const formatarData = (dataString: string) => {
    if (!dataString) return 'Data desconhecida';
    
    try {
      const data = new Date(dataString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(data);
    } catch (err) {
      console.error('Erro ao formatar data:', err);
      return 'Data inválida';
    }
  };

  // Deletar webhook
  const handleDeleteWebhook = async (id: string) => {
    try {
      await deleteWebhook(id);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao excluir webhook:', err);
    }
  };

  // Obter ícone e informações para cada tipo de webhook
  const getTipoInfo = (evento: string | undefined) => {
    // Segurança: se o evento for undefined, usar o tipo padrão
    if (!evento) {
      return tiposWebhook[WebhookEventType.BUG_REPORTADO];
    }
    
    // Usar uma correspondência direta para os tipos comuns
    if (tiposWebhook[evento as keyof typeof tiposWebhook]) {
      return tiposWebhook[evento as keyof typeof tiposWebhook];
    }
    
    // Para outros tipos, categorizar por prefixo
    if (evento.startsWith('bug_')) {
      return tiposWebhook[WebhookEventType.BUG_REPORTADO];
    } else if (evento.startsWith('entrega_') || evento.startsWith('devolucao_')) {
      return tiposWebhook[WebhookEventType.ENTREGA_EM_ROTA];
    } else if (evento.startsWith('reembolso_')) {
      return tiposWebhook[WebhookEventType.REEMBOLSO_CRIADO];
    } else if (evento.startsWith('sugestao_') || evento.startsWith('troca_')) {
      return tiposWebhook[WebhookEventType.SUGESTAO_CRIADA];
    } else if (evento.startsWith('lembrete_')) {
      return tiposWebhook[WebhookEventType.SUGESTAO_CRIADA]; // Reutilizando o ícone das sugestões para lembretes
    }
    
    // Fallback para um tipo padrão
    return tiposWebhook[WebhookEventType.BUG_REPORTADO];
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Layers className="h-8 w-8 text-blue-500 mr-3" />
          <h1 className="text-2xl font-bold">Integrações (Webhooks)</h1>
        </div>
        <Link
          href="/dashboard/configuracoes/webhooks/novo"
          className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 flex items-center"
        >
          <Plus size={16} className="mr-2" />
          Novo Webhook
        </Link>
      </div>
      
      {success && (
        <div className="p-4 mb-6 bg-green-100 border-green-400 text-green-700 rounded-md border-l-4">
          <div className="flex items-center">
            <Check size={20} className="mr-2" />
            <span>Webhook removido com sucesso!</span>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium">Webhooks Configurados</h2>
          <p className="text-gray-500 text-sm mt-1">
            Os webhooks permitem que eventos do sistema sejam notificados a serviços externos
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">Carregando webhooks...</p>
          </div>
        ) : webhooks && webhooks.length > 0 ? (
          <div className="divide-y">
            {webhooks.map(webhook => {
              if (!webhook) return null;
              
              const tipoInfo = getTipoInfo(webhook.evento);
              const TipoIcone = tipoInfo.icone;
              
              return (
                <div key={webhook.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 ${tipoInfo.cor}`}>
                      <TipoIcone size={20} />
                    </div>
                    <div className="ml-3">
                      <div className="font-medium">{webhook.nome || tipoInfo.titulo}</div>
                      <div className="text-sm text-gray-500 truncate max-w-md">
                        {webhook.url}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Criado em {formatarData(webhook.dataCriacao)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className={`px-2 py-1 text-xs rounded-full mr-4 ${
                      webhook.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {webhook.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </div>
                    
                    <Link
                      href={`/dashboard/configuracoes/webhooks/editar/${webhook.id}`}
                      className="text-blue-500 hover:text-blue-700 mr-2"
                    >
                      Editar
                    </Link>
                    
                    <button
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-500">Nenhum webhook configurado</h3>
            <p className="text-gray-500 mt-1">
              <Link
                href="/dashboard/configuracoes/webhooks/novo"
                className="text-blue-500 hover:underline"
              >
                Adicione seu primeiro webhook
              </Link>
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Como usar webhooks?</h3>
        <p className="text-sm text-gray-700 mb-4">
          Os webhooks permitem que seu sistema receba notificações em tempo real quando eventos 
          específicos acontecem no Nmalls. Para usar, configure um endpoint HTTP que possa receber 
          requisições POST.
        </p>
        <div className="bg-gray-800 text-gray-200 p-3 rounded-md text-sm font-mono overflow-x-auto">
          <pre>
            {`// Exemplo de payload recebido para evento de bug reportado
{
  "evento": "bug_reportado",
  "timestamp": "2023-04-01T14:32:10.123Z",
  "dados": {
    "bugId": "123456789",
    "titulo": "Erro ao salvar configurações",
    "severidade": "importante",
    "status": "analise",
    "dataCriacao": "2023-04-01T14:32:10.123Z"
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
} 