'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToNovaEntrega() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página correta de cadastro de entrega
    router.replace('/dashboard/entregas/rotas/nova');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecionando para o formulário de nova entrega...</p>
      </div>
    </div>
  );
} 