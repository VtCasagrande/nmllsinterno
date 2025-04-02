'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logAction } from '@/lib/supabase';

interface AuthContextType {
  profile: {
    id: string;
    name: string;
    role: string;
    email: string;
  } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Verificar autenticação ao iniciar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          setProfile(null);
          setLoading(false);
          return;
        }
        
        // Buscar perfil do usuário
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
        
        if (profileData) {
          setProfile({
            id: data.session.user.id,
            email: data.session.user.email || '',
            name: profileData.name,
            role: profileData.role
          });
        } else {
          setProfile({
            id: data.session.user.id,
            email: data.session.user.email || '',
            name: data.session.user.email || 'Usuário',
            role: 'user'
          });
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Buscar perfil do usuário
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileData) {
          setProfile({
            id: session.user.id,
            email: session.user.email || '',
            name: profileData.name,
            role: profileData.role
          });
          
          await logAction(
            'login',
            `Usuário ${profileData.name} fez login`,
            'auth',
            session.user.id,
            session.user.id
          );
        }
      }
      
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        router.push('/login');
      }
    });

    checkAuth();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Função para login
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error || !data.user) {
        return { 
          success: false, 
          error: error ? error.message : 'Falha na autenticação' 
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido no login' 
      };
    }
  };

  // Função para logout
  const signOut = async () => {
    try {
      if (profile) {
        await logAction(
          'logout',
          `Usuário ${profile.name} fez logout`,
          'auth',
          profile.id,
          profile.id
        );
      }
      
      await supabase.auth.signOut();
      setProfile(null);
      router.push('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}; 