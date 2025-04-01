import { NextRequest, NextResponse } from 'next/server';
import { TrocaUpdate } from '@/types/trocas';
import { withAuth } from '@/utils/withAuth';

// Referência ao array simulado de trocas (em produção, seria um banco de dados)
// Usando uma variável global para simular um banco de dados entre chamadas
let trocas = (global as any).trocas || [];

// Importar trocas iniciais do módulo de rota principal
if (typeof window === 'undefined' && !(global as any).trocasInitialized) {
  try {
    // Importar apenas no lado do servidor para evitar problemas de hidratação
    const trocasApi = require('@/app/api/trocas/route');
    if (trocasApi && Array.isArray(trocasApi.trocas)) {
      trocas = trocasApi.trocas;
      (global as any).trocas = trocas;
      (global as any).trocasInitialized = true;
    }
  } catch (error) {
    console.error('Erro ao importar trocas iniciais:', error);
    // Dados iniciais de fallback caso a importação falhe
    if (trocas.length === 0) {
      console.log('Usando dados iniciais de fallback para trocas');
      // Não adicionamos dados aqui pois já temos dados iniciais no route.ts
    }
  }
}

// GET /api/trocas/[id] - Obter uma troca específica
export const GET = withAuth(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const { id } = params;
  const troca = trocas.find((t: any) => t.id === id);
  
  if (!troca) {
    return NextResponse.json({ error: 'Troca não encontrada' }, { status: 404 });
  }
  
  return NextResponse.json(troca);
});

// PUT /api/trocas/[id] - Atualizar uma troca existente
export const PUT = withAuth(
  async (req: NextRequest, { params, userId }: { params: { id: string }; userId: string }) => {
    try {
      const { id } = params;
      const data: TrocaUpdate = await req.json();
      
      console.log(`Atualizando troca ${id} para status:`, data.status);
      
      const index = trocas.findIndex((t: any) => t.id === id);
      
      if (index === -1) {
        console.error(`Troca não encontrada com ID: ${id}`);
        return NextResponse.json({ error: 'Troca não encontrada' }, { status: 404 });
      }
      
      // Atualizar apenas os campos fornecidos
      const trocaAtualizada = {
        ...trocas[index],
        ...data,
        dataAtualizacao: new Date().toISOString(),
        usuarioAtualizacao: userId,
      };
      
      console.log('Troca atualizada:', trocaAtualizada);
      
      trocas[index] = trocaAtualizada;
      
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
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const index = trocas.findIndex((t: any) => t.id === id);
      
      if (index === -1) {
        return NextResponse.json({ error: 'Troca não encontrada' }, { status: 404 });
      }
      
      trocas.splice(index, 1);
      
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