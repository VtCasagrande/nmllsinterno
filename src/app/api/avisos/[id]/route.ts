import { NextRequest, NextResponse } from 'next/server';
import { avisos } from '@/services/avisosService';
import { withAuth } from '@/utils/withAuth';
import { AvisoStatus } from '@/types/avisos';

// GET /api/avisos/[id] - Obter um aviso específico
export const GET = withAuth(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      // Em produção, consultaria um banco de dados
      const aviso = avisos.find((a) => a.id === id);
      
      if (!aviso) {
        return NextResponse.json(
          { error: 'Aviso não encontrado' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(aviso);
    } catch (error) {
      console.error('Erro ao buscar aviso:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar aviso' },
        { status: 500 }
      );
    }
  }
);

// PUT /api/avisos/[id] - Atualizar um aviso existente
export const PUT = withAuth(
  async (req: NextRequest, { params, userId }: { params: { id: string }; userId: string }) => {
    try {
      const { id } = params;
      const data = await req.json();
      
      // Em produção, consultaria um banco de dados
      const index = avisos.findIndex((a) => a.id === id);
      
      if (index === -1) {
        return NextResponse.json(
          { error: 'Aviso não encontrado' },
          { status: 404 }
        );
      }
      
      // Verificar permissão - apenas admin ou criador pode atualizar
      // Em produção, verificaria a permissão real do usuário
      
      // Manter campos que não podem ser alterados
      const avisoAtualizado = {
        ...avisos[index],
        ...data,
        id: avisos[index].id, // Garantir que o ID não seja alterado
        dataPublicacao: avisos[index].dataPublicacao, // Manter data de publicação original
        usuarioCriacao: avisos[index].usuarioCriacao, // Manter usuário de criação original
      };
      
      // Atualizar no array em memória
      avisos[index] = avisoAtualizado;
      
      return NextResponse.json(avisoAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar aviso:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar aviso' },
        { status: 500 }
      );
    }
  }
); 