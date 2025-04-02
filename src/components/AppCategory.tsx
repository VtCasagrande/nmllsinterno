import React from 'react';

interface AppCategoryProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function AppCategory({ title, children, className = '' }: AppCategoryProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <h2 className="text-lg font-semibold mb-3 px-4 text-gray-700">{title}</h2>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 px-4">
        {children}
      </div>
    </div>
  );
} 