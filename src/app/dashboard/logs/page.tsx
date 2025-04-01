'use client';

import { useState } from 'react';
import { Search, User, Calendar, Filter, Clock, FileText, Edit, Trash, Eye, Plus, ArrowDownUp } from 'lucide-react';

// Dados simulados para os logs
const LOGS_MOCK = [
  {
    id: 1,
    usuario: 'Admin',
    acao: 'login',
    descricao: 'Login no sistema',
    entidade: 'auth',
    entidadeId: '',
    data: '2025-04-01T10:15:00',
    ip: '192.168.1.100'
  },
  {
    id: 2,
    usuario: 'Carlos Santos',
    acao: 'create',
    descricao: 'Registrou uma nova devolução',
    entidade: 'devolucoes',
    entidadeId: 'DEV002',
    data: '2025-04-01T09:45:00',
    ip: '192.168.1.101'
  },
  {
    id: 3,
    usuario: 'Ana Oliveira',
    acao: 'update',
    descricao: 'Atualizou status de devolução para Em Análise',
    entidade: 'devolucoes',
    entidadeId: 'DEV001',
    data: '2025-04-01T09:30:00',
    ip: '192.168.1.102'
  },
  {
    id: 4,
    usuario: 'João Silva',
    acao: 'create',
    descricao: 'Criou uma nova rota de entrega',
    entidade: 'rotas',
    entidadeId: 'RT005',
    data: '2025-04-01T09:15:00',
    ip: '192.168.1.103'
  },
  {
    id: 5,
    usuario: 'Maria Souza',
    acao: 'update',
    descricao: 'Atualizou localização',
    entidade: 'motoristas',
    entidadeId: 'M002',
    data: '2025-04-01T09:10:00',
    ip: '192.168.1.104'
  },
  {
    id: 6,
    usuario: 'Pedro Santos',
    acao: 'complete',
    descricao: 'Concluiu entrega',
    entidade: 'rotas',
    entidadeId: 'RT003',
    data: '2025-04-01T09:05:00',
    ip: '192.168.1.105'
  },
  {
    id: 7,
    usuario: 'Admin',
    acao: 'create',
    descricao: 'Criou um novo usuário',
    entidade: 'usuarios',
    entidadeId: 'U010',
    data: '2025-04-01T09:00:00',
    ip: '192.168.1.100'
  },
  {
    id: 8,
    usuario: 'Julia Mendes',
    acao: 'delete',
    descricao: 'Removeu rota de entrega',
    entidade: 'rotas',
    entidadeId: 'RT002',
    data: '2025-03-31T18:45:00',
    ip: '192.168.1.106'
  },
  {
    id: 9,
    usuario: 'Ricardo Alves',
    acao: 'update',
    descricao: 'Atualizou dados de produto',
    entidade: 'produtos',
    entidadeId: 'P123',
    data: '2025-03-31T18:30:00',
    ip: '192.168.1.107'
  },
  {
    id: 10,
    usuario: 'Carlos Santos',
    acao: 'view',
    descricao: 'Visualizou detalhes de devolução',
    entidade: 'devolucoes',
    entidadeId: 'DEV001',
    data: '2025-03-31T18:15:00',
    ip: '192.168.1.101'
  },
  {
    id: 11,
    usuario: 'Ana Oliveira',
    acao: 'login',
    descricao: 'Login no sistema',
    entidade: 'auth',
    entidadeId: '',
    data: '2025-03-31T09:00:00',
    ip: '192.168.1.102'
  },
  {
    id: 12,
    usuario: 'João Silva',
    acao: 'logout',
    descricao: 'Logout do sistema',
    entidade: 'auth',
    entidadeId: '',
    data: '2025-03-31T17:30:00',
    ip: '192.168.1.103'
  }
];

