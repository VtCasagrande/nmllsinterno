'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function NovoUsuarioPage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    papel: 'operador',
    senha: '',
    confirmarSenha: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Limpa erro do campo quando o usuário começa a digitar
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validarFormulario = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'A senha deve ter pelo menos 6 caracteres';
    }
    
    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não conferem';
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
    
    try {
      // Simulação de chamada para API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Dados a serem enviados:', formData);
      
      // Redireciona para a lista de usuários após "salvar"
      router.push('/dashboard/usuarios');
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ProtectedRoute allowedRoles={['admin', 'gerente']}>
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/dashboard/usuarios" className="text-blue-600 hover:text-blue-800">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Adicionar Novo Usuário</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nome ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.nome}
                  onChange={handleChange}
                />
                {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
              </div>
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
              
              {/* Telefone */}
              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  id="telefone"
                  name="telefone"
                  placeholder="(XX) XXXXX-XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.telefone}
                  onChange={handleChange}
                />
              </div>
              
              {/* Papel */}
              <div>
                <label htmlFor="papel" className="block text-sm font-medium text-gray-700 mb-1">
                  Papel/Função <span className="text-red-500">*</span>
                </label>
                <select
                  id="papel"
                  name="papel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.papel}
                  onChange={handleChange}
                >
                  <option value="operador">Operador</option>
                  <option value="motorista">Motorista</option>
                  <option value="gerente">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              {/* Senha */}
              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="senha"
                  name="senha"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.senha ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.senha}
                  onChange={handleChange}
                />
                {errors.senha && <p className="mt-1 text-sm text-red-600">{errors.senha}</p>}
              </div>
              
              {/* Confirmar Senha */}
              <div>
                <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Senha <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmarSenha"
                  name="confirmarSenha"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmarSenha ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                />
                {errors.confirmarSenha && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmarSenha}</p>
                )}
              </div>
            </div>
            
            <div className="border-t pt-4 flex justify-end space-x-3">
              <Link
                href="/dashboard/usuarios"
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Salvando...' : 'Salvar Usuário'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
} 