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

export default function DashboardPage() {
  const { profile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredModules, setFilteredModules] = useState(appModules);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  
  // Tentar usar o contexto de favoritos com tratamento de erro
  let favorites: string[] = [];
  let toggleFavorite: (id: string) => void = () => {};
  let isFavorite: (id: string) => boolean = () => false;
  let favoritesLoading = false;
  
  try {
    // Importação dinâmica do contexto de favoritos para evitar erros de renderização
    const { useFavorites } = require('@/contexts/FavoritesContext');
    const favoritesContext = useFavorites();
    favorites = favoritesContext.favorites || [];
    toggleFavorite = favoritesContext.toggleFavorite || (() => {});
    isFavorite = favoritesContext.isFavorite || (() => false);
    favoritesLoading = favoritesContext.isLoading || false;
  } catch (err) {
    console.error('Erro ao carregar contexto de favoritos:', err);
    setError('Não foi possível carregar os favoritos. Tente recarregar a página.');
  }

  // Verificar se o contexto de favoritos está disponível
  useEffect(() => {
    try {
      console.log('Verificando contexto de autenticação:', profile);
      setIsLoading(false);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError('Erro ao carregar o dashboard. Tente recarregar a página.');
      setIsLoading(false);
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
      toggleFavorite(id);
    } catch (err) {
      console.error('Erro ao alternar favorito:', err);
      setError('Não foi possível atualizar os favoritos.');
    }
  };
  
  // Função para mostrar o menu de um módulo
  const handleShowMenu = (moduleId: string) => () => {
    setSelectedModule(moduleId);
  };
  
  // Função para fechar o menu
  const handleCloseMenu = () => {
    setSelectedModule(null);
  };
  
  // Obter o módulo selecionado e suas ações
  const selectedModuleData = selectedModule ? getModuleById(selectedModule) : null;
  const selectedModuleActions = selectedModuleData?.actions || [];

  // Renderiza a versão antiga do dashboard em caso de erro
  if (error) {
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

  return (
    <ProtectedRoute>
      <div className="container mx-auto pb-16 pt-4">
        {/* Barra de pesquisa */}
        <div className="px-4 md:px-0 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Pesquisar aplicativos..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Favoritos */}
        {userFavorites.length > 0 && !searchTerm && (
          <AppCategory title={
            <div className="flex items-center">
              <span>Favoritos</span>
              {favoritesLoading && (
                <div className="ml-2 w-4 h-4 rounded-full border-2 border-t-transparent border-blue-500 animate-spin"></div>
              )}
            </div>
          } className="mb-8">
            {userFavorites.map((app) => (
              <div key={app.id} className="flex flex-col">
                <AppIcon
                  key={app.id}
                  href={app.href}
                  icon={app.icon}
                  label={app.name}
                  color={app.color}
                  isFavorite={isFavorite(app.id)}
                  onToggleFavorite={handleToggleFavorite(app.id)}
                  showMenu={app.actions && app.actions.length > 0 ? handleShowMenu(app.id) : undefined}
                />
              </div>
            ))}
          </AppCategory>
        )}
        
        {/* Aplicativos filtrados pela pesquisa */}
        {searchTerm && (
          <AppCategory title="Resultados da Pesquisa">
            {filteredModules.length > 0 ? (
              filterModulesByRole(filteredModules, profile?.role).map((app) => (
                <div key={app.id} className="flex flex-col">
                  <AppIcon
                    key={app.id}
                    href={app.href}
                    icon={app.icon}
                    label={app.name}
                    color={app.color}
                    isFavorite={isFavorite(app.id)}
                    onToggleFavorite={handleToggleFavorite(app.id)}
                    showMenu={app.actions && app.actions.length > 0 ? handleShowMenu(app.id) : undefined}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full py-4 text-center text-gray-500">
                Nenhum aplicativo encontrado para "{searchTerm}"
              </div>
            )}
          </AppCategory>
        )}
        
        {/* Aplicativos por categoria */}
        {!searchTerm && appCategories.map((category) => {
          const categoryModules = getAccessibleModulesByCategory(category.id);
          if (categoryModules.length === 0) return null;
          
          return (
            <AppCategory key={category.id} title={category.name}>
              {categoryModules.map((app) => (
                <div key={app.id} className="flex flex-col relative">
                  <AppIcon
                    key={app.id}
                    href={app.href}
                    icon={app.icon}
                    label={app.name}
                    color={app.color}
                    isFavorite={isFavorite(app.id)}
                    onToggleFavorite={handleToggleFavorite(app.id)}
                    showMenu={app.actions && app.actions.length > 0 ? handleShowMenu(app.id) : undefined}
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