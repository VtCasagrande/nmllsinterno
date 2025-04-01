'use client';

import { useEffect, useState } from 'react';
import { 
  FileText, Check, AlertCircle, Bug, ChevronDown, ChevronUp, 
  Clock, CheckCircle, AlertTriangle, XCircle 
} from 'lucide-react';
import Link from 'next/link';
import { useWebhooks } from '@/contexts/WebhooksContext';
import { WebhookEventType } from '@/types/webhooks';

// Enum para status do bug
enum BugStatus {
  ANALISE = 'analise',
  ARRUMADO = 'arrumado'
}

// Enum para severidade do bug
enum BugSeveridade {
  CRITICO = 'critico',
  IMPORTANTE = 'importante',
  MENOR = 'menor'
}

// Interface para o bug
interface Bug {
  id: string;
  titulo: string;
  descricao: string;
  severidade: BugSeveridade;
  dataOcorrencia: string;
  dataCriacao: string;
  status: BugStatus;
  resolucao?: string;
}

// Componente para renderizar o ícone de severidade baseado no tipo
function SeveridadeIcon({ tipo }: { tipo: BugSeveridade }) {
  switch (tipo) {
    case BugSeveridade.CRITICO:
      return <XCircle className="text-red-500" size={18} />;
    case BugSeveridade.IMPORTANTE:
      return <AlertTriangle className="text-orange-500" size={18} />;
    case BugSeveridade.MENOR:
      return <AlertCircle className="text-blue-500" size={18} />;
    default:
      return <AlertCircle className="text-gray-500" size={18} />;
  }
}

