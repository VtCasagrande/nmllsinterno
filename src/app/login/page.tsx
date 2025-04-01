'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
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
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Verifica se há parâmetros de demo
  useEffect(() => {
    const demo = searchParams.get('demo');
    
    if (demo === 'true') {
      setFormData({
        email: 'demo@nmalls.com',
        senha: 'demo123',
        lembrar: false
      });
      
      setLoginMessage({
        type: 'success',
        text: 'Usuário de demonstração carregado. Clique em "Entrar" para continuar.'
      });
    }
    
    // Verifica se há mensagem de erro ou sucesso nos parâmetros
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    
    if (error) {
      setLoginMessage({
        type: 'error',
        text: decodeURIComponent(error)
      });
    } else if (success) {
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
      return;
    }
    
    setIsLoading(true);
    setLoginMessage(null);
    
    try {
      // Simulação de chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificação especial para o e-mail específico
      let mockUser;
      
      if (formData.email === 'casagrandevitor@gmail.com') {
        // Para este e-mail específico, aceitar qualquer senha
        mockUser = {
          id: 'admin-vitor',
          nome: 'Vitor Casagrande',
          email: 'casagrandevitor@gmail.com',
          papel: 'admin',
          ativo: true
        };
      } else {
        // Para outros usuários, simulamos a verificação normal
        // Em um sistema real, a validação de senha seria feita no backend
        
        // Validação simplificada para demo
        const isValidDemo = formData.email === 'demo@nmalls.com' && formData.senha === 'demo123';
        const isValidAdmin = formData.email === 'admin@nmalls.com' && formData.senha === 'admin123';
        
        if (!isValidDemo && !isValidAdmin && !formData.email.includes('test')) {
          throw new Error('Credenciais inválidas');
        }
        
        // Simulando um login bem-sucedido para outros usuários
        mockUser = {
          id: 'user-123',
          nome: 'Usuário Teste',
          email: formData.email,
          papel: formData.email.includes('admin') ? 'admin' : 
                formData.email.includes('gerente') ? 'gerente' : 
                formData.email.includes('motorista') ? 'motorista' : 'operador',
          ativo: true
        };
      }
      
      // Armazenar dados do usuário (em produção, você armazenaria um token JWT)
      localStorage.setItem('nmalls_user', JSON.stringify(mockUser));
      
      // Redirecionar para o dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro durante o login:', error);
      
      setLoginMessage({
        type: 'error',
        text: 'Erro ao fazer login. Verifique suas credenciais e tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image 
              src="/logo.png" 
              alt="Nmalls Logo" 
              width={150} 
              height={50}
              className="h-12 w-auto"
            />
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
                <Link 
                  href="#"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </div>
          
          <div className="text-center">
            <Link 
              href="/"
              className="font-medium text-sm text-blue-600 hover:text-blue-500"
            >
              Voltar para a página inicial
            </Link>
          </div>
          
          <div className="mt-4 pt-4 border-t text-center">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  email: 'casagrandevitor@gmail.com',
                  senha: 'admin123', // Você pode definir uma senha padrão
                  lembrar: false
                });
                setLoginMessage({
                  type: 'success',
                  text: 'Dados do administrador preenchidos. Clique em "Entrar" para continuar.'
                });
              }}
              className="text-sm text-gray-600 hover:text-blue-600"
            >
              Entrar como administrador
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 