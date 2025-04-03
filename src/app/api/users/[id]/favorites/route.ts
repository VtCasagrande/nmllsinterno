import { NextRequest, NextResponse } from 'next/server';

// Banco de dados em memória (simulado)
// Em produção, isso seria substituído por um banco de dados real
const userFavoritesDB: Record<string, string[]> = {};

// Função de log para facilitar o diagnóstico
const logDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 🔖 FAVORITES API: ${message}`, data);
  } else {
    console.log(`[${timestamp}] 🔖 FAVORITES API: ${message}`);
  }
};

/**
 * GET /api/users/[id]/favorites
 * Retorna a lista de favoritos de um usuário
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Registrar a solicitação para debug
    logDebug(`Recebida solicitação GET para favoritos do usuário ID: ${params.id}`);
    
    // Garantir que temos um ID válido
    if (!params.id) {
      return NextResponse.json(
        { error: 'ID de usuário não fornecido', favorites: [] },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Recuperar os favoritos do usuário (ou um array vazio se não houver)
    const favorites = userFavoritesDB[params.id] || [];
    logDebug(`Retornando ${favorites.length} favoritos para o usuário ${params.id}`);
    
    // Retornar os favoritos como JSON
    return NextResponse.json(
      { favorites, success: true },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Registrar o erro, mas ainda retornar um JSON válido
    console.error('Erro ao processar solicitação de favoritos:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor', favorites: [] },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PUT /api/users/[id]/favorites
 * Atualiza a lista de favoritos de um usuário
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Registrar a solicitação para debug
    logDebug(`Recebida solicitação PUT para favoritos do usuário ID: ${params.id}`);
    
    // Garantir que temos um ID válido
    if (!params.id) {
      return NextResponse.json(
        { error: 'ID de usuário não fornecido', favorites: [] },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Analisar o corpo da requisição
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Corpo da requisição inválido', favorites: [] },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validar o corpo da requisição
    if (!body || !Array.isArray(body.favorites)) {
      return NextResponse.json(
        { error: 'Formato inválido. Esperado: { favorites: string[] }', favorites: [] },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Atualizar os favoritos do usuário
    userFavoritesDB[params.id] = body.favorites;
    logDebug(`Atualizados ${body.favorites.length} favoritos para o usuário ${params.id}`);
    
    // Retornar os favoritos atualizados
    return NextResponse.json(
      { 
        favorites: userFavoritesDB[params.id],
        message: 'Favoritos atualizados com sucesso',
        success: true 
      },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Registrar o erro, mas ainda retornar um JSON válido
    console.error('Erro ao processar atualização de favoritos:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor', favorites: [] },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * OPTIONS /api/users/[id]/favorites
 * Suporte para requisições CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    }
  });
} 