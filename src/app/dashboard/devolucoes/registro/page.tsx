'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, X } from 'lucide-react';
import Image from 'next/image';

export default function RegistroDevolucaoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    responsavel: '',
    responsavel_recebimento: '',
    data_recebimento: new Date().toISOString().split('T')[0],
    hora_recebimento: new Date().toTimeString().split(' ')[0].substring(0, 5),
    observacoes: '',
  });
  
  const [fotos, setFotos] = useState<string[]>([]);
  const [previewFotos, setPreviewFotos] = useState<{ url: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Handler para mudanças nos inputs do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro quando o campo for preenchido
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Função para lidar com upload de imagens
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Limite de 5 fotos
      if (fotos.length + filesArray.length > 5) {
        setErrors(prev => ({ ...prev, fotos: 'Limite máximo de 5 fotos excedido' }));
        return;
      }
      
      // Limpando erros de fotos caso existam
      if (errors.fotos) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.fotos;
          return newErrors;
        });
      }
      
      // Criando URLs para preview
      const newPreviewFotos = filesArray.map(file => ({
        url: URL.createObjectURL(file),
        name: file.name
      }));
      
      setPreviewFotos(prev => [...prev, ...newPreviewFotos]);
      setFotos(prev => [...prev, ...filesArray.map(file => file.name)]);
    }
  };

  // Remover foto
  const removerFoto = (index: number) => {
    setPreviewFotos(fotos => fotos.filter((_, i) => i !== index));
    setFotos(fotos => fotos.filter((_, i) => i !== index));
  };

  // Validar formulário
  const validarFormulario = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.responsavel) newErrors.responsavel = 'Responsável pelo registro é obrigatório';
    if (!formData.responsavel_recebimento) newErrors.responsavel_recebimento = 'Responsável pelo recebimento é obrigatório';
    if (!formData.data_recebimento) newErrors.data_recebimento = 'Data de recebimento é obrigatória';
    if (!formData.hora_recebimento) newErrors.hora_recebimento = 'Hora de recebimento é obrigatória';
    if (fotos.length === 0) newErrors.fotos = 'Pelo menos uma foto da devolução é obrigatória';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Montando o objeto de devolução conforme a estrutura atualizada
      const novaDevolucao = {
        id: Math.floor(Math.random() * 10000), // Simulando um ID
        codigo: `DEV${Math.floor(1000 + Math.random() * 9000)}`, // Gerando um código automático
        produto: '',
        motivo: '',
        status: 'em_aberto',
        data: `${formData.data_recebimento}T${formData.hora_recebimento}:00`,
        responsavel: formData.responsavel,
        responsavel_recebimento: formData.responsavel_recebimento,
        responsavel_analise: '',
        observacoes: formData.observacoes,
        fotos: fotos,
        data_finalizacao: '',
        pedido_tiny: '',
        nota_fiscal: '',
        descricao: '',
        produtos: [] // Array para armazenar múltiplos produtos
      };
      
      // Aqui implementaremos a chamada para o backend mais tarde
      console.log('Enviando registro de devolução:', novaDevolucao);
      
      // Simulação de sucesso e redirecionamento
      setTimeout(() => {
        router.push('/dashboard/devolucoes/acompanhamento');
      }, 1000);
    } catch (error) {
      console.error('Erro ao registrar devolução:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Registro de Devolução</h1>
        <p className="text-gray-500 mt-1">Registre um novo produto para devolução</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium mb-4">Informações da Devolução</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="responsavel" className="block text-sm font-medium text-gray-700 mb-1">
                Responsável pelo Registro
              </label>
              <input
                type="text"
                id="responsavel"
                name="responsavel"
                value={formData.responsavel}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.responsavel ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.responsavel && (
                <p className="mt-1 text-sm text-red-600">{errors.responsavel}</p>
              )}
            </div>

            <div>
              <label htmlFor="responsavel_recebimento" className="block text-sm font-medium text-gray-700 mb-1">
                Responsável pelo Recebimento
              </label>
              <input
                type="text"
                id="responsavel_recebimento"
                name="responsavel_recebimento"
                value={formData.responsavel_recebimento}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.responsavel_recebimento ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.responsavel_recebimento && (
                <p className="mt-1 text-sm text-red-600">{errors.responsavel_recebimento}</p>
              )}
            </div>

            <div>
              <label htmlFor="data_recebimento" className="block text-sm font-medium text-gray-700 mb-1">
                Data do Recebimento
              </label>
              <input
                type="date"
                id="data_recebimento"
                name="data_recebimento"
                value={formData.data_recebimento}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.data_recebimento ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.data_recebimento && (
                <p className="mt-1 text-sm text-red-600">{errors.data_recebimento}</p>
              )}
            </div>

            <div>
              <label htmlFor="hora_recebimento" className="block text-sm font-medium text-gray-700 mb-1">
                Hora do Recebimento
              </label>
              <input
                type="time"
                id="hora_recebimento"
                name="hora_recebimento"
                value={formData.hora_recebimento}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.hora_recebimento ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.hora_recebimento && (
                <p className="mt-1 text-sm text-red-600">{errors.hora_recebimento}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                rows={3}
                value={formData.observacoes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Observações adicionais sobre a devolução"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium mb-4">Fotos do Produto</h2>
          
          {errors.fotos && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{errors.fotos}</p>
          )}
          
          <div className="mb-6">
            <label htmlFor="fotos" className="block text-sm font-medium text-gray-700 mb-1">
              Adicionar Fotos (máximo 5)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="fotos"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                  >
                    <span>Carregar fotos</span>
                    <input
                      id="fotos"
                      name="fotos"
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={handleImageUpload}
                      disabled={previewFotos.length >= 5}
                    />
                  </label>
                  <p className="pl-1">ou arraste e solte</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF até 10MB
                </p>
              </div>
            </div>
          </div>

          {previewFotos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {previewFotos.map((foto, index) => (
                <div key={index} className="relative">
                  <div className="aspect-square w-full rounded-md overflow-hidden border border-gray-300">
                    <div className="relative h-full w-full">
                      <Image
                        src={foto.url}
                        alt={`Foto ${index + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removerFoto(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full"
                  >
                    <X size={16} />
                  </button>
                  <p className="mt-1 text-xs text-gray-500 truncate">{foto.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => router.push('/dashboard/devolucoes/acompanhamento')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Salvando...' : 'Registrar Devolução'}
          </button>
        </div>
      </form>
    </div>
  );
} 