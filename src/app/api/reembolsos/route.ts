import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Reembolso, ReembolsoStatus, ReembolsoPrioridade } from '@/types/reembolsos';
import { auth } from '@/auth';

// Variável de memória para armazenar reembolsos em desenvolvimento
let reembolsos: Reembolso[] = [];

// Criar reembolsos de exemplo se não existir nenhum
function criarReembolsosExemplo() {
  if (reembolsos.length === 0) {
    const exemploIds = [];
    // Reembolso 1 - Em Análise
    const reembolso1: Reembolso = {
      id: uuidv4(),
      numeroPedidoTiny: '123456',
      nomeCliente: 'João Silva',
      dataPedido: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias atrás
      statusPedidoTiny: 'Entregue',
      responsavelReembolso: 'Maria Souza',
      prioridade: ReembolsoPrioridade.MEDIA,
      formaPagamento: 'Pix',
      telefoneCliente: '(11) 98765-4321',
      valorPedidoTotal: 350.00,
      valorReembolso: 150.00,
      motivoReembolso: 'Produto com defeito',
      observacao: 'Cliente solicitou reembolso parcial',
      dataCriacao: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 dias atrás
      dataAtualizacao: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
      status: ReembolsoStatus.EM_ANALISE,
      usuarioCriacao: 'sistema@nmalls.com.br',
      usuarioAtualizacao: 'sistema@nmalls.com.br'
    };
    
    // Reembolso 2 - Aprovado
    const reembolso2: Reembolso = {
      id: uuidv4(),
      numeroPedidoTiny: '234567',
      nomeCliente: 'Ana Oliveira',
      dataPedido: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 dias atrás
      statusPedidoTiny: 'Entregue',
      responsavelReembolso: 'Carlos Santos',
      prioridade: ReembolsoPrioridade.ALTA,
      formaPagamento: 'Cartão de Crédito',
      telefoneCliente: '(21) 97654-3210',
      valorPedidoTotal: 420.00,
      valorReembolso: 420.00,
      motivoReembolso: 'Produto incorreto enviado',
      observacao: 'Cliente recebeu produto errado, reembolso total aprovado',
      dataCriacao: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 dias atrás
      dataAtualizacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
      status: ReembolsoStatus.APROVADO,
      usuarioCriacao: 'sistema@nmalls.com.br',
      usuarioAtualizacao: 'sistema@nmalls.com.br'
    };
    
    // Reembolso 3 - Pago
    const reembolso3: Reembolso = {
      id: uuidv4(),
      numeroPedidoTiny: '345678',
      nomeCliente: 'Roberto Lima',
      dataPedido: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 dias atrás
      statusPedidoTiny: 'Entregue',
      responsavelReembolso: 'Paula Ferreira',
      prioridade: ReembolsoPrioridade.BAIXA,
      formaPagamento: 'Boleto',
      telefoneCliente: '(31) 98765-1234',
      valorPedidoTotal: 180.00,
      valorReembolso: 180.00,
      motivoReembolso: 'Arrependimento de compra',
      observacao: 'Processado dentro do prazo de 7 dias',
      dataCriacao: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 dias atrás
      dataAtualizacao: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
      status: ReembolsoStatus.PAGO,
      usuarioCriacao: 'sistema@nmalls.com.br',
      usuarioAtualizacao: 'sistema@nmalls.com.br'
    };
    
    // Reembolso 4 - Cancelado
    const reembolso4: Reembolso = {
      id: uuidv4(),
      numeroPedidoTiny: '456789',
      nomeCliente: 'Mariana Costa',
      dataPedido: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 dias atrás
      statusPedidoTiny: 'Entregue',
      responsavelReembolso: 'José Almeida',
      prioridade: ReembolsoPrioridade.URGENTE,
      formaPagamento: 'Transferência Bancária',
      telefoneCliente: '(41) 99876-5432',
      valorPedidoTotal: 750.00,
      valorReembolso: 300.00,
      motivoReembolso: 'Produto entregue com avaria',
      observacao: 'Cliente solicitou cancelamento do processo após acordo com suporte',
      dataCriacao: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 dias atrás
      dataAtualizacao: new Date().toISOString(), // hoje
      status: ReembolsoStatus.CANCELADO,
      usuarioCriacao: 'sistema@nmalls.com.br',
      usuarioAtualizacao: 'sistema@nmalls.com.br'
    };
    
    reembolsos.push(reembolso1, reembolso2, reembolso3, reembolso4);
    
    console.log('Reembolsos de exemplo criados:', reembolsos.length);
    
    // Se estiver no cliente, salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('reembolsos', JSON.stringify(reembolsos));
    }
    
    return reembolsos;
  }
  
  return reembolsos;
}

// Carregar reembolsos do localStorage se disponível no cliente
if (typeof window !== 'undefined') {
  try {
    const savedReembolsos = localStorage.getItem('reembolsos');
    if (savedReembolsos) {
      reembolsos = JSON.parse(savedReembolsos);
    }
  } catch (error) {
    console.error('Erro ao carregar reembolsos do localStorage:', error);
  }
}

// GET /api/reembolsos - Obter todos os reembolsos
export async function GET() {
  try {
    // Criar reembolsos de exemplo se necessário
    if (reembolsos.length === 0) {
      criarReembolsosExemplo();
    }
    
    // Aqui você implementaria a lógica para obter os reembolsos do banco de dados
    // Por enquanto, usando a variável em memória para fins de demonstração
    
    return NextResponse.json(reembolsos, { status: 200 });
  } catch (error) {
    console.error('Erro ao obter reembolsos:', error);
    return NextResponse.json(
      { error: 'Erro ao obter reembolsos' },
      { status: 500 }
    );
  }
}

// POST /api/reembolsos - Criar um novo reembolso
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (desativado temporariamente)
    /* 
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    */
    
    // Usuário simulado para desenvolvimento
    const mockUser = {
      email: 'usuario@teste.com'
    };
    
    const data = await request.json();
    
    // Validação básica
    if (!data.numeroPedidoTiny || !data.nomeCliente || !data.valorReembolso) {
      return NextResponse.json(
        { error: 'Dados incompletos para criar o reembolso' },
        { status: 400 }
      );
    }
    
    // Criar o novo reembolso
    const novoReembolso: Reembolso = {
      id: uuidv4(),
      numeroPedidoTiny: data.numeroPedidoTiny,
      nomeCliente: data.nomeCliente,
      dataPedido: data.dataPedido,
      statusPedidoTiny: data.statusPedidoTiny,
      responsavelReembolso: data.responsavelReembolso,
      prioridade: data.prioridade,
      formaPagamento: data.formaPagamento,
      telefoneCliente: data.telefoneCliente,
      valorPedidoTotal: Number(data.valorPedidoTotal) || 0,
      valorReembolso: Number(data.valorReembolso) || 0,
      motivoReembolso: data.motivoReembolso,
      observacao: data.observacao || '',
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      status: ReembolsoStatus.EM_ANALISE,
      usuarioCriacao: mockUser.email,
      usuarioAtualizacao: mockUser.email
    };
    
    // Adicionar à lista em memória (em produção seria o banco de dados)
    reembolsos.push(novoReembolso);
    
    // Se estiver no cliente, salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('reembolsos', JSON.stringify(reembolsos));
    }
    
    return NextResponse.json(novoReembolso, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar reembolso:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 