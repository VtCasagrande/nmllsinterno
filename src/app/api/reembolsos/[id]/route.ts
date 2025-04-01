import { NextRequest, NextResponse } from 'next/server';
import { Reembolso } from '@/types/reembolsos';
import { auth } from '@/auth';

// Variável compartilhada para armazenar reembolsos em desenvolvimento
let reembolsos: Reembolso[] = [];

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

// GET /api/reembolsos/[id] - Obter um reembolso específico
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Encontrar o reembolso pelo ID
    const reembolso = reembolsos.find(r => r.id === id);
    
    if (!reembolso) {
      return NextResponse.json(
        { error: 'Reembolso não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(reembolso, { status: 200 });
  } catch (error) {
    console.error('Erro ao obter reembolso:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// PUT /api/reembolsos/[id] - Atualizar um reembolso
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticação temporariamente desativada
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
    
    const { id } = params;
    const data = await request.json();
    
    // Encontrar o reembolso pelo ID
    const reembolsoIndex = reembolsos.findIndex(r => r.id === id);
    
    if (reembolsoIndex === -1) {
      return NextResponse.json(
        { error: 'Reembolso não encontrado' },
        { status: 404 }
      );
    }
    
    // Atualizar o reembolso, mantendo campos que não foram enviados
    const reembolsoAtualizado: Reembolso = {
      ...reembolsos[reembolsoIndex],
      ...data,
      id, // garantir que o ID não mude
      dataAtualizacao: new Date().toISOString(),
      usuarioAtualizacao: mockUser.email
    };
    
    // Verificar se há novo pedido e já existe reembolso com mesmo número de pedido
    if (
      data.numeroPedidoTiny && 
      reembolsoAtualizado.numeroPedidoTiny !== reembolsos[reembolsoIndex].numeroPedidoTiny
    ) {
      const existingReembolso = reembolsos.find(
        r => r.id !== id && r.numeroPedidoTiny === data.numeroPedidoTiny
      );
      
      if (existingReembolso) {
        return NextResponse.json(
          { error: `Já existe um reembolso para o pedido ${data.numeroPedidoTiny}` },
          { status: 400 }
        );
      }
    }
    
    // Atualizar na lista
    reembolsos[reembolsoIndex] = reembolsoAtualizado;
    
    // Se estiver no cliente, salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('reembolsos', JSON.stringify(reembolsos));
    }
    
    return NextResponse.json(reembolsoAtualizado, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar reembolso:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// DELETE /api/reembolsos/[id] - Excluir um reembolso
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticação temporariamente desativada
    /*
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    */
    
    const { id } = params;
    
    // Verificar se o reembolso existe
    const reembolsoIndex = reembolsos.findIndex(r => r.id === id);
    
    if (reembolsoIndex === -1) {
      return NextResponse.json(
        { error: 'Reembolso não encontrado' },
        { status: 404 }
      );
    }
    
    // Remover da lista
    reembolsos.splice(reembolsoIndex, 1);
    
    // Se estiver no cliente, salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('reembolsos', JSON.stringify(reembolsos));
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erro ao excluir reembolso:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 