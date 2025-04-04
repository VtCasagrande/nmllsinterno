'use client';

import React, { ReactNode } from 'react';

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: string[];
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  // Versão simplificada que não faz verificações de autenticação
  // Apenas renderiza o conteúdo filho diretamente
  
  console.log('ProtectedRoute: renderizando conteúdo sem verificação de autenticação');
  
  return <>{children}</>;
} 