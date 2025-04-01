import React, { createContext, ReactNode, useContext } from 'react';
import { useToast as useToastHook, Toast as ToastType } from './use-toast';
import { ToastContainer } from './toast';

interface ToastContextType {
  toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => string;
  dismiss: (id: string) => void;
  toasts: ToastType[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast, dismiss, toasts } = useToastHook();

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 