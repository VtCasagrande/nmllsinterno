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
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    logDebug('Página de redirecionamento iniciada');
    
    // Função para redirecionar diretamente para o dashboard sem verificações adicionais
    const redirectToDashboard = () => {
      try {
        // Verificar parâmetros de URL
        const destination = searchParams.get('redirect') || '/dashboard';
        logDebug(`Executando redirecionamento para: ${destination}`);
        
        // Para URLs que vêm do parâmetro redirect da URL de login
        const decodedDestination = decodeURIComponent(destination);
        logDebug(`Destino decodificado: ${decodedDestination}`);
        
        // Redirecionar imediatamente para o dashboard
        window.location.replace(decodedDestination);
      } catch (err) {
        logError('Erro ao redirecionar', err);
        setError('Ocorreu um erro ao tentar redirecioná-lo.');
        setIsLoading(false);
      }
    };
    
    // Redirecionar imediatamente
    redirectToDashboard();
  }, [router, searchParams]);

  // Se estiver carregando, mostrar tela de carregamento
  if (isLoading && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2 text-blue-600">Redirecionando para o Dashboard</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Redirecionando você automaticamente...</p>
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
            <Link
              href="/dashboard"
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300 transition-colors text-center"
            >
              Tentar acessar o Dashboard mesmo assim
            </Link>
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