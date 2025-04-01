import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { AvisoInput, AvisoPrioridade, AvisoStatus, TipoDestinatario } from '@/types/avisos';
import { withAuth } from '@/utils/withAuth';
import { avisos } from '@/services/avisosService';

// GET /api/avisos - Listar todos os avisos
export const GET = withAuth(async (_req: NextRequest) => {
  try {
    // Em produção, consultaria um banco de dados
    return NextResponse.json(avisos);
  } catch (error) {
    console.error('Erro ao listar avisos:', error);
    return NextResponse.json(
      { error: 'Erro ao listar avisos' },
      { status: 500 }
    );
  }
});

// POST /api/avisos - Criar um novo aviso
export const POST = withAuth(
  async (req: NextRequest, { userId }: { userId: string }) => {
    try {
      const data = await req.json();
      
      // Validar dados necessários
      if (!data.titulo || !data.conteudo) {
        return NextResponse.json(
          { error: 'Título e conteúdo são obrigatórios' },
          { status: 400 }
        );
      }
      
      // Criar novo aviso
      const novoAviso = {
        id: uuidv4(),
        titulo: data.titulo,
        conteudo: data.conteudo,
        tipoDestinatario: data.tipoDestinatario || TipoDestinatario.TODOS,
        prioridade: data.prioridade || AvisoPrioridade.NORMAL,
        status: AvisoStatus.ATIVO,
        dataPublicacao: new Date().toISOString(),
        usuarioCriacao: userId,
        visualizacoes: 0,
        reacoes: [],
        dataExpiracao: data.dataExpiracao,
        grupos: data.tipoDestinatario === TipoDestinatario.GRUPO ? data.grupos : undefined,
        usuarios: data.tipoDestinatario === TipoDestinatario.USUARIOS ? data.usuarios : undefined
      };
      
      // Adicionar ao array em memória (em produção, salvaria no banco de dados)
      avisos.push(novoAviso);
      
      return NextResponse.json(novoAviso, { status: 201 });
    } catch (error) {
      console.error('Erro ao criar aviso:', error);
      return NextResponse.json(
        { error: 'Erro ao criar aviso' },
        { status: 500 }
      );
    }
  }
); 