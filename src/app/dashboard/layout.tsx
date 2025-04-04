'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  AlertTriangle,
  Calendar,
  Database,
  PlusCircle,
  List,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabase';

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  text: string;
  isActive: boolean;
  hasSubmenu?: boolean;
  submenuOpen?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

interface SidebarCategoryProps {
  title: string;
  children: React.ReactNode;
}

interface SidebarSubmenuProps {
  text: string;
  isActive: boolean;
  isOpen: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
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

// Função de log melhorada
const logger = {
  debug: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[${timestamp}] 📋 DASHBOARD LAYOUT: ${message}`, data);
    } else {
      console.log(`[${timestamp}] 📋 DASHBOARD LAYOUT: ${message}`);
    }
  },
  
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ DASHBOARD LAYOUT ERROR: ${message}`, error);
  }
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [entregasSubmenuOpen, setEntregasSubmenuOpen] = useState(false);
  const [admSubmenuOpen, setAdmSubmenuOpen] = useState(false);
  const [modulosSubmenuOpen, setModulosSubmenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [layoutLoaded, setLayoutLoaded] = useState(false);
  
  // Verificar a autenticação quando o componente carregar
  useEffect(() => {
    const checkAuth = async () => {
      logger.debug('Verificando autenticação no layout do dashboard');
      
      try {
        // Verificar se temos sessão diretamente com o Supabase
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          logger.debug('Sem sessão válida no layout do dashboard');
          window.location.href = '/login?redirect=/dashboard';
          return;
        }
        
        logger.debug('Sessão válida encontrada no layout do dashboard', { 
          userId: data.session.user.id 
        });
        
        // Aguardar até que o contexto de autenticação termine de carregar
        if (!authLoading) {
          setIsLoading(false);
          setLayoutLoaded(true);
        }
      } catch (error) {
        logger.error('Erro ao verificar autenticação no layout:', error);
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [authLoading]);
  
  // Toggle do menu lateral
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    logger.debug(`Sidebar ${!sidebarOpen ? 'aberta' : 'fechada'}`);
  };
  
  // Toggle do menu do perfil
  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
    logger.debug(`Menu do perfil ${!profileMenuOpen ? 'aberto' : 'fechado'}`);
  };
  
  // Função para fazer logout
  let signOutHandler = async () => {
    logger.debug('Iniciando logout');
    try {
      if (signOut) {
        await signOut();
        logger.debug('Logout realizado com sucesso');
      } else {
        // Fallback se a função signOut não estiver disponível
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = '/login';
      }
    } catch (error) {
      logger.error('Erro ao fazer logout:', error);
    }
  };
  
  // Verifica se a rota atual está ativa
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };
  
  // Estado de carregamento
  if (isLoading) {
    logger.debug('Renderizando estado de carregamento do layout');
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Nmalls</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-4">Carregando dashboard...</p>
        </div>
      </div>
    );
  }
  
  logger.debug('Renderizando layout completo do dashboard', { layoutLoaded });
  
  // Se estiver carregando, mostrar um loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const [error, setError] = useState<string | null>(null);
  
  // Submenus para cada categoria
  const [devolucoesSubmenuOpen, setDevolucoesSubmenuOpen] = useState(false);
  const [usuariosSubmenuOpen, setUsuariosSubmenuOpen] = useState(false);
  const [configuracoesSubmenuOpen, setConfiguracoesSubmenuOpen] = useState(false);
  const [ajudaSubmenuOpen, setAjudaSubmenuOpen] = useState(false);
  const [medicamentosSubmenuOpen, setMedicamentosSubmenuOpen] = useState(false);
  const [crmSubmenuOpen, setCrmSubmenuOpen] = useState(false);
  const [sugestoesSubmenuOpen, setSugestoesSubmenuOpen] = useState(false);
  const [trocasSubmenuOpen, setTrocasSubmenuOpen] = useState(false);
  const [recorrenciasSubmenuOpen, setRecorrenciasSubmenuOpen] = useState(false);
  const [reembolsosSubmenuOpen, setReembolsosSubmenuOpen] = useState(false);
  const [avisosSubmenuOpen, setAvisosSubmenuOpen] = useState(false);
  const [logsSubmenuOpen, setLogsSubmenuOpen] = useState(false);
  
  // Registrar handler para erros não capturados
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Erro não capturado no layout:', event.error);
      setError('Ocorreu um erro ao renderizar o layout');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

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
              isActive={isActive('/dashboard/entregas')}
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
              isActive={isActive('/dashboard/devolucoes')}
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
            
            <SidebarSubmenu
              text="Trocas Entre Lojas"
              isActive={isActive('/dashboard/trocas')}
              isOpen={trocasSubmenuOpen}
              onClick={() => setTrocasSubmenuOpen(!trocasSubmenuOpen)}
              icon={<Store />}
              tooltip="Gerenciar transferências entre lojas"
            >
              <SidebarLink
                href="/dashboard/trocas"
                icon={<List size={18} />}
                text="Listar Trocas"
                isActive={isActive('/dashboard/trocas')}
              />
              <SidebarLink
                href="/dashboard/trocas/nova"
                icon={<PlusCircle size={18} />}
                text="Nova Troca"
                isActive={isActive('/dashboard/trocas/nova')}
              />
            </SidebarSubmenu>
            
            <SidebarSubmenu
              text="Sugestões de Compras"
              isActive={isActive('/dashboard/sugestoes')}
              isOpen={sugestoesSubmenuOpen}
              onClick={() => setSugestoesSubmenuOpen(!sugestoesSubmenuOpen)}
              icon={<ShoppingCart />}
              tooltip="Recomendações de produtos"
            >
              <SidebarLink
                href="/dashboard/sugestoes"
                icon={<List size={18} />}
                text="Listar Sugestões"
                isActive={isActive('/dashboard/sugestoes')}
              />
              <SidebarLink
                href="/dashboard/sugestoes/novo"
                icon={<PlusCircle size={18} />}
                text="Nova Sugestão"
                isActive={isActive('/dashboard/sugestoes/novo')}
              />
            </SidebarSubmenu>
            
            <SidebarSubmenu
              text="Recorrências"
              isActive={isActive('/dashboard/recorrencias')}
              isOpen={recorrenciasSubmenuOpen}
              onClick={() => setRecorrenciasSubmenuOpen(!recorrenciasSubmenuOpen)}
              icon={<RefreshCw />}
              tooltip="Gerenciar clientes recorrentes"
            >
              <SidebarLink
                href="/dashboard/recorrencias"
                icon={<List size={18} />}
                text="Listar Recorrências"
                isActive={isActive('/dashboard/recorrencias')}
              />
              <SidebarLink
                href="/dashboard/recorrencias/nova"
                icon={<PlusCircle size={18} />}
                text="Nova Recorrência"
                isActive={isActive('/dashboard/recorrencias/nova')}
              />
            </SidebarSubmenu>
          </SidebarCategory>
          
          {/* Gestão */}
          <SidebarCategory title="Gestão">
            <SidebarSubmenu
              text="CRM"
              isActive={isActive('/dashboard/crm')}
              isOpen={crmSubmenuOpen}
              onClick={() => setCrmSubmenuOpen(!crmSubmenuOpen)}
              icon={<PhoneCall />}
              tooltip="Gerenciamento de Relacionamento com Clientes"
            >
              <SidebarLink
                href="/dashboard/crm"
                icon={<User size={18} />}
                text="Atendimentos"
                isActive={isActive('/dashboard/crm')}
              />
              <SidebarLink
                href="/dashboard/crm/calendario"
                icon={<Calendar size={18} />}
                text="Calendário"
                isActive={isActive('/dashboard/crm/calendario')}
              />
            </SidebarSubmenu>
            
            <SidebarSubmenu
              text="Medicamentos"
              isActive={isActive('/dashboard/medicamentos')}
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
          </SidebarCategory>
          
          {/* Financeiro */}
          <SidebarCategory title="Financeiro">
            <SidebarSubmenu
              text="Reembolsos"
              isActive={isActive('/dashboard/reembolsos')}
              isOpen={reembolsosSubmenuOpen}
              onClick={() => setReembolsosSubmenuOpen(!reembolsosSubmenuOpen)}
              icon={<DollarSign />}
              tooltip="Gestão de reembolsos"
            >
              <SidebarLink
                href="/dashboard/reembolsos"
                icon={<List size={18} />}
                text="Listar Reembolsos"
                isActive={isActive('/dashboard/reembolsos')}
              />
              <SidebarLink
                href="/dashboard/reembolsos/novo"
                icon={<PlusCircle size={18} />}
                text="Novo Reembolso"
                isActive={isActive('/dashboard/reembolsos/novo')}
              />
            </SidebarSubmenu>
          </SidebarCategory>
          
          {/* Administração */}
          <SidebarCategory title="Administração">
            <SidebarSubmenu
              text="Usuários"
              isActive={isActive('/dashboard/usuarios')}
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
              text="Logs do Sistema"
              isActive={isActive('/dashboard/logs')}
              isOpen={logsSubmenuOpen}
              onClick={() => setLogsSubmenuOpen(!logsSubmenuOpen)}
              icon={<Database />}
              tooltip="Visualização de logs do sistema"
            >
              <SidebarLink
                href="/dashboard/logs"
                icon={<List size={18} />}
                text="Todos os Logs"
                isActive={isActive('/dashboard/logs')}
              />
              <SidebarLink
                href="/dashboard/logs/erros"
                icon={<AlertCircle size={18} />}
                text="Logs de Erros"
                isActive={isActive('/dashboard/logs/erros')}
              />
            </SidebarSubmenu>
          </SidebarCategory>
          
          {/* Sistema */}
          <SidebarCategory title="Sistema">
            <SidebarSubmenu
              text="Notificações"
              isActive={isActive('/dashboard/avisos')}
              isOpen={avisosSubmenuOpen}
              onClick={() => setAvisosSubmenuOpen(!avisosSubmenuOpen)}
              icon={<BellRing />}
              tooltip="Gerenciar notificações do sistema"
            >
              <SidebarLink
                href="/dashboard/avisos"
                icon={<List size={18} />}
                text="Listar Notificações"
                isActive={isActive('/dashboard/avisos')}
              />
              <SidebarLink
                href="/dashboard/avisos/novo"
                icon={<PlusCircle size={18} />}
                text="Nova Notificação"
                isActive={isActive('/dashboard/avisos/novo')}
              />
            </SidebarSubmenu>

            <SidebarSubmenu
              text="Configurações"
              isActive={isActive('/dashboard/configuracoes')}
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
              isActive={isActive('/dashboard/ajuda')}
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
            onClick={signOutHandler}
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
          {layoutLoaded ? children : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-4">Inicializando conteúdo...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 