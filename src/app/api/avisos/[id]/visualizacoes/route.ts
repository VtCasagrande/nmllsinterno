import { NextRequest, NextResponse } from 'next/server';
import { avisos } from '../../route';
import { withAuth } from '@/utils/withAuth';

// POST /api/avisos/[id]/visualizacoes - Registrar uma visualização
export const POST = withAuth(
  async (_req: NextRequest, { params, userId }: { params: { id: string }; userId: string }) => {
    try {
      const { id } = params;
      
      // Em produção, consultaria um banco de dados
      const index = avisos.findIndex((a) => a.id === id);
      
      if (index === -1) {
        return NextResponse.json(
          { error: 'Aviso não encontrado' },
          { status: 404 }
        );
      }
      
      const aviso = avisos[index];
      
      // Registrar que o usuário visualizou o aviso se ainda não estiver na lista
      if (!aviso.visualizacoes.includes(userId)) {
        aviso.visualizacoes.push(userId);
      }
      
      return NextResponse.json({ 
        success: true, 
        visualizacoes: aviso.visualizacoes.length 
      });
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
      return NextResponse.json(
        { error: 'Erro ao registrar visualização' },
        { status: 500 }
      );
    }
  }
); 