'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/contexts/CRMContext';
import { StatusCRM, AtendimentoCRM } from '@/types/crm';
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Importações do FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

// Tipagem para eventos do calendário
interface EventoCalendario {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    atendimentoId: string;
    clienteNome: string;
    motivo: string;
    status: StatusCRM;
    responsavelNome: string;
  };
}

// Interface para o formulário rápido de evento
interface QuickFormData {
  cliente: string;
  motivo: string;
  responsavelId: string;
  dataProximoContato: string;
}

export default function CalendarioPage() {
  const router = useRouter();
  const { 
    atendimentos, 
    loading, 
    atualizarAtendimento,
    adicionarAtendimento,
    usuariosDisponiveis 
  } = useCRM();
  
  const calendarRef = useRef<any>(null);
  const [visao, setVisao] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [dataAtual, setDataAtual] = useState(new Date());
  
  // Estado para o formulário rápido
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [quickFormPosition, setQuickFormPosition] = useState({ top: 0, left: 0 });
  const [quickFormData, setQuickFormData] = useState<QuickFormData>({
    cliente: '',
    motivo: '',
    responsavelId: '',
    dataProximoContato: ''
  });
  const [quickFormErrors, setQuickFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Função para mapear status para cores
  const obterCoresPorStatus = (status: StatusCRM) => {
    switch (status) {
      case StatusCRM.EM_ABERTO:
        return { bg: '#FEEBC8', border: '#ED8936', text: '#744210' }; // Laranja - Tons do Tailwind amber
      case StatusCRM.EM_MONITORAMENTO:
        return { bg: '#BEE3F8', border: '#3182CE', text: '#2A4365' }; // Azul - Tons do Tailwind blue
      case StatusCRM.FINALIZADO:
        return { bg: '#C6F6D5', border: '#38A169', text: '#22543D' }; // Verde - Tons do Tailwind green
      default:
        return { bg: '#E2E8F0', border: '#718096', text: '#2D3748' }; // Cinza - Tons do Tailwind gray
    }
  };
  
  // Função para converter atendimentos em eventos do calendário
  const converterAtendimentosParaEventos = useCallback(() => {
    const eventosCalendario: EventoCalendario[] = [];
    
    atendimentos.forEach(atendimento => {
      if (atendimento.dataProximoContato) {
        const cores = obterCoresPorStatus(atendimento.status);
        
        eventosCalendario.push({
          id: atendimento.id,
          title: `${atendimento.cliente.nome} - ${atendimento.motivo}`,
          start: atendimento.dataProximoContato,
          allDay: true,
          backgroundColor: cores.bg,
          borderColor: cores.border,
          textColor: cores.text,
          extendedProps: {
            atendimentoId: atendimento.id,
            clienteNome: atendimento.cliente.nome,
            motivo: atendimento.motivo,
            status: atendimento.status,
            responsavelNome: atendimento.responsavel.nome
          }
        });
      }
    });
    
    return eventosCalendario;
  }, [atendimentos]);
  
  // Atualizar eventos quando atendimentos mudarem
  useEffect(() => {
    if (!loading) {
      const novosEventos = converterAtendimentosParaEventos();
      setEventos(novosEventos);
    }
  }, [atendimentos, loading, converterAtendimentosParaEventos]);

  // Atualizar visualização quando mudar o tipo de visão
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(visao);
      
      // Atualizar a data no título
      setDataAtual(calendarApi.getDate());
    }
  }, [visao]);
  
  // Manipulador de clique em evento
  const handleEventClick = (info: any) => {
    const atendimentoId = info.event.extendedProps.atendimentoId;
    router.push(`/dashboard/crm/${atendimentoId}`);
  };
  
  // Manipulador de arraste de evento
  const handleEventDrop = async (info: any) => {
    const atendimentoId = info.event.extendedProps.atendimentoId;
    const novaData = info.event.start.toISOString();
    
    const atendimento = atendimentos.find(a => a.id === atendimentoId);
    
    if (atendimento) {
      try {
        await atualizarAtendimento(
          atendimentoId,
          {
            ...atendimento,
            dataProximoContato: novaData
          },
          `Data de contato atualizada para ${format(new Date(novaData), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
        );
      } catch (error) {
        // Reverter a mudança no frontend se houver erro
        info.revert();
      }
    }
  };
  
  // Manipulador de clique em data
  const handleDateClick = (info: any) => {
    // Abrir o formulário rápido na posição do clique
    const rect = info.jsEvent.target.getBoundingClientRect();
    
    setQuickFormPosition({
      top: info.jsEvent.clientY,
      left: info.jsEvent.clientX
    });
    
    setQuickFormData({
      ...quickFormData,
      dataProximoContato: info.dateStr
    });
    
    setShowQuickForm(true);
  };
  
  // Manipulador de submissão do formulário rápido
  const handleQuickFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulário
    const errors: Record<string, string> = {};
    if (!quickFormData.cliente.trim()) {
      errors.cliente = 'O nome do cliente é obrigatório';
    }
    if (!quickFormData.motivo.trim()) {
      errors.motivo = 'O motivo do atendimento é obrigatório';
    }
    if (!quickFormData.responsavelId) {
      errors.responsavelId = 'Selecione um responsável';
    }
    
    if (Object.keys(errors).length > 0) {
      setQuickFormErrors(errors);
      return;
    }
    
    setQuickFormErrors({});
    setIsSubmitting(true);
    
    try {
      // Obter o nome do responsável selecionado
      const responsavelSelecionado = usuariosDisponiveis.find(
        u => u.id === quickFormData.responsavelId
      );
      
      if (!responsavelSelecionado) {
        throw new Error('Responsável não encontrado');
      }
      
      // Criar novo atendimento
      const novoAtendimento = {
        data: new Date().toISOString(),
        cliente: {
          id: Date.now().toString(),
          nome: quickFormData.cliente,
          cpf: '',
          telefone: ''
        },
        motivo: quickFormData.motivo,
        responsavel: {
          id: quickFormData.responsavelId,
          nome: responsavelSelecionado.nome
        },
        status: StatusCRM.EM_MONITORAMENTO,
        dataProximoContato: new Date(quickFormData.dataProximoContato).toISOString()
      };
      
      await adicionarAtendimento(novoAtendimento);
      
      // Fechar formulário e redefinir dados
      setShowQuickForm(false);
      setQuickFormData({
        cliente: '',
        motivo: '',
        responsavelId: '',
        dataProximoContato: ''
      });
      setIsSubmitting(false);
      
    } catch (error) {
      console.error('Erro ao adicionar atendimento rápido:', error);
      setIsSubmitting(false);
    }
  };
  
  // Função para formatar titulo da visão atual
  const formatarTituloVisao = () => {
    try {
      switch (visao) {
        case 'dayGridMonth':
          return format(dataAtual, "MMMM 'de' yyyy", { locale: ptBR });
        case 'timeGridWeek': {
          // Encontrar o primeiro e último dia da semana
          const inicioSemana = new Date(dataAtual);
          inicioSemana.setDate(dataAtual.getDate() - dataAtual.getDay() + 1); // começar da segunda
          
          const fimSemana = new Date(inicioSemana);
          fimSemana.setDate(inicioSemana.getDate() + 6);
          
          return `${format(inicioSemana, "dd 'de' MMM", { locale: ptBR })} - ${format(fimSemana, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`;
        }
        case 'timeGridDay':
          return format(dataAtual, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        default:
          return '';
      }
    } catch (error) {
      console.error('Erro ao formatar título:', error);
      return 'Calendário';
    }
  };
  
  // Funções para navegação no calendário
  const handlePrev = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
      setDataAtual(calendarApi.getDate());
    }
  };
  
  const handleNext = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
      setDataAtual(calendarApi.getDate());
    }
  };
  
  const handleToday = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
      setDataAtual(calendarApi.getDate());
    }
  };

  // Handler para mudança de datas no calendário
  const handleDatesSet = (info: any) => {
    setDataAtual(info.view.currentStart);
  };

  return (
    <div className="space-y-6 px-0 sm:px-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/crm"
          className="inline-flex items-center justify-center p-2 text-gray-600 bg-white rounded-md hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold">Calendário de Atendimentos</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <button onClick={handlePrev} className="p-1 rounded hover:bg-gray-100">
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={handleToday}
              className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
            >
              Hoje
            </button>
            <button onClick={handleNext} className="p-1 rounded hover:bg-gray-100">
              <ChevronRight size={20} />
            </button>
            <CalendarIcon className="h-5 w-5 text-gray-600 ml-2" />
            <span className="text-lg font-medium">{formatarTituloVisao()}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setVisao('dayGridMonth')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                visao === 'dayGridMonth'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setVisao('timeGridWeek')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                visao === 'timeGridWeek'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setVisao('timeGridDay')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                visao === 'timeGridDay'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Dia
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando eventos...</p>
            </div>
          </div>
        ) : (
          <div className="h-[700px]">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={visao}
              locale={ptBrLocale}
              headerToolbar={false}
              events={eventos}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              dateClick={handleDateClick}
              editable={true}
              selectable={true}
              dayMaxEvents={true}
              height="100%"
              allDaySlot={true}
              slotMinTime="08:00:00"
              slotMaxTime="18:00:00"
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5], // Segunda a sexta
                startTime: '08:00',
                endTime: '18:00',
              }}
              weekends={true}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                omitZeroMinute: false,
                meridiem: false
              }}
              dayHeaderFormat={{
                weekday: 'short',
                day: 'numeric',
                omitCommas: true
              }}
              datesSet={handleDatesSet}
              firstDay={1} // Semana começa na segunda-feira
            />
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-medium mb-4">Legenda</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-amber-200 border border-amber-500 mr-2"></div>
            <span className="text-sm">Em Aberto</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-200 border border-blue-500 mr-2"></div>
            <span className="text-sm">Em Monitoramento</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-green-200 border border-green-500 mr-2"></div>
            <span className="text-sm">Finalizado</span>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            <strong>Dicas:</strong>
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
            <li>Arraste e solte os eventos para alterar a data de próximo contato.</li>
            <li>Clique em uma data para adicionar rapidamente um novo atendimento.</li>
            <li>Clique em um evento para ver os detalhes completos do atendimento.</li>
          </ul>
        </div>
      </div>
      
      {/* Modal de formulário rápido */}
      {showQuickForm && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains('fixed')) {
              setShowQuickForm(false);
            }
          }}
        >
          <div 
            className="absolute bg-white rounded-lg shadow-xl border p-4 w-80"
            style={{
              top: `${quickFormPosition.top}px`,
              left: `${quickFormPosition.left}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Novo Atendimento</h3>
              <button 
                onClick={() => setShowQuickForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleQuickFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente*
                </label>
                <input
                  id="cliente"
                  type="text"
                  value={quickFormData.cliente}
                  onChange={(e) => setQuickFormData({...quickFormData, cliente: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do cliente"
                />
                {quickFormErrors.cliente && (
                  <p className="mt-1 text-xs text-red-600">{quickFormErrors.cliente}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo*
                </label>
                <input
                  id="motivo"
                  type="text"
                  value={quickFormData.motivo}
                  onChange={(e) => setQuickFormData({...quickFormData, motivo: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Motivo do atendimento"
                />
                {quickFormErrors.motivo && (
                  <p className="mt-1 text-xs text-red-600">{quickFormErrors.motivo}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="responsavel" className="block text-sm font-medium text-gray-700 mb-1">
                  Responsável*
                </label>
                <select
                  id="responsavel"
                  value={quickFormData.responsavelId}
                  onChange={(e) => setQuickFormData({...quickFormData, responsavelId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um responsável</option>
                  {usuariosDisponiveis.map((user) => (
                    <option key={user.id} value={user.id}>{user.nome}</option>
                  ))}
                </select>
                {quickFormErrors.responsavelId && (
                  <p className="mt-1 text-xs text-red-600">{quickFormErrors.responsavelId}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="dataContato" className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Contato
                </label>
                <input
                  id="dataContato"
                  type="date"
                  value={quickFormData.dataProximoContato}
                  onChange={(e) => setQuickFormData({...quickFormData, dataProximoContato: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
              
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Salvando...'
                  ) : (
                    <>
                      <Plus size={16} className="mr-2" />
                      Adicionar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 