'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Função de log melhorada
const logDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 🔄 REDIRECT: ${message}`, data);
  } else {
    console.log(`[${timestamp}] 🔄 REDIRECT: ${message}`);
  }
};

// Função de log de erro melhorada
const logError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ REDIRECT ERROR: ${message}`, error);
};

export default function RedirectToDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [sessionVerified, setSessionVerified] = useState(false);

  useEffect(() => {
    logDebug('Página de redirecionamento iniciada');
    
    // Verificar se o usuário tem uma sessão ativa
    const checkSessionAndRedirect = async () => {
      try {
        logDebug('Verificando sessão ativa');
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logError('Erro ao verificar sessão', sessionError);
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
        setSessionVerified(true);
        
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
        
        // Primeiro tentar navegar com o router para evitar refresh completo
        router.push('/dashboard');
        
        // Backup - usar location.replace depois de um pequeno delay
        setTimeout(() => {
          // Verificar se ainda estamos na página de redirecionamento
          if (window.location.pathname.includes('redirect-to-dashboard')) {
            logDebug('Redirecionamento pelo router pode ter falhado, usando window.location');
            window.location.replace('/dashboard');
            
            // Segundo backup - último recurso
            setTimeout(() => {
              if (window.location.pathname.includes('redirect-to-dashboard')) {
                logDebug('Tentativas anteriores falharam, usando location.href como último recurso');
                window.location.href = '/dashboard';
              }
            }, 500);
          }
        }, 500);
      } catch (err) {
        logError('Erro ao redirecionar', err);
        setError('Ocorreu um erro ao tentar redirecioná-lo.');
        setIsLoading(false);
      }
    };
    
    // Iniciar o processo
    checkSessionAndRedirect();
  }, [router]);

  // Função para redirecionar manualmente
  const handleManualRedirect = () => {
    logDebug('Redirecionamento manual acionado pelo usuário');
    window.location.href = '/dashboard';
  };

  // Se estiver carregando, mostrar tela de carregamento com contagem regressiva
  if (isLoading && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2 text-blue-600">Redirecionando para o Dashboard</h1>
        {sessionVerified ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 mb-4">Redirecionando em {countdown} segundos...</p>
            <button 
              onClick={handleManualRedirect}
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition-colors"
            >
              Ir para o Dashboard Agora
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Verificando sua sessão...</p>
          </>
        )}
      </div>
    );
  }

  // Se houver erro, mostrar mensagem de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Não foi possível redirecionar</h1>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <p className="text-gray-600 mb-6">Por favor, tente fazer login novamente.</p>
          <div className="flex flex-col space-y-3">
            <Link
              href="/login"
              className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition-colors text-center"
            >
              Ir para a página de login
            </Link>
            <button
              onClick={handleManualRedirect}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300 transition-colors"
            >
              Tentar acessar o Dashboard mesmo assim
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Este return nunca deve ser alcançado normalmente, mas é necessário para satisfazer o React
  return null;
} 