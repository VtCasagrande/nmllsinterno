'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Truck, Package, User, Clock } from 'lucide-react';

// Dados simulados para os motoristas
const MOTORISTAS_MOCK = [
  {
    id: 1,
    nome: 'João Silva',
    telefone: '(11) 98765-4321',
    status: 'ativo',
    ultimaAtualizacao: '2025-04-01T10:30:00',
    latitude: -23.550520,
    longitude: -46.633308,
    entregas: 3,
    rota: 'RT001',
    veiculo: 'Fiorino - ABC-1234',
  },
  {
    id: 2,
    nome: 'Maria Souza',
    telefone: '(11) 97654-3210',
    status: 'ativo',
    ultimaAtualizacao: '2025-04-01T10:28:00',
    latitude: -23.555520,
    longitude: -46.639308,
    entregas: 5,
    rota: 'RT002',
    veiculo: 'Van - DEF-5678',
  },
  {
    id: 3,
    nome: 'Pedro Santos',
    telefone: '(11) 96543-2109',
    status: 'inativo',
    ultimaAtualizacao: '2025-03-31T18:45:00',
    latitude: -23.540520,
    longitude: -46.630308,
    entregas: 0,
    rota: '',
    veiculo: 'Fiorino - GHI-9012',
  },
  {
    id: 4,
    nome: 'Ana Oliveira',
    telefone: '(11) 95432-1098',
    status: 'ativo',
    ultimaAtualizacao: '2025-04-01T10:15:00',
    latitude: -23.560520,
    longitude: -46.636308,
    entregas: 4,
    rota: 'RT004',
    veiculo: 'Van - JKL-3456',
  },
  {
    id: 5,
    nome: 'Carlos Ferreira',
    telefone: '(11) 94321-0987',
    status: 'ativo',
    ultimaAtualizacao: '2025-04-01T10:25:00',
    latitude: -23.545520,
    longitude: -46.635308,
    entregas: 2,
    rota: 'RT005',
    veiculo: 'Fiorino - MNO-7890',
  },
];

interface MotoristaCardProps {
  motorista: (typeof MOTORISTAS_MOCK)[0];
  onClick: () => void;
  isSelected: boolean;
}

