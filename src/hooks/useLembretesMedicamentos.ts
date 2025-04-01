import { useState } from 'react';
import { useWebhooks } from '@/contexts/WebhooksContext';
import { WebhookEventType } from '@/types/webhooks';

export interface ProcessarLembretesResult {
  sucesso: boolean;
  mensagem: string;
  atualizacoes?: any[];
  erro?: string;
}

/**
 * Hook para processar lembretes de medicamentos
 */
export const useLembretesMedicamentos = () => {
  const [processando, setProcessando] = useState(false);
  const [resultadoProcessamento, setResultadoProcessamento] = useState<ProcessarLembretesResult | null>(null);
  const { dispararWebhook } = useWebhooks();

  /**
   * Processa manualmente os lembretes de medicamentos
   */
  const processarLembretes = async (): Promise<ProcessarLembretesResult> => {
    setProcessando(true);
    setResultadoProcessamento(null);
    
    try {
      // Chamar a API para processar os lembretes
      const response = await fetch('/api/medicamentos/lembretes/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Adicionar autenticação se necessário
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar lembretes');
      }
      
      // Para lembretes que foram processados com sucesso, disparar evento de webhook
      if (data.atualizacoes && data.atualizacoes.length > 0) {
        await dispararWebhook(WebhookEventType.LEMBRETE_MEDICAMENTO_ENVIADO, {
          lembretes: data.atualizacoes,
          timestamp: new Date().toISOString(),
          origem: 'dashboard'
        });
      }
      
      const resultado = {
        sucesso: true,
        mensagem: data.message || 'Lembretes processados com sucesso',
        atualizacoes: data.atualizacoes || []
      };
      
      setResultadoProcessamento(resultado);
      return resultado;
    } catch (error) {
      console.error('Erro ao processar lembretes:', error);
      
      const resultado = {
        sucesso: false,
        mensagem: 'Falha ao processar lembretes',
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      
      setResultadoProcessamento(resultado);
      return resultado;
    } finally {
      setProcessando(false);
    }
  };

  return {
    processando,
    resultadoProcessamento,
    processarLembretes
  };
}; 