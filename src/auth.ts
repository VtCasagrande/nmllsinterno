import { supabase } from './lib/supabase';

// Função de autenticação para integração com Supabase usando cliente
export async function auth() {
  try {
    // Validar sessão atual
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      console.error('Erro ao validar sessão:', error);
      return null;
    }
    
    // Buscar perfil do usuário
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.session.user.id)
      .single();
    
    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      return null;
    }
    
    return {
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
        name: profileData?.name || data.session.user.email,
        role: profileData?.role || 'user'
      }
    };
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return null;
  }
} 