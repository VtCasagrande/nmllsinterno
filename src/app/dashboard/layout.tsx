'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, Home, Truck, Package, User, LogOut, ChevronDown, 
  Settings, BarChart2, ShoppingCart, Repeat, BellRing, 
  DollarSign, MapPin, Users, UserCog, Shield, 
  Store, ClipboardList, CreditCard, PieChart, Layers,
  Clipboard, FileText, MessageSquare, HelpCircle,
  RotateCcw,
  RefreshCw,
  Bell,
  PhoneCall,
  Pill,
  Clock,
  Bug,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarLinkProps {
  href: string;
  icon: ReactNode;
  text: string;
  isActive: boolean;
  hasSubmenu?: boolean;
  submenuOpen?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

interface SidebarCategoryProps {
  title: string;
  children: ReactNode;
}

interface SidebarSubmenuProps {
  text: string;
  isActive: boolean;
  isOpen: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
  tooltip?: string;
}

function SidebarCategory({ title, children }: SidebarCategoryProps) {
  return (
    <div className="mb-4">
      <div className="px-3 mb-2 text-xs font-medium uppercase text-gray-500 tracking-wider">
        {title}
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

function SidebarLink({ href, icon, text, isActive, hasSubmenu, submenuOpen, onClick, tooltip }: SidebarLinkProps) {
  const linkContent = (
    <Link
      href={hasSubmenu ? '#' : href}
      onClick={onClick}
      className={`flex items-center p-3 text-sm rounded-lg ${
        isActive ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
      }`}
    >
      <span className="w-6 h-6 mr-2">{icon}</span>
      <span className="flex-1">{text}</span>
      {hasSubmenu && (
        <ChevronDown
          className={`w-4 h-4 transition-transform ${submenuOpen ? 'rotate-180' : ''}`}
        />
      )}
    </Link>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
}

function SidebarSubmenu({ text, isActive, isOpen, onClick, icon, children, tooltip }: SidebarSubmenuProps) {
  const submenuTrigger = (
    <div
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer text-sm rounded-lg ${
        isActive ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
      }`}
    >
      <span className="w-6 h-6 mr-2">{icon}</span>
      <span className="flex-1">{text}</span>
      <ChevronDown
        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      />
    </div>
  );

  return (
    <div>
      {tooltip ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {submenuTrigger}
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : submenuTrigger}
      
      {isOpen && (
        <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
          {children}
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Submenus para cada categoria
  const [entregasSubmenuOpen, setEntregasSubmenuOpen] = useState(false);
  const [devolucoesSubmenuOpen, setDevolucoesSubmenuOpen] = useState(false);
  const [usuariosSubmenuOpen, setUsuariosSubmenuOpen] = useState(false);
  const [configuracoesSubmenuOpen, setConfiguracoesSubmenuOpen] = useState(false);
  const [ajudaSubmenuOpen, setAjudaSubmenuOpen] = useState(false);
  const [medicamentosSubmenuOpen, setMedicamentosSubmenuOpen] = useState(false);
  
  const pathname = usePathname();
  
  // Usar try/catch para evitar erros ao acessar o contexto
  let signOut = () => {};
  let profile = null;
  
  try {
    const auth = useAuth();
    signOut = auth.signOut;
    profile = auth.profile;
  } catch (err) {
    console.error('Erro ao acessar contexto de autenticação:', err);
    setError('Erro ao carregar dados do usuário');
  }

  // Registrar handler para erros não capturados
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Erro não capturado no layout:', event.error);
      setError('Ocorreu um erro ao renderizar o layout');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const isActive = (path: string) => pathname === path;
  const isActiveParent = (pathPrefix: string) => pathname.startsWith(pathPrefix);

  // Links do menu lateral
  const links = [
    {
      title: 'Início',
      href: '/dashboard',
      icon: Home
    },
    {
      title: 'Entregas',
      href: '/dashboard/entregas',
      icon: Truck
    },
    {
      title: 'Devoluções',
      href: '/dashboard/devolucoes',
      icon: RotateCcw
    },
    {
      title: 'Trocas',
      href: '/dashboard/trocas',
      icon: Package
    },
    {
      title: 'Recorrências',
      href: '/dashboard/recorrencias',
      icon: RefreshCw
    },
    {
      title: 'Avisos',
      href: '/dashboard/avisos',
      icon: Bell
    },
    {
      title: 'Sugestões',
      href: '/dashboard/sugestoes',
      icon: MessageSquare
    },
    {
      title: 'Reembolsos',
      href: '/dashboard/reembolsos',
      icon: FileText
    },
    {
      title: 'Lembretes de Medicamentos',
      href: '/dashboard/medicamentos',
      icon: Pill
    },
    {
      title: 'Usuários',
      href: '/dashboard/usuarios',
      icon: Users
    },
    {
      title: 'Configurações',
      href: '/dashboard/configuracoes',
      icon: Settings
    }
  ];

  // Se houver um erro, mostrar um layout simplificado
  if (error) {
    return (
      <div className="flex h-screen flex-col">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 mx-4 mt-4">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar para mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <span className="text-lg font-bold">Nmalls</span>
          <button
            className="p-2 rounded-md lg:hidden"
            onClick={toggleSidebar}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-1 overflow-y-auto h-[calc(100%-10rem)]">
          {/* Principais */}
          <SidebarCategory title="Principal">
            <SidebarLink
              href="/dashboard"
              icon={<Home />}
              text="Dashboard"
              isActive={isActive('/dashboard')}
              tooltip="Visão geral do sistema"
            />
          </SidebarCategory>
          
          {/* Operações */}
          <SidebarCategory title="Operações">
            <SidebarSubmenu
              text="Entregas"
              isActive={isActiveParent('/dashboard/entregas')}
              isOpen={entregasSubmenuOpen}
              onClick={() => setEntregasSubmenuOpen(!entregasSubmenuOpen)}
              icon={<Truck />}
              tooltip="Gerenciamento de entregas"
            >
              <SidebarLink
                href="/dashboard/entregas/rotas"
                icon={<ClipboardList size={18} />}
                text="Lista de Entregas"
                isActive={isActive('/dashboard/entregas/rotas')}
              />
              <SidebarLink
                href="/dashboard/entregas/minhas"
                icon={<Package size={18} />}
                text="Minhas Entregas"
                isActive={isActive('/dashboard/entregas/minhas')}
              />
              <SidebarLink
                href="/dashboard/entregas/rastreamento"
                icon={<MapPin size={18} />}
                text="Rastreamento"
                isActive={isActive('/dashboard/entregas/rastreamento')}
              />
            </SidebarSubmenu>

            <SidebarSubmenu
              text="Devoluções"
              isActive={isActiveParent('/dashboard/devolucoes')}
              isOpen={devolucoesSubmenuOpen}
              onClick={() => setDevolucoesSubmenuOpen(!devolucoesSubmenuOpen)}
              icon={<Repeat />}
              tooltip="Gerenciamento de devoluções"
            >
              <SidebarLink
                href="/dashboard/devolucoes/registro"
                icon={<Clipboard size={18} />}
                text="Registro"
                isActive={isActive('/dashboard/devolucoes/registro')}
              />
              <SidebarLink
                href="/dashboard/devolucoes/acompanhamento"
                icon={<FileText size={18} />}
                text="Acompanhamento"
                isActive={isActive('/dashboard/devolucoes/acompanhamento')}
              />
            </SidebarSubmenu>
            
            <SidebarLink
              href="/dashboard/trocas"
              icon={<Store />}
              text="Trocas Entre Lojas"
              isActive={isActiveParent('/dashboard/trocas')}
              tooltip="Gerenciar transferências entre lojas"
            />
            
            <SidebarLink
              href="/dashboard/recorrencias"
              icon={<RefreshCw />}
              text="Recorrências"
              isActive={isActiveParent('/dashboard/recorrencias')}
              tooltip="Gerenciar clientes recorrentes"
            />
          </SidebarCategory>
          
          {/* Gestão */}
          <SidebarCategory title="Gestão">
            <SidebarLink
              href="/dashboard/crm"
              icon={<PhoneCall />}
              text="CRM"
              isActive={isActiveParent('/dashboard/crm')}
              tooltip="Gerenciamento de Relacionamento com Clientes"
            />
            
            <SidebarSubmenu
              text="Usuários"
              isActive={isActiveParent('/dashboard/usuarios')}
              isOpen={usuariosSubmenuOpen}
              onClick={() => setUsuariosSubmenuOpen(!usuariosSubmenuOpen)}
              icon={<Users />}
              tooltip="Gerenciamento de usuários"
            >
              <SidebarLink
                href="/dashboard/usuarios"
                icon={<User size={18} />}
                text="Lista de Usuários"
                isActive={isActive('/dashboard/usuarios')}
              />
              <SidebarLink
                href="/dashboard/usuarios/perfis"
                icon={<UserCog size={18} />}
                text="Perfis e Permissões"
                isActive={isActive('/dashboard/usuarios/perfis')}
              />
            </SidebarSubmenu>
            
            <SidebarSubmenu
              text="Medicamentos"
              isActive={isActiveParent('/dashboard/medicamentos')}
              isOpen={medicamentosSubmenuOpen}
              onClick={() => setMedicamentosSubmenuOpen(!medicamentosSubmenuOpen)}
              icon={<Pill />}
              tooltip="Gerenciamento de medicamentos"
            >
              <SidebarLink
                href="/dashboard/medicamentos/lembretes"
                icon={<Clock size={18} />}
                text="Lembretes"
                isActive={isActive('/dashboard/medicamentos/lembretes')}
              />
            </SidebarSubmenu>
            
            <SidebarLink
              href="/dashboard/sugestoes"
              icon={<ShoppingCart />}
              text="Sugestões de Compras"
              isActive={isActiveParent('/dashboard/sugestoes')}
              tooltip="Recomendações de produtos"
            />
            
            <SidebarLink
              href="/dashboard/avisos"
              icon={<BellRing />}
              text="Notificações"
              isActive={isActiveParent('/dashboard/avisos')}
              tooltip="Gerenciar notificações do sistema"
            />
          </SidebarCategory>
          
          {/* Financeiro */}
          <SidebarCategory title="Financeiro">
            <SidebarLink
              href="/dashboard/reembolsos"
              icon={<DollarSign />}
              text="Reembolsos"
              isActive={isActiveParent('/dashboard/reembolsos')}
              tooltip="Gestão de reembolsos"
            />
          </SidebarCategory>
          
          {/* Configurações */}
          <SidebarCategory title="Sistema">
            <SidebarSubmenu
              text="Configurações"
              isActive={isActiveParent('/dashboard/configuracoes')}
              isOpen={configuracoesSubmenuOpen}
              onClick={() => setConfiguracoesSubmenuOpen(!configuracoesSubmenuOpen)}
              icon={<Settings />}
              tooltip="Configurações do sistema"
            >
              <SidebarLink
                href="/dashboard/configuracoes/webhooks"
                icon={<Layers size={18} />}
                text="Integrações"
                isActive={isActive('/dashboard/configuracoes/webhooks')}
              />
            </SidebarSubmenu>
            
            <SidebarSubmenu
              text="Ajuda"
              isActive={isActiveParent('/dashboard/ajuda')}
              isOpen={ajudaSubmenuOpen}
              onClick={() => setAjudaSubmenuOpen(!ajudaSubmenuOpen)}
              icon={<HelpCircle />}
              tooltip="Documentação e suporte"
            >
              <SidebarLink
                href="/dashboard/ajuda/docs"
                icon={<FileText size={18} />}
                text="Documentação"
                isActive={isActive('/dashboard/ajuda/docs')}
              />
              <SidebarLink
                href="/dashboard/ajuda/bugs"
                icon={<Bug size={18} />}
                text="Reportar Bug"
                isActive={isActive('/dashboard/ajuda/bugs')}
              />
              <SidebarLink
                href="/dashboard/ajuda/bugs/listar"
                icon={<Bug size={18} />}
                text="Listar Bugs"
                isActive={isActive('/dashboard/ajuda/bugs/listar')}
              />
            </SidebarSubmenu>
          </SidebarCategory>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t">
          <div className="mb-2 px-3 text-xs text-gray-500">
            Logado como: <span className="font-medium">{profile?.role || 'Não autenticado'}</span>
          </div>
          <button
            onClick={signOut}
            className="flex items-center w-full p-3 text-sm text-red-600 rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-6 h-6 mr-2" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b">
          <button
            className="p-2 rounded-md lg:hidden"
            onClick={toggleSidebar}
          >
            <Menu size={24} />
          </button>
          <div className="text-lg font-bold lg:hidden">Nmalls</div>
          <div className="flex items-center">
            <span className="text-sm">{profile?.name || 'Usuário'}</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
} 