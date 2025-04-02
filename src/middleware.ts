import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  // Rotas que não precisam de autenticação
  const publicRoutes = [
    '/login',
    '/register',
    '/api/auth',
    '/api/demo-login',
    '/api/setup-demo',
    '/_next',
    '/favicon.ico',
    '/logo.png',
    '/assets',
  ];

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  try {
    // Configuração cliente Supabase para middleware
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rnqdwjslfoxtdchxzgfr.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucWR3anNsZm94dGRjaHh6Z2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MjYwNDUsImV4cCI6MjA1OTAwMjA0NX0.xsvV72Gb8GVFcLMdMBwjn93WXZdXxNvS3ozfrgrnpbI';
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verificar sessão do usuário
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar sessão no middleware:', error.message);
      // Em caso de erro na verificação, permitir o redirecionamento
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', request.nextUrl.pathname);
      url.searchParams.set('error', 'Erro na verificação de autenticação');
      return NextResponse.redirect(url);
    }

    // Redirecionar para login se não estiver autenticado
    if (!data.session) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Se chegou aqui, está autenticado
    return NextResponse.next();
  } catch (error) {
    console.error('Erro na verificação de autenticação:', error);
    // Tratamento de erro não bloqueante para evitar loops
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.log('Redirecionando para login devido a erro:', message);
    
    const url = new URL('/login', request.url);
    url.searchParams.set('error', encodeURIComponent(message));
    return NextResponse.redirect(url);
  }
}

// Configuração de quais rotas o middleware deve executar
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|assets).*)',
  ],
}; 