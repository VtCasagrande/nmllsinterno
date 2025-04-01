'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  profile: {
    id: string;
    name: string;
    role: string;
  } | null;
  signOut: () => void;
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
  // Simulação de um perfil de usuário
  const profile = {
    id: 'user-123',
    name: 'Usuário Demo',
    role: 'Administrador'
  };

  // Função para logout
  const signOut = () => {
    console.log('Usuário fez logout');
    // Em um sistema real, aqui limparia cookies, tokens, etc.
    // E redirecionaria para a página de login
  };

  return (
    <AuthContext.Provider value={{ profile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}; 