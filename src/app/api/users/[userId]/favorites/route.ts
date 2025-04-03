import { NextRequest, NextResponse } from 'next/server';

// Interface para o banco de dados simulado
interface UserFavorites {
  [userId: string]: string[];  // Mapa de ID do usuário para lista de favoritos
}

// Função de log melhorada para exibir no console
const logDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 🔖 FAVORITES API: ${message}`, data);
  } else {
    console.log(`[${timestamp}] 🔖 FAVORITES API: ${message}`);
  }
};

// Função de log de erro melhorada
const logError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ FAVORITES API ERROR: ${message}`, error);
};

// Banco de dados em memória (simulado)
// Em produção, isso seria substituído por um banco de dados real
let userFavoritesDB: UserFavorites = {};

// GET /api/users/[userId]/favorites
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    logDebug(`Recebida solicitação GET para favoritos do usuário ID: ${userId}`);
    
    // Validação básica
    if (!userId) {
      logError('ID de usuário não fornecido');
      return NextResponse.json(
        { error: 'ID de usuário não fornecido' },
        { status: 400 }
      );
    }
    
    // Recupera os favoritos do usuário do banco de dados simulado
    const userFavorites = userFavoritesDB[userId] || [];
    logDebug(`Favoritos encontrados para o usuário ${userId}:`, userFavorites);
    
    // Retorna os favoritos do usuário
    return NextResponse.json({ favorites: userFavorites });
  } catch (error) {
    logError('Erro ao buscar favoritos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar favoritos' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[userId]/favorites
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    logDebug(`Recebida solicitação PUT para favoritos do usuário ID: ${userId}`);
    
    // Validação básica
    if (!userId) {
      logError('ID de usuário não fornecido');
      return NextResponse.json(
        { error: 'ID de usuário não fornecido' },
        { status: 400 }
      );
    }
    
    // Obtém o corpo da requisição
    const body = await request.json();
    logDebug(`Corpo da requisição:`, body);
    
    // Validação do corpo da requisição
    if (!body || !Array.isArray(body.favorites)) {
      logError('Formato de dados inválido na requisição:', body);
      return NextResponse.json(
        { error: 'Formato de dados inválido' },
        { status: 400 }
      );
    }
    
    // Atualiza os favoritos do usuário no banco de dados simulado
    userFavoritesDB[userId] = body.favorites;
    logDebug(`Favoritos atualizados para o usuário ${userId}:`, userFavoritesDB[userId]);
    
    // Simula um pequeno atraso para reproduzir o comportamento de um banco de dados real
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Retorna os favoritos atualizados
    return NextResponse.json({ 
      favorites: userFavoritesDB[userId],
      message: 'Favoritos atualizados com sucesso' 
    });
  } catch (error) {
    logError('Erro ao atualizar favoritos:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar favoritos' },
      { status: 500 }
    );
  }
} 