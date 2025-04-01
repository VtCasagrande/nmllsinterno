'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditarUsuarioPage({ params }: PageProps) {
  const { id } = params;
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    papel: 'operador',
    ativo: true,
    senha: '',
    confirmarSenha: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCarregando, setIsCarregando] = useState(true);
  const router = useRouter();
  
  // Dados simulados - Em produção, buscar do backend
  const USUARIOS_MOCK = [
    {
      id: 'admin-vitor',
      nome: 'Vitor Casagrande',
      email: 'casagrandevitor@gmail.com',
      telefone: '(11) 99999-9999',
      papel: 'admin',
      ativo: true,
      criado_em: '2024-04-01T09:00:00Z'
    },
    {
      id: '1',
      nome: 'João Silva',
      email: 'joao.silva@nmalls.com',
      telefone: '(11) 98765-4321',
      papel: 'admin',
      ativo: true,
      criado_em: '2023-01-15'
    },
    {
      id: '2',
      nome: 'Maria Oliveira',
      email: 'maria.oliveira@nmalls.com',
      telefone: '(11) 91234-5678',
      papel: 'gerente',
      ativo: true,
      criado_em: '2023-02-20'
    },
    {
      id: '3',
      nome: 'Carlos Santos',
      email: 'carlos.santos@nmalls.com',
      telefone: '(11) 95555-9999',
      papel: 'operador',
      ativo: false,
      criado_em: '2023-03-10'
    },
    {
      id: '4',
      nome: 'Ana Pereira',
      email: 'ana.pereira@nmalls.com',
      telefone: '(11) 94444-8888',
      papel: 'motorista',
      ativo: true,
      criado_em: '2023-04-05'
    },
    {
      id: '5',
      nome: 'Roberto Lima',
      email: 'roberto.lima@nmalls.com',
      telefone: '(11) 93333-7777',
      papel: 'operador',
      ativo: true,
      criado_em: '2023-05-15'
    }
  ];
  
  useEffect(() => {
    // Simulação de carregamento de dados
    const carregarUsuario = async () => {
      setIsCarregando(true);
      try {
        // Simula uma chamada de API
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const usuario = USUARIOS_MOCK.find(user => user.id === id);
        
        if (usuario) {
          setFormData({
            nome: usuario.nome,
            email: usuario.email,
            telefone: usuario.telefone || '',
            papel: usuario.papel,
            ativo: usuario.ativo,
            senha: '',
            confirmarSenha: ''
          });
        } else {
          alert('Usuário não encontrado');
          router.push('/dashboard/usuarios');
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        alert('Erro ao carregar dados do usuário');
      } finally {
        setIsCarregando(false);
      }
    };
    
    carregarUsuario();
  }, [id, router]);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
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
    
    // Verifica senha apenas se alguma senha foi fornecida (não é obrigatório na edição)
    if (formData.senha) {
      if (formData.senha.length < 6) {
        newErrors.senha = 'A senha deve ter pelo menos 6 caracteres';
      }
      
      if (formData.senha !== formData.confirmarSenha) {
        newErrors.confirmarSenha = 'As senhas não conferem';
      }
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
      
      const dadosParaEnviar = {
        ...formData,
        id
      };
      
      // Remover senha se estiver vazia
      if (!dadosParaEnviar.senha) {
        delete dadosParaEnviar.senha;
        delete dadosParaEnviar.confirmarSenha;
      }
      
      console.log('Dados a serem enviados:', dadosParaEnviar);
      
      // Redireciona para a lista de usuários após "salvar"
      router.push('/dashboard/usuarios');
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Erro ao atualizar usuário. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isCarregando) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <ProtectedRoute allowedRoles={['admin', 'gerente']}>
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/dashboard/usuarios" className="text-blue-600 hover:text-blue-800">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Editar Usuário</h1>
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
              
              {/* Status */}
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="ativo"
                  name="ativo"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={formData.ativo}
                  onChange={handleCheckboxChange}
                />
                <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                  Usuário ativo
                </label>
              </div>
              
              <div className="col-span-2 border-t pt-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Alterar Senha (opcional)</h3>
              </div>
              
              {/* Senha */}
              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  id="senha"
                  name="senha"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.senha ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.senha}
                  onChange={handleChange}
                  placeholder="Deixe em branco para manter a senha atual"
                />
                {errors.senha && <p className="mt-1 text-sm text-red-600">{errors.senha}</p>}
              </div>
              
              {/* Confirmar Senha */}
              <div>
                <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nova Senha
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
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
} 