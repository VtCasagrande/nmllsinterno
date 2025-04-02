import { NextRequest, NextResponse } from 'next/server';

// Interface para o banco de dados simulado
interface UserFavorites {
  [userId: string]: string[];  // Mapa de ID do usuário para lista de favoritos
}

// Banco de dados em memória (simulado)
// Em produção, isso seria substituído por um banco de dados real
let userFavoritesDB: UserFavorites = {};

// GET /api/users/[id]/favorites
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    // Validação básica
    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuário não fornecido' },
        { status: 400 }
      );
    }
    
    // Recupera os favoritos do usuário do banco de dados simulado
    const userFavorites = userFavoritesDB[userId] || [];
    
    // Retorna os favoritos do usuário
    return NextResponse.json({ favorites: userFavorites });
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar favoritos' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id]/favorites
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    // Validação básica
    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuário não fornecido' },
        { status: 400 }
      );
    }
    
    // Obtém o corpo da requisição
    const body = await request.json();
    
    // Validação do corpo da requisição
    if (!body || !Array.isArray(body.favorites)) {
      return NextResponse.json(
        { error: 'Formato de dados inválido' },
        { status: 400 }
      );
    }
    
    // Atualiza os favoritos do usuário no banco de dados simulado
    userFavoritesDB[userId] = body.favorites;
    
    // Simula um pequeno atraso para reproduzir o comportamento de um banco de dados real
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Retorna os favoritos atualizados
    return NextResponse.json({ 
      favorites: userFavoritesDB[userId],
      message: 'Favoritos atualizados com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao atualizar favoritos:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar favoritos' },
      { status: 500 }
    );
  }
} 