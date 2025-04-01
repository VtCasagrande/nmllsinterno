'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles = [] }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [bypassAuth, setBypassAuth] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Em modo de desenvolvimento, permitir ver a página sem autenticação
    // Isso é apenas para fins de desenvolvimento/demonstração
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Simulação de verificação de autenticação
    // Em um cenário real, você verificaria com sua API ou solução de autenticação
    const checkAuth = async () => {
      try {
        // Simulando um atraso de rede
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Obtenha o usuário do localStorage (exemplo simplificado)
        const userJson = localStorage.getItem('nmalls_user');
        
        if (!userJson) {
          // Usuário não está logado
          if (isDevelopment) {
            console.warn('⚠️ Modo de desenvolvimento: permitindo acesso sem autenticação');
            setBypassAuth(true);
            setLoading(false);
            return;
          }
          
          // Em produção, redirecionar para login
          router.push('/login');
          return;
        }
        
        // Parse do JSON do usuário
        const user = JSON.parse(userJson);
        
        // Verificar se o papel do usuário está na lista de papéis permitidos
        // Se allowedRoles estiver vazio, permitir qualquer usuário autenticado
        const hasRequiredRole = 
          allowedRoles.length === 0 || 
          allowedRoles.includes(user.papel);
        
        if (!hasRequiredRole) {
          // Usuário não tem permissão
          if (isDevelopment) {
            console.warn('⚠️ Modo de desenvolvimento: permitindo acesso mesmo sem permissão adequada');
            setBypassAuth(true);
            setLoading(false);
            return;
          }
          
          // Em produção, mostrar alerta e redirecionar
          alert('Você não tem permissão para acessar esta página.');
          router.push('/dashboard');
          return;
        }
        
        // Usuário autenticado e autorizado
        setAuthorized(true);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        
        if (isDevelopment) {
          console.warn('⚠️ Modo de desenvolvimento: permitindo acesso mesmo com erro de autenticação');
          setBypassAuth(true);
        } else {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, allowedRoles]);

  // Mostrar loader enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Se estiver em modo de desenvolvimento com bypass, mostrar um alerta informativo
  if (bypassAuth) {
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
  return authorized ? <>{children}</> : null;
} 