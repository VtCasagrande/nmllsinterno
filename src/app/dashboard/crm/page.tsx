'use client';

import { useState, useEffect } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { StatusCRM, AtendimentoCRM } from '@/types/crm';
import {
  Search,
  Filter,
  Calendar,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronRight,
  Clock,
  User,
  Phone,
  List,
  CalendarDays,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EstatisticasCRM from '@/components/crm/EstatisticasCRM';

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

export default function CRMPage() {
  const { 
    atendimentos, 
    loading, 
    usuariosDisponiveis, 
    filtrarAtendimentosPorStatus, 
    filtrarAtendimentosPorResponsavel,
    buscarAtendimentos
  } = useCRM();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<StatusCRM | 'todos'>('todos');
  const [responsavelFiltro, setResponsavelFiltro] = useState<string>('todos');
  const [atendimentosFiltrados, setAtendimentosFiltrados] = useState<AtendimentoCRM[]>(atendimentos);

  // Aplicar filtros quando os valores mudarem
  useEffect(() => {
    let resultado = atendimentos;
    
    // Aplicar filtro de status
    if (statusFiltro !== 'todos') {
      resultado = filtrarAtendimentosPorStatus(statusFiltro);
    }
    
    // Aplicar filtro de responsável
    if (responsavelFiltro !== 'todos') {
      resultado = resultado.filter(a => a.responsavel.id === responsavelFiltro);
    }
    
    // Aplicar filtro de busca
    if (searchTerm.trim()) {
      resultado = buscarAtendimentos(searchTerm);
    }
    
    setAtendimentosFiltrados(resultado);
  }, [atendimentos, searchTerm, statusFiltro, responsavelFiltro, filtrarAtendimentosPorStatus, buscarAtendimentos]);

  // Função para renderizar o status do atendimento
  const renderStatus = (status: StatusCRM) => {
    switch (status) {
      case StatusCRM.EM_ABERTO:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock size={12} className="mr-1" />
            Em Aberto
          </span>
        );
      case StatusCRM.EM_MONITORAMENTO:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <RefreshCw size={12} className="mr-1" />
            Em Monitoramento
          </span>
        );
      case StatusCRM.FINALIZADO:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" />
            Finalizado
          </span>
        );
      default:
        return null;
    }
  };

  // Função para formatar data
  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-6 px-0 sm:px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">CRM</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Gerenciamento de Relacionamento com Clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/crm/calendario"
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <CalendarDays size={16} className="mr-2" />
            Visualizar Calendário
          </Link>
          <Link
            href="/dashboard/crm/novo"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus size={16} className="mr-2" />
            Novo Atendimento
          </Link>
        </div>
      </div>

      {/* Estatísticas do CRM */}
      <EstatisticasCRM />

      {/* Filtros e busca */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="w-full md:w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar cliente, motivo..."
                className="pl-10 pr-4 py-2 text-sm w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500">Status:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFiltro('todos')}
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  statusFiltro === 'todos'
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFiltro(StatusCRM.EM_ABERTO)}
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  statusFiltro === StatusCRM.EM_ABERTO
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                Em Aberto
              </button>
              <button
                onClick={() => setStatusFiltro(StatusCRM.EM_MONITORAMENTO)}
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  statusFiltro === StatusCRM.EM_MONITORAMENTO
                    ? 'bg-amber-200 text-amber-800'
                    : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                }`}
              >
                Em Monitoramento
              </button>
              <button
                onClick={() => setStatusFiltro(StatusCRM.FINALIZADO)}
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  statusFiltro === StatusCRM.FINALIZADO
                    ? 'bg-green-200 text-green-800'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                Finalizado
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Responsável:</span>
            <select
              value={responsavelFiltro}
              onChange={(e) => setResponsavelFiltro(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm w-40"
            >
              <option value="todos">Todos</option>
              {usuariosDisponiveis.map((user) => (
                <option key={user.id} value={user.id}>{user.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Atendimentos */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Próximo Contato</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Carregando atendimentos...
                  </TableCell>
                </TableRow>
              ) : atendimentosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhum atendimento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                atendimentosFiltrados.map((atendimento) => (
                  <TableRow key={atendimento.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{atendimento.cliente.nome}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Phone size={12} className="mr-1" />
                          {atendimento.cliente.telefone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{atendimento.motivo}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar size={14} className="text-gray-400 mr-2" />
                        <span>{formatarData(atendimento.data)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {atendimento.dataProximoContato && (
                        <div className="flex items-center">
                          <Clock size={14} className="text-gray-400 mr-2" />
                          <span>{formatarData(atendimento.dataProximoContato)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User size={14} className="text-gray-400 mr-2" />
                        <span>{atendimento.responsavel.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>{renderStatus(atendimento.status)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/crm/${atendimento.id}`}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <span className="mr-1">Detalhes</span>
                        <ChevronRight size={16} />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 