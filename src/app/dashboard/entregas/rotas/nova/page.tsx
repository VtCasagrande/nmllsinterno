'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash, CheckCircle, Clock, LoaderCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { rotasService } from '@/services/rotasService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { RotaAPI } from '@/types/entregas';

// Interfaces e tipos
interface ProdutoRota {
  id: string;
  codigo: string;
  nome: string;
  quantidade: number;
  valor: number;
}

interface EnderecoEntrega {
  logradouro: string;
  cidade: string;
  cep: string;
  complemento: string;
  numero: string;
  bairro: string;
}

interface HorarioMaximo {
  tem: boolean;
  horario: string;
}

interface PagamentoEntrega {
  receber: boolean;
  valor: number;
  forma: string;
  troco?: number;
  tipoCartao?: string;
  parcelamento?: number; // Número de parcelas para cartão de crédito
}

interface FormularioRota {
  numeroTiny: string;
  data: string;
  motorista: string;
  motorista_id?: string; // ID do motorista no Supabase
  formaEnvio: string;
  prioridade: string;
  horarioMaximo: HorarioMaximo;
  nomeCliente: string;
  telefoneCliente: string;
  endereco: EnderecoEntrega;
  pagamento: PagamentoEntrega;
  observacoes: string;
}

interface Erros {
  [key: string]: string;
}

interface Motorista {
  id: string;
  nome: string;
  veiculo: string;
  placa: string;
}

