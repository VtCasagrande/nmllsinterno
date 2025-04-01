'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Clock, 
  Check, 
  X, 
  Pill,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { LembreteMedicamento } from '@/types/medicamentos';
import { useLembretesService } from '@/services/lembretes-medicamentos';
import { useLembretesMedicamentos } from '@/hooks/useLembretesMedicamentos';
import { AlertaProcessamentoLembretes } from './components/AlertaProcessamentoLembretes';

export default function LembretesMedicamentosPage() {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const { lembretes, loading, error, toggleAtivoStatus } = useLembretesService();
  const { processando, resultadoProcessamento, processarLembretes } = useLembretesMedicamentos();
  const [lembretesExibidos, setLembretesExibidos] = useState<LembreteMedicamento[]>([]);
  
  // Atualiza a lista de lembretes exibidos com base na busca
  useEffect(() => {
    if (!lembretes) return;
    
    if (!busca) {
      setLembretesExibidos(lembretes);
      return;
    }
    
    const buscaLowerCase = busca.toLowerCase();
    const filtrados = lembretes.filter(lembrete => 
      lembrete.cliente.nome.toLowerCase().includes(buscaLowerCase) ||
      lembrete.pet.nome.toLowerCase().includes(buscaLowerCase) ||
      lembrete.medicamentos.some(med => med.nome.toLowerCase().includes(buscaLowerCase))
    );
    
    setLembretesExibidos(filtrados);
  }, [lembretes, busca]);
  
  // Formatar data para exibição
  const formatarData = (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Navegar para o formulário de edição
  const editarLembrete = (id: string) => {
    router.push(`/dashboard/medicamentos/lembretes/editar/${id}`);
  };

  // Alternar status ativo/inativo do lembrete
  const alternarStatusAtivo = async (id: string, novoStatus: boolean) => {
    await toggleAtivoStatus(id, novoStatus);
  };

  const handleProcessarLembretes = async () => {
    await processarLembretes();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lembretes de Medicamentos</h1>
          <p className="text-gray-500 mt-1">Gerencie os lembretes de medicamentos</p>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handleProcessarLembretes}
            disabled={processando}
          >
            <Clock className="mr-2 h-4 w-4" />
            {processando ? 'Processando...' : 'Processar Lembretes'}
          </Button>
          
          <Button onClick={() => router.push('/dashboard/medicamentos/lembretes/novo')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lembrete
          </Button>
        </div>
      </div>
      
      {resultadoProcessamento && (
        <AlertaProcessamentoLembretes 
          resultado={resultadoProcessamento} 
          onClose={() => {}} 
        />
      )}
      
      <div className="flex items-center space-x-2">
        <Search className="h-5 w-5 text-gray-400" />
        <Input
          placeholder="Buscar por cliente, pet ou medicamento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Erro ao carregar lembretes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : lembretesExibidos.length === 0 ? (
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-800 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Nenhum lembrete encontrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {busca 
                ? "Não foram encontrados lembretes correspondentes à sua busca." 
                : "Não há lembretes cadastrados. Clique em 'Novo Lembrete' para adicionar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pet</TableHead>
                  <TableHead>Medicamentos</TableHead>
                  <TableHead>Próximo Lembrete</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lembretesExibidos.map((lembrete) => (
                  <TableRow key={lembrete.id}>
                    <TableCell className="font-medium">{lembrete.cliente.nome}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="truncate max-w-[150px]">{lembrete.pet.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 max-w-[200px]">
                        {lembrete.medicamentos.slice(0, 2).map((med, index) => (
                          <Badge key={index} variant="outline" className="flex items-center py-1">
                            <Pill className="h-3 w-3 mr-1" />
                            <span className="truncate">{med.nome}</span>
                          </Badge>
                        ))}
                        {lembrete.medicamentos.length > 2 && (
                          <Badge variant="secondary" className="py-1">
                            +{lembrete.medicamentos.length - 2} medicamentos
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lembrete.proximoLembrete ? (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                          <span>{formatarData(lembrete.proximoLembrete)}</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          Não agendado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={lembrete.ativo ? "default" : "secondary"} className={lembrete.ativo ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                        {lembrete.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => editarLembrete(lembrete.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant={lembrete.ativo ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => alternarStatusAtivo(lembrete.id, !lembrete.ativo)}
                        >
                          {lembrete.ativo 
                            ? <X className="h-4 w-4" /> 
                            : <Check className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
} 