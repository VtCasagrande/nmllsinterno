import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface FavoritesContextProps {
  favorites: string[];
  toggleFavorite: (appId: string) => void;
  isFavorite: (appId: string) => boolean;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextProps>({
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false,
  isLoading: false
});

interface FavoritesProviderProps {
  children: React.ReactNode;
}

// Serviço de gerenciamento de favoritos - integrando com API
const favoritesService = {
  // Buscar favoritos do usuário
  async getFavorites(userId: string): Promise<string[]> {
    try {
      // Tentar buscar da API
      try {
        const response = await fetch(`/api/users/${userId}/favorites`);
        if (response.ok) {
          const data = await response.json();
          return data.favorites || [];
        }
      } catch (apiError) {
        console.error('Erro ao buscar favoritos da API:', apiError);
      }
      
      // Fallback para localStorage se a API falhar
      const storedFavorites = localStorage.getItem(`favorites-${userId}`);
      if (storedFavorites) {
        return JSON.parse(storedFavorites);
      }
      return [];
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
      return [];
    }
  },
  
  // Salvar favoritos do usuário
  async saveFavorites(userId: string, favorites: string[]): Promise<boolean> {
    try {
      // Salvar no localStorage como backup
      localStorage.setItem(`favorites-${userId}`, JSON.stringify(favorites));
      
      // Tentar salvar na API
      try {
        const response = await fetch(`/api/users/${userId}/favorites`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorites })
        });
        
        return response.ok;
      } catch (apiError) {
        console.error('Erro ao salvar favoritos na API:', apiError);
        // Consideramos que salvar no localStorage já foi suficiente como fallback
        return true;
      }
    } catch (error) {
      console.error('Erro ao salvar favoritos:', error);
      return false;
    }
  }
};

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { profile } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Carrega os favoritos do servidor/API ao iniciar
  useEffect(() => {
    async function loadFavorites() {
      if (!profile?.id) {
        setFavorites([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        // Carrega os favoritos da API
        const userFavorites = await favoritesService.getFavorites(profile.id);
        setFavorites(userFavorites);
      } catch (error) {
        console.error('Erro ao carregar favoritos do servidor:', error);
        // Em caso de erro, tenta carregar do localStorage
        try {
          const storedFavorites = localStorage.getItem(`favorites-${profile.id}`);
          if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
          }
        } catch (fallbackError) {
          console.error('Erro também no fallback:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    loadFavorites();
  }, [profile?.id]);
  
  // Função para alternar um app como favorito
  const toggleFavorite = async (appId: string) => {
    try {
      if (!profile) return;
      
      let newFavorites: string[] = [];
      
      setFavorites(prevFavorites => {
        if (prevFavorites.includes(appId)) {
          newFavorites = prevFavorites.filter(id => id !== appId);
        } else {
          newFavorites = [...prevFavorites, appId];
        }
        
        // Salva imediatamente no estado para feedback instantâneo ao usuário
        return newFavorites;
      });
      
      // Agora salva no servidor/API (assíncrono)
      await favoritesService.saveFavorites(profile.id, newFavorites);
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      // Em caso de erro, recarrega os favoritos para garantir consistência
      if (profile) {
        const serverFavorites = await favoritesService.getFavorites(profile.id);
        setFavorites(serverFavorites);
      }
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
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
} 