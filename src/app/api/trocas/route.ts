import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { TrocaInput, TrocaStatus, TrocaTipo } from '@/types/trocas';
import { withAuth } from '@/utils/withAuth';
import { trocasService } from '@/services/trocasService';

// GET /api/trocas - Listar todas as trocas
export const GET = withAuth(async (req: NextRequest) => {
  try {
    // Obter parâmetros da query
    const url = new URL(req.url);
    const tipo = url.searchParams.get('tipo') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const ean = url.searchParams.get('ean') || undefined;
    const lojaParceira = url.searchParams.get('lojaParceira') || undefined;
    const dataInicio = url.searchParams.get('dataInicio') || undefined;
    const dataFim = url.searchParams.get('dataFim') || undefined;
    const nomeProduto = url.searchParams.get('nomeProduto') || undefined;
    const responsavel = url.searchParams.get('responsavel') || undefined;

    // Buscar trocas filtradas
    const trocas = await trocasService.buscarTrocas({
      tipo: tipo as any,
      status: status as any,
      ean,
      lojaParceira,
      dataInicio,
      dataFim,
      nomeProduto,
      responsavel
    });

    return NextResponse.json(trocas);
  } catch (error) {
    console.error('Erro ao listar trocas:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
});

// POST /api/trocas - Criar uma nova troca
export const POST = withAuth(
  async (req: NextRequest, { userId }: { userId: string }) => {
    try {
      const dados = await req.json();
      
      // Criar a nova troca usando o serviço
      const novaTroca = await trocasService.criarTroca(dados, userId);
      
      return NextResponse.json(novaTroca, { status: 201 });
    } catch (error) {
      console.error('Erro ao criar troca:', error);
      return NextResponse.json(
        { error: 'Erro ao processar a solicitação' },
        { status: 500 }
      );
    }
  }
);

// Mostrando os valores dos enums para depuração
console.log('TrocaTipo.ENVIADA =', TrocaTipo.ENVIADA);
console.log('TrocaTipo.RECEBIDA =', TrocaTipo.RECEBIDA);
console.log('TrocaStatus.AGUARDANDO_DEVOLUCAO =', TrocaStatus.AGUARDANDO_DEVOLUCAO);
console.log('TrocaStatus.COLETADO =', TrocaStatus.COLETADO);
console.log('TrocaStatus.FINALIZADA =', TrocaStatus.FINALIZADA);
console.log('TrocaStatus.CANCELADA =', TrocaStatus.CANCELADA); 