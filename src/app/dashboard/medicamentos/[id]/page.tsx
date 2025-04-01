'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, Pill } from 'lucide-react';
import { format } from 'date-fns';

import { 
  MedicamentoFormValues, 
  LembreteMedicamento, 
  LembreteMedicamentoFormValues, 
  unidadesFrequencia 
} from '@/types/medicamentos';
import { 
  getLembreteMedicamento, 
  atualizarLembreteMedicamento 
} from '@/lib/api/medicamentos';
import { useToast } from '@/components/ui/use-toast';

interface Erros {
  [key: string]: string;
}

export default function EditarLembreteMedicamento({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = params;
  
  // Estado para novo medicamento
  const [novoMedicamento, setNovoMedicamento] = useState<MedicamentoFormValues>({
    nome: '',
    quantidade: '',
    frequencia: {
      valor: 1,
      unidade: 'horas'
    },
    dataInicio: format(new Date(), 'yyyy-MM-dd'),
    dataFim: '',
    mensagemPersonalizada: ''
  });
  
  // Estado principal do formulário
  const [formData, setFormData] = useState<LembreteMedicamentoFormValues>({
    cliente: {
      nome: '',
      telefone: ''
    },
    pet: {
      nome: '',
      raca: ''
    },
    medicamentos: [],
    observacoes: ''
  });
  
  // Estado para validação e submissão
  const [errors, setErrors] = useState<Erros>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    carregarLembrete();
  }, [id]);
  
  const carregarLembrete = async () => {
    setIsLoading(true);
    try {
      const lembrete = await getLembreteMedicamento(id);
      
      // Converter para o formato do formulário
      setFormData({
        cliente: {
          nome: lembrete.cliente.nome,
          telefone: lembrete.cliente.telefone
        },
        pet: {
          nome: lembrete.pet.nome,
          raca: lembrete.pet.raca || ''
        },
        medicamentos: lembrete.medicamentos.map(med => ({
          nome: med.nome,
          quantidade: med.quantidade,
          frequencia: {
            valor: med.frequencia.valor,
            unidade: med.frequencia.unidade
          },
          dataInicio: med.dataInicio,
          dataFim: med.dataFim,
          mensagemPersonalizada: med.mensagemPersonalizada || ''
        })),
        observacoes: lembrete.observacoes || ''
      });
    } catch (error) {
      console.error('Erro ao carregar lembrete:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do lembrete. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manipuladores de mudança
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Manipula campos aninhados
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof LembreteMedicamentoFormValues],
          [child]: value
        }
      }));
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

  // Manipuladores de medicamento
  const handleMedicamentoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      if (parent === 'frequencia') {
        setNovoMedicamento(prev => ({
          ...prev,
          frequencia: {
            ...prev.frequencia,
            [child]: child === 'valor' ? Number(value) : value
          }
        }));
      } else {
        setNovoMedicamento(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent as keyof MedicamentoFormValues],
            [child]: value
          }
        }));
      }
    } else {
      setNovoMedicamento(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleEditMedicamento = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updatedMedicamentos = [...prev.medicamentos];
      
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (parent === 'frequencia') {
          updatedMedicamentos[index] = {
            ...updatedMedicamentos[index],
            frequencia: {
              ...updatedMedicamentos[index].frequencia,
              [child]: child === 'valor' ? Number(value) : value
            }
          };
        }
      } else {
        updatedMedicamentos[index] = {
          ...updatedMedicamentos[index],
          [field]: value
        };
      }
      
      return {
        ...prev,
        medicamentos: updatedMedicamentos
      };
    });
  };
  
  const adicionarMedicamento = () => {
    // Validação
    const medicamentoErrors: Erros = {};
    
    if (!novoMedicamento.nome) {
      medicamentoErrors['medicamento.nome'] = 'Nome do medicamento é obrigatório';
    }
    
    if (!novoMedicamento.quantidade) {
      medicamentoErrors['medicamento.quantidade'] = 'Quantidade é obrigatória';
    }
    
    if (!novoMedicamento.frequencia.valor || novoMedicamento.frequencia.valor <= 0) {
      medicamentoErrors['medicamento.frequencia.valor'] = 'Valor da frequência deve ser maior que zero';
    }
    
    if (!novoMedicamento.dataInicio) {
      medicamentoErrors['medicamento.dataInicio'] = 'Data de início é obrigatória';
    }
    
    if (!novoMedicamento.dataFim) {
      medicamentoErrors['medicamento.dataFim'] = 'Data de fim é obrigatória';
    }
    
    // Se houver erros, exibe-os e interrompe
    if (Object.keys(medicamentoErrors).length > 0) {
      setErrors(prev => ({
        ...prev,
        ...medicamentoErrors
      }));
      return;
    }
    
    // Adiciona o medicamento à lista
    setFormData(prev => ({
      ...prev,
      medicamentos: [...prev.medicamentos, novoMedicamento]
    }));
    
    // Limpa o formulário de novo medicamento
    setNovoMedicamento({
      nome: '',
      quantidade: '',
      frequencia: {
        valor: 1,
        unidade: 'horas'
      },
      dataInicio: format(new Date(), 'yyyy-MM-dd'),
      dataFim: '',
      mensagemPersonalizada: ''
    });
    
    // Limpa erros de medicamentos se existirem
    if (errors.medicamentos) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.medicamentos;
        return newErrors;
      });
    }
  };
  
  const removerMedicamento = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicamentos: prev.medicamentos.filter((_, i) => i !== index)
    }));
  };
  
  const validarFormulario = (): boolean => {
    const novosErros: Erros = {};
    
    // Validação do cliente
    if (!formData.cliente.nome) {
      novosErros['cliente.nome'] = 'Nome do cliente é obrigatório';
    }
    
    if (!formData.cliente.telefone) {
      novosErros['cliente.telefone'] = 'Telefone do cliente é obrigatório';
    }
    
    // Validação do pet
    if (!formData.pet.nome) {
      novosErros['pet.nome'] = 'Nome do pet é obrigatório';
    }
    
    // Validação dos medicamentos
    if (formData.medicamentos.length === 0) {
      novosErros['medicamentos'] = 'Adicione pelo menos um medicamento';
    }
    
    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      toast({
        title: "Formulário inválido",
        description: "Por favor, corrija os erros antes de salvar.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await atualizarLembreteMedicamento(id, formData);
      
      toast({
        title: "Lembrete atualizado com sucesso",
        description: "O lembrete de medicamento foi atualizado.",
        variant: "default"
      });
      
      // Redireciona para a lista
      router.push('/dashboard/medicamentos');
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o lembrete. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Link href="/dashboard/medicamentos" className="mr-4 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Pill className="h-6 w-6 mr-2 text-blue-600" />
          <h1 className="text-2xl font-bold">Editar Lembrete de Medicamento</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/medicamentos" className="mr-4 p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Pill className="h-6 w-6 mr-2 text-blue-600" />
        <h1 className="text-2xl font-bold">Editar Lembrete de Medicamento</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção do cliente */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Informações do Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cliente.nome" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Cliente*
              </label>
              <input
                type="text"
                id="cliente.nome"
                name="cliente.nome"
                value={formData.cliente.nome}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${errors['cliente.nome'] ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors['cliente.nome'] && (
                <p className="mt-1 text-sm text-red-600">{errors['cliente.nome']}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="cliente.telefone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefone*
              </label>
              <input
                type="tel"
                id="cliente.telefone"
                name="cliente.telefone"
                value={formData.cliente.telefone}
                onChange={handleInputChange}
                placeholder="(00) 00000-0000"
                className={`w-full p-2 border rounded-md ${errors['cliente.telefone'] ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors['cliente.telefone'] && (
                <p className="mt-1 text-sm text-red-600">{errors['cliente.telefone']}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Seção do pet */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Informações do Pet</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pet.nome" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Pet*
              </label>
              <input
                type="text"
                id="pet.nome"
                name="pet.nome"
                value={formData.pet.nome}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${errors['pet.nome'] ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors['pet.nome'] && (
                <p className="mt-1 text-sm text-red-600">{errors['pet.nome']}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="pet.raca" className="block text-sm font-medium text-gray-700 mb-1">
                Raça (opcional)
              </label>
              <input
                type="text"
                id="pet.raca"
                name="pet.raca"
                value={formData.pet.raca}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
        
        {/* Seção de medicamentos */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Medicamentos</h2>
          
          {/* Lista de medicamentos */}
          {formData.medicamentos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Medicamentos adicionados</h3>
              <div className="space-y-3">
                {formData.medicamentos.map((medicamento, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium">{medicamento.nome}</p>
                      <p className="text-sm text-gray-600">
                        {medicamento.quantidade} a cada {medicamento.frequencia.valor} {medicamento.frequencia.unidade}
                      </p>
                      <p className="text-xs text-gray-500">
                        De {new Date(medicamento.dataInicio).toLocaleDateString()} até {new Date(medicamento.dataFim).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerMedicamento(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {errors['medicamentos'] && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors['medicamentos']}
              </p>
            </div>
          )}
          
          {/* Formulário para novo medicamento */}
          <div className="border border-gray-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Adicionar medicamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Medicamento*
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={novoMedicamento.nome}
                  onChange={handleMedicamentoChange}
                  className={`w-full p-2 border rounded-md ${errors['medicamento.nome'] ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors['medicamento.nome'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['medicamento.nome']}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="quantidade" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade*
                </label>
                <input
                  type="text"
                  id="quantidade"
                  name="quantidade"
                  value={novoMedicamento.quantidade}
                  onChange={handleMedicamentoChange}
                  placeholder="Ex: 1 comprimido, 10ml"
                  className={`w-full p-2 border rounded-md ${errors['medicamento.quantidade'] ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors['medicamento.quantidade'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['medicamento.quantidade']}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequência*
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      id="frequencia.valor"
                      name="frequencia.valor"
                      value={novoMedicamento.frequencia.valor}
                      onChange={handleMedicamentoChange}
                      min="1"
                      className={`w-full p-2 border rounded-md ${errors['medicamento.frequencia.valor'] ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors['medicamento.frequencia.valor'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['medicamento.frequencia.valor']}</p>
                    )}
                  </div>
                  <div>
                    <select
                      id="frequencia.unidade"
                      name="frequencia.unidade"
                      value={novoMedicamento.frequencia.unidade}
                      onChange={handleMedicamentoChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {unidadesFrequencia.map(unidade => (
                        <option key={unidade.valor} value={unidade.valor}>{unidade.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="dataInicio" className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Início*
                </label>
                <input
                  type="date"
                  id="dataInicio"
                  name="dataInicio"
                  value={novoMedicamento.dataInicio}
                  onChange={handleMedicamentoChange}
                  className={`w-full p-2 border rounded-md ${errors['medicamento.dataInicio'] ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors['medicamento.dataInicio'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['medicamento.dataInicio']}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="dataFim" className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Fim*
                </label>
                <input
                  type="date"
                  id="dataFim"
                  name="dataFim"
                  value={novoMedicamento.dataFim}
                  onChange={handleMedicamentoChange}
                  className={`w-full p-2 border rounded-md ${errors['medicamento.dataFim'] ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors['medicamento.dataFim'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['medicamento.dataFim']}</p>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="mensagemPersonalizada" className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem Personalizada (opcional)
              </label>
              <textarea
                id="mensagemPersonalizada"
                name="mensagemPersonalizada"
                value={novoMedicamento.mensagemPersonalizada}
                onChange={handleMedicamentoChange}
                rows={3}
                placeholder="Mensagem personalizada para envio no lembrete"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <button
              type="button"
              onClick={adicionarMedicamento}
              className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Medicamento
            </button>
          </div>
        </div>
        
        {/* Observações */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
              Observações (opcional)
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        {/* Botões */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/dashboard/medicamentos"
            className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Atualizar Lembrete
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 