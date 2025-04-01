import { Check, X, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ProcessarLembretesResult } from "@/hooks/useLembretesMedicamentos";

interface AlertaProcessamentoLembretesProps {
  resultado: ProcessarLembretesResult;
  onClose: () => void;
}

export function AlertaProcessamentoLembretes({ 
  resultado, 
  onClose 
}: AlertaProcessamentoLembretesProps) {
  const { sucesso, mensagem, atualizacoes = [], erro } = resultado;
  
  return (
    <Alert 
      className={sucesso 
        ? "border-green-200 bg-green-50 text-green-900" 
        : "border-red-200 bg-red-50 text-red-900"
      }
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          {sucesso ? (
            <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
          )}
          
          <div>
            <AlertTitle className="text-base mb-1">
              {sucesso ? "Lembretes processados com sucesso" : "Falha ao processar lembretes"}
            </AlertTitle>
            
            <AlertDescription className="text-sm">
              <p>{mensagem}</p>
              
              {sucesso && atualizacoes.length > 0 && (
                <div className="mt-2 text-xs">
                  <p className="font-medium">Lembretes atualizados: {atualizacoes.length}</p>
                  <ul className="list-disc list-inside mt-1">
                    {atualizacoes.slice(0, 3).map((atualizacao, index) => (
                      <li key={index} className="ml-2">
                        Lembrete ID: {atualizacao.id} - 
                        Próximo: {atualizacao.proximoLembrete
                          ? new Date(atualizacao.proximoLembrete).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Finalizado'
                        }
                      </li>
                    ))}
                    {atualizacoes.length > 3 && (
                      <li className="ml-2">
                        E mais {atualizacoes.length - 3} lembretes...
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              {!sucesso && erro && (
                <p className="mt-1 text-xs font-medium text-red-700">{erro}</p>
              )}
            </AlertDescription>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Alert>
  );
} 