'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Edit, Trash, Calendar, Mail, Phone, Clock, Shield } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

interface PageProps {
  params: {
    id: string;
  };
}

interface AcaoUsuario {
  id: string;
  acao: string;
  entidade: string;
  descricao: string;
  data: string;
}

export default function DetalhesUsuarioPage({ params }: PageProps) {
  const { id } = params;
  const [usuario, setUsuario] = useState<any | null>(null);
  const [acoes, setAcoes] = useState<AcaoUsuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();
  
  // Dados simulados
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
  
  // Dados de ações do usuário (simulados)
  const ACOES_MOCK: AcaoUsuario[] = [
    {
      id: '1',
      acao: 'login',
      entidade: 'auth',
      descricao: 'Login no sistema',
      data: '2023-10-15T08:30:00Z'
    },
    {
      id: '2',
      acao: 'criar',
      entidade: 'rota',
      descricao: 'Criou rota R12345',
      data: '2023-10-15T09:45:00Z'
    },
    {
      id: '3',
      acao: 'atualizar',
      entidade: 'devolucao',
      descricao: 'Atualizou status da devolução DEV123',
      data: '2023-10-15T11:20:00Z'
    },
    {
      id: '4',
      acao: 'excluir',
      entidade: 'produto',
      descricao: 'Removeu produto da rota R12345',
      data: '2023-10-16T14:30:00Z'
    },
    {
      id: '5',
      acao: 'visualizar',
      entidade: 'motorista',
      descricao: 'Visualizou localização do motorista M789',
      data: '2023-10-16T16:45:00Z'
    },
    {
      id: '6',
      acao: 'login',
      entidade: 'auth',
      descricao: 'Login no sistema',
      data: '2023-10-17T08:15:00Z'
    }
  ];
  
  const PAPEL_MAPA: {[key: string]: {nome: string, cor: string}} = {
    admin: { nome: 'Administrador', cor: 'bg-purple-100 text-purple-800' },
    gerente: { nome: 'Gerente', cor: 'bg-blue-100 text-blue-800' },
    operador: { nome: 'Operador', cor: 'bg-green-100 text-green-800' },
    motorista: { nome: 'Motorista', cor: 'bg-yellow-100 text-yellow-800' }
  };
  
  useEffect(() => {
    const carregarDados = async () => {
      setIsLoading(true);
      try {
        // Simula chamada de API
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Busca usuário pelo ID
        const usuarioEncontrado = USUARIOS_MOCK.find(u => u.id === id);
        
        if (!usuarioEncontrado) {
          alert('Usuário não encontrado');
          router.push('/dashboard/usuarios');
          return;
        }
        
        setUsuario(usuarioEncontrado);
        
        // Simula carregamento das ações do usuário
        // Em produção, faria uma chamada separada para isso
        setAcoes(ACOES_MOCK);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados do usuário');
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarDados();
  }, [id, router]);
  
  const handleExcluir = async () => {
    try {
      // Simula chamada de API para excluir
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Redireciona para a lista após "excluir"
      router.push('/dashboard/usuarios');
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário');
    } finally {
      setShowDeleteModal(false);
    }
  };
  
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const formatarDataHora = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!usuario) {
    return null;
  }
  
  return (
    <ProtectedRoute allowedRoles={['admin', 'gerente']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/usuarios" className="text-blue-600 hover:text-blue-800">
              <ChevronLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold">Detalhes do Usuário</h1>
          </div>
          
          <div className="flex gap-2">
            <Link
              href={`/dashboard/usuarios/editar/${id}`}
              className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <Edit size={16} className="mr-1" />
              Editar
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              <Trash size={16} className="mr-1" />
              Excluir
            </button>
          </div>
        </div>
        
        {/* Card de informações do usuário */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{usuario.nome}</h2>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  PAPEL_MAPA[usuario.papel]?.cor || 'bg-gray-100 text-gray-800'
                }`}>
                  {PAPEL_MAPA[usuario.papel]?.nome || usuario.papel}
                </span>
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  usuario.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {usuario.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-sm text-gray-500 flex items-center">
                <Calendar size={14} className="mr-1" />
                Cadastrado em {formatarData(usuario.criado_em)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Informações de Contato</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <Mail size={16} className="mr-2 text-gray-400" />
                  {usuario.email}
                </li>
                <li className="flex items-center text-gray-700">
                  <Phone size={16} className="mr-2 text-gray-400" />
                  {usuario.telefone || 'Não informado'}
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Permissões</h3>
              <div className="flex items-center text-gray-700">
                <Shield size={16} className="mr-2 text-gray-400" />
                {PAPEL_MAPA[usuario.papel]?.nome || usuario.papel}
              </div>
            </div>
          </div>
        </div>
        
        {/* Histórico de ações */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-800">Histórico de Ações</h3>
            <p className="text-sm text-gray-500">As ações mais recentes realizadas por este usuário</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ação
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entidade
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {acoes.length > 0 ? (
                  acoes.map((acao) => (
                    <tr key={acao.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock size={14} className="mr-1 text-gray-400" />
                          {formatarDataHora(acao.data)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          acao.acao === 'criar' ? 'bg-green-100 text-green-800' :
                          acao.acao === 'atualizar' ? 'bg-blue-100 text-blue-800' :
                          acao.acao === 'excluir' ? 'bg-red-100 text-red-800' :
                          acao.acao === 'login' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {acao.acao === 'criar' ? 'Criação' :
                           acao.acao === 'atualizar' ? 'Atualização' :
                           acao.acao === 'excluir' ? 'Exclusão' :
                           acao.acao === 'login' ? 'Login' :
                           acao.acao === 'visualizar' ? 'Visualização' :
                           acao.acao}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {acao.entidade === 'auth' ? 'Autenticação' :
                         acao.entidade === 'rota' ? 'Rota' :
                         acao.entidade === 'devolucao' ? 'Devolução' :
                         acao.entidade === 'produto' ? 'Produto' :
                         acao.entidade === 'motorista' ? 'Motorista' :
                         acao.entidade}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {acao.descricao}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhuma ação registrada para este usuário.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar exclusão</h3>
            <p className="text-sm text-gray-500 mb-4">
              Tem certeza que deseja excluir o usuário <strong>{usuario.nome}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluir}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
} 