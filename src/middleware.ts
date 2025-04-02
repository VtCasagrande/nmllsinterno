import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  // Rotas que não precisam de autenticação
  const publicRoutes = [
    '/login',
    '/api/auth/login',
    '/api/auth/logout',
    '/_next', // Arquivos estáticos
    '/favicon.ico',
  ];

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Verificar sessão do usuário
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rnqdwjslfoxtdchxzgfr.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucWR3anNsZm94dGRjaHh6Z2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI2OTEyNzksImV4cCI6MjAyODI2NzI3OX0.2FHLJu1LHxuVCCr1FiSq_e6YcfDUH0KaaSNa_L7wnQA'
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Redirecionar para login se não estiver autenticado
  if (!session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configuração de quais rotas o middleware deve executar
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 