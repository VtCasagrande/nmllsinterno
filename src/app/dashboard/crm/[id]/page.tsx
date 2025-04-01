'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCRM } from '@/contexts/CRMContext';
import { StatusCRM, AtendimentoCRM } from '@/types/crm';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  UserPlus, 
  Send, 
  CheckCircle, 
  Plus, 
  X, 
  Calendar,
  RotateCw
} from 'lucide-react';
import Link from 'next/link';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DetalhesAtendimentoPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const { 
    atendimentos, 
    loading, 
    atualizarAtendimento, 
    adicionarComentario, 
    atribuirResponsavel,
    usuariosDisponiveis,
    finalizarECriarNovoAtendimento
  } = useCRM();
  
  const [atendimento, setAtendimento] = useState<AtendimentoCRM | null>(null);
  const [editando, setEditando] = useState(false);
  const [adicionandoComentario, setAdicionandoComentario] = useState(false);
  const [atribuindoResponsavel, setAtribuindoResponsavel] = useState(false);
  
  // Estados para o modal de finalização rápida
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [observacaoFinalizacao, setObservacaoFinalizacao] = useState('');
  const [criarNovoAtendimento, setCriarNovoAtendimento] = useState(true);
  const [modoDataContato, setModoDataContato] = useState<'dias' | 'data'>('dias');
  const [diasParaNovoContato, setDiasParaNovoContato] = useState<number>(7);
  const [dataNovoContato, setDataNovoContato] = useState('');
  
  // Estados para edição
  const [status, setStatus] = useState<StatusCRM>(StatusCRM.EM_ABERTO);
  const [observacoes, setObservacoes] = useState('');
  const [dataProximoContato, setDataProximoContato] = useState('');
  const [novoComentario, setNovoComentario] = useState('');
  const [novoResponsavelId, setNovoResponsavelId] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  
  useEffect(() => {
    if (!loading) {
      const atendimentoEncontrado = atendimentos.find(a => a.id === id);
      if (atendimentoEncontrado) {
        setAtendimento(atendimentoEncontrado);
        setStatus(atendimentoEncontrado.status);
        setObservacoes(atendimentoEncontrado.observacoes || '');
        
        if (atendimentoEncontrado.dataProximoContato) {
          setDataProximoContato(
            new Date(atendimentoEncontrado.dataProximoContato)
              .toISOString()
              .split('T')[0]
          );
        }
        
        // Inicializar a data para novo contato (7 dias a partir de hoje)
        const hoje = new Date();
        setDataNovoContato(
          addDays(hoje, 7).toISOString().split('T')[0]
        );
      }
    }
  }, [id, atendimentos, loading]);
  
  // Limpar mensagem de sucesso após alguns segundos
  useEffect(() => {
    if (sucessoMsg) {
      const timer = setTimeout(() => {
        setSucessoMsg(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [sucessoMsg]);
  
  // Formatar data
  const formatarData = (data: string) => {
    return format(new Date(data), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };
  
  // Mapear status para texto e cores
  const getStatusInfo = (status: StatusCRM) => {
    switch (status) {
      case StatusCRM.EM_ABERTO:
        return { texto: 'Em Aberto', cor: 'bg-yellow-100 text-yellow-800' };
      case StatusCRM.EM_MONITORAMENTO:
        return { texto: 'Em Monitoramento', cor: 'bg-blue-100 text-blue-800' };
      case StatusCRM.FINALIZADO:
        return { texto: 'Finalizado', cor: 'bg-green-100 text-green-800' };
      default:
        return { texto: 'Desconhecido', cor: 'bg-gray-100 text-gray-800' };
    }
  };
  
  // Atualizar status e observações
  const handleAtualizarAtendimento = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!atendimento) return;

    setIsSubmitting(true);

    try {
      await atualizarAtendimento(atendimento.id, {
        status,
        observacoes,
        dataProximoContato: dataProximoContato ? dataProximoContato : undefined
      });

      setEditando(false);
      setIsSubmitting(false);
      setSucessoMsg('Atendimento atualizado com sucesso');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocorreu um erro ao atualizar o atendimento');
      }
      setIsSubmitting(false);
    }
  };
  
  // Adicionar comentário
  const handleAdicionarComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!novoComentario.trim()) {
      setError('O comentário não pode estar vazio');
      return;
    }

    if (!atendimento) return;

    setIsSubmitting(true);

    try {
      await adicionarComentario(atendimento.id, novoComentario);
      setNovoComentario('');
      setAdicionandoComentario(false);
      setIsSubmitting(false);
      setSucessoMsg('Comentário adicionado com sucesso');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocorreu um erro ao adicionar o comentário');
      }
      setIsSubmitting(false);
    }
  };
  
  // Atribuir responsável
  const handleAtribuirResponsavel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!novoResponsavelId) {
      setError('É necessário selecionar um responsável');
      return;
    }

    if (!atendimento) return;

    setIsSubmitting(true);

    try {
      await atribuirResponsavel(atendimento.id, novoResponsavelId, 
        // Vamos procurar o nome do responsável a partir do id
        usuariosDisponiveis.find(u => u.id === novoResponsavelId)?.nome || 'Novo Responsável'
      );
      setNovoResponsavelId('');
      setAtribuindoResponsavel(false);
      setIsSubmitting(false);
      setSucessoMsg('Responsável atribuído com sucesso');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocorreu um erro ao atribuir o responsável');
      }
      setIsSubmitting(false);
    }
  };
  
  // Função para o botão de ação rápida - finalizar e criar novo atendimento
  const handleFinalizarRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!observacaoFinalizacao.trim()) {
      setError('É necessário incluir uma observação para finalizar o atendimento');
      return;
    }
    
    if (criarNovoAtendimento && modoDataContato === 'data' && !dataNovoContato) {
      setError('É necessário selecionar uma data para o próximo contato');
      return;
    }
    
    if (criarNovoAtendimento && modoDataContato === 'dias' && (!diasParaNovoContato || diasParaNovoContato < 1)) {
      setError('É necessário especificar um número válido de dias para o próximo contato');
      return;
    }
    
    if (!atendimento) return;
    
    setIsSubmitting(true);
    
    try {
      // Determinar como enviar os parâmetros baseado no modo selecionado
      const resultado = await finalizarECriarNovoAtendimento(
        atendimento.id,
        observacaoFinalizacao,
        criarNovoAtendimento,
        modoDataContato === 'dias' ? diasParaNovoContato : undefined,
        modoDataContato === 'data' ? dataNovoContato : undefined
      );
      
      // Resetar estados
      setObservacaoFinalizacao('');
      setShowFinalizarModal(false);
      setIsSubmitting(false);
      
      // Exibir mensagem de sucesso
      let mensagem = 'Atendimento finalizado com sucesso.';
      if (resultado.novoAtendimento) {
        mensagem += ` Novo atendimento criado (#${resultado.novoAtendimento.id})`;
      }
      setSucessoMsg(mensagem);
      
      // Se um novo atendimento foi criado, redirecionar para ele
      if (resultado.novoAtendimento) {
        router.push(`/dashboard/crm/${resultado.novoAtendimento.id}`);
      } else {
        // Redirecionar para a lista de CRM se nenhum novo foi criado
        router.push('/dashboard/crm');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocorreu um erro ao finalizar o atendimento');
      }
      setIsSubmitting(false);
    }
  };
  
  // Verificar se está carregando ou se o atendimento não foi encontrado
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando atendimento...</p>
        </div>
      </div>
    );
  }
  
  if (!atendimento) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900">Atendimento não encontrado</h3>
        <p className="mt-2 text-gray-600">O atendimento solicitado não existe ou foi removido.</p>
        <div className="mt-6">
          <Link
            href="/dashboard/crm"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Voltar para a lista
          </Link>
        </div>
      </div>
    );
  }
  
  // Desabilitar a finalização rápida para atendimentos já finalizados
  const isDisabled = atendimento.status === StatusCRM.FINALIZADO;
  
  return (
    <div className="space-y-6 px-0 sm:px-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/crm"
          className="inline-flex items-center justify-center p-2 text-gray-600 bg-white rounded-md hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold flex-1">
          Atendimento: {atendimento.cliente.nome}
        </h1>
        
        <div className="flex items-center gap-2">
          {/* Botão de Ação Rápida para Finalizar */}
          {!isDisabled && (
            <button
              onClick={() => setShowFinalizarModal(true)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700"
              title="Finalizar e criar novo atendimento"
            >
              <CheckCircle size={16} className="mr-1.5" />
              Finalizar
            </button>
          )}
          
          <button
            onClick={() => setAtribuindoResponsavel(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <UserPlus size={16} className="mr-1.5" />
            Atribuir
          </button>
          
          {!editando && !isDisabled && (
            <button
              onClick={() => setEditando(true)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700"
            >
              <Edit size={16} className="mr-1.5" />
              Editar
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      {sucessoMsg && (
        <div className="p-3 bg-green-100 text-green-800 rounded-md">
          {sucessoMsg}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Informações do cliente */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Informações do Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Nome</p>
              <p className="text-sm font-medium">{atendimento.cliente.nome}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">CPF/CNPJ</p>
              <p className="text-sm font-medium">{atendimento.cliente.cpf || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Telefone</p>
              <p className="text-sm font-medium">{atendimento.cliente.telefone || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium">-</p>
            </div>
          </div>
        </div>
        
        {/* Informações do atendimento */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-medium text-gray-900">Detalhes do Atendimento</h2>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusInfo(atendimento.status).cor}`}>
              {getStatusInfo(atendimento.status).texto}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Data do Atendimento</p>
              <p className="text-sm font-medium">{formatarData(atendimento.data)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Responsável</p>
              <p className="text-sm font-medium">{atendimento.responsavel.nome}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Motivo</p>
              <p className="text-sm font-medium">{atendimento.motivo}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Próximo Contato</p>
              <p className="text-sm font-medium">
                {atendimento.dataProximoContato 
                  ? formatarData(atendimento.dataProximoContato) 
                  : '-'}
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Observações</p>
            <p className="text-sm whitespace-pre-line">{atendimento.observacoes || '-'}</p>
          </div>
          
          {/* Form para editar status e observações */}
          {editando && (
            <form onSubmit={handleAtualizarAtendimento} className="mt-6 space-y-4 border-t border-gray-200 pt-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusCRM)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={StatusCRM.EM_ABERTO}>Em Aberto</option>
                  <option value={StatusCRM.EM_MONITORAMENTO}>Em Monitoramento</option>
                  <option value={StatusCRM.FINALIZADO}>Finalizado</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="dataProximoContato" className="block text-sm font-medium text-gray-700 mb-1">
                  Data do Próximo Contato
                </label>
                <input
                  type="date"
                  id="dataProximoContato"
                  value={dataProximoContato}
                  onChange={(e) => setDataProximoContato(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : (
                    <>
                      <Save size={16} className="mr-2" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
        
        {/* Histórico de comentários */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Histórico</h2>
            
            {!adicionandoComentario && !isDisabled && (
              <button
                onClick={() => setAdicionandoComentario(true)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
              >
                <Plus size={16} className="mr-1.5" />
                Adicionar Comentário
              </button>
            )}
          </div>
          
          {/* Form para adicionar comentário */}
          {adicionandoComentario && (
            <form onSubmit={handleAdicionarComentario} className="mb-6 space-y-4 border p-4 rounded-md bg-gray-50">
              <div>
                <label htmlFor="novoComentario" className="block text-sm font-medium text-gray-700 mb-1">
                  Novo Comentário
                </label>
                <textarea
                  id="novoComentario"
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Digite seu comentário..."
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAdicionandoComentario(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Enviando...' : (
                    <>
                      <Send size={16} className="mr-1.5" />
                      Enviar
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
          
          {/* Form para atribuir responsável */}
          {atribuindoResponsavel && (
            <form onSubmit={handleAtribuirResponsavel} className="mb-6 space-y-4 border p-4 rounded-md bg-gray-50">
              <div>
                <label htmlFor="novoResponsavel" className="block text-sm font-medium text-gray-700 mb-1">
                  Selecione o Responsável
                </label>
                <select
                  id="novoResponsavel"
                  value={novoResponsavelId}
                  onChange={(e) => setNovoResponsavelId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione um responsável</option>
                  {usuariosDisponiveis.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAtribuindoResponsavel(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processando...' : (
                    <>
                      <UserPlus size={16} className="mr-1.5" />
                      Atribuir
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
          
          {/* Lista de histórico */}
          <div className="space-y-4">
            {atendimento.historico && atendimento.historico.length > 0 ? (
              atendimento.historico.map((item, index) => (
                <div key={index} className="border-b border-gray-100 pb-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-gray-900">{item.responsavel.nome}</p>
                    <p className="text-xs text-gray-500">{formatarData(item.data)}</p>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{item.descricao}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhum histórico encontrado.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de Finalização Rápida */}
      {showFinalizarModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Finalizar Atendimento</h3>
              <button
                onClick={() => setShowFinalizarModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleFinalizarRapido} className="space-y-4">
              <div>
                <label htmlFor="observacaoFinalizacao" className="block text-sm font-medium text-gray-700 mb-1">
                  Observações de finalização*
                </label>
                <textarea
                  id="observacaoFinalizacao"
                  value={observacaoFinalizacao}
                  onChange={(e) => setObservacaoFinalizacao(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Observações sobre a finalização do atendimento..."
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="criarNovo"
                  checked={criarNovoAtendimento}
                  onChange={(e) => setCriarNovoAtendimento(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="criarNovo" className="ml-2 block text-sm text-gray-900">
                  Criar novo atendimento para acompanhamento
                </label>
              </div>
              
              {criarNovoAtendimento && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Dados para o novo atendimento
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="modoDias"
                          checked={modoDataContato === 'dias'}
                          onChange={() => setModoDataContato('dias')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="modoDias" className="ml-2 block text-sm text-gray-700">
                          Em dias
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="modoData"
                          checked={modoDataContato === 'data'}
                          onChange={() => setModoDataContato('data')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="modoData" className="ml-2 block text-sm text-gray-700">
                          Data específica
                        </label>
                      </div>
                    </div>
                    
                    {modoDataContato === 'dias' ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-1/3">
                          <input
                            type="number"
                            id="diasParaNovoContato"
                            value={diasParaNovoContato}
                            onChange={(e) => setDiasParaNovoContato(parseInt(e.target.value))}
                            min="1"
                            max="365"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required={criarNovoAtendimento && modoDataContato === 'dias'}
                          />
                        </div>
                        <span className="text-sm text-gray-700">dias a partir de hoje</span>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="date"
                          id="dataNovoContato"
                          value={dataNovoContato}
                          onChange={(e) => setDataNovoContato(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min={new Date().toISOString().split('T')[0]}
                          required={criarNovoAtendimento && modoDataContato === 'data'}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <RotateCw size={14} className="mr-1" />
                      <span>Será criado um novo atendimento com as mesmas informações do cliente e motivo</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowFinalizarModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processando...' : (
                    <>
                      <CheckCircle size={16} className="mr-2" />
                      Finalizar
                      {criarNovoAtendimento && ' e Criar Novo'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 