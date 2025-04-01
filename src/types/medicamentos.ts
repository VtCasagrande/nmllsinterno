export interface Medicamento {
  id: string;
  nome: string;
  quantidade: string;
  frequencia: {
    valor: number;
    unidade: 'minutos' | 'horas' | 'dias';
  };
  dataInicio: string;
  dataFim: string;
  mensagemPersonalizada?: string;
}

export interface LembreteMedicamento {
  id: string;
  cliente: {
    nome: string;
    telefone: string;
  };
  pet: {
    nome: string;
    raca?: string;
  };
  medicamentos: Medicamento[];
  ativo: boolean;
  criador: string;
  criadoEm: string;
  atualizadoEm: string;
  proximoLembrete?: string;
  observacoes?: string;
}

export interface MedicamentoFormValues {
  nome: string;
  quantidade: string;
  frequencia: {
    valor: number;
    unidade: 'minutos' | 'horas' | 'dias';
  };
  dataInicio: string;
  dataFim: string;
  mensagemPersonalizada?: string;
}

export interface LembreteMedicamentoFormValues {
  cliente: {
    nome: string;
    telefone: string;
  };
  pet: {
    nome: string;
    raca?: string;
  };
  medicamentos: MedicamentoFormValues[];
  observacoes?: string;
}

export interface UnidadeFrequencia {
  valor: string;
  label: string;
}

export const unidadesFrequencia: UnidadeFrequencia[] = [
  { valor: 'minutos', label: 'Minutos' },
  { valor: 'horas', label: 'Horas' },
  { valor: 'dias', label: 'Dias' }
]; 