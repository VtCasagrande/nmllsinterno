'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useAvisos } from '@/contexts/AvisosContext';
import { useAuth } from '@/contexts/AuthContext';
import { AvisoInput, AvisoStatus, AvisoPrioridade, TipoDestinatario } from '@/types/avisos';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function NovoAvisoPage() {
  const router = useRouter();
  const { createAviso } = useAvisos();
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AvisoInput>({
    titulo: '',
    conteudo: '',
    tipoDestinatario: TipoDestinatario.TODOS,
    prioridade: AvisoPrioridade.NORMAL,
    status: AvisoStatus.ATIVO,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<{ id: string; nome: string; papel: string; }[]>([]);
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<string[]>([]);
  const [gruposDisponiveis, setGruposDisponiveis] = useState<{ id: string; nome: string; }[]>([
    { id: 'motoristas', nome: 'Motoristas' },
    { id: 'operadores', nome: 'Operadores' },
    { id: 'gerentes', nome: 'Gerentes' },
    { id: 'admins', nome: 'Administradores' }
  ]);
  const [gruposSelecionados, setGruposSelecionados] = useState<string[]>([]);
  
  // Carregar usuários para seleção
  useEffect(() => {
    // Dados de exemplo - Em produção, buscar da API
    const USUARIOS_MOCK = [
      { id: 'user1', nome: 'João Silva', papel: 'operador' },
      { id: 'user2', nome: 'Maria Oliveira', papel: 'motorista' },
      { id: 'user3', nome: 'Pedro Santos', papel: 'gerente' },
      { id: 'user4', nome: 'Ana Costa', papel: 'operador' },
      { id: 'user5', nome: 'Carlos Ferreira', papel: 'motorista' },
      { id: 'admin', nome: 'Administrador', papel: 'admin' },
    ];
    
    setUsuariosDisponiveis(USUARIOS_MOCK);
  }, []);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Se o campo é tipoDestinatario, limpar as seleções de usuários e grupos
    if (name === 'tipoDestinatario') {
      setUsuariosSelecionados([]);
      setGruposSelecionados([]);
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Limpa erro do campo quando o usuário começa a digitar
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleUsuarioChange = (id: string) => {
    setUsuariosSelecionados(prev => {
      if (prev.includes(id)) {
        return prev.filter(userId => userId !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  const handleGrupoChange = (id: string) => {
    setGruposSelecionados(prev => {
      if (prev.includes(id)) {
        return prev.filter(groupId => groupId !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  const validarFormulario = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }
    
    if (!formData.conteudo.trim()) {
      newErrors.conteudo = 'Conteúdo é obrigatório';
    }
    
    if (formData.tipoDestinatario === TipoDestinatario.USUARIOS && usuariosSelecionados.length === 0) {
      newErrors.usuarios = 'Selecione pelo menos um usuário';
    }
    
    if (formData.tipoDestinatario === TipoDestinatario.GRUPO && gruposSelecionados.length === 0) {
      newErrors.grupos = 'Selecione pelo menos um grupo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Preparar dados para API
      const dadosParaEnviar: AvisoInput = {
        ...formData
      };
      
      // Adicionar dados específicos por tipo de destinatário
      if (formData.tipoDestinatario === TipoDestinatario.USUARIOS) {
        dadosParaEnviar.usuarios = usuariosSelecionados;
      } else if (formData.tipoDestinatario === TipoDestinatario.GRUPO) {
        dadosParaEnviar.grupos = gruposSelecionados;
      }
      
      // Enviar para API
      await createAviso(dadosParaEnviar);
      
      toast.success('Aviso criado com sucesso!');
      router.push('/dashboard/avisos');
    } catch (error) {
      console.error('Erro ao criar aviso:', error);
      toast.error('Erro ao criar aviso. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ProtectedRoute allowedRoles={['admin', 'gerente']}>
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/dashboard/avisos" className="text-blue-600 hover:text-blue-800">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Novo Aviso</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título do Aviso */}
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.titulo ? 'border-red-500' : 'border-gray-300'}`}
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Ex: Manutenção Programada do Sistema"
              />
              {errors.titulo && <p className="mt-1 text-sm text-red-600">{errors.titulo}</p>}
            </div>
            
            {/* Conteúdo do Aviso */}
            <div>
              <label htmlFor="conteudo" className="block text-sm font-medium text-gray-700 mb-1">
                Conteúdo <span className="text-red-500">*</span>
              </label>
              <textarea
                id="conteudo"
                name="conteudo"
                rows={5}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.conteudo ? 'border-red-500' : 'border-gray-300'}`}
                value={formData.conteudo}
                onChange={handleChange}
                placeholder="Digite o conteúdo detalhado do aviso..."
              />
              {errors.conteudo && <p className="mt-1 text-sm text-red-600">{errors.conteudo}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prioridade */}
              <div>
                <label htmlFor="prioridade" className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <select
                  id="prioridade"
                  name="prioridade"
                  className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={formData.prioridade}
                  onChange={handleChange}
                >
                  <option value={AvisoPrioridade.BAIXA}>Baixa</option>
                  <option value={AvisoPrioridade.NORMAL}>Normal</option>
                  <option value={AvisoPrioridade.ALTA}>Alta</option>
                  <option value={AvisoPrioridade.URGENTE}>Urgente</option>
                </select>
              </div>
              
              {/* Data de Expiração (opcional) */}
              <div>
                <label htmlFor="dataExpiracao" className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Expiração <span className="text-sm text-gray-500">(opcional)</span>
                </label>
                <input
                  type="date"
                  id="dataExpiracao"
                  name="dataExpiracao"
                  className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={formData.dataExpiracao || ''}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            {/* Tipo de Destinatário */}
            <div>
              <label htmlFor="tipoDestinatario" className="block text-sm font-medium text-gray-700 mb-1">
                Destinatários
              </label>
              <select
                id="tipoDestinatario"
                name="tipoDestinatario"
                className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.tipoDestinatario}
                onChange={handleChange}
              >
                <option value={TipoDestinatario.TODOS}>Todos os Usuários</option>
                <option value={TipoDestinatario.GRUPO}>Grupos Específicos</option>
                <option value={TipoDestinatario.USUARIOS}>Usuários Específicos</option>
              </select>
            </div>
            
            {/* Seleção de Grupos (quando tipo é GRUPO) */}
            {formData.tipoDestinatario === TipoDestinatario.GRUPO && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione os Grupos <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {gruposDisponiveis.map(grupo => (
                    <div key={grupo.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`grupo-${grupo.id}`}
                        checked={gruposSelecionados.includes(grupo.id)}
                        onChange={() => handleGrupoChange(grupo.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`grupo-${grupo.id}`} className="ml-2 block text-sm text-gray-900">
                        {grupo.nome}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.grupos && <p className="mt-1 text-sm text-red-600">{errors.grupos}</p>}
              </div>
            )}
            
            {/* Seleção de Usuários (quando tipo é USUARIOS) */}
            {formData.tipoDestinatario === TipoDestinatario.USUARIOS && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione os Usuários <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md">
                  {usuariosDisponiveis.map(usuario => (
                    <div key={usuario.id} className="flex items-center p-1 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        id={`usuario-${usuario.id}`}
                        checked={usuariosSelecionados.includes(usuario.id)}
                        onChange={() => handleUsuarioChange(usuario.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`usuario-${usuario.id}`} className="ml-2 block text-sm text-gray-900">
                        {usuario.nome}
                        <span className="ml-1 text-xs text-gray-500">({usuario.papel})</span>
                      </label>
                    </div>
                  ))}
                </div>
                {errors.usuarios && <p className="mt-1 text-sm text-red-600">{errors.usuarios}</p>}
              </div>
            )}
            
            {/* Botões de Ação */}
            <div className="flex justify-end space-x-3 pt-4">
              <Link
                href="/dashboard/avisos"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="inline-block mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                    Publicando...
                  </>
                ) : (
                  'Publicar Aviso'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
} 