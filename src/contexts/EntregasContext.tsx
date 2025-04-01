'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Entrega, Motorista, Rota, StatusEntrega } from '../types/entregas';
import { ENTREGAS_MOCK, MOTORISTAS_MOCK, ROTAS_MOCK } from '../utils/mockData';
import { useWebhooks } from './WebhooksContext';
import { WebhookEventType } from '@/types/webhooks';

// Interface para o contexto
interface EntregasContextType {
  // Estados
  entregas: Entrega[];
  motoristas: Motorista[];
  rotas: Rota[];
  loading: boolean;
  
  // Funções para entregas
  getEntrega: (id: string) => Entrega | undefined;
  createEntrega: (entrega: Omit<Entrega, 'id'>) => Promise<Entrega>;
  updateEntrega: (id: string, entrega: Partial<Entrega>) => Promise<Entrega>;
  deleteEntrega: (id: string) => Promise<boolean>;
  getEntregasPendentes: () => Entrega[];
  getEntregasMotorista: (motoristaId: string) => Entrega[];
  getEntregasRota: (rotaId: string) => Entrega[];
  atribuirEntregaMotorista: (entregaId: string, motoristaId: string) => Promise<boolean>;
  removerEntregaMotorista: (entregaId: string) => Promise<boolean>;
  
  // Funções para rotas
  getRota: (id: string) => Rota | undefined;
  createRota: (rota: Omit<Rota, 'id'>) => Promise<Rota>;
  updateRota: (id: string, rota: Partial<Rota>) => Promise<Rota>;
  deleteRota: (id: string) => Promise<boolean>;
  otimizarRota: (rotaId: string) => Promise<Rota>;
  
  // Funções para motoristas
  getMotorista: (id: string) => Motorista | undefined;
  updateMotorista: (id: string, motorista: Partial<Motorista>) => Promise<Motorista>;
  getMotoristaAtivo: () => Motorista[];
}

// Criar o contexto
const EntregasContext = createContext<EntregasContextType | undefined>(undefined);

// Hook para uso do contexto
export const useEntregas = (): EntregasContextType => {
  const context = useContext(EntregasContext);
  if (!context) {
    throw new Error('useEntregas deve ser usado dentro de um EntregasProvider');
  }
  return context;
};

// Props do provider
interface EntregasProviderProps {
  children: ReactNode;
}

