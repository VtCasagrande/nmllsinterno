import { Aviso, AvisoStatus, TipoDestinatario, AvisoPrioridade } from '@/types/avisos';

// Array simulado para armazenar avisos (em produção, seria um banco de dados)
export const avisos: Aviso[] = [
  {
    id: '1',
    titulo: 'Promoção imperdível',
    conteudo: 'Descontos de até 50% em produtos selecionados',
    tipoDestinatario: TipoDestinatario.GRUPO,
    grupos: ['Loja A', 'Loja B'],
    prioridade: AvisoPrioridade.ALTA,
    status: AvisoStatus.ATIVO,
    dataPublicacao: '2023-11-15T10:00:00Z',
    dataExpiracao: '2023-12-15T23:59:59Z',
    usuarioCriacao: 'admin',
    visualizacoes: 0,
    reacoes: []
  },
  {
    id: '2',
    titulo: 'Nova política de entregas',
    conteudo: 'A partir de 01/12, novas regras para entregas serão implementadas',
    tipoDestinatario: TipoDestinatario.TODOS,
    prioridade: AvisoPrioridade.NORMAL,
    status: AvisoStatus.ATIVO,
    dataPublicacao: '2023-11-20T14:30:00Z',
    dataExpiracao: '2023-12-31T23:59:59Z',
    usuarioCriacao: 'admin',
    visualizacoes: 0,
    reacoes: []
  },
  {
    id: '3',
    titulo: 'Treinamento obrigatório',
    conteudo: 'Todos os funcionários devem realizar o treinamento online de segurança.',
    tipoDestinatario: TipoDestinatario.GRUPO,
    grupos: ['Vendas', 'Administração'],
    prioridade: AvisoPrioridade.URGENTE,
    status: AvisoStatus.ARQUIVADO,
    dataPublicacao: '2023-10-15T09:15:00Z',
    dataExpiracao: '2023-11-30T23:59:59Z',
    usuarioCriacao: 'gerente',
    visualizacoes: 0,
    reacoes: []
  },
  {
    id: '4',
    titulo: 'Manutenção do sistema',
    conteudo: 'O sistema ficará indisponível entre 22h e 23h para manutenção programada',
    tipoDestinatario: TipoDestinatario.TODOS,
    prioridade: AvisoPrioridade.ALTA,
    status: AvisoStatus.ATIVO,
    dataPublicacao: '2023-11-22T15:45:00Z',
    dataExpiracao: '2023-11-22T23:59:59Z',
    usuarioCriacao: 'suporte',
    visualizacoes: 2,
    reacoes: []
  }
]; 