// Componente para card de bug
function BugCard({ bug, onStatusChange }: { bug: Bug, onStatusChange: (id: string, status: BugStatus, resolucao?: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [resolucao, setResolucao] = useState(bug.resolucao || '');

  // Formatar data para exibição
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(data);
  };

  // Texto para exibição de severidade
  const getSeveridadeText = (severidade: BugSeveridade) => {
    switch (severidade) {
      case BugSeveridade.CRITICO:
        return 'Crítico';
      case BugSeveridade.IMPORTANTE:
        return 'Importante';
      case BugSeveridade.MENOR:
        return 'Menor';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className={`border rounded-lg overflow-hidden mb-4 ${
      bug.status === BugStatus.ARRUMADO ? 'bg-green-50 border-green-200' : 'bg-white'
    }`}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <div className="mr-3">
            <SeveridadeIcon tipo={bug.severidade} />
          </div>
          <div>
            <h3 className="font-medium">{bug.titulo}</h3>
            <p className="text-sm text-gray-500">
              Reportado em {formatarData(bug.dataCriacao)} • 
              Severidade: {getSeveridadeText(bug.severidade)}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <span className={`px-2 py-1 text-xs rounded-full mr-3 ${
            bug.status === BugStatus.ANALISE 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {bug.status === BugStatus.ANALISE ? 'Em análise' : 'Arrumado'}
          </span>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t">
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Descrição:</h4>
            <p className="text-sm text-gray-700 whitespace-pre-line">{bug.descricao}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Data de ocorrência:</h4>
            <p className="text-sm text-gray-700">{formatarData(bug.dataOcorrencia)}</p>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Resolução:</h4>
            <textarea
              className="w-full border rounded-md p-2 text-sm"
              rows={3}
              placeholder="Descreva como o bug foi ou será resolvido..."
              value={resolucao}
              onChange={(e) => setResolucao(e.target.value)}
              disabled={bug.status === BugStatus.ARRUMADO}
            />
          </div>

          <div className="flex justify-end">
            {bug.status === BugStatus.ANALISE ? (
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                onClick={() => onStatusChange(bug.id, BugStatus.ARRUMADO, resolucao)}
              >
                <Check size={16} className="mr-2" />
                Marcar como resolvido
              </button>
            ) : (
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                onClick={() => onStatusChange(bug.id, BugStatus.ANALISE)}
              >
                <Clock size={16} className="mr-2" />
                Reabrir
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ListarBugsPage() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [filtro, setFiltro] = useState<'todos' | 'analise' | 'arrumados'>('todos');
  const [ordenacao, setOrdenacao] = useState<'dataCriacao' | 'severidade'>('dataCriacao');
  const [direcao, setDirecao] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const { dispararWebhook } = useWebhooks();

  useEffect(() => {
    // Carregar bugs do localStorage
    const carregarBugs = () => {
      setIsLoading(true);
      try {
        const bugsSalvos = localStorage.getItem('bugs');
        if (bugsSalvos) {
          setBugs(JSON.parse(bugsSalvos));
        }
      } catch (error) {
        console.error('Erro ao carregar bugs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarBugs();
  }, []);

  // Filtrar bugs de acordo com o filtro selecionado
  const bugsFiltrados = bugs.filter(bug => {
    if (filtro === 'todos') return true;
    if (filtro === 'analise') return bug.status === BugStatus.ANALISE;
    if (filtro === 'arrumados') return bug.status === BugStatus.ARRUMADO;
    if (filtro === 'criticos') return bug.severidade === BugSeveridade.CRITICO;
    return true;
  });

  // Ordenar bugs: críticos primeiro, depois por data de criação (mais recentes)
  const bugsOrdenados = [...bugsFiltrados].sort((a, b) => {
    // Primeiro por severidade (críticos primeiro)
    if (a.severidade === BugSeveridade.CRITICO && b.severidade !== BugSeveridade.CRITICO)
      return -1;
    if (a.severidade !== BugSeveridade.CRITICO && b.severidade === BugSeveridade.CRITICO)
      return 1;
    
    // Depois por status (em análise primeiro)
    if (a.status === BugStatus.ANALISE && b.status !== BugStatus.ANALISE)
      return -1;
    if (a.status !== BugStatus.ANALISE && b.status === BugStatus.ANALISE)
      return 1;
    
    // Por fim, por data (mais recentes primeiro)
    return new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime();
  });

  // Atualizar status do bug
  const handleStatusChange = (id: string, status: BugStatus, resolucao?: string) => {
    const bugsAtualizados = bugs.map(bug => {
      if (bug.id === id) {
        return {
          ...bug,
          status,
          resolucao: resolucao || bug.resolucao
        };
      }
      return bug;
    });
    
    setBugs(bugsAtualizados);
    localStorage.setItem('bugs', JSON.stringify(bugsAtualizados));
    
    // Em produção, enviaria para uma API
    console.log('Bug atualizado:', id, status, resolucao);

    // Encontrar o bug atualizado
    const bugAtualizado = bugsAtualizados.find(bug => bug.id === id);
    if (bugAtualizado) {
      // Disparar webhook de acordo com o status
      const eventoTipo = status === BugStatus.ARRUMADO 
        ? WebhookEventType.BUG_RESOLVIDO 
        : WebhookEventType.BUG_ATUALIZADO;
      
      dispararWebhook(eventoTipo, {
        evento: eventoTipo,
        timestamp: new Date().toISOString(),
        dados: {
          bugId: bugAtualizado.id,
          titulo: bugAtualizado.titulo,
          descricao: bugAtualizado.descricao,
          severidade: bugAtualizado.severidade,
          status: bugAtualizado.status,
          reportadoPor: 'Administrador',
          dataReporte: bugAtualizado.dataOcorrencia,
          dataCriacao: bugAtualizado.dataCriacao,
          ultimaAtualizacao: new Date().toISOString(),
          resolucao: bugAtualizado.resolucao
        }
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Bug className="h-8 w-8 text-blue-500 mr-3" />
          <h1 className="text-2xl font-bold">Bugs Reportados</h1>
        </div>
        <Link 
          href="/dashboard/ajuda/bugs" 
          className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600"
        >
          Reportar novo
        </Link>
      </div>
      
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          className={`px-4 py-2 rounded-md text-sm ${
            filtro === 'todos' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
          }`}
          onClick={() => setFiltro('todos')}
        >
          Todos
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm ${
            filtro === 'analise' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'
          }`}
          onClick={() => setFiltro('analise')}
        >
          <Clock size={16} className="inline mr-1" />
          Em análise
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm ${
            filtro === 'arrumados' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
          }`}
          onClick={() => setFiltro('arrumados')}
        >
          <CheckCircle size={16} className="inline mr-1" />
          Arrumados
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm ${
            filtro === 'criticos' ? 'bg-red-100 text-red-800' : 'bg-gray-100'
          }`}
          onClick={() => setFiltro('criticos')}
        >
          <XCircle size={16} className="inline mr-1" />
          Críticos
        </button>
      </div>
      
      <div>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">Carregando bugs...</p>
          </div>
        ) : bugsOrdenados.length > 0 ? (
          bugsOrdenados.map(bug => (
            <BugCard key={bug.id} bug={bug} onStatusChange={handleStatusChange} />
          ))
        ) : (
          <div className="text-center py-8 bg-white rounded-lg border">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-500">Nenhum bug reportado</h3>
            <p className="text-gray-500 mt-1">
              {filtro !== 'todos' 
                ? 'Tente selecionar outro filtro ou' 
                : 'Seu sistema parece estar funcionando bem! Se encontrar algum problema,'} 
              {' '}<Link href="/dashboard/ajuda/bugs" className="text-blue-500">reporte um bug</Link>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 