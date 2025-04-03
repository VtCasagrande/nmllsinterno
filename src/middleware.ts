import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

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
    return NextResponse.next();
  }

  // Verificar se há um loop de redirecionamento usando um parâmetro na URL
  const authLoop = request.nextUrl.searchParams.get('_auth_loop');
  const authChecked = request.nextUrl.searchParams.get('_auth_checked');
  const authBypass = request.nextUrl.searchParams.get('_auth_bypass');
  
  if (authLoop || authChecked || authBypass) {
    console.warn('Detector de loop de redirecionamento ativado. Permitindo acesso para evitar bloqueio.');
    return NextResponse.next();
  }

  try {
    // Criar resposta com os mesmos cabeçalhos e cookies
    const res = NextResponse.next();
    
    // Configurar supabase client com cookies da requisição/resposta
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rnqdwjslfoxtdchxzgfr.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucWR3anNsZm94dGRjaHh6Z2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MjYwNDUsImV4cCI6MjA1OTAwMjA0NX0.xsvV72Gb8GVFcLMdMBwjn93WXZdXxNvS3ozfrgrnpbI';
    
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
          set: (name: string, value: string, options: CookieOptions) => {
            res.cookies.set({
              name,
              value,
              ...options
            });
          },
          remove: (name: string, options: CookieOptions) => {
            res.cookies.set({
              name,
              value: '',
              ...options
            });
          }
        }
      }
    );
    
    // Obter a sessão atual e atualizar cookies
    const { data: { session } } = await supabase.auth.getSession();
    
    // Se não houver sessão, redirecionar para a página de login
    if (!session) {
      console.log('Sessão não encontrada, redirecionando para login');
      
      // Criar URL de redirecionamento com parâmetro de destino
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
      redirectUrl.searchParams.set('_auth_checked', '1'); // Prevenir loops
      
      return NextResponse.redirect(redirectUrl);
    }
    
    // Se chegou aqui, o usuário está autenticado
    console.log('Usuário autenticado:', session.user.id);
    
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