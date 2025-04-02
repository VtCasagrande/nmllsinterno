'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Entrega, Motorista, Rota, StatusEntrega, FormaPagamento, ItemPedido } from '../types/entregas';
import { MOTORISTAS_MOCK, ROTAS_MOCK } from '../utils/mockData';
import { useWebhooks } from './WebhooksContext';
import { WebhookEventType } from '@/types/webhooks';
import { rotasService } from '@/services/rotasService';
import { useAuth } from '@/contexts/AuthContext';

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
  
  // Recarregar dados
  recarregarEntregas: () => Promise<void>;
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
  // Obter dados de autenticação
  const { profile } = useAuth();
  
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
  
  // Função para carregar entregas do Supabase
  const carregarEntregas = async () => {
    setLoading(true);
    try {
      // Buscar rotas do Supabase
      const rotasSupabase = await rotasService.listarRotas();
      
      // Converter para o formato esperado pelo contexto
      const entregasFormatadas: Entrega[] = rotasSupabase.map(rota => {
        // Calcular valor total para pagamento
        const valorTotal = rota.itens?.reduce((total, item) => 
          total + (item.valor_unitario * item.quantidade), 0) || 0;
        
        // Verificar se há pagamento
        const pagamento = rota.pagamentos && rota.pagamentos.length > 0 
          ? {
              forma: rota.pagamentos[0].tipo === 'dinheiro' 
                ? FormaPagamento.DINHEIRO 
                : rota.pagamentos[0].tipo === 'cartao' 
                  ? FormaPagamento.CREDITO 
                  : rota.pagamentos[0].tipo === 'pix' 
                    ? FormaPagamento.PIX 
                    : FormaPagamento.SEM_PAGAMENTO,
              valor: rota.pagamentos[0].valor,
              recebido: rota.pagamentos[0].recebido || false,
              parcelamento: rota.pagamentos[0].parcelas,
            }
          : undefined;
        
        // Mapear itens do pedido
        const itens: ItemPedido[] = rota.itens?.map(item => ({
          id: item.id,
          nome: item.descricao,
          quantidade: item.quantidade, 
          codigo: item.id.substring(0, 8),
          preco: item.valor_unitario
        })) || [];
        
        // Construir objeto Entrega com dados da rota
        return {
          id: rota.id,
          numeroPedido: rota.codigo || rota.numero_pedido || rota.id.substring(0, 8),
          dataCriacao: rota.created_at || new Date().toISOString(),
          dataEntrega: rota.data_entrega,
          status: mapearStatus(rota.status),
          nomeCliente: rota.nome_cliente || 'Cliente não informado',
          telefoneCliente: rota.telefone_cliente || '',
          endereco: rota.endereco || '',
          cidade: rota.cidade || '',
          cep: rota.cep || '',
          complemento: rota.complemento,
          motoristaId: rota.motorista_id || undefined,
          motoristaNome: rota.motorista?.nome || undefined,
          rotaId: undefined, // Não temos conceito de rota agrupada ainda
          posicaoRota: undefined,
          pagamento,
          itens,
          formaEnvio: 'entrega',
          observacoes: rota.observacoes
        };
      });
      
      setEntregas(entregasFormatadas);
      
      // Carregar motoristas do Supabase
      const motoristasSupabase = await rotasService.listarMotoristas();
      
      // Converter para o formato esperado pelo contexto
      const motoristasFormatados: Motorista[] = motoristasSupabase.map(motorista => ({
        id: motorista.id,
        nome: motorista.nome,
        telefone: '(não disponível)',
        status: 'ativo',
        veiculo: motorista.veiculo || 'não informado',
        placaVeiculo: motorista.placa || 'não informado'
      }));
      
      setMotoristas(motoristasFormatados);
      
      // Por enquanto mantém rotas mockadas
      setRotas(ROTAS_MOCK);
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados do Supabase:', error);
      setLoading(false);
      // Fallback para dados mockados em caso de erro
      // setEntregas(ENTREGAS_MOCK);
      setMotoristas(MOTORISTAS_MOCK);
      setRotas(ROTAS_MOCK);
    }
  };
  
  // Mapear status do Supabase para o enum StatusEntrega
  const mapearStatus = (status?: string): StatusEntrega => {
    switch (status) {
      case 'pendente':
        return StatusEntrega.PENDENTE;
      case 'atribuida':
        return StatusEntrega.ATRIBUIDA;
      case 'em_andamento':
        return StatusEntrega.EM_ROTA;
      case 'concluida':
        return StatusEntrega.ENTREGUE;
      case 'cancelada':
        return StatusEntrega.CANCELADA;
      default:
        return StatusEntrega.PENDENTE;
    }
  };
  
  // Efeito para carregar dados iniciais
  useEffect(() => {
    carregarEntregas();
  }, []);
  
  // Funções para entregas
  const getEntrega = (id: string) => entregas.find(e => e.id === id);
  
  const createEntrega = async (entrega: Omit<Entrega, 'id'>): Promise<Entrega> => {
    try {
      // Criar uma nova rota no Supabase
      const itens = entrega.itens.map(item => ({
        descricao: item.nome,
        quantidade: item.quantidade,
        valor_unitario: item.preco
      }));
      
      const pagamentos = entrega.pagamento 
        ? [{
            tipo: entrega.pagamento.forma.toLowerCase() as 'dinheiro' | 'cartao' | 'pix' | 'outro',
            valor: entrega.pagamento.valor,
            parcelado: entrega.pagamento.parcelamento ? entrega.pagamento.parcelamento > 1 : false,
            parcelas: entrega.pagamento.parcelamento || 1,
            recebido: entrega.pagamento.recebido
          }]
        : [];
      
      const dadosRota = {
        motorista_id: entrega.motoristaId,
        nome_cliente: entrega.nomeCliente,
        telefone_cliente: entrega.telefoneCliente,
        data_entrega: entrega.dataEntrega || new Date().toISOString().split('T')[0],
        horario_maximo: entrega.dataMaxima,
        endereco: entrega.endereco,
        complemento: entrega.complemento,
        cidade: entrega.cidade,
        estado: '', // Não temos campo para estado no tipo Entrega
        cep: entrega.cep,
        numero_pedido: entrega.numeroPedido,
        observacoes: entrega.observacoes,
        itens,
        pagamentos
      };
      
      // Usar ID do usuário atual para criar a rota
      const userId = profile?.id || 'sistema';
      
      const rotaCriada = await rotasService.criarNovaRota(dadosRota, userId);
      
      // Construir e retornar a entrega formatada a partir da rota criada
      const novaEntrega: Entrega = {
        id: rotaCriada.id,
        numeroPedido: rotaCriada.codigo || rotaCriada.numero_pedido || rotaCriada.id.substring(0, 8),
        dataCriacao: rotaCriada.created_at || new Date().toISOString(),
        dataEntrega: rotaCriada.data_entrega,
        status: mapearStatus(rotaCriada.status),
        nomeCliente: rotaCriada.nome_cliente || 'Cliente não informado',
        telefoneCliente: rotaCriada.telefone_cliente || '',
        endereco: rotaCriada.endereco || '',
        cidade: rotaCriada.cidade || '',
        cep: rotaCriada.cep || '',
        complemento: rotaCriada.complemento,
        motoristaId: rotaCriada.motorista_id || undefined,
        motoristaNome: rotaCriada.motorista?.nome || undefined,
        pagamento: entrega.pagamento,
        itens: entrega.itens,
        formaEnvio: entrega.formaEnvio
      };
      
      // Adicionar a nova entrega ao estado local
      setEntregas(prev => [...prev, novaEntrega]);
      
      return novaEntrega;
    } catch (error) {
      console.error('Erro ao criar entrega no Supabase:', error);
      throw error;
    }
  };
  
  const updateEntrega = async (id: string, entregaData: Partial<Entrega>): Promise<Entrega> => {
    try {
      const entregaExistente = getEntrega(id);
      if (!entregaExistente) throw new Error(`Entrega com ID ${id} não encontrada`);
      
      const entregaAtualizada = { ...entregaExistente, ...entregaData };
      
      // Mapear status do tipo Entrega para o formato do Supabase
      let statusSupabase = 'pendente';
      switch (entregaAtualizada.status) {
        case StatusEntrega.PENDENTE:
          statusSupabase = 'pendente';
          break;
        case StatusEntrega.ATRIBUIDA:
          statusSupabase = 'atribuida';
          break;
        case StatusEntrega.EM_ROTA:
          statusSupabase = 'em_andamento';
          break;
        case StatusEntrega.ENTREGUE:
          statusSupabase = 'concluida';
          break;
        case StatusEntrega.CANCELADA:
          statusSupabase = 'cancelada';
          break;
        case StatusEntrega.COM_PROBLEMA:
          statusSupabase = 'com_problema';
          break;
      }
      
      // Atualizar o status no Supabase
      if (entregaData.status) {
        const userId = profile?.id || 'sistema';
        await rotasService.atualizarStatusRota(id, statusSupabase as any, userId);
      }
      
      // Atualizar motorista no Supabase, se necessário
      if (entregaData.motoristaId) {
        const userId = profile?.id || 'sistema';
        await rotasService.atribuirMotorista(id, entregaData.motoristaId, userId);
      }
      
      // Atualizar o estado local
      const updatedEntregas = entregas.map(e => e.id === id ? entregaAtualizada : e);
      setEntregas(updatedEntregas);
      
      // Verificar se o status mudou para EM_ROTA e disparar webhook
      if (
        webhooksContext && 
        entregaData.status === StatusEntrega.EM_ROTA && 
        entregaExistente.status !== StatusEntrega.EM_ROTA
      ) {
        try {
          // Criar payload para o webhook
          const payload = {
            evento: WebhookEventType.ENTREGA_EM_ROTA,
            timestamp: new Date().toISOString(),
            dados: {
              entregaId: entregaAtualizada.id,
              numeroPedido: entregaAtualizada.numeroPedido,
              status: entregaAtualizada.status,
              nomeCliente: entregaAtualizada.nomeCliente,
              endereco: entregaAtualizada.endereco,
              cidade: entregaAtualizada.cidade,
              cep: entregaAtualizada.cep,
              motoristaNome: entregaAtualizada.motoristaNome,
              motoristaId: entregaAtualizada.motoristaId,
              dataAtualizacao: new Date().toISOString(),
              itens: entregaAtualizada.itens
            }
          };
          
          // Disparar webhook
          webhooksContext.dispararWebhook(WebhookEventType.ENTREGA_EM_ROTA, payload);
        } catch (error) {
          console.error('Erro ao disparar webhook para entrega em rota:', error);
        }
      }
      
      return entregaAtualizada;
    } catch (error) {
      console.error('Erro ao atualizar entrega no Supabase:', error);
      throw error;
    }
  };
  
  const deleteEntrega = async (id: string): Promise<boolean> => {
    // Não implementado para o Supabase ainda
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
    try {
      const entrega = getEntrega(entregaId);
      const motorista = getMotorista(motoristaId);
      
      if (!entrega || !motorista) return false;
      
      // Atualizar no Supabase
      const userId = profile?.id || 'sistema';
      await rotasService.atribuirMotorista(entregaId, motoristaId, userId);
      
      // Atualizar estado local
      await updateEntrega(entregaId, {
        motoristaId,
        motoristaNome: motorista.nome,
        status: StatusEntrega.ATRIBUIDA
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao atribuir motorista no Supabase:', error);
      return false;
    }
  };
  
  // Função para remover entrega do motorista
  const removerEntregaMotorista = async (entregaId: string): Promise<boolean> => {
    try {
      const entrega = getEntrega(entregaId);
      
      if (!entrega) return false;
      
      // Apenas entregas atribuídas ou em rota podem ser devolvidas
      if (entrega.status !== StatusEntrega.ATRIBUIDA && entrega.status !== StatusEntrega.EM_ROTA) {
        return false;
      }
      
      // Atualizar no Supabase
      const userId = profile?.id || 'sistema';
      await rotasService.atualizarStatusRota(entregaId, 'pendente', userId);
      
      // Remover motorista no Supabase - não temos função específica para isso no service
      // Atualizar estado local
      await updateEntrega(entregaId, {
        motoristaId: undefined,
        motoristaNome: undefined,
        status: StatusEntrega.PENDENTE,
        rotaId: undefined,
        posicaoRota: undefined
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao remover motorista no Supabase:', error);
      return false;
    }
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
  
  // Função para recarregar dados
  const recarregarEntregas = async (): Promise<void> => {
    await carregarEntregas();
  };
  
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
    getMotoristaAtivo,
    recarregarEntregas
  };
  
  return (
    <EntregasContext.Provider value={value}>
      {children}
    </EntregasContext.Provider>
  );
};

export default EntregasProvider; 