// Este arquivo não pode ser .ts já que contém JSX, vou comentar todo o conteúdo

// O arquivo precisará ser renomeado para .tsx
// Abaixo está o conteúdo comentado que deverá ser movido para o arquivo .tsx

/*
// Arquivo de índice para exportar todos os componentes de UI
// Este arquivo é um stub e pode ser expandido conforme a necessidade

import { ReactNode } from 'react';

// Card component
export const Card = ({ children, className = "" }: { children: ReactNode, className?: string }) => {
  return <div className={`bg-white p-6 rounded-lg shadow ${className}`}>{children}</div>;
};

// Button component
interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export const Button = ({ 
  children, 
  onClick, 
  variant = 'default', 
  size = 'md',
  className = "",
  disabled = false
}: ButtonProps) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-md transition-colors";
  
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50",
    ghost: "bg-transparent text-blue-600 hover:bg-blue-50"
  };
  
  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};

// Badge component
interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
}

export const Badge = ({
  children,
  variant = 'default',
  className = ""
}: BadgeProps) => {
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    outline: "bg-transparent border border-gray-300 text-gray-700"
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Tabs components
interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

export const Tabs = ({ children }: TabsProps) => {
  return <div className="space-y-4">{children}</div>;
};

export const TabsList = ({ children }: { children: ReactNode }) => {
  return <div className="flex border-b border-gray-200">{children}</div>;
};

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  onClick?: () => void;
}

export const TabsTrigger = ({ value, children, onClick }: TabsTriggerProps) => {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:text-gray-700 focus:border-gray-300"
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ children }: { children: ReactNode }) => {
  return <div>{children}</div>;
};

// Tooltip components
export const TooltipProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export const Tooltip = ({ children }: { children: ReactNode }) => {
  return <div className="relative">{children}</div>;
};

export const TooltipTrigger = ({ asChild, children }: { asChild?: boolean, children: ReactNode }) => {
  return <div className="cursor-pointer">{children}</div>;
};

export const TooltipContent = ({ children }: { children: ReactNode }) => {
  return (
    <div className="absolute z-10 px-3 py-2 text-sm bg-gray-900 text-white rounded-md shadow-lg top-full mt-1">
      {children}
    </div>
  );
};

// Avatar components
export const Avatar = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative inline-block h-8 w-8 rounded-full overflow-hidden bg-gray-100">
      {children}
    </div>
  );
};

export const AvatarGroup = ({ children }: { children: ReactNode }) => {
  return <div className="flex -space-x-2">{children}</div>;
}; 
*/ 

export * from "./spinner";
export * from "./label";
export * from "./textarea"; 