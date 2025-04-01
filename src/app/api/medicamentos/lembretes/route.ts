import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { LembreteMedicamentoFormValues } from '@/types/medicamentos';
import { lembretes, calcularProximoLembrete, lembreteAtivo } from '@/services/medicamentosService';

// GET - Retorna todos os lembretes
export async function GET(request: NextRequest) {
  return NextResponse.json(lembretes);
}

// POST - Cria um novo lembrete
export async function POST(request: NextRequest) {
  try {
    const formData: LembreteMedicamentoFormValues = await request.json();
    
    // Validações básicas
    if (!formData.cliente.nome || !formData.cliente.telefone || !formData.pet.nome || formData.medicamentos.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    
    // Gerar ID único para o lembrete
    const id = randomUUID();
    const agora = new Date().toISOString();
    
    // Transformar medicamentos adicionando IDs
    const medicamentosComId = formData.medicamentos.map(med => ({
      ...med,
      id: randomUUID()
    }));
    
    // Determinar a próxima data de lembrete (a mais próxima entre todos os medicamentos)
    let proximoLembrete: string | undefined;
    
    medicamentosComId.forEach(med => {
      const proximaData = calcularProximoLembrete(med.dataInicio, med.frequencia);
      
      if (!proximoLembrete || new Date(proximaData) < new Date(proximoLembrete)) {
        proximoLembrete = proximaData;
      }
    });
    
    // Determinar se o lembrete deve estar ativo inicialmente
    const ativo = medicamentosComId.some(med => lembreteAtivo(med.dataFim));
    
    // Criar o novo lembrete
    const novoLembrete = {
      id,
      cliente: formData.cliente,
      pet: formData.pet,
      medicamentos: medicamentosComId,
      ativo,
      criador: 'Sistema', // Em produção, seria o usuário autenticado
      criadoEm: agora,
      atualizadoEm: agora,
      proximoLembrete,
      observacoes: formData.observacoes
    };
    
    // Adicionar ao "banco de dados"
    lembretes.push(novoLembrete);
    
    return NextResponse.json(novoLembrete, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar lembrete:', error);
    return NextResponse.json({ error: 'Erro ao processar a requisição' }, { status: 500 });
  }
} 