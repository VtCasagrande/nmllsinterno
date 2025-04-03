import { NextRequest, NextResponse } from 'next/server';

// Interface para o banco de dados simulado
interface UserFavorites {
  [id: string]: string[];  // Mapa de ID do usuário para lista de favoritos
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

// Garantir uma resposta de erro bem formatada
function createErrorResponse(message: string, status: number = 500) {
  try {
    return NextResponse.json(
      { error: message, success: false, favorites: [] },
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logError('Erro ao criar resposta de erro:', error);
    // Resposta de fallback em caso de problemas
    return new NextResponse(
      JSON.stringify({ error: message, success: false, favorites: [] }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET /api/users/[id]/favorites
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    logDebug(`Recebida solicitação GET para favoritos do usuário ID: ${id}`);
    
    // Validação básica
    if (!id) {
      logError('ID de usuário não fornecido');
      return createErrorResponse('ID de usuário não fornecido', 400);
    }
    
    // Recupera os favoritos do usuário do banco de dados simulado
    const userFavorites = userFavoritesDB[id] || [];
    logDebug(`Favoritos encontrados para o usuário ${id}:`, userFavorites);
    
    // Retorna os favoritos do usuário com headers explícitos
    return NextResponse.json(
      { favorites: userFavorites, success: true },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logError('Erro ao buscar favoritos:', error);
    return createErrorResponse('Erro ao buscar favoritos');
  }
}

// PUT /api/users/[id]/favorites
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    logDebug(`Recebida solicitação PUT para favoritos do usuário ID: ${id}`);
    
    // Validação básica
    if (!id) {
      logError('ID de usuário não fornecido');
      return createErrorResponse('ID de usuário não fornecido', 400);
    }
    
    // Obtém o corpo da requisição
    let body;
    try {
      body = await request.json();
      logDebug(`Corpo da requisição:`, body);
    } catch (parseError) {
      logError('Erro ao analisar JSON da requisição:', parseError);
      return createErrorResponse('Formato de dados inválido na requisição', 400);
    }
    
    // Validação do corpo da requisição
    if (!body || !Array.isArray(body.favorites)) {
      logError('Formato de dados inválido na requisição:', body);
      return createErrorResponse('Formato de dados inválido', 400);
    }
    
    // Atualiza os favoritos do usuário no banco de dados simulado
    userFavoritesDB[id] = body.favorites;
    logDebug(`Favoritos atualizados para o usuário ${id}:`, userFavoritesDB[id]);
    
    // Simula um pequeno atraso para reproduzir o comportamento de um banco de dados real
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Retorna os favoritos atualizados com headers explícitos
    return NextResponse.json(
      { 
        favorites: userFavoritesDB[id],
        message: 'Favoritos atualizados com sucesso',
        success: true 
      },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logError('Erro ao atualizar favoritos:', error);
    return createErrorResponse('Erro ao atualizar favoritos');
  }
}

// OPTIONS /api/users/[id]/favorites - Para suporte a CORS preflight
export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logDebug(`Recebida solicitação OPTIONS para favoritos do usuário ID: ${params.id}`);
    
    // Retornar cabeçalhos CORS apropriados
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    logError('Erro ao processar OPTIONS:', error);
    return createErrorResponse('Erro interno do servidor');
  }
} 