export default function NovaEntrega() {
  const router = useRouter();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  // Estado para produtos
  const [produtos, setProdutos] = useState<ProdutoRota[]>([]);
  const [novoProduto, setNovoProduto] = useState<Omit<ProdutoRota, 'id'>>({
    codigo: '',
    nome: '',
    quantidade: 1,
    valor: 0
  });

  // Estado para motoristas
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [carregandoMotoristas, setCarregandoMotoristas] = useState(false);
  
  // Estado principal do formulário
  const [formData, setFormData] = useState<FormularioRota>({
    numeroTiny: '',
    data: new Date().toISOString().split('T')[0],
    motorista: '',
    motorista_id: undefined,
    formaEnvio: 'comum',
    prioridade: 'normal',
    horarioMaximo: {
      tem: false,
      horario: ''
    },
    nomeCliente: '',
    telefoneCliente: '',
    endereco: {
      logradouro: '',
      cidade: '',
      cep: '',
      complemento: '',
      numero: '',
      bairro: ''
    },
    pagamento: {
      receber: false,
      valor: 0,
      forma: '',
      troco: undefined,
      tipoCartao: '',
      parcelamento: 1 // Valor padrão: à vista
    },
    observacoes: ''
  });
  
  // Estado para validação e submissão
  const [errors, setErrors] = useState<Erros>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Carregar lista de motoristas ao iniciar
  useEffect(() => {
    const carregarMotoristas = async () => {
      setCarregandoMotoristas(true);
      try {
        const listaMotoristas = await rotasService.listarMotoristas();
        setMotoristas(listaMotoristas);
      } catch (error) {
        console.error('Erro ao carregar motoristas:', error);
      } finally {
        setCarregandoMotoristas(false);
      }
    };

    carregarMotoristas();
  }, []);

  // Manipuladores de mudança
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Trata o caso especial do motorista para salvar o ID
    if (name === 'motorista') {
      const selectedMotorista = motoristas.find(m => m.nome === value);
      setFormData(prev => ({
        ...prev,
        motorista: value,
        motorista_id: selectedMotorista?.id
      }));
      return;
    }
    
    // Manipula campos aninhados (endereco, horarioMaximo)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        // Verificar se prev[parent] existe e é um objeto
        const parentValue = prev[parent as keyof FormularioRota] || {};
        return {
          ...prev,
          [parent]: {
            ...parentValue,
            [child]: value
          }
        };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Limpa erro quando campo é alterado
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        // Verificar se prev[parent] existe e é um objeto
        const parentValue = prev[parent as keyof FormularioRota] || {};
        return {
          ...prev,
          [parent]: {
            ...parentValue,
            [child]: checked
          }
        };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: checked }));
    }
  };
  
  const handlePagamentoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let updatedPayment: PagamentoEntrega = {
      ...formData.pagamento
    };
    
    if (name === 'pagamento.forma') {
      // Atualizar forma de pagamento
      updatedPayment.forma = value;
      
      // Limpar campos específicos quando mudamos a forma de pagamento
      if (value === 'dinheiro') {
        updatedPayment.tipoCartao = '';
        updatedPayment.parcelamento = undefined;
      } else if (value === 'cartao') {
        updatedPayment.troco = undefined;
        // Default para crédito quando seleciona cartão
        updatedPayment.tipoCartao = 'credito';
      } else {
        // Para outras formas, limpar cartão e troco
        updatedPayment.tipoCartao = '';
        updatedPayment.troco = undefined;
        updatedPayment.parcelamento = undefined;
      }
    } else if (name === 'pagamento.tipoCartao') {
      updatedPayment.tipoCartao = value;
      
      // Reset do parcelamento quando muda para débito
      if (value === 'debito') {
        updatedPayment.parcelamento = 1; // Débito é sempre à vista
      }
    } else if (name === 'pagamento.valor') {
      updatedPayment.valor = Number(value);
    } else if (name === 'pagamento.troco') {
      updatedPayment.troco = Number(value);
    } else if (name === 'pagamento.parcelamento') {
      updatedPayment.parcelamento = Number(value);
    }
    
    setFormData(prev => ({
      ...prev,
      pagamento: updatedPayment
    }));
  };
  
  const handleProdutoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let fieldValue: string | number = value;
    
    // Converte valores numéricos para produtos
    if (name === 'quantidade') {
      fieldValue = value === '' ? 1 : parseInt(value);
    } else if (name === 'valor') {
      fieldValue = value === '' ? 0 : parseFloat(value);
    }
    
    setNovoProduto(prev => ({
      ...prev,
      [name]: fieldValue
    }));
  };
  
  // Manipuladores de produtos
  const adicionarProduto = () => {
    if (!novoProduto.nome || !novoProduto.codigo) {
      return;
    }
    
    const novoProdutoComId: ProdutoRota = {
      ...novoProduto,
      id: crypto.randomUUID()
    };
    
    setProdutos(prev => [...prev, novoProdutoComId]);
    
    // Reseta o estado do novo produto
    setNovoProduto({
      codigo: '',
      nome: '',
      quantidade: 1,
      valor: 0
    });
    
    // Limpa erro de produtos se existir
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
  
  // Função para buscar endereço pelo CEP
  const buscarEnderecoPorCep = useCallback(async (cep: string) => {
    if (!cep || cep.length < 8) return;
    
    // Limpa formatação do CEP
    const cepNumeros = cep.replace(/\D/g, '');
    if (cepNumeros.length !== 8) return;
    
    try {
      setBuscandoCep(true);
      const response = await fetch(`https://viacep.com.br/ws/${cepNumeros}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: {
            ...prev.endereco,
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            cep: cepNumeros
          }
        }));
        
        // Limpa erros de endereço
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors['endereco.logradouro'];
          delete newErrors['endereco.cidade'];
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setBuscandoCep(false);
    }
  }, []);

  // Manipuladores de mudança para o CEP
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    // Atualiza o CEP
    setFormData(prev => ({
      ...prev,
      endereco: {
        ...prev.endereco,
        cep: value
      }
    }));
    
    // Limpa erro
    if (errors['endereco.cep']) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors['endereco.cep'];
        return newErrors;
      });
    }
  };

  // Função para buscar CEP quando o campo perder o foco
  const handleCepBlur = () => {
    if (formData.endereco.cep) {
      buscarEnderecoPorCep(formData.endereco.cep);
    }
  };
  
  // Validação do formulário
  const validarFormulario = (): boolean => {
    const novosErros: Erros = {};
    
    // Validações básicas
    if (!formData.numeroTiny) {
      novosErros.numeroTiny = 'O número do pedido é obrigatório';
    }
    
    if (!formData.data) {
      novosErros.data = 'A data de entrega é obrigatória';
    }
    
    if (!formData.motorista) {
      novosErros.motorista = 'Selecione um motorista';
    }
    
    // Validações do cliente
    if (!formData.nomeCliente) {
      novosErros.nomeCliente = 'O nome do cliente é obrigatório';
    }
    
    // Validações do endereço
    if (!formData.endereco.cep) {
      novosErros['endereco.cep'] = 'O CEP é obrigatório';
    }
    
    if (!formData.endereco.logradouro) {
      novosErros['endereco.logradouro'] = 'O endereço é obrigatório';
    }
    
    if (!formData.endereco.numero) {
      novosErros['endereco.numero'] = 'O número é obrigatório';
    }
    
    if (!formData.endereco.cidade) {
      novosErros['endereco.cidade'] = 'A cidade é obrigatória';
    }
    
    // Validação do horário máximo
    if (formData.horarioMaximo.tem && !formData.horarioMaximo.horario) {
      novosErros['horarioMaximo.horario'] = 'O horário máximo é obrigatório';
    }
    
    // Validação de pagamento
    if (formData.pagamento.receber) {
      if (!formData.pagamento.forma) {
        novosErros['pagamento.forma'] = 'A forma de pagamento é obrigatória';
      }
      
      if (formData.pagamento.valor <= 0) {
        novosErros['pagamento.valor'] = 'O valor deve ser maior que zero';
      }
      
      if (formData.pagamento.forma === 'cartao' && !formData.pagamento.tipoCartao) {
        novosErros['pagamento.tipoCartao'] = 'O tipo de cartão é obrigatório';
      }
      
      if (formData.pagamento.forma === 'cartao' && 
          formData.pagamento.tipoCartao === 'credito' && 
          (!formData.pagamento.parcelamento || formData.pagamento.parcelamento < 1)) {
        novosErros['pagamento.parcelamento'] = 'O número de parcelas deve ser informado';
      }
      
      if (formData.pagamento.forma === 'dinheiro' && 
          formData.pagamento.troco !== undefined && 
          formData.pagamento.troco < formData.pagamento.valor) {
        novosErros['pagamento.troco'] = 'O valor para troco deve ser maior que o valor do pagamento';
      }
    }
    
    // Validação de produtos
    if (produtos.length === 0) {
      novosErros.produtos = 'Adicione pelo menos um produto à rota';
    }
    
    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };
  
  // Exibir resumo antes de confirmar
  const mostrarResumo = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validarFormulario()) {
      setShowConfirmation(true);
    }
  };
  
  // Submit do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica já foi feita no validarFormulario()
    if (!validarFormulario()) {
      return;
    }
    
    // Iniciar envio
    setIsSubmitting(true);
    setErrors({ ...errors, general: '' });
    
    try {
      // Converter produtos para o formato esperado pela API
      const produtosAPI = produtos.map(p => ({
        nome: p.nome,
        quantidade: p.quantidade,
        valor: p.valor,
        codigo: p.codigo
      }));
      
      // Converter produtos para o formato de itens
      const itensAPI = produtos.map(p => ({
        descricao: p.nome,
        quantidade: p.quantidade,
        valor_unitario: p.valor
      }));
      
      // Filtrar pagamentos com valor > 0
      const pagamentosAPI = [{
        tipo: formData.pagamento.forma as 'dinheiro' | 'cartao' | 'pix' | 'outro',
        valor: formData.pagamento.valor,
        parcelas: formData.pagamento.parcelamento || 1,
        recebido: false
      }];
      
      // Montar objeto para envio seguindo a interface RotaAPI
      const dadosRota = {
        motorista_id: formData.motorista_id || "",
        nome_cliente: formData.nomeCliente,
        telefone_cliente: formData.telefoneCliente,
        data_entrega: formData.data,
        horario_maximo: formData.horarioMaximo?.horario || "18:00",
        endereco: formData.endereco.logradouro,
        complemento: formData.endereco.complemento || "",
        cidade: formData.endereco.cidade || "",
        observacoes: formData.observacoes || "",
        status: "pendente",
        produtos: produtosAPI,
        pagamentos: pagamentosAPI,
        itens: itensAPI
      };
      
      // Enviar para a API usando userID do contexto de autenticação
      if (profile?.id) {
        const rota = await rotasService.criarNovaRota(dadosRota, profile.id);
        
        // Exibir mensagem de sucesso
        toast({
          title: "Entrega criada com sucesso",
          description: `A entrega ${rota.codigo} foi registrada.`,
        });
        
        // Redirecionar para a lista de entregas após sucesso
        router.push('/dashboard/entregas/rotas');
      } else {
        setErrors({ ...errors, general: 'Usuário não autenticado. Faça login novamente.' });
        
        toast({
          title: "Erro de autenticação",
          description: "Usuário não autenticado. Faça login novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao criar entrega:', error);
      setErrors({ ...errors, general: 'Ocorreu um erro ao criar a entrega. Tente novamente.' });
      
      toast({
        title: "Erro ao criar entrega",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para cancelar a confirmação
  const cancelarConfirmacao = () => {
    setShowConfirmation(false);
  };

  // Formatar preço para exibição
  const formatarPreco = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/entregas/rotas"
          className="inline-flex items-center justify-center p-2 text-gray-600 bg-white rounded-md hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nova Entrega</h1>
          <p className="text-gray-500 mt-1">Cadastre uma nova entrega no sistema</p>
        </div>
      </div>

      <form onSubmit={mostrarResumo} className="space-y-6">
        {/* Informações básicas */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium mb-4">Informações da Entrega</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="numeroTiny" className="block text-sm font-medium text-gray-700 mb-1">
                Número do Pedido (Tiny)
              </label>
              <input
                type="text"
                id="numeroTiny"
                name="numeroTiny"
                value={formData.numeroTiny}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.numeroTiny ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.numeroTiny && (
                <p className="mt-1 text-sm text-red-600">{errors.numeroTiny}</p>
              )}
            </div>

            <div>
              <label htmlFor="data" className="block text-sm font-medium text-gray-700 mb-1">
                Data da Entrega
              </label>
              <input
                type="date"
                id="data"
                name="data"
                value={formData.data}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.data ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.data && (
                <p className="mt-1 text-sm text-red-600">{errors.data}</p>
              )}
            </div>

            <div>
              <label htmlFor="motorista" className="block text-sm font-medium text-gray-700 mb-1">
                Motorista
              </label>
              <select
                id="motorista"
                name="motorista"
                value={formData.motorista}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.motorista ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={carregandoMotoristas}
              >
                <option value="">Selecione um motorista</option>
                {carregandoMotoristas ? (
                  <option value="" disabled>Carregando motoristas...</option>
                ) : motoristas.length === 0 ? (
                  <option value="" disabled>Nenhum motorista disponível</option>
                ) : (
                  motoristas.map(motorista => (
                    <option key={motorista.id} value={motorista.nome}>
                      {motorista.nome} ({motorista.veiculo} - {motorista.placa})
                    </option>
                  ))
                )}
              </select>
              {errors.motorista && (
                <p className="mt-1 text-sm text-red-600">{errors.motorista}</p>
              )}
            </div>

            <div>
              <label htmlFor="formaEnvio" className="block text-sm font-medium text-gray-700 mb-1">
                Forma de Envio
              </label>
              <select
                id="formaEnvio"
                name="formaEnvio"
                value={formData.formaEnvio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="comum">Comum</option>
                <option value="expressa">Expressa</option>
              </select>
            </div>

            <div>
              <label htmlFor="prioridade" className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade
              </label>
              <select
                id="prioridade"
                name="prioridade"
                value={formData.prioridade}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="horarioMaximo.tem"
                  name="horarioMaximo.tem"
                  checked={formData.horarioMaximo.tem}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="horarioMaximo.tem" className="ml-2 block text-sm text-gray-700">
                  Horário Máximo para Entrega
                </label>
              </div>
            </div>

            {formData.horarioMaximo.tem && (
              <div>
                <label htmlFor="horarioMaximo.horario" className="block text-sm font-medium text-gray-700 mb-1">
                  Horário Máximo
                </label>
                <input
                  type="time"
                  id="horarioMaximo.horario"
                  name="horarioMaximo.horario"
                  value={formData.horarioMaximo.horario}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors['horarioMaximo.horario'] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors['horarioMaximo.horario'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['horarioMaximo.horario']}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Produtos */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium mb-4">Produtos</h2>
          
          {errors.produtos && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{errors.produtos}</p>
          )}
          
          <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label htmlFor="codigo_produto" className="block text-sm font-medium text-gray-700 mb-1">
                Código
              </label>
              <input
                type="text"
                id="codigo_produto"
                name="codigo"
                value={novoProduto.codigo}
                onChange={handleProdutoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="nome_produto" className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                id="nome_produto"
                name="nome"
                value={novoProduto.nome}
                onChange={handleProdutoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="quantidade_produto" className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade
              </label>
              <input
                type="number"
                id="quantidade_produto"
                name="quantidade"
                value={novoProduto.quantidade}
                onChange={handleProdutoChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="valor_produto" className="block text-sm font-medium text-gray-700 mb-1">
                Valor Unitário (R$)
              </label>
              <input
                type="number"
                id="valor_produto"
                name="valor"
                value={novoProduto.valor}
                onChange={handleProdutoChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={adicionarProduto}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!novoProduto.nome || !novoProduto.codigo}
              >
                <Plus size={16} className="mr-2" />
                Adicionar
              </button>
            </div>
          </div>

          {produtos.length > 0 ? (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Unitário
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {produtos.map((produto) => (
                    <tr key={produto.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {produto.codigo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {produto.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {produto.quantidade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        R$ {produto.valor.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => removerProduto(produto.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 border rounded-lg">
              Nenhum produto adicionado
            </div>
          )}
        </div>

        {/* Informações do Cliente */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium mb-4">Dados do Cliente</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nomeCliente" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Cliente
              </label>
              <input
                type="text"
                id="nomeCliente"
                name="nomeCliente"
                value={formData.nomeCliente}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.nomeCliente ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Nome completo"
              />
              {errors.nomeCliente && (
                <p className="mt-1 text-sm text-red-600">{errors.nomeCliente}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="telefoneCliente" className="block text-sm font-medium text-gray-700 mb-1">
                Telefone do Cliente
              </label>
              <input
                type="text"
                id="telefoneCliente"
                name="telefoneCliente"
                value={formData.telefoneCliente}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </div>
        
        {/* Endereço de Entrega */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium mb-4">Endereço de Entrega</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="endereco.cep" className="block text-sm font-medium text-gray-700 mb-1">
                CEP
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="endereco.cep"
                  name="endereco.cep"
                  value={formData.endereco.cep}
                  onChange={handleCepChange}
                  onBlur={handleCepBlur}
                  className={`w-full px-3 py-2 border rounded-md ${errors['endereco.cep'] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 ${buscandoCep ? 'bg-gray-100' : ''}`}
                  placeholder="00000-000"
                  disabled={buscandoCep}
                />
                {buscandoCep && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              {errors['endereco.cep'] && (
                <p className="mt-1 text-sm text-red-600">{errors['endereco.cep']}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="endereco.numero" className="block text-sm font-medium text-gray-700 mb-1">
                Número
              </label>
              <input
                type="text"
                id="endereco.numero"
                name="endereco.numero"
                value={formData.endereco.numero}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${errors['endereco.numero'] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Número"
              />
              {errors['endereco.numero'] && (
                <p className="mt-1 text-sm text-red-600">{errors['endereco.numero']}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="endereco.logradouro" className="block text-sm font-medium text-gray-700 mb-1">
                Logradouro
              </label>
              <input
                type="text"
                id="endereco.logradouro"
                name="endereco.logradouro"
                value={formData.endereco.logradouro}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${errors['endereco.logradouro'] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Rua, Avenida, etc."
                readOnly={buscandoCep}
              />
              {errors['endereco.logradouro'] && (
                <p className="mt-1 text-sm text-red-600">{errors['endereco.logradouro']}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="endereco.bairro" className="block text-sm font-medium text-gray-700 mb-1">
                Bairro
              </label>
              <input
                type="text"
                id="endereco.bairro"
                name="endereco.bairro"
                value={formData.endereco.bairro}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Bairro"
                readOnly={buscandoCep}
              />
            </div>
            
            <div>
              <label htmlFor="endereco.cidade" className="block text-sm font-medium text-gray-700 mb-1">
                Cidade
              </label>
              <input
                type="text"
                id="endereco.cidade"
                name="endereco.cidade"
                value={formData.endereco.cidade}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${errors['endereco.cidade'] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Cidade"
                readOnly={buscandoCep}
              />
              {errors['endereco.cidade'] && (
                <p className="mt-1 text-sm text-red-600">{errors['endereco.cidade']}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="endereco.complemento" className="block text-sm font-medium text-gray-700 mb-1">
                Complemento
              </label>
              <input
                type="text"
                id="endereco.complemento"
                name="endereco.complemento"
                value={formData.endereco.complemento}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Apartamento, bloco, etc."
              />
            </div>
          </div>
        </div>

        {/* Pagamento na Entrega */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium mb-4">Pagamento na Entrega</h2>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="pagamento.receber"
                name="pagamento.receber"
                checked={formData.pagamento.receber}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="pagamento.receber" className="ml-2 block text-sm text-gray-700">
                Receber pagamento na entrega
              </label>
            </div>
          </div>
          
          {formData.pagamento.receber && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pagamento.forma" className="block text-sm font-medium text-gray-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    id="pagamento.forma"
                    name="pagamento.forma"
                    value={formData.pagamento.forma}
                    onChange={handlePagamentoChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors['pagamento.forma'] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">Selecione</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão</option>
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto</option>
                  </select>
                  {errors['pagamento.forma'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['pagamento.forma']}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="pagamento.valor" className="block text-sm font-medium text-gray-700 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    id="pagamento.valor"
                    name="pagamento.valor"
                    value={formData.pagamento.valor}
                    onChange={handlePagamentoChange}
                    step="0.01"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-md ${errors['pagamento.valor'] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {errors['pagamento.valor'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['pagamento.valor']}</p>
                  )}
                </div>
              </div>
              
              {formData.pagamento.forma === 'cartao' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pagamento.tipoCartao" className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Cartão
                    </label>
                    <select
                      id="pagamento.tipoCartao"
                      name="pagamento.tipoCartao"
                      value={formData.pagamento.tipoCartao}
                      onChange={handlePagamentoChange}
                      className={`w-full px-3 py-2 border rounded-md ${errors['pagamento.tipoCartao'] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">Selecione</option>
                      <option value="credito">Crédito</option>
                      <option value="debito">Débito</option>
                    </select>
                    {errors['pagamento.tipoCartao'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['pagamento.tipoCartao']}</p>
                    )}
                  </div>
                  
                  {formData.pagamento.tipoCartao === 'credito' && (
                    <div>
                      <label htmlFor="pagamento.parcelamento" className="block text-sm font-medium text-gray-700 mb-1">
                        Parcelamento
                      </label>
                      <select
                        id="pagamento.parcelamento"
                        name="pagamento.parcelamento"
                        value={formData.pagamento.parcelamento}
                        onChange={handlePagamentoChange}
                        className={`w-full px-3 py-2 border rounded-md ${errors['pagamento.parcelamento'] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value={1}>À vista</option>
                        {Array.from({ length: 11 }, (_, i) => i + 2).map(num => (
                          <option key={num} value={num}>{num}x</option>
                        ))}
                      </select>
                      {errors['pagamento.parcelamento'] && (
                        <p className="mt-1 text-sm text-red-600">{errors['pagamento.parcelamento']}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {formData.pagamento.forma === 'dinheiro' && (
                <div>
                  <label htmlFor="pagamento.troco" className="block text-sm font-medium text-gray-700 mb-1">
                    Troco para (R$)
                  </label>
                  <input
                    type="number"
                    id="pagamento.troco"
                    name="pagamento.troco"
                    value={formData.pagamento.troco || ''}
                    onChange={handlePagamentoChange}
                    step="0.01"
                    min="0"
                    placeholder="Deixe em branco se não precisar de troco"
                    className={`w-full px-3 py-2 border rounded-md ${errors['pagamento.troco'] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {errors['pagamento.troco'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['pagamento.troco']}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Observações */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium mb-4">Observações</h2>
          
          <div>
            <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
              Observações sobre a entrega ou pedido
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              rows={3}
              value={formData.observacoes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Informações adicionais sobre a entrega..."
            ></textarea>
          </div>
        </div>
        
        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            onClick={() => router.push('/dashboard/entregas/rotas')}
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="mr-2">
                  <LoaderCircle size={16} className="animate-spin" />
                </span>
                Salvando...
              </>
            ) : (
              'Revisar e Salvar Entrega'
            )}
          </button>
        </div>
      </form>

      {/* Modal de Confirmação */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Confirmar Dados da Entrega</h2>
              <p className="text-sm text-gray-500 mt-1">Verifique se os dados estão corretos antes de salvar</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informações da Entrega */}
              <div>
                <h3 className="text-lg font-medium mb-3">Informações da Entrega</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Número Tiny</p>
                    <p className="font-medium">{formData.numeroTiny || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data da Entrega</p>
                    <p className="font-medium">{new Date(formData.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Motorista</p>
                    <p className="font-medium">{formData.motorista || "Não atribuído"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Forma de Envio</p>
                    <p className="font-medium">{formData.formaEnvio || "-"}</p>
                  </div>
                </div>
              </div>
              
              {/* Cliente */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-3">Dados do Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nome</p>
                    <p className="font-medium">{formData.nomeCliente || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telefone</p>
                    <p className="font-medium">{formData.telefoneCliente || "-"}</p>
                  </div>
                </div>
              </div>
              
              {/* Endereço */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-3">Endereço de Entrega</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Logradouro e Número</p>
                    <p className="font-medium">
                      {formData.endereco.logradouro ? 
                        `${formData.endereco.logradouro}, ${formData.endereco.numero}` : 
                        "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bairro</p>
                    <p className="font-medium">{formData.endereco.bairro || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cidade</p>
                    <p className="font-medium">{formData.endereco.cidade || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CEP</p>
                    <p className="font-medium">{formData.endereco.cep || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Complemento</p>
                    <p className="font-medium">{formData.endereco.complemento || "-"}</p>
                  </div>
                </div>
              </div>
              
              {/* Pagamento */}
              {formData.pagamento.receber && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-3">Pagamento na Entrega</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Forma de Pagamento</p>
                      <p className="font-medium">
                        {formData.pagamento.forma === 'cartao' ? 
                          `Cartão de ${formData.pagamento.tipoCartao === 'credito' ? 'Crédito' : 'Débito'}` : 
                          formData.pagamento.forma.charAt(0).toUpperCase() + formData.pagamento.forma.slice(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Valor</p>
                      <p className="font-medium">{formatarPreco(formData.pagamento.valor)}</p>
                    </div>
                    
                    {formData.pagamento.forma === 'cartao' && formData.pagamento.tipoCartao === 'credito' && formData.pagamento.parcelamento && formData.pagamento.parcelamento > 1 && (
                      <div>
                        <p className="text-sm text-gray-500">Parcelamento</p>
                        <p className="font-medium">
                          {formData.pagamento.parcelamento}x de {formatarPreco(formData.pagamento.valor / formData.pagamento.parcelamento)}
                        </p>
                      </div>
                    )}
                    
                    {formData.pagamento.forma === 'dinheiro' && formData.pagamento.troco && (
                      <div>
                        <p className="text-sm text-gray-500">Troco para</p>
                        <p className="font-medium">{formatarPreco(formData.pagamento.troco)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Produtos */}
              {produtos.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-3">Produtos</h3>
                  <div className="overflow-x-auto border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Código
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Produto
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qtd.
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Valor
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {produtos.map((produto) => (
                          <tr key={produto.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">{produto.codigo}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{produto.nome}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{produto.quantidade}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatarPreco(produto.valor)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {formatarPreco(produto.valor * produto.quantidade)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td colSpan={4} className="px-4 py-3 text-sm font-medium text-right">
                            Total Geral:
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-right">
                            {formatarPreco(produtos.reduce((total, produto) => total + (produto.valor * produto.quantidade), 0))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Observações */}
              {formData.observacoes && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-2">Observações</h3>
                  <p className="text-gray-700 whitespace-pre-line">{formData.observacoes}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                onClick={cancelarConfirmacao}
              >
                Voltar e Editar
              </button>
              
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle size={16} className="inline mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Confirmar e Salvar Entrega'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 