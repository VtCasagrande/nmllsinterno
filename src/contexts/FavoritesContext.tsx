import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Função de log melhorada para exibir no console
const logDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ⭐ FAVORITES CONTEXT: ${message}`, data);
  } else {
    console.log(`[${timestamp}] ⭐ FAVORITES CONTEXT: ${message}`);
  }
};

// Função de log de erro melhorada
const logError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ FAVORITES CONTEXT ERROR: ${message}`, error);
};

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
      logDebug(`Buscando favoritos para usuário: ${userId}`);
      
      // Tentar buscar da API
      try {
        const apiUrl = `/api/users/${userId}/favorites`;
        logDebug(`Chamando API: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Erro desconhecido');
          logError(`API respondeu com status ${response.status}: ${errorText}`);
          // Falha na API, não interromper o fluxo, usar fallback
          throw new Error(`API respondeu com status ${response.status}`);
        }
        
        try {
          const data = await response.json();
          logDebug('Favoritos obtidos com sucesso da API:', data);
          return data.favorites || [];
        } catch (jsonError) {
          // Erro ao processar o JSON (possível HTML no lugar de JSON)
          logError('Erro ao processar resposta JSON da API:', jsonError);
          throw new Error('Resposta da API não é um JSON válido');
        }
      } catch (apiError) {
        logError('Erro ao buscar favoritos da API:', apiError);
        
        // Fallback para localStorage se a API falhar
        logDebug('Tentando fallback para localStorage');
        try {
          const storedFavorites = localStorage.getItem(`favorites-${userId}`);
          if (storedFavorites) {
            const parsedFavorites = JSON.parse(storedFavorites);
            logDebug('Favoritos recuperados do localStorage:', parsedFavorites);
            return parsedFavorites;
          }
        } catch (localStorageError) {
          logError('Erro ao acessar localStorage:', localStorageError);
        }
        
        logDebug('Nenhum favorito encontrado no fallback, retornando array vazio');
        return [];
      }
    } catch (error) {
      logError('Erro geral ao buscar favoritos:', error);
      return [];
    }
  },
  
  // Salvar favoritos do usuário
  async saveFavorites(userId: string, favorites: string[]): Promise<boolean> {
    try {
      logDebug(`Salvando favoritos para usuário ${userId}:`, favorites);
      
      // Salvar no localStorage como backup
      localStorage.setItem(`favorites-${userId}`, JSON.stringify(favorites));
      logDebug('Favoritos salvos no localStorage com sucesso');
      
      // Tentar salvar na API
      try {
        const apiUrl = `/api/users/${userId}/favorites`;
        logDebug(`Chamando API (PUT): ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorites })
        });
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Erro desconhecido');
          logError(`API respondeu com status ${response.status} ao salvar: ${errorText}`);
          throw new Error(`API respondeu com status ${response.status}`);
        }
        
        const data = await response.json();
        logDebug('Favoritos salvos com sucesso na API:', data);
        return true;
      } catch (apiError) {
        logError('Erro ao salvar favoritos na API:', apiError);
        // Consideramos que salvar no localStorage já foi suficiente como fallback
        return true;
      }
    } catch (error) {
      logError('Erro geral ao salvar favoritos:', error);
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
      logDebug('Iniciando carregamento de favoritos');
      
      if (!profile?.id) {
        logDebug('Perfil não disponível, limpando favoritos');
        setFavorites([]);
        setIsLoading(false);
        return;
      }
      
      try {
        logDebug(`Carregando favoritos para usuário: ${profile.id}`);
        setIsLoading(true);
        
        // Primeiro tenta carregar do localStorage para feedback rápido
        try {
          const storedFavorites = localStorage.getItem(`favorites-${profile.id}`);
          if (storedFavorites) {
            const parsedFavorites = JSON.parse(storedFavorites);
            logDebug('Favoritos recuperados do localStorage inicialmente:', parsedFavorites);
            setFavorites(parsedFavorites);
          }
        } catch (localError) {
          logError('Erro ao recuperar favoritos do localStorage:', localError);
        }
        
        // Agora tenta carregar da API para ter os dados mais atualizados
        try {
          const userFavorites = await favoritesService.getFavorites(profile.id);
          logDebug(`${userFavorites.length} favoritos carregados com sucesso`);
          setFavorites(userFavorites);
        } catch (apiError) {
          // Não fazer nada, já estamos usando os dados do localStorage
          // ou array vazio como fallback
          logError('Erro ao carregar favoritos da API, continuando com fallback:', apiError);
        }
      } catch (error) {
        logError('Erro ao carregar favoritos do servidor:', error);
        // Em caso de erro crítico, garantir um array vazio para não impactar o login
        setFavorites([]);
      } finally {
        setIsLoading(false);
        logDebug('Carregamento de favoritos finalizado');
      }
    }
    
    loadFavorites();
  }, [profile?.id]);
  
  // Função para alternar um app como favorito
  const toggleFavorite = async (appId: string) => {
    try {
      logDebug(`Alternando favorito: ${appId}`);
      
      if (!profile) {
        logError('Tentativa de alternar favorito sem perfil disponível');
        return;
      }
      
      let newFavorites: string[] = [];
      
      setFavorites(prevFavorites => {
        if (prevFavorites.includes(appId)) {
          logDebug(`Removendo ${appId} dos favoritos`);
          newFavorites = prevFavorites.filter(id => id !== appId);
        } else {
          logDebug(`Adicionando ${appId} aos favoritos`);
          newFavorites = [...prevFavorites, appId];
        }
        
        // Salva imediatamente no estado para feedback instantâneo ao usuário
        return newFavorites;
      });
      
      // Salvar imediatamente no localStorage
      localStorage.setItem(`favorites-${profile.id}`, JSON.stringify(newFavorites));
      
      // Agora salva no servidor/API (assíncrono)
      const saved = await favoritesService.saveFavorites(profile.id, newFavorites);
      
      if (saved) {
        logDebug('Favoritos salvos com sucesso');
      } else {
        logError('Falha ao salvar favoritos');
      }
    } catch (error) {
      logError('Erro ao alternar favorito:', error);
      
      // Em caso de erro, recarrega os favoritos para garantir consistência
      if (profile) {
        logDebug('Recarregando favoritos após erro');
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
      logError('Erro ao verificar se app é favorito:', error);
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