import { ElementType } from 'react';
import { 
  Home, 
  Truck, 
  User, 
  Package, 
  Store, 
  Settings, 
  Bell, 
  MessageSquare, 
  FileText, 
  Pill, 
  Users, 
  Database, 
  HelpCircle, 
  RotateCcw, 
  RefreshCw, 
  DollarSign
} from 'lucide-react';

export interface AppAction {
  id: string;
  name: string;
  href: string;
  description?: string;
  icon?: ElementType;
  color?: string;
  requiredRoles?: string[];
}

export interface AppModule {
  id: string;
  name: string;
  href: string;
  icon: ElementType;
  color: string;
  category: string;
  description: string;
  requiredRoles?: string[];
  actions?: AppAction[];
}

export interface AppCategory {
  id: string;
  name: string;
  description?: string;
}

// Categorias de aplicativos
export const appCategories: AppCategory[] = [
  {
    id: 'principal',
    name: 'Principal',
    description: 'Aplicativos principais'
  },
  {
    id: 'logistica',
    name: 'Logística',
    description: 'Gerenciamento de logística e entregas'
  },
  {
    id: 'atendimento',
    name: 'Atendimento',
    description: 'Atendimento ao cliente'
  },
  {
    id: 'financeiro',
    name: 'Financeiro',
    description: 'Gerenciamento financeiro'
  },
  {
    id: 'gerenciamento',
    name: 'Gerenciamento',
    description: 'Administração do sistema'
  },
  {
    id: 'suporte',
    name: 'Suporte',
    description: 'Suporte e ajuda'
  }
];

// Módulos de aplicativos
export const appModules: AppModule[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    color: 'bg-blue-500',
    category: 'principal',
    description: 'Visão geral do sistema',
  },
  {
    id: 'entregas',
    name: 'Entregas',
    href: '/dashboard/entregas',
    icon: Truck,
    color: 'bg-red-500',
    category: 'logistica',
    description: 'Gerenciamento de entregas'
  },
  {
    id: 'devolucoes',
    name: 'Devoluções',
    href: '/dashboard/devolucoes',
    icon: RotateCcw,
    color: 'bg-orange-500',
    category: 'logistica',
    description: 'Gerenciamento de devoluções'
  },
  {
    id: 'recorrencias',
    name: 'Recorrências',
    href: '/dashboard/recorrencias',
    icon: RefreshCw,
    color: 'bg-green-500',
    category: 'logistica',
    description: 'Gerenciamento de entregas recorrentes'
  },
  {
    id: 'avisos',
    name: 'Avisos',
    href: '/dashboard/avisos',
    icon: Bell,
    color: 'bg-yellow-500',
    category: 'atendimento',
    description: 'Gerenciamento de avisos'
  },
  {
    id: 'sugestoes',
    name: 'Sugestões',
    href: '/dashboard/sugestoes',
    icon: MessageSquare,
    color: 'bg-sky-500',
    category: 'atendimento',
    description: 'Gerenciamento de sugestões'
  },
  {
    id: 'reembolsos',
    name: 'Reembolsos',
    href: '/dashboard/reembolsos',
    icon: DollarSign,
    color: 'bg-emerald-500',
    category: 'financeiro',
    description: 'Gerenciamento de reembolsos'
  },
  {
    id: 'medicamentos',
    name: 'Medicamentos',
    href: '/dashboard/medicamentos',
    icon: Pill,
    color: 'bg-red-500',
    category: 'logistica',
    description: 'Gerenciamento de medicamentos'
  },
  {
    id: 'crm',
    name: 'CRM',
    href: '/dashboard/crm',
    icon: Store,
    color: 'bg-indigo-500',
    category: 'atendimento',
    description: 'Customer Relationship Management'
  },
  {
    id: 'usuarios',
    name: 'Usuários',
    href: '/dashboard/usuarios',
    icon: Users,
    color: 'bg-pink-500',
    category: 'gerenciamento',
    description: 'Gerenciamento de usuários'
  }
];

// Funções auxiliares
export function getModulesByCategory(categoryId: string): AppModule[] {
  return appModules.filter(module => module.category === categoryId);
}

export function filterModulesByRole(modules: AppModule[], role?: string): AppModule[] {
  if (!role) return modules;
  
  return modules.filter(module => {
    if (!module.requiredRoles || module.requiredRoles.length === 0) {
      return true;
    }
    return module.requiredRoles.includes(role);
  });
}

export function getModuleActions(moduleId: string): AppAction[] {
  const module = appModules.find(m => m.id === moduleId);
  return module?.actions || [];
}

export function getModuleById(moduleId: string): AppModule | undefined {
  return appModules.find(m => m.id === moduleId);
} 