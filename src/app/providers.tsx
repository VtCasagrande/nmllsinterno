'use client';

import { ReactNode, useState, useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { EntregasProvider } from '@/contexts/EntregasContext';
import { WebhooksProvider } from '@/contexts/WebhooksContext';
import { SugestoesProvider } from '@/contexts/SugestoesContext';
import { TrocasProvider } from '@/contexts/TrocasContext';
import { AvisosProvider } from '@/contexts/AvisosContext';
import { ReembolsosProvider } from '@/contexts/ReembolsosContext';
import { RecorrenciasProvider } from '@/contexts/RecorrenciasContext';
import { CRMProvider } from '@/contexts/CRMContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { ToastProvider } from '@/components/ui/toast-provider';

export function Providers({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Registrar erros não capturados
    const handleError = (event: ErrorEvent) => {
      console.error('Erro não capturado em providers:', event.error);
      setError(event.error);
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (error) {
    console.error('Erro no provider:', error);
  }

  // Implementação com tratamento de erros
  try {
    return (
      <ToastProvider>
        <AuthProvider>
          <FavoritesProvider>
            <EntregasProvider>
              <WebhooksProvider>
                <SugestoesProvider>
                  <TrocasProvider>
                    <AvisosProvider>
                      <ReembolsosProvider>
                        <RecorrenciasProvider>
                          <CRMProvider>
                            {children}
                          </CRMProvider>
                        </RecorrenciasProvider>
                      </ReembolsosProvider>
                    </AvisosProvider>
                  </TrocasProvider>
                </SugestoesProvider>
              </WebhooksProvider>
            </EntregasProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ToastProvider>
    );
  } catch (err) {
    console.error('Erro ao renderizar providers:', err);
    // Fallback para pelo menos Auth e Toast providers
    return (
      <ToastProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ToastProvider>
    );
  }
} 