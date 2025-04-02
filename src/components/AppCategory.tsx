import React, { ReactNode } from 'react';

interface AppCategoryProps {
  title: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AppCategory({ title, children, className = '' }: AppCategoryProps) {
  try {
    return (
      <div className={`mb-6 ${className}`}>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 px-4 md:px-0">
          {title}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-4 md:px-0">
          {children}
        </div>
      </div>
    );
  } catch (error) {
    console.error(`Erro ao renderizar categoria "${title}":`, error);
    return (
      <div className={`mb-8 ${className}`}>
        <h2 className="text-lg font-semibold mb-3 px-4 text-gray-800">{title}</h2>
        <div className="px-4 py-2 text-red-600">
          Erro ao carregar itens desta categoria.
        </div>
      </div>
    );
  }
} 