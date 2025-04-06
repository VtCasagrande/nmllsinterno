'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash, CheckCircle, Clock, AlertTriangle, User, X, Upload, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Devolucao, devolucoesService, DevolucaoFiltro } from '@/services/devolucoesService';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

// Tipos personalizados para melhorar a segurança de tipos
type DevolucaoStatus = 'pendente' | 'em_analise' | 'finalizado' | 'cancelado';
type DevolucaoMotivo = 'produto_danificado' | 'produto_incorreto' | 'cliente_desistiu' | 'endereco_nao_encontrado' | 'outro';

// Mapeamento de status para exibição
const STATUS_MAP: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pendente: { 
    label: 'Pendente', 
    className: 'bg-yellow-100 text-yellow-800', 
    icon: <Clock size={14} className="mr-1" />
  },
  em_analise: { 
    label: 'Em Análise', 
    className: 'bg-blue-100 text-blue-800',
    icon: <User size={14} className="mr-1" />
  },
  finalizado: { 
    label: 'Finalizado', 
    className: 'bg-green-100 text-green-800',
    icon: <CheckCircle size={14} className="mr-1" />
  },
  cancelado: { 
    label: 'Cancelado', 
    className: 'bg-red-100 text-red-800',
    icon: <X size={14} className="mr-1" />
  },
};

// Mapeamento de motivos para exibição
const MOTIVO_MAP: Record<string, string> = {
  produto_danificado: 'Produto Danificado',
  produto_incorreto: 'Produto Incorreto',
  cliente_desistiu: 'Cliente Desistiu',
  endereco_nao_encontrado: 'Endereço Não Encontrado',
  outro: 'Outro',
};

// Modal para visualizar detalhes da devolução
interface ModalDetalhesProps {
  devolucao: Devolucao | null;
  onClose: () => void;
  onUpdateStatus: (id: string, novoStatus: string, dados: any) => void;
  onRefresh: () => void;
}

