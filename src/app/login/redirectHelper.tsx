'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function RedirectHelper() {
  useEffect(() => {
    // Função para verificar autenticação e redirecionar
    const checkAuthAndRedirect = async () => {
      console.log('RedirectHelper: Verificando autenticação');
      
      try {
        // Verificar se há uma sessão armazenada
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log('RedirectHelper: Sessão encontrada, redirecionando para dashboard');
          // Redirecionar de forma direta e simples
          window.location.href = '/dashboard';
        } else {
          console.log('RedirectHelper: Sem sessão ativa');
        }
      } catch (error) {
        console.error('RedirectHelper: Erro ao verificar autenticação', error);
      }
    };
    
    // Executar verificação
    checkAuthAndRedirect();
    
    // Definir um intervalo para verificar periodicamente
    const interval = setInterval(() => {
      checkAuthAndRedirect();
    }, 2000);
    
    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(interval);
  }, []);
  
  // Este componente não renderiza nada visualmente
  return null;
} 