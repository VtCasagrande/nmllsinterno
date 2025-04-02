'use client';

import React, { useState, useEffect } from 'react';
import { Search, User, Bell, Menu, AlertCircle } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { AppIcon } from '@/components/AppIcon';
import { AppCategory } from '@/components/AppCategory';
import { 
  appModules, 
  appCategories, 
  getModulesByCategory, 
  filterModulesByRole 
} from '@/utils/appRegistry';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredModules, setFilteredModules] = useState(appModules);
  
  // Tentar usar o contexto de favoritos com tratamento de erro
  let favorites: string[] = [];
  let toggleFavorite: (id: string) => void = () => {};
  let isFavorite: (id: string) => boolean = () => false;
  
  try {
    // Importação dinâmica do contexto de favoritos para evitar erros de renderização
    const { useFavorites } = require('@/contexts/FavoritesContext');
    const favoritesContext = useFavorites();
    favorites = favoritesContext.favorites || [];
    toggleFavorite = favoritesContext.toggleFavorite || (() => {});
    isFavorite = favoritesContext.isFavorite || (() => false);
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
      <div className="container mx-auto pb-16">
        {/* Cabeçalho */}
        <header className="flex justify-between items-center py-4 px-4 md:px-0">
          <div className="flex items-center">
            <Menu className="md:hidden w-5 h-5 mr-3" />
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
          </div>
        </header>

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
          <AppCategory title="Favoritos" className="mb-8">
            {userFavorites.map((app) => (
              <AppIcon
                key={app.id}
                href={app.href}
                icon={app.icon}
                label={app.name}
                color={app.color}
                isFavorite={isFavorite(app.id)}
                onToggleFavorite={handleToggleFavorite(app.id)}
              />
            ))}
          </AppCategory>
        )}
        
        {/* Aplicativos filtrados pela pesquisa */}
        {searchTerm && (
          <AppCategory title="Resultados da Pesquisa">
            {filteredModules.length > 0 ? (
              filterModulesByRole(filteredModules, profile?.role).map((app) => (
                <AppIcon
                  key={app.id}
                  href={app.href}
                  icon={app.icon}
                  label={app.name}
                  color={app.color}
                  isFavorite={isFavorite(app.id)}
                  onToggleFavorite={handleToggleFavorite(app.id)}
                />
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
                <AppIcon
                  key={app.id}
                  href={app.href}
                  icon={app.icon}
                  label={app.name}
                  color={app.color}
                  isFavorite={isFavorite(app.id)}
                  onToggleFavorite={handleToggleFavorite(app.id)}
                />
              ))}
            </AppCategory>
          );
        })}
      </div>
    </ProtectedRoute>
  );
} 