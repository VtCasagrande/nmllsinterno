'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar diretamente para o dashboard
    console.log('Redirecionando para o dashboard...');
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <h2 className="mt-6 text-2xl font-bold">Nmalls</h2>
        <p className="mt-4 text-gray-600">Carregando o sistema...</p>
      </div>
    </div>
  );
} 