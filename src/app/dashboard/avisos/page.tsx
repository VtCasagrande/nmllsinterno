'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BellRing, Search, Filter, ChevronDown, ChevronUp, Plus } from 'lucide-react';

// Enums simplificados
enum AvisoStatus {
  ATIVO = 'ativo',
  ARQUIVADO = 'arquivado',
  EXPIRADO = 'expirado'
}

enum AvisoPrioridade {
  BAIXA = 'baixa',
  NORMAL = 'normal',
  ALTA = 'alta',
  URGENTE = 'urgente'
}

// Interface simplificada
interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  autor: {
    id: string;
    nome: string;
  };
  dataCriacao: string;
  dataExpiracao?: string;
  prioridade: AvisoPrioridade;
  status: AvisoStatus;
  visualizacoes: number;
}

export default function AvisosPage() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [filteredAvisos, setFilteredAvisos] = useState<Aviso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [expandedFilters, setExpandedFilters] = useState(false);
  
  // Função para formatar data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Carregar avisos (simulado)
  useEffect(() => {
    const carregarAvisos = async () => {
      setIsLoading(true);
      try {
        // Simulação de dados
        await new Promise(resolve => setTimeout(resolve, 1000));
        const avisosSimulados: Aviso[] = [
          {
            id: '1',
            titulo: 'Manutenção Programada',
            conteudo: 'O sistema ficará indisponível amanhã das 22h às 23h para manutenção programada.',
            autor: { id: 'admin', nome: 'Administrador' },
            dataCriacao: '2023-04-01T10:00:00Z',
            prioridade: AvisoPrioridade.ALTA,
            status: AvisoStatus.ATIVO,
            visualizacoes: 12
          },
          {
            id: '2',
            titulo: 'Nova Funcionalidade',
            conteudo: 'Liberamos a nova funcionalidade de filtros avançados para entregas.',
            autor: { id: 'admin', nome: 'Administrador' },
            dataCriacao: '2023-03-28T14:30:00Z',
            prioridade: AvisoPrioridade.NORMAL,
            status: AvisoStatus.ATIVO,
            visualizacoes: 8
          }
        ];
        
        setAvisos(avisosSimulados);
        setFilteredAvisos(avisosSimulados);
      } catch (error) {
        console.error('Erro ao carregar avisos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarAvisos();
  }, []);
  
  // Filtragem de avisos
  useEffect(() => {
    let filtrados = [...avisos];
    
    // Filtrar por termo de busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      filtrados = filtrados.filter(aviso => 
        aviso.titulo.toLowerCase().includes(termo) || 
        aviso.conteudo.toLowerCase().includes(termo)
      );
    }
    
    // Filtrar por status
    if (statusFilter !== 'todos') {
      filtrados = filtrados.filter(aviso => aviso.status === statusFilter);
    }
    
    setFilteredAvisos(filtrados);
  }, [searchTerm, statusFilter, avisos]);
  
  // Restante do componente...
} 