function MotoristaCard({ motorista, onClick, isSelected }: MotoristaCardProps) {
  // Calcular tempo desde a última atualização
  const calcularTempoDesdeAtualizacao = (dataAtualizacao: string) => {
    const agora = new Date();
    const ultimaAtualizacao = new Date(dataAtualizacao);
    const diferencaMs = agora.getTime() - ultimaAtualizacao.getTime();
    const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));
    
    if (diferencaMinutos < 1) return 'Agora mesmo';
    if (diferencaMinutos === 1) return '1 minuto atrás';
    if (diferencaMinutos < 60) return `${diferencaMinutos} minutos atrás`;
    
    const diferencaHoras = Math.floor(diferencaMinutos / 60);
    if (diferencaHoras === 1) return '1 hora atrás';
    if (diferencaHoras < 24) return `${diferencaHoras} horas atrás`;
    
    const diferencaDias = Math.floor(diferencaHoras / 24);
    if (diferencaDias === 1) return '1 dia atrás';
    return `${diferencaDias} dias atrás`;
  };

  return (
    <div 
      className={`p-4 border rounded-lg ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} cursor-pointer hover:border-blue-300`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{motorista.nome}</h3>
          <p className="text-sm text-gray-500">{motorista.veiculo}</p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${motorista.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {motorista.status === 'ativo' ? 'Ativo' : 'Inativo'}
        </div>
      </div>
      
      <div className="mt-3 space-y-2">
        <div className="flex items-center text-sm">
          <Phone size={14} className="mr-2 text-gray-400" />
          <span>{motorista.telefone}</span>
        </div>
        
        {motorista.status === 'ativo' && (
          <>
            <div className="flex items-center text-sm">
              <Truck size={14} className="mr-2 text-gray-400" />
              <span>Rota: {motorista.rota}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <Package size={14} className="mr-2 text-gray-400" />
              <span>{motorista.entregas} entrega{motorista.entregas !== 1 ? 's' : ''}</span>
            </div>
          </>
        )}
        
        <div className="flex items-center text-sm">
          <Clock size={14} className="mr-2 text-gray-400" />
          <span>{calcularTempoDesdeAtualizacao(motorista.ultimaAtualizacao)}</span>
        </div>
      </div>
    </div>
  );
}

export default function RastreamentoPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedMotorista, setSelectedMotorista] = useState<(typeof MOTORISTAS_MOCK)[0] | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Filtragem dos motoristas
  const motoristasFiltrados = MOTORISTAS_MOCK.filter(motorista => {
    const matchesSearch = 
      motorista.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      motorista.veiculo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      motorista.rota.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'todos' || motorista.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Simular carregamento do mapa
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Selecionar primeiro motorista por padrão quando a lista é filtrada
  useEffect(() => {
    if (motoristasFiltrados.length > 0 && !selectedMotorista) {
      setSelectedMotorista(motoristasFiltrados[0]);
    } else if (motoristasFiltrados.length > 0 && !motoristasFiltrados.find(m => m.id === selectedMotorista?.id)) {
      setSelectedMotorista(motoristasFiltrados[0]);
    }
  }, [motoristasFiltrados, selectedMotorista]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rastreamento em Tempo Real</h1>
        <p className="text-gray-500 mt-1">Acompanhe a localização dos motoristas e suas entregas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel lateral de motoristas */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar motoristas..."
                className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="w-full py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="todos">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-medium">Motoristas ({motoristasFiltrados.length})</h2>
            </div>
            
            <div className="p-4 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              {motoristasFiltrados.length > 0 ? (
                motoristasFiltrados.map((motorista) => (
                  <MotoristaCard
                    key={motorista.id}
                    motorista={motorista}
                    onClick={() => setSelectedMotorista(motorista)}
                    isSelected={selectedMotorista?.id === motorista.id}
                  />
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  Nenhum motorista encontrado
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mapa e detalhes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mapa */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-medium">Localização em Tempo Real</h2>
              <div className="flex items-center text-sm text-gray-500">
                <Clock size={14} className="mr-1" />
                <span>Última atualização: agora mesmo</span>
              </div>
            </div>
            
            <div className="aspect-video w-full bg-gray-100 relative">
              {mapLoaded ? (
                <>
                  {/* Simulação de um mapa */}
                  <div className="absolute inset-0 bg-gray-200">
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-center p-6">
                        <MapPin size={48} className="mx-auto mb-2 text-blue-600" />
                        <p className="font-medium">Aqui seria exibido o mapa real</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {selectedMotorista ? (
                            <>
                              Motorista: {selectedMotorista.nome}
                              <br />
                              Coordenadas: {selectedMotorista.latitude}, {selectedMotorista.longitude}
                            </>
                          ) : (
                            'Selecione um motorista para ver sua localização'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-500">Carregando mapa...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detalhes do motorista selecionado */}
          {selectedMotorista && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="font-medium">Detalhes do Motorista</h2>
              </div>
              
              <div className="p-4">
                <div className="flex items-start">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                    <User size={24} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{selectedMotorista.nome}</h3>
                    <p className="text-gray-500">{selectedMotorista.veiculo}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Telefone</p>
                        <p className="font-medium">{selectedMotorista.telefone}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <div className="flex items-center">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${selectedMotorista.status === 'ativo' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                          <span>{selectedMotorista.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
                        </div>
                      </div>
                      
                      {selectedMotorista.status === 'ativo' && (
                        <>
                          <div>
                            <p className="text-sm text-gray-500">Rota Atual</p>
                            <p className="font-medium">{selectedMotorista.rota}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500">Entregas Pendentes</p>
                            <p className="font-medium">{selectedMotorista.entregas} entrega{selectedMotorista.entregas !== 1 ? 's' : ''}</p>
                          </div>
                        </>
                      )}
                      
                      <div>
                        <p className="text-sm text-gray-500">Última Atualização</p>
                        <p className="font-medium">{new Date(selectedMotorista.ultimaAtualizacao).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedMotorista.status === 'ativo' && (
                  <div className="mt-6">
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Próximas Entregas</h4>
                      
                      <div className="divide-y">
                        {Array.from({ length: selectedMotorista.entregas }, (_, i) => (
                          <div key={i} className="py-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium">Entrega #{i + 1}</p>
                              <p className="text-sm text-gray-500">Produto #{i + 101}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">Estimativa de chegada:</p>
                              <p className="text-sm font-medium">Em {15 + i * 10} min</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 