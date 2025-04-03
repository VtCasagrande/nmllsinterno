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
  const [bypassAuth, setBypassAuth] = useState(false);
  const router = useRouter();
  const { session, user, profile, loading: authLoading } = useAuth();

  logDebug('Inicializando ProtectedRoute', { allowedRoles, authLoading, hasSession: !!session, hasProfile: !!profile });

  useEffect(() => {
    // Em modo de desenvolvimento, permitir ver a página sem autenticação
    // Isso é apenas para fins de desenvolvimento/demonstração
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Se o contexto de autenticação ainda estiver carregando, aguarde
    if (authLoading) {
      logDebug('Contexto de autenticação ainda está carregando, aguardando...');
      return;
    }

    // Verificação de autenticação usando Supabase
    const checkAuth = async () => {
      try {
        logDebug('Verificando autenticação');
        
        // Se já temos uma sessão no contexto de autenticação, use-a
        if (session && user) {
          logDebug('Sessão ativa encontrada no contexto', { 
            userId: user.id
          });
          
          // Verificar se temos o perfil do usuário
          if (!profile) {
            logDebug('Sessão existe mas perfil ainda não está disponível');
            
            if (isDevelopment) {
              logDebug('Modo de desenvolvimento: permitindo acesso sem perfil');
              setBypassAuth(true);
              setLoading(false);
              return;
            }

            // Em produção, aguarde um pouco mais antes de redirecionar
            // Isso dá tempo para o perfil ser carregado pelo AuthContext
            logDebug('Aguardando carregamento do perfil...');
            
            // Verificar direto no Supabase
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
              
            if (profileError || !profileData) {
              logError('Erro ao buscar perfil direto:', profileError);
              // Falha ao buscar perfil, mas o usuário está autenticado
              // Permitir acesso mesmo sem perfil completo
              logDebug('Não foi possível buscar perfil, mas usuário está autenticado');
              setAuthorized(true);
              setLoading(false);
              return;
            }
            
            logDebug('Perfil encontrado diretamente do Supabase', profileData);
            
            // Verificar permissões com base no papel do usuário
            const userRole = profileData.role || 'user';
            
            const hasRequiredRole = 
              allowedRoles.length === 0 || 
              allowedRoles.includes(userRole);
              
            if (!hasRequiredRole && !isDevelopment) {
              logDebug('Acesso negado - redirecionando para dashboard');
              alert('Você não tem permissão para acessar esta página.');
              router.push('/dashboard');
              return;
            }
            
            setAuthorized(true);
            setLoading(false);
            return;
          } else {
            logDebug('Perfil encontrado no contexto', {
              id: profile.id,
              role: profile.role
            });
            
            // Verificar permissões com base no papel do usuário
            const userRole = profile.role || 'user';
            
            // Verificar se o papel do usuário está na lista de papéis permitidos
            // Se allowedRoles estiver vazio, permitir qualquer usuário autenticado
            const hasRequiredRole = 
              allowedRoles.length === 0 || 
              allowedRoles.includes(userRole);
            
            logDebug(`Verificando permissões: role=${userRole}, permitido=${hasRequiredRole}`);
            
            if (!hasRequiredRole) {
              // Usuário não tem permissão
              logDebug('Usuário sem permissão adequada');
              
              if (isDevelopment) {
                logDebug('Modo de desenvolvimento: permitindo acesso mesmo sem permissão adequada');
                setBypassAuth(true);
                setLoading(false);
                return;
              }
              
              // Em produção, mostrar alerta e redirecionar
              logDebug('Acesso negado - redirecionando para dashboard');
              alert('Você não tem permissão para acessar esta página.');
              router.push('/dashboard');
              return;
            }

            // Usuário autenticado e autorizado
            logDebug('Usuário autenticado e autorizado');
            setAuthorized(true);
            setLoading(false);
            return;
          }
        } else {
          // Não há sessão no contexto, verificar diretamente no Supabase
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            logError('Erro ao verificar sessão:', sessionError);
            
            if (isDevelopment) {
              logDebug('Modo de desenvolvimento: permitindo acesso sem autenticação');
              setBypassAuth(true);
              setLoading(false);
              return;
            }
            
            logDebug('Redirecionando para login (erro na sessão)');
            router.push('/login');
            return;
          }
          
          if (!sessionData.session) {
            logDebug('Sem sessão ativa');
            
            if (isDevelopment) {
              logDebug('Modo de desenvolvimento: permitindo acesso sem autenticação');
              setBypassAuth(true);
              setLoading(false);
              return;
            }
            
            logDebug('Redirecionando para login (sem sessão)');
            router.push('/login');
            return;
          }
          
          // Há uma sessão válida no Supabase, mas não está no contexto
          // Isso não deveria acontecer normalmente, mas permitimos o acesso
          logDebug('Sessão ativa encontrada diretamente no Supabase mas não no contexto', { 
            userId: sessionData.session.user.id
          });
          
          setAuthorized(true);
          setLoading(false);
          return;
        }
      } catch (error) {
        logError('Erro ao verificar autenticação:', error);
        
        if (isDevelopment) {
          logDebug('Modo de desenvolvimento: permitindo acesso mesmo com erro de autenticação');
          setBypassAuth(true);
        } else {
          logDebug('Redirecionando para login (erro geral)');
          router.push('/login');
        }
        
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, allowedRoles, session, profile, user, authLoading]);

  // Mostrar loader enquanto verifica autenticação
  if (loading) {
    logDebug('Exibindo loader de autenticação');
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Se estiver em modo de desenvolvimento com bypass, mostrar um alerta informativo
  if (bypassAuth) {
    logDebug('Renderizando com bypass de autenticação (desenvolvimento)');
    return (
      <div>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold">Modo de Desenvolvimento</p>
          <p>
            Você está vendo esta página sem autenticação ou permissões adequadas.
            Este comportamento só ocorre em ambiente de desenvolvimento.
          </p>
        </div>
        {children}
      </div>
    );
  }

  // Renderizar o conteúdo somente se o usuário estiver autorizado
  logDebug(`Renderização final: autorizado=${authorized}`);
  return authorized ? <>{children}</> : null;
} 