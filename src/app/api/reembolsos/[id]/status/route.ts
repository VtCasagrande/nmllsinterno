import { NextRequest, NextResponse } from 'next/server';
import { Reembolso, ReembolsoStatus } from '@/types/reembolsos';
import { auth } from '@/auth';

// Variável compartilhada para armazenar reembolsos em desenvolvimento
let reembolsos: Reembolso[] = [];

// Carregar reembolsos do localStorage se disponível no cliente
if (typeof window !== 'undefined') {
  try {
    const savedReembolsos = localStorage.getItem('reembolsos');
    if (savedReembolsos) {
      reembolsos = JSON.parse(savedReembolsos);
    }
  } catch (error) {
    console.error('Erro ao carregar reembolsos do localStorage:', error);
  }
}

// Função para enviar webhook de notificação
async function enviarWebhook(reembolso: Reembolso, tipoEvento: string) {
  try {
    // Em um ambiente real, seria uma URL externa
    const webhookUrl = process.env.WEBHOOK_URL || 'https://webhook.site/teste';
    
    const payload = {
      evento: tipoEvento,
      reembolsoId: reembolso.id,
      numeroPedido: reembolso.numeroPedidoTiny,
      status: reembolso.status,
      nomeCliente: reembolso.nomeCliente,
      dataAtualizacao: reembolso.dataAtualizacao,
      valorReembolso: reembolso.valorReembolso,
      urlComprovante: reembolso.urlComprovante || null
    };
    
    console.log(`Enviando webhook: ${tipoEvento}`, payload);
    
    // Em produção, descomentar o código abaixo
    /*
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao enviar webhook: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Webhook enviado com sucesso:', data);
    */
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar webhook:', error);
    return false;
  }
}

// PUT /api/reembolsos/[id]/status - Atualizar o status de um reembolso
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticação temporariamente desativada
    /*
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    */
    
    // Usuário simulado para desenvolvimento
    const mockUser = {
      email: 'usuario@teste.com'
    };
    
    const { id } = params;
    const formData = await request.formData();
    const statusStr = formData.get('status') as string;
    const comprovanteFile = formData.get('comprovante') as File | null;
    
    // Validar se o status é válido
    if (!statusStr || !Object.values(ReembolsoStatus).includes(statusStr as ReembolsoStatus)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Verificar se é necessário o comprovante para o status PAGO
    if (statusStr === ReembolsoStatus.PAGO && !comprovanteFile) {
      return NextResponse.json(
        { error: 'É necessário anexar um comprovante para marcar como PAGO' },
        { status: 400 }
      );
    }

    // Encontrar o reembolso pelo ID
    const reembolsoIndex = reembolsos.findIndex(reembolso => reembolso.id === id);
    
    if (reembolsoIndex === -1) {
      return NextResponse.json(
        { error: 'Reembolso não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se já existe um reembolso para o mesmo pedido
    if (reembolsos[reembolsoIndex].numeroPedidoTiny) {
      const duplicados = reembolsos.filter(
        r => r.id !== id && r.numeroPedidoTiny === reembolsos[reembolsoIndex].numeroPedidoTiny
      );
      
      if (duplicados.length > 0) {
        // Atualizar registros duplicados com as mesmas informações
        console.log(`Atualizando ${duplicados.length} reembolsos duplicados para o pedido ${reembolsos[reembolsoIndex].numeroPedidoTiny}`);
        
        // Registrar apenas no log, não realizar ação automática
      }
    }
    
    // Tratar o arquivo de comprovante se existir
    let urlComprovante = reembolsos[reembolsoIndex].urlComprovante;
    
    if (comprovanteFile) {
      // Em um ambiente real, esse arquivo seria enviado para um storage como S3 ou Azure Blob
      // Aqui estamos apenas simulando o processo
      const fileName = `comprovante_${id}_${Date.now()}.pdf`;
      
      // Simulação do upload
      console.log(`Upload de comprovante: ${fileName}, tamanho: ${comprovanteFile.size} bytes`);
      
      // URL simulada para o arquivo
      urlComprovante = `/uploads/comprovantes/${fileName}`;
    }
    
    // Atualizar o reembolso
    const reembolsoAtualizado: Reembolso = {
      ...reembolsos[reembolsoIndex],
      status: statusStr as ReembolsoStatus,
      dataAtualizacao: new Date().toISOString(),
      usuarioAtualizacao: mockUser.email,
      urlComprovante: urlComprovante
    };
    
    // Atualizar na lista
    reembolsos[reembolsoIndex] = reembolsoAtualizado;
    
    // Se estiver no cliente, salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('reembolsos', JSON.stringify(reembolsos));
    }
    
    // Enviar webhook para notificar sobre a alteração de status
    await enviarWebhook(reembolsoAtualizado, `reembolso_${statusStr.toLowerCase()}`);
    
    return NextResponse.json(reembolsoAtualizado, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar status do reembolso:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 