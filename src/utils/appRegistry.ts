import {
  Truck, Package, User, Settings, 
  BarChart2, ShoppingCart, Repeat, BellRing, 
  DollarSign, MapPin, Users, UserCog, Shield, 
  Store, ClipboardList, CreditCard, MessageSquare, HelpCircle,
  RotateCcw, RefreshCw, Bell, PhoneCall, Pill, Clock, Bug,
  Plus, Calendar, List, Route, Map, History, Search,
  FileEdit, Edit, FileText, Database, ArrowRightLeft,
  Table, UserPlus, Monitor, AlertOctagon, Cog
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface AppModule {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  color: string;
  category: string;
  description: string;
  requiredRoles?: string[];
  actions?: AppAction[];
}

export interface AppAction {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  color: string;
  description: string;
  requiredRoles?: string[];
}

export const appCategories = [
  { id: 'logistica', name: 'Logística' },
  { id: 'atendimento', name: 'Atendimento' },
  { id: 'financeiro', name: 'Financeiro' },
  { id: 'gerenciamento', name: 'Gerenciamento' },
  { id: 'suporte', name: 'Suporte' }
];

export const appModules: AppModule[] = [
  {
    id: 'entregas',
    name: 'Entregas',
    href: '/dashboard/entregas/rotas',
    icon: Truck,
    color: 'bg-blue-500',
    category: 'logistica',
    description: 'Gerenciamento de entregas',
    actions: [
      {
        id: 'nova-entrega',
        name: 'Nova Entrega',
        href: '/dashboard/entregas/nova',
        icon: Plus,
        color: 'bg-green-500',
        description: 'Cadastrar nova entrega'
      },
      {
        id: 'rotas',
        name: 'Rotas',
        href: '/dashboard/entregas/rotas',
        icon: Route,
        color: 'bg-blue-600',
        description: 'Gerenciar rotas de entrega'
      },
      {
        id: 'rastreamento',
        name: 'Rastreamento',
        href: '/dashboard/entregas/rastreamento',
        icon: Map,
        color: 'bg-indigo-500',
        description: 'Rastrear entregas'
      },
      {
        id: 'minhas-entregas',
        name: 'Minhas Entregas',
        href: '/dashboard/entregas/minhas',
        icon: List,
        color: 'bg-cyan-500',
        description: 'Ver minhas entregas'
      },
      {
        id: 'pendentes',
        name: 'Pendentes',
        href: '/dashboard/entregas/pendentes',
        icon: Clock,
        color: 'bg-amber-500',
        description: 'Ver entregas pendentes'
      }
    ]
  },
  {
    id: 'devolucoes',
    name: 'Devoluções',
    href: '/dashboard/devolucoes/registro',
    icon: RotateCcw,
    color: 'bg-orange-500',
    category: 'logistica',
    description: 'Gerenciamento de devoluções',
    actions: [
      {
        id: 'registro-devolucao',
        name: 'Registrar',
        href: '/dashboard/devolucoes/registro',
        icon: Plus,
        color: 'bg-green-500',
        description: 'Registrar nova devolução'
      },
      {
        id: 'acompanhamento-devolucao',
        name: 'Acompanhar',
        href: '/dashboard/devolucoes/acompanhamento',
        icon: Search,
        color: 'bg-blue-600',
        description: 'Acompanhar devoluções'
      }
    ]
  },
  {
    id: 'trocas',
    name: 'Trocas',
    href: '/dashboard/trocas',
    icon: ArrowRightLeft,
    color: 'bg-purple-500',
    category: 'logistica',
    description: 'Gerenciamento de trocas',
    actions: [
      {
        id: 'nova-troca',
        name: 'Nova Troca',
        href: '/dashboard/trocas/nova',
        icon: Plus,
        color: 'bg-green-500',
        description: 'Registrar nova troca'
      },
      {
        id: 'listar-trocas',
        name: 'Listar Trocas',
        href: '/dashboard/trocas',
        icon: List,
        color: 'bg-purple-600',
        description: 'Listar todas as trocas'
      }
    ]
  },
  {
    id: 'recorrencias',
    name: 'Recorrências',
    href: '/dashboard/recorrencias',
    icon: RefreshCw,
    color: 'bg-green-500',
    category: 'logistica',
    description: 'Gerenciamento de entregas recorrentes',
    actions: [
      {
        id: 'nova-recorrencia',
        name: 'Nova Recorrência',
        href: '/dashboard/recorrencias/nova',
        icon: Plus,
        color: 'bg-green-600',
        description: 'Criar nova recorrência'
      },
      {
        id: 'listar-recorrencias',
        name: 'Listar',
        href: '/dashboard/recorrencias',
        icon: List,
        color: 'bg-teal-500',
        description: 'Listar recorrências'
      }
    ]
  },
  {
    id: 'medicamentos',
    name: 'Medicamentos',
    href: '/dashboard/medicamentos',
    icon: Pill,
    color: 'bg-red-500',
    category: 'logistica',
    description: 'Gerenciamento de medicamentos',
    actions: [
      {
        id: 'novo-medicamento',
        name: 'Novo',
        href: '/dashboard/medicamentos/novo',
        icon: Plus,
        color: 'bg-green-500',
        description: 'Cadastrar novo medicamento'
      },
      {
        id: 'listar-medicamentos',
        name: 'Listar',
        href: '/dashboard/medicamentos',
        icon: List,
        color: 'bg-red-600',
        description: 'Listar medicamentos'
      },
      {
        id: 'lembretes',
        name: 'Lembretes',
        href: '/dashboard/medicamentos/lembretes',
        icon: Bell,
        color: 'bg-amber-500',
        description: 'Gerenciar lembretes'
      },
      {
        id: 'novo-lembrete',
        name: 'Novo Lembrete',
        href: '/dashboard/medicamentos/lembretes/novo',
        icon: Plus,
        color: 'bg-green-600',
        description: 'Criar novo lembrete'
      }
    ]
  },
  {
    id: 'avisos',
    name: 'Avisos',
    href: '/dashboard/avisos',
    icon: Bell,
    color: 'bg-yellow-500',
    category: 'atendimento',
    description: 'Gerenciamento de avisos',
    actions: [
      {
        id: 'novo-aviso',
        name: 'Novo Aviso',
        href: '/dashboard/avisos/novo',
        icon: Plus,
        color: 'bg-green-500',
        description: 'Criar novo aviso'
      },
      {
        id: 'listar-avisos',
        name: 'Listar',
        href: '/dashboard/avisos',
        icon: List,
        color: 'bg-yellow-600',
        description: 'Listar avisos'
      }
    ]
  },
  {
    id: 'sugestoes',
    name: 'Sugestões',
    href: '/dashboard/sugestoes',
    icon: MessageSquare,
    color: 'bg-sky-500',
    category: 'atendimento',
    description: 'Gerenciamento de sugestões',
    actions: [
      {
        id: 'nova-sugestao',
        name: 'Nova Sugestão',
        href: '/dashboard/sugestoes/novo',
        icon: Plus,
        color: 'bg-green-500',
        description: 'Criar nova sugestão'
      },
      {
        id: 'listar-sugestoes',
        name: 'Listar',
        href: '/dashboard/sugestoes',
        icon: List,
        color: 'bg-sky-600',
        description: 'Listar sugestões'
      }
    ]
  },
  {
    id: 'reembolsos',
    name: 'Reembolsos',
    href: '/dashboard/reembolsos',
    icon: DollarSign,
    color: 'bg-emerald-500',
    category: 'financeiro',
    description: 'Gerenciamento de reembolsos',
    actions: [
      {
        id: 'novo-reembolso',
        name: 'Novo Reembolso',
        href: '/dashboard/reembolsos/novo',
        icon: Plus,
        color: 'bg-green-500',
        description: 'Criar novo reembolso'
      },
      {
        id: 'listar-reembolsos',
        name: 'Listar',
        href: '/dashboard/reembolsos',
        icon: List,
        color: 'bg-emerald-600',
        description: 'Listar reembolsos'
      }
    ]
  },
  {
    id: 'crm',
    name: 'CRM',
    href: '/dashboard/crm',
    icon: Store,
    color: 'bg-indigo-500',
    category: 'atendimento',
    description: 'Customer Relationship Management',
    actions: [
      {
        id: 'novo-cliente',
        name: 'Novo Cliente',
        href: '/dashboard/crm/novo',
        icon: UserPlus,
        color: 'bg-green-500',
        description: 'Cadastrar novo cliente'
      },
      {
        id: 'listar-clientes',
        name: 'Listar',
        href: '/dashboard/crm',
        icon: List,
        color: 'bg-indigo-600',
        description: 'Listar clientes'
      },
      {
        id: 'calendario',
        name: 'Calendário',
        href: '/dashboard/crm/calendario',
        icon: Calendar,
        color: 'bg-cyan-500',
        description: 'Ver calendário de atendimentos'
      }
    ]
  },
  {
    id: 'usuarios',
    name: 'Usuários',
    href: '/dashboard/usuarios',
    icon: Users,
    color: 'bg-pink-500',
    category: 'gerenciamento',
    description: 'Gerenciamento de usuários',
    requiredRoles: ['admin'],
    actions: [
      {
        id: 'novo-usuario',
        name: 'Novo Usuário',
        href: '/dashboard/usuarios/novo',
        icon: UserPlus,
        color: 'bg-green-500',
        description: 'Cadastrar novo usuário',
        requiredRoles: ['admin']
      },
      {
        id: 'listar-usuarios',
        name: 'Listar',
        href: '/dashboard/usuarios',
        icon: List,
        color: 'bg-pink-600',
        description: 'Listar usuários',
        requiredRoles: ['admin']
      }
    ]
  },
  {
    id: 'logs',
    name: 'Logs',
    href: '/dashboard/logs',
    icon: Database,
    color: 'bg-gray-600',
    category: 'suporte',
    description: 'Visualização de logs do sistema',
    requiredRoles: ['admin']
  },
  {
    id: 'configuracoes',
    name: 'Configurações',
    href: '/dashboard/configuracoes/webhooks',
    icon: Settings,
    color: 'bg-slate-500',
    category: 'gerenciamento',
    description: 'Configurações do sistema',
    requiredRoles: ['admin'],
    actions: [
      {
        id: 'webhooks',
        name: 'Webhooks',
        href: '/dashboard/configuracoes/webhooks',
        icon: Cog,
        color: 'bg-blue-600',
        description: 'Configurar webhooks',
        requiredRoles: ['admin']
      },
      {
        id: 'novo-webhook',
        name: 'Novo Webhook',
        href: '/dashboard/configuracoes/webhooks/novo',
        icon: Plus,
        color: 'bg-green-500',
        description: 'Criar novo webhook',
        requiredRoles: ['admin']
      }
    ]
  },
  {
    id: 'ajuda',
    name: 'Ajuda',
    href: '/dashboard/ajuda/docs',
    icon: HelpCircle,
    color: 'bg-teal-500',
    category: 'suporte',
    description: 'Ajuda e suporte',
    actions: [
      {
        id: 'documentacao',
        name: 'Documentação',
        href: '/dashboard/ajuda/docs',
        icon: FileText,
        color: 'bg-blue-600',
        description: 'Ver documentação'
      },
      {
        id: 'bugs',
        name: 'Reportar Bugs',
        href: '/dashboard/ajuda/bugs',
        icon: Bug,
        color: 'bg-red-500',
        description: 'Reportar bugs'
      },
      {
        id: 'listar-bugs',
        name: 'Listar Bugs',
        href: '/dashboard/ajuda/bugs/listar',
        icon: List,
        color: 'bg-amber-500',
        description: 'Listar bugs reportados'
      }
    ]
  }
];

export function getModulesByCategory(category: string) {
  return appModules.filter(module => module.category === category);
}

export function getModuleById(id: string) {
  return appModules.find(module => module.id === id);
}

export function getModuleActions(moduleId: string) {
  const module = getModuleById(moduleId);
  return module?.actions || [];
}

export function filterModulesByRole(modules: AppModule[], userRole: string | undefined) {
  if (!userRole) return [];
  
  return modules.filter(module => {
    // Se não há requisitos de role, qualquer um pode acessar
    if (!module.requiredRoles || module.requiredRoles.length === 0) {
      return true;
    }
    
    // Admin tem acesso a tudo
    if (userRole === 'admin') {
      return true;
    }
    
    // Verifica se o role do usuário está entre os roles requeridos
    return module.requiredRoles.includes(userRole);
  });
}

appModules.forEach(module => {
  if (module.id === 'configuracoes' && module.actions) {
    module.actions.forEach(action => {
      if (action.id === 'webhooks') {
        action.icon = Cog;
      }
    });
  }
}); 