// Provider component
export const EntregasProvider: React.FC<EntregasProviderProps> = ({ children }) => {
  // Estados
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Obter a função para disparar webhook
  // Usamos try/catch para lidar com a inicialização (o provider de webhooks pode não estar disponível ainda)
  const webhooksContext = (() => {
    try {
      return useWebhooks();
    } catch (error) {
      return null;
    }
  })();
  
  // Efeito para carregar dados iniciais
  useEffect(() => {
    // Aqui futuramente podemos fazer uma chamada para a API
    setEntregas(ENTREGAS_MOCK);
    setMotoristas(MOTORISTAS_MOCK);
    setRotas(ROTAS_MOCK);
    setLoading(false);
  }, []);
  
  // Funções para entregas
  const getEntrega = (id: string) => entregas.find(e => e.id === id);
  
  const createEntrega = async (entrega: Omit<Entrega, 'id'>): Promise<Entrega> => {
    const newEntrega = {
      ...entrega,
      id: Date.now().toString(),
      dataCriacao: new Date().toISOString()
    };
    
    setEntregas(prev => [...prev, newEntrega as Entrega]);
    return newEntrega as Entrega;
  };
  
  const updateEntrega = async (id: string, entregaData: Partial<Entrega>): Promise<Entrega> => {
    const index = entregas.findIndex(e => e.id === id);
    if (index === -1) throw new Error(`Entrega com ID ${id} não encontrada`);
    
    const entregaAnterior = entregas[index];
    const updatedEntrega = { ...entregaAnterior, ...entregaData };
    const newEntregas = [...entregas];
    newEntregas[index] = updatedEntrega;
    
    setEntregas(newEntregas);
    
    // Verificar se o status mudou para EM_ROTA e disparar webhook
    if (
      webhooksContext && 
      entregaData.status === StatusEntrega.EM_ROTA && 
      entregaAnterior.status !== StatusEntrega.EM_ROTA
    ) {
      try {
        // Criar payload para o webhook
        const payload = {
          evento: WebhookEventType.ENTREGA_EM_ROTA,
          timestamp: new Date().toISOString(),
          dados: {
            entregaId: updatedEntrega.id,
            numeroPedido: updatedEntrega.numeroPedido,
            status: updatedEntrega.status,
            nomeCliente: updatedEntrega.nomeCliente,
            endereco: updatedEntrega.endereco,
            cidade: updatedEntrega.cidade,
            cep: updatedEntrega.cep,
            motoristaNome: updatedEntrega.motoristaNome,
            motoristaId: updatedEntrega.motoristaId,
            dataAtualizacao: new Date().toISOString(),
            itens: updatedEntrega.itens
          }
        };
        
        // Disparar webhook
        webhooksContext.dispararWebhook(WebhookEventType.ENTREGA_EM_ROTA, payload);
      } catch (error) {
        console.error('Erro ao disparar webhook para entrega em rota:', error);
      }
    }
    
    return updatedEntrega;
  };
  
  const deleteEntrega = async (id: string): Promise<boolean> => {
    setEntregas(prev => prev.filter(e => e.id !== id));
    return true;
  };
  
  const getEntregasPendentes = () => entregas.filter(e => e.status === StatusEntrega.PENDENTE);
  
  const getEntregasMotorista = (motoristaId: string) => 
    entregas.filter(e => e.motoristaId === motoristaId);
  
  const getEntregasRota = (rotaId: string) => 
    entregas.filter(e => e.rotaId === rotaId)
      .sort((a, b) => (a.posicaoRota || 0) - (b.posicaoRota || 0));
  
  const atribuirEntregaMotorista = async (entregaId: string, motoristaId: string): Promise<boolean> => {
    const entrega = getEntrega(entregaId);
    const motorista = getMotorista(motoristaId);
    
    if (!entrega || !motorista) return false;
    
    await updateEntrega(entregaId, {
      motoristaId,
      motoristaNome: motorista.nome,
      status: StatusEntrega.ATRIBUIDA
    });
    
    return true;
  };
  
  // Nova função para remover entrega do motorista
  const removerEntregaMotorista = async (entregaId: string): Promise<boolean> => {
    const entrega = getEntrega(entregaId);
    
    if (!entrega) return false;
    
    // Apenas entregas atribuídas ou em rota podem ser devolvidas
    if (entrega.status !== StatusEntrega.ATRIBUIDA && entrega.status !== StatusEntrega.EM_ROTA) {
      return false;
    }
    
    await updateEntrega(entregaId, {
      motoristaId: undefined,
      motoristaNome: undefined,
      status: StatusEntrega.PENDENTE,
      rotaId: undefined,
      posicaoRota: undefined
    });
    
    return true;
  };
  
  // Funções para rotas
  const getRota = (id: string) => rotas.find(r => r.id === id);
  
  const createRota = async (rota: Omit<Rota, 'id'>): Promise<Rota> => {
    const newRota = {
      ...rota,
      id: Date.now().toString()
    };
    
    setRotas(prev => [...prev, newRota as Rota]);
    return newRota as Rota;
  };
  
  const updateRota = async (id: string, rotaData: Partial<Rota>): Promise<Rota> => {
    const index = rotas.findIndex(r => r.id === id);
    if (index === -1) throw new Error(`Rota com ID ${id} não encontrada`);
    
    const updatedRota = { ...rotas[index], ...rotaData };
    const newRotas = [...rotas];
    newRotas[index] = updatedRota;
    
    setRotas(newRotas);
    return updatedRota;
  };
  
  const deleteRota = async (id: string): Promise<boolean> => {
    setRotas(prev => prev.filter(r => r.id !== id));
    return true;
  };
  
  // Função para otimizar rota (ordenar entregas pela distância)
  const otimizarRota = async (rotaId: string): Promise<Rota> => {
    const rota = getRota(rotaId);
    if (!rota) throw new Error(`Rota com ID ${rotaId} não encontrada`);
    
    // Aqui seria implementado um algoritmo de otimização de rotas
    // Por enquanto, apenas marcamos como otimizada
    const updatedRota = await updateRota(rotaId, { otimizada: true });
    
    return updatedRota;
  };
  
  // Funções para motoristas
  const getMotorista = (id: string) => motoristas.find(m => m.id === id);
  
  const updateMotorista = async (id: string, motoristaData: Partial<Motorista>): Promise<Motorista> => {
    const index = motoristas.findIndex(m => m.id === id);
    if (index === -1) throw new Error(`Motorista com ID ${id} não encontrado`);
    
    const updatedMotorista = { ...motoristas[index], ...motoristaData };
    const newMotoristas = [...motoristas];
    newMotoristas[index] = updatedMotorista;
    
    setMotoristas(newMotoristas);
    return updatedMotorista;
  };
  
  const getMotoristaAtivo = () => motoristas.filter(m => m.status === 'ativo');
  
  // Valor do contexto
  const value: EntregasContextType = {
    entregas,
    motoristas,
    rotas,
    loading,
    getEntrega,
    createEntrega,
    updateEntrega,
    deleteEntrega,
    getEntregasPendentes,
    getEntregasMotorista,
    getEntregasRota,
    atribuirEntregaMotorista,
    removerEntregaMotorista,
    getRota,
    createRota,
    updateRota,
    deleteRota,
    otimizarRota,
    getMotorista,
    updateMotorista,
    getMotoristaAtivo
  };
  
  return (
    <EntregasContext.Provider value={value}>
      {children}
    </EntregasContext.Provider>
  );
};

export default EntregasProvider; 