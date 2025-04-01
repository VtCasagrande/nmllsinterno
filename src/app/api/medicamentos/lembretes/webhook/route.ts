import { NextRequest, NextResponse } from 'next/server';
import { LembreteMedicamento } from '@/types/medicamentos';
import { WebhookEventType, WebhookStatus, Webhook } from '@/types/webhooks';
import { lembretes, calcularProximoLembrete, lembreteAtivo } from '@/services/medicamentosService';

// Webhooks configurados no sistema
let webhooks: Webhook[] = []; // Em um cenário real, buscaria os webhooks do banco de dados

// Função para enviar o webhook
async function enviarWebhook(lembrete: LembreteMedicamento, medicamento: any) {
  try {
    // Buscar webhooks ativos para o evento LEMBRETE_MEDICAMENTO_ENVIADO
    const webhooksAtivos = webhooks.filter(wh => 
      wh.status === WebhookStatus.ATIVO && 
      wh.evento === WebhookEventType.LEMBRETE_MEDICAMENTO_ENVIADO
    );
    
    if (webhooksAtivos.length === 0) {
      // Cair no fallback da URL padrão se não houver webhooks configurados
      const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || 'https://webhook.site/';
      
      // Preparar os dados para o webhook
      const dados = {
        cliente: lembrete.cliente,
        pet: lembrete.pet,
        medicamento: {
          nome: medicamento.nome,
          quantidade: medicamento.quantidade,
          frequencia: medicamento.frequencia,
        },
        mensagem: medicamento.mensagemPersonalizada || `Olá, ${lembrete.cliente.nome}! Está na hora de dar ${medicamento.quantidade} de ${medicamento.nome} para o ${lembrete.pet.nome}.`,
        dataHora: new Date().toISOString(),
      };
      
      // Enviar o webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });
      
      if (!response.ok) {
        throw new Error(`Falha ao enviar webhook: ${response.status} ${response.statusText}`);
      }
      
      console.log(`Webhook enviado com sucesso para o lembrete ${lembrete.id}, medicamento ${medicamento.nome}`);
      return true;
    }
    
    // Enviar para cada webhook configurado
    const resultados = await Promise.all(webhooksAtivos.map(async webhook => {
      try {
        // Preparar os dados para o webhook
        const dados = {
          id: lembrete.id,
          cliente: lembrete.cliente,
          pet: lembrete.pet,
          medicamento: {
            nome: medicamento.nome,
            quantidade: medicamento.quantidade,
            frequencia: medicamento.frequencia,
          },
          mensagem: medicamento.mensagemPersonalizada || `Olá, ${lembrete.cliente.nome}! Está na hora de dar ${medicamento.quantidade} de ${medicamento.nome} para o ${lembrete.pet.nome}.`,
          dataHora: new Date().toISOString(),
          evento: WebhookEventType.LEMBRETE_MEDICAMENTO_ENVIADO
        };
        
        // Cabeçalhos padrão
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Adicionar chave secreta se disponível
        if (webhook.chaveSecreta) {
          headers['X-Webhook-Signature'] = webhook.chaveSecreta;
        }
        
        // Enviar o webhook
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(dados),
        });
        
        // Atualizar status do último disparo (em produção, isso seria persistido no banco de dados)
        webhook.ultimoDisparo = new Date().toISOString();
        webhook.ultimoStatusCode = response.status;
        
        // Verificar resposta
        if (!response.ok) {
          console.error(`Falha ao enviar webhook para ${webhook.url}: ${response.status} ${response.statusText}`);
          return false;
        }
        
        console.log(`Webhook enviado com sucesso para ${webhook.url}, lembrete ${lembrete.id}, medicamento ${medicamento.nome}`);
        return true;
      } catch (error) {
        console.error(`Erro ao enviar webhook para ${webhook.url}:`, error);
        return false;
      }
    }));
    
    // Retorna true se pelo menos um webhook foi enviado com sucesso
    return resultados.some(r => r);
  } catch (error) {
    console.error('Erro ao enviar webhook:', error);
    return false;
  }
}

// Função para processar os lembretes pendentes
async function processarLembretes() {
  const agora = new Date();
  const atualizacoes = [];
  
  for (let i = 0; i < lembretes.length; i++) {
    const lembrete = lembretes[i];
    
    // Pular lembretes inativos
    if (!lembrete.ativo) continue;
    
    // Verificar se há próximo lembrete e se está na hora
    if (lembrete.proximoLembrete && new Date(lembrete.proximoLembrete) <= agora) {
      // Identificar qual medicamento deve ser lembrado agora
      // (pode haver mais de um para o mesmo horário)
      const medicamentosParaLembrar = lembrete.medicamentos.filter(med => {
        // Verificar se o medicamento ainda está no período ativo
        if (!lembreteAtivo(med.dataFim)) return false;
        
        // Calcular quando seria o próximo lembrete para este medicamento
        const proximoLembreteMed = calcularProximoLembrete(med.dataInicio, med.frequencia);
        
        // Verificar se o próximo lembrete deste medicamento está na hora
        if (!lembrete.proximoLembrete) return false;
        
        return Math.abs(new Date(proximoLembreteMed).getTime() - new Date(lembrete.proximoLembrete).getTime()) < 60000; // 1 minuto de tolerância
      });
      
      // Enviar webhook para cada medicamento que precisa ser lembrado agora
      for (const medicamento of medicamentosParaLembrar) {
        await enviarWebhook(lembrete, medicamento);
      }
      
      // Calcular o próximo lembrete para cada medicamento
      let proximoLembrete: string | undefined;
      
      lembrete.medicamentos.forEach(med => {
        // Pular medicamentos fora do período ativo
        if (!lembreteAtivo(med.dataFim)) return;
        
        const proximaData = calcularProximoLembrete(med.dataInicio, med.frequencia);
        
        if (!proximoLembrete || new Date(proximaData) < new Date(proximoLembrete)) {
          proximoLembrete = proximaData;
        }
      });
      
      // Verificar se ainda existem medicamentos ativos
      const temMedicamentosAtivos = lembrete.medicamentos.some(med => lembreteAtivo(med.dataFim));
      
      // Atualizar o lembrete
      lembretes[i] = {
        ...lembrete,
        proximoLembrete,
        ativo: temMedicamentosAtivos && !!proximoLembrete,
        atualizadoEm: new Date().toISOString()
      };
      
      atualizacoes.push({
        id: lembrete.id,
        proximoLembrete,
        ativo: temMedicamentosAtivos && !!proximoLembrete
      });
    }
  }
  
  return atualizacoes;
}

// POST - Endpoint para processar lembretes manualmente ou via cron job
export async function POST(request: NextRequest) {
  try {
    // Autenticação básica para proteger o endpoint (em produção, usar um sistema mais robusto)
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.WEBHOOK_API_KEY;
    
    if (apiKey && (!authHeader || authHeader !== `Bearer ${apiKey}`)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Processar lembretes pendentes
    const atualizacoes = await processarLembretes();
    
    return NextResponse.json({
      message: 'Lembretes processados com sucesso',
      atualizacoes
    });
  } catch (error) {
    console.error('Erro ao processar lembretes:', error);
    return NextResponse.json({ error: 'Erro ao processar a requisição' }, { status: 500 });
  }
}