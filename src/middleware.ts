import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  // Rotas que não precisam de autenticação
  const publicRoutes = [
    '/login',
    '/register',
    '/api/auth',
    '/api/users',
    '/api/demo-login',
    '/api/setup-demo',
    '/_next',
    '/favicon.ico',
    '/logo.png',
    '/assets',
    '/redirect-to-dashboard'
  ];

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    console.log('Rota pública detectada, permitindo acesso:', request.nextUrl.pathname);
    return NextResponse.next();
  }

  // Verificar parâmetros especiais na URL para prevenir loops e facilitar testes
  const authLoop = request.nextUrl.searchParams.get('_auth_loop');
  const authChecked = request.nextUrl.searchParams.get('_auth_checked');
  const authBypass = request.nextUrl.searchParams.get('_auth_bypass');
  const authVerified = request.nextUrl.searchParams.get('_auth_verified');
  
  // Se qualquer um dos parâmetros especiais for detectado, permitir acesso
  if (authLoop || authChecked || authBypass || authVerified) {
    console.log('Parâmetro especial detectado, permitindo acesso:', { 
      authLoop, authChecked, authBypass, authVerified 
    });
    return NextResponse.next();
  }

  try {
    // Criar resposta com os mesmos cabeçalhos e cookies
    const res = NextResponse.next();
    
    // Criar cliente do Supabase para middleware, que gerencia cookies automaticamente
    const supabase = createMiddlewareClient<SupabaseClient>({ req: request, res });
    
    // Obter a sessão atual e atualizar cookies
    const { data: { session } } = await supabase.auth.getSession();
    
    // Se não houver sessão, redirecionar para a página de login
    if (!session) {
      console.log('Sessão não encontrada, redirecionando para login. URL atual:', request.nextUrl.pathname);
      
      // Criar URL de redirecionamento com parâmetro de destino
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
      redirectUrl.searchParams.set('_auth_checked', '1'); // Prevenir loops
      
      return NextResponse.redirect(redirectUrl);
    }
    
    // Se chegou aqui, o usuário está autenticado
    console.log('Usuário autenticado, permitindo acesso a:', request.nextUrl.pathname, 'User ID:', session.user.id);
    
    // Retorna a resposta modificada que inclui os cookies de sessão atualizados
    return res;
  } catch (error) {
    console.error('Erro na verificação de autenticação:', error);
    
    // Em caso de erro, redirecionar para login com flag para evitar loops
    const redirectUrl = new URL('/login', request.url);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    redirectUrl.searchParams.set('error', encodeURIComponent(errorMessage));
    redirectUrl.searchParams.set('_auth_loop', '1'); // Flag para evitar loops
    
    return NextResponse.redirect(redirectUrl);
  }
}

// Configuração de quais rotas o middleware deve executar
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|assets).*)',
  ],
}; 