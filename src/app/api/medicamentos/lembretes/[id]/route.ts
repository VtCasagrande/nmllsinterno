import { NextRequest, NextResponse } from 'next/server';
import { LembreteMedicamentoFormValues } from '@/types/medicamentos';
import { randomUUID } from 'crypto';
import { lembretes, calcularProximoLembrete, lembreteAtivo } from '@/services/medicamentosService';

// GET - Retorna um lembrete específico pelo ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  // Buscar o lembrete pelo ID
  const lembrete = lembretes.find(l => l.id === id);
  
  if (!lembrete) {
    return NextResponse.json({ error: 'Lembrete não encontrado' }, { status: 404 });
  }
  
  return NextResponse.json(lembrete);
}

// PUT - Atualiza um lembrete existente pelo ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const formData: LembreteMedicamentoFormValues = await request.json();
    
    // Encontrar o índice do lembrete no array
    const index = lembretes.findIndex(l => l.id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Lembrete não encontrado' }, { status: 404 });
    }
    
    // Validações básicas
    if (!formData.cliente.nome || !formData.cliente.telefone || !formData.pet.nome || formData.medicamentos.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    
    // Transformar medicamentos (manter IDs existentes ou criar novos)
    const medicamentosComId = formData.medicamentos.map(med => ({
      ...med,
      id: randomUUID() // Criar um novo ID único para cada medicamento
    }));
    
    // Determinar a próxima data de lembrete (a mais próxima entre todos os medicamentos)
    let proximoLembrete: string | undefined;
    
    medicamentosComId.forEach(med => {
      const proximaData = calcularProximoLembrete(med.dataInicio, med.frequencia);
      
      if (!proximoLembrete || new Date(proximaData) < new Date(proximoLembrete)) {
        proximoLembrete = proximaData;
      }
    });
    
    // Determinar se o lembrete deve estar ativo
    const ativo = medicamentosComId.some(med => lembreteAtivo(med.dataFim));
    
    // Atualizar o lembrete, mantendo alguns campos originais
    const lembreteAtualizado = {
      ...lembretes[index],
      cliente: formData.cliente,
      pet: formData.pet,
      medicamentos: medicamentosComId,
      ativo,
      atualizadoEm: new Date().toISOString(),
      proximoLembrete,
      observacoes: formData.observacoes
    };
    
    // Atualizar no "banco de dados"
    lembretes[index] = lembreteAtualizado;
    
    return NextResponse.json(lembreteAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar lembrete:', error);
    return NextResponse.json({ error: 'Erro ao processar a requisição' }, { status: 500 });
  }
}

// PATCH - Altera o status de um lembrete pelo ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { ativo } = await request.json();
    
    if (typeof ativo !== 'boolean') {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }
    
    // Encontrar o índice do lembrete no array
    const index = lembretes.findIndex(l => l.id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Lembrete não encontrado' }, { status: 404 });
    }
    
    // Atualizar o status
    lembretes[index] = {
      ...lembretes[index],
      ativo,
      atualizadoEm: new Date().toISOString()
    };
    
    return NextResponse.json(lembretes[index]);
  } catch (error) {
    console.error('Erro ao atualizar status do lembrete:', error);
    return NextResponse.json({ error: 'Erro ao processar a requisição' }, { status: 500 });
  }
}

// DELETE - Remove um lembrete pelo ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  // Encontrar o índice do lembrete no array
  const index = lembretes.findIndex(l => l.id === id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Lembrete não encontrado' }, { status: 404 });
  }
  
  // Remover do "banco de dados"
  lembretes.splice(index, 1);
  
  return new NextResponse(null, { status: 204 });
} 