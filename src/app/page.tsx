'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Função de log para debugging
const logDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 🏠 HOME: ${message}`, data);
  } else {
    console.log(`[${timestamp}] 🏠 HOME: ${message}`);
  }
};

export default function HomePage() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        logDebug('Verificando autenticação na página inicial');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          logDebug('Erro ao verificar sessão:', error);
          // Redirecionar para login após um breve atraso
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
          return;
        }
        
        if (data.session) {
          // Usuário já está logado, redirecionar para dashboard
          logDebug('Sessão ativa encontrada, redirecionando para dashboard');
          
          // Use um timeout para garantir que o redirecionamento ocorra 
          // mesmo se outros processos estiverem em andamento
          setTimeout(() => {
            // Usar o redirecionamento direto sem intermediários
            document.location.href = '/dashboard';
            
            // Como backup, tentar novamente após um breve atraso
            setTimeout(() => {
              window.location.replace('/dashboard');
            }, 200);
          }, 300);
        } else {
          // Redirecionar para login
          logDebug('Usuário não autenticado, redirecionando para login');
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        // Em caso de erro, redirecionar para login
        window.location.href = '/login';
      }
    };
    
    checkAuth();
  }, []);
  
  // Conteúdo de fallback enquanto verifica autenticação
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Nmalls</h1>
        <p className="text-gray-600 mb-4">Sistema de Gestão</p>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse delay-75"></div>
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse delay-150"></div>
        </div>
        <p className="text-sm text-gray-500 mt-4">Verificando autenticação...</p>
      </div>
    </div>
  );
} 