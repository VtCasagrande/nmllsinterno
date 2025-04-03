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
  const [countdown, setCountdown] = useState(5);
  const [sessionVerified, setSessionVerified] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    logDebug('Página de redirecionamento iniciada');
    
    // Verificar se o usuário tem uma sessão ativa
    const checkSessionAndRedirect = async () => {
      try {
        // Mostrar infos adicionais para debug
        let debug: Record<string, any> = {
          timestamp: new Date().toISOString(),
          url: window.location.href,
          redirectParam: searchParams.get('redirect') || '/dashboard'
        };
        
        logDebug('Verificando sessão ativa');
        // Primeiro, tentar obter a sessão
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logError('Erro ao verificar sessão', sessionError);
          debug.sessionError = sessionError.message;
          setDebugInfo(debug);
          setError('Não foi possível verificar sua sessão. Tente fazer login novamente.');
          setIsLoading(false);
          return;
        }
        
        // Adicionar informações da sessão ao debug
        debug.hasSession = !!data.session;
        if (data.session) {
          debug.userId = data.session.user.id;
          debug.expiresAt = data.session.expires_at;
        }
        
        if (!data.session) {
          logError('Sessão não encontrada');
          debug.tryingRefresh = true;
          
          // Tentar atualizar a sessão com o supabase
          try {
            logDebug('Tentando atualizar a sessão');
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError || !refreshData.session) {
              logError('Falha ao atualizar sessão', refreshError);
              debug.refreshError = refreshError?.message;
              setDebugInfo(debug);
              setError('Você não está logado. Por favor, faça login novamente.');
              setIsLoading(false);
              return;
            }
            
            debug.refreshSuccess = true;
            debug.refreshedUserId = refreshData.session.user.id;
            logDebug('Sessão atualizada com sucesso');
          } catch (refreshErr) {
            logError('Erro ao atualizar sessão', refreshErr);
            debug.refreshException = refreshErr instanceof Error ? refreshErr.message : String(refreshErr);
            setDebugInfo(debug);
            setError('Você não está logado. Por favor, faça login novamente.');
            setIsLoading(false);
            return;
          }
        }
        
        // Novo: Segunda tentativa de obter a sessão após a atualização
        const { data: verifyData } = await supabase.auth.getSession();
        debug.sessionAfterRefresh = !!verifyData.session;
        
        if (!verifyData.session) {
          logError('Sessão ainda não disponível após refresh');
          setDebugInfo(debug);
          setError('Não foi possível confirmar sua autenticação. Por favor, tente novamente.');
          setIsLoading(false);
          return;
        }
        
        // Verificar dados do usuário (segunda verificação)
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        debug.userDataCheck = !!userData.user;
        if (userError || !userData.user) {
          logError('Erro ao obter dados do usuário', userError);
          debug.userError = userError?.message;
          setDebugInfo(debug);
          setError('Não foi possível confirmar seus dados. Por favor, faça login novamente.');
          setIsLoading(false);
          return;
        }
        
        // Verificar se o usuário tem um perfil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', userData.user.id)
          .single();
          
        debug.profileCheck = !!profileData;
        if (profileError) {
          logError('Erro ao verificar perfil do usuário', profileError);
          debug.profileError = profileError.message;
          setDebugInfo(debug);
          setError('Não foi possível verificar seu perfil. Por favor, faça login novamente.');
          setIsLoading(false);
          return;
        }
        
        // Sessão encontrada e perfil verificado
        logDebug('Sessão encontrada e verificada, ID do usuário:', userData.user.id);
        logDebug('Perfil encontrado:', profileData);
        debug.sessionVerified = true;
        debug.userRole = profileData.role;
        setDebugInfo(debug);
        setSessionVerified(true);
        
        // Iniciar contagem regressiva mais curta para redirecionamento
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
        setDebugInfo({ error: err instanceof Error ? err.message : String(err) });
        setError('Ocorreu um erro ao verificar sua autenticação.');
        setIsLoading(false);
      }
    };
    
    // Função para executar o redirecionamento
    const executarRedirecionamento = () => {
      try {
        // Verificar parâmetros de URL
        const destination = searchParams.get('redirect') || '/dashboard';
        logDebug(`Executando redirecionamento para: ${destination}`);
        
        // Para URLs que vêm do parâmetro redirect da URL de login
        // Estes podem estar codificados como %2F (/) 
        const decodedDestination = decodeURIComponent(destination);
        logDebug(`Destino decodificado: ${decodedDestination}`);
        
        // Usar window.location.href para garantir uma navegação completa
        // que recarregará todos os componentes da página
        window.location.href = decodedDestination;
      } catch (err) {
        logError('Erro ao redirecionar', err);
        setError('Ocorreu um erro ao tentar redirecioná-lo.');
        setIsLoading(false);
      }
    };
    
    // Iniciar o processo
    checkSessionAndRedirect();
  }, [router, searchParams]);

  // Função para redirecionar manualmente
  const handleManualRedirect = () => {
    logDebug('Redirecionamento manual acionado pelo usuário');
    const destination = searchParams.get('redirect') || '/dashboard';
    window.location.href = decodeURIComponent(destination);
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
          
          {Object.keys(debugInfo).length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-40">
              <h3 className="font-bold mb-1">Informações de Diagnóstico:</h3>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
          
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