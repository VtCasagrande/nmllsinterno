'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Shield, 
  Truck as TruckIcon, 
  User as UserIcon
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

// Tipo para representar um usuário
interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  papel: 'admin' | 'gerente' | 'operador' | 'motorista';
  ativo: boolean;
  criado_em: string;
}

// Dados simulados
const USUARIOS_MOCK: Usuario[] = [
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
    nome: 'Administrador',
    email: 'admin@nmalls.com',
    telefone: '(11) 98765-4321',
    papel: 'admin',
    ativo: true,
    criado_em: '2024-04-01T10:00:00Z'
  },
  {
    id: '2',
    nome: 'João Gerente',
    email: 'joao.gerente@nmalls.com',
    telefone: '(11) 91234-5678',
    papel: 'gerente',
    ativo: true,
    criado_em: '2024-04-05T14:30:00Z'
  },
  {
    id: '3',
    nome: 'Maria Operadora',
    email: 'maria.operadora@nmalls.com',
    telefone: '(11) 99876-5432',
    papel: 'operador',
    ativo: true,
    criado_em: '2024-04-10T09:15:00Z'
  },
  {
    id: '4',
    nome: 'Pedro Motorista',
    email: 'pedro.motorista@nmalls.com',
    telefone: '(11) 97654-3210',
    papel: 'motorista',
    ativo: true,
    criado_em: '2024-04-15T11:45:00Z'
  },
  {
    id: '5',
    nome: 'Ana Silva',
    email: 'ana.silva@nmalls.com',
    telefone: null,
    papel: 'operador',
    ativo: false,
    criado_em: '2024-03-20T08:30:00Z'
  }
];

// Mapeamento de papéis para ícones e cores
const PAPEL_MAPA = {
  admin: { nome: 'Administrador', icone: <Shield size={16} className="text-purple-500" />, cor: 'bg-purple-100 text-purple-800' },
  gerente: { nome: 'Gerente', icone: <Shield size={16} className="text-blue-500" />, cor: 'bg-blue-100 text-blue-800' },
  operador: { nome: 'Operador', icone: <UserIcon size={16} className="text-green-500" />, cor: 'bg-green-100 text-green-800' },
  motorista: { nome: 'Motorista', icone: <TruckIcon size={16} className="text-orange-500" />, cor: 'bg-orange-100 text-orange-800' }
};

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [papelFiltro, setPapelFiltro] = useState<string>('todos');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const router = useRouter();
  
  // Filtra os usuários com base na busca e filtro de papel
  const usuariosFiltrados = USUARIOS_MOCK.filter(usuario => {
    const correspondeAoBuscar = 
      usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (usuario.telefone && usuario.telefone.includes(searchTerm));
    
    const correspondeAoPapel = papelFiltro === 'todos' || usuario.papel === papelFiltro;
    
    return correspondeAoBuscar && correspondeAoPapel;
  });
  
  const handleAdicionar = () => {
    setUsuarioSelecionado(null); // Limpa qualquer usuário selecionado antes
    setModalAberto(true);
  };
  
  const handleEditar = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setModalAberto(true);
  };
  
  const handleExcluir = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setModalExcluirAberto(true);
  };
  
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(data);
  };
  
  return (
    <ProtectedRoute allowedRoles={['admin', 'gerente']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
          <button 
            onClick={handleAdicionar}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
          >
            <Plus size={18} className="mr-1" />
            Adicionar Usuário
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nome, email ou telefone"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-auto">
              <select
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={papelFiltro}
                onChange={(e) => setPapelFiltro(e.target.value)}
              >
                <option value="todos">Todos os papéis</option>
                <option value="admin">Administradores</option>
                <option value="gerente">Gerentes</option>
                <option value="operador">Operadores</option>
                <option value="motorista">Motoristas</option>
              </select>
            </div>
          </div>
          
          {usuariosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum usuário encontrado para os critérios de busca.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Papel</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{usuario.nome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{usuario.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{usuario.telefone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PAPEL_MAPA[usuario.papel].cor}`}>
                          {PAPEL_MAPA[usuario.papel].icone}
                          <span className="ml-1">{PAPEL_MAPA[usuario.papel].nome}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          usuario.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {usuario.ativo ? (
                            <Check size={12} className="mr-1" />
                          ) : (
                            <X size={12} className="mr-1" />
                          )}
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{formatarData(usuario.criado_em)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditar(usuario)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleExcluir(usuario)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Modal para adicionar/editar usuário - seria implementado com dados reais */}
        {modalAberto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium">
                  {usuarioSelecionado ? 'Editar Usuário' : 'Adicionar Usuário'}
                </h3>
              </div>
              <div className="px-6 py-4">
                <p className="text-gray-600 mb-4">
                  Esta funcionalidade seria implementada com a integração ao backend. 
                  Por enquanto, esta é uma simulação da interface.
                </p>
                
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setModalAberto(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de confirmação para excluir usuário */}
        {modalExcluirAberto && usuarioSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-red-600">Confirmar Exclusão</h3>
              </div>
              <div className="px-6 py-4">
                <p className="text-gray-700 mb-4">
                  Tem certeza que deseja excluir o usuário <span className="font-medium">{usuarioSelecionado.nome}</span>?
                </p>
                <p className="text-gray-600 mb-4">
                  Esta ação não pode ser desfeita.
                </p>
                
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => setModalExcluirAberto(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      // Simula a exclusão (em uma app real, chamaria a API)
                      alert(`Usuário ${usuarioSelecionado.nome} seria excluído.`);
                      setModalExcluirAberto(false);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 