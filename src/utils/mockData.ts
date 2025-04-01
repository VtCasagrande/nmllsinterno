import { Entrega, StatusEntrega, FormaPagamento, Rota, Motorista } from '../types/entregas';

// Mock de Motoristas
export const MOTORISTAS_MOCK: Motorista[] = [
  {
    id: '1',
    nome: 'João Silva',
    telefone: '(11) 98765-4321',
    status: 'ativo',
    veiculo: 'Fiorino',
    placaVeiculo: 'ABC-1234',
    ultimaAtualizacao: new Date().toISOString(),
    latitude: -23.550520,
    longitude: -46.633308,
    rotaAtual: '1'
  },
  {
    id: '2',
    nome: 'Maria Souza',
    telefone: '(11) 97654-3210',
    status: 'ativo',
    veiculo: 'Van',
    placaVeiculo: 'DEF-5678',
    ultimaAtualizacao: new Date().toISOString(),
    latitude: -23.555520,
    longitude: -46.639308,
    rotaAtual: '2'
  },
  {
    id: '3',
    nome: 'Pedro Santos',
    telefone: '(11) 96543-2109',
    status: 'inativo',
    veiculo: 'Fiorino',
    placaVeiculo: 'GHI-9012',
    ultimaAtualizacao: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '4',
    nome: 'Ana Oliveira',
    telefone: '(11) 95432-1098',
    status: 'ativo',
    veiculo: 'Van',
    placaVeiculo: 'JKL-3456',
    ultimaAtualizacao: new Date().toISOString(),
    latitude: -23.560520,
    longitude: -46.636308
  },
  {
    id: '5',
    nome: 'Carlos Ferreira',
    telefone: '(11) 94321-0987',
    status: 'ativo',
    veiculo: 'Fiorino',
    placaVeiculo: 'MNO-7890',
    ultimaAtualizacao: new Date().toISOString(),
    latitude: -23.545520,
    longitude: -46.635308
  }
];

