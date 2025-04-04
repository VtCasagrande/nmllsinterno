'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthError } from '@supabase/supabase-js';

// Componentes e ícones
const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const SuccessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

// Função de log
const logger = {
  debug: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[${timestamp}] 📝 LOGIN: ${message}`, data);
    } else {
      console.log(`[${timestamp}] 📝 LOGIN: ${message}`);
    }
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ LOGIN ERROR: ${message}`, error);
  }
};

// Interface para mensagens de feedback
interface FeedbackMessage {
  type: 'success' | 'error' | 'info';
  text: string;
}

// Componente principal de login
function LoginContent() {
  // Estado do formulário
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  // Estados da UI
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<FeedbackMessage | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  // Hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, isAuthenticated, hasProfile, loading: authLoading } = useAuth();
  
  // Efeitos
  useEffect(() => {
    logger.debug('Inicializando componente de login');
    
    // Verificar parâmetros da URL para mensagens ou redirecionamentos
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    const redirect = searchParams.get('redirect');
    
    if (error) {
      setMessage({
        type: 'error',
        text: decodeURIComponent(error)
      });
    } else if (success) {
      setMessage({
        type: 'success',
        text: decodeURIComponent(success)
      });
    }
    
    if (redirect) {
      logger.debug(`Parâmetro de redirecionamento detectado: ${redirect}`);
    }
    
    // Verificar se usuário já está autenticado
    if (isAuthenticated && hasProfile && !authLoading) {
      logger.debug('Usuário já autenticado, AuthContext irá redirecionar');
    }
  }, [searchParams, isAuthenticated, hasProfile, authLoading]);
  
  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro ao digitar
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };
  
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    // Validação de email
    if (!formData.email) {
      errors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    
    // Validação de senha
    if (!formData.password) {
      errors.password = 'Senha é obrigatória';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      logger.debug('Iniciando processo de login', { email: formData.email });
      
      const result = await signIn(formData.email, formData.password);
      
      if (result.success) {
        logger.debug('Login bem-sucedido, aguardando redirecionamento pelo AuthContext');
        
        setMessage({
          type: 'success',
          text: 'Login realizado com sucesso! Redirecionando...'
        });
        
        // O redirecionamento será gerenciado pelo AuthContext
      } else {
        logger.error('Falha no login', result.error);
        
        setMessage({
          type: 'error',
          text: result.error || 'Falha na autenticação, verifique suas credenciais.'
        });
        
        setIsLoading(false);
      }
    } catch (error) {
      logger.error('Erro durante o processo de login', error);
      
      setMessage({
        type: 'error',
        text: 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
      });
      
      setIsLoading(false);
    }
  };
  
  // Função para acessar diretamente o dashboard (apenas em desenvolvimento)
  const accessDashboardDirectly = () => {
    window.location.href = '/dashboard?_auth_bypass=true&_direct_access=true';
  };
  
  // Função para limpar o estado de autenticação e tentar novamente
  const resetAuthAndTryAgain = () => {
    logger.debug('Limpando estado de autenticação e cookies');
    
    // Limpar cookies de autenticação
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
    
    // Forçar logout no Supabase
    supabase.auth.signOut().then(() => {
      logger.debug('Logout forçado realizado');
      
      // Recarregar a página sem parâmetros de redirecionamento
      setTimeout(() => {
        window.location.href = '/login?reset=true';
      }, 500);
    }).catch((error: AuthError | any) => {
      logger.error('Erro ao fazer logout forçado', error);
      window.location.href = '/login?reset=true';
    });
  };
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Seção de imagem/branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-700 opacity-20"></div>
        <div className="z-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-6">Nmalls Sistema</h1>
          <p className="text-blue-100 text-xl max-w-md">
            Plataforma completa de gestão para todas as suas necessidades empresariais.
          </p>
          
          <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-lg">
            <blockquote className="italic text-white">
              "Nossa plataforma centraliza todas as operações essenciais ao seu negócio em um único lugar."
            </blockquote>
            <p className="mt-4 text-blue-200 font-semibold">Equipe Nmalls</p>
          </div>
        </div>
        
        {/* Design elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-800/30 to-transparent"></div>
        <div className="absolute top-20 right-20 w-40 h-40 rounded-full bg-blue-500 filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-20 left-20 w-60 h-60 rounded-full bg-indigo-500 filter blur-3xl opacity-20"></div>
      </div>
      
      {/* Formulário de login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800">Bem-vindo de volta</h2>
            <p className="text-gray-600 mt-2">Faça login para acessar o sistema</p>
          </div>
          
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'error' ? 'bg-red-50 text-red-700' : 
              message.type === 'success' ? 'bg-green-50 text-green-700' : 
              'bg-blue-50 text-blue-700'
            }`}>
              {message.type === 'error' ? <ErrorIcon /> : 
               message.type === 'success' ? <SuccessIcon /> : null}
              <span>{message.text}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  validationErrors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="seu@email.com"
                disabled={isLoading}
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <Link 
                  href="#" 
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    validationErrors.password ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                
                <button 
                  type="button"
                  className="absolute right-3 top-3 text-gray-500"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-lg font-medium ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
              } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span className="ml-2">Entrando...</span>
                </>
              ) : 'Entrar'}
            </button>
          </form>
          
          {/* Opção para resolver problemas de login */}
          <div className="mt-6 text-center">
            <button 
              onClick={resetAuthAndTryAgain}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Problemas para entrar? Limpar dados de autenticação
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-3">Opções de desenvolvimento:</p>
              <button
                type="button"
                onClick={accessDashboardDirectly}
                className="w-full text-xs py-2 px-4 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Acessar dashboard (bypass auth)
              </button>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Nmalls. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Exportação com Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
} 