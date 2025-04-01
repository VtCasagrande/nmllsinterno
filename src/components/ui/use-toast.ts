import { useState } from "react";

type ToastVariant = "default" | "destructive" | "success";

interface Toast {
  title: string;
  description?: string;
  variant?: ToastVariant;
  id: string;
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...options, id };
    
    setToasts((prev) => [...prev, newToast]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
    
    return id;
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    toast,
    dismiss,
    toasts
  };
}

export type { Toast, ToastOptions }; 