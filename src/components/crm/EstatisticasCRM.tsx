'use client';

import React, { useEffect, useState } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { StatusCRM } from '@/types/crm';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  RefreshCw,
  BarChart2
} from 'lucide-react';

interface EstatisticaItem {
  titulo: string;
  valor: number;
  descricao: string;
  icone: JSX.Element;
  corIcone: string;
  corFundo: string;
}

export default function EstatisticasCRM() {
  const { atendimentos } = useCRM();
  const [estatisticas, setEstatisticas] = useState<EstatisticaItem[]>([]);
  
  useEffect(() => {
    // Contagem de atendimentos por status
    const emAberto = atendimentos.filter(a => a.status === StatusCRM.EM_ABERTO).length;
    const emMonitoramento = atendimentos.filter(a => a.status === StatusCRM.EM_MONITORAMENTO).length;
    const finalizados = atendimentos.filter(a => a.status === StatusCRM.FINALIZADO).length;
    
    // Clientes únicos
    const clientesUnicos = new Set(atendimentos.map(a => a.cliente.id)).size;
    
    // Atendimentos com próximo contato para os próximos 7 dias
    const dataAtual = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 7);
    
    const contatosProximos = atendimentos.filter(a => {
      if (a.dataProximoContato) {
        const dataContato = new Date(a.dataProximoContato);
        return dataContato >= dataAtual && dataContato <= dataLimite;
      }
      return false;
    }).length;
    
    // Configurar estatísticas
    setEstatisticas([
      {
        titulo: 'Em Aberto',
        valor: emAberto,
        descricao: 'Atendimentos aguardando processamento',
        icone: <Clock className="h-6 w-6" />,
        corIcone: 'text-blue-600',
        corFundo: 'bg-blue-100'
      },
      {
        titulo: 'Em Monitoramento',
        valor: emMonitoramento,
        descricao: 'Atendimentos em acompanhamento',
        icone: <RefreshCw className="h-6 w-6" />,
        corIcone: 'text-amber-600',
        corFundo: 'bg-amber-100'
      },
      {
        titulo: 'Finalizados',
        valor: finalizados,
        descricao: 'Atendimentos concluídos',
        icone: <CheckCircle className="h-6 w-6" />,
        corIcone: 'text-green-600',
        corFundo: 'bg-green-100'
      },
      {
        titulo: 'Clientes',
        valor: clientesUnicos,
        descricao: 'Clientes atendidos',
        icone: <Users className="h-6 w-6" />,
        corIcone: 'text-indigo-600',
        corFundo: 'bg-indigo-100'
      },
      {
        titulo: 'Próximos Contatos',
        valor: contatosProximos,
        descricao: 'Contatos programados (7 dias)',
        icone: <BarChart2 className="h-6 w-6" />,
        corIcone: 'text-purple-600',
        corFundo: 'bg-purple-100'
      }
    ]);
  }, [atendimentos]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {estatisticas.map((item, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-start">
            <div className={`rounded-full p-2 ${item.corFundo} ${item.corIcone} mr-4`}>
              {item.icone}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{item.titulo}</h3>
              <div className="mt-1 font-bold text-2xl">{item.valor}</div>
              <p className="mt-1 text-sm text-gray-500">{item.descricao}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 