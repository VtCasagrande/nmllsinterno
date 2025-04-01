'use client';

import { useState, useEffect } from 'react';
import { useRecorrencias } from '@/contexts/RecorrenciasContext';
import { StatusRecorrencia } from '@/types/recorrencias';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Plus, Calendar, RefreshCw, PauseCircle, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function RecorrenciasPage() {
  const { recorrencias, loading, filtrarRecorrenciasPorStatus } = useRecorrencias();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<StatusRecorrencia | 'todas'>('todas');
  const [recorrenciasFiltradas, setRecorrenciasFiltradas] = useState(recorrencias);

  // Aplicar filtros quando os valores mudarem
  useEffect(() => {
    const porStatus = filtrarRecorrenciasPorStatus(statusFiltro);
    
    // Aplicar filtro de busca
    const filtradas = porStatus.filter(
      (rec) =>
        rec.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.cpfCliente.includes(searchTerm) ||
        rec.telefoneCliente.includes(searchTerm)
    );
    
    setRecorrenciasFiltradas(filtradas);
  }, [recorrencias, searchTerm, statusFiltro, filtrarRecorrenciasPorStatus]);

  // Função para renderizar o status da recorrência
  const renderStatus = (status: StatusRecorrencia) => {
    switch (status) {
      case StatusRecorrencia.ATIVA:
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <RefreshCw size={12} />
            <span>Ativa</span>
          </Badge>
        );
      case StatusRecorrencia.PAUSADA:
        return (
          <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">
            <PauseCircle size={12} />
            <span>Pausada</span>
          </Badge>
        );
      case StatusRecorrencia.CANCELADA:
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <X size={12} />
            <span>Cancelada</span>
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 px-0 sm:px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Clientes Recorrentes</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Gerencie seus clientes com compras recorrentes
          </p>
        </div>
        <Link
          href="/dashboard/recorrencias/nova"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Adicionar Recorrência
        </Link>
      </div>

      {/* Filtros e busca */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar cliente..."
                className="pl-10 pr-4 py-2 text-sm w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFiltro('todas')}
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  statusFiltro === 'todas'
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setStatusFiltro(StatusRecorrencia.ATIVA)}
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  statusFiltro === StatusRecorrencia.ATIVA
                    ? 'bg-green-200 text-green-800'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                Ativas
              </button>
              <button
                onClick={() => setStatusFiltro(StatusRecorrencia.PAUSADA)}
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  statusFiltro === StatusRecorrencia.PAUSADA
                    ? 'bg-amber-200 text-amber-800'
                    : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                }`}
              >
                Pausadas
              </button>
              <button
                onClick={() => setStatusFiltro(StatusRecorrencia.CANCELADA)}
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  statusFiltro === StatusRecorrencia.CANCELADA
                    ? 'bg-red-200 text-red-800'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                Canceladas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Recorrências */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Dias Recorrência</TableHead>
                <TableHead>Próxima Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Carregando recorrências...
                  </TableCell>
                </TableRow>
              ) : recorrenciasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Nenhuma recorrência encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                recorrenciasFiltradas.map((recorrencia) => (
                  <TableRow key={recorrencia.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{recorrencia.nomeCliente}</p>
                        <p className="text-sm text-gray-500">{recorrencia.telefoneCliente}</p>
                        <p className="text-xs text-gray-500">CPF: {recorrencia.cpfCliente}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <RefreshCw size={14} className="text-blue-500 mr-2" />
                        <span>
                          {recorrencia.diasRecorrencia === 7 
                            ? "A cada 7 dias (semanal)" 
                            : recorrencia.diasRecorrencia === 15 
                            ? "A cada 15 dias (quinzenal)" 
                            : recorrencia.diasRecorrencia === 30 
                            ? "A cada 30 dias (mensal)"
                            : recorrencia.diasRecorrencia === 60
                            ? "A cada 60 dias (bimestral)"
                            : recorrencia.diasRecorrencia === 90
                            ? "A cada 90 dias (trimestral)"
                            : `A cada ${recorrencia.diasRecorrencia} dias (personalizado)`
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar size={14} className="text-gray-400 mr-2" />
                        <span>{recorrencia.proximaData}</span>
                      </div>
                    </TableCell>
                    <TableCell>{renderStatus(recorrencia.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {recorrencia.produtos.length} {recorrencia.produtos.length === 1 ? 'produto' : 'produtos'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/recorrencias/${recorrencia.id}`}
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