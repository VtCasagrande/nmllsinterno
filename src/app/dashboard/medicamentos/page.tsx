'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  PlusCircle, 
  Search, 
  CheckCircle, 
  XCircle, 
  FileEdit, 
  Trash2, 
  AlertCircle,
  Pill 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { LembreteMedicamento } from '@/types/medicamentos';
import { getLembretesMedicamentos, alterarStatusLembreteMedicamento, excluirLembreteMedicamento } from '@/lib/api/medicamentos';
import { useToast } from '@/components/ui/use-toast';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

export default function LembretesMedicamentos() {
  const [lembretes, setLembretes] = useState<LembreteMedicamento[]>([]);
  const [filteredLembretes, setFilteredLembretes] = useState<LembreteMedicamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    carregarLembretes();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredLembretes(lembretes);
    } else {
      const termLower = searchTerm.toLowerCase();
      const filtered = lembretes.filter(
        lembrete => 
          lembrete.cliente.nome.toLowerCase().includes(termLower) ||
          lembrete.pet.nome.toLowerCase().includes(termLower) ||
          lembrete.medicamentos.some(m => m.nome.toLowerCase().includes(termLower))
      );
      setFilteredLembretes(filtered);
    }
  }, [searchTerm, lembretes]);

  const carregarLembretes = async () => {
    setIsLoading(true);
    try {
      const data = await getLembretesMedicamentos();
      setLembretes(data);
      setFilteredLembretes(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar lembretes",
        description: "Ocorreu um erro ao carregar os lembretes de medicamentos. Tente novamente mais tarde.",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlterarStatus = async (id: string, novoStatus: boolean) => {
    try {
      await alterarStatusLembreteMedicamento(id, novoStatus);
      
      // Atualiza o estado local
      setLembretes(prevLembretes => 
        prevLembretes.map(lembrete => 
          lembrete.id === id ? { ...lembrete, ativo: novoStatus } : lembrete
        )
      );
      
      toast({
        title: novoStatus ? "Lembrete ativado" : "Lembrete desativado",
        description: `O lembrete foi ${novoStatus ? 'ativado' : 'desativado'} com sucesso.`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro ao alterar status",
        description: `Ocorreu um erro ao ${novoStatus ? 'ativar' : 'desativar'} o lembrete.`,
        variant: "destructive"
      });
      console.error(error);
    }
  };

  const handleExcluirLembrete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lembrete?')) return;
    
    try {
      await excluirLembreteMedicamento(id);
      
      // Atualiza o estado local
      setLembretes(prevLembretes => prevLembretes.filter(lembrete => lembrete.id !== id));
      
      toast({
        title: "Lembrete excluído",
        description: "O lembrete foi excluído com sucesso.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o lembrete.",
        variant: "destructive"
      });
      console.error(error);
    }
  };

  const formatarData = (dataString: string) => {
    try {
      return format(new Date(dataString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Pill className="h-6 w-6 mr-2 text-blue-600" />
          <h1 className="text-2xl font-bold">Lembretes de Medicamentos</h1>
        </div>
        <Link
          href="/dashboard/medicamentos/novo"
          className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Novo Lembrete
        </Link>
      </div>

      {/* Barra de pesquisa */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por cliente, pet ou medicamento..."
          className="pl-10 p-2 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredLembretes.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lembrete encontrado</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Não encontramos resultados para sua busca. Tente outros termos.' : 'Cadastre seu primeiro lembrete de medicamento.'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Pet</TableHead>
                <TableHead>Medicamento</TableHead>
                <TableHead>Próximo Lembrete</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLembretes.map((lembrete) => (
                <TableRow key={lembrete.id}>
                  <TableCell className="font-medium">{lembrete.cliente.nome}</TableCell>
                  <TableCell>{lembrete.pet.nome} {lembrete.pet.raca && <span className="text-gray-500 text-xs">({lembrete.pet.raca})</span>}</TableCell>
                  <TableCell>
                    {lembrete.medicamentos.map((med, index) => (
                      <div key={med.id} className={index > 0 ? 'mt-1' : ''}>
                        {med.nome}
                        <span className="text-xs text-gray-500 block">
                          {med.quantidade} a cada {med.frequencia.valor} {med.frequencia.unidade}
                        </span>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    {lembrete.proximoLembrete 
                      ? formatarData(lembrete.proximoLembrete)
                      : <span className="text-gray-500">Não agendado</span>
                    }
                  </TableCell>
                  <TableCell>
                    {lembrete.ativo ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{lembrete.criador}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link
                      href={`/dashboard/medicamentos/${lembrete.id}`}
                      className="inline-flex items-center p-1 text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <FileEdit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleAlterarStatus(lembrete.id, !lembrete.ativo)}
                      className={`inline-flex items-center p-1 ${lembrete.ativo ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                      title={lembrete.ativo ? "Desativar" : "Ativar"}
                    >
                      {lembrete.ativo ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleExcluirLembrete(lembrete.id)}
                      className="inline-flex items-center p-1 text-red-600 hover:text-red-800"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
} 