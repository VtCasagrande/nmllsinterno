import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  const loopDetection = request.nextUrl.searchParams.get('_auth_loop');
  if (loopDetection) {
    console.warn('Loop de redirecionamento detectado. Permitindo acesso para evitar bloqueio');
    return NextResponse.next();
  }

  try {
    // Configuração cliente Supabase para middleware
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rnqdwjslfoxtdchxzgfr.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucWR3anNsZm94dGRjaHh6Z2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MjYwNDUsImV4cCI6MjA1OTAwMjA0NX0.xsvV72Gb8GVFcLMdMBwjn93WXZdXxNvS3ozfrgrnpbI';
    
    // Criar cliente Supabase com cookies
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: false,
        autoRefreshToken: true,
        storage: {
          getItem: (key) => {
            const cookies = request.cookies.getAll();
            const cookie = cookies.find(c => c.name === key);
            return cookie?.value ?? null;
          },
          setItem: () => {},
          removeItem: () => {}
        }
      }
    });

    // Verificar sessão do usuário
    const authCookie = request.cookies.get('sb-access-token')?.value || 
                       request.cookies.get('sb-refresh-token')?.value ||
                       request.cookies.get('supabase-auth-token')?.value;

    // Se não houver cookie de autenticação, redirecionar para login
    if (!authCookie) {
      console.log('Nenhum cookie de autenticação encontrado, redirecionando para login');
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Tentar obter a sessão do Supabase
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar sessão no middleware:', error.message);
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', request.nextUrl.pathname);
      url.searchParams.set('error', 'Erro na verificação de autenticação');
      return NextResponse.redirect(url);
    }

    // Verificar se a sessão é válida
    if (!data.session) {
      console.log('Sessão inválida ou expirada, redirecionando para login');
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Se chegou aqui, está autenticado
    console.log('Usuário autenticado, permitindo acesso:', data.session.user.id);
    return NextResponse.next();
  } catch (error) {
    console.error('Erro na verificação de autenticação:', error);
    
    // Tratamento de erro não bloqueante para evitar loops
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.log('Redirecionando para login devido a erro:', message);
    
    const url = new URL('/login', request.url);
    url.searchParams.set('error', encodeURIComponent(message));
    // Adicionar flag de loop para evitar redirecionamentos infinitos
    url.searchParams.set('_auth_loop', '1');
    return NextResponse.redirect(url);
  }
}

// Configuração de quais rotas o middleware deve executar
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|assets).*)',
  ],
}; 