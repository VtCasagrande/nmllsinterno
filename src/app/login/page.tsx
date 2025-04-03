'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { RedirectHelper } from './redirectHelper';

// Função de log melhorada para exibir no console
const logDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 📝 LOGIN DEBUG: ${message}`, data);
  } else {
    console.log(`[${timestamp}] 📝 LOGIN DEBUG: ${message}`);
  }
};

// Função de log de erro melhorada
const logError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ LOGIN ERROR: ${message}`, error);
};

function LoginContent() {
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
    lembrar: false
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [supabaseDetails, setSupabaseDetails] = useState<{
    url: string | null;
    key: string | null;
  }>({
    url: null,
    key: null
  });
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  
  // Verificar ambiente e configurações
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rnqdwjslfoxtdchxzgfr.supabase.co';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucWR3anNsZm94dGRjaHh6Z2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MjYwNDUsImV4cCI6MjA1OTAwMjA0NX0.xsvV72Gb8GVFcLMdMBwjn93WXZdXxNvS3ozfrgrnpbI';
    
    logDebug('Inicialização do componente de login', { url });
    
    setSupabaseDetails({
      url: url,
      key: key ? key.substring(0, 10) + '...' : key
    });
    
    // Verifica se há parâmetros de redirect
    const redirect = searchParams.get('redirect');
    if (redirect) {
      logDebug(`Parâmetro de redirecionamento encontrado: ${redirect}`);
    }
    
    // Verifica se há mensagem de erro ou sucesso nos parâmetros
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    
    if (error) {
      logDebug(`Erro encontrado nos parâmetros: ${error}`);
      setLoginMessage({
        type: 'error',
        text: decodeURIComponent(error)
      });
    } else if (success) {
      logDebug(`Sucesso encontrado nos parâmetros: ${success}`);
      setLoginMessage({
        type: 'success',
        text: decodeURIComponent(success)
      });
    }
  }, [searchParams]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpa erro quando usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validarFormulario = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      logDebug('Validação do formulário falhou');
      return;
    }
    
    setIsLoading(true);
    setLoginMessage(null);
    
    try {
      logDebug(`Iniciando login para: ${formData.email}`);
      
      // Login direto com Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.senha,
      });
      
      if (error) {
        logError('Erro na resposta do Supabase:', error);
        setLoginMessage({
          type: 'error',
          text: error.message || 'Erro ao fazer login. Verifique suas credenciais e tente novamente.'
        });
        setIsLoading(false);
        return;
      }
      
      // Sucesso no login
      logDebug('Login bem-sucedido, preparando redirecionamento');
      
      // Mostrar mensagem de sucesso
      setLoginMessage({
        type: 'success',
        text: 'Login bem-sucedido. Redirecionando...'
      });
      
      // Atualizar o estado para parar o loading
      setIsLoading(false);
      
      // Verificar se há um caminho de redirecionamento nos parâmetros
      const redirectPath = searchParams.get('redirect');
      logDebug(`Parâmetro de redirecionamento: ${redirectPath}`);
      
      // Aguardar um pequeno tempo para garantir que a sessão foi estabelecida
      setTimeout(() => {
        try {
          // Se houver um parâmetro de redirecionamento e for para o dashboard, ir primeiro para a página intermediária
          if (redirectPath && (redirectPath === '/dashboard' || redirectPath.startsWith('/dashboard/'))) {
            logDebug('Redirecionando para a página intermediária');
            window.location.href = '/redirect-to-dashboard';
            return;
          }
          
          // Se houver um redirecionamento específico diferente do dashboard, ir para esse caminho
          if (redirectPath && redirectPath !== '/dashboard') {
            logDebug(`Redirecionando para caminho específico: ${redirectPath}`);
            window.location.href = redirectPath;
            return;
          }
          
          // Por padrão, redirecionar para a página intermediária
          logDebug('Redirecionando para a página intermediária (padrão)');
          window.location.href = '/redirect-to-dashboard';
        } catch (redirectErr) {
          logError('Erro ao processar redirecionamento:', redirectErr);
          // Em caso de erro, enviar para o dashboard diretamente como último recurso
          window.location.href = '/dashboard';
        }
      }, 300);
      
    } catch (error) {
      logError('Erro durante o login:', error);
      
      let errorMessage = 'Erro ao fazer login. Verifique suas credenciais e tente novamente.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setLoginMessage({
        type: 'error',
        text: errorMessage
      });
      setIsLoading(false);
    }
  };
  
  // Função para acessar dashboard diretamente
  const acessarDashboardDiretamente = () => {
    // Simplesmente navegar para a página de redirecionamento
    window.location.href = '/redirect-to-dashboard';
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
      {/* Componente auxiliar de redirecionamento */}
      <RedirectHelper />
      
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 flex items-center justify-center">
              <span className="text-xl font-bold text-blue-600">Nmalls Logo</span>
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Entrar no Sistema
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Acesse o sistema de gestão da Nmalls
          </p>
        </div>
        
        {loginMessage && (
          <div 
            className={`p-4 rounded-md ${
              loginMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {loginMessage.text}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="seu.email@exemplo.com"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                autoComplete="current-password"
                required
                value={formData.senha}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.senha ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="••••••••"
              />
              {errors.senha && (
                <p className="mt-2 text-sm text-red-600">{errors.senha}</p>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="lembrar"
                  name="lembrar"
                  type="checkbox"
                  checked={formData.lembrar}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="lembrar" className="ml-2 block text-sm text-gray-900">
                  Lembrar-me
                </label>
              </div>
              
              <div className="text-sm">
                <Link href="#" 
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-4">
          <button
            type="button"
            onClick={acessarDashboardDiretamente}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Acessar Dashboard Diretamente
          </button>
        </div>
        
        <div className="mt-6">
          <p className="text-center text-xs text-gray-500">
            Novo em nosso sistema? <Link href="#" className="font-medium text-blue-600 hover:text-blue-500">Solicite seu acesso</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // Log quando a página é renderizada
  useEffect(() => {
    logDebug('Página de login renderizada');
  }, []);
  
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginContent />
    </Suspense>
  );
} 