import React from 'react';
import { X } from 'lucide-react';
import { Toast as ToastType } from './use-toast';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const { id, title, description, variant = 'default' } = toast;

  const variantStyles = {
    default: 'bg-white border-gray-200',
    destructive: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  };

  return (
    <div
      className={`${variantStyles[variant]} shadow-lg rounded-lg border p-4 mb-3 flex items-start`}
      role="alert"
    >
      <div className="flex-1">
        <h3 className="font-medium text-sm">{title}</h3>
        {description && <p className="text-sm mt-1 text-gray-600">{description}</p>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="text-gray-400 hover:text-gray-600"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-72 max-w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}; 