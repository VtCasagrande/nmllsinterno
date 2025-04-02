'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertTriangle,
  Package,
  CreditCard,
  Trash,
  BadgeCheck,
  BadgeX
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { rotasService } from '@/services/rotasService';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useEntregas } from '@/contexts/EntregasContext';

export default function EditarRotaPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { recarregarEntregas, motoristas } = useEntregas();
  
  const [rota, setRota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome_cliente: '',
    telefone_cliente: '',
    endereco: '',
    complemento: '',
    cidade: '',
    cep: '',
    data_entrega: '',
    horario_maximo: '',
    observacoes: '',
    motorista_id: '',
    status: ''
  });
  
  // Estado para itens
  const [itens, setItens] = useState([]);
  // Estado para pagamentos
  const [pagamentos, setPagamentos] = useState([]);
  
  // Opções para o status
  const statusOptions = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'atribuida', label: 'Atribuída' },
    { value: 'em_andamento', label: 'Em Andamento' },
    { value: 'concluida', label: 'Concluída' },
    { value: 'cancelada', label: 'Cancelada' },
    { value: 'com_problema', label: 'Com Problema' }
  ];
  
  // Carregar dados da rota
  useEffect(() => {
    async function carregarRota() {
      if (!params.id) return;
      
      try {
        setLoading(true);
        const rotaData = await rotasService.buscarRotaPorId(params.id);
        
        if (!rotaData) {
          setErro('Rota não encontrada');
          setLoading(false);
          return;
        }
        
        setRota(rotaData);
        
        // Preencher o formulário com os dados da rota
        setFormData({
          nome_cliente: rotaData.nome_cliente || '',
          telefone_cliente: rotaData.telefone_cliente || '',
          endereco: rotaData.endereco || '',
          complemento: rotaData.complemento || '',
          cidade: rotaData.cidade || '',
          cep: rotaData.cep || '',
          data_entrega: rotaData.data_entrega || '',
          horario_maximo: rotaData.horario_maximo || '',
          observacoes: rotaData.observacoes || '',
          motorista_id: rotaData.motorista_id || '',
          status: rotaData.status || 'pendente'
        });
        
        // Preencher itens
        if (rotaData.itens) {
          setItens(rotaData.itens);
        }
        
        // Preencher pagamentos
        if (rotaData.pagamentos) {
          setPagamentos(rotaData.pagamentos);
        }
        
        setErro(null);
      } catch (error) {
        console.error('Erro ao carregar rota:', error);
        setErro('Erro ao carregar dados da rota');
      } finally {
        setLoading(false);
      }
    }
    
    carregarRota();
  }, [params.id]);
  
  // Lidar com alterações no formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Lidar com alterações em campos select
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Lidar com alterações nos itens
  const handleItemChange = (index, field, value) => {
    const novosItens = [...itens];
    novosItens[index] = {
      ...novosItens[index],
      [field]: field === 'quantidade' || field === 'valor_unitario' ? parseFloat(value) : value
    };
    setItens(novosItens);
  };
  
  // Adicionar novo item
  const adicionarItem = () => {
    setItens([
      ...itens,
      {
        id: `temp_${Date.now()}`,
        descricao: '',
        quantidade: 1,
        valor_unitario: 0
      }
    ]);
  };
  
  // Remover item
  const removerItem = (index) => {
    const novosItens = [...itens];
    novosItens.splice(index, 1);
    setItens(novosItens);
  };
  
  // Lidar com alterações nos pagamentos
  const handlePagamentoChange = (index, field, value) => {
    const novosPagamentos = [...pagamentos];
    novosPagamentos[index] = {
      ...novosPagamentos[index],
      [field]: field === 'valor' || field === 'parcelas' ? parseFloat(value) : value,
      [field === 'parcelas' && value > 1 ? 'parcelado' : null]: field === 'parcelas' && value > 1 ? true : undefined
    };
    setPagamentos(novosPagamentos);
  };
  
  // Adicionar novo pagamento
  const adicionarPagamento = () => {
    setPagamentos([
      ...pagamentos,
      {
        id: `temp_${Date.now()}`,
        tipo: 'dinheiro',
        valor: 0,
        parcelado: false,
        parcelas: 1,
        recebido: false
      }
    ]);
  };
  
  // Remover pagamento
  const removerPagamento = (index) => {
    const novosPagamentos = [...pagamentos];
    novosPagamentos.splice(index, 1);
    setPagamentos(novosPagamentos);
  };
  
  // Salvar alterações
  const salvarRota = async () => {
    try {
      setSaving(true);
      
      // Validar campos obrigatórios
      if (!formData.nome_cliente || !formData.endereco || !formData.cidade) {
        toast({
          title: "Erro ao salvar",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }
      
      // Preparar dados para atualização
      const dadosAtualizados = {
        ...formData,
        itens: itens.map(item => ({
          id: item.id && !item.id.startsWith('temp_') ? item.id : undefined,
          descricao: item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario
        })),
        pagamentos: pagamentos.map(pagto => ({
          id: pagto.id && !pagto.id.startsWith('temp_') ? pagto.id : undefined,
          tipo: pagto.tipo,
          valor: pagto.valor,
          parcelado: pagto.parcelado,
          parcelas: pagto.parcelas,
          recebido: pagto.recebido
        }))
      };
      
      // ID do usuário que está fazendo a edição
      const userId = profile?.id || 'sistema';
      
      // Atualizar a rota
      await rotasService.atualizarRota(params.id, dadosAtualizados, userId);
      
      // Recarregar dados atualizados no contexto
      await recarregarEntregas();
      
      toast({
        title: "Rota atualizada",
        description: "Rota atualizada com sucesso",
      });
      
      // Redirecionar para a página de detalhes
      router.push(`/dashboard/entregas/detalhe/${params.id}`);
    } catch (error) {
      console.error('Erro ao salvar rota:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao atualizar a rota",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500">Carregando dados da rota...</p>
      </div>
    );
  }
  
  if (erro) {
    return (
      <div className="p-4 md:p-8">
        <Link href="/dashboard/entregas/rotas" className="flex items-center text-blue-600 mb-6">
          <ArrowLeft size={16} className="mr-2" />
          Voltar para lista de rotas
        </Link>
        
        <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center max-w-lg mx-auto">
          <div className="rounded-full bg-red-100 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar rota</h2>
          <p className="text-red-600">{erro}</p>
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard/entregas/rotas')}
            className="mt-4"
          >
            Voltar para lista
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/entregas/rotas" className="text-blue-600 hover:text-blue-800">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Editar Rota</h1>
        </div>
        
        <Button 
          onClick={salvarRota} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Alterações
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Dados principais - 8 colunas */}
        <div className="md:col-span-8 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Cliente</CardTitle>
              <CardDescription>Informações sobre o cliente e endereço da entrega</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_cliente" className="flex items-center gap-1">
                    <User size={14} />
                    Nome do Cliente *
                  </Label>
                  <Input
                    id="nome_cliente"
                    name="nome_cliente"
                    value={formData.nome_cliente}
                    onChange={handleInputChange}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telefone_cliente" className="flex items-center gap-1">
                    <Phone size={14} />
                    Telefone
                  </Label>
                  <Input
                    id="telefone_cliente"
                    name="telefone_cliente"
                    value={formData.telefone_cliente}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endereco" className="flex items-center gap-1">
                  <MapPin size={14} />
                  Endereço *
                </Label>
                <Input
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleInputChange}
                  placeholder="Rua, número, bairro"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="complemento">
                    Complemento
                  </Label>
                  <Input
                    id="complemento"
                    name="complemento"
                    value={formData.complemento}
                    onChange={handleInputChange}
                    placeholder="Apto, bloco, referência"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cidade" className="flex items-center gap-1">
                    Cidade *
                  </Label>
                  <Input
                    id="cidade"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleInputChange}
                    placeholder="Cidade"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cep" className="flex items-center gap-1">
                    CEP
                  </Label>
                  <Input
                    id="cep"
                    name="cep"
                    value={formData.cep}
                    onChange={handleInputChange}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Itens da Entrega</CardTitle>
              <CardDescription>Produtos incluídos nesta entrega</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {itens.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-md">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Nenhum item adicionado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {itens.map((item, index) => (
                    <div key={item.id || index} className="grid grid-cols-12 gap-4 border-b pb-3">
                      <div className="col-span-12 md:col-span-6">
                        <Label htmlFor={`item-descricao-${index}`}>Descrição</Label>
                        <Input
                          id={`item-descricao-${index}`}
                          value={item.descricao}
                          onChange={(e) => handleItemChange(index, 'descricao', e.target.value)}
                          placeholder="Descrição do produto"
                        />
                      </div>
                      
                      <div className="col-span-5 md:col-span-2">
                        <Label htmlFor={`item-quantidade-${index}`}>Qtd</Label>
                        <Input
                          id={`item-quantidade-${index}`}
                          type="number"
                          min="1"
                          value={item.quantidade}
                          onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                        />
                      </div>
                      
                      <div className="col-span-5 md:col-span-3">
                        <Label htmlFor={`item-valor-${index}`}>Valor Unitário</Label>
                        <Input
                          id={`item-valor-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.valor_unitario}
                          onChange={(e) => handleItemChange(index, 'valor_unitario', e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                      
                      <div className="col-span-2 md:col-span-1 flex items-end justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removerItem(index)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={adicionarItem}
                className="mt-4"
              >
                Adicionar Item
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos</CardTitle>
              <CardDescription>Formas de pagamento para esta entrega</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pagamentos.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-md">
                  <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Nenhum pagamento adicionado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pagamentos.map((pagamento, index) => (
                    <div key={pagamento.id || index} className="grid grid-cols-12 gap-4 border-b pb-3">
                      <div className="col-span-12 md:col-span-3">
                        <Label htmlFor={`pagamento-tipo-${index}`}>Tipo</Label>
                        <Select
                          value={pagamento.tipo}
                          onValueChange={(value) => handlePagamentoChange(index, 'tipo', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="cartao">Cartão</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="col-span-6 md:col-span-3">
                        <Label htmlFor={`pagamento-valor-${index}`}>Valor</Label>
                        <Input
                          id={`pagamento-valor-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={pagamento.valor}
                          onChange={(e) => handlePagamentoChange(index, 'valor', e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                      
                      {pagamento.tipo === 'cartao' && (
                        <div className="col-span-6 md:col-span-2">
                          <Label htmlFor={`pagamento-parcelas-${index}`}>Parcelas</Label>
                          <Input
                            id={`pagamento-parcelas-${index}`}
                            type="number"
                            min="1"
                            max="12"
                            value={pagamento.parcelas}
                            onChange={(e) => handlePagamentoChange(index, 'parcelas', e.target.value)}
                          />
                        </div>
                      )}
                      
                      <div className="col-span-8 md:col-span-2 flex items-end">
                        <div className="flex items-center h-10 space-x-2">
                          <input
                            type="checkbox"
                            id={`pagamento-recebido-${index}`}
                            checked={pagamento.recebido}
                            onChange={(e) => handlePagamentoChange(index, 'recebido', e.target.checked)}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`pagamento-recebido-${index}`} className="text-sm font-normal">
                            Recebido
                          </Label>
                        </div>
                      </div>
                      
                      <div className="col-span-4 md:col-span-2 flex items-end justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removerPagamento(index)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={adicionarPagamento}
                className="mt-4"
              >
                Adicionar Pagamento
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Barra lateral - 4 colunas */}
        <div className="md:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status da Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status atual</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="motorista_id">Motorista</Label>
                  <Select
                    value={formData.motorista_id || ''}
                    onValueChange={(value) => handleSelectChange('motorista_id', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um motorista" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem motorista</SelectItem>
                      {motoristas.map(motorista => (
                        <SelectItem key={motorista.id} value={motorista.id}>
                          {motorista.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="data_entrega" className="flex items-center gap-1">
                    <Calendar size={14} />
                    Data de Entrega
                  </Label>
                  <Input
                    id="data_entrega"
                    name="data_entrega"
                    type="date"
                    value={formData.data_entrega}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="horario_maximo" className="flex items-center gap-1">
                    <Clock size={14} />
                    Horário Máximo
                  </Label>
                  <Input
                    id="horario_maximo"
                    name="horario_maximo"
                    type="time"
                    value={formData.horario_maximo}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleInputChange}
                placeholder="Instruções especiais para entrega"
                rows={4}
              />
            </CardContent>
          </Card>
          
          {rota && (
            <Card>
              <CardHeader>
                <CardTitle>Informações da Rota</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Código:</span>
                    <span className="font-medium">{rota.codigo || rota.numero_pedido}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Criado em:</span>
                    <span className="font-medium">
                      {new Date(rota.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Última atualização:</span>
                    <span className="font-medium">
                      {new Date(rota.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 