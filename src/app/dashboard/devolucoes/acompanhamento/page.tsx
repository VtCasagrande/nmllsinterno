'use client';

import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash, CheckCircle, Clock, AlertTriangle, User, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { DEVOLUCOES_MOCK } from '@/services/devolucoesService';

// Mapeamento de status para exibição
const STATUS_MAP: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  em_aberto: { 
    label: 'Em Aberto', 
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
  devolucao: (typeof DEVOLUCOES_MOCK)[0] | null;
  onClose: () => void;
  onUpdateStatus: (id: number, novoStatus: string, dados: any) => void;
}

function ModalDetalhes({ devolucao, onClose, onUpdateStatus }: ModalDetalhesProps) {
  if (!devolucao) return null;
  
  const [statusAtual, setStatusAtual] = useState(devolucao.status);
  const [responsavelAnalise, setResponsavelAnalise] = useState(devolucao.responsavel_analise || '');
  const [pedidoTiny, setPedidoTiny] = useState(devolucao.pedido_tiny || '');
  const [notaFiscal, setNotaFiscal] = useState(devolucao.nota_fiscal || '');
  const [produto, setProduto] = useState(devolucao.produto || '');
  const [motivo, setMotivo] = useState(devolucao.motivo || '');
  const [descricao, setDescricao] = useState(devolucao.descricao || '');
  const [produtos, setProdutos] = useState<{id: number, codigo: string, nome: string, quantidade: number}[]>(
    devolucao.produtos || []
  );
  const [novoProduto, setNovoProduto] = useState({
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
        id: prev.length > 0 ? Math.max(...prev.map(p => p.id)) + 1 : 1,
        codigo: novoProduto.codigo,
        nome: novoProduto.nome,
        quantidade: novoProduto.quantidade
      }
    ]);

    // Limpar o formulário
    setNovoProduto({
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

  const removerProduto = (id: number) => {
    setProdutos(prev => prev.filter(produto => produto.id !== id));
  };
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusAtual(e.target.value);
    // Limpar erros quando mudar o status
    setErrors({});
  };
  
  const validarFormularioAnalise = () => {
    const newErrors: Record<string, string> = {};
    
    if (!responsavelAnalise) {
      newErrors.responsavelAnalise = 'O responsável pela análise é obrigatório';
    }
    
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
  
  const handleSubmitAnalise = () => {
    if (!validarFormularioAnalise()) return;
    
    const dadosAtualizados = {
      responsavel_analise: responsavelAnalise,
      produto: produtos.length > 0 ? produtos[0].nome : '',
      motivo: motivo,
      descricao: descricao,
      produtos: produtos
    };
    
    onUpdateStatus(devolucao.id, 'em_analise', dadosAtualizados);
    onClose();
  };
  
  const handleSubmitFinalizado = () => {
    if (!validarFormularioFinalizado()) return;
    
    const dadosAtualizados = {
      pedido_tiny: pedidoTiny,
      nota_fiscal: notaFiscal,
      data_finalizacao: `${dataFinalizacao}T${new Date().toISOString().split('T')[1].split('.')[0]}`
    };
    
    onUpdateStatus(devolucao.id, 'finalizado', dadosAtualizados);
    onClose();
  };
  
  const adicionarComentario = () => {
    if (!novoComentario.trim()) {
      setErrors(prev => ({
        ...prev,
        comentario: 'O comentário não pode estar vazio'
      }));
      return;
    }

    const comentario = {
      id: devolucao.comentarios ? Math.max(...devolucao.comentarios.map(c => c.id), 0) + 1 : 1,
      texto: novoComentario,
      autor: 'Usuário Atual', // Em um sistema real, usaríamos o usuário logado
      data: new Date().toISOString()
    };

    onUpdateStatus(devolucao.id, devolucao.status, {
      comentarios: [...(devolucao.comentarios || []), comentario]
    });

    setNovoComentario('');
    setMostrarFormComentario(false);
    
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

  const executarAcaoConfirmada = () => {
    if (acaoConfirmacao === 'finalizar') {
      handleSubmitFinalizado();
    } else if (acaoConfirmacao === 'cancelar') {
      onUpdateStatus(devolucao.id, 'cancelado', {});
      onClose();
    }
    setMostrarConfirmacao(false);
    setAcaoConfirmacao(null);
  };
  
  const renderizarFormularioStatus = () => {
    if (statusAtual === 'em_analise' && devolucao.status !== 'em_analise' && devolucao.status !== 'finalizado') {
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
                onChange={(e) => setMotivo(e.target.value)}
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
            {(devolucao.status === 'em_analise' || devolucao.status === 'finalizado') && devolucao.produtos.length > 0 && (
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
                    {devolucao.produtos.map(produto => (
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
                  <option value="em_aberto">Em Aberto</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="finalizado">Finalizado</option>
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
                      Movido para análise. {devolucao.produtos.length > 0 && <span>Produto: {devolucao.produtos[0].nome}.</span>} {devolucao.motivo && <span>Motivo: {MOTIVO_MAP[devolucao.motivo] || devolucao.motivo}.</span>}
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [detalheDevolucao, setDetalheDevolucao] = useState<(typeof DEVOLUCOES_MOCK)[0] | null>(null);
  const [devolucoes, setDevolucoes] = useState<typeof DEVOLUCOES_MOCK>(DEVOLUCOES_MOCK);

  // Filtragem das devoluções
  const devolucoesFiltradas = devolucoes.filter(devolucao => {
    const produtosStr = devolucao.produtos.map(p => `${p.codigo} ${p.nome}`).join(' ');
    
    const matchesSearch = 
      devolucao.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produtosStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      devolucao.responsavel.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'todos' || devolucao.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Função para atualizar o status de uma devolução
  const handleUpdateStatus = (id: number, novoStatus: string, dados: any) => {
    // Atualizar o estado local primeiro
    setDevolucoes(prevDevolucoes => 
      prevDevolucoes.map(devolucao => 
        devolucao.id === id 
          ? { ...devolucao, status: novoStatus, ...dados } 
          : devolucao
      )
    );
    
    // Também atualizar o array DEVOLUCOES_MOCK para persistir as alterações
    const index = DEVOLUCOES_MOCK.findIndex(d => d.id === id);
    if (index !== -1) {
      DEVOLUCOES_MOCK[index] = {
        ...DEVOLUCOES_MOCK[index],
        status: novoStatus,
        ...dados
      };
    }
  };

  // Abrir modal de detalhes
  const abrirDetalhes = (devolucao: (typeof devolucoes)[0]) => {
    setDetalheDevolucao(devolucao);
  };

  // Fechar modal de detalhes
  const fecharDetalhes = () => {
    setDetalheDevolucao(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Acompanhamento de Devoluções</h1>
            <p className="text-gray-500 mt-1">Gerencie e acompanhe o processo de devolução de produtos</p>
          </div>
          
          <Link 
            href="/dashboard/devolucoes/registro"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus size={16} className="mr-2" />
            Nova Devolução
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="sm:flex-1">
                <div className="relative rounded-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Buscar por código, produto ou responsável..."
                  />
                </div>
              </div>
              
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="todos">Todos os status</option>
                  <option value="em_aberto">Em Aberto</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responsável
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fotos
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {devolucoesFiltradas.length > 0 ? (
                  devolucoesFiltradas.map((devolucao) => (
                    <tr key={devolucao.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {devolucao.codigo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                        {devolucao.status === 'em_aberto' ? '-' : 
                          devolucao.produtos.length > 0 
                            ? devolucao.produtos.map(p => p.nome).join(', ')
                            : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {devolucao.status === 'em_aberto' ? '-' : (MOTIVO_MAP[devolucao.motivo] || '-')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-medium rounded-full ${STATUS_MAP[devolucao.status].className}`}>
                          {STATUS_MAP[devolucao.status].icon}
                          {STATUS_MAP[devolucao.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(devolucao.data).toLocaleDateString('pt-BR')}
                        <span className="block text-xs text-gray-400">
                          {new Date(devolucao.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {devolucao.responsavel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {devolucao.fotos.length} foto(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Ver detalhes"
                            onClick={() => abrirDetalhes(devolucao)}
                          >
                            <Eye size={18} />
                          </button>
                          {devolucao.status !== 'finalizado' && devolucao.status !== 'cancelado' && (
                            <>
                              <Link
                                href={`/dashboard/devolucoes/edicao/${devolucao.id}`}
                                className="p-1 text-yellow-600 hover:text-yellow-800"
                                title="Editar"
                              >
                                <Edit size={18} />
                              </Link>
                              <button
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Cancelar"
                                onClick={() => {
                                  if(confirm('Tem certeza que deseja cancelar esta devolução? Esta ação não poderá ser desfeita.')) {
                                    handleUpdateStatus(devolucao.id, 'cancelado', {});
                                  }
                                }}
                              >
                                <Trash size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhuma devolução encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 px-4 py-3 border-t">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{devolucoesFiltradas.length}</span> de{' '}
              <span className="font-medium">{DEVOLUCOES_MOCK.length}</span> devoluções
            </div>
          </div>
        </div>
      </div>

      {detalheDevolucao && (
        <ModalDetalhes
          devolucao={detalheDevolucao}
          onClose={fecharDetalhes}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </>
  );
} 