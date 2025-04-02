import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface FavoritesContextProps {
  favorites: string[];
  toggleFavorite: (appId: string) => void;
  isFavorite: (appId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextProps | null>(null);

interface FavoritesProviderProps {
  children: React.ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { profile } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Carrega os favoritos do localStorage ao iniciar
  useEffect(() => {
    if (profile?.id) {
      const storedFavorites = localStorage.getItem(`favorites-${profile.id}`);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    }
  }, [profile?.id]);
  
  // Salva os favoritos no localStorage quando mudam
  useEffect(() => {
    if (profile?.id && favorites.length > 0) {
      localStorage.setItem(`favorites-${profile.id}`, JSON.stringify(favorites));
    }
  }, [favorites, profile?.id]);
  
  // Função para alternar um app como favorito
  const toggleFavorite = (appId: string) => {
    setFavorites(prevFavorites => {
      if (prevFavorites.includes(appId)) {
        return prevFavorites.filter(id => id !== appId);
      } else {
        return [...prevFavorites, appId];
      }
    });
  };
  
  // Verifica se um app é favorito
  const isFavorite = (appId: string) => favorites.includes(appId);
  
  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites deve ser usado dentro de um FavoritesProvider');
  }
  return context;
} 