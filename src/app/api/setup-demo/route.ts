import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Verificando se o usuário já existe
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@nmalls.com')
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ 
        message: 'Usuário de demonstração já existe', 
        user: existingUser 
      });
    }

    // Criar usuário de demonstração
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@nmalls.com',
      password: 'senha123',
      email_confirm: true,
      user_metadata: {
        name: 'Administrador'
      }
    });

    if (authError) {
      // Tentar com signUp em vez de admin.createUser (para ambientes sem acesso admin)
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: 'admin@nmalls.com',
        password: 'senha123',
        options: {
          data: {
            name: 'Administrador'
          }
        }
      });

      if (signupError) {
        return NextResponse.json({ error: signupError.message }, { status: 500 });
      }

      // Criar perfil para o usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signupData.user?.id,
          name: 'Administrador',
          role: 'admin',
          email: 'admin@nmalls.com',
          phone: '11999999999'
        });

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Usuário de demonstração criado com signUp', 
        user: signupData.user 
      });
    }

    // Se o admin.createUser funcionou, criar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user?.id,
        name: 'Administrador',
        role: 'admin',
        email: 'admin@nmalls.com',
        phone: '11999999999'
      });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Usuário de demonstração criado', 
      user: authData.user 
    });
    
  } catch (error: any) {
    console.error('Erro ao configurar demo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 