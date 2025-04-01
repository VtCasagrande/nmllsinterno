import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { TrocaInput, TrocaStatus, TrocaTipo } from '@/types/trocas';
import { withAuth } from '@/utils/withAuth';
import { trocas } from '@/services/trocasService';

// GET /api/trocas - Listar todas as trocas
export const GET = withAuth(async () => {
  return NextResponse.json(trocas);
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
    
    // Definir o status inicial com base no tipo de troca
    let statusInicial: TrocaStatus;
    if (data.tipo === TrocaTipo.ENVIADA) {
      statusInicial = TrocaStatus.AGUARDANDO_DEVOLUCAO;
    } else {
      statusInicial = TrocaStatus.COLETADO;
    }
    
    const now = new Date().toISOString();
    const novaTroca = {
      id: uuidv4(),
      ...data,
      status: statusInicial,
      dataCriacao: now,
      dataAtualizacao: now,
      usuarioCriacao: userId,
    };
    
    trocas.push(novaTroca);
    
    return NextResponse.json(novaTroca, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar troca:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
});

// Mostrando os valores dos enums para depuração
console.log('TrocaTipo.ENVIADA =', TrocaTipo.ENVIADA);
console.log('TrocaTipo.RECEBIDA =', TrocaTipo.RECEBIDA);
console.log('TrocaStatus.AGUARDANDO_DEVOLUCAO =', TrocaStatus.AGUARDANDO_DEVOLUCAO);
console.log('TrocaStatus.COLETADO =', TrocaStatus.COLETADO);
console.log('TrocaStatus.FINALIZADA =', TrocaStatus.FINALIZADA);
console.log('TrocaStatus.CANCELADA =', TrocaStatus.CANCELADA); 