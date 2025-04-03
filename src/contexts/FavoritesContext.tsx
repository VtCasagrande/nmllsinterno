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
      
      // Verificar se o userId é válido
      if (!userId) {
        logDebug('ID de usuário inválido, retornando array vazio');
        return [];
      }
      
      // Tentar buscar da API com tratamento de timeout
      try {
        const apiUrl = `/api/users/${userId}/favorites`;
        logDebug(`Chamando API: ${apiUrl}`);
        
        // Criar um timeout para evitar que a requisição bloqueie por muito tempo
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos de timeout
        
        const response = await fetch(apiUrl, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Tratar erro de status HTTP
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Erro desconhecido');
          logError(`API respondeu com status ${response.status}: ${errorText}`);
          throw new Error(`API respondeu com status ${response.status}`);
        }
        
        // Tratar erro de parsing JSON com mais detalhes
        let data;
        try {
          const text = await response.text();
          
          // Log do texto bruto para diagnóstico em caso de erro
          if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
            logError('Resposta HTML detectada em vez de JSON:', text.substring(0, 100));
            throw new Error('Resposta HTML detectada em vez de JSON');
          }
          
          // Tentar fazer o parse do JSON
          data = JSON.parse(text);
          logDebug('Favoritos obtidos com sucesso da API:', data);
          return Array.isArray(data.favorites) ? data.favorites : [];
        } catch (jsonError) {
          logError('Erro ao processar resposta JSON da API:', jsonError);
          throw new Error('Resposta da API não é um JSON válido');
        }
      } catch (apiError) {
        // Falha na API, usar fallback
        logError('Erro ao buscar favoritos da API, usando fallback:', apiError);
        
        try {
          // Tentar obter do localStorage
          const storedFavorites = localStorage.getItem(`favorites-${userId}`);
          if (storedFavorites) {
            const parsedFavorites = JSON.parse(storedFavorites);
            logDebug('Favoritos recuperados do localStorage:', parsedFavorites);
            return Array.isArray(parsedFavorites) ? parsedFavorites : [];
          }
        } catch (localStorageError) {
          logError('Erro ao acessar localStorage:', localStorageError);
        }
        
        // Se tudo falhar, retornar array vazio
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
      // Verificar se o userId é válido
      if (!userId) {
        logError('Tentativa de salvar favoritos com ID inválido');
        return false;
      }
      
      logDebug(`Salvando favoritos para usuário ${userId}:`, favorites);
      
      // Salvar no localStorage como backup imediato
      localStorage.setItem(`favorites-${userId}`, JSON.stringify(favorites));
      logDebug('Favoritos salvos no localStorage com sucesso');
      
      // Tentar salvar na API com tratamento de timeout
      try {
        const apiUrl = `/api/users/${userId}/favorites`;
        logDebug(`Chamando API (PUT): ${apiUrl}`);
        
        // Criar um timeout para evitar que a requisição bloqueie por muito tempo
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos de timeout
        
        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorites }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Erro desconhecido');
          logError(`API respondeu com status ${response.status} ao salvar: ${errorText}`);
          // Não lançar erro, pois já salvamos no localStorage
          return true;
        }
        
        const data = await response.json();
        logDebug('Favoritos salvos com sucesso na API:', data);
        return true;
      } catch (apiError) {
        logError('Erro ao salvar favoritos na API, mas salvos no localStorage:', apiError);
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
  const [isLoading, setIsLoading] = useState(false); // Começar com false para não bloquear o fluxo
  
  // Carrega os favoritos do servidor/API ao iniciar
  useEffect(() => {
    async function loadFavorites() {
      try {
        if (!profile?.id) {
          logDebug('Perfil não disponível, mantendo array de favoritos vazio');
          setFavorites([]);
          return;
        }
        
        logDebug(`Carregando favoritos para usuário: ${profile.id}`);
        setIsLoading(true);
        
        // Carregando com timeout para não bloquear a interface
        setTimeout(async () => {
          try {
            // Primeiro tenta carregar do localStorage para feedback rápido
            try {
              const storedFavorites = localStorage.getItem(`favorites-${profile.id}`);
              if (storedFavorites) {
                const parsedFavorites = JSON.parse(storedFavorites);
                logDebug('Favoritos recuperados do localStorage inicialmente:', parsedFavorites);
                setFavorites(Array.isArray(parsedFavorites) ? parsedFavorites : []);
              }
            } catch (localError) {
              logError('Erro ao recuperar favoritos do localStorage:', localError);
            }
            
            // Agora tenta carregar da API de forma não-bloqueante
            const userFavorites = await favoritesService.getFavorites(profile.id);
            logDebug(`${userFavorites.length} favoritos carregados com sucesso`);
            setFavorites(userFavorites);
          } catch (error) {
            logError('Erro ao carregar favoritos:', error);
            // Não fazer nada em caso de erro, manter os favoritos do localStorage ou array vazio
          } finally {
            setIsLoading(false);
          }
        }, 100); // Atraso pequeno para não bloquear o fluxo
      } catch (error) {
        logError('Erro crítico no carregamento de favoritos:', error);
        setFavorites([]);
        setIsLoading(false);
      }
    }
    
    loadFavorites();
  }, [profile?.id]);
  
  // Função para alternar um app como favorito
  const toggleFavorite = async (appId: string) => {
    try {
      logDebug(`Alternando favorito: ${appId}`);
      
      if (!profile?.id) {
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
        
        // Atualiza estado imediatamente
        return newFavorites;
      });
      
      // Salvar no localStorage imediatamente e na API de forma assíncrona
      localStorage.setItem(`favorites-${profile.id}`, JSON.stringify(newFavorites));
      favoritesService.saveFavorites(profile.id, newFavorites)
        .then(success => {
          if (success) {
            logDebug('Favoritos salvos com sucesso');
          } else {
            logError('Falha ao salvar favoritos na API');
          }
        })
        .catch(error => {
          logError('Erro ao alternar favorito:', error);
        });
    } catch (error) {
      logError('Erro crítico ao alternar favorito:', error);
    }
  };
  
  // Verifica se um app é favorito
  const isFavorite = (appId: string): boolean => {
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