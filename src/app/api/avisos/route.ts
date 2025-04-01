import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { withAuth } from '@/utils/withAuth';
import { 
  Aviso,
  AvisoStatus,
  AvisoPrioridade,
  TipoDestinatario
} from '@/types/avisos';

// Dados simulados em memória (em produção, usaria um banco de dados)
export const avisos: Aviso[] = [
  {
    id: '1',
    titulo: 'Manutenção Programada do Sistema',
    conteudo: 'Informamos que haverá manutenção programada no sistema no dia 20/04, das 22h às 02h. Durante este período, o sistema ficará indisponível.',
    tipoDestinatario: TipoDestinatario.TODOS,
    prioridade: AvisoPrioridade.ALTA,
    status: AvisoStatus.ATIVO,
    dataPublicacao: new Date(Date.now() - 259200000).toISOString(), // 3 dias atrás
    usuarioCriacao: 'admin',
    visualizacoes: 12,
    reacoes: [
      {
        id: '1',
        avisoId: '1',
        usuarioId: 'user1',
        usuarioNome: 'João Silva',
        tipo: 'VERIFICADO',
        dataCriacao: new Date(Date.now() - 172800000).toISOString() // 2 dias atrás
      },
      {
        id: '2',
        avisoId: '1',
        usuarioId: 'user2',
        usuarioNome: 'Maria Oliveira',
        tipo: 'CONCORDAR',
        dataCriacao: new Date(Date.now() - 86400000).toISOString() // 1 dia atrás
      }
    ]
  },
  {
    id: '2',
    titulo: 'Nova Política de Entregas',
    conteudo: 'A partir do dia 25/04, entrarão em vigor novas políticas de entrega. Todos os motoristas devem comparecer à reunião informativa no dia 22/04 às 9h.',
    tipoDestinatario: TipoDestinatario.GRUPO,
    grupos: ['motoristas'],
    prioridade: AvisoPrioridade.NORMAL,
    status: AvisoStatus.ATIVO,
    dataPublicacao: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
    usuarioCriacao: 'admin',
    visualizacoes: 8,
    reacoes: []
  }
];

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
      const novoAviso: Aviso = {
        id: uuidv4(),
        titulo: data.titulo,
        conteudo: data.conteudo,
        tipoDestinatario: data.tipoDestinatario || TipoDestinatario.TODOS,
        prioridade: data.prioridade || AvisoPrioridade.NORMAL,
        status: AvisoStatus.ATIVO,
        dataPublicacao: new Date().toISOString(),
        usuarioCriacao: userId,
        visualizacoes: 0,
        reacoes: []
      };
      
      // Adicionar campos opcionais
      if (data.dataExpiracao) {
        novoAviso.dataExpiracao = data.dataExpiracao;
      }
      
      if (data.tipoDestinatario === TipoDestinatario.GRUPO && data.grupos) {
        novoAviso.grupos = data.grupos;
      }
      
      if (data.tipoDestinatario === TipoDestinatario.USUARIOS && data.usuarios) {
        novoAviso.usuarios = data.usuarios;
      }
      
      // Em produção, salvaria no banco de dados
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