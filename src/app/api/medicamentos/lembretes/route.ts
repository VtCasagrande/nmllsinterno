import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { LembreteMedicamento, LembreteMedicamentoFormValues } from '@/types/medicamentos';

// Exportar lembretes para que possam ser usados por outros módulos
export let lembretes: LembreteMedicamento[] = [];

// Função para calcular a próxima data de lembrete com base na frequência
function calcularProximoLembrete(dataInicio: string, frequencia: { valor: number, unidade: string }) {
  const data = new Date(dataInicio);
  const agora = new Date();
  
  if (data > agora) {
    return data.toISOString();
  }
  
  // Calcula próxima data com base na frequência
  let proximaData = new Date(data);
  
  while (proximaData <= agora) {
    if (frequencia.unidade === 'minutos') {
      proximaData.setMinutes(proximaData.getMinutes() + frequencia.valor);
    } else if (frequencia.unidade === 'horas') {
      proximaData.setHours(proximaData.getHours() + frequencia.valor);
    } else if (frequencia.unidade === 'dias') {
      proximaData.setDate(proximaData.getDate() + frequencia.valor);
    }
  }
  
  return proximaData.toISOString();
}

// Função para verificar se o lembrete está dentro do período válido
function lembreteAtivo(dataFim: string) {
  const dataLimite = new Date(dataFim);
  // Não ajustar mais para fim do dia, usar a hora exata
  return new Date() <= dataLimite;
}

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
    const novoLembrete: LembreteMedicamento = {
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