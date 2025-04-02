import {
  Truck, Package, User, Settings, 
  BarChart2, ShoppingCart, Repeat, BellRing, 
  DollarSign, MapPin, Users, UserCog, Shield, 
  Store, ClipboardList, CreditCard, MessageSquare, HelpCircle,
  RotateCcw, RefreshCw, Bell, PhoneCall, Pill, Clock, Bug
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
    href: '/dashboard/entregas',
    icon: Truck,
    color: 'bg-blue-500',
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
    id: 'trocas',
    name: 'Trocas',
    href: '/dashboard/trocas',
    icon: Package,
    color: 'bg-purple-500',
    category: 'logistica',
    description: 'Gerenciamento de trocas'
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
    id: 'medicamentos',
    name: 'Medicamentos',
    href: '/dashboard/medicamentos',
    icon: Pill,
    color: 'bg-red-500',
    category: 'logistica',
    description: 'Gerenciamento de medicamentos'
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
    description: 'Gerenciamento de usuários',
    requiredRoles: ['admin']
  },
  {
    id: 'logs',
    name: 'Logs',
    href: '/dashboard/logs',
    icon: ClipboardList,
    color: 'bg-gray-700',
    category: 'suporte',
    description: 'Visualização de logs do sistema',
    requiredRoles: ['admin']
  },
  {
    id: 'configuracoes',
    name: 'Configurações',
    href: '/dashboard/configuracoes',
    icon: Settings,
    color: 'bg-gray-600',
    category: 'gerenciamento',
    description: 'Configurações do sistema',
    requiredRoles: ['admin']
  },
  {
    id: 'ajuda',
    name: 'Ajuda',
    href: '/dashboard/ajuda',
    icon: HelpCircle,
    color: 'bg-teal-500',
    category: 'suporte',
    description: 'Ajuda e suporte'
  }
];

export function getModulesByCategory(category: string) {
  return appModules.filter(module => module.category === category);
}

export function getModuleById(id: string) {
  return appModules.find(module => module.id === id);
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