function ModalDetalhes({ devolucao, onClose, onUpdateStatus, onRefresh }: ModalDetalhesProps) {
  if (!devolucao) return null;
  
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [statusAtual, setStatusAtual] = useState<DevolucaoStatus>(devolucao.status as DevolucaoStatus);
  const [responsavelAnalise, setResponsavelAnalise] = useState(devolucao.responsavel_analise || '');
  const [pedidoTiny, setPedidoTiny] = useState(devolucao.pedido_tiny || '');
  const [notaFiscal, setNotaFiscal] = useState(devolucao.nota_fiscal || '');
  const [produto, setProduto] = useState(devolucao.produto || '');
  const [motivo, setMotivo] = useState<DevolucaoMotivo>(
    (devolucao.motivo || '') as DevolucaoMotivo
  );
  const [descricao, setDescricao] = useState(devolucao.observacoes || '');
  const [produtos, setProdutos] = useState(devolucao.produtos || []);
  const [novoProduto, setNovoProduto] = useState({
    id: `temp_${Date.now()}`,
    codigo: '',
    nome: '',
    quantidade: 1
  });
  const [novoComentario, setNovoComentario] = useState('');
  const [mostrarFormComentario, setMostrarFormComentario] = useState(false);
  const [dataFinalizacao, setDataFinalizacao] = useState(
    devolucao.data_finalizacao 
      ? new Date(devolucao.data_finalizacao).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [acaoConfirmacao, setAcaoConfirmacao] = useState<'finalizar' | 'cancelar' | null>(null);
  const [fotos, setFotos] = useState<string[]>(devolucao.fotos || []);

  const handleNovoProdutoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNovoProduto(prev => ({
      ...prev,
      [name]: name === 'quantidade' ? parseInt(value) || 1 : value
    }));
  };

  const adicionarProduto = () => {
    if (!novoProduto.codigo || !novoProduto.nome) {
      setErrors(prev => ({
        ...prev,
        produtos: 'Código e nome do produto são obrigatórios'
      }));
      return;
    }

    setProdutos(prev => [
      ...prev,
      { 
        id: novoProduto.id,
        codigo: novoProduto.codigo,
        nome: novoProduto.nome,
        quantidade: novoProduto.quantidade
      }
    ]);

    // Limpar o formulário
    setNovoProduto({
      id: `temp_${Date.now()}`,
      codigo: '',
      nome: '',
      quantidade: 1
    });

    // Limpar erro
    if (errors.produtos) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.produtos;
        return newErrors;
      });
    }
  };

  const removerProduto = (id: string) => {
    setProdutos(prev => prev.filter(produto => produto.id !== id));
  };
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusAtual(e.target.value as DevolucaoStatus);
    // Limpar erros quando mudar o status
    setErrors({});
  };
  
  const validarFormularioAnalise = () => {
    const newErrors: Record<string, string> = {};
    
    if (!motivo) {
      newErrors.motivo = 'O motivo da devolução é obrigatório';
    }

    if (produtos.length === 0) {
      newErrors.produtos = 'Adicione pelo menos um produto';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validarFormularioFinalizado = () => {
    const newErrors: Record<string, string> = {};
    
    if (!pedidoTiny) {
      newErrors.pedidoTiny = 'O número do pedido Tiny é obrigatório';
    }
    
    if (!notaFiscal) {
      newErrors.notaFiscal = 'O número da nota fiscal é obrigatório';
    }
    
    if (!dataFinalizacao) {
      newErrors.dataFinalizacao = 'A data de finalização é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmitAnalise = async () => {
    if (!validarFormularioAnalise() || !profile) return;
    
    setLoading(true);
    
    try {
      // Atualizar status para em_analise
      await devolucoesService.atualizarStatus(devolucao.id, 'em_analise', profile.id);
      
      // Atualizar produtos
      await devolucoesService.updateItens(devolucao.id, produtos, profile.id);
      
      // Adicionar comentário
      if (descricao !== devolucao.observacoes) {
        await devolucoesService.addComentario(
          devolucao.id, 
          `Atualização da descrição: ${descricao}`, 
          profile.id
        );
      }
      
      toast({
        title: "Sucesso",
        description: "Devolução atualizada com sucesso",
        variant: "success"
      });
      
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar devolução:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a devolução",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitFinalizado = async () => {
    if (!validarFormularioFinalizado() || !profile) return;
    
    setLoading(true);
    
    try {
      // Atualizar informações do pedido
      await devolucoesService.updateDevolucao(
        devolucao.id, 
        {
          pedido_tiny: pedidoTiny,
          nota_fiscal: notaFiscal,
        },
        profile.id
      );
      
      // Finalizar devolução
      await devolucoesService.atualizarStatus(devolucao.id, 'finalizado', profile.id);
      
      toast({
        title: "Sucesso",
        description: "Devolução finalizada com sucesso",
        variant: "success"
      });
      
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Erro ao finalizar devolução:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao finalizar a devolução",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const adicionarComentario = async () => {
    if (!novoComentario.trim() || !profile) {
      setErrors(prev => ({
        ...prev,
        comentario: 'O comentário não pode estar vazio'
      }));
      return;
    }

    setLoading(true);
    
    try {
      await devolucoesService.addComentario(devolucao.id, novoComentario, profile.id);
      
      toast({
        title: "Sucesso",
        description: "Comentário adicionado com sucesso",
        variant: "success"
      });
      
      setNovoComentario('');
      setMostrarFormComentario(false);
      onRefresh();
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar o comentário",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
    
    // Limpar erro
    if (errors.comentario) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.comentario;
        return newErrors;
      });
    }
  };

  const confirmarAcao = (acao: 'finalizar' | 'cancelar') => {
    setAcaoConfirmacao(acao);
    setMostrarConfirmacao(true);
  };

  const executarAcaoConfirmada = async () => {
    if (!profile) return;
    
    setLoading(true);
    
    try {
      if (acaoConfirmacao === 'finalizar') {
        await handleSubmitFinalizado();
      } else if (acaoConfirmacao === 'cancelar') {
        await devolucoesService.atualizarStatus(devolucao.id, 'cancelado', profile.id);
        toast({
          title: "Sucesso",
          description: "Devolução cancelada com sucesso",
          variant: "success"
        });
        onRefresh();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      toast({
        title: "Erro",
        description: `Ocorreu um erro ao ${acaoConfirmacao === 'finalizar' ? 'finalizar' : 'cancelar'} a devolução`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setMostrarConfirmacao(false);
      setAcaoConfirmacao(null);
    }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !profile) return;
    
    const file = e.target.files[0];
    setUploadLoading(true);
    
    try {
      const imageUrl = await devolucoesService.addFoto(devolucao.id, file, profile.id);
      
      if (imageUrl) {
        setFotos(prev => [...prev, imageUrl]);
        toast({
          title: "Sucesso",
          description: "Imagem enviada com sucesso",
          variant: "success"
        });
      } else {
        throw new Error('Erro ao enviar imagem');
      }
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar a imagem",
        variant: "destructive"
      });
    } finally {
      setUploadLoading(false);
      // Limpar o input
      e.target.value = '';
    }
  };
  
  const handleDeleteImage = async (url: string) => {
    if (!profile) return;
    
    try {
      const success = await devolucoesService.deleteFoto(url);
      
      if (success) {
        setFotos(prev => prev.filter(foto => foto !== url));
        toast({
          title: "Sucesso",
          description: "Imagem excluída com sucesso",
          variant: "success"
        });
      } else {
        throw new Error('Erro ao excluir imagem');
      }
    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir a imagem",
        variant: "destructive"
      });
    }
  };
  
  const renderizarFormularioStatus = () => {
    if (statusAtual === 'em_analise' && devolucao.status === 'pendente') {
      return (
        <div className="mt-4 p-4 border rounded-md bg-gray-50">
          <h3 className="font-medium mb-3">Mover para Em Análise</h3>
          
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo da Devolução
              </label>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value as DevolucaoMotivo)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.motivo ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Selecione um motivo</option>
                <option value="produto_danificado">Produto Danificado</option>
                <option value="produto_incorreto">Produto Incorreto</option>
                <option value="cliente_desistiu">Cliente Desistiu</option>
                <option value="endereco_nao_encontrado">Endereço Não Encontrado</option>
                <option value="outro">Outro</option>
              </select>
              {errors.motivo && (
                <p className="mt-1 text-sm text-red-600">{errors.motivo}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição do Problema
              </label>
              <textarea
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descreva detalhadamente o problema com o produto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produtos
              </label>
              
              {produtos.length > 0 && (
                <div className="mb-4 overflow-auto max-h-48">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Código
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Nome
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Qtd
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {produtos.map(produto => (
                        <tr key={produto.id}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {produto.codigo}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {produto.nome}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {produto.quantidade}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                            <button
                              type="button"
                              onClick={() => removerProduto(produto.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="grid grid-cols-5 gap-2 items-end">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    name="codigo"
                    value={novoProduto.codigo}
                    onChange={handleNovoProdutoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nome do Produto
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={novoProduto.nome}
                    onChange={handleNovoProdutoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Qtd
                  </label>
                  <input
                    type="number"
                    name="quantidade"
                    min="1"
                    value={novoProduto.quantidade}
                    onChange={handleNovoProdutoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={adicionarProduto}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Adicionar Produto
                </button>
              </div>
              {errors.produtos && (
                <p className="mt-1 text-sm text-red-600">{errors.produtos}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsável pela Análise
              </label>
              <input
                type="text"
                value={responsavelAnalise}
                onChange={(e) => setResponsavelAnalise(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.responsavelAnalise ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.responsavelAnalise && (
                <p className="mt-1 text-sm text-red-600">{errors.responsavelAnalise}</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSubmitAnalise}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Confirmar
            </button>
          </div>
        </div>
      );
    }
    
    if (statusAtual === 'finalizado' && devolucao.status !== 'finalizado') {
      return (
        <div className="mt-4 p-4 border rounded-md bg-gray-50">
          <h3 className="font-medium mb-3">Finalizar Devolução</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número do Pedido Tiny
              </label>
              <input
                type="text"
                value={pedidoTiny}
                onChange={(e) => setPedidoTiny(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.pedidoTiny ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.pedidoTiny && (
                <p className="mt-1 text-sm text-red-600">{errors.pedidoTiny}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número da Nota Fiscal
              </label>
              <input
                type="text"
                value={notaFiscal}
                onChange={(e) => setNotaFiscal(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.notaFiscal ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.notaFiscal && (
                <p className="mt-1 text-sm text-red-600">{errors.notaFiscal}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Finalização
              </label>
              <input
                type="date"
                value={dataFinalizacao}
                onChange={(e) => setDataFinalizacao(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.dataFinalizacao ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.dataFinalizacao && (
                <p className="mt-1 text-sm text-red-600">{errors.dataFinalizacao}</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => confirmarAcao('finalizar')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Finalizar
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  // Determinar se é possível alterar o status
  const podeAlterarStatus = devolucao.status !== 'finalizado' && devolucao.status !== 'cancelado';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Detalhes da Devolução</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Código</p>
              <p className="font-medium">{devolucao.codigo}</p>
            </div>
            {(devolucao.status === 'em_analise' || devolucao.status === 'finalizado') && devolucao.produtos?.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Produtos</p>
                <table className="min-w-full divide-y divide-gray-200 mt-2">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Código
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Nome
                      </th>
                      <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Quantidade
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {devolucao.produtos?.map(produto => (
                      <tr key={produto.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {produto.codigo}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {produto.nome}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                          {produto.quantidade}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {(devolucao.status === 'em_analise' || devolucao.status === 'finalizado') && devolucao.motivo && (
              <div>
                <p className="text-sm text-gray-500">Motivo</p>
                <p className="font-medium">{MOTIVO_MAP[devolucao.motivo] || devolucao.motivo}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Status</p>
              {podeAlterarStatus ? (
                <select
                  value={statusAtual}
                  onChange={handleStatusChange}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="pendente">Pendente</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              ) : (
                <div className="flex items-center mt-1">
                  <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-medium rounded-full ${STATUS_MAP[devolucao.status].className}`}>
                    {STATUS_MAP[devolucao.status].icon}
                    {STATUS_MAP[devolucao.status].label}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Data de Registro</p>
              <p className="font-medium">
                {new Date(devolucao.data).toLocaleDateString('pt-BR')} {new Date(devolucao.data).toLocaleTimeString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Responsável</p>
              <p className="font-medium">{devolucao.responsavel}</p>
            </div>
            {devolucao.responsavel_recebimento && (
              <div>
                <p className="text-sm text-gray-500">Recebido por</p>
                <p className="font-medium">{devolucao.responsavel_recebimento}</p>
              </div>
            )}
            {devolucao.responsavel_analise && (
              <div>
                <p className="text-sm text-gray-500">Analisado por</p>
                <p className="font-medium">{devolucao.responsavel_analise}</p>
              </div>
            )}
            {devolucao.status === 'finalizado' && (
              <>
                <div>
                  <p className="text-sm text-gray-500">Pedido Tiny</p>
                  <p className="font-medium">{devolucao.pedido_tiny}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nota Fiscal</p>
                  <p className="font-medium">{devolucao.nota_fiscal}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data de Finalização</p>
                  <p className="font-medium">
                    {new Date(devolucao.data_finalizacao).toLocaleDateString('pt-BR')} 
                    {' '}
                    {new Date(devolucao.data_finalizacao).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </>
            )}
            {devolucao.observacoes && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Observações</p>
                <p className="font-medium">{devolucao.observacoes}</p>
              </div>
            )}
            {(devolucao.status === 'em_analise' || devolucao.status === 'finalizado') && devolucao.descricao && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Descrição do Problema</p>
                <p className="font-medium">{devolucao.descricao}</p>
              </div>
            )}
          </div>

          {/* Formulário específico para alteração de status */}
          {renderizarFormularioStatus()}
          
          <div>
            <p className="text-sm text-gray-500 mb-2">Fotos do Produto ({devolucao.fotos.length})</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {devolucao.fotos.map((foto, index) => (
                <div key={index} className="aspect-square w-full rounded-md overflow-hidden border border-gray-300">
                  <div className="relative h-full w-full bg-gray-100 flex items-center justify-center">
                    {/* Em um ambiente real, usaríamos a URL real da imagem */}
                    <p className="text-sm text-gray-500">{foto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex justify-between">
              <h3 className="text-md font-semibold">Histórico de Atualizações</h3>
              <button 
                onClick={() => setMostrarFormComentario(true)}
                className="text-blue-600 text-sm hover:text-blue-800"
              >
                Adicionar Comentário
              </button>
            </div>
            
            {mostrarFormComentario && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <textarea
                  rows={3}
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    errors.comentario ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Digite seu comentário aqui..."
                />
                {errors.comentario && (
                  <p className="mt-1 text-sm text-red-600">{errors.comentario}</p>
                )}
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setMostrarFormComentario(false);
                      setNovoComentario('');
                    }}
                    className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={adicionarComentario}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            )}
            
            <div className="mt-4 space-y-4">
              {devolucao.comentarios && devolucao.comentarios.map((comentario) => (
                <div key={comentario.id} className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-800 p-2 rounded-full">
                    <User size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{comentario.autor}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(comentario.data).toLocaleDateString('pt-BR')} {new Date(comentario.data).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {comentario.texto}
                    </p>
                  </div>
                </div>
              ))}
              
              {devolucao.responsavel_analise && (
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-800 p-2 rounded-full">
                    <User size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{devolucao.responsavel_analise}</p>
                      <span className="text-xs text-gray-500">
                        {/* Data fictícia para análise, em um sistema real teria a data específica */}
                        {new Date(devolucao.data).toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      Movido para análise. {devolucao.produtos?.length > 0 && <span>Produto: {devolucao.produtos[0]?.nome}.</span>} {devolucao.motivo && <span>Motivo: {MOTIVO_MAP[devolucao.motivo] || devolucao.motivo}.</span>}
                    </p>
                  </div>
                </div>
              )}
              
              {devolucao.status === 'finalizado' && (
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 text-green-800 p-2 rounded-full">
                    <CheckCircle size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">Sistema</p>
                      <span className="text-xs text-gray-500">
                        {new Date(devolucao.data_finalizacao).toLocaleDateString('pt-BR')} {new Date(devolucao.data_finalizacao).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      Devolução finalizada. Pedido Tiny: {devolucao.pedido_tiny}. Nota Fiscal: {devolucao.nota_fiscal}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end gap-2">
          {devolucao.status !== 'cancelado' && devolucao.status !== 'finalizado' && (
            <button
              onClick={() => confirmarAcao('cancelar')}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
            >
              Cancelar Devolução
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {mostrarConfirmacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">
              {acaoConfirmacao === 'finalizar' ? 'Finalizar Devolução' : 'Cancelar Devolução'}
            </h3>
            <p className="mb-6">
              {acaoConfirmacao === 'finalizar' 
                ? 'Tem certeza que deseja finalizar esta devolução? Esta ação não poderá ser desfeita.'
                : 'Tem certeza que deseja cancelar esta devolução? Esta ação não poderá ser desfeita.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMostrarConfirmacao(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                onClick={executarAcaoConfirmada}
                className={`px-4 py-2 rounded-md text-white ${
                  acaoConfirmacao === 'finalizar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AcompanhamentoDevolucaoPage() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | DevolucaoStatus>('todos');
  const [detalheDevolucao, setDetalheDevolucao] = useState<Devolucao | null>(null);
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);

  // Carrega as devoluções do backend
  const carregarDevolucoes = async () => {
    try {
      setLoading(true);
      
      const filtro: DevolucaoFiltro = {};
      if (statusFilter !== 'todos') {
        filtro.status = statusFilter;
      }
      
      const devolucoesData = await devolucoesService.getDevolucoes(filtro);
      setDevolucoes(devolucoesData);
    } catch (error) {
      console.error('Erro ao carregar devoluções:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar as devoluções",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtragem das devoluções
  const devolucoesFiltradas = devolucoes.filter(devolucao => {
    // Filtrar por termo de busca (produto, código ou descrição)
    const searchLower = searchTerm.toLowerCase();
    const produtoMatch = devolucao.produto.toLowerCase().includes(searchLower);
    const codigoMatch = devolucao.codigo.toLowerCase().includes(searchLower);
    const descricaoMatch = devolucao.observacoes?.toLowerCase().includes(searchLower) || false;
    
    // Filtro de status já aplicado na busca do backend, mas verificamos novamente caso o estado tenha mudado
    const statusMatch = statusFilter === 'todos' || devolucao.status === statusFilter;
    
    return (produtoMatch || codigoMatch || descricaoMatch) && statusMatch;
  });

  // Carregar devoluções quando o componente montar ou o filtro de status mudar
  useEffect(() => {
    if (profile) {
      carregarDevolucoes();
    }
  }, [profile, statusFilter]);

  const abrirDetalhes = async (id: string) => {
    try {
      const devolucao = await devolucoesService.getDevolucaoById(id);
      setDetalheDevolucao(devolucao);
    } catch (error) {
      console.error('Erro ao carregar detalhes da devolução:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes da devolução",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (id: string, novoStatus: DevolucaoStatus, dados: any) => {
    try {
      setLoading(true);
      await devolucoesService.atualizarStatus(id, novoStatus, profile?.id || '');
      await carregarDevolucoes();
      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso",
        variant: "success"
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Você precisa estar logado para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Acompanhamento de Devoluções</h1>
        <Link 
          href="/dashboard/devolucoes/nova" 
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus size={20} className="mr-1" /> Nova Devolução
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 flex gap-4 flex-wrap items-center border-b">
          <div className="flex items-center relative w-64">
            <Search size={20} className="absolute left-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por produto..."
              className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'todos' | DevolucaoStatus)}
              className="py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="em_analise">Em Análise</option>
              <option value="finalizado">Finalizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <Spinner size="md" /> <span className="ml-2">Carregando devoluções...</span>
                    </div>
                  </td>
                </tr>
              ) : devolucoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Nenhuma devolução encontrada
                  </td>
                </tr>
              ) : (
                devolucoesFiltradas.map((devolucao) => (
                  <tr key={devolucao.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {devolucao.codigo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_MAP[devolucao.status]?.className || 'bg-gray-100 text-gray-800'}`}>
                        {STATUS_MAP[devolucao.status]?.icon}
                        {STATUS_MAP[devolucao.status]?.label || devolucao.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(devolucao.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                      {devolucao.status === 'pendente' ? '-' : 
                        devolucao.produtos && devolucao.produtos.length > 0 
                          ? devolucao.produtos.map(p => p.nome).join(', ')
                          : devolucao.produto || '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {devolucao.status === 'pendente' ? '-' : (MOTIVO_MAP[devolucao.motivo] || '-')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => abrirDetalhes(devolucao.id)}
                          title="Ver detalhes"
                        >
                          <Eye size={18} />
                        </button>
                        <Link
                          href={`/dashboard/devolucoes/edicao/${devolucao.id}`}
                          className="text-green-600 hover:text-green-900"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{devolucoesFiltradas.length}</span> de{' '}
            <span className="font-medium">{devolucoes.length}</span> devoluções
          </div>
        </div>
      </div>

      {detalheDevolucao && (
        <ModalDetalhes
          devolucao={detalheDevolucao}
          onClose={() => setDetalheDevolucao(null)}
          onUpdateStatus={handleUpdateStatus}
          onRefresh={carregarDevolucoes}
        />
      )}
    </div>
  );
} 