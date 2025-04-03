'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

// Função de log melhorada para exibir no console
const logDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 🔐 AUTH CONTEXT: ${message}`, data);
  } else {
    console.log(`[${timestamp}] 🔐 AUTH CONTEXT: ${message}`);
  }
};

// Função de log de erro melhorada
const logError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ AUTH CONTEXT ERROR: ${message}`, error);
};

// Tipos para o perfil do usuário e o contexto
export interface Profile {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  avatar_url?: string;
  created_at?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  profileLoaded: boolean;
  isAuthenticated: boolean;
  hasProfile: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Criação do contexto de autenticação
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// Propriedades do provedor de autenticação
interface AuthProviderProps {
  children: ReactNode;
}

// Provedor de autenticação
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  // Função para buscar o perfil do usuário
  const fetchProfile = async (userId: string) => {
    try {
      logDebug(`Buscando perfil para usuário: ${userId}`);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Perfil não encontrado, o que é esperado para novos usuários
          logDebug('Perfil não encontrado para o ID:', userId);
          setHasProfile(false);
          return null;
        } else {
          logError('Erro ao buscar perfil:', error);
          setHasProfile(false);
          throw error;
        }
      }

      if (data) {
        logDebug('Perfil encontrado:', { id: data.id, role: data.role });
        setProfile(data);
        setProfileLoaded(true);
        setHasProfile(true);
        return data;
      } else {
        logDebug('Nenhum perfil encontrado para o ID:', userId);
        setHasProfile(false);
        return null;
      }
    } catch (error) {
      logError('Erro ao buscar perfil:', error);
      setHasProfile(false);
      return null;
    }
  };

  // Função para refreshar perfil (útil após atualizações)
  const refreshProfile = async () => {
    if (!user) {
      logDebug('Não é possível atualizar o perfil: usuário não está logado');
      return;
    }
    
    try {
      logDebug('Atualizando perfil do usuário');
      await fetchProfile(user.id);
    } catch (error) {
      logError('Erro ao atualizar perfil:', error);
    }
  };

  // Novo efeito para redirecionamento
  useEffect(() => {
    // Verificar o estado de autenticação e redirecionar se necessário
    if (!loading && isAuthenticated && hasProfile) {
      // Não redirecionar se estiver na tela de login ou redirecionamento
      const isLoginPage = pathname?.includes('/login');
      const isRedirectPage = pathname?.includes('/redirect-to-dashboard');
      
      // Obter o destino de redirecionamento da URL se disponível
      let redirectPath = '/dashboard';
      if (isLoginPage && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectParam = urlParams.get('redirect');
        if (redirectParam && redirectParam !== '/login') {
          redirectPath = redirectParam;
        }
      }
      
      // Redirecionar para o dashboard ou destino especificado
      if (isLoginPage) {
        logDebug(`Usuário autenticado na página de login, redirecionando para: ${redirectPath}`);
        
        // Usar um pequeno timeout para garantir que os cookies sejam sincronizados
        setTimeout(() => {
          router.push(redirectPath);
        }, 100);
      }
    }
  }, [loading, isAuthenticated, hasProfile, pathname, router]);

  // Inicializar a autenticação e ouvir mudanças de sessão
  useEffect(() => {
    logDebug('Inicializando contexto de autenticação');
    
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        // Verificar se já existe uma sessão
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logError('Erro ao obter sessão atual:', sessionError);
          setError(sessionError.message);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        if (currentSession) {
          logDebug('Sessão ativa encontrada', { 
            userId: currentSession.user.id,
            expiresAt: currentSession.expires_at
          });
          
          // Atualizar estado com a sessão
          setSession(currentSession);
          setUser(currentSession.user);
          setIsAuthenticated(true);
          
          // Buscar perfil do usuário
          const userProfile = await fetchProfile(currentSession.user.id);
          if (!userProfile) {
            logDebug('Perfil não encontrado para usuário autenticado, criando um básico');
            const basicProfile = {
              id: currentSession.user.id,
              email: currentSession.user.email,
              role: 'user'
            };
            
            // Tentar criar o perfil na tabela profiles
            try {
              const { error: insertError } = await supabase
                .from('profiles')
                .insert([basicProfile]);
                
              if (insertError) {
                logError('Erro ao criar perfil básico:', insertError);
                setHasProfile(false);
              } else {
                logDebug('Perfil básico criado com sucesso');
                setProfile(basicProfile);
                setProfileLoaded(true);
                setHasProfile(true);
              }
            } catch (insertErr) {
              logError('Exceção ao criar perfil básico:', insertErr);
              setHasProfile(false);
            }
          }
        } else {
          logDebug('Nenhuma sessão ativa encontrada');
          setIsAuthenticated(false);
          setHasProfile(false);
        }
      } catch (error) {
        logError('Erro ao inicializar autenticação:', error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Erro desconhecido ao inicializar autenticação');
        }
        setIsAuthenticated(false);
        setHasProfile(false);
      } finally {
        setLoading(false);
      }
    };
    
    // Inicializar o estado de autenticação
    initializeAuth();
    
    // Configurar listener para alterações de auth
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      logDebug(`Evento de autenticação: ${event}`, { sessionExists: !!newSession });
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (newSession) {
          logDebug('Usuário fez login ou token atualizado', { userId: newSession.user.id });
          
          // Atualizar o estado com a nova sessão
          setSession(newSession);
          setUser(newSession.user);
          setIsAuthenticated(true);
          
          // Resetar estado de perfil carregado
          setProfileLoaded(false);
          
          // Buscar perfil do usuário
          try {
            const userProfile = await fetchProfile(newSession.user.id);
            
            // Se não encontrou perfil, criar perfil básico
            if (!userProfile) {
              logDebug('Perfil não encontrado após evento de autenticação, criando perfil básico');
              const basicProfile = {
                id: newSession.user.id,
                email: newSession.user.email,
                role: 'user'
              };
              
              // Tentar criar o perfil na tabela profiles
              try {
                const { error: insertError } = await supabase
                  .from('profiles')
                  .insert([basicProfile]);
                  
                if (insertError) {
                  logError('Erro ao criar perfil básico após evento:', insertError);
                  setHasProfile(false);
                } else {
                  logDebug('Perfil básico criado com sucesso após evento');
                  setProfile(basicProfile);
                  setProfileLoaded(true);
                  setHasProfile(true);
                }
              } catch (insertErr) {
                logError('Exceção ao criar perfil básico após evento:', insertErr);
                setHasProfile(false);
              }
            }

            // Determinar o redirecionamento baseado na página atual
            if (pathname?.includes('/login')) {
              let redirectPath = '/dashboard';
              if (typeof window !== 'undefined') {
                const urlParams = new URLSearchParams(window.location.search);
                const redirectParam = urlParams.get('redirect');
                if (redirectParam && !redirectParam.includes('/login')) {
                  redirectPath = redirectParam;
                }
              }
              
              logDebug(`Redirecionando para ${redirectPath} após autenticação`);
              // Usar window.location para uma navegação completa que atualize o estado dos cookies
              window.location.href = redirectPath;
            }
          } catch (error) {
            logError('Erro ao processar profile após autenticação:', error);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        logDebug('Usuário fez logout');
        setSession(null);
        setUser(null);
        setProfile(null);
        setProfileLoaded(false);
        setIsAuthenticated(false);
        setHasProfile(false);
        
        // Redirecionar para login após logout usando window.location para garantir refresh total
        window.location.href = '/login';
      } else if (event === 'USER_UPDATED') {
        logDebug('Dados do usuário atualizados');
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          await fetchProfile(newSession.user.id);
        }
      }
    });
    
    // Cleanup do listener
    return () => {
      logDebug('Limpando listener de autenticação');
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Função para fazer login
  const signIn = async (email: string, password: string) => {
    try {
      logDebug(`Tentando fazer login com email: ${email}`);
      setLoading(true);
      
      // Verificar se já existe uma sessão e fazer logout se necessário
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        logDebug('Sessão existente encontrada, fazendo logout primeiro');
        await supabase.auth.signOut();
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logError('Erro no login:', error);
        setIsAuthenticated(false);
        setHasProfile(false);
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (!data.session) {
        logError('Login sem sessão retornada');
        setIsAuthenticated(false);
        setHasProfile(false);
        setLoading(false);
        return { success: false, error: 'Falha ao criar sessão' };
      }

      logDebug('Login bem-sucedido:', { userId: data.user?.id });
      setSession(data.session);
      setUser(data.user);
      setIsAuthenticated(true);
      
      // Se login bem-sucedido, buscar perfil
      if (data.user) {
        try {
          const fetchedProfile = await fetchProfile(data.user.id);
          
          // Se não encontrou perfil, criar um básico
          if (!fetchedProfile) {
            logDebug('Perfil não encontrado após login, criando perfil básico');
            const basicProfile = {
              id: data.user.id,
              email: data.user.email,
              role: 'user'
            };
            
            // Tentar criar o perfil na tabela profiles
            try {
              const { error: insertError } = await supabase
                .from('profiles')
                .insert([basicProfile]);
                
              if (insertError) {
                logError('Erro ao criar perfil básico:', insertError);
                setHasProfile(false);
              } else {
                logDebug('Perfil básico criado com sucesso');
                setProfile(basicProfile);
                setProfileLoaded(true);
                setHasProfile(true);
              }
            } catch (insertErr) {
              logError('Exceção ao criar perfil básico:', insertErr);
              setHasProfile(false);
            }
          }
        } catch (profileError) {
          logError('Erro ao buscar/criar perfil após login:', profileError);
          // Definir um perfil básico mesmo com erro
          setProfile({
            id: data.user.id,
            email: data.user.email,
            role: 'user'
          });
          setProfileLoaded(true);
          setHasProfile(true);
        } finally {
          // Garantir que o loading seja sempre desativado
          setLoading(false);
        }
      } else {
        setLoading(false);
      }

      return { success: true };
    } catch (error) {
      logError('Erro durante o processo de login:', error);
      setLoading(false);
      setIsAuthenticated(false);
      setHasProfile(false);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Erro desconhecido ao fazer login' };
    }
  };

  // Função para fazer logout
  const signOut = async () => {
    try {
      logDebug('Iniciando logout');
      
      // Limpar estado local antes de chamar signOut para evitar estado inconsistente
      setProfile(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        logError('Erro ao fazer logout:', error);
        throw error;
      }
      
      // Reset completo do estado
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
      setHasProfile(false);
      
      logDebug('Logout realizado com sucesso');
    } catch (error) {
      logError('Erro durante o processo de logout:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro desconhecido ao fazer logout');
      }
    }
  };

  // Valores do contexto
  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
    error,
    profileLoaded,
    isAuthenticated,
    hasProfile,
    signIn,
    signOut,
    refreshProfile,
  };

  logDebug('Renderizando AuthProvider', { 
    isAuthenticated,
    hasProfile,
    isLoading: loading
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 