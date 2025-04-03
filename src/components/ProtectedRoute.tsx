'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Função de log melhorada para exibir no console
const logDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 🔒 PROTECTED ROUTE: ${message}`, data);
  } else {
    console.log(`[${timestamp}] 🔒 PROTECTED ROUTE: ${message}`);
  }
};

// Função de log de erro melhorada
const logError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ PROTECTED ROUTE ERROR: ${message}`, error);
};

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles = [] }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const { session, user, profile, loading: authLoading } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Se estamos carregando o contexto de autenticação, aguardar
        if (authLoading) {
          logDebug('Contexto de autenticação carregando');
          return;
        }

        // Se já temos uma sessão no contexto, o usuário está autenticado
        if (session) {
          logDebug('Usuário autenticado via contexto:', { userId: user?.id });
          
          // Se temos papéis restritos, verificar se o usuário tem acesso
          if (allowedRoles.length > 0) {
            const userRole = profile?.role || 'user';
            if (!allowedRoles.includes(userRole)) {
              logDebug('Usuário não tem papel permitido:', { userRole, allowedRoles });
              alert('Você não tem permissão para acessar esta página.');
              router.push('/dashboard');
              return;
            }
            logDebug('Usuário tem papel permitido:', { userRole });
          }
          
          // Usuário autenticado e com permissão
          setAuthorized(true);
          setLoading(false);
          return;
        }
        
        // Se não temos sessão no contexto, verificar diretamente no Supabase
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          logDebug('Usuário autenticado via Supabase:', { userId: data.session.user.id });
          // Tem sessão no Supabase, mas não no contexto - permitir acesso
          // O contexto será atualizado naturalmente
          setAuthorized(true);
          setLoading(false);
          return;
        }
        
        // Não há sessão, redirecionar para login
        logDebug('Usuário não autenticado, redirecionando para login');
        const currentPath = window.location.pathname;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        setLoading(false);
      } catch (error) {
        logError('Erro ao verificar autenticação:', error);
        // Em caso de erro, não redirecionar automaticamente
        // Isso evita loops infinitos em caso de problemas com a autenticação
        setLoading(false);
        setAuthorized(false);
      }
    };

    checkAuth();
  }, [router, allowedRoles, session, user, profile, authLoading]);

  // Mostrar loader enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
} 