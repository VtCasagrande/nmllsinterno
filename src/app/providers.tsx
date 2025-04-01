'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { EntregasProvider } from '@/contexts/EntregasContext';
import { WebhooksProvider } from '@/contexts/WebhooksContext';
import { SugestoesProvider } from '@/contexts/SugestoesContext';
import { TrocasProvider } from '@/contexts/TrocasContext';
import { AvisosProvider } from '@/contexts/AvisosContext';
import { ReembolsosProvider } from '@/contexts/ReembolsosContext';
import { RecorrenciasProvider } from '@/contexts/RecorrenciasContext';
import { CRMProvider } from '@/contexts/CRMContext';
import { ToastProvider } from '@/components/ui/toast-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
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
      </AuthProvider>
    </ToastProvider>
  );
} 