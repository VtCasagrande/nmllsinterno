'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTrocas } from '@/contexts/TrocasContext';
import { TrocaTipo } from '@/types/trocas';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';

// Definir schema de validação com Zod
const formSchema = z.object({
  tipo: z.enum([TrocaTipo.ENVIADA, TrocaTipo.RECEBIDA], {
    required_error: "Selecione o tipo de troca",
  }),
  ean: z.string().min(1, {
    message: "O código EAN/SKU é obrigatório",
  }),
  nomeProduto: z.string().min(1, {
    message: "O nome do produto é obrigatório",
  }),
  quantidade: z.coerce.number().int().positive({
    message: "A quantidade deve ser um número positivo",
  }),
  lojaParceira: z.string().min(1, {
    message: "O nome da loja parceira é obrigatório",
  }),
  responsavel: z.string().min(1, {
    message: "O nome do responsável é obrigatório",
  }),
  telefoneResponsavel: z.string().min(1, {
    message: "O telefone de contato é obrigatório",
  }),
  motivo: z.string().min(1, {
    message: "O motivo da troca é obrigatório",
  }),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NovaTrocaPage() {
  const router = useRouter();
  const { createTroca } = useTrocas();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar o formulário com React Hook Form + Zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: TrocaTipo.ENVIADA,
      ean: "",
      nomeProduto: "",
      quantidade: 1,
      lojaParceira: "",
      responsavel: profile?.name || "",
      telefoneResponsavel: "",
      motivo: "",
      observacoes: "",
    },
  });

  // Enviar o formulário
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const success = await createTroca(values);
      if (success) {
        toast({
          title: "Troca criada com sucesso",
          description: "A nova troca foi registrada no sistema",
          variant: "default",
        });
        router.push('/dashboard/trocas');
      }
    } catch (error) {
      console.error('Erro ao criar troca:', error);
      toast({
        title: "Erro ao criar troca",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao registrar a troca",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/trocas" className="text-blue-600 hover:text-blue-800 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Nova Troca</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Nova Troca</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-6">
                {/* Tipo de Troca */}
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Troca</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de troca" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TrocaTipo.ENVIADA}>Enviamos para outra loja</SelectItem>
                          <SelectItem value={TrocaTipo.RECEBIDA}>Recebemos de outra loja</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informações do Produto */}
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-lg font-medium mb-4">Informações do Produto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="ean"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código EAN/SKU</FormLabel>
                            <FormControl>
                              <Input placeholder="Digite o código do produto" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nomeProduto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Produto</FormLabel>
                            <FormControl>
                              <Input placeholder="Digite o nome do produto" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="quantidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1} 
                                placeholder="Quantidade" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Informações da Loja Parceira */}
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-lg font-medium mb-4">Loja Parceira</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="lojaParceira"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Loja</FormLabel>
                            <FormControl>
                              <Input placeholder="Digite o nome da loja parceira" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="responsavel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsável</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do responsável" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="telefoneResponsavel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone de Contato</FormLabel>
                            <FormControl>
                              <Input placeholder="(00) 00000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Detalhes Adicionais */}
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-lg font-medium mb-4">Detalhes Adicionais</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="motivo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Motivo da Troca</FormLabel>
                            <FormControl>
                              <Input placeholder="Explique o motivo da troca" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="observacoes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações (opcional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Informações adicionais sobre a troca" 
                                className="resize-none" 
                                rows={3} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  asChild
                >
                  <Link href="/dashboard/trocas">Cancelar</Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Troca'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 