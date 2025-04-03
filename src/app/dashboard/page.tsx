'use client';

import React, { useState, useEffect } from 'react';
import { Search, User, Bell, Menu, AlertCircle, Plus, ChevronRight } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { AppIcon } from '@/components/AppIcon';
import { AppCategory } from '@/components/AppCategory';
import AppMenu from '@/components/AppMenu';
import { 
  appModules, 
  appCategories, 
  getModulesByCategory, 
  filterModulesByRole,
  getModuleActions,
  getModuleById
} from '@/utils/appRegistry';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Função de log melhorada para exibir no console
const logDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 📊 DASHBOARD DEBUG: ${message}`, data);
  } else {
    console.log(`[${timestamp}] 📊 DASHBOARD DEBUG: ${message}`);
  }
};

// Função de log de erro melhorada
const logError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ DASHBOARD ERROR: ${message}`, error);
};

export default function DashboardPage() {
  logDebug('Renderizando Dashboard');

  // Hooks e estado
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, loading: authLoading, session } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredModules, setFilteredModules] = useState(appModules);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const router = useRouter();

  // Verificar sessão e autenticação ao carregar o dashboard
  useEffect(() => {
    const verifyAuthState = async () => {
      try {
        logDebug('Verificando estado de autenticação no dashboard');
        
        // Se o contexto ainda está carregando, aguardar
        if (authLoading) {
          logDebug('Contexto de autenticação ainda carregando, aguardando...');
          return;
        }
        
        // Se já temos perfil e sessão, considerar autenticado
        if (profile && session) {
          logDebug('Usuário autenticado com perfil:', {
            userId: profile.id,
            role: profile.role,
            name: profile.name
          });
          setIsLoading(false);
          return;
        }
        
        // Se não temos sessão no AuthContext, verificar diretamente
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logError('Erro ao verificar sessão no dashboard', sessionError);
          throw new Error('Falha ao verificar autenticação');
        }
        
        if (!data.session) {
          logDebug('Sem sessão válida no dashboard, redirecionando para login');
          router.push('/login');
          return;
        }
        
        // Temos sessão, verificar se temos um perfil para este usuário
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          logError('Erro ao verificar perfil do usuário', profileError);
          throw new Error('Falha ao verificar perfil');
        }
        
        if (profileData) {
          logDebug('Perfil do usuário encontrado diretamente:', profileData);
          setIsLoading(false);
          return;
        }
        
        // Sem perfil, mas com sessão - situação menos comum
        logDebug('Sessão encontrada, mas sem perfil. Mostrando dashboard limitado');
        setIsLoading(false);
      } catch (err) {
        logError('Erro ao verificar autenticação no dashboard:', err);
        setError('Não foi possível carregar o dashboard. Verifique sua conexão.');
        setIsLoading(false);
      }
    };
    
    verifyAuthState();
  }, [authLoading, profile, session, router]);

  // Verificar se o contexto de favoritos está disponível
  useEffect(() => {
    try {
      logDebug('Verificando contexto de favoritos disponível');
      // Iniciar carregamento de favoritos se necessário...
    } catch (err) {
      logError('Erro ao inicializar contexto de favoritos:', err);
    }
  }, [profile]);

  // Filtra os módulos quando o termo de busca muda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredModules(appModules);
      return;
    }

    const lowercaseTerm = searchTerm.toLowerCase();
    const filtered = appModules.filter(
      module => 
        module.name.toLowerCase().includes(lowercaseTerm) || 
        module.description.toLowerCase().includes(lowercaseTerm)
    );
    
    logDebug(`Pesquisa: ${searchTerm} - ${filtered.length} resultados`);
    setFilteredModules(filtered);
  }, [searchTerm]);

  // Filtra os favoritos baseado na role do usuário
  const userFavorites = filterModulesByRole(
    appModules.filter(module => favorites.includes(module.id)),
    profile?.role
  );

  // Filtra os módulos por categoria e role
  const getAccessibleModulesByCategory = (categoryId: string) => {
    return filterModulesByRole(
      getModulesByCategory(categoryId),
      profile?.role
    );
  };

  const handleToggleFavorite = (id: string) => (e: React.MouseEvent) => {
    try {
      logDebug(`Alterando favorito: ${id}`);
      toggleFavorite(id);
    } catch (err) {
      logError('Erro ao alternar favorito:', err);
      setError('Não foi possível atualizar os favoritos.');
    }
  };
  
  // Função para mostrar o menu de um módulo
  const handleShowMenu = (moduleId: string) => () => {
    logDebug(`Mostrando menu para: ${moduleId}`);
    setSelectedModule(moduleId);
  };
  
  // Função para fechar o menu
  const handleCloseMenu = () => {
    logDebug('Fechando menu');
    setSelectedModule(null);
  };
  
  // Obter o módulo selecionado e suas ações
  const selectedModuleData = selectedModule ? getModuleById(selectedModule) : null;
  const selectedModuleActions = selectedModuleData?.actions || [];

  // Renderiza a versão antiga do dashboard em caso de erro
  if (error) {
    logError('Renderizando dashboard com erro:', error);
    return (
      <ProtectedRoute>
        <div className="space-y-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-2" />
              <p className="text-red-700">Erro ao carregar a nova interface: {error}</p>
            </div>
            <p className="text-sm text-red-600 mt-1">Mostrando interface alternativa.</p>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-500 mt-1">Bem-vindo ao sistema de gestão da Nmalls</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (isLoading) {
    logDebug('Renderizando loading state do dashboard');
    return (
      <ProtectedRoute>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  logDebug('Renderizando dashboard completo');
  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Mensagem de boas-vindas e cabeçalho */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {profile?.name 
              ? `Bem-vindo, ${profile.name}`
              : 'Bem-vindo ao sistema de gestão da Nmalls'}
          </p>
        </div>

        {/* Barra de pesquisa */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Buscar aplicativos e recursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Favoritos */}
        {userFavorites.length > 0 && (
          <AppCategory title="Favoritos" className="mb-6">
            {userFavorites.map(module => (
              <div key={module.id} className="relative">
                <AppIcon
                  href={module.href}
                  icon={module.icon}
                  label={module.name}
                  color={module.color}
                  isFavorite={true}
                  onToggleFavorite={handleToggleFavorite(module.id)}
                  showMenu={handleShowMenu(module.id)}
                />
              </div>
            ))}
          </AppCategory>
        )}

        {/* Seções por categoria */}
        {appCategories.map(category => {
          const categoryModules = getAccessibleModulesByCategory(category.id);
          if (categoryModules.length === 0) return null;
          
          return (
            <AppCategory key={category.id} title={category.name} className="mb-6">
              {categoryModules.map(module => (
                <div key={module.id} className="relative">
                  <AppIcon
                    href={module.href}
                    icon={module.icon}
                    label={module.name}
                    color={module.color}
                    isFavorite={favorites.includes(module.id)}
                    onToggleFavorite={handleToggleFavorite(module.id)}
                    showMenu={handleShowMenu(module.id)}
                  />
                </div>
              ))}
            </AppCategory>
          );
        })}
        
        {/* Menu popup para ações do módulo */}
        {selectedModuleData && (
          <AppMenu
            isOpen={!!selectedModule}
            onClose={handleCloseMenu}
            title={selectedModuleData.name}
            moduleId={selectedModuleData.id}
            actions={selectedModuleActions}
            mainHref={selectedModuleData.href}
          />
        )}
      </div>
    </ProtectedRoute>
  );
} 