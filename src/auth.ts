// Função de autenticação simplificada para desenvolvimento
export async function auth() {
  return {
    user: {
      id: '123456',
      email: 'usuario@teste.com',
      name: 'Usuário Teste',
      role: 'admin'
    }
  };
} 