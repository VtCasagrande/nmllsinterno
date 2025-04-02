import { NextResponse } from 'next/server';
import { supabase, logAction } from '@/lib/supabase';

export async function GET() {
  try {
    // Dados do usuário de demonstração
    const demoEmail = 'demo@nmalls.com';
    const demoPassword = 'demo123';
    const demoName = 'Usuário Demo';
    
    console.log(`Iniciando processo de login demo para ${demoEmail}`);
    
    // Verificar se estamos em processo de build
    const isBuildTime = process.env.NODE_ENV === 'production' && typeof window === 'undefined';
    if (isBuildTime) {
      console.log('Processo identificado como build time, retornando resposta simulada');
      return NextResponse.json({ 
        message: 'Resposta simulada para build time',
        success: true 
      });
    }
    
    // Tentar fazer login direto primeiro (a maneira mais rápida se tudo estiver ok)
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });
    
    if (!loginError && loginData.session) {
      console.log('Login com usuário existente bem-sucedido');
      try {
        await logAction('login', 'Login realizado pelo usuário de demonstração', 'auth');
      } catch (logError) {
        console.error('Erro ao registrar log:', logError);
      }
      
      return NextResponse.json({ 
        message: 'Login de demonstração realizado com sucesso', 
        session: loginData.session 
      });
    }
    
    console.log('Login falhou, criando novo usuário demo');
    
    // Como o login falhou, assumimos que precisamos criar um novo usuário
    // Não há forma fácil de verificar se o usuário existe sem acesso admin
    // Então vamos tentar criar e lidar com erros
    
    // Criar novo usuário de demonstração
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: demoEmail,
      password: demoPassword,
      options: {
        data: {
          name: demoName
        }
      }
    });
    
    if (signupError) {
      console.error('Erro ao criar usuário demo:', signupError.message);
      
      // Se o erro for de "User already registered", podemos tentar usar ainda o login
      if (signupError.message.includes('already registered')) {
        console.log('Usuário já existe, tentando usar diretamente');
        
        return NextResponse.json({ 
          error: "Usuário de demonstração já existe. Utilize as credenciais na página de login.",
          details: "Email: demo@nmalls.com, Senha: demo123"
        }, { status: 409 });
      }
      
      return NextResponse.json({ 
        error: signupError.message,
        details: "Tente usar o login normal com email: demo@nmalls.com, senha: demo123"
      }, { status: 500 });
    }
    
    if (!signupData.user) {
      console.error('Falha ao criar usuário demo - nenhum usuário retornado');
      return NextResponse.json({ 
        error: 'Falha ao criar usuário', 
        details: "Tente usar o login normal com email: demo@nmalls.com, senha: demo123"
      }, { status: 500 });
    }
    
    console.log('Usuário demo criado, criando perfil');
    
    // Criar perfil para o usuário demo
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: signupData.user.id,
        name: demoName,
        role: 'admin',
        phone: null
      });
    
    if (profileError) {
      console.error('Erro ao criar perfil demo:', profileError.message);
      // Continua mesmo com erro no perfil
    }
    
    console.log('Perfil demo criado, fazendo login');
    
    // Login com o usuário recém-criado
    const { data: newLoginData, error: newLoginError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });
    
    if (newLoginError) {
      console.error('Erro ao fazer login com novo usuário demo:', newLoginError.message);
      return NextResponse.json({ 
        error: newLoginError.message,
        details: "Utilize o login manual com email: demo@nmalls.com, senha: demo123" 
      }, { status: 500 });
    }
    
    try {
      await logAction('login', 'Login realizado pelo usuário de demonstração', 'auth');
    } catch (logError) {
      console.error('Erro ao registrar log:', logError);
    }
    
    return NextResponse.json({ 
      message: 'Usuário de demonstração criado e logado', 
      session: newLoginData.session 
    });
  } catch (error: any) {
    console.error('Erro geral no login de demonstração:', error);
    return NextResponse.json({ 
      error: error.message,
      details: "Por favor, utilize o login manual na página de login com email: demo@nmalls.com, senha: demo123"
    }, { status: 500 });
  }
} 