'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/contexts/CRMContext';
import { StatusCRM } from '@/types/crm';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function NovoCRMPage() {
  const router = useRouter();
  const { adicionarAtendimento, usuariosDisponiveis } = useCRM();
  
  // Estados para o formulário
  const [nomeCliente, setNomeCliente] = useState('');
  const [cpfCliente, setCpfCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [status, setStatus] = useState<StatusCRM>(StatusCRM.EM_ABERTO);
  const [dataAtendimento, setDataAtendimento] = useState('');
  const [dataProximoContato, setDataProximoContato] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Definir data atual para o campo de data do atendimento
  useEffect(() => {
    const hoje = new Date();
    setDataAtendimento(format(hoje, 'yyyy-MM-dd'));
  }, []);
  
  // Formatar CPF
  const formatarCPF = (cpf: string) => {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length <= 11) {
      cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
      cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
      cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    
    return cpf;
  };
  
  // Formatar telefone
  const formatarTelefone = (telefone: string) => {
    telefone = telefone.replace(/\D/g, '');
    
    if (telefone.length <= 11) {
      telefone = telefone.replace(/^(\d{2})(\d)/g, '($1) $2');
      telefone = telefone.replace(/(\d)(\d{4})$/, '$1-$2');
    }
    
    return telefone;
  };
  
  // Função para lidar com a submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validações básicas
    if (!nomeCliente.trim()) {
      setError('O nome do cliente é obrigatório');
      return;
    }
    
    if (!motivo.trim()) {
      setError('O motivo do atendimento é obrigatório');
      return;
    }
    
    if (!responsavelId) {
      setError('É necessário selecionar um responsável');
      return;
    }
    
    if (!dataAtendimento) {
      setError('A data do atendimento é obrigatória');
      return;
    }
    
    if (status === StatusCRM.EM_MONITORAMENTO && !dataProximoContato) {
      setError('É necessário definir a data do próximo contato para monitoramento');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Encontrar o nome do responsável selecionado
      const responsavelSelecionado = usuariosDisponiveis.find(u => u.id === responsavelId);
      
      if (!responsavelSelecionado) {
        throw new Error('Responsável não encontrado');
      }
      
      // Preparar dados do atendimento
      const novoAtendimento = {
        data: new Date(dataAtendimento).toISOString(),
        cliente: {
          id: Date.now().toString(), // Simulando um ID gerado
          nome: nomeCliente,
          cpf: cpfCliente,
          telefone: telefoneCliente
        },
        motivo,
        observacoes: observacoes.trim() || undefined,
        responsavel: {
          id: responsavelId,
          nome: responsavelSelecionado.nome
        },
        status,
        dataProximoContato: dataProximoContato ? new Date(dataProximoContato).toISOString() : undefined
      };
      
      // Adicionar o atendimento
      await adicionarAtendimento(novoAtendimento);
      
      // Redirecionar para a lista de atendimentos
      router.push('/dashboard/crm');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocorreu um erro ao criar o atendimento');
      }
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6 px-0 sm:px-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/crm"
          className="inline-flex items-center justify-center p-2 text-gray-600 bg-white rounded-md hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold">Novo Atendimento</h1>
      </div>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Cliente */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Dados do Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nomeCliente" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Cliente*
              </label>
              <input
                type="text"
                id="nomeCliente"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="cpfCliente" className="block text-sm font-medium text-gray-700 mb-1">
                CPF
              </label>
              <input
                type="text"
                id="cpfCliente"
                value={cpfCliente}
                onChange={(e) => setCpfCliente(formatarCPF(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            
            <div>
              <label htmlFor="telefoneCliente" className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                id="telefoneCliente"
                value={telefoneCliente}
                onChange={(e) => setTelefoneCliente(formatarTelefone(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>
        </div>
        
        {/* Dados do Atendimento */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Dados do Atendimento</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dataAtendimento" className="block text-sm font-medium text-gray-700 mb-1">
                  Data do Atendimento*
                </label>
                <input
                  type="date"
                  id="dataAtendimento"
                  value={dataAtendimento}
                  onChange={(e) => setDataAtendimento(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-1">
                Motivo do Atendimento*
              </label>
              <input
                type="text"
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
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
                placeholder="Observações adicionais sobre o atendimento..."
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="responsavel" className="block text-sm font-medium text-gray-700 mb-1">
                  Responsável*
                </label>
                <select
                  id="responsavel"
                  value={responsavelId}
                  onChange={(e) => setResponsavelId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione um responsável</option>
                  {usuariosDisponiveis.map((user) => (
                    <option key={user.id} value={user.id}>{user.nome}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status*
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusCRM)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={StatusCRM.EM_ABERTO}>Em Aberto</option>
                  <option value={StatusCRM.EM_MONITORAMENTO}>Em Monitoramento</option>
                  <option value={StatusCRM.FINALIZADO}>Finalizado</option>
                </select>
              </div>
              
              {(status === StatusCRM.EM_MONITORAMENTO) && (
                <div>
                  <label htmlFor="dataProximoContato" className="block text-sm font-medium text-gray-700 mb-1">
                    Data do Próximo Contato*
                  </label>
                  <input
                    type="date"
                    id="dataProximoContato"
                    value={dataProximoContato}
                    onChange={(e) => setDataProximoContato(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                    required={status === StatusCRM.EM_MONITORAMENTO}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Botões de ação */}
        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/crm"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Cancelar
          </Link>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>Salvando...</>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Salvar Atendimento
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 