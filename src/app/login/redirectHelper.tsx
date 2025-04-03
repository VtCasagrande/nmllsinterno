'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function RedirectHelper() {
  const router = useRouter();
  
  useEffect(() => {
    // Função para verificar autenticação
    const checkAuth = async () => {
      console.log('RedirectHelper: Verificando autenticação');
      
      try {
        // Verificar se há uma sessão armazenada
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log('RedirectHelper: Sessão encontrada, pronta para redirecionar');
          // NÃO redirecionamos automaticamente, permitimos que o fluxo normal ocorra
          // O redirecionamento acontecerá através do componente de login ou da página de redirecionamento
        } else {
          console.log('RedirectHelper: Sem sessão ativa');
        }
      } catch (error) {
        console.error('RedirectHelper: Erro ao verificar autenticação', error);
      }
    };
    
    // Verificar apenas uma vez, não periodicamente
    checkAuth();
    
    // Removido o setInterval para evitar redirecionamentos indesejados
  }, []);
  
  // Este componente não renderiza nada visualmente
  return null;
} 