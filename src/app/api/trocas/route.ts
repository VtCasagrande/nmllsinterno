import { NextRequest, NextResponse } from 'next/server';
import { TrocaInput, TrocaStatus, TrocaTipo } from '@/types/trocas';
import { withAuth } from '@/utils/withAuth';
import { trocas } from '@/services/trocasService';

// GET /api/trocas - Listar todas as trocas
export const GET = withAuth(async (req: NextRequest) => {
  try {
    // Obter parâmetros de filtro da URL, se houver
    const url = new URL(req.url);
    const tipo = url.searchParams.get('tipo') as TrocaTipo | undefined;
    const status = url.searchParams.get('status') as TrocaStatus | undefined;
    const ean = url.searchParams.get('ean') || undefined;
    const lojaParceira = url.searchParams.get('lojaParceira') || undefined;
    const dataInicio = url.searchParams.get('dataInicio') || undefined;
    const dataFim = url.searchParams.get('dataFim') || undefined;
    const nomeProduto = url.searchParams.get('nomeProduto') || undefined;
    const responsavel = url.searchParams.get('responsavel') || undefined;
    
    const filtros = { tipo, status, ean, lojaParceira, dataInicio, dataFim, nomeProduto, responsavel };
    
    const listaTrocas = await trocas.buscarTrocas(filtros);
    return NextResponse.json(listaTrocas);
  } catch (error) {
    console.error('Erro ao listar trocas:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
});

// POST /api/trocas - Criar uma nova troca
export const POST = withAuth(async (req: NextRequest, { userId }: { userId: string }) => {
  try {
    const data: TrocaInput = await req.json();
    
    // Validação básica
    if (!data.ean || !data.nomeProduto || !data.lojaParceira) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não informados' },
        { status: 400 }
      );
    }
    
    // Criar a troca utilizando o método do serviço
    const novaTroca = await trocas.criarTroca(data, userId);
    
    return NextResponse.json(novaTroca, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar troca:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}); 