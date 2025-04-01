// Dados simulados para as devoluções
export const DEVOLUCOES_MOCK = [
  {
    id: 1,
    codigo: 'DEV001',
    produto: '',
    motivo: '',
    status: 'em_aberto',
    data: '2025-04-01T14:30:00',
    responsavel: 'Ana Silva',
    responsavel_recebimento: 'Ana Silva',
    responsavel_analise: '',
    observacoes: 'Produto chegou com a tela trincada',
    fotos: ['foto1.jpg'],
    data_finalizacao: '',
    pedido_tiny: '',
    nota_fiscal: '',
    descricao: '',
    produtos: [],
    comentarios: [
      {
        id: 1,
        texto: 'Produto chegou com a tela trincada',
        autor: 'Ana Silva',
        data: '2025-04-01T14:30:00'
      }
    ]
  },
  {
    id: 2,
    codigo: 'DEV002',
    produto: 'Notebook Dell Inspiron',
    motivo: 'produto_incorreto',
    status: 'em_analise',
    data: '2025-03-31T10:15:00',
    responsavel: 'Carlos Santos',
    responsavel_recebimento: 'Carlos Santos',
    responsavel_analise: 'João Pereira',
    observacoes: 'Cliente recebeu modelo diferente do solicitado',
    fotos: ['foto2.jpg', 'foto3.jpg'],
    data_finalizacao: '',
    pedido_tiny: '',
    nota_fiscal: '',
    descricao: 'Produto recebido pelo cliente é o modelo básico, mas ele comprou o modelo premium',
    produtos: [
      { id: 1, codigo: 'PROD001', nome: 'Notebook Dell Inspiron', quantidade: 1 }
    ],
    comentarios: [
      {
        id: 1,
        texto: 'Cliente recebeu modelo diferente do solicitado',
        autor: 'Carlos Santos',
        data: '2025-03-31T10:15:00'
      },
      {
        id: 2,
        texto: 'Iniciando análise do produto devolvido',
        autor: 'João Pereira',
        data: '2025-03-31T14:20:00'
      }
    ]
  },
  {
    id: 3,
    codigo: 'DEV003',
    produto: 'Monitor LG 24"',
    motivo: 'cliente_desistiu',
    status: 'finalizado',
    data: '2025-03-30T09:45:00',
    responsavel: 'Pedro Oliveira',
    responsavel_recebimento: 'Pedro Oliveira',
    responsavel_analise: 'Mariana Costa',
    observacoes: 'Cliente desistiu da compra, produto em perfeito estado',
    fotos: ['foto4.jpg'],
    data_finalizacao: '2025-04-02T16:20:00',
    pedido_tiny: 'TINY123456',
    nota_fiscal: 'NF-987654',
    descricao: 'Cliente desistiu da compra após receber o produto em perfeito estado',
    produtos: [
      { id: 1, codigo: 'PROD005', nome: 'Monitor LG 24"', quantidade: 1 }
    ]
  },
  {
    id: 4,
    codigo: 'DEV004',
    produto: '',
    motivo: '',
    status: 'cancelado',
    data: '2025-03-29T16:40:00',
    responsavel: 'Julia Mendes',
    responsavel_recebimento: 'Julia Mendes',
    responsavel_analise: '',
    observacoes: 'Endereço não localizado, cliente não atendeu tentativas de contato',
    fotos: ['foto5.jpg', 'foto6.jpg', 'foto7.jpg'],
    data_finalizacao: '',
    pedido_tiny: '',
    nota_fiscal: '',
    descricao: '',
    produtos: [],
    comentarios: []
  },
  {
    id: 5,
    codigo: 'DEV005',
    produto: '',
    motivo: '',
    status: 'em_aberto',
    data: '2025-03-28T11:20:00',
    responsavel: 'Ricardo Alves',
    responsavel_recebimento: 'Ricardo Alves',
    responsavel_analise: '',
    observacoes: 'Produto apresenta falha no som do lado direito',
    fotos: ['foto8.jpg'],
    data_finalizacao: '',
    pedido_tiny: '',
    nota_fiscal: '',
    descricao: '',
    produtos: [],
    comentarios: []
  },
]; 