// Mock de Entregas
export const ENTREGAS_MOCK: Entrega[] = [
  {
    id: '1',
    numeroPedido: '10001',
    dataCriacao: new Date().toISOString(),
    dataMaxima: new Date(Date.now() + 86400000).toISOString(),
    status: StatusEntrega.PENDENTE,
    nomeCliente: 'Roberto Almeida',
    telefoneCliente: '(11) 91234-5678',
    endereco: 'Rua das Flores, 123',
    cidade: 'São Paulo',
    cep: '01234-567',
    complemento: 'Apto 42',
    formaEnvio: 'Entrega Expressa',
    observacoes: 'Entregar na portaria',
    itens: [
      {
        id: '101',
        nome: 'Smartphone Galaxy X20',
        quantidade: 1,
        codigo: 'SM-X20',
        preco: 1999.90
      },
      {
        id: '102',
        nome: 'Capa protetora',
        quantidade: 1,
        codigo: 'CP-X20',
        preco: 59.90
      }
    ],
    pagamento: {
      forma: FormaPagamento.DINHEIRO,
      valor: 2059.80,
      recebido: false,
      troco: 0
    }
  },
  {
    id: '2',
    numeroPedido: '10002',
    dataCriacao: new Date().toISOString(),
    status: StatusEntrega.PENDENTE,
    nomeCliente: 'Fernanda Costa',
    telefoneCliente: '(11) 92345-6789',
    endereco: 'Avenida Paulista, 1000',
    cidade: 'São Paulo',
    cep: '01310-100',
    formaEnvio: 'Entrega Normal',
    itens: [
      {
        id: '201',
        nome: 'Notebook Pro',
        quantidade: 1,
        codigo: 'NB-PRO',
        preco: 3899.90
      }
    ],
    pagamento: {
      forma: FormaPagamento.CREDITO,
      valor: 3899.90,
      recebido: false
    }
  },
  {
    id: '3',
    numeroPedido: '10003',
    dataCriacao: new Date(Date.now() - 86400000).toISOString(),
    status: StatusEntrega.ATRIBUIDA,
    motoristaId: '1',
    motoristaNome: 'João Silva',
    rotaId: '1',
    posicaoRota: 1,
    nomeCliente: 'Lucas Oliveira',
    telefoneCliente: '(11) 93456-7890',
    endereco: 'Rua Augusta, 500',
    cidade: 'São Paulo',
    cep: '01305-000',
    complemento: 'Sala 10',
    formaEnvio: 'Entrega Expressa',
    itens: [
      {
        id: '301',
        nome: 'Monitor 27"',
        quantidade: 2,
        codigo: 'MON-27',
        preco: 1299.90
      },
      {
        id: '302',
        nome: 'Teclado sem fio',
        quantidade: 1,
        codigo: 'TEC-SF',
        preco: 199.90
      }
    ],
    pagamento: {
      forma: FormaPagamento.PIX,
      valor: 2799.70,
      recebido: true
    }
  },
  {
    id: '4',
    numeroPedido: '10004',
    dataCriacao: new Date(Date.now() - 172800000).toISOString(),
    dataEntrega: new Date(Date.now() - 86400000).toISOString(),
    status: StatusEntrega.ENTREGUE,
    motoristaId: '2',
    motoristaNome: 'Maria Souza',
    rotaId: '2',
    posicaoRota: 1,
    nomeCliente: 'Amanda Castro',
    telefoneCliente: '(11) 94567-8901',
    endereco: 'Rua Oscar Freire, 300',
    cidade: 'São Paulo',
    cep: '01426-000',
    formaEnvio: 'Entrega Normal',
    assinatura: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0...',
    itens: [
      {
        id: '401',
        nome: 'Cadeira de Escritório',
        quantidade: 1,
        codigo: 'CAD-ESC',
        preco: 899.90
      }
    ],
    pagamento: {
      forma: FormaPagamento.DINHEIRO,
      valor: 899.90,
      recebido: true
    }
  },
  {
    id: '5',
    numeroPedido: '10005',
    dataCriacao: new Date().toISOString(),
    dataMaxima: new Date(Date.now() + 86400000).toISOString(),
    status: StatusEntrega.PENDENTE,
    nomeCliente: 'Rafael Mendes',
    telefoneCliente: '(11) 95678-9012',
    endereco: 'Rua dos Pinheiros, 150',
    cidade: 'São Paulo',
    cep: '05422-000',
    complemento: 'Casa 2',
    formaEnvio: 'Entrega Expressa',
    itens: [
      {
        id: '501',
        nome: 'Smart TV 55"',
        quantidade: 1,
        codigo: 'TV-55',
        preco: 2899.90
      },
      {
        id: '502',
        nome: 'Suporte para TV',
        quantidade: 1,
        codigo: 'SUP-TV',
        preco: 149.90
      }
    ],
    pagamento: {
      forma: FormaPagamento.DEBITO,
      valor: 3049.80,
      recebido: false
    }
  },
  {
    id: '6',
    numeroPedido: '10006',
    dataCriacao: new Date().toISOString(),
    status: StatusEntrega.ATRIBUIDA,
    motoristaId: '1',
    motoristaNome: 'João Silva',
    rotaId: '1',
    posicaoRota: 2,
    nomeCliente: 'Juliana Lima',
    telefoneCliente: '(11) 96789-0123',
    endereco: 'Alameda Santos, 800',
    cidade: 'São Paulo',
    cep: '01418-100',
    formaEnvio: 'Entrega Normal',
    observacoes: 'Ligar antes de entregar',
    itens: [
      {
        id: '601',
        nome: 'Aspirador de Pó',
        quantidade: 1,
        codigo: 'ASP-PO',
        preco: 599.90
      }
    ],
    pagamento: {
      forma: FormaPagamento.SEM_PAGAMENTO,
      valor: 0,
      recebido: true
    }
  },
  {
    id: '7',
    numeroPedido: '10007',
    dataCriacao: new Date().toISOString(),
    status: StatusEntrega.ATRIBUIDA,
    motoristaId: '2',
    motoristaNome: 'Maria Souza',
    rotaId: '2',
    posicaoRota: 2,
    nomeCliente: 'Marcos Silva',
    telefoneCliente: '(11) 97890-1234',
    endereco: 'Rua Haddock Lobo, 400',
    cidade: 'São Paulo',
    cep: '01414-000',
    formaEnvio: 'Entrega Expressa',
    itens: [
      {
        id: '701',
        nome: 'Máquina de Lavar',
        quantidade: 1,
        codigo: 'MAQ-LAV',
        preco: 1899.90
      }
    ],
    pagamento: {
      forma: FormaPagamento.BOLETO,
      valor: 1899.90,
      recebido: true
    }
  }
];

// Mock de Rotas
export const ROTAS_MOCK: Rota[] = [
  {
    id: '1',
    codigo: 'RT001',
    data: new Date().toISOString(),
    motoristaId: '1',
    motoristaNome: 'João Silva',
    status: 'em_andamento',
    entregas: ['3', '6'],
    otimizada: true
  },
  {
    id: '2',
    codigo: 'RT002',
    data: new Date().toISOString(),
    motoristaId: '2',
    motoristaNome: 'Maria Souza',
    status: 'em_andamento',
    entregas: ['7'],
    otimizada: true
  },
  {
    id: '3',
    codigo: 'RT003',
    data: new Date(Date.now() - 86400000).toISOString(),
    motoristaId: '4',
    motoristaNome: 'Ana Oliveira',
    status: 'concluida',
    entregas: ['4'],
    otimizada: true
  }
]; 