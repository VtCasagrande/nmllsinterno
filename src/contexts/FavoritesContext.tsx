import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface FavoritesContextProps {
  favorites: string[];
  toggleFavorite: (appId: string) => void;
  isFavorite: (appId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextProps>({
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false
});

interface FavoritesProviderProps {
  children: React.ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { profile } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  
  // Carrega os favoritos do localStorage ao iniciar
  useEffect(() => {
    try {
      if (profile?.id) {
        try {
          const storedFavorites = localStorage.getItem(`favorites-${profile.id}`);
          if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
          }
        } catch (error) {
          console.error('Erro ao carregar favoritos do localStorage:', error);
          // Continua com array vazio em caso de erro
        }
      }
    } catch (error) {
      console.error('Erro ao verificar profile.id:', error);
    } finally {
      setIsReady(true);
    }
  }, [profile?.id]);
  
  // Salva os favoritos no localStorage quando mudam
  useEffect(() => {
    if (!isReady) return;
    
    try {
      if (profile?.id && favorites.length > 0) {
        try {
          localStorage.setItem(`favorites-${profile.id}`, JSON.stringify(favorites));
        } catch (error) {
          console.error('Erro ao salvar favoritos no localStorage:', error);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar condições para salvar favoritos:', error);
    }
  }, [favorites, profile?.id, isReady]);
  
  // Função para alternar um app como favorito
  const toggleFavorite = (appId: string) => {
    try {
      setFavorites(prevFavorites => {
        if (prevFavorites.includes(appId)) {
          return prevFavorites.filter(id => id !== appId);
        } else {
          return [...prevFavorites, appId];
        }
      });
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
    }
  };
  
  // Verifica se um app é favorito
  const isFavorite = (appId: string) => {
    try {
      return favorites.includes(appId);
    } catch (error) {
      console.error('Erro ao verificar se app é favorito:', error);
      return false;
    }
  };
  
  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
} 