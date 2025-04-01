import { NextRequest, NextResponse } from 'next/server';

// Tipo para handler com autenticação
type AuthenticatedHandler = (
  req: NextRequest,
  context: { params: any; userId: string; userRole?: string }
) => Promise<NextResponse>;

/**
 * Middleware de autenticação para rotas de API
 * @param handler Função de manipulação da requisição
 * @returns Função de handler com autenticação
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest, context: { params: any }) => {
    try {
      // Em uma implementação real, extrairíamos o token da requisição
      // e verificaríamos sua validade com um serviço de autenticação
      
      // Mock para desenvolvimento - considerar todos autenticados com ID fixo
      // Em produção, isso seria substituído por uma verificação real do token
      const userId = "user123"; // Simulando um ID de usuário autenticado
      const userRole = "admin"; // Simulando um papel de usuário
      
      // Executar o handler original com o contexto de autenticação
      return handler(req, { ...context, userId, userRole });
    } catch (error) {
      console.error('Erro de autenticação:', error);
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
  };
} 