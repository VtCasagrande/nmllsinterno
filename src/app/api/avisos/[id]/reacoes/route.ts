import { NextRequest, NextResponse } from 'next/server';
import { avisos } from '../../route';
import { withAuth } from '@/utils/withAuth';
import { TipoReacao } from '@/types/avisos';

// POST /api/avisos/[id]/reacoes - Adicionar ou atualizar uma reação
export const POST = withAuth(
  async (req: NextRequest, { params, userId }: { params: { id: string }; userId: string }) => {
    try {
      const { id } = params;
      const { tipo } = await req.json();
      
      if (!Object.values(TipoReacao).includes(tipo)) {
        return NextResponse.json(
          { error: 'Tipo de reação inválido' },
          { status: 400 }
        );
      }
      
      // Em produção, consultaria um banco de dados
      const index = avisos.findIndex((a) => a.id === id);
      
      if (index === -1) {
        return NextResponse.json(
          { error: 'Aviso não encontrado' },
          { status: 404 }
        );
      }
      
      const aviso = avisos[index];
      
      // Verifica se o usuário já reagiu a este aviso
      const reacaoExistenteIndex = aviso.reacoes.findIndex(r => r.usuarioId === userId);
      
      if (reacaoExistenteIndex !== -1) {
        // Atualiza a reação existente
        aviso.reacoes[reacaoExistenteIndex].tipo = tipo;
      } else {
        // Adiciona nova reação
        aviso.reacoes.push({
          usuarioId: userId,
          tipo,
          data: new Date().toISOString()
        });
      }
      
      // Registrar que o usuário visualizou o aviso se ainda não estiver na lista
      if (!aviso.visualizacoes.includes(userId)) {
        aviso.visualizacoes.push(userId);
      }
      
      return NextResponse.json({ success: true, reacoes: aviso.reacoes });
    } catch (error) {
      console.error('Erro ao adicionar reação:', error);
      return NextResponse.json(
        { error: 'Erro ao adicionar reação' },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/avisos/[id]/reacoes - Remover uma reação
export const DELETE = withAuth(
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
      
      // Remove a reação do usuário
      aviso.reacoes = aviso.reacoes.filter(r => r.usuarioId !== userId);
      
      return NextResponse.json({ success: true, reacoes: aviso.reacoes });
    } catch (error) {
      console.error('Erro ao remover reação:', error);
      return NextResponse.json(
        { error: 'Erro ao remover reação' },
        { status: 500 }
      );
    }
  }
); 