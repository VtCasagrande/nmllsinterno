'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  profile: {
    id: string;
    name: string;
  } | null;
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
  };

  return (
    <AuthContext.Provider value={{ profile }}>
      {children}
    </AuthContext.Provider>
  );
}; 