// Mapeamento de ações para ícones e cores
const ACAO_MAP: Record<string, { icon: React.ReactNode; className: string }> = {
  login: { 
    icon: <User size={16} />, 
    className: 'bg-green-100 text-green-800' 
  },
  logout: { 
    icon: <User size={16} />, 
    className: 'bg-gray-100 text-gray-800' 
  },
  create: { 
    icon: <Plus size={16} />, 
    className: 'bg-blue-100 text-blue-800' 
  },
  update: { 
    icon: <Edit size={16} />, 
    className: 'bg-yellow-100 text-yellow-800' 
  },
  delete: { 
    icon: <Trash size={16} />, 
    className: 'bg-red-100 text-red-800' 
  },
  view: { 
    icon: <Eye size={16} />, 
    className: 'bg-purple-100 text-purple-800' 
  },
  complete: { 
    icon: <FileText size={16} />, 
    className: 'bg-teal-100 text-teal-800' 
  }
};

// Mapeamento de entidades para exibição
const ENTIDADE_MAP: Record<string, string> = {
  auth: 'Autenticação',
  devolucoes: 'Devoluções',
  rotas: 'Rotas',
  motoristas: 'Motoristas',
  usuarios: 'Usuários',
  produtos: 'Produtos'
};

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('todas');
  const [actionFilter, setActionFilter] = useState('todas');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // Filtragem dos logs
  const logsFiltrados = LOGS_MOCK.filter(log => {
    const matchesSearch = 
      log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entidadeId.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesEntity = entityFilter === 'todas' || log.entidade === entityFilter;
    const matchesAction = actionFilter === 'todas' || log.acao === actionFilter;
    const matchesDate = !dateFilter || log.data.startsWith(dateFilter);
    
    return matchesSearch && matchesEntity && matchesAction && matchesDate;
  });

  // Paginação
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logsFiltrados.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(logsFiltrados.length / logsPerPage);

  // Formatação de data
  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Logs do Sistema</h1>
        <p className="text-gray-500 mt-1">Histórico de ações dos usuários no sistema</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar logs..."
                className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-400" />
              <select
                className="w-full py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
              >
                <option value="todas">Todas as entidades</option>
                <option value="auth">Autenticação</option>
                <option value="devolucoes">Devoluções</option>
                <option value="rotas">Rotas</option>
                <option value="motoristas">Motoristas</option>
                <option value="usuarios">Usuários</option>
                <option value="produtos">Produtos</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock size={18} className="text-gray-400" />
              <select
                className="w-full py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="todas">Todas as ações</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="create">Criação</option>
                <option value="update">Atualização</option>
                <option value="delete">Exclusão</option>
                <option value="view">Visualização</option>
                <option value="complete">Conclusão</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar size={18} className="text-gray-400" />
              <input
                type="date"
                className="w-full py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Ação
                    <ArrowDownUp size={14} className="ml-1" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entidade
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLogs.length > 0 ? (
                currentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatarData(log.data)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.usuario}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-medium rounded-full ${ACAO_MAP[log.acao].className}`}>
                        <span className="mr-1">{ACAO_MAP[log.acao].icon}</span>
                        {log.acao.charAt(0).toUpperCase() + log.acao.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ENTIDADE_MAP[log.entidade]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.entidadeId || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                      {log.descricao}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhum log encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginação */}
        {logsFiltrados.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 border-t sm:px-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{indexOfFirstLog + 1}</span> a{' '}
              <span className="font-medium">
                {indexOfLastLog > logsFiltrados.length ? logsFiltrados.length : indexOfLastLog}
              </span>{' '}
              de <span className="font-medium">{logsFiltrados.length}</span> resultados
            </div>
            
            <div className="flex-1 flex justify-end">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Botões de páginas
                  let pageNum = i + 1;
                  
                  // Se houver muitas páginas, mostrar páginas ao redor da atual
                  if (totalPages > 5) {
                    if (currentPage > 3 && currentPage < totalPages - 1) {
                      pageNum = currentPage - 2 + i;
                    } else if (currentPage >= totalPages - 1) {
                      pageNum = totalPages - 4 + i;
                    }
                  }
                  
                  return (
                    pageNum <= totalPages && (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  );
                })}

                <button
                  onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 