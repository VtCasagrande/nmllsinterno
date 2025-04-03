'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Função de log para facilitar a depuração
const logDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 🔄 REDIRECT DEBUG: ${message}`, data);
  } else {
    console.log(`[${timestamp}] 🔄 REDIRECT DEBUG: ${message}`);
  }
};

// Função de log de erro
const logError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ REDIRECT ERROR: ${message}`, error);
};

export default function RedirectToDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    logDebug('Página de redirecionamento iniciada');
    
    // Verificar se o usuário tem uma sessão ativa
    const checkSessionAndRedirect = async () => {
      try {
        logDebug('Verificando sessão ativa');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          logError('Erro ao verificar sessão', error);
          setError('Não foi possível verificar sua sessão. Tente fazer login novamente.');
          setIsLoading(false);
          return;
        }
        
        if (!data.session) {
          logError('Sessão não encontrada');
          setError('Você não está logado. Por favor, faça login novamente.');
          setIsLoading(false);
          return;
        }
        
        // Sessão encontrada, verificando o token
        logDebug('Sessão encontrada, ID do usuário:', data.session.user.id);
        
        // Iniciar contagem regressiva para redirecionamento
        const intervalId = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(intervalId);
              logDebug('Contagem regressiva concluída, redirecionando agora');
              executarRedirecionamento();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Limpar intervalo se o componente for desmontado
        return () => clearInterval(intervalId);
        
      } catch (err) {
        logError('Erro ao verificar autenticação', err);
        setError('Ocorreu um erro ao verificar sua autenticação.');
        setIsLoading(false);
      }
    };
    
    // Função para executar o redirecionamento
    const executarRedirecionamento = () => {
      try {
        logDebug('Executando redirecionamento para /dashboard');
        // Usar replace em vez de href para evitar histórico de navegação
        window.location.replace('/dashboard');
        
        // Backup - se o replace não funcionar após um tempo
        setTimeout(() => {
          logDebug('Verificando se o redirecionamento falhou');
          // Se ainda estivermos na página de redirecionamento, tentar novamente
          if (window.location.pathname.includes('redirect-to-dashboard')) {
            logDebug('Redirecionamento falhou, tentando abordagem alternativa');
            window.location.href = '/dashboard';
          }
        }, 1000);
      } catch (err) {
        logError('Erro ao redirecionar', err);
        setError('Ocorreu um erro ao tentar redirecioná-lo.');
        setIsLoading(false);
      }
    };
    
    // Iniciar o processo
    checkSessionAndRedirect();
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-xl font-bold text-center mb-4">
          {error ? 'Erro de Redirecionamento' : 'Redirecionando para o Dashboard'}
        </h1>
        
        {isLoading && !error ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-center text-gray-600 mb-2">
              Por favor, aguarde enquanto redirecionamos você...
            </p>
            <p className="text-center text-sm text-gray-500">
              Redirecionando em {countdown} segundos
            </p>
          </>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-md mb-4">
            {error}
          </div>
        ) : null}
        
        <div className="mt-6 space-y-3">
          <a 
            href="/dashboard" 
            className="w-full block text-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {error ? 'Ir para o Dashboard' : 'Clique aqui se não for redirecionado automaticamente'}
          </a>
          
          {error && (
            <a 
              href="/login"
              className="w-full block text-center py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Voltar para o Login
            </a>
          )}
        </div>
      </div>
    </div>
  );
} 