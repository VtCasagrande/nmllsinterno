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
    // Aguardar o contexto de autenticação terminar de carregar
    if (authLoading) {
      logDebug('Contexto de autenticação ainda está carregando');
      return;
    }

    const checkAuth = async () => {
      try {
        // Se já temos sessão, o usuário está autenticado
        if (session) {
          logDebug('Usuário autenticado:', { userId: user?.id });

          // Se há papéis permitidos específicos, verificar se o usuário tem acesso
          if (allowedRoles.length > 0) {
            const userRole = profile?.role || 'user';
            const hasRole = allowedRoles.includes(userRole);

            if (!hasRole) {
              logDebug('Usuário não tem papel requerido:', { 
                userRole, 
                requiredRoles: allowedRoles 
              });
              
              // Em produção, mostrar alerta e redirecionar
              alert('Você não tem permissão para acessar esta página.');
              router.push('/dashboard');
              setLoading(false);
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
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          logDebug('Sessão encontrada diretamente no Supabase');
          // Há uma sessão, mas não está no contexto - provavelmente o contexto ainda não atualizou
          // Vamos permitir o acesso e deixar o contexto atualizar naturalmente
          setAuthorized(true);
          setLoading(false);
          return;
        }
        
        // Nenhuma sessão encontrada, redirecionar para login
        logDebug('Usuário não autenticado, redirecionando para login');
        const currentPath = window.location.pathname;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        setLoading(false);
      } catch (error) {
        logError('Erro ao verificar autenticação:', error);
        // Em caso de erro, redirecionar para login
        router.push('/login');
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, allowedRoles, session, user, profile, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
} 