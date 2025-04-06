import { NextRequest, NextResponse } from 'next/server';
import { TrocaUpdate } from '@/types/trocas';
import { withAuth } from '@/utils/withAuth';
import { trocas } from '@/services/trocasService';

// GET /api/trocas/[id] - Obter uma troca específica
export const GET = withAuth(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const { id } = params;
  try {
    const troca = await trocas.buscarTrocaPorId(id);
    
    if (!troca) {
      return NextResponse.json({ error: 'Troca não encontrada' }, { status: 404 });
    }
    
    return NextResponse.json(troca);
  } catch (error) {
    console.error(`Erro ao buscar troca ${id}:`, error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
});

// PUT /api/trocas/[id] - Atualizar uma troca existente
export const PUT = withAuth(
  async (req: NextRequest, { params, userId }: { params: { id: string }; userId: string }) => {
    try {
      const { id } = params;
      const data: TrocaUpdate = await req.json();
      
      console.log(`Atualizando troca ${id} para status:`, data.status);
      
      // Verificar se a troca existe
      const trocaExistente = await trocas.buscarTrocaPorId(id);
      
      if (!trocaExistente) {
        console.error(`Troca não encontrada com ID: ${id}`);
        return NextResponse.json({ error: 'Troca não encontrada' }, { status: 404 });
      }
      
      // Atualizar a troca utilizando o método do serviço
      const trocaAtualizada = await trocas.atualizarTroca(id, data, userId);
      
      console.log('Troca atualizada:', trocaAtualizada);
      
      return NextResponse.json(trocaAtualizada);
    } catch (error) {
      console.error('Erro ao atualizar troca:', error);
      return NextResponse.json(
        { error: 'Erro ao processar a solicitação' },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/trocas/[id] - Excluir uma troca
export const DELETE = withAuth(
  async (_req: NextRequest, { params, userId }: { params: { id: string }; userId: string }) => {
    try {
      const { id } = params;
      
      // Verificar se a troca existe
      const trocaExistente = await trocas.buscarTrocaPorId(id);
      
      if (!trocaExistente) {
        return NextResponse.json({ error: 'Troca não encontrada' }, { status: 404 });
      }
      
      // Excluir a troca utilizando o método do serviço
      await trocas.excluirTroca(id, userId);
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Erro ao excluir troca:', error);
      return NextResponse.json(
        { error: 'Erro ao processar a solicitação' },
        { status: 500 }
      );
    }
  }
); 