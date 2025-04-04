'use client';

import React, { ReactNode } from 'react';

interface AppCategoryProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function AppCategory({ title, children, className = '' }: AppCategoryProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {children}
      </div>
    </div>
  );
} 