'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Bug, Check } from 'lucide-react';
import { useWebhooks } from '@/contexts/WebhooksContext';
import { WebhookEventType } from '@/types/webhooks';

// Enum para status do bug
enum BugStatus {
  ANALISE = 'analise',
  ARRUMADO = 'arrumado'
}

// Enum para severidade do bug
enum BugSeveridade {
  CRITICO = 'critico',
  IMPORTANTE = 'importante',
  MENOR = 'menor'
}

// Interface para o bug
interface Bug {
  id: string;
  titulo: string;
  descricao: string;
  severidade: BugSeveridade;
  dataOcorrencia: string;
  dataCriacao: string;
  status: BugStatus;
  resolucao?: string;
}

export default function ReportarBugPage() {
  const router = useRouter();
  const { dispararWebhook } = useWebhooks();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    severidade: BugSeveridade.IMPORTANTE,
    dataOcorrencia: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      if (!formData.titulo.trim()) {
        throw new Error('O título é obrigatório');
      }
      
      if (!formData.descricao.trim()) {
        throw new Error('A descrição é obrigatória');
      }
      
      // Criar novo bug
      const newBug: Omit<Bug, 'id' | 'dataCriacao' | 'status'> = {
        titulo: formData.titulo,
        descricao: formData.descricao,
        severidade: formData.severidade as BugSeveridade,
        dataOcorrencia: formData.dataOcorrencia
      };
      
      // Em produção, enviaria para uma API
      console.log('Novo bug reportado:', newBug);
      
      // Simular uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Salvar no localStorage para demonstração
      const bugs = JSON.parse(localStorage.getItem('bugs') || '[]');
      const bugCompleto: Bug = {
        ...newBug,
        id: Date.now().toString(),
        dataCriacao: new Date().toISOString(),
        status: BugStatus.ANALISE
      };
      
      bugs.push(bugCompleto);
      localStorage.setItem('bugs', JSON.stringify(bugs));
      
      // Disparar webhook através do contexto
      try {
        dispararWebhook(WebhookEventType.BUG_REPORTADO, {
          evento: WebhookEventType.BUG_REPORTADO,
          timestamp: new Date().toISOString(),
          dados: {
            bugId: bugCompleto.id,
            titulo: bugCompleto.titulo,
            descricao: bugCompleto.descricao,
            severidade: bugCompleto.severidade,
            status: bugCompleto.status,
            reportadoPor: 'Usuário do Sistema',
            dataReporte: bugCompleto.dataOcorrencia,
            dataCriacao: bugCompleto.dataCriacao,
            ultimaAtualizacao: bugCompleto.dataCriacao
          }
        });
      } catch (webhookError) {
        console.error('Erro ao disparar webhook:', webhookError);
        // Não bloqueamos o fluxo em caso de erro no webhook
      }
      
      // Mostrar mensagem de sucesso
      setSuccess(true);
      
      // Resetar formulário
      setFormData({
        titulo: '',
        descricao: '',
        severidade: BugSeveridade.IMPORTANTE,
        dataOcorrencia: new Date().toISOString().split('T')[0]
      });
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro ao enviar o bug. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Bug className="h-8 w-8 text-red-500 mr-3" />
        <h1 className="text-2xl font-bold">Reportar Bug</h1>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        {success ? (
          <div className="p-4 bg-green-100 border-green-400 text-green-700 rounded-md border-l-4 mb-6">
            <div className="flex items-center">
              <Check size={20} className="mr-2" />
              <span>Bug reportado com sucesso! Obrigado por nos ajudar a melhorar o sistema.</span>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-4 bg-red-100 border-red-400 text-red-700 rounded-md border-l-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle size={20} className="mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            <p className="text-gray-600 mb-6">
              Encontrou um problema no sistema? Preencha o formulário abaixo para reportar o bug. 
              Nossa equipe de desenvolvimento irá analisá-lo o mais breve possível.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ex: Erro ao salvar configurações"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">
                  Descrição <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  rows={5}
                  value={formData.descricao}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Descreva o problema em detalhes. Inclua passos para reproduzir o erro e o comportamento esperado."
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="severidade" className="block text-sm font-medium text-gray-700">
                    Severidade <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="severidade"
                    name="severidade"
                    value={formData.severidade}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value={BugSeveridade.CRITICO}>Crítico (sistema inoperante)</option>
                    <option value={BugSeveridade.IMPORTANTE}>Importante (funcionalidade comprometida)</option>
                    <option value={BugSeveridade.MENOR}>Menor (problema menor)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="dataOcorrencia" className="block text-sm font-medium text-gray-700">
                    Data de Ocorrência <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="dataOcorrencia"
                    name="dataOcorrencia"
                    value={formData.dataOcorrencia}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    'Enviar'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
} 