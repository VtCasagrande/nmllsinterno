'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRecorrencias } from '@/contexts/RecorrenciasContext';
import { StatusRecorrencia, ProdutoRecorrencia } from '@/types/recorrencias';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast-provider';

export default function NovaRecorrenciaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { adicionarRecorrencia, calcularProximaData } = useRecorrencias();
  
  // Estados para o formulário
  const [nomeCliente, setNomeCliente] = useState('');
  const [cpfCliente, setCpfCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [diasRecorrencia, setDiasRecorrencia] = useState(30);
  const [tipoIntervalo, setTipoIntervalo] = useState('predefinido'); // 'predefinido' ou 'personalizado'
  const [intervaloPersonalizado, setIntervaloPersonalizado] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [produtos, setProdutos] = useState<ProdutoRecorrencia[]>([
    { id: Date.now().toString(), ean: '', titulo: '', quantidade: 1, preco: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Função para adicionar um novo produto
  const adicionarProduto = () => {
    setProdutos([
      ...produtos,
      { id: Date.now().toString(), ean: '', titulo: '', quantidade: 1, preco: 0 }
    ]);
  };
  
  // Função para remover um produto
  const removerProduto = (id: string) => {
    if (produtos.length === 1) {
      toast({
        title: "Aviso",
        description: "A recorrência deve ter pelo menos um produto.",
        variant: "default"
      });
      return;
    }
    
    setProdutos(produtos.filter(produto => produto.id !== id));
  };
  
  // Função para atualizar os dados de um produto específico
  const atualizarProduto = (id: string, dados: Partial<ProdutoRecorrencia>) => {
    setProdutos(
      produtos.map(produto => (produto.id === id ? { ...produto, ...dados } : produto))
    );
  };
  
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

  // Função para lidar com a mudança no tipo de intervalo
  const handleTipoIntervaloChange = (tipo: string) => {
    setTipoIntervalo(tipo);
    if (tipo === 'predefinido') {
      setDiasRecorrencia(30); // Valor padrão para intervalo predefinido
    } else {
      setIntervaloPersonalizado(''); // Limpar o valor personalizado
    }
  };
  
  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!nomeCliente.trim()) {
      toast({
        title: "Erro",
        description: "O nome do cliente é obrigatório.",
        variant: "destructive"
      });
      return;
    }
    
    if (cpfCliente.replace(/\D/g, '').length !== 11) {
      toast({
        title: "Erro",
        description: "CPF inválido.",
        variant: "destructive"
      });
      return;
    }
    
    if (telefoneCliente.replace(/\D/g, '').length < 10) {
      toast({
        title: "Erro",
        description: "Telefone inválido.",
        variant: "destructive"
      });
      return;
    }

    // Validar intervalo personalizado se selecionado
    let diasRecorrenciaFinal = diasRecorrencia;
    if (tipoIntervalo === 'personalizado') {
      const dias = parseInt(intervaloPersonalizado);
      if (isNaN(dias) || dias < 1 || dias > 365) {
        toast({
          title: "Erro",
          description: "O intervalo personalizado deve ser um número entre 1 e 365 dias.",
          variant: "destructive"
        });
        return;
      }
      diasRecorrenciaFinal = dias;
    }
    
    // Verificar se todos os produtos têm título e EAN
    const produtosInvalidos = produtos.some(produto => !produto.titulo.trim() || !produto.ean.trim());
    if (produtosInvalidos) {
      toast({
        title: "Erro",
        description: "Todos os produtos devem ter um título e um código EAN.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const novaRecorrencia = {
        nomeCliente,
        cpfCliente,
        telefoneCliente,
        diasRecorrencia: diasRecorrenciaFinal,
        proximaData: calcularProximaData(diasRecorrenciaFinal),
        status: StatusRecorrencia.ATIVA,
        produtos,
        observacoes: observacoes.trim() || undefined
      };
      
      await adicionarRecorrencia(novaRecorrencia);
      
      toast({
        title: "Sucesso",
        description: "Recorrência adicionada com sucesso!"
      });
      
      router.push('/dashboard/recorrencias');
    } catch (error) {
      console.error('Erro ao adicionar recorrência:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar a recorrência. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6 px-0 sm:px-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Link 
          href="/dashboard/recorrencias"
          className="inline-flex items-center justify-center p-2 text-gray-600 bg-white rounded-md hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold">Nova Recorrência</h1>
      </div>
      
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
                CPF*
              </label>
              <input
                type="text"
                id="cpfCliente"
                value={cpfCliente}
                onChange={(e) => setCpfCliente(formatarCPF(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
            </div>
            
            <div>
              <label htmlFor="telefoneCliente" className="block text-sm font-medium text-gray-700 mb-1">
                Telefone*
              </label>
              <input
                type="text"
                id="telefoneCliente"
                value={telefoneCliente}
                onChange={(e) => setTelefoneCliente(formatarTelefone(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="(00) 00000-0000"
                maxLength={15}
                required
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Intervalo de Recorrência*
              </label>
              
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="tipoIntervalo"
                    value="predefinido"
                    checked={tipoIntervalo === 'predefinido'}
                    onChange={() => handleTipoIntervaloChange('predefinido')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Predefinido</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="tipoIntervalo"
                    value="personalizado"
                    checked={tipoIntervalo === 'personalizado'}
                    onChange={() => handleTipoIntervaloChange('personalizado')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Personalizado</span>
                </label>
              </div>
              
              {tipoIntervalo === 'predefinido' ? (
                <select
                  id="diasRecorrencia"
                  value={diasRecorrencia}
                  onChange={(e) => setDiasRecorrencia(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={7}>7 dias (semanal)</option>
                  <option value={15}>15 dias (quinzenal)</option>
                  <option value={30}>30 dias (mensal)</option>
                  <option value={60}>60 dias (bimestral)</option>
                  <option value={90}>90 dias (trimestral)</option>
                </select>
              ) : (
                <div className="flex items-center">
                  <input
                    type="number"
                    id="intervaloPersonalizado"
                    value={intervaloPersonalizado}
                    onChange={(e) => setIntervaloPersonalizado(e.target.value)}
                    min="1"
                    max="365"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required={tipoIntervalo === 'personalizado'}
                    placeholder="25"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-700">
                    dias
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Produtos */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Produtos da Recorrência</h2>
            <button
              type="button"
              onClick={adicionarProduto}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
            >
              <Plus size={16} className="mr-1" />
              Adicionar Produto
            </button>
          </div>
          
          <div className="space-y-4">
            {produtos.map((produto, index) => (
              <div key={produto.id} className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Produto {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removerProduto(produto.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor={`ean-${produto.id}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Código EAN*
                    </label>
                    <input
                      type="text"
                      id={`ean-${produto.id}`}
                      value={produto.ean}
                      onChange={(e) =>
                        atualizarProduto(produto.id, { ean: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label
                      htmlFor={`titulo-${produto.id}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Título do Produto*
                    </label>
                    <input
                      type="text"
                      id={`titulo-${produto.id}`}
                      value={produto.titulo}
                      onChange={(e) =>
                        atualizarProduto(produto.id, { titulo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label
                      htmlFor={`quantidade-${produto.id}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Quantidade*
                    </label>
                    <input
                      type="number"
                      id={`quantidade-${produto.id}`}
                      value={produto.quantidade}
                      min="1"
                      onChange={(e) =>
                        atualizarProduto(produto.id, { quantidade: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label
                      htmlFor={`preco-${produto.id}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Preço Unitário (R$)*
                    </label>
                    <input
                      type="number"
                      id={`preco-${produto.id}`}
                      value={produto.preco}
                      min="0"
                      step="0.01"
                      onChange={(e) =>
                        atualizarProduto(produto.id, { preco: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Observações */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Observações</h2>
          <textarea
            id="observacoes"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Observações sobre a recorrência..."
          ></textarea>
        </div>
        
        {/* Botões de ação */}
        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/recorrencias"
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
                Salvar Recorrência
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 