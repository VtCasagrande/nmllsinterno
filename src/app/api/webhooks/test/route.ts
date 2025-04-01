import { NextResponse } from 'next/server';
import { WebhookEventType, SugestaoEventPayload } from '@/types/webhooks';

/**
 * API para testar o disparo manual de webhooks de sugestão
 * Esta é uma API auxiliar para testes, que permite simular o disparo
 * de um webhook manualmente, sem precisar criar/atualizar uma sugestão
 */
export async function POST(request: Request) {
  try {
    // Obter os dados da requisição
    const data = await request.json();
    const { evento, url, sugestaoId, nomeProduto, ean } = data;
    
    // Validar dados básicos
    if (!evento || !url || !sugestaoId || !nomeProduto) {
      return NextResponse.json(
        { error: 'Bad Request: Dados incompletos' },
        { status: 400 }
      );
    }
    
    // Validar se o evento é de sugestão
    if (
      evento !== WebhookEventType.SUGESTAO_CRIADA &&
      evento !== WebhookEventType.SUGESTAO_PEDIDO_REALIZADO &&
      evento !== WebhookEventType.SUGESTAO_PRODUTO_CHEGOU
    ) {
      return NextResponse.json(
        { error: 'Bad Request: Tipo de evento não é relacionado a sugestões' },
        { status: 400 }
      );
    }
    
    // Criar o payload do webhook
    const payload: SugestaoEventPayload = {
      evento: evento as WebhookEventType,
      timestamp: new Date().toISOString(),
      dados: {
        sugestaoId,
        nomeProduto,
        ean: ean || 'N/A',
        fornecedor: data.fornecedor || 'Fornecedor Teste',
        cliente: data.cliente || 'Cliente Teste',
        telefoneCliente: data.telefoneCliente || '(11) 99999-9999',
        status: data.status || 'criado',
        urgencia: data.urgencia || 'media',
        dataAtualizacao: new Date().toISOString()
      }
    };
    
    // Log da ação
    console.log(`Disparando webhook de teste para ${url}:`, payload);
    
    // Enviar o webhook
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_token',
          'X-Source': 'webhook-test'
        },
        body: JSON.stringify(payload),
      });
      
      // Obter a resposta
      const responseData = await response.json();
      
      // Retornar o resultado
      return NextResponse.json({
        success: true,
        message: 'Webhook disparado com sucesso',
        statusCode: response.status,
        data: responseData
      });
    } catch (error) {
      console.error('Erro ao disparar webhook:', error);
      return NextResponse.json(
        { error: 'Error: Falha ao enviar webhook', details: error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Documentação da API via GET
export async function GET() {
  return NextResponse.json({
    message: 'API para teste de webhooks de sugestão',
    usage: {
      method: 'POST',
      contentType: 'application/json',
      body: {
        evento: 'Um dos eventos: sugestao_criada, sugestao_pedido_realizado, sugestao_produto_chegou',
        url: 'URL para onde o webhook será enviado',
        sugestaoId: 'ID da sugestão (obrigatório)',
        nomeProduto: 'Nome do produto (obrigatório)',
        ean: 'Código EAN do produto (opcional)',
        fornecedor: 'Nome do fornecedor (opcional)',
        cliente: 'Nome do cliente (opcional)',
        telefoneCliente: 'Telefone do cliente (opcional)',
        status: 'Status atual da sugestão (opcional)',
        urgencia: 'Nível de urgência da sugestão (opcional)'
      }
    },
    example: {
      evento: WebhookEventType.SUGESTAO_CRIADA,
      url: 'http://localhost:3000/api/webhooks/sugestoes',
      sugestaoId: '123',
      nomeProduto: 'Produto Teste',
      ean: '7891234567890'
    }
  });
} 