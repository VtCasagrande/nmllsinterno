import { LembreteMedicamento } from '@/types/medicamentos';

// Array simulado para armazenar lembretes de medicamentos (em produção, seria um banco de dados)
export let lembretes: LembreteMedicamento[] = [];

// Função para calcular a próxima data de lembrete com base na frequência
export function calcularProximoLembrete(dataInicio: string, frequencia: { valor: number, unidade: string }) {
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
export function lembreteAtivo(dataFim: string) {
  const dataLimite = new Date(dataFim);
  // Não ajustar mais para fim do dia, usar a hora exata
  return new Date() <= dataLimite;
} 