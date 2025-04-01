'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      console.log('Iniciando login de demonstração...');
      const response = await fetch('/api/demo-login');
      const data = await response.json();
      
      if (response.ok) {
        console.log('Login de demonstração bem-sucedido!');
        router.push('/dashboard');
      } else if (response.status === 409) {
        // Código 409 significa "Conflict" - usuário já existe
        console.log('Usuário demo já existe, redirecionando para login');
        setSuccessMessage('Usuário de demonstração já existe. Redirecionando para a página de login...');
        
        // Aguarda 2 segundos antes de redirecionar
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        console.error('Erro no login de demonstração:', data.error);
        setErrorMessage(data.error || 'Erro ao fazer login de demonstração');
        
        if (data.details) {
          setSuccessMessage(data.details);
        }
      }
    } catch (error) {
      console.error('Erro ao processar login de demonstração:', error);
      setErrorMessage('Erro ao processar login de demonstração. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">Bem-vindo ao Sistema Interno da Nmalls</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
          <Link href="/login" 
            className="group rounded-lg border border-gray-300 px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              Login{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h2>
            <p className="m-0 text-sm opacity-70">
              Acesse o sistema com suas credenciais
            </p>
          </Link>

          <Link href="/register"
            className="group rounded-lg border border-gray-300 px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              Registro{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h2>
            <p className="m-0 text-sm opacity-70">
              Registre-se para acessar o sistema
            </p>
          </Link>
        </div>
        
        {errorMessage && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 max-w-3xl mx-auto" role="alert">
            <p>{errorMessage}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 max-w-3xl mx-auto" role="alert">
            <p>{successMessage}</p>
          </div>
        )}
        
        <div className="text-center">
          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? "Carregando..." : "Entrar como Demonstração"}
          </button>
          <p className="mt-2 text-sm text-gray-600">Experimente sem precisar de cadastro</p>
          <p className="mt-1 text-xs text-gray-500">Email: demo@nmalls.com / Senha: demo123</p>
        </div>
      </div>
    </main>
  );
} 