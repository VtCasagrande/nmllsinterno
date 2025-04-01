import React from 'react';
import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  children: React.ReactNode;
}

const buttonVariants = {
  default: 'bg-blue-600 text-white hover:bg-blue-700',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-gray-300 bg-white hover:bg-gray-100 text-gray-700',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  ghost: 'hover:bg-gray-100 text-gray-700',
  link: 'text-blue-600 underline-offset-4 hover:underline'
};

const buttonSizes = {
  default: 'h-10 py-2 px-4 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10'
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none';
    const variantClasses = buttonVariants[variant] || buttonVariants.default;
    const sizeClasses = buttonSizes[size] || buttonSizes.default;
    const allClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`;

    if (asChild) {
      // Se asChild for true, envolvemos os children em um elemento Link
      return (
        <span className={allClasses} data-shadcn-button>
          {children}
        </span>
      );
    }

    return (
      <button
        className={allClasses}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
