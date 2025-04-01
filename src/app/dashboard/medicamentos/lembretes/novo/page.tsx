'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NovoLembreteRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/dashboard/medicamentos/novo');
  }, [router]);
  
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="ml-3">Redirecionando...</p>
    </div>
  );
} 