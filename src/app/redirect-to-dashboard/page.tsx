'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

// Função de log de erro
const logError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ REDIRECT ERROR: ${message}`, error);
};

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    logDebug('Página de redirecionamento intermediária iniciada');
    
    // Função para verificar autenticação e redirecionar
    const checkAuthAndRedirect = async () => {
      try {
        // Verificar se temos sessão ativa
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao verificar sessão:', error.message);
          setError('Não foi possível verificar sua autenticação. Por favor, faça login novamente.');
          setIsLoading(false);
          return;
        }
        
        if (!data.session) {
          logDebug('Nenhuma sessão encontrada, redirecionando para login');
          // Sem sessão, redirecionar para login
          router.push("/login");
          return;
        }
        
        // Temos uma sessão válida, iniciar contagem para o redirecionamento
        logDebug('Sessão válida encontrada, iniciando contagem regressiva');
        
        // Obter o destino final do parâmetro de URL
        const destination = searchParams.get('redirect') || '/dashboard';
        
        // Iniciar contagem regressiva
        const countdownInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              
              // Adicionar flag para evitar loop de redirecionamento
              const separator = destination.includes('?') ? '&' : '?';
              const finalDestination = `${destination}${separator}_auth_verified=true&_from_redirect_page=true`;
              
              logDebug(`Contagem regressiva concluída, redirecionando para: ${finalDestination}`);
              router.push(finalDestination);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Limpar intervalo se o componente for desmontado
        return () => clearInterval(countdownInterval);
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        setError('Ocorreu um erro durante o redirecionamento. Por favor, tente fazer login novamente.');
        setIsLoading(false);
      }
    };
    
    // Iniciar após um pequeno delay
    setTimeout(checkAuthAndRedirect, 300);
  }, [searchParams, router]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">Verificação intermediária...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Redirecionando em {countdown} segundos...</p>
        <div className="mt-6 text-sm text-gray-500">Verificando sessão e redirecionando para o dashboard...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro de Autenticação</h1>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <div className="flex flex-col space-y-3">
            <Link
              href="/login"
              className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition-colors text-center"
            >
              Voltar para a página de login
            </Link>
            <Link
              href="/dashboard?_auth_bypass=true&_direct_access=true"
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300 transition-colors text-center"
            >
              Tentar acessar o Dashboard mesmo assim
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}

export default function RedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2 text-blue-600">Carregando...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Preparando redirecionamento...</p>
      </div>
    }>
      <RedirectContent />
    </Suspense>
  );
} 