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
  const { session, user, profile, profileLoaded, loading: authLoading } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        logDebug('Iniciando verificação de autenticação', { 
          hasSession: !!session, 
          hasProfile: !!profile,
          profileLoaded: profileLoaded
        });
        
        // Função para redirecionar para login com um caminho
        const redirectToLogin = (currentPath: string) => {
          try {
            // Garantir que o caminho está no formato correto
            const encodedPath = encodeURIComponent(currentPath.startsWith('/') ? currentPath : `/${currentPath}`);
            const loginUrl = `/login?redirect=${encodedPath}`;
            
            logDebug(`Redirecionando para login com caminho: ${encodedPath}`);
            
            // Fazer o redirecionamento usando o router
            router.push(loginUrl);
            
            // Como último recurso, em caso de problemas com o router
            setTimeout(() => {
              if (!authorized) {
                logDebug('Usando redirecionamento direto como backup');
                window.location.href = loginUrl;
              }
            }, 500);
          } catch (err) {
            logError('Erro ao redirecionar para login', err);
            // Em caso de erro, tentar redirecionamento direto com URL padrão
            window.location.href = '/login';
          }
        };
        
        // Se estamos carregando o contexto de autenticação e ainda temos tentativas, aguardar
        if ((authLoading || (session && !profileLoaded)) && retryCount < MAX_RETRIES) {
          logDebug(`Aguardando carregamento completo, tentativa ${retryCount + 1} de ${MAX_RETRIES + 1}`);
          // Incrementar contador de tentativas
          setRetryCount(prev => prev + 1);
          // Tentar novamente após um breve delay
          setTimeout(() => checkAuth(), 800);
          return;
        }

        // Se já temos uma sessão no contexto E o perfil foi carregado, o usuário está autenticado
        if (session && profileLoaded) {
          logDebug('Usuário autenticado via contexto com perfil carregado:', { 
            userId: user?.id, 
            profileId: profile?.id,
            role: profile?.role 
          });
          
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
        
        // Se temos sessão mas o perfil ainda não foi carregado, e já esgotamos as tentativas
        if (session && !profileLoaded && retryCount >= MAX_RETRIES) {
          logDebug('Sessão existe, mas perfil não foi carregado após várias tentativas. Forçando carregamento...');
          
          try {
            // Tentar carregar o perfil diretamente
            if (user) {
              // Buscar perfil diretamente do Supabase
              const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
                
              if (!error && data) {
                logDebug('Perfil obtido manualmente:', data);
                // Perfil obtido com sucesso, permitir acesso
                setAuthorized(true);
                setLoading(false);
                return;
              }
            }
          } catch (profileErr) {
            logError('Erro ao carregar perfil manualmente:', profileErr);
          }
        }
        
        // Se não temos sessão no contexto, verificar diretamente no Supabase
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logError('Erro ao verificar sessão do Supabase:', sessionError);
          throw sessionError;
        }
        
        if (data.session) {
          logDebug('Usuário autenticado via Supabase:', { userId: data.session.user.id });
          
          // Temos uma sessão, mas precisamos verificar o perfil
          try {
            // Buscar perfil diretamente
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single();
              
            if (!profileError && profileData) {
              logDebug('Perfil obtido do Supabase:', profileData);
              
              // Verificar permissões se necessário
              if (allowedRoles.length > 0) {
                const userRole = profileData.role || 'user';
                if (!allowedRoles.includes(userRole)) {
                  logDebug('Usuário não tem papel permitido:', { userRole, allowedRoles });
                  alert('Você não tem permissão para acessar esta página.');
                  router.push('/dashboard');
                  return;
                }
              }
              
              // Perfil obtido e verificado, permitir acesso
              setAuthorized(true);
              setLoading(false);
              return;
            }
          } catch (profileErr) {
            logError('Erro ao buscar perfil diretamente:', profileErr);
          }
        }
        
        // Tentar atualizar a sessão como último recurso antes de redirecionar
        try {
          logDebug('Tentando atualizar a sessão');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (!refreshError && refreshData.session) {
            logDebug('Sessão atualizada com sucesso via refresh', { 
              userId: refreshData.session.user.id 
            });
            
            // Buscar perfil após refresh
            try {
              const { data: refreshProfileData, error: refreshProfileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', refreshData.session.user.id)
                .single();
                
              if (!refreshProfileError && refreshProfileData) {
                logDebug('Perfil obtido após refresh:', refreshProfileData);
                
                // Verificar permissões se necessário
                if (allowedRoles.length > 0) {
                  const userRole = refreshProfileData.role || 'user';
                  if (!allowedRoles.includes(userRole)) {
                    logDebug('Usuário não tem papel permitido após refresh:', { userRole, allowedRoles });
                    alert('Você não tem permissão para acessar esta página.');
                    router.push('/dashboard');
                    return;
                  }
                }
                
                // Permitir acesso após refresh e verificação de perfil
                setAuthorized(true);
                setLoading(false);
                return;
              }
            } catch (refreshProfileErr) {
              logError('Erro ao buscar perfil após refresh:', refreshProfileErr);
            }
          }
        } catch (refreshErr) {
          logError('Erro ao atualizar sessão', refreshErr);
        }
        
        // Usuário não está autenticado se chegou até aqui
        logDebug('Usuário não autenticado, preparando redirecionamento para login');
        const currentPath = window.location.pathname;
        redirectToLogin(currentPath);
        
        setLoading(false);
      } catch (error) {
        logError('Erro ao verificar autenticação:', error);
        
        // Em caso de erro, tentar uma última verificação direta
        try {
          logDebug('Tentando verificação direta com o armazenamento local');
          // Verificar se temos um objeto user no localStorage como último recurso
          const localStorageAuth = localStorage.getItem('supabase.auth.token');
          
          if (localStorageAuth) {
            logDebug('Encontrada informação de auth no localStorage, tentando verificar');
            // Tentar novamente a autenticação com o Supabase
            const { data } = await supabase.auth.getSession();
            
            if (data.session) {
              logDebug('Autenticação restaurada com sucesso');
              
              // Tentar buscar perfil
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.session.user.id)
                .single();
                
              if (!profileError && profileData) {
                // Verificar permissões se necessário
                if (allowedRoles.length > 0) {
                  const userRole = profileData.role || 'user';
                  if (!allowedRoles.includes(userRole)) {
                    router.push('/dashboard');
                    return;
                  }
                }
                
                setAuthorized(true);
                setLoading(false);
                return;
              }
            }
          }
        } catch (storageError) {
          logError('Erro ao verificar localStorage:', storageError);
        }
        
        // Se ainda não funcionou, redirecionar para login
        logDebug('Redirecionando para login após falha');
        router.push('/login');
        setLoading(false);
        setAuthorized(false);
      }
    };

    // Iniciar a verificação
    checkAuth();
  }, [router, allowedRoles, session, user, profile, profileLoaded, authLoading, retryCount, authorized]);

  // Mostrar loader enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
          {retryCount > 0 && session && !profileLoaded && (
            <p className="text-sm text-orange-600 mt-2">
              Carregando dados do perfil... ({retryCount}/{MAX_RETRIES})
            </p>
          )}
        </div>
      </div>
    );
  }

  // Retornar os filhos apenas se o usuário estiver autorizado
  return authorized ? <>{children}</> : null;
} 