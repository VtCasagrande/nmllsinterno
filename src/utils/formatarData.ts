import { format, isValid, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data para exibição
 * @param dataString String da data a ser formatada (ISO)
 * @param incluirHora Se deve incluir a hora na formatação
 * @returns String formatada da data
 */
export function formatarData(dataString: string, incluirHora = false): string {
  const data = new Date(dataString);
  
  if (!isValid(data)) {
    return 'Data inválida';
  }
  
  try {
    if (incluirHora) {
      return format(data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } else {
      return format(data, 'dd/MM/yyyy', { locale: ptBR });
    }
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
}

/**
 * Formata uma data relativa ao momento atual (ex: "há 2 dias")
 * @param dataString String da data a ser formatada (ISO)
 * @returns String formatada relativamente à data atual
 */
export function formatarDataRelativa(dataString: string): string {
  const data = new Date(dataString);
  
  if (!isValid(data)) {
    return 'Data inválida';
  }
  
  try {
    return formatDistanceToNow(data, {
      addSuffix: true,
      locale: ptBR
    });
  } catch (error) {
    console.error('Erro ao formatar data relativa:', error);
    return 'Data inválida';
  }
} 