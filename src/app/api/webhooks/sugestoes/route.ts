import { NextResponse } from 'next/server';
import { WebhookEventType, SugestaoEventPayload } from '@/types/webhooks';

/**
 * API para receber webhooks de sugestões de compra
 * Esta API simula um serviço externo que recebe as notificações de eventos
 * relacionados a sugestões de compra.
 */
export async function POST(request: Request) {
  try {
    // Verificar autenticação (em produção, isso seria feito com um token)
    const authorization = request.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Token de acesso inválido ou ausente' },
        { status: 401 }
      );
    }

    // Obter o payload do webhook
    const payload: SugestaoEventPayload = await request.json();
    
    // Validar o tipo de evento
    if (!payload.evento || !Object.values(WebhookEventType).includes(payload.evento)) {
      return NextResponse.json(
        { error: 'Bad Request: Tipo de evento inválido' },
        { status: 400 }
      );
    }

    // Validar se é um evento de sugestão
    if (
      payload.evento !== WebhookEventType.SUGESTAO_CRIADA &&
      payload.evento !== WebhookEventType.SUGESTAO_PEDIDO_REALIZADO &&
      payload.evento !== WebhookEventType.SUGESTAO_PRODUTO_CHEGOU
    ) {
      return NextResponse.json(
        { error: 'Bad Request: Tipo de evento não é relacionado a sugestões' },
        { status: 400 }
      );
    }

    // Validar dados mínimos obrigatórios
    if (!payload.dados || !payload.dados.sugestaoId) {
      return NextResponse.json(
        { error: 'Bad Request: Dados inválidos ou ausentes' },
        { status: 400 }
      );
    }

    // Log da ação (simulado)
    console.log(`Webhook recebido: ${payload.evento}`, payload);

    // Em uma implementação real, aqui você processaria o webhook
    // Por exemplo, atualizando um sistema externo, enviando notificações, etc.
    
    let mensagem = '';
    switch (payload.evento) {
      case WebhookEventType.SUGESTAO_CRIADA:
        mensagem = `Nova sugestão de compra criada: ${payload.dados.nomeProduto} (${payload.dados.ean})`;
        break;
      case WebhookEventType.SUGESTAO_PEDIDO_REALIZADO:
        mensagem = `Pedido de sugestão de compra realizado: ${payload.dados.nomeProduto} (${payload.dados.ean})`;
        break;
      case WebhookEventType.SUGESTAO_PRODUTO_CHEGOU:
        mensagem = `Produto da sugestão de compra chegou: ${payload.dados.nomeProduto} (${payload.dados.ean})`;
        break;
    }

    // Retornar resposta de sucesso
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: `Webhook processado com sucesso: ${mensagem}`,
      data: {
        evento: payload.evento,
        sugestaoId: payload.dados.sugestaoId
      }
    });
  } catch (error) {
    console.error('Erro ao processar webhook de sugestão:', error);
    return NextResponse.json(
      { error: 'Internal Server Error: Erro ao processar webhook' },
      { status: 500 }
    );
  }
}

// Endpoint para verificar se a API está online (útil para testes)
export async function GET() {
  return NextResponse.json({
    status: 'online',
    message: 'API de webhooks de sugestões está funcionando',
    supportedEvents: [
      WebhookEventType.SUGESTAO_CRIADA,
      WebhookEventType.SUGESTAO_PEDIDO_REALIZADO,
      WebhookEventType.SUGESTAO_PRODUTO_CHEGOU
    ]
  });
} 