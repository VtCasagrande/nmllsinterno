import { NextRequest, NextResponse } from 'next/server';
import { avisos } from '@/services/avisosService';
import { withAuth } from '@/utils/withAuth';
import { AvisoStatus } from '@/types/avisos';

// POST /api/avisos/[id]/arquivar - Arquivar um aviso
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
      
      // Verificar permissão - apenas admin ou criador pode arquivar
      // Em uma implementação real, verificaríamos o papel do usuário
      // if (avisos[index].usuarioCriacao !== userId && !isAdmin(userId)) {
      //   return NextResponse.json(
      //     { error: 'Sem permissão para arquivar este aviso' },
      //     { status: 403 }
      //   );
      // }
      
      // Atualizar o status para arquivado
      avisos[index].status = AvisoStatus.ARQUIVADO;
      
      return NextResponse.json({
        success: true,
        message: 'Aviso arquivado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao arquivar aviso:', error);
      return NextResponse.json(
        { error: 'Erro ao arquivar aviso' },
        { status: 500 }
      );
    